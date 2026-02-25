import { Injectable } from '@nestjs/common';
import { DataService } from '../../data/data.service';
import {
  ClosedAcvRecord,
  PipelineSnapshotRecord,
  SalesTeamRecord,
  SOWMappingRecord,
  ARRSubCategoryRecord,
  ProductCategoryMappingRecord,
} from '../../data/dto';
import { SalesFilterDto } from '../dto/filters.dto';

// ── Internal types ──

interface Opportunity {
  id: string;
  name: string;
  accountName: string;
  region: string;
  vertical: string;
  segment: string;
  stage: string;
  probability: number;
  dealValue: number;
  licenseValue: number;
  implementationValue: number;
  weightedValue: number;
  expectedCloseDate: string;
  daysInStage: number;
  owner: string;
  status: 'Active' | 'Won' | 'Lost' | 'Stalled';
  logoType: string;
  salesCycleDays: number;
  createdDate: string;
  closedACV: number;
  soldBy: string;
  sowId?: string;
  productSubCategory?: string;
  productCategory?: string;
  subCategoryBreakdown?: Array<{ subCategory: string; category: string; pct: number; value: number }>;
  pipelineSubCategoryBreakdown?: Array<{ subCategory: string; pct: number }>;
  revenueType?: string;
}

interface Salesperson {
  id: string;
  name: string;
  region: string;
  isManager: boolean;
  managerId?: string;
  level: number;
  previousYearClosed: number;
  closedYTD: number;
  forecast: number;
  pipelineValue: number;
  unweightedPipeline: number;
  monthlyAttainment: number[];
  quota: number;
  pipelineCoverage: number;
  forecastAttainment: number;
}

// ── Helpers ──

const REGIONS = ['North America', 'Europe', 'LATAM', 'Middle East', 'APAC'];
const LICENSE_ACV_LOGO_TYPES = ['New Logo', 'Upsell', 'Cross-Sell'];
const RENEWAL_LOGO_TYPES = ['Extension', 'Renewal'];

function normalizeRegion(raw: string): string {
  const map: Record<string, string> = {
    NA: 'North America',
    EU: 'Europe',
    ME: 'Middle East',
    APAC: 'APAC',
    LA: 'LATAM',
    LATAM: 'LATAM',
    Global: 'Global',
  };
  return map[raw?.trim()] || raw?.trim() || '';
}

function parseDateLocal(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d || 1);
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// ── Colors for waterfall (same as frontend) ──
const COLORS = {
  primary: '#3b82f6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  purple: '#8b5cf6',
  gray: '#6b7280',
};

@Injectable()
export class SalesComputeService {
  constructor(private readonly dataService: DataService) {}

  // ─────────────────────────────────────────────
  // OPPORTUNITY BUILDING (port of buildRealOpportunities + enrichment)
  // ─────────────────────────────────────────────

  private buildOpportunities(): Opportunity[] {
    const closedAcv = this.dataService.getClosedAcv();
    const pipelineSnapshots = this.dataService.getPipelineSnapshots();
    const sowMappings = this.dataService.getSowMappings();
    const arrSubCats = this.dataService.getArrSubCategoryBreakdown();
    const productCatMapping = this.dataService.getProductCategoryMapping();

    // Build indexes
    const sowIndex: Record<string, SOWMappingRecord> = {};
    sowMappings.forEach(m => { if (m.SOW_ID) sowIndex[m.SOW_ID] = m; });

    const prodCatIndex: Record<string, string> = {};
    productCatMapping.forEach(m => {
      if (m.Product_Sub_Category) prodCatIndex[m.Product_Sub_Category] = m.Product_Category;
    });

    const opps: Opportunity[] = [];

    // 1. Closed ACV → Won opportunities
    closedAcv.forEach(row => {
      const sowMapping = sowIndex[row.SOW_ID];
      const region = (sowMapping ? normalizeRegion(sowMapping.Region) : '') || normalizeRegion(row.Region) || '';
      const vertical = (sowMapping ? sowMapping.Vertical : '') || row.Vertical || '';
      const segment = (sowMapping ? sowMapping.Segment_Type : '') || row.Segment || 'Enterprise';

      const licenseValue = row.License_ACV || 0;
      const implementationValue = row.Implementation_Value || 0;
      const totalValue = licenseValue + implementationValue;

      const licenseCountsTowardACV = LICENSE_ACV_LOGO_TYPES.includes(row.Logo_Type);
      const closedACV = (licenseCountsTowardACV ? licenseValue : 0) + implementationValue;

      const soldBy = ['Sales', 'GD', 'TSO'].includes(row.Sold_By) ? row.Sold_By : 'Sales';

      // Enrich sub-category from ARR breakdown
      let productSubCategory: string | undefined;
      let productCategory: string | undefined;
      let subCategoryBreakdown: Opportunity['subCategoryBreakdown'] | undefined;

      if (row.SOW_ID) {
        const year = row.Close_Date ? parseDateLocal(row.Close_Date).getFullYear().toString() : '';
        const contributions = arrSubCats.filter(s => s.SOW_ID === row.SOW_ID);
        if (contributions.length > 0) {
          subCategoryBreakdown = contributions.map(s => {
            const pct = year === '2024' ? s.Pct_2024 : year === '2025' ? s.Pct_2025 : s.Pct_2026;
            return {
              subCategory: s.Product_Sub_Category,
              category: prodCatIndex[s.Product_Sub_Category] || 'Unallocated',
              pct,
              value: Math.round(closedACV * (pct / 100)),
            };
          }).filter(s => s.pct > 0);

          if (subCategoryBreakdown.length > 0) {
            const primary = [...subCategoryBreakdown].sort((a, b) => b.pct - a.pct)[0];
            productSubCategory = primary.subCategory;
            productCategory = prodCatIndex[primary.subCategory] || 'Unallocated';
          }
        }
      }

      opps.push({
        id: row.Closed_ACV_ID,
        name: row.Deal_Name,
        accountName: row.Customer_Name,
        region,
        vertical,
        segment: segment === 'SMB' ? 'SMB' : 'Enterprise',
        stage: 'Closed Won',
        probability: 100,
        dealValue: totalValue || row.Amount,
        licenseValue,
        implementationValue,
        weightedValue: totalValue || row.Amount,
        expectedCloseDate: row.Close_Date,
        daysInStage: 0,
        owner: row.Sales_Rep,
        status: 'Won',
        logoType: row.Logo_Type || 'Upsell',
        salesCycleDays: 90,
        createdDate: row.Close_Date,
        closedACV,
        soldBy,
        sowId: row.SOW_ID,
        revenueType: sowMapping?.Revenue_Type || row.Value_Type || 'License',
        productSubCategory: productSubCategory || 'Unallocated',
        productCategory: productCategory || 'Unallocated',
        subCategoryBreakdown,
      });
    });

    // 2. Pipeline snapshots → Active/Lost/Stalled (LATEST snapshot month only)
    let latestSnapshotMonth = '';
    pipelineSnapshots.forEach(row => {
      if (row.Snapshot_Month > latestSnapshotMonth) latestSnapshotMonth = row.Snapshot_Month;
    });

    const dealMap = new Map<string, PipelineSnapshotRecord>();
    pipelineSnapshots.forEach(row => {
      if (row.Snapshot_Month.slice(0, 7) !== latestSnapshotMonth.slice(0, 7)) return;
      dealMap.set(row.Pipeline_Deal_ID, row);
    });

    let pipIdx = 0;
    dealMap.forEach(row => {
      if (row.Current_Stage.includes('Closed Won')) return;

      let status: 'Active' | 'Lost' | 'Stalled' = 'Active';
      if (
        row.Current_Stage.includes('Closed Lost') ||
        row.Current_Stage.includes('Closed Dead') ||
        row.Current_Stage.includes('Closed Declined')
      ) {
        status = 'Lost';
      } else if (row.Current_Stage.includes('Stalled')) {
        status = 'Stalled';
      }

      const prob = status === 'Lost' ? 0 : row.Probability;

      // Enrich product sub-category from pipeline record
      let productSubCategory = row.Product_Sub_Category || 'Unallocated';
      let productCategory = prodCatIndex[productSubCategory] || 'Unallocated';
      if (!row.Product_Sub_Category) {
        productSubCategory = 'Unallocated';
        productCategory = 'Unallocated';
      }

      opps.push({
        id: row.Pipeline_Deal_ID || `PIP-${String(++pipIdx).padStart(4, '0')}`,
        name: row.Deal_Name,
        accountName: row.Customer_Name,
        region: row.Region || 'North America',
        vertical: row.Vertical || 'Other Services',
        segment: row.Segment === 'SMB' ? 'SMB' : 'Enterprise',
        stage: status === 'Lost' ? 'Closed Lost' : (row.Deal_Stage || 'Prospecting'),
        probability: prob,
        dealValue: row.Deal_Value,
        licenseValue: row.License_ACV,
        implementationValue: row.Implementation_Value,
        weightedValue: row.License_ACV + row.Implementation_Value,
        expectedCloseDate: row.Expected_Close_Date,
        daysInStage: 30,
        owner: row.Sales_Rep,
        status,
        logoType: row.Logo_Type || 'New Logo',
        salesCycleDays: 90,
        createdDate: row.Snapshot_Month,
        closedACV: 0,
        soldBy: 'Sales',
        productSubCategory,
        productCategory,
        revenueType: 'License',
      });
    });

    return opps;
  }

