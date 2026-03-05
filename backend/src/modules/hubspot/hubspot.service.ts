import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import {
  HubspotDealRaw,
  HubspotDealSearchResponse,
  HubspotPipeline,
  HubspotOwner,
  OwnerInfo,
  DEAL_PROPERTIES,
} from './dto';

@Injectable()
export class HubspotService {
  private readonly logger = new Logger(HubspotService.name);
  private readonly baseUrl: string;
  private readonly token: string;

  // Rate limiter: track request timestamps
  private requestTimestamps: number[] = [];
  private readonly maxRequestsPer10s = 90;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.baseUrl =
      this.config.get<string>('hubspot.baseUrl') || 'https://api.hubapi.com';
    this.token = this.config.get<string>('hubspot.apiToken') || '';
  }

  private get headers() {
    return {
      Authorization: `Bearer ${this.token}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Internal rate limiter: pause if approaching HubSpot API rate limit
   */
  private async rateLimit(): Promise<void> {
    const now = Date.now();
    this.requestTimestamps = this.requestTimestamps.filter(
      (t) => now - t < 10_000,
    );
    if (this.requestTimestamps.length >= this.maxRequestsPer10s) {
      const oldestInWindow = this.requestTimestamps[0];
      const waitMs = 10_000 - (now - oldestInWindow) + 100;
      this.logger.warn(`Rate limit approaching, waiting ${waitMs}ms`);
      await new Promise((resolve) => setTimeout(resolve, waitMs));
    }
    this.requestTimestamps.push(Date.now());
  }

  private async fetchJson<T>(
    path: string,
    options?: { method?: string; body?: unknown },
  ): Promise<T> {
    await this.rateLimit();
    const url = `${this.baseUrl}${path}`;
    const method = options?.method || 'GET';

    const fetchOptions: RequestInit = {
      method,
      headers: this.headers,
    };
    if (options?.body) {
      fetchOptions.body = JSON.stringify(options.body);
    }

    const res = await fetch(url, fetchOptions);
    if (!res.ok) {
      const body = await res.text();
      throw new Error(
        `HubSpot API ${method} ${path} → ${res.status}: ${body}`,
      );
    }
    return res.json() as Promise<T>;
  }

  /**
   * Fetch pipeline stages, persist to HubspotStageMapping, return Map<stageId, stageLabel>
   */
  async fetchPipelineStages(): Promise<Map<string, string>> {
    this.logger.log('Fetching deal pipeline stages...');
    const data = await this.fetchJson<{ results: HubspotPipeline[] }>(
      '/crm/v3/pipelines/deals',
    );

    const stageMap = new Map<string, string>();

    for (const pipeline of data.results) {
      for (const stage of pipeline.stages) {
        stageMap.set(stage.id, stage.label);

        if (this.prisma.isConnected) {
          await this.prisma.hubspotStageMapping.upsert({
            where: {
              pipelineId_stageId: {
                pipelineId: pipeline.id,
                stageId: stage.id,
              },
            },
            update: {
              stageLabel: stage.label,
              probability: stage.metadata.probability
                ? parseFloat(stage.metadata.probability)
                : null,
            },
            create: {
              pipelineId: pipeline.id,
              stageId: stage.id,
              stageLabel: stage.label,
              probability: stage.metadata.probability
                ? parseFloat(stage.metadata.probability)
                : null,
            },
          });
        }
      }
    }

    this.logger.log(`Fetched ${stageMap.size} pipeline stages`);
    return stageMap;
  }

  /**
   * Fetch owners, return Map<ownerId, OwnerInfo> with name and primary team
   */
  async fetchOwners(): Promise<Map<string, OwnerInfo>> {
    this.logger.log('Fetching HubSpot owners...');
    const ownerMap = new Map<string, OwnerInfo>();
    let after: string | undefined;

    do {
      const params = new URLSearchParams({ limit: '100' });
      if (after) params.set('after', after);

      const data = await this.fetchJson<{
        results: HubspotOwner[];
        paging?: { next?: { after: string } };
      }>(`/crm/v3/owners?${params}`);

      for (const owner of data.results) {
        const name =
          `${owner.firstName || ''} ${owner.lastName || ''}`.trim();
        const primaryTeam =
          owner.teams?.find((t) => t.primary)?.name ||
          owner.teams?.[0]?.name ||
          null;
        ownerMap.set(owner.id, {
          name: name || owner.email,
          primaryTeam,
        });
      }

      after = data.paging?.next?.after;
    } while (after);

    this.logger.log(`Fetched ${ownerMap.size} owners`);
    return ownerMap;
  }

  /**
   * Fetch all deals with pagination, including company associations
   */
  async fetchAllDeals(): Promise<HubspotDealRaw[]> {
    this.logger.log('Fetching all deals from HubSpot...');
    const allDeals: HubspotDealRaw[] = [];
    let after: string | undefined;

    do {
      const params = new URLSearchParams({
        limit: '100',
        properties: DEAL_PROPERTIES.join(','),
        associations: 'companies',
      });
      if (after) params.set('after', after);

      const data = await this.fetchJson<HubspotDealSearchResponse>(
        `/crm/v3/objects/deals?${params}`,
      );

      allDeals.push(...data.results);
      after = data.paging?.next?.after;

      this.logger.debug(
        `Fetched ${allDeals.length} deals so far (page after=${after || 'none'})`,
      );
    } while (after);

    this.logger.log(`Fetched ${allDeals.length} total deals`);
    return allDeals;
  }

  /**
   * Resolve company IDs to names via batch read
   */
  async resolveCompanyNames(
    companyIds: string[],
  ): Promise<Map<string, string>> {
    const nameMap = new Map<string, string>();
    if (companyIds.length === 0) return nameMap;

    const uniqueIds = [...new Set(companyIds)];

    for (let i = 0; i < uniqueIds.length; i += 100) {
      const batch = uniqueIds.slice(i, i + 100);
      const data = await this.fetchJson<{
        results: Array<{ id: string; properties: { name?: string } }>;
      }>('/crm/v3/objects/companies/batch/read', {
        method: 'POST',
        body: {
          inputs: batch.map((id) => ({ id })),
          properties: ['name'],
        },
      });

      for (const company of data.results) {
        if (company.properties.name) {
          nameMap.set(company.id, company.properties.name);
        }
      }
    }

    this.logger.log(`Resolved ${nameMap.size} company names`);
    return nameMap;
  }

  /**
   * Batch-fetch current dealstage for a list of deal IDs.
   * Returns Map<dealId, stageId>
   */
  async fetchDealStagesBatch(
    dealIds: string[],
  ): Promise<Map<string, string>> {
    const stageMap = new Map<string, string>();
    if (dealIds.length === 0) return stageMap;

    for (let i = 0; i < dealIds.length; i += 100) {
      const batch = dealIds.slice(i, i + 100);

      try {
        const data = await this.fetchJson<{
          results: Array<{
            id: string;
            properties: { dealstage?: string };
          }>;
        }>('/crm/v3/objects/deals/batch/read', {
          method: 'POST',
          body: {
            inputs: batch.map((id) => ({ id })),
            properties: ['dealstage'],
          },
        });

        for (const deal of data.results) {
          if (deal.properties.dealstage) {
            stageMap.set(deal.id, deal.properties.dealstage);
          }
        }
      } catch (err) {
        this.logger.error(
          `Failed to batch-read deal stages (batch offset ${i}): ${err.message}`,
        );
      }
    }

    return stageMap;
  }
}
