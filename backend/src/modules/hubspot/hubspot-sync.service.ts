import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import { HubspotService } from './hubspot.service';
import {
  HubspotDealRaw,
  OwnerInfo,
  PipelineSnapshotUpsert,
  SyncResultDto,
  TARGET_STAGE_PREFIXES,
  normalizeHubspotRegion,
  normalizeHubspotVertical,
  normalizeHubspotSegment,
} from './dto';

@Injectable()
export class HubspotSyncService {
  private readonly logger = new Logger(HubspotSyncService.name);
  private syncRunning = false;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly hubspot: HubspotService,
  ) {}

  private get syncEnabled(): boolean {
    return (
      this.config.get<boolean>('hubspot.syncEnabled') !== false &&
      !!this.config.get<string>('hubspot.apiToken') &&
      this.prisma.isConnected
    );
  }

  /**
   * CRON Job 1: Current Month Pipeline Snapshot — runs daily at 2 AM
   */
  @Cron('0 2 * * *')
  async cronCurrentMonthSync(): Promise<void> {
    if (!this.syncEnabled) {
      this.logger.debug('HubSpot sync disabled or not configured, skipping');
      return;
    }
    await this.syncCurrentMonth();
  }

  /**
   * CRON Job 2: Historical Stage Update — runs daily at 3 AM
   */
  @Cron('0 3 * * *')
  async cronHistoricalStageUpdate(): Promise<void> {
    if (!this.syncEnabled) {
      this.logger.debug('HubSpot sync disabled or not configured, skipping');
      return;
    }
    await this.updateHistoricalStages();
  }

  /**
   * Sync current month pipeline snapshot from HubSpot
   */
  async syncCurrentMonth(): Promise<SyncResultDto> {
    const startTime = Date.now();
    const result: SyncResultDto = {
      syncType: 'current_month',
      status: 'running',
      recordsFetched: 0,
      recordsUpserted: 0,
      recordsUpdated: 0,
      recordsFailed: 0,
      durationMs: 0,
    };

    if (this.syncRunning) {
      result.status = 'skipped';
      result.errorMessage = 'Another sync is already running';
      result.durationMs = Date.now() - startTime;
      return result;
    }

    this.syncRunning = true;
    let syncLog: { id: string } | null = null;

    try {
      // Create sync log
      syncLog = await this.prisma.hubspotSyncLog.create({
        data: { syncType: 'current_month', status: 'running' },
      });

      // 1. Refresh caches
      const stageMap = await this.hubspot.fetchPipelineStages();
      const ownerMap = await this.hubspot.fetchOwners();

      // 2. Fetch all deals
      const deals = await this.hubspot.fetchAllDeals();
      result.recordsFetched = deals.length;

      // 3. Resolve company names
      const companyIds = this.extractCompanyIds(deals);
      const companyNames = await this.hubspot.resolveCompanyNames(companyIds);

      // 4. Filter to target stages and transform
      const snapshotMonth = this.firstOfCurrentMonth();
      const upserts: PipelineSnapshotUpsert[] = [];

      for (const deal of deals) {
        const stageId = deal.properties.dealstage || '';
        const stageLabel = stageMap.get(stageId) || stageId;

        // Filter: only target stages
        if (!TARGET_STAGE_PREFIXES.some((p) => stageLabel.startsWith(p))) {
          continue;
        }

        const transformed = this.transformDeal(
          deal,
          snapshotMonth,
          stageLabel,
          stageId,
          ownerMap,
          companyNames,
        );
        upserts.push(transformed);
      }

      this.logger.log(
        `Filtered ${upserts.length} deals in target stages (out of ${deals.length} total)`,
      );

      // 5. Batch upsert (50 per transaction)
      for (let i = 0; i < upserts.length; i += 50) {
        const batch = upserts.slice(i, i + 50);
        try {
          await this.prisma.$transaction(
            batch.map((u) =>
              this.prisma.pipelineSnapshot.upsert({
                where: {
                  uq_snapshot_deal: {
                    snapshotMonth: u.snapshotMonth,
                    hubspotDealId: u.hubspotDealId,
                  },
                },
                update: {
                  dealName: u.dealName,
                  customerName: u.customerName,
                  dealValue: u.dealValue,
                  licenseAcv: u.licenseAcv,
                  implementationValue: u.implementationValue,
                  logoType: u.logoType,
                  dealStage: u.dealStage,
                  currentStage: u.currentStage,
                  probability: u.probability,
                  expectedCloseDate: u.expectedCloseDate,
                  region: u.region,
                  vertical: u.vertical,
                  segment: u.segment,
                  productSubCategory: u.productSubCategory,
                  salesRep: u.salesRep,
                  ownerSalesTeam: u.ownerSalesTeam,
                  hubspotOwnerId: u.hubspotOwnerId,
                  rawDealStageId: u.rawDealStageId,
                },
                create: {
                  snapshotMonth: u.snapshotMonth,
                  hubspotDealId: u.hubspotDealId,
                  dealName: u.dealName,
                  customerName: u.customerName,
                  dealValue: u.dealValue,
                  licenseAcv: u.licenseAcv,
                  implementationValue: u.implementationValue,
                  logoType: u.logoType,
                  dealStage: u.dealStage,
                  currentStage: u.currentStage,
                  probability: u.probability,
                  expectedCloseDate: u.expectedCloseDate,
                  region: u.region,
                  vertical: u.vertical,
                  segment: u.segment,
                  productSubCategory: u.productSubCategory,
                  salesRep: u.salesRep,
                  ownerSalesTeam: u.ownerSalesTeam,
                  createdDate: u.createdDate,
                  hubspotOwnerId: u.hubspotOwnerId,
                  rawDealStageId: u.rawDealStageId,
                  source: u.source,
                },
              }),
            ),
          );
          result.recordsUpserted += batch.length;
        } catch (err) {
          this.logger.error(
            `Failed to upsert batch at offset ${i}: ${err.message}`,
          );
          result.recordsFailed += batch.length;
        }
      }

      result.status = 'completed';
      result.durationMs = Date.now() - startTime;

      // Update sync log
      await this.prisma.hubspotSyncLog.update({
        where: { id: syncLog.id },
        data: {
          status: 'completed',
          completedAt: new Date(),
          recordsFetched: result.recordsFetched,
          recordsUpserted: result.recordsUpserted,
          recordsFailed: result.recordsFailed,
        },
      });

      this.logger.log(
        `Current month sync completed: ${result.recordsUpserted} upserted, ${result.recordsFailed} failed (${result.durationMs}ms)`,
      );
    } catch (err) {
      result.status = 'failed';
      result.errorMessage = err.message;
      result.durationMs = Date.now() - startTime;
      this.logger.error(`Current month sync failed: ${err.message}`);

      if (syncLog) {
        await this.prisma.hubspotSyncLog
          .update({
            where: { id: syncLog.id },
            data: {
              status: 'failed',
              completedAt: new Date(),
              errorMessage: err.message,
            },
          })
          .catch(() => {});
      }
    } finally {
      this.syncRunning = false;
    }

    return result;
  }

  /**
   * Update current_stage across ALL historical snapshots from HubSpot
   */
  async updateHistoricalStages(): Promise<SyncResultDto> {
    const startTime = Date.now();
    const result: SyncResultDto = {
      syncType: 'historical_stage_update',
      status: 'running',
      recordsFetched: 0,
      recordsUpserted: 0,
      recordsUpdated: 0,
      recordsFailed: 0,
      durationMs: 0,
    };

    let syncLog: { id: string } | null = null;

    try {
      syncLog = await this.prisma.hubspotSyncLog.create({
        data: { syncType: 'historical_stage_update', status: 'running' },
      });

      // 1. Get all distinct hubspot deal IDs from snapshots
      const distinctDeals = await this.prisma.pipelineSnapshot.findMany({
        distinct: ['hubspotDealId'],
        select: { hubspotDealId: true },
      });

      const dealIds = distinctDeals.map((d) => d.hubspotDealId);
      result.recordsFetched = dealIds.length;
      this.logger.log(
        `Found ${dealIds.length} distinct deals to update stages for`,
      );

      // 2. Refresh stage map
      const stageMap = await this.hubspot.fetchPipelineStages();

      // 3. Batch-fetch current stages from HubSpot
      const currentStages = await this.hubspot.fetchDealStagesBatch(dealIds);

      // 4. Update each deal's current_stage across all snapshots
      for (const [dealId, stageId] of currentStages.entries()) {
        const stageLabel = stageMap.get(stageId) || stageId;
        try {
          const updated = await this.prisma.pipelineSnapshot.updateMany({
            where: { hubspotDealId: dealId },
            data: { currentStage: stageLabel },
          });
          result.recordsUpdated += updated.count;
        } catch (err) {
          this.logger.error(
            `Failed to update stage for deal ${dealId}: ${err.message}`,
          );
          result.recordsFailed++;
        }
      }

      result.status = 'completed';
      result.durationMs = Date.now() - startTime;

      await this.prisma.hubspotSyncLog.update({
        where: { id: syncLog.id },
        data: {
          status: 'completed',
          completedAt: new Date(),
          recordsFetched: result.recordsFetched,
          recordsUpdated: result.recordsUpdated,
          recordsFailed: result.recordsFailed,
        },
      });

      this.logger.log(
        `Historical stage update completed: ${result.recordsUpdated} rows updated across ${currentStages.size} deals (${result.durationMs}ms)`,
      );
    } catch (err) {
      result.status = 'failed';
      result.errorMessage = err.message;
      result.durationMs = Date.now() - startTime;
      this.logger.error(`Historical stage update failed: ${err.message}`);

      if (syncLog) {
        await this.prisma.hubspotSyncLog
          .update({
            where: { id: syncLog.id },
            data: {
              status: 'failed',
              completedAt: new Date(),
              errorMessage: err.message,
            },
          })
          .catch(() => {});
      }
    }

    return result;
  }

  /**
   * Check if a sync is currently running
   */
  isSyncRunning(): boolean {
    return this.syncRunning;
  }

  /**
   * Get recent sync logs
   */
  async getSyncLogs(limit = 20) {
    return this.prisma.hubspotSyncLog.findMany({
      orderBy: { startedAt: 'desc' },
      take: limit,
    });
  }

  // ── Private helpers ──────────────────────────────────────────

  private firstOfCurrentMonth(): Date {
    const now = new Date();
    return new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
  }

  private extractCompanyIds(deals: HubspotDealRaw[]): string[] {
    const ids: string[] = [];
    for (const deal of deals) {
      const companies = deal.associations?.companies?.results;
      if (companies?.length) {
        ids.push(companies[0].id);
      }
    }
    return ids;
  }

  private transformDeal(
    deal: HubspotDealRaw,
    snapshotMonth: Date,
    stageLabel: string,
    stageId: string,
    ownerMap: Map<string, OwnerInfo>,
    companyNames: Map<string, string>,
  ): PipelineSnapshotUpsert {
    const props = deal.properties;

    // HubSpot returns probability as a 0-1 decimal (e.g. 0.15 = 15%)
    const rawProb = parseFloat(props.hs_deal_stage_probability || '0');
    // Convert to percentage for storage (matching CSV format: 15, 30, 50, etc.)
    const probability = Math.round(rawProb * 100);
    const probFactor = rawProb; // Already 0-1 range

    const totalAcv = parseFloat(props.total_acv || '0');
    const licenseFees = parseFloat(props.technology_license_fees1 || '0');
    const implFees = parseFloat(props.technology_implementation_fees || '0');

    // Deal value: use totalAcv if available, otherwise sum of fees
    const rawDealValue = totalAcv > 0 ? totalAcv : licenseFees + implFees;

    // Customer name from company association
    let customerName = '';
    const companyAssoc = deal.associations?.companies?.results;
    if (companyAssoc?.length) {
      customerName = companyNames.get(companyAssoc[0].id) || '';
    }

    // Sales rep and team from owner
    const ownerId = props.hubspot_owner_id || null;
    const ownerInfo = ownerId ? ownerMap.get(ownerId) : null;
    const salesRep = ownerInfo?.name || null;
    const ownerSalesTeam = ownerInfo?.primaryTeam || null;

    return {
      snapshotMonth,
      hubspotDealId: deal.id,
      dealName: props.dealname || '',
      customerName,
      dealValue: Math.round(rawDealValue * probFactor * 100) / 100,
      licenseAcv: Math.round(licenseFees * probFactor * 100) / 100,
      implementationValue: Math.round(implFees * probFactor * 100) / 100,
      logoType: props.existing_business__c || null,
      dealStage: stageLabel,
      currentStage: stageLabel,
      probability,
      expectedCloseDate: props.closedate ? new Date(props.closedate) : null,
      region: normalizeHubspotRegion(props.continent__c),
      vertical: normalizeHubspotVertical(props.gep_priority_vertical_),
      segment: normalizeHubspotSegment(props.opportunity_segment_software__c),
      productSubCategory: props.sub_cato__c || null,
      salesRep,
      ownerSalesTeam,
      createdDate: props.created_date__c
        ? new Date(props.created_date__c)
        : props.createdate
          ? new Date(props.createdate)
          : null,
      hubspotOwnerId: ownerId,
      rawDealStageId: stageId,
      source: 'hubspot',
    };
  }
}