  // ─────────────────────────────────────────────
  // FILTERING
  // ─────────────────────────────────────────────

  private filterOpportunities(opps: Opportunity[], filters: SalesFilterDto): Opportunity[] {
    return opps.filter(opp => {
      if (filters.region?.length && !filters.region.includes(opp.region)) return false;
      if (filters.vertical?.length && !filters.vertical.includes(opp.vertical)) return false;
      if (filters.segment?.length && !filters.segment.includes(opp.segment)) return false;

      if (filters.logoType?.length) {
        const normalizedLogoType = (opp.logoType === 'Renewal' || opp.logoType === 'Extension')
          ? 'Extension/Renewal' : opp.logoType;
        const normalizedFilters = filters.logoType.map(lt =>
          (lt === 'Extension' || lt === 'Renewal') ? 'Extension/Renewal' : lt,
        );
        if (!normalizedFilters.includes(normalizedLogoType) && !filters.logoType.includes(opp.logoType)) return false;
      }

      if (filters.year?.length) {
        const oppYear = parseDateLocal(opp.expectedCloseDate).getFullYear().toString();
        if (!filters.year.includes(oppYear)) return false;
      }

      if (filters.quarter?.length) {
        const oppMonth = parseDateLocal(opp.expectedCloseDate).getMonth();
        const oppQuarter = `Q${Math.floor(oppMonth / 3) + 1}`;
        if (!filters.quarter.includes(oppQuarter)) return false;
      }

      if (filters.month?.length) {
        const oppMonth = parseDateLocal(opp.expectedCloseDate).getMonth();
        if (!filters.month.includes(MONTH_NAMES[oppMonth])) return false;
      }

      if (filters.soldBy && filters.soldBy !== 'All' && opp.soldBy !== filters.soldBy) return false;

      if (filters.productCategory?.length && opp.productCategory && !filters.productCategory.includes(opp.productCategory)) return false;
      if (filters.productSubCategory?.length && opp.productSubCategory && !filters.productSubCategory.includes(opp.productSubCategory)) return false;

      return true;
    });
  }

  private getPreviousYearOpportunities(opps: Opportunity[], filters: SalesFilterDto): Opportunity[] {
    const currentYears = filters.year?.length ? filters.year.map(y => parseInt(y)) : [new Date().getFullYear()];
    const prevYears = currentYears.map(y => y - 1);

    return opps.filter(opp => {
      const oppYear = parseDateLocal(opp.expectedCloseDate).getFullYear();
      if (!prevYears.includes(oppYear)) return false;

      // Apply same dimension filters except year
      if (filters.region?.length && !filters.region.includes(opp.region)) return false;
      if (filters.vertical?.length && !filters.vertical.includes(opp.vertical)) return false;
      if (filters.segment?.length && !filters.segment.includes(opp.segment)) return false;

      if (filters.logoType?.length) {
        const normalizedLogoType = (opp.logoType === 'Renewal' || opp.logoType === 'Extension')
          ? 'Extension/Renewal' : opp.logoType;
        const normalizedFilters = filters.logoType.map(lt =>
          (lt === 'Extension' || lt === 'Renewal') ? 'Extension/Renewal' : lt,
        );
        if (!normalizedFilters.includes(normalizedLogoType) && !filters.logoType.includes(opp.logoType)) return false;
      }

      if (filters.quarter?.length) {
        const oppMonth = parseDateLocal(opp.expectedCloseDate).getMonth();
        const oppQuarter = `Q${Math.floor(oppMonth / 3) + 1}`;
        if (!filters.quarter.includes(oppQuarter)) return false;
      }

      if (filters.month?.length) {
        const oppMonth = parseDateLocal(opp.expectedCloseDate).getMonth();
        if (!filters.month.includes(MONTH_NAMES[oppMonth])) return false;
      }

      if (filters.soldBy && filters.soldBy !== 'All' && opp.soldBy !== filters.soldBy) return false;
      if (filters.productCategory?.length && opp.productCategory && !filters.productCategory.includes(opp.productCategory)) return false;
      if (filters.productSubCategory?.length && opp.productSubCategory && !filters.productSubCategory.includes(opp.productSubCategory)) return false;

      return true;
    });
  }

  // ─────────────────────────────────────────────
  // VALUE GETTERS (revenue-type aware)
  // ─────────────────────────────────────────────

  private getClosedValue(deal: Opportunity, revenueType?: string): number {
    if (revenueType === 'Implementation') return deal.implementationValue || 0;
    if (revenueType === 'License') return deal.licenseValue || 0;
    return (deal.licenseValue || 0) + (deal.implementationValue || 0);
  }

  private getPipelineValue(deal: Opportunity, revenueType?: string): number {
    if (revenueType === 'Implementation') return deal.implementationValue || 0;
    if (revenueType === 'License') return deal.licenseValue || 0;
    return (deal.licenseValue || 0) + (deal.implementationValue || 0);
  }

  // ─────────────────────────────────────────────
  // PUBLIC API METHODS
  // ─────────────────────────────────────────────

  getOverviewMetrics(filters: SalesFilterDto) {
    const allOpps = this.buildOpportunities();
    const filtered = this.filterOpportunities(allOpps, filters);
    const prevYear = this.getPreviousYearOpportunities(allOpps, filters);
    const rt = filters.revenueType || 'All';

    const closedWon = filtered.filter(o => o.status === 'Won');
    const closedLost = filtered.filter(o => o.status === 'Lost');
    const activeDeals = filtered.filter(o => o.status === 'Active' || o.status === 'Stalled');

    const totalClosedACV = closedWon.reduce((sum, o) => sum + this.getClosedValue(o, rt), 0);
    // ACV forecast excludes Renewal/Extension deals from pipeline
    const acvActiveDeals = activeDeals.filter(o => !RENEWAL_LOGO_TYPES.includes(o.logoType));
    const weightedPipelineACV = acvActiveDeals.reduce((sum, o) => sum + this.getPipelineValue(o, rt), 0);
    const forecastACV = totalClosedACV + weightedPipelineACV;

    const prevYearWon = prevYear.filter(o => o.status === 'Won');
    const previousYearClosedACV = prevYearWon.reduce((sum, o) => sum + this.getClosedValue(o, rt), 0);
    const prevYearActive = prevYear.filter(o => o.status === 'Active' || o.status === 'Stalled');
    const prevYearAcvActive = prevYearActive.filter(o => !RENEWAL_LOGO_TYPES.includes(o.logoType));
    const previousYearPipelineACV = prevYearAcvActive.reduce((sum, o) => sum + this.getPipelineValue(o, rt), 0);
    const previousYearForecastACV = previousYearClosedACV + previousYearPipelineACV;

    const yoyGrowth = previousYearForecastACV > 0
      ? ((forecastACV - previousYearForecastACV) / previousYearForecastACV) * 100
      : 0;

    const newBusinessLicenseACV = closedWon
      .filter(o => LICENSE_ACV_LOGO_TYPES.includes(o.logoType))
      .reduce((sum, o) => sum + o.licenseValue, 0);

    const implementationACV = closedWon.reduce((sum, o) => sum + o.implementationValue, 0);

    const extensionRenewalLicense = closedWon
      .filter(o => o.logoType === 'Extension' || o.logoType === 'Renewal')
      .reduce((sum, o) => sum + o.licenseValue, 0);

    const totalPipelineValue = activeDeals.reduce((sum, o) => sum + o.dealValue, 0);

    // Conversion rate: Won from Closed ACV, Lost from ALL pipeline snapshots
    // Lost deals are dropped from later snapshots, so scan all months for deals
    // that reached Closed Lost/Dead/Declined/Stalled. Take each deal's LAST lost-stage value.
    const wonACV = closedWon.reduce((sum, o) => sum + this.getClosedValue(o, rt), 0);
    let lostACV = 0;
    {
      const snapshots = this.dataService.getPipelineSnapshots();
      const isLostStage = (stage: string) =>
        stage.includes('Closed Lost') || stage.includes('Closed Dead') || stage.includes('Closed Declined') || stage.includes('Stalled');
      // Unweighted value: pipeline values are pre-multiplied by probability,
      // so divide by (Probability / 100) to get the original deal value.
      const getUnweightedValue = (s: PipelineSnapshotRecord) => {
        const prob = s.Probability > 0 ? s.Probability / 100 : 0;
        if (prob === 0) return 0;
        const license = (s.License_ACV || 0) / prob;
        const impl = (s.Implementation_Value || 0) / prob;
        if (rt === 'Implementation') return impl;
        if (rt === 'License') return license;
        return license + impl;
      };

      const lostDealMap = new Map<string, number>();
      snapshots.forEach(s => {
        if (!isLostStage(s.Current_Stage)) return;
        // Apply year/quarter/month filters on Expected_Close_Date
        const d = parseDateLocal(s.Expected_Close_Date);
        const yr = d.getFullYear().toString();
        const mon = MONTH_NAMES[d.getMonth()];
        const qtr = `Q${Math.floor(d.getMonth() / 3) + 1}`;
        if (filters.year?.length && !filters.year.includes(yr)) return;
        if (filters.month?.length && !filters.month.includes(mon)) return;
        if (filters.quarter?.length && !filters.quarter.includes(qtr)) return;
        // Dimension filters
        if (filters.region?.length && !filters.region.includes(s.Region)) return;
        if (filters.vertical?.length && !filters.vertical.includes(s.Vertical)) return;
        if (filters.segment?.length && !filters.segment.includes(s.Segment)) return;
        if (filters.logoType?.length) {
          const lt = s.Logo_Type.trim();
          const normalizedLt = (lt === 'Renewal' || lt === 'Extension') ? 'Extension/Renewal' : lt;
          const normalizedFilters = filters.logoType.map(f => (f === 'Extension' || f === 'Renewal') ? 'Extension/Renewal' : f);
          if (!normalizedFilters.includes(normalizedLt) && !filters.logoType.includes(lt)) return;
        }
        lostDealMap.set(s.Pipeline_Deal_ID, getUnweightedValue(s));
      });
      lostDealMap.forEach(val => { lostACV += val; });
    }
    const conversionRate = (wonACV + lostACV) > 0
      ? (wonACV / (wonACV + lostACV)) * 100
      : 0;

    // Time to Close: real calculation from pipeline snapshot history
    // Won deals: Close_Date (from Closed ACV) - Created_Date (from pipeline snapshots)
    // Lost/Dead/Declined/Stalled: LATEST snapshot month with closed stage - Created_Date
    let avgSalesCycle = 0;
    {
      const snapshots = this.dataService.getPipelineSnapshots();
      const closedAcvRecords = this.dataService.getClosedAcv();
      const isClosed = (stage: string) =>
        stage.includes('Closed Won') || stage.includes('Closed Lost') ||
        stage.includes('Closed Dead') || stage.includes('Closed Declined') || stage.includes('Stalled');

      const closedAcvDateMap = new Map<string, string>();
      closedAcvRecords.forEach(c => {
        if (c.Pipeline_Deal_ID && c.Close_Date) closedAcvDateMap.set(c.Pipeline_Deal_ID, c.Close_Date);
      });

      const dealHistory = new Map<string, {
        createdDate: string; logoType: string; region: string; vertical: string; segment: string;
        licenseAcv: number; implementationValue: number;
        entries: { month: string; stage: string }[];
      }>();
      snapshots.forEach(s => {
        if (!s.Pipeline_Deal_ID) return;
        if (!dealHistory.has(s.Pipeline_Deal_ID)) {
          dealHistory.set(s.Pipeline_Deal_ID, {
            createdDate: s.Created_Date || '', logoType: s.Logo_Type || '',
            region: s.Region || '', vertical: s.Vertical || '', segment: s.Segment || '',
            licenseAcv: s.License_ACV || 0, implementationValue: s.Implementation_Value || 0,
            entries: [],
          });
        }
        dealHistory.get(s.Pipeline_Deal_ID)!.entries.push({ month: s.Snapshot_Month, stage: s.Current_Stage });
      });

      let totalDays = 0;
      let closedDealCount = 0;
      dealHistory.forEach((deal, dealId) => {
        if (!deal.createdDate) return;
        if (rt === 'License' && deal.licenseAcv <= 0) return;
        if (rt === 'Implementation' && deal.implementationValue <= 0) return;
        if (filters.logoType?.length) {
          const normalizedLt = (deal.logoType === 'Renewal' || deal.logoType === 'Extension') ? 'Extension/Renewal' : deal.logoType;
          const normalizedFilters = filters.logoType.map(f => (f === 'Extension' || f === 'Renewal') ? 'Extension/Renewal' : f);
          if (!normalizedFilters.includes(normalizedLt) && !filters.logoType.includes(deal.logoType)) return;
        }
        if (filters.region?.length && !filters.region.includes(deal.region)) return;
        if (filters.vertical?.length && !filters.vertical.includes(deal.vertical)) return;
        if (filters.segment?.length && !filters.segment.includes(deal.segment)) return;

        deal.entries.sort((a, b) => a.month.localeCompare(b.month));
        let lastClosedMonth: string | null = null;
        for (const entry of deal.entries) {
          if (isClosed(entry.stage)) lastClosedMonth = entry.month;
        }
        if (!lastClosedMonth) return;

        const acvCloseDate = closedAcvDateMap.get(dealId);
        const closeDate = acvCloseDate || lastClosedMonth;

        const closeDateObj = parseDateLocal(closeDate);
        const yr = closeDateObj.getFullYear().toString();
        const mon = MONTH_NAMES[closeDateObj.getMonth()];
        const qtr = `Q${Math.floor(closeDateObj.getMonth() / 3) + 1}`;
        if (filters.year?.length && !filters.year.includes(yr)) return;
        if (filters.month?.length && !filters.month.includes(mon)) return;
        if (filters.quarter?.length && !filters.quarter.includes(qtr)) return;

        const created = parseDateLocal(deal.createdDate);
        const diffMs = closeDateObj.getTime() - created.getTime();
        const diffDays = Math.max(0, Math.round(diffMs / (1000 * 60 * 60 * 24)));
        totalDays += diffDays;
        closedDealCount++;
      });
      avgSalesCycle = closedDealCount > 0 ? totalDays / closedDealCount : 0;
    }

    return {
      totalClosedACV: Math.round(totalClosedACV),
      weightedPipelineACV: Math.round(weightedPipelineACV),
      forecastACV: Math.round(forecastACV),
      previousYearClosedACV: Math.round(previousYearClosedACV),
      previousYearForecastACV: Math.round(previousYearForecastACV),
      yoyGrowth: Math.round(yoyGrowth * 10) / 10,
      conversionRate: Math.round(conversionRate * 10) / 10,
      avgDealSize: (() => {
        const dealsWithValue = closedWon.filter(o => this.getClosedValue(o, rt) > 0);
        return dealsWithValue.length > 0 ? Math.round(totalClosedACV / dealsWithValue.length) : 0;
      })(),
      avgSalesCycle: Math.round(avgSalesCycle),
      closedWonCount: closedWon.length,
      closedLostCount: closedLost.length,
      activeDealsCount: activeDeals.length,
      newBusinessLicenseACV: Math.round(newBusinessLicenseACV),
      implementationACV: Math.round(implementationACV),
      extensionRenewalLicense: Math.round(extensionRenewalLicense),
      totalPipelineValue: Math.round(totalPipelineValue),
    };
  }

  // computeConversionRate removed — conversion rate now uses closedWon/closedLost
  // directly in getOverviewMetrics() above.

  getOverviewFunnel(filters: SalesFilterDto) {
    const allOpps = this.buildOpportunities();
    const filtered = this.filterOpportunities(allOpps, filters);
    const rt = filters.revenueType || 'All';

    const activeOpps = filtered.filter(o => o.status === 'Active' || o.status === 'Stalled');

    const stageMap = new Map<string, { count: number; value: number }>();
    activeOpps.forEach(o => {
      if (o.stage.includes('Closed')) return;
      const entry = stageMap.get(o.stage) || { count: 0, value: 0 };
      entry.count += 1;
      entry.value += this.getPipelineValue(o, rt);
      stageMap.set(o.stage, entry);
    });

    const stages = Array.from(stageMap.entries())
      .map(([stage, data]) => ({ stage, count: data.count, value: Math.round(data.value) }))
      .sort((a, b) => b.value - a.value);

    return { stages };
  }

  getOverviewKeyDeals(filters: SalesFilterDto & { sortField?: string; sortDirection?: string; limit?: number }) {
    const allOpps = this.buildOpportunities();
    const filtered = this.filterOpportunities(allOpps, filters);
    const rt = filters.revenueType || 'All';

    const getUnweightedLicense = (o: Opportunity): number => {
      const prob = o.probability > 0 ? o.probability / 100 : 1;
      return (o.licenseValue || 0) / prob;
    };

    const getUnweightedImpl = (o: Opportunity): number => {
      const prob = o.probability > 0 ? o.probability / 100 : 1;
      return (o.implementationValue || 0) / prob;
    };

    const getUnweightedVal = (o: Opportunity): number => {
      if (rt === 'License') return getUnweightedLicense(o);
      if (rt === 'Implementation') return getUnweightedImpl(o);
      return getUnweightedLicense(o) + getUnweightedImpl(o);
    };

    let deals = filtered
      .filter(o => o.status === 'Active')
      // Filter out deals where the relevant unweighted value is $0
      .filter(o => getUnweightedVal(o) > 0)
      .sort((a, b) => getUnweightedVal(b) - getUnweightedVal(a));

    if (filters.sortField) {
      const dir = filters.sortDirection === 'asc' ? 1 : -1;
      deals = deals.sort((a: any, b: any) => {
        if (a[filters.sortField!] > b[filters.sortField!]) return dir;
        if (a[filters.sortField!] < b[filters.sortField!]) return -dir;
        return 0;
      });
    }

    const limit = filters.limit || 10;
    return {
      deals: deals.slice(0, limit).map(o => ({
        id: o.id,
        name: o.name,
        accountName: o.accountName,
        region: o.region,
        vertical: o.vertical,
        stage: o.stage,
        probability: o.probability,
        dealValue: Math.round(o.dealValue),
        unweightedValue: Math.round(getUnweightedVal(o)),
        unweightedLicenseValue: Math.round(getUnweightedLicense(o)),
        unweightedImplementationValue: Math.round(getUnweightedImpl(o)),
        licenseValue: Math.round(o.licenseValue),
        implementationValue: Math.round(o.implementationValue),
        expectedCloseDate: o.expectedCloseDate,
        logoType: o.logoType,
        owner: o.owner,
        productSubCategory: o.productSubCategory,
        productCategory: o.productCategory,
      })),
    };
  }

  getOverviewClosedDeals(filters: SalesFilterDto) {
    const allOpps = this.buildOpportunities();
    const filtered = this.filterOpportunities(allOpps, filters);
    const rt = filters.revenueType || 'All';

    const closedWon = filtered.filter(o => o.status === 'Won');

    return {
      deals: closedWon.map(o => ({
        id: o.id,
        name: o.name,
        accountName: o.accountName,
        logoType: o.logoType,
        licenseValue: Math.round(o.licenseValue),
        implementationValue: Math.round(o.implementationValue),
        closedACV: Math.round(this.getClosedValue(o, rt)),
        closeDate: o.expectedCloseDate,
        region: o.region,
        vertical: o.vertical,
        segment: o.segment,
        soldBy: o.soldBy,
        sowId: o.sowId,
        subCategoryBreakdown: o.subCategoryBreakdown || [],
      })),
    };
  }

  getForecastQuarterly(filters: SalesFilterDto) {
    const allOpps = this.buildOpportunities();
    const filtered = this.filterOpportunities(allOpps, filters);
    const prevYearOpps = this.getPreviousYearOpportunities(allOpps, filters);
    const rt = filters.revenueType || 'All';

    const yr = new Date().getFullYear();
    const prevYr = yr - 1;
    const currentQuarter = Math.floor(new Date().getMonth() / 3) + 1;

    const quarters = [1, 2, 3, 4].map(q => {
      const qStart = new Date(yr, (q - 1) * 3, 1);
      const qEnd = new Date(yr, q * 3, 0);

      const wonInQ = filtered.filter(o => {
        if (o.status !== 'Won') return false;
        const d = parseDateLocal(o.expectedCloseDate);
        return d >= qStart && d <= qEnd;
      });
      const actual = q <= currentQuarter
        ? wonInQ.reduce((sum, o) => sum + this.getClosedValue(o, rt), 0)
        : 0;

      // ACV forecast excludes Renewal/Extension deals from pipeline
      const activeInQ = filtered.filter(o => {
        if (o.status !== 'Active' && o.status !== 'Stalled') return false;
        if (RENEWAL_LOGO_TYPES.includes(o.logoType)) return false;
        const d = parseDateLocal(o.expectedCloseDate);
        return d >= qStart && d <= qEnd;
      });
      const weightedPipeline = activeInQ.reduce((sum, o) => sum + this.getPipelineValue(o, rt), 0);
      const forecast = actual + weightedPipeline;

      const prevQStart = new Date(prevYr, (q - 1) * 3, 1);
      const prevQEnd = new Date(prevYr, q * 3, 0);
      const prevYearWonInQ = prevYearOpps.filter(o => {
        if (o.status !== 'Won') return false;
        const d = parseDateLocal(o.expectedCloseDate);
        return d >= prevQStart && d <= prevQEnd;
      });
      const previousYear = prevYearWonInQ.reduce((sum, o) => sum + this.getClosedValue(o, rt), 0);

      return {
        quarter: `Q${q}`,
        forecast: Math.round(forecast),
        actual: Math.round(actual),
        previousYear: Math.round(previousYear),
      };
    });

    return { quarters };
  }

  getForecastRegional(filters: SalesFilterDto) {
    const allOpps = this.buildOpportunities();
    const filtered = this.filterOpportunities(allOpps, filters);
    const prevYearOpps = this.getPreviousYearOpportunities(allOpps, filters);
    const rt = filters.revenueType || 'All';
    const yr = new Date().getFullYear();

    const regions = REGIONS.map(region => {
      const regionWon = filtered.filter(o =>
        o.status === 'Won' && o.region === region && o.expectedCloseDate.startsWith(String(yr)),
      );
      const closedACV = regionWon.reduce((sum, o) => sum + this.getClosedValue(o, rt), 0);

      // ACV forecast excludes Renewal/Extension deals from pipeline
      const regionActive = filtered.filter(o =>
        (o.status === 'Active' || o.status === 'Stalled') && o.region === region && !RENEWAL_LOGO_TYPES.includes(o.logoType),
      );
      const weightedPipeline = regionActive.reduce((sum, o) => sum + this.getPipelineValue(o, rt), 0);
      const forecast = closedACV + weightedPipeline;

      const prevRegionWon = prevYearOpps.filter(o => o.status === 'Won' && o.region === region);
      const previousYearACV = prevRegionWon.reduce((sum, o) => sum + this.getClosedValue(o, rt), 0);
      const prevRegionActive = prevYearOpps.filter(o => (o.status === 'Active' || o.status === 'Stalled') && o.region === region && !RENEWAL_LOGO_TYPES.includes(o.logoType));
      const prevYearPipeline = prevRegionActive.reduce((sum, o) => sum + this.getPipelineValue(o, rt), 0);
      const previousYearForecast = previousYearACV + prevYearPipeline;

      return {
        region,
        forecast: Math.round(forecast),
        previousYearACV: Math.round(previousYearForecast),
        closedACV: Math.round(closedACV),
        variance: Math.round(forecast - previousYearForecast),
        yoyGrowth: previousYearForecast > 0 ? Math.round(((forecast - previousYearForecast) / previousYearForecast) * 100) : 0,
      };
    });

    return { regions };
  }

  getForecastTrend(filters: SalesFilterDto) {
    const allOpps = this.buildOpportunities();
    const filtered = this.filterOpportunities(allOpps, filters);
    const prevYearOpps = this.getPreviousYearOpportunities(allOpps, filters);
    const rt = filters.revenueType || 'All';
    const yr = new Date().getFullYear();
    const prevYr = yr - 1;

    const months = MONTH_NAMES.map((monthName, i) => {
      const monthStart = new Date(yr, 0, 1);
      const monthEnd = new Date(yr, i + 1, 0);

      // Cumulative won through this month
      const wonThrough = filtered.filter(o => {
        if (o.status !== 'Won') return false;
        const d = parseDateLocal(o.expectedCloseDate);
        return d.getFullYear() === yr && d <= monthEnd;
      });
      const cumulativeWon = wonThrough.reduce((sum, o) => sum + this.getClosedValue(o, rt), 0);

      // Monthly won for this specific month
      const monthStart2 = new Date(yr, i, 1);
      const monthlyWon = filtered.filter(o => {
        if (o.status !== 'Won') return false;
        const d = parseDateLocal(o.expectedCloseDate);
        return d >= monthStart2 && d <= monthEnd;
      }).reduce((sum, o) => sum + this.getClosedValue(o, rt), 0);

      // Pipeline weighted for this month — ACV forecast excludes Renewal/Extension
      const monthlyPipeline = filtered.filter(o => {
        if (o.status !== 'Active' && o.status !== 'Stalled') return false;
        if (RENEWAL_LOGO_TYPES.includes(o.logoType)) return false;
        const d = parseDateLocal(o.expectedCloseDate);
        return d >= monthStart2 && d <= monthEnd;
      }).reduce((sum, o) => sum + this.getPipelineValue(o, rt), 0);

      // Cumulative pipeline through this month — ACV forecast excludes Renewal/Extension
      const pipelineThrough = filtered.filter(o => {
        if (o.status !== 'Active' && o.status !== 'Stalled') return false;
        if (RENEWAL_LOGO_TYPES.includes(o.logoType)) return false;
        const d = parseDateLocal(o.expectedCloseDate);
        return d.getFullYear() === yr && d <= monthEnd;
      }).reduce((sum, o) => sum + this.getPipelineValue(o, rt), 0);

      const cumulativeForecast = cumulativeWon + pipelineThrough;

      // Previous year cumulative
      const prevYearMonthEnd = new Date(prevYr, i + 1, 0);
      const prevWonThrough = prevYearOpps.filter(o => {
        if (o.status !== 'Won') return false;
        const d = parseDateLocal(o.expectedCloseDate);
        return d.getFullYear() === prevYr && d <= prevYearMonthEnd;
      });
      const cumulativePreviousYear = prevWonThrough.reduce((sum, o) => sum + this.getClosedValue(o, rt), 0);

      return {
        month: monthName,
        cumulativeForecast: Math.round(cumulativeForecast),
        cumulativePreviousYear: Math.round(cumulativePreviousYear),
        monthlyWon: Math.round(monthlyWon),
        monthlyPipeline: Math.round(monthlyPipeline),
      };
    });

    return { months };
  }

  getForecastBySubcategory(filters: SalesFilterDto) {
    const allOpps = this.buildOpportunities();
    const filtered = this.filterOpportunities(allOpps, filters);
    const rt = filters.revenueType || 'All';

    const activeDeals = filtered.filter(o => o.status === 'Active' || o.status === 'Stalled');
    const prodCatIndex = this.buildProdCatIndex();

    const subCatMap = new Map<string, { weightedForecast: number; dealCount: number; category: string }>();
    activeDeals.forEach(o => {
      const subCat = o.productSubCategory || 'Unallocated';
      const entry = subCatMap.get(subCat) || { weightedForecast: 0, dealCount: 0, category: prodCatIndex[subCat] || 'Unallocated' };
      entry.weightedForecast += this.getPipelineValue(o, rt);
      entry.dealCount += 1;
      subCatMap.set(subCat, entry);
    });

    const totalWeighted = Array.from(subCatMap.values()).reduce((s, e) => s + e.weightedForecast, 0);

    const subcategories = Array.from(subCatMap.entries())
      .map(([subCategory, data]) => ({
        subCategory,
        category: data.category,
        weightedForecast: Math.round(data.weightedForecast),
        percentOfTotal: totalWeighted > 0 ? Math.round((data.weightedForecast / totalWeighted) * 1000) / 10 : 0,
        dealCount: data.dealCount,
      }))
      .sort((a, b) => b.weightedForecast - a.weightedForecast);

    return { subcategories };
  }

  private buildProdCatIndex(): Record<string, string> {
    const mapping = this.dataService.getProductCategoryMapping();
    const index: Record<string, string> = {};
    mapping.forEach(m => { if (m.Product_Sub_Category) index[m.Product_Sub_Category] = m.Product_Category; });
    return index;
  }

  getPipelineMovement(filters: SalesFilterDto & { targetMonth?: string; lookbackMonths?: number }) {
    const snapshots = this.dataService.getPipelineSnapshots();
    const rt = filters.revenueType || 'All';

    const allMonths = Array.from(new Set(snapshots.map(s => s.Snapshot_Month.slice(0, 7)))).sort();
    if (allMonths.length < 2) {
      return { prevLabel: '', currLabel: '', startingPipeline: 0, endingPipeline: 0,
        newDeals: { count: 0, value: 0 }, increased: { count: 0, value: 0 },
        decreased: { count: 0, value: 0 }, won: { count: 0, value: 0 },
        lost: { count: 0, value: 0 }, totalChange: 0, waterfall: [], dealDetails: [] };
    }

    // Determine target month
    let targetYYYYMM = filters.targetMonth || allMonths[allMonths.length - 1];
    if (filters.year?.length) {
      const filteredMonths = allMonths.filter(m => filters.year!.includes(m.slice(0, 4)));
      if (filteredMonths.length > 0) {
        if (filters.month?.length === 1) {
          const monthIdx = MONTH_NAMES.indexOf(filters.month[0]);
          if (monthIdx >= 0) {
            const mm = String(monthIdx + 1).padStart(2, '0');
            const match = filteredMonths.find(m => m.endsWith(`-${mm}`));
            targetYYYYMM = match || filteredMonths[filteredMonths.length - 1];
          }
        } else if (filters.quarter?.length === 1) {
          const qNum = parseInt(filters.quarter[0].replace('Q', ''));
          const qMonths = [(qNum - 1) * 3 + 1, (qNum - 1) * 3 + 2, (qNum - 1) * 3 + 3]
            .map(m => String(m).padStart(2, '0'));
          const qMatches = filteredMonths.filter(m => qMonths.some(mm => m.endsWith(`-${mm}`)));
          targetYYYYMM = qMatches.length > 0 ? qMatches[qMatches.length - 1] : filteredMonths[filteredMonths.length - 1];
        } else {
          targetYYYYMM = filteredMonths[filteredMonths.length - 1];
        }
      }
    }

    const targetIdx = allMonths.indexOf(targetYYYYMM);
    if (targetIdx <= 0) {
      return { prevLabel: '', currLabel: '', startingPipeline: 0, endingPipeline: 0,
        newDeals: { count: 0, value: 0 }, increased: { count: 0, value: 0 },
        decreased: { count: 0, value: 0 }, won: { count: 0, value: 0 },
        lost: { count: 0, value: 0 }, totalChange: 0, waterfall: [], dealDetails: [] };
    }

    // Determine comparison month based on lookback
    const lookback = filters.lookbackMonths || 1;
    let prevIdx: number;
    if (lookback === 1) {
      prevIdx = targetIdx - 1;
    } else {
      const targetDate = new Date(parseInt(targetYYYYMM.slice(0, 4)), parseInt(targetYYYYMM.slice(5, 7)) - 1, 1);
      targetDate.setMonth(targetDate.getMonth() - lookback);
      const lookbackYYYYMM = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}`;
      prevIdx = -1;
      for (let i = targetIdx - 1; i >= 0; i--) {
        if (allMonths[i] <= lookbackYYYYMM) { prevIdx = i; break; }
      }
      if (prevIdx < 0) prevIdx = 0;
    }
    if (prevIdx < 0 || prevIdx >= targetIdx) {
      return { prevLabel: '', currLabel: '', startingPipeline: 0, endingPipeline: 0,
        newDeals: { count: 0, value: 0 }, increased: { count: 0, value: 0 },
        decreased: { count: 0, value: 0 }, won: { count: 0, value: 0 },
        lost: { count: 0, value: 0 }, totalChange: 0, waterfall: [], dealDetails: [] };
    }
    const prevYYYYMM = allMonths[prevIdx];

    // Filter function for pipeline rows
    const passesFilters = (row: PipelineSnapshotRecord): boolean => {
      if (filters.region?.length && !filters.region.includes(row.Region)) return false;
      if (filters.vertical?.length && !filters.vertical.includes(row.Vertical)) return false;
      if (filters.segment?.length && !filters.segment.includes(row.Segment)) return false;
      if (filters.logoType?.length) {
        const normalizedLogoType = (row.Logo_Type === 'Renewal' || row.Logo_Type === 'Extension')
          ? 'Extension/Renewal' : row.Logo_Type;
        const normalizedFilters = filters.logoType.map(lt =>
          (lt === 'Extension' || lt === 'Renewal') ? 'Extension/Renewal' : lt,
        );
        if (!normalizedFilters.includes(normalizedLogoType) && !filters.logoType.includes(row.Logo_Type)) return false;
      }
      return true;
    };

    type SnapDeal = {
      licenseACV: number; implValue: number; currentStage: string;
      dealName: string; customerName: string; salesRep: string;
      dealStage: string; probability: number; logoType: string; pipelineDealId: string;
    };

    const prevMap = new Map<string, SnapDeal>();
    const currMap = new Map<string, SnapDeal>();

    snapshots.forEach(row => {
      if (!passesFilters(row)) return;
      const ym = row.Snapshot_Month.slice(0, 7);
      const deal: SnapDeal = {
        licenseACV: row.License_ACV || 0, implValue: row.Implementation_Value || 0,
        currentStage: row.Current_Stage || '', dealName: row.Deal_Name || '',
        customerName: row.Customer_Name || '', salesRep: row.Sales_Rep || '',
        dealStage: row.Deal_Stage || '', probability: row.Probability || 0,
        logoType: row.Logo_Type || '', pipelineDealId: row.Pipeline_Deal_ID,
      };
      if (ym === prevYYYYMM) prevMap.set(row.Pipeline_Deal_ID, deal);
      else if (ym === targetYYYYMM) currMap.set(row.Pipeline_Deal_ID, deal);
    });

    const getVal = (d: SnapDeal): number => {
      if (rt === 'Implementation') return d.implValue;
      if (rt === 'License') return d.licenseACV;
      return d.licenseACV + d.implValue;
    };

    let startingPipeline = 0;
    prevMap.forEach(d => { startingPipeline += getVal(d); });

    let endingPipeline = 0;
    currMap.forEach(d => { endingPipeline += getVal(d); });

    let newDealsValue = 0, newDealsCount = 0;
    let increasedValue = 0, increasedCount = 0;
    let decreasedValue = 0, decreasedCount = 0;
    let wonValue = 0, wonCount = 0;
    let lostValue = 0, lostCount = 0;
    const dealDetails: Array<{
      dealId: string; dealName: string; accountName: string;
      category: string; previousValue: number; currentValue: number;
      change: number; stage: string;
    }> = [];

    // New deals
    currMap.forEach((currDeal, key) => {
      if (!prevMap.has(key)) {
        const val = getVal(currDeal);
        newDealsValue += val;
        newDealsCount++;
        dealDetails.push({
          dealId: key, dealName: currDeal.dealName, accountName: currDeal.customerName,
          category: 'New', previousValue: 0, currentValue: Math.round(val),
          change: Math.round(val), stage: currDeal.dealStage,
        });
      }
    });

    // Increased / Decreased
    currMap.forEach((currDeal, key) => {
      const prevDeal = prevMap.get(key);
      if (prevDeal) {
        const currVal = getVal(currDeal);
        const prevVal = getVal(prevDeal);
        if (currVal > prevVal) {
          increasedValue += currVal - prevVal;
          increasedCount++;
          dealDetails.push({
            dealId: key, dealName: currDeal.dealName, accountName: currDeal.customerName,
            category: 'Increased', previousValue: Math.round(prevVal), currentValue: Math.round(currVal),
            change: Math.round(currVal - prevVal), stage: currDeal.dealStage,
          });
        } else if (currVal < prevVal) {
          decreasedValue += prevVal - currVal;
          decreasedCount++;
          dealDetails.push({
            dealId: key, dealName: currDeal.dealName, accountName: currDeal.customerName,
            category: 'Decreased', previousValue: Math.round(prevVal), currentValue: Math.round(currVal),
            change: Math.round(currVal - prevVal), stage: currDeal.dealStage,
          });
        }
      }
    });

    // Won / Lost (in prev but not in curr)
    prevMap.forEach((prevDeal, key) => {
      if (!currMap.has(key)) {
        const stage = prevDeal.currentStage;
        const val = getVal(prevDeal);
        if (stage.startsWith('Stage 7')) {
          wonValue += val;
          wonCount++;
          dealDetails.push({
            dealId: key, dealName: prevDeal.dealName, accountName: prevDeal.customerName,
            category: 'Won', previousValue: Math.round(val), currentValue: 0,
            change: Math.round(-val), stage: prevDeal.currentStage,
          });
        } else {
          lostValue += val;
          lostCount++;
          dealDetails.push({
            dealId: key, dealName: prevDeal.dealName, accountName: prevDeal.customerName,
            category: 'Lost', previousValue: Math.round(val), currentValue: 0,
            change: Math.round(-val), stage: prevDeal.currentStage || 'Unknown',
          });
        }
      }
    });

    // Labels
    const prevMM = parseInt(prevYYYYMM.slice(5, 7), 10);
    const currMM = parseInt(targetYYYYMM.slice(5, 7), 10);
    const prevLabel = `${MONTH_NAMES[prevMM - 1]}'${prevYYYYMM.slice(2, 4)}`;
    const currLabel = `${MONTH_NAMES[currMM - 1]}'${targetYYYYMM.slice(2, 4)}`;

    // Build waterfall
    let runningTotal = startingPipeline;
    const waterfall: Array<{
      name: string; bottom: number; value: number; displayValue: number; fill: string; type: string;
    }> = [];

    waterfall.push({ name: `${prevLabel}\nPipeline`, bottom: 0, value: Math.round(startingPipeline),
      displayValue: Math.round(startingPipeline), fill: COLORS.gray, type: 'initial' });

    waterfall.push({ name: 'New\nDeals', bottom: Math.round(runningTotal), value: Math.round(newDealsValue),
      displayValue: Math.round(newDealsValue), fill: COLORS.success, type: 'increase' });
    runningTotal += newDealsValue;

    waterfall.push({ name: 'Value\nIncreased', bottom: Math.round(runningTotal), value: Math.round(increasedValue),
      displayValue: Math.round(increasedValue), fill: COLORS.primary, type: 'increase' });
    runningTotal += increasedValue;

    waterfall.push({ name: 'Value\nDecreased', bottom: Math.round(runningTotal - decreasedValue), value: Math.round(decreasedValue),
      displayValue: Math.round(-decreasedValue), fill: COLORS.warning, type: 'decrease' });
    runningTotal -= decreasedValue;

    waterfall.push({ name: 'Closed\nWon', bottom: Math.round(runningTotal - wonValue), value: Math.round(wonValue),
      displayValue: Math.round(-wonValue), fill: COLORS.purple, type: 'decrease' });
    runningTotal -= wonValue;

    waterfall.push({ name: 'Lost\nDeals', bottom: Math.round(runningTotal - lostValue), value: Math.round(lostValue),
      displayValue: Math.round(-lostValue), fill: COLORS.danger, type: 'decrease' });
    runningTotal -= lostValue;

    waterfall.push({ name: `${currLabel}\nPipeline`, bottom: 0, value: Math.round(endingPipeline),
      displayValue: Math.round(endingPipeline), fill: COLORS.gray, type: 'final' });

    return {
      prevLabel, currLabel,
      startingPipeline: Math.round(startingPipeline),
      endingPipeline: Math.round(endingPipeline),
      newDeals: { count: newDealsCount, value: Math.round(newDealsValue) },
      increased: { count: increasedCount, value: Math.round(increasedValue) },
      decreased: { count: decreasedCount, value: Math.round(decreasedValue) },
      won: { count: wonCount, value: Math.round(wonValue) },
      lost: { count: lostCount, value: Math.round(lostValue) },
      totalChange: Math.round(endingPipeline - startingPipeline),
      waterfall,
      dealDetails,
    };
  }

  getPipelineBySubcategory(filters: SalesFilterDto) {
    const allOpps = this.buildOpportunities();
    const filtered = this.filterOpportunities(allOpps, filters);
    const rt = filters.revenueType || 'All';
    const prodCatIndex = this.buildProdCatIndex();

    const activeDeals = filtered.filter(o => o.status === 'Active' || o.status === 'Stalled');

    const subCatMap = new Map<string, { pipelineValue: number; weightedValue: number; dealCount: number; category: string }>();
    activeDeals.forEach(o => {
      const subCat = o.productSubCategory || 'Unallocated';
      const entry = subCatMap.get(subCat) || { pipelineValue: 0, weightedValue: 0, dealCount: 0, category: prodCatIndex[subCat] || 'Unallocated' };
      entry.pipelineValue += o.dealValue;
      entry.weightedValue += this.getPipelineValue(o, rt);
      entry.dealCount += 1;
      subCatMap.set(subCat, entry);
    });

    const subcategories = Array.from(subCatMap.entries())
      .map(([subCategory, data]) => ({
        subCategory,
        category: data.category,
        pipelineValue: Math.round(data.pipelineValue),
        weightedValue: Math.round(data.weightedValue),
        dealCount: data.dealCount,
      }))
      .sort((a, b) => b.pipelineValue - a.pipelineValue);

    return { subcategories };
  }

  getQuotaSalespeople(filters: SalesFilterDto & { nameFilter?: string; regionFilter?: string; sortField?: string; sortDirection?: string }) {
    const allOpps = this.buildOpportunities();
    const filtered = this.filterOpportunities(allOpps, filters);
    const prevYearOpps = this.getPreviousYearOpportunities(allOpps, filters);
    const salesTeam = this.dataService.getSalesTeam();
    const priorYearPerf = this.dataService.getPriorYearPerformance();

    const currentCalendarYear = new Date().getFullYear();
    const selectedYear = filters.year?.length ? parseInt(filters.year[0]) : currentCalendarYear;
    const priorYear = selectedYear - 1;

    const selectedYearHasCSV = priorYearPerf.some(r => r.Year === selectedYear);

    // Revenue-type-aware value getters
    const revenueType = filters.revenueType || 'License';
    const getClosedVal = (o: Opportunity): number => {
      if (revenueType === 'Implementation') return o.implementationValue || 0;
      if (revenueType === 'License') return o.licenseValue || 0;
      return (o.licenseValue || 0) + (o.implementationValue || 0);
    };
    const getWeightedPipeVal = (o: Opportunity): number => {
      if (revenueType === 'Implementation') return o.implementationValue || 0;
      if (revenueType === 'License') return o.licenseValue || 0;
      return (o.licenseValue || 0) + (o.implementationValue || 0);
    };
    const getUnweightedPipeVal = (o: Opportunity): number => {
      const prob = o.probability > 0 ? o.probability / 100 : 0;
      if (prob === 0) return 0;
      if (revenueType === 'Implementation') return (o.implementationValue || 0) / prob;
      if (revenueType === 'License') return (o.licenseValue || 0) / prob;
      return ((o.licenseValue || 0) + (o.implementationValue || 0)) / prob;
    };

    let rawSalespeople: { id: string; name: string; region: string; isManager: boolean; managerId?: string;
      previousYearClosed: number; closedYTD: number; forecast: number; pipelineValue: number; unweightedPipeline: number;
      monthlyAttainment: number[]; quota: number }[];

    if (selectedYearHasCSV) {
      // ── Historical year (CSV): flat list directly from CSV rows ──
      const csvRowsForYear = priorYearPerf.filter(r => r.Year === selectedYear);
      const priorYearCSVMap = new Map<string, number>();
      priorYearPerf.filter(r => r.Year === priorYear).forEach(r => {
        priorYearCSVMap.set(r.Sales_Rep_ID, r.Total_Closed || 0);
      });

      rawSalespeople = csvRowsForYear.map(row => {
        const quota = row.Annual_Quota || 0;
        const qClosed = [row.Q1_Closed, row.Q2_Closed, row.Q3_Closed, row.Q4_Closed];
        const qQuota = quota / 4;
        const monthlyAttainment = Array.from({ length: 12 }, (_, month) => {
          const q = Math.floor(month / 3);
          return qQuota > 0 ? Math.round((qClosed[q] / qQuota) * 100) : (qClosed[q] > 0 ? 100 : 0);
        });
        return {
          id: row.Sales_Rep_ID, name: row.Sales_Rep_Name, region: row.Region,
          isManager: false, managerId: undefined,
          previousYearClosed: priorYearCSVMap.get(row.Sales_Rep_ID) || 0,
          closedYTD: row.Total_Closed || 0, forecast: row.Total_Closed || 0,
          pipelineValue: 0, unweightedPipeline: 0,
          monthlyAttainment, quota,
        };
      });
    } else {
      // ── Current year (2026): existing logic from sales_team_structure + opportunities ──
      const priorYearHasCSV = priorYearPerf.some(r => r.Year === priorYear);
      const priorYearCSVMap = new Map<string, number>();
      if (priorYearHasCSV) {
        priorYearPerf.filter(r => r.Year === priorYear).forEach(r => {
          priorYearCSVMap.set(r.Sales_Rep_ID, r.Total_Closed || 0);
        });
      }

      const activeTeam = salesTeam.filter(m => m.Name && m.Status === 'Active');
      const managerIds = new Set(activeTeam.map(m => m.Manager_ID).filter(Boolean));

      rawSalespeople = activeTeam.map(member => {
        const isManager = managerIds.has(member.Sales_Rep_ID);
        const nameLower = member.Name.trim().toLowerCase();

        const wonDeals = filtered.filter(o =>
          o.status === 'Won' && o.owner.trim().toLowerCase() === nameLower && o.expectedCloseDate.startsWith(String(selectedYear)),
        );
        const closedYTD = wonDeals.reduce((sum, o) => sum + getClosedVal(o), 0);

        let previousYearClosed: number;
        if (priorYearHasCSV && priorYearCSVMap.has(member.Sales_Rep_ID)) {
          previousYearClosed = priorYearCSVMap.get(member.Sales_Rep_ID)!;
        } else {
          const prevYearWon = prevYearOpps.filter(o =>
            o.status === 'Won' && o.owner.trim().toLowerCase() === nameLower,
          );
          previousYearClosed = prevYearWon.reduce((sum, o) => sum + getClosedVal(o), 0);
        }

        const activeDeals = filtered.filter(o =>
          (o.status === 'Active' || o.status === 'Stalled') && o.owner.trim().toLowerCase() === nameLower,
        );
        const pipelineValue = activeDeals.reduce((sum, o) => sum + getWeightedPipeVal(o), 0);
        const unweightedPipeline = activeDeals.reduce((sum, o) => sum + getUnweightedPipeVal(o), 0);
        const forecast = closedYTD + pipelineValue;

        const prevYearWon = prevYearOpps.filter(o =>
          o.status === 'Won' && o.owner.trim().toLowerCase() === nameLower,
        );
        const monthlyAttainment = Array.from({ length: 12 }, (_, month) => {
          const monthDeals = wonDeals.filter(o => parseDateLocal(o.expectedCloseDate).getMonth() === month);
          const monthClosed = monthDeals.reduce((sum, o) => sum + getClosedVal(o), 0);
          const prevMonthDeals = prevYearWon.filter(o => parseDateLocal(o.expectedCloseDate).getMonth() === month);
          const prevMonthClosed = prevMonthDeals.reduce((sum, o) => sum + getClosedVal(o), 0);
          return prevMonthClosed > 0 ? Math.round((monthClosed / prevMonthClosed) * 100) : (monthClosed > 0 ? 100 : 0);
        });

        return {
          id: member.Sales_Rep_ID, name: member.Name, region: member.Region,
          isManager, managerId: member.Sales_Rep_ID === member.Manager_ID ? undefined : member.Manager_ID,
          previousYearClosed, closedYTD, forecast, pipelineValue, unweightedPipeline, monthlyAttainment,
          quota: member.Annual_Quota || 0,
        };
      });
    }

    // Compute derived metrics — hierarchy rollup only for current year (non-CSV years)
    const isHistoricalCSV = rawSalespeople.every(sp => !sp.isManager);

    let processed: (typeof rawSalespeople[0] & { pipelineCoverage: number; forecastAttainment: number; level: number })[];

    if (isHistoricalCSV) {
      processed = rawSalespeople.map(sp => {
        // Coverage = (Closed YTD + Unweighted Pipeline) / Quota
        const pipelineCoverage = sp.quota > 0 ? (sp.closedYTD + sp.unweightedPipeline) / sp.quota : 0;
        const forecastAttainment = sp.quota > 0 ? (sp.forecast / sp.quota) * 100 : 0;
        return { ...sp, pipelineCoverage, forecastAttainment, level: 0 };
      });
    } else {
      const spById = new Map(rawSalespeople.map(sp => [sp.id, sp]));
      const rollupCache = new Map<string, { closed: number; forecast: number; pipeline: number; unweightedPipeline: number; quota: number }>();
      const getRollup = (id: string): { closed: number; forecast: number; pipeline: number; unweightedPipeline: number; quota: number } => {
        if (rollupCache.has(id)) return rollupCache.get(id)!;
        const person = spById.get(id);
        if (!person) return { closed: 0, forecast: 0, pipeline: 0, unweightedPipeline: 0, quota: 0 };
        const result = { closed: person.closedYTD, forecast: person.forecast, pipeline: person.pipelineValue, unweightedPipeline: person.unweightedPipeline, quota: person.quota };
        const directReports = rawSalespeople.filter(s => s.managerId === id && s.id !== id);
        for (const report of directReports) {
          const sub = getRollup(report.id);
          result.closed += sub.closed; result.forecast += sub.forecast;
          result.pipeline += sub.pipeline; result.unweightedPipeline += sub.unweightedPipeline;
          result.quota += sub.quota;
        }
        rollupCache.set(id, result);
        return result;
      };

      const salespeopleWithTotals = rawSalespeople.map(sp => {
        if (sp.isManager) {
          const rollup = getRollup(sp.id);
          // Coverage = (Closed YTD + Unweighted Pipeline) / Quota
          const pipelineCoverage = rollup.quota > 0 ? (rollup.closed + rollup.unweightedPipeline) / rollup.quota : 0;
          const forecastAttainment = rollup.quota > 0 ? (rollup.forecast / rollup.quota) * 100 : 0;
          return { ...sp, closedYTD: rollup.closed, forecast: rollup.forecast, pipelineValue: rollup.pipeline,
            unweightedPipeline: rollup.unweightedPipeline, quota: rollup.quota,
            pipelineCoverage, forecastAttainment, level: 0 };
        }
        // Coverage = (Closed YTD + Unweighted Pipeline) / Quota
        const pipelineCoverage = sp.quota > 0 ? (sp.closedYTD + sp.unweightedPipeline) / sp.quota : 0;
        const forecastAttainment = sp.quota > 0 ? (sp.forecast / sp.quota) * 100 : 0;
        return { ...sp, pipelineCoverage, forecastAttainment, level: 0 };
      });

      // Build cascading hierarchy
      const totalsById = new Map(salespeopleWithTotals.map(sp => [sp.id, sp]));
      const cascaded: typeof salespeopleWithTotals = [];
      const visited = new Set<string>();
      const addWithChildren = (id: string, level: number) => {
        if (visited.has(id)) return;
        visited.add(id);
        const person = totalsById.get(id);
        if (person) {
          cascaded.push({ ...person, level });
          const directReports = salespeopleWithTotals
            .filter(s => s.managerId === id && s.id !== id)
            .sort((a, b) => { if (a.isManager !== b.isManager) return a.isManager ? -1 : 1; return a.name.localeCompare(b.name); });
          for (const report of directReports) addWithChildren(report.id, level + 1);
        }
      };
      const topLevel = salespeopleWithTotals.filter(sp => !sp.managerId).sort((a, b) => a.name.localeCompare(b.name));
      for (const top of topLevel) addWithChildren(top.id, 0);
      for (const sp of salespeopleWithTotals) { if (!visited.has(sp.id)) cascaded.push({ ...sp, level: 0 }); }
      processed = cascaded;
    }

    // Apply table-specific filters
    let result = processed;
    if (filters.nameFilter) {
      const search = filters.nameFilter.toLowerCase();
      result = result.filter(sp => sp.name.toLowerCase().includes(search));
    }
    if (filters.regionFilter) {
      result = result.filter(sp => sp.region === filters.regionFilter);
    }

    // Sort
    if (filters.sortField) {
      const dir = filters.sortDirection === 'asc' ? 1 : -1;
      result = [...result].sort((a: any, b: any) => {
        let aVal = a[filters.sortField!];
        let bVal = b[filters.sortField!];
        if (typeof aVal === 'string') { aVal = aVal.toLowerCase(); bVal = bVal?.toLowerCase() || ''; }
        if (typeof aVal === 'number' && typeof bVal === 'number') return (aVal - bVal) * dir;
        if (aVal < bVal) return -dir;
        if (aVal > bVal) return dir;
        return 0;
      });
    }

    return {
      salespeople: result.map(sp => ({
        id: sp.id,
        name: sp.name,
        region: sp.region,
        isManager: sp.isManager,
        level: sp.level,
        managerId: sp.managerId || null,
        quota: Math.round(sp.quota),
        closedYTD: Math.round(sp.closedYTD),
        previousYearClosed: Math.round(sp.previousYearClosed),
        pipelineValue: Math.round(sp.pipelineValue),
        unweightedPipeline: Math.round(sp.unweightedPipeline),
        forecast: Math.round(sp.forecast),
        pipelineCoverage: Math.round(sp.pipelineCoverage * 100) / 100,
        forecastAttainment: Math.round(sp.forecastAttainment * 10) / 10,
        monthlyAttainment: sp.monthlyAttainment,
      })),
    };
  }
}
