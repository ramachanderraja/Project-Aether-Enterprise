import { Injectable } from '@nestjs/common';
import { DataService } from '../../data/data.service';
import {
  ARRSnapshotRecord,
  PipelineSnapshotRecord,
  SOWMappingRecord,
} from '../../data/dto';
import { RevenueFilterDto, MovementFilterDto, CustomerMovementFilterDto, CustomerListFilterDto } from '../dto/filters.dto';

// ── Helpers ──

function normalizeRegion(raw: string): string {
  const map: Record<string, string> = {
    NA: 'North America', EU: 'Europe', ME: 'Middle East',
    APAC: 'APAC', LA: 'LATAM', LATAM: 'LATAM', Global: 'Global',
  };
  return map[raw?.trim()] || raw?.trim() || '';
}

function getPriorMonth(): string {
  const now = new Date();
  const prior = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return `${prior.getFullYear()}-${String(prior.getMonth() + 1).padStart(2, '0')}`;
}

function formatMonthLabel(yyyyMm: string): string {
  const [y, m] = yyyyMm.split('-');
  const date = new Date(parseInt(y), parseInt(m) - 1, 1);
  return date.toLocaleString('en-US', { month: 'short', year: 'numeric' });
}

function classifyPlatform(quantumSmart: string | undefined, quantumGoLiveDate: string | undefined, snapshotMonth: string): 'Quantum' | 'SMART' {
  if (quantumGoLiveDate) return snapshotMonth >= quantumGoLiveDate ? 'Quantum' : 'SMART';
  return (quantumSmart as 'Quantum' | 'SMART') || 'SMART';
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTH_NAME_TO_NUM: Record<string, string> = {
  Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06',
  Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12',
};

const COLORS = {
  primary: '#3b82f6', success: '#10b981', warning: '#f59e0b',
  danger: '#ef4444', purple: '#8b5cf6', gray: '#6b7280',
};

// ── Internal types ──

interface Customer {
  id: string;
  name: string;
  sowId: string;
  currentARR: number;
  previousARR: number;
  region: string;
  vertical: string;
  segment: string;
  platform: string;
  quantumSmart: string;
  quantumGoLiveDate?: string;
  feesType: string;
  products: string[];
  productARR: Record<string, number>;
  productSubCategory: string;
  contractStartDate: string;
  contractEndDate: string;
  renewalDate: string;
  renewalRiskLevel?: string;
  movementType: string;
}

@Injectable()
export class RevenueComputeService {
  private customerPlatformMapCache: Map<string, { quantumSmart: string; goLiveDate: string | undefined }> | null = null;

  constructor(private readonly dataService: DataService) {}

  // ─────────────────────────────────────────────
  // CUSTOMER BUILDING
  // ─────────────────────────────────────────────

  private buildCustomers(): Customer[] {
    const arrSnapshots = this.dataService.getArrSnapshots();
    const sowMappings = this.dataService.getSowMappings();
    const arrSubCats = this.dataService.getArrSubCategoryBreakdown();

    const sowIndex: Record<string, SOWMappingRecord> = {};
    sowMappings.forEach(m => { if (m.SOW_ID) sowIndex[m.SOW_ID] = m; });

    const prodCatIndex = this.buildProdCatIndex();

    const priorMonth = getPriorMonth();
    const year = new Date().getFullYear();

    // Group ARR snapshots by SOW_ID, only months <= prior month
    const sowGroups = new Map<string, ARRSnapshotRecord[]>();
    arrSnapshots.forEach(row => {
      const rowMonth = row.Snapshot_Month.slice(0, 7);
      if (rowMonth > priorMonth) return;
      if (!sowGroups.has(row.SOW_ID)) sowGroups.set(row.SOW_ID, []);
      sowGroups.get(row.SOW_ID)!.push(row);
    });

    const result: Customer[] = [];

    sowGroups.forEach((rows, sowId) => {
      rows.sort((a, b) => b.Snapshot_Month.localeCompare(a.Snapshot_Month));
      const latest = rows[0];
      const previous = rows.length > 1 ? rows[1] : null;

      const currentARR = latest.Ending_ARR;
      const previousARR = previous ? previous.Ending_ARR : latest.Starting_ARR;

      const sowMapping = sowIndex[sowId];
      const region = latest.Region || (sowMapping ? normalizeRegion(sowMapping.Region) : 'North America');
      const vertical = latest.Vertical || (sowMapping ? sowMapping.Vertical : 'Other Services');
      const segment = latest.Segment || (sowMapping ? sowMapping.Segment_Type : 'Enterprise');
      const feesType = sowMapping?.Fees_Type || 'Fees';

      let movementType = 'Flat';
      if (latest.New_ARR > 0) movementType = 'New';
      else if (latest.Expansion_ARR > 0) movementType = 'Expansion';
      else if (Math.abs(latest.Schedule_Change) > 0) movementType = 'ScheduleChange';
      else if (latest.Contraction_ARR < 0) movementType = 'Contraction';
      else if (latest.Churn_ARR < 0) movementType = 'Churn';

      // Products
      const subCats = arrSubCats.filter(s => s.SOW_ID === sowId);
      const prods = subCats.map(s => s.Product_Sub_Category).filter(Boolean);
      const productARR: Record<string, number> = {};
      subCats.forEach(s => {
        const pct = year <= 2024 ? s.Pct_2024 : year === 2025 ? s.Pct_2025 : s.Pct_2026;
        if (pct > 0) productARR[s.Product_Sub_Category] = Math.round(currentARR * (pct / 100));
      });

      const productSubCategory = prods.length > 0
        ? prods.sort((a, b) => (productARR[b] || 0) - (productARR[a] || 0))[0]
        : 'Unallocated';

      let renewalRiskLevel: string | undefined;
      if (latest.Renewal_Risk) {
        const riskMap: Record<string, string> = { Low: 'Low', Medium: 'Medium', High: 'High', Critical: 'Critical' };
        renewalRiskLevel = riskMap[latest.Renewal_Risk] || latest.Renewal_Risk;
      }

      const qSmart = latest.Quantum_SMART === 'Quantum' ? 'Quantum' : 'SMART';

      result.push({
        id: `CUST-${sowId}`,
        name: latest.Customer_Name,
        sowId: String(sowId),
        currentARR: Math.round(currentARR),
        previousARR: Math.round(previousARR),
        region,
        vertical,
        segment: segment === 'SMB' ? 'SMB' : 'Enterprise',
        platform: latest.Quantum_SMART || 'SMART',
        quantumSmart: qSmart,
        quantumGoLiveDate: latest.Quantum_GoLive_Date || undefined,
        feesType,
        products: prods.length > 0 ? prods : [productSubCategory],
        productARR,
        productSubCategory,
        contractStartDate: latest.Contract_Start_Date || sowMapping?.Start_Date || '2022-01-01',
        contractEndDate: latest.Contract_End_Date || '2026-12-31',
        renewalDate: latest.Contract_End_Date || '2026-12-31',
        renewalRiskLevel,
        movementType,
      });
    });

    return result;
  }

  // ─────────────────────────────────────────────
  // FILTERING
  // ─────────────────────────────────────────────

  private filterCustomers(customers: Customer[], filters: RevenueFilterDto): Customer[] {
    const currentMonth = new Date().toISOString().slice(0, 7);

    return customers.filter(c => {
      if (filters.region?.length && !filters.region.includes(c.region)) return false;
      if (filters.vertical?.length && !filters.vertical.includes(c.vertical)) return false;
      if (filters.segment?.length && !filters.segment.includes(c.segment)) return false;
      if (filters.platform?.length && !filters.platform.includes(c.platform)) return false;

      if (filters.quantumSmart && filters.quantumSmart !== 'All') {
        const effectivePlatform = classifyPlatform(c.quantumSmart, c.quantumGoLiveDate, currentMonth);
        if (effectivePlatform !== filters.quantumSmart) return false;
      }

      return true;
    });
  }

  private arrRowPassesFilters(row: ARRSnapshotRecord, filters: RevenueFilterDto): boolean {
    const sowIndex = this.buildSowIndex();
    const sowMapping = sowIndex[row.SOW_ID];
    const rowRegion = row.Region || (sowMapping ? normalizeRegion(sowMapping.Region) : '');
    const rowVertical = row.Vertical || (sowMapping ? sowMapping.Vertical : '');
    const rowSegment = row.Segment || (sowMapping ? sowMapping.Segment_Type : '');

    if (filters.region?.length && !filters.region.includes(rowRegion)) return false;
    if (filters.vertical?.length && !filters.vertical.includes(rowVertical)) return false;
    if (filters.segment?.length && !filters.segment.includes(rowSegment)) return false;
    if (filters.platform?.length && !filters.platform.includes(row.Quantum_SMART || 'SMART')) return false;
    if (filters.quantumSmart && filters.quantumSmart !== 'All') {
      // Use the row's own snapshot month for classification, not today's date
      // A customer with Go-Live in Mar'26 should be SMART in Jan'26 but Quantum in Apr'26
      const rowSnapshotMonth = row.Snapshot_Month.slice(0, 7);
      const effectivePlatform = classifyPlatform(
        row.Quantum_SMART || undefined,
        row.Quantum_GoLive_Date || undefined,
        rowSnapshotMonth,
      );
      if (effectivePlatform !== filters.quantumSmart) return false;
    }
    return true;
  }

  private buildCustomerPlatformMap(): Map<string, { quantumSmart: string; goLiveDate: string | undefined }> {
    if (this.customerPlatformMapCache) return this.customerPlatformMapCache;

    const arrSnapshots = this.dataService.getArrSnapshots();
    const customerNameMappings = this.dataService.getCustomerNameMappings();

    // Scan ALL months, keeping the latest entry per customer.
    // This ensures churned customers who still have pipeline deals are correctly classified.
    const monthTracker = new Map<string, string>(); // customer -> latest month seen
    const map = new Map<string, { quantumSmart: string; goLiveDate: string | undefined }>();
    arrSnapshots.forEach(row => {
      const m = row.Snapshot_Month.slice(0, 7);
      const prev = monthTracker.get(row.Customer_Name);
      if (!prev || m > prev) {
        monthTracker.set(row.Customer_Name, m);
        map.set(row.Customer_Name, {
          quantumSmart: row.Quantum_SMART || 'SMART',
          goLiveDate: row.Quantum_GoLive_Date || undefined,
        });
      }
    });

    // Also index by pipeline customer name using reverse name mapping
    // customerNameMappings: ARR_Customer_Name -> Pipeline_Customer_Name
    customerNameMappings.forEach(m => {
      const arrInfo = map.get(m.ARR_Customer_Name);
      if (arrInfo && m.Pipeline_Customer_Name && !map.has(m.Pipeline_Customer_Name)) {
        map.set(m.Pipeline_Customer_Name, arrInfo);
      }
    });

    this.customerPlatformMapCache = map;
    return map;
  }

  private pipelineRowPassesFilters(row: PipelineSnapshotRecord, filters: RevenueFilterDto): boolean {
    if (filters.region?.length && !filters.region.includes(row.Region)) return false;
    if (filters.vertical?.length && !filters.vertical.includes(row.Vertical)) return false;
    if (filters.segment?.length && row.Segment && !filters.segment.includes(row.Segment)) return false;

    if (filters.quantumSmart && filters.quantumSmart !== 'All') {
      const logoType = row.Logo_Type.trim();
      let dealPlatform: 'Quantum' | 'SMART';
      if (logoType === 'New Logo' || logoType === 'New') {
        dealPlatform = 'Quantum';
      } else {
        const platformMap = this.buildCustomerPlatformMap();
        const custInfo = platformMap.get(row.Customer_Name);
        if (custInfo) {
          // Use the deal's Expected_Close_Date for classification, not today's date.
          // A customer with Go-Live Mar'26 should be SMART for deals closing Feb'26
          // but Quantum for deals closing Nov'26.
          const dealMonth = row.Expected_Close_Date.slice(0, 7);
          dealPlatform = classifyPlatform(custInfo.quantumSmart, custInfo.goLiveDate, dealMonth);
        } else {
          dealPlatform = 'Quantum';
        }
      }
      if (dealPlatform !== filters.quantumSmart) return false;
    }

    return true;
  }

  private buildSowIndex(): Record<string, SOWMappingRecord> {
    const sowMappings = this.dataService.getSowMappings();
    const index: Record<string, SOWMappingRecord> = {};
    sowMappings.forEach(m => { if (m.SOW_ID) index[m.SOW_ID] = m; });
    return index;
  }

  private buildProdCatIndex(): Record<string, string> {
    const mapping = this.dataService.getProductCategoryMapping();
    const index: Record<string, string> = {};
    mapping.forEach(m => { if (m.Product_Sub_Category) index[m.Product_Sub_Category] = m.Product_Category; });
    return index;
  }

  private getSelectedARRMonth(filters: RevenueFilterDto): string {
    const priorDate = new Date();
    priorDate.setMonth(priorDate.getMonth() - 1);
    const defaultMonth = String(priorDate.getMonth() + 1).padStart(2, '0');

    const year = filters.year?.length ? filters.year[0] : String(priorDate.getFullYear());
    const month = filters.month?.length ? (MONTH_NAME_TO_NUM[filters.month[0]] || defaultMonth) : defaultMonth;
    return `${year}-${month}`;
  }

  // ─────────────────────────────────────────────
  // PUBLIC API METHODS
  // ─────────────────────────────────────────────

  getOverviewMetrics(filters: RevenueFilterDto) {
    const arrSnapshots = this.dataService.getArrSnapshots();
    const pipelineSnapshots = this.dataService.getPipelineSnapshots();
    const selectedARRMonth = this.getSelectedARRMonth(filters);
    const priorMonth = getPriorMonth();

    // Current ARR
    let snapshotCurrentARR = 0;
    arrSnapshots.forEach(row => {
      if (row.Snapshot_Month.slice(0, 7) === selectedARRMonth && this.arrRowPassesFilters(row, filters)) {
        snapshotCurrentARR += row.Ending_ARR;
      }
    });
    snapshotCurrentARR = Math.round(snapshotCurrentARR);

    // Previous ARR
    const [y, m] = selectedARRMonth.split('-').map(Number);
    const prevDate = new Date(y, m - 2, 1);
    const prevMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
    let snapshotPreviousARR = 0;
    arrSnapshots.forEach(row => {
      if (row.Snapshot_Month.slice(0, 7) === prevMonth && this.arrRowPassesFilters(row, filters)) {
        snapshotPreviousARR += row.Ending_ARR;
      }
    });
    snapshotPreviousARR = Math.round(snapshotPreviousARR);

    const ytdGrowth = snapshotPreviousARR > 0 ? ((snapshotCurrentARR - snapshotPreviousARR) / snapshotPreviousARR) * 100 : 0;

    // Monthly retention components
    let expansion = 0, contraction = 0, churn = 0, scheduleChange = 0, monthNewBusiness = 0;
    arrSnapshots.forEach(row => {
      if (row.Snapshot_Month.slice(0, 7) === selectedARRMonth && this.arrRowPassesFilters(row, filters)) {
        expansion += row.Expansion_ARR;
        contraction += Math.abs(row.Contraction_ARR);
        churn += Math.abs(row.Churn_ARR);
        scheduleChange += row.Schedule_Change;
        monthNewBusiness += row.New_ARR;
      }
    });

    // For forecast months: Ending_ARR already has all movements baked in.
    // Subtract New Business (not a retention metric), add pipeline forecast for this month.
    // For actual months: use standard formula with movement components.
    const isForecastMonth = selectedARRMonth > priorMonth;
    let monthlyNRR: number, monthlyGRR: number;
    if (isForecastMonth) {
      let latestSnapshotMonth = '';
      pipelineSnapshots.forEach(row => { if (row.Snapshot_Month > latestSnapshotMonth) latestSnapshotMonth = row.Snapshot_Month; });
      let forecastRenewalExt = 0, forecastUpsellCrossSell = 0;
      pipelineSnapshots.forEach(row => {
        if (row.Snapshot_Month !== latestSnapshotMonth) return;
        if (row.Current_Stage.includes('Closed Won') || row.Current_Stage.includes('Closed Lost') ||
            row.Current_Stage.includes('Closed Dead') || row.Current_Stage.includes('Closed Declined')) return;
        if (!this.pipelineRowPassesFilters(row, filters)) return;
        const closeMonth = row.Expected_Close_Date.slice(0, 7);
        if (closeMonth !== selectedARRMonth) return;
        const logoType = row.Logo_Type.trim();
        if (logoType === 'Renewal' || logoType === 'Extension') forecastRenewalExt += row.License_ACV;
        else if (logoType === 'Upsell' || logoType === 'Cross-Sell') forecastUpsellCrossSell += row.License_ACV;
      });

      monthlyNRR = snapshotPreviousARR > 0
        ? ((snapshotCurrentARR - monthNewBusiness + forecastRenewalExt + forecastUpsellCrossSell) / snapshotPreviousARR) * 100 : 0;
      monthlyGRR = snapshotPreviousARR > 0
        ? ((snapshotCurrentARR - monthNewBusiness + forecastRenewalExt) / snapshotPreviousARR) * 100 : 0;
    } else {
      monthlyNRR = snapshotPreviousARR > 0
        ? ((snapshotPreviousARR + expansion + scheduleChange - contraction - churn) / snapshotPreviousARR) * 100 : 0;
      monthlyGRR = snapshotPreviousARR > 0
        ? ((snapshotPreviousARR + scheduleChange - contraction - churn) / snapshotPreviousARR) * 100 : 0;
    }

    // Year-end forecast
    const yearEndARR = this.computeForecastARR(filters, arrSnapshots, pipelineSnapshots);

    // Month forecast
    const monthForecast = this.computeMonthForecastARR(filters, arrSnapshots, pipelineSnapshots);

    // Full-year NRR/GRR
    const fullYear = this.computeFullYearRetention(filters, arrSnapshots, pipelineSnapshots, yearEndARR);

    const yearEndGrowth = snapshotCurrentARR > 0 ? ((yearEndARR - snapshotCurrentARR) / snapshotCurrentARR) * 100 : 0;
    const monthForecastGrowth = snapshotCurrentARR > 0 ? ((monthForecast - snapshotCurrentARR) / snapshotCurrentARR) * 100 : 0;

    return {
      currentARR: snapshotCurrentARR,
      previousARR: snapshotPreviousARR,
      ytdGrowth: Math.round(ytdGrowth * 10) / 10,
      yearEndARR: Math.round(yearEndARR),
      yearEndGrowth: Math.round(yearEndGrowth * 10) / 10,
      monthForecast: Math.round(monthForecast),
      monthForecastGrowth: Math.round(monthForecastGrowth * 10) / 10,
      monthlyNRR: Math.round(monthlyNRR * 10) / 10,
      monthlyGRR: Math.round(monthlyGRR * 10) / 10,
      fullYearNRR: Math.round(fullYear.nrr * 10) / 10,
      fullYearGRR: Math.round(fullYear.grr * 10) / 10,
      expansion: Math.round(expansion),
      contraction: Math.round(contraction),
      churn: Math.round(churn),
      scheduleChange: Math.round(scheduleChange),
      currentARRMonthLabel: formatMonthLabel(selectedARRMonth),
    };
  }

  private computeForecastARR(filters: RevenueFilterDto, arrSnapshots: ARRSnapshotRecord[], pipelineSnapshots: PipelineSnapshotRecord[]): number {
    const priorMonth = getPriorMonth();
    const priorDate = new Date();
    priorDate.setMonth(priorDate.getMonth() - 1);
    const filteredYear = filters.year?.length ? filters.year[0] : String(priorDate.getFullYear());
    const decOfYear = `${filteredYear}-12`;

    if (decOfYear <= priorMonth) {
      let total = 0;
      arrSnapshots.forEach(row => {
        if (row.Snapshot_Month.slice(0, 7) === decOfYear && this.arrRowPassesFilters(row, filters)) total += row.Ending_ARR;
      });
      return Math.round(total);
    }

    let lastActualARR = 0;
    const actualMonthMap = new Map<string, number>();
    arrSnapshots.forEach(row => {
      const rowMonth = row.Snapshot_Month.slice(0, 7);
      if (this.arrRowPassesFilters(row, filters)) {
        actualMonthMap.set(rowMonth, (actualMonthMap.get(rowMonth) || 0) + row.Ending_ARR);
      }
    });
    // lastActualARR = fallback from the latest actual month (≤ priorMonth)
    const sortedActualMonths = Array.from(actualMonthMap.entries())
      .filter(([m]) => m <= priorMonth)
      .sort((a, b) => a[0].localeCompare(b[0]));
    if (sortedActualMonths.length > 0) lastActualARR = sortedActualMonths[sortedActualMonths.length - 1][1];

    // Use Dec's snapshot ARR as base if available, else fall back to lastActualARR
    const decBaseARR = actualMonthMap.get(decOfYear) || lastActualARR;

    let latestSnapshotMonth = '';
    pipelineSnapshots.forEach(row => { if (row.Snapshot_Month > latestSnapshotMonth) latestSnapshotMonth = row.Snapshot_Month; });

    let cumulativePipeline = 0;
    pipelineSnapshots.forEach(row => {
      if (row.Snapshot_Month !== latestSnapshotMonth) return;
      if (row.Current_Stage.includes('Closed Won') || row.Current_Stage.includes('Closed Lost') ||
          row.Current_Stage.includes('Closed Dead') || row.Current_Stage.includes('Closed Declined')) return;
      if (!this.pipelineRowPassesFilters(row, filters)) return;
      const closeMonth = row.Expected_Close_Date.slice(0, 7);
      if (closeMonth > priorMonth && closeMonth <= decOfYear) cumulativePipeline += row.License_ACV;
    });

    return Math.round(decBaseARR + cumulativePipeline);
  }

  private computeMonthForecastARR(filters: RevenueFilterDto, arrSnapshots: ARRSnapshotRecord[], pipelineSnapshots: PipelineSnapshotRecord[]): number {
    const priorMonth = getPriorMonth();
    const selectedARRMonth = this.getSelectedARRMonth(filters);

    if (selectedARRMonth <= priorMonth) {
      let total = 0;
      arrSnapshots.forEach(row => {
        if (row.Snapshot_Month.slice(0, 7) === selectedARRMonth && this.arrRowPassesFilters(row, filters)) total += row.Ending_ARR;
      });
      return Math.round(total);
    }

    let lastActualARR = 0;
    const actualMonthMap = new Map<string, number>();
    arrSnapshots.forEach(row => {
      const rowMonth = row.Snapshot_Month.slice(0, 7);
      if (this.arrRowPassesFilters(row, filters)) {
        actualMonthMap.set(rowMonth, (actualMonthMap.get(rowMonth) || 0) + row.Ending_ARR);
      }
    });
    // lastActualARR = fallback from the latest actual month (≤ priorMonth)
    const sortedActualMonths = Array.from(actualMonthMap.entries())
      .filter(([m]) => m <= priorMonth)
      .sort((a, b) => a[0].localeCompare(b[0]));
    if (sortedActualMonths.length > 0) lastActualARR = sortedActualMonths[sortedActualMonths.length - 1][1];

    // Use selected month's snapshot ARR as base if available, else fall back to lastActualARR
    const monthBaseARR = actualMonthMap.get(selectedARRMonth) || lastActualARR;

    let latestSnapshotMonth = '';
    pipelineSnapshots.forEach(row => { if (row.Snapshot_Month > latestSnapshotMonth) latestSnapshotMonth = row.Snapshot_Month; });

    let cumulativePipeline = 0;
    pipelineSnapshots.forEach(row => {
      if (row.Snapshot_Month !== latestSnapshotMonth) return;
      if (row.Current_Stage.includes('Closed Won') || row.Current_Stage.includes('Closed Lost') ||
          row.Current_Stage.includes('Closed Dead') || row.Current_Stage.includes('Closed Declined')) return;
      if (!this.pipelineRowPassesFilters(row, filters)) return;
      const closeMonth = row.Expected_Close_Date.slice(0, 7);
      if (closeMonth > priorMonth && closeMonth <= selectedARRMonth) cumulativePipeline += row.License_ACV;
    });

    return Math.round(monthBaseARR + cumulativePipeline);
  }

  private computeFullYearRetention(filters: RevenueFilterDto, arrSnapshots: ARRSnapshotRecord[], pipelineSnapshots: PipelineSnapshotRecord[], forecastARR: number) {
    const priorDate = new Date();
    priorDate.setMonth(priorDate.getMonth() - 1);
    const yr = filters.year?.length ? filters.year[0] : String(priorDate.getFullYear());
    const priorMonth = getPriorMonth();
    const janOfYear = `${yr}-01`;
    const isForecastYear = `${yr}-12` > priorMonth;

    let startARR = 0;
    arrSnapshots.forEach(row => {
      if (row.Snapshot_Month.slice(0, 7) === janOfYear && this.arrRowPassesFilters(row, filters)) startARR += row.Ending_ARR;
    });

    let actualExpansion = 0, actualScheduleChange = 0, actualContraction = 0, actualChurn = 0, actualNewBusiness = 0;
    arrSnapshots.forEach(row => {
      const rowMonth = row.Snapshot_Month.slice(0, 7);
      if (rowMonth.startsWith(yr) && rowMonth <= priorMonth && this.arrRowPassesFilters(row, filters)) {
        actualExpansion += row.Expansion_ARR;
        actualScheduleChange += row.Schedule_Change;
        actualContraction += Math.abs(row.Contraction_ARR);
        actualChurn += Math.abs(row.Churn_ARR);
        actualNewBusiness += row.New_ARR;
      }
    });

    let forecastRenewalExt = 0, forecastUpsellCrossSell = 0;
    let decActualARR = 0;
    const decOfYear = `${yr}-12`;

    // For past years: end point is Jan of next year's Ending_ARR
    let endARRJanNext = 0;
    if (!isForecastYear) {
      const nextYr = String(parseInt(yr) + 1);
      const janNextYear = `${nextYr}-01`;
      arrSnapshots.forEach(row => {
        if (row.Snapshot_Month.slice(0, 7) === janNextYear && this.arrRowPassesFilters(row, filters)) endARRJanNext += row.Ending_ARR;
      });
    }

    if (isForecastYear) {
      // Get Dec ending ARR from snapshot data (already includes all actual movements)
      arrSnapshots.forEach(row => {
        if (row.Snapshot_Month.slice(0, 7) === decOfYear && this.arrRowPassesFilters(row, filters)) decActualARR += row.Ending_ARR;
      });

      let latestSnapshotMonth = '';
      pipelineSnapshots.forEach(row => { if (row.Snapshot_Month > latestSnapshotMonth) latestSnapshotMonth = row.Snapshot_Month; });
      pipelineSnapshots.forEach(row => {
        if (row.Snapshot_Month !== latestSnapshotMonth) return;
        if (row.Current_Stage.includes('Closed Won') || row.Current_Stage.includes('Closed Lost') ||
            row.Current_Stage.includes('Closed Dead') || row.Current_Stage.includes('Closed Declined')) return;
        if (!this.pipelineRowPassesFilters(row, filters)) return;
        const closeMonth = row.Expected_Close_Date.slice(0, 7);
        if (closeMonth <= priorMonth || !closeMonth.startsWith(yr)) return;
        const logoType = row.Logo_Type.trim();
        if (logoType === 'Renewal' || logoType === 'Extension') forecastRenewalExt += row.License_ACV;
        else if (logoType === 'Upsell' || logoType === 'Cross-Sell') forecastUpsellCrossSell += row.License_ACV;
      });
    }

    // Forecast year: Dec ARR already has all movements baked in, so subtract New Business
    // (retention metrics shouldn't include new logos) and add pipeline forecast on top.
    // Past years: use Jan(year+1) Ending_ARR — subtract New Business and (for GRR) Expansion.
    const nrr = startARR > 0
      ? isForecastYear
        ? ((decActualARR - actualNewBusiness + forecastRenewalExt + forecastUpsellCrossSell) / startARR) * 100
        : ((endARRJanNext - actualNewBusiness) / startARR) * 100
      : 0;
    const grr = startARR > 0
      ? isForecastYear
        ? ((decActualARR - actualNewBusiness + forecastRenewalExt) / startARR) * 100
        : ((endARRJanNext - actualNewBusiness - actualExpansion) / startARR) * 100
      : 0;

    const endARRDisplay = isForecastYear ? forecastARR : endARRJanNext;

    return { startARR: Math.round(startARR), endARR: Math.round(endARRDisplay), nrr, grr };
  }

  getOverviewArrTrend(filters: RevenueFilterDto) {
    const arrSnapshots = this.dataService.getArrSnapshots();
    const pipelineSnapshots = this.dataService.getPipelineSnapshots();
    const priorMonth = getPriorMonth();

    // Aggregate actual ARR by month (ALL months, not just ≤ priorMonth)
    // Months > priorMonth provide the base ARR for forecasting
    const actualMonthMap = new Map<string, number>();
    arrSnapshots.forEach(row => {
      const month = row.Snapshot_Month.slice(0, 7);
      if (this.arrRowPassesFilters(row, filters)) {
        actualMonthMap.set(month, (actualMonthMap.get(month) || 0) + row.Ending_ARR);
      }
    });

    const data: Array<{
      month: string; currentARR: number; forecastedARR: number | null;
      forecastBase: number | null; forecastRenewals: number | null; forecastNewBusiness: number | null;
    }> = [];

    const startDate = new Date(2024, 0, 1);
    const priorDate = new Date(parseInt(priorMonth.slice(0, 4)), parseInt(priorMonth.slice(5, 7)) - 1, 1);

    let lastActualARR = 0;
    const cursor = new Date(startDate);
    while (cursor <= priorDate) {
      const ym = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = cursor.toLocaleString('en-US', { month: 'short', year: '2-digit' });
      const endingARR = actualMonthMap.get(ym) || 0;
      if (endingARR > 0) lastActualARR = endingARR;
      data.push({ month: monthLabel, currentARR: Math.round(endingARR), forecastedARR: null, forecastBase: null, forecastRenewals: null, forecastNewBusiness: null });
      cursor.setMonth(cursor.getMonth() + 1);
    }

    // Pipeline forecast
    let latestSnapshotMonth = '';
    pipelineSnapshots.forEach(row => { if (row.Snapshot_Month > latestSnapshotMonth) latestSnapshotMonth = row.Snapshot_Month; });

    const RENEWAL_TYPES = new Set(['Renewal', 'Extension']);
    const renewalByMonth = new Map<string, number>();
    const newBizByMonth = new Map<string, number>();
    pipelineSnapshots.forEach(row => {
      if (row.Snapshot_Month !== latestSnapshotMonth) return;
      if (row.Current_Stage.includes('Closed Won') || row.Current_Stage.includes('Closed Lost') ||
          row.Current_Stage.includes('Closed Dead') || row.Current_Stage.includes('Closed Declined')) return;
      if (!this.pipelineRowPassesFilters(row, filters)) return;
      const closeMonth = row.Expected_Close_Date.slice(0, 7);
      if (closeMonth <= priorMonth) return;
      const logoType = row.Logo_Type.trim();
      if (RENEWAL_TYPES.has(logoType)) renewalByMonth.set(closeMonth, (renewalByMonth.get(closeMonth) || 0) + row.License_ACV);
      else newBizByMonth.set(closeMonth, (newBizByMonth.get(closeMonth) || 0) + row.License_ACV);
    });

    const endDate = new Date(2026, 11, 1);
    const forecastStart = new Date(priorDate);
    forecastStart.setMonth(forecastStart.getMonth() + 1);

    let cumulativeRenewals = 0, cumulativeNewBiz = 0;
    const fc = new Date(forecastStart);
    while (fc <= endDate) {
      const ym = `${fc.getFullYear()}-${String(fc.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = fc.toLocaleString('en-US', { month: 'short', year: '2-digit' });
      cumulativeRenewals += (renewalByMonth.get(ym) || 0);
      cumulativeNewBiz += (newBizByMonth.get(ym) || 0);
      // Use per-month actual ARR as base (from snapshot) if available, else fall back to lastActualARR
      const monthBaseARR = actualMonthMap.get(ym) || lastActualARR;
      const totalForecast = monthBaseARR + cumulativeRenewals + cumulativeNewBiz;
      data.push({
        month: monthLabel, currentARR: 0,
        forecastedARR: Math.round(totalForecast),
        forecastBase: Math.round(monthBaseARR),
        forecastRenewals: Math.round(cumulativeRenewals),
        forecastNewBusiness: Math.round(cumulativeNewBiz),
      });
      fc.setMonth(fc.getMonth() + 1);
    }

    return { months: data };
  }

  getOverviewArrByDimension(filters: RevenueFilterDto) {
    const customers = this.filterCustomers(this.buildCustomers(), filters);
    const prodCatIndex = this.buildProdCatIndex();

    const byRegion: Record<string, number> = {};
    const byVertical: Record<string, number> = {};
    const byCategory: Record<string, number> = {};

    customers.forEach(c => {
      byRegion[c.region] = (byRegion[c.region] || 0) + c.currentARR;
      byVertical[c.vertical] = (byVertical[c.vertical] || 0) + c.currentARR;
      Object.entries(c.productARR).forEach(([subCategory, arr]) => {
        const category = prodCatIndex[subCategory] || 'Other';
        byCategory[category] = (byCategory[category] || 0) + arr;
      });
    });

    return {
      byRegion: Object.entries(byRegion).map(([name, value]) => ({ name, value: Math.round(value) })).sort((a, b) => b.value - a.value),
      byVertical: Object.entries(byVertical).map(([name, value]) => ({ name, value: Math.round(value) })).sort((a, b) => b.value - a.value),
      byCategory: Object.entries(byCategory).map(([name, value]) => ({ name, value: Math.round(value) })).sort((a, b) => b.value - a.value),
    };
  }

  getMovementSummary(filters: MovementFilterDto) {
    const arrSnapshots = this.dataService.getArrSnapshots();
    const months = filters.lookbackPeriod || 1;
    const selectedARRMonth = this.getSelectedARRMonth(filters);

    const endMonth = selectedARRMonth;
    const endYear = parseInt(endMonth.slice(0, 4));
    const endMon = parseInt(endMonth.slice(5, 7));
    const startDate = new Date(endYear, endMon - 1 - (months - 1), 1);
    const startMonth = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}`;

    // Collect months in range
    const monthsInRange: string[] = [];
    const cursor = new Date(startDate);
    const endDate = new Date(endYear, endMon - 1, 1);
    while (cursor <= endDate) {
      monthsInRange.push(`${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`);
      cursor.setMonth(cursor.getMonth() + 1);
    }

    const monthAggregates = new Map<string, {
      starting: number; newBiz: number; expansion: number;
      scheduleChange: number; contraction: number; churn: number; ending: number;
    }>();
    monthsInRange.forEach(m => {
      monthAggregates.set(m, { starting: 0, newBiz: 0, expansion: 0, scheduleChange: 0, contraction: 0, churn: 0, ending: 0 });
    });

    arrSnapshots.forEach(row => {
      const rowMonth = row.Snapshot_Month.slice(0, 7);
      if (!monthAggregates.has(rowMonth)) return;
      if (!this.arrRowPassesFilters(row, filters)) return;
      const agg = monthAggregates.get(rowMonth)!;
      agg.starting += row.Starting_ARR;
      agg.newBiz += row.New_ARR;
      agg.expansion += row.Expansion_ARR;
      agg.scheduleChange += row.Schedule_Change;
      agg.contraction += row.Contraction_ARR;
      agg.churn += row.Churn_ARR;
      agg.ending += row.Ending_ARR;
    });

    const firstMonthAgg = monthAggregates.get(monthsInRange[0]);
    const lastMonthAgg = monthAggregates.get(monthsInRange[monthsInRange.length - 1]);

    const startingARR = Math.round(firstMonthAgg?.starting || 0);
    const endingARR = Math.round(lastMonthAgg?.ending || 0);

    let totalNewBiz = 0, totalExpansion = 0, totalScheduleChange = 0, totalContraction = 0, totalChurn = 0;
    monthAggregates.forEach(agg => {
      totalNewBiz += agg.newBiz;
      totalExpansion += agg.expansion;
      totalScheduleChange += agg.scheduleChange;
      totalContraction += agg.contraction;
      totalChurn += agg.churn;
    });

    const newBusiness = Math.round(totalNewBiz);
    const expansionVal = Math.round(totalExpansion);
    const scheduleChangeVal = Math.round(totalScheduleChange);
    const contractionVal = Math.round(-Math.abs(totalContraction));
    const churnVal = Math.round(-Math.abs(totalChurn));

    // Build waterfall
    const waterfall = this.buildWaterfall(startingARR, endingARR, {
      newBusiness, expansion: expansionVal, scheduleChange: scheduleChangeVal,
      contraction: contractionVal, churn: churnVal,
    });

    return {
      startingARR, endingARR,
      newBusiness, expansion: expansionVal, scheduleChange: scheduleChangeVal,
      contraction: contractionVal, churn: churnVal,
      waterfall,
    };
  }

  private buildWaterfall(startingARR: number, endingARR: number, totals: {
    newBusiness: number; expansion: number; scheduleChange: number; contraction: number; churn: number;
  }) {
    let runningTotal = startingARR;
    const data: Array<{ name: string; bottom: number; value: number; displayValue: number; fill: string; type: string }> = [];

    data.push({ name: 'Starting\nARR', bottom: 0, value: startingARR, displayValue: startingARR, fill: COLORS.gray, type: 'initial' });

    data.push({ name: 'New\nBusiness', bottom: runningTotal, value: totals.newBusiness, displayValue: totals.newBusiness, fill: COLORS.success, type: 'increase' });
    runningTotal += totals.newBusiness;

    data.push({ name: 'Expansion', bottom: runningTotal, value: totals.expansion, displayValue: totals.expansion, fill: COLORS.primary, type: 'increase' });
    runningTotal += totals.expansion;

    if (totals.scheduleChange >= 0) {
      data.push({ name: 'Schedule\nChange', bottom: runningTotal, value: totals.scheduleChange, displayValue: totals.scheduleChange, fill: COLORS.purple, type: 'increase' });
      runningTotal += totals.scheduleChange;
    } else {
      const abs = Math.abs(totals.scheduleChange);
      data.push({ name: 'Schedule\nChange', bottom: runningTotal - abs, value: abs, displayValue: totals.scheduleChange, fill: COLORS.purple, type: 'decrease' });
      runningTotal -= abs;
    }

    const contractionAbs = Math.abs(totals.contraction);
    data.push({ name: 'Contraction', bottom: runningTotal - contractionAbs, value: contractionAbs, displayValue: totals.contraction, fill: COLORS.warning, type: 'decrease' });
    runningTotal -= contractionAbs;

    const churnAbs = Math.abs(totals.churn);
    data.push({ name: 'Churn', bottom: runningTotal - churnAbs, value: churnAbs, displayValue: totals.churn, fill: COLORS.danger, type: 'decrease' });

    data.push({ name: 'Ending\nARR', bottom: 0, value: endingARR, displayValue: endingARR, fill: COLORS.primary, type: 'final' });

    return data;
  }

  getMovementCustomers(filters: CustomerMovementFilterDto) {
    const arrSnapshots = this.dataService.getArrSnapshots();
    const months = filters.lookbackPeriod || 1;
    const selectedARRMonth = this.getSelectedARRMonth(filters);

    const endMonth = selectedARRMonth;
    const endYear = parseInt(endMonth.slice(0, 4));
    const endMon = parseInt(endMonth.slice(5, 7));
    const startDate = new Date(endYear, endMon - 1 - (months - 1), 1);
    const startMonth = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}`;

    const customerMap = new Map<string, {
      name: string; startingARR: number; endingARR: number;
      newBiz: number; expansion: number; scheduleChange: number; contraction: number; churn: number;
    }>();

    arrSnapshots.forEach(row => {
      const rowMonth = row.Snapshot_Month.slice(0, 7);
      if (rowMonth < startMonth || rowMonth > endMonth) return;
      if (!this.arrRowPassesFilters(row, filters)) return;
      const custName = row.Customer_Name;
      if (!customerMap.has(custName)) {
        customerMap.set(custName, { name: custName, startingARR: 0, endingARR: 0, newBiz: 0, expansion: 0, scheduleChange: 0, contraction: 0, churn: 0 });
      }
      const c = customerMap.get(custName)!;
      if (rowMonth === startMonth) c.startingARR += row.Starting_ARR;
      if (rowMonth === endMonth) c.endingARR += row.Ending_ARR;
      c.newBiz += row.New_ARR;
      c.expansion += row.Expansion_ARR;
      c.scheduleChange += row.Schedule_Change;
      c.contraction += row.Contraction_ARR;
      c.churn += row.Churn_ARR;
    });

    let data = Array.from(customerMap.values())
      .map(c => {
        const change = Math.round(c.endingARR - c.startingARR);
        let movementType: string;
        if (Math.abs(c.churn) > 0 && c.endingARR === 0) movementType = 'Churn';
        else if (c.newBiz > 0 && c.startingARR === 0) movementType = 'New';
        else if (change > 0 && c.expansion > 0) movementType = 'Expansion';
        else if (c.contraction < 0 || change < 0) movementType = 'Contraction';
        else if (c.scheduleChange !== 0) movementType = 'ScheduleChange';
        else movementType = 'Flat';
        return {
          customerName: c.name,
          startingARR: Math.round(c.startingARR),
          endingARR: Math.round(c.endingARR),
          newBusiness: Math.round(c.newBiz),
          expansion: Math.round(c.expansion),
          scheduleChange: Math.round(c.scheduleChange),
          contraction: Math.round(c.contraction),
          churn: Math.round(c.churn),
          change,
          changePercent: c.startingARR > 0 ? Math.round(((c.endingARR - c.startingARR) / c.startingARR) * 1000) / 10 : (c.endingARR > 0 ? 100 : 0),
          movementType,
        };
      })
      .filter(c => c.movementType !== 'Flat' || c.change !== 0);

    // Filter by movement type
    if (filters.movementType) {
      const mt = filters.movementType;
      data = data.filter(c => {
        if (mt === 'New Business') return c.movementType === 'New';
        if (mt === 'Expansion') return c.movementType === 'Expansion';
        if (mt === 'Schedule Change') return c.movementType === 'ScheduleChange';
        if (mt === 'Contraction') return c.movementType === 'Contraction';
        if (mt === 'Churn') return c.movementType === 'Churn';
        return true;
      });
    }

    // Sort
    if (filters.sortField) {
      const dir = filters.sortDirection === 'asc' ? 1 : -1;
      data = [...data].sort((a: any, b: any) => {
        const aVal = a[filters.sortField!];
        const bVal = b[filters.sortField!];
        if (typeof aVal === 'number' && typeof bVal === 'number') return (aVal - bVal) * dir;
        return String(aVal || '').localeCompare(String(bVal || '')) * dir;
      });
    } else {
      data = data.sort((a, b) => Math.abs(b.change) - Math.abs(a.change));
    }

    return { customers: data };
  }

  getMovementTrend(filters: RevenueFilterDto) {
    const arrSnapshots = this.dataService.getArrSnapshots();
    const priorMonth = getPriorMonth();

    const monthMap = new Map<string, {
      date: string; newBusiness: number; expansion: number; scheduleChange: number; contraction: number; churn: number;
    }>();

    arrSnapshots.forEach(row => {
      const rowMonth = row.Snapshot_Month.slice(0, 7);
      if (rowMonth < '2024-01' || rowMonth > priorMonth) return;
      if (!this.arrRowPassesFilters(row, filters)) return;
      if (!monthMap.has(rowMonth)) {
        monthMap.set(rowMonth, { date: rowMonth + '-01', newBusiness: 0, expansion: 0, scheduleChange: 0, contraction: 0, churn: 0 });
      }
      const m = monthMap.get(rowMonth)!;
      m.newBusiness += row.New_ARR;
      m.expansion += row.Expansion_ARR;
      m.scheduleChange += row.Schedule_Change;
      m.contraction += row.Contraction_ARR;
      m.churn += row.Churn_ARR;
    });

    const months = Array.from(monthMap.values())
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(m => ({
        date: m.date,
        newBusiness: Math.round(m.newBusiness),
        expansion: Math.round(m.expansion),
        scheduleChange: Math.round(m.scheduleChange),
        contraction: Math.round(m.contraction),
        churn: Math.round(m.churn),
        netChange: Math.round(m.newBusiness + m.expansion + m.scheduleChange + m.contraction + m.churn),
      }));

    return { months };
  }

  getCustomersList(filters: CustomerListFilterDto) {
    const arrSnapshots = this.dataService.getArrSnapshots();
    const sowIndex = this.buildSowIndex();
    const selectedARRMonth = this.getSelectedARRMonth(filters);

    const customerMap = new Map<string, {
      totalARR: number; region: string; vertical: string; segment: string;
      sows: Array<{
        sowId: string; sowName: string; endingARR: number;
        feesType: string; contractEndDate: string; renewalRisk: string;
        contractStartDate: string; quantumSmart: string;
      }>;
    }>();

    arrSnapshots.forEach(row => {
      const rowMonth = row.Snapshot_Month.slice(0, 7);
      if (rowMonth !== selectedARRMonth) return;
      if (!this.arrRowPassesFilters(row, filters)) return;
      if (row.Ending_ARR === 0 && row.Starting_ARR === 0) return;

      const sowMapping = sowIndex[row.SOW_ID];
      const sowDetail = {
        sowId: row.SOW_ID,
        sowName: sowMapping?.SOW_Name || `SOW ${row.SOW_ID}`,
        endingARR: row.Ending_ARR,
        feesType: sowMapping?.Fees_Type || 'Fees',
        contractEndDate: row.Contract_End_Date || '',
        renewalRisk: row.Renewal_Risk || '',
        contractStartDate: row.Contract_Start_Date || sowMapping?.Start_Date || '',
        quantumSmart: row.Quantum_SMART || '',
      };

      const existing = customerMap.get(row.Customer_Name);
      if (existing) {
        existing.totalARR += row.Ending_ARR;
        existing.sows.push(sowDetail);
        if (!existing.region && (row.Region || sowMapping?.Region)) existing.region = row.Region || normalizeRegion(sowMapping?.Region || '');
        if (!existing.vertical && (row.Vertical || sowMapping?.Vertical)) existing.vertical = row.Vertical || sowMapping?.Vertical || '';
        if (!existing.segment && (row.Segment || sowMapping?.Segment_Type)) existing.segment = row.Segment || sowMapping?.Segment_Type || '';
      } else {
        customerMap.set(row.Customer_Name, {
          totalARR: row.Ending_ARR,
          region: row.Region || (sowMapping ? normalizeRegion(sowMapping.Region) : ''),
          vertical: row.Vertical || sowMapping?.Vertical || '',
          segment: row.Segment || sowMapping?.Segment_Type || '',
          sows: [sowDetail],
        });
      }
    });

    const riskOrder: Record<string, number> = { Lost: 5, 'High Risk': 4, 'Mgmt Approval': 3, 'In Process': 2, 'Win/PO': 1 };

    let customers = Array.from(customerMap.entries()).map(([customerName, data]) => {
      data.sows.sort((a, b) => b.endingARR - a.endingARR);

      let earliestRenewalDate = '';
      let highestRisk = '';
      let highestRiskOrder = 0;

      data.sows.forEach(sow => {
        if (sow.contractEndDate && (!earliestRenewalDate || sow.contractEndDate < earliestRenewalDate)) {
          earliestRenewalDate = sow.contractEndDate;
        }
        if (sow.renewalRisk) {
          const order = riskOrder[sow.renewalRisk] || 0;
          if (order > highestRiskOrder) { highestRiskOrder = order; highestRisk = sow.renewalRisk; }
        }
      });

      return {
        customerName,
        totalARR: Math.round(data.totalARR),
        region: data.region,
        vertical: data.vertical,
        segment: data.segment,
        sowCount: data.sows.length,
        earliestRenewalDate,
        highestRisk,
        sows: data.sows.map(s => ({
          sowId: s.sowId,
          sowName: s.sowName,
          endingARR: Math.round(s.endingARR),
          feesType: s.feesType,
          contractEndDate: s.contractEndDate,
          renewalRisk: s.renewalRisk,
        })),
      };
    });

    // Filter by search
    if (filters.search) {
      const search = filters.search.toLowerCase();
      customers = customers.filter(c => c.customerName.toLowerCase().includes(search));
    }

    // Filter 2026 renewals
    if (filters.renewals2026) {
      customers = customers.filter(c => c.sows.some(sow => sow.contractEndDate?.startsWith('2026')));
    }

    // Filter renewal risk
    if (filters.renewalRisk) {
      customers = customers.filter(c => c.sows.some(sow =>
        sow.contractEndDate?.startsWith('2026') && sow.renewalRisk === filters.renewalRisk,
      ));
    }

    // Sort
    if (filters.sortField) {
      const dir = filters.sortDirection === 'asc' ? 1 : -1;
      customers = [...customers].sort((a: any, b: any) => {
        const aVal = a[filters.sortField!];
        const bVal = b[filters.sortField!];
        if (typeof aVal === 'number' && typeof bVal === 'number') return (aVal - bVal) * dir;
        return String(aVal || '').localeCompare(String(bVal || '')) * dir;
      });
    } else {
      customers.sort((a, b) => b.totalARR - a.totalARR);
    }

    return { customers };
  }

  getCustomerRenewalRisk(filters: RevenueFilterDto) {
    const arrSnapshots = this.dataService.getArrSnapshots();
    const selectedARRMonth = this.getSelectedARRMonth(filters);

    // Get 2026 renewals
    const renewalData = new Map<string, { sows: Array<{ contractEndDate: string; renewalRisk: string; endingARR: number }> }>();

    arrSnapshots.forEach(row => {
      if (row.Snapshot_Month.slice(0, 7) !== selectedARRMonth) return;
      if (!this.arrRowPassesFilters(row, filters)) return;
      if (!row.Contract_End_Date?.startsWith('2026')) return;

      const existing = renewalData.get(row.Customer_Name);
      const sow = { contractEndDate: row.Contract_End_Date, renewalRisk: row.Renewal_Risk || '', endingARR: row.Ending_ARR };
      if (existing) existing.sows.push(sow);
      else renewalData.set(row.Customer_Name, { sows: [sow] });
    });

    // Risk distribution
    const distribution: Record<string, number> = {};
    renewalData.forEach(data => {
      data.sows.forEach(sow => {
        if (sow.renewalRisk && !sow.renewalRisk.startsWith('"') && sow.renewalRisk !== '#N/A') {
          distribution[sow.renewalRisk.trim()] = (distribution[sow.renewalRisk.trim()] || 0) + 1;
        }
      });
    });

    const RISK_COLORS: Record<string, string> = {
      'Win/PO': COLORS.success, 'In Process': COLORS.primary,
      'Mgmt Approval': COLORS.warning, 'High Risk': '#f97316', Lost: COLORS.danger,
    };
    const order = ['High Risk', 'Lost', 'Mgmt Approval', 'In Process', 'Win/PO'];
    const riskDistribution = Object.entries(distribution)
      .sort((a, b) => {
        const ai = order.indexOf(a[0]);
        const bi = order.indexOf(b[0]);
        return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
      })
      .map(([risk, count]) => ({ risk, count, color: RISK_COLORS[risk] || COLORS.gray }));

    // Renewal calendar
    const calendarMap = new Map<string, { sowCount: number; totalARR: number }>();
    renewalData.forEach(data => {
      data.sows.forEach(sow => {
        const month = sow.contractEndDate.slice(0, 7);
        const entry = calendarMap.get(month) || { sowCount: 0, totalARR: 0 };
        entry.sowCount++;
        entry.totalARR += sow.endingARR;
        calendarMap.set(month, entry);
      });
    });

    const renewalCalendar = Array.from(calendarMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, data]) => ({ month, sowCount: data.sowCount, totalARR: Math.round(data.totalARR) }));

    return { riskDistribution, renewalCalendar };
  }

  getProducts(filters: RevenueFilterDto & { productCategory?: string; productSubCategory?: string }) {
    const customers = this.filterCustomers(this.buildCustomers(), filters);
    const prodCatIndex = this.buildProdCatIndex();

    // Apply fees type filter if specified
    const filteredCustomers = filters.feesType && filters.feesType !== 'All'
      ? customers.filter(c => c.feesType === filters.feesType)
      : customers;

    const productMap = new Map<string, { totalARR: number; customers: Set<string>; category: string }>();

    filteredCustomers.forEach(c => {
      Object.entries(c.productARR).forEach(([product, arr]) => {
        if (!productMap.has(product)) {
          productMap.set(product, { totalARR: 0, customers: new Set(), category: prodCatIndex[product] || 'Other' });
        }
        const p = productMap.get(product)!;
        p.totalARR += arr;
        p.customers.add(c.id);
      });
    });

    let products = Array.from(productMap.entries())
      .map(([name, data]) => ({
        subCategory: name,
        category: data.category,
        totalARR: Math.round(data.totalARR),
        customerCount: data.customers.size,
        avgARRPerCustomer: data.customers.size > 0 ? Math.round(data.totalARR / data.customers.size) : 0,
      }))
      .sort((a, b) => b.totalARR - a.totalARR);

    // Apply product filters
    if (filters.productCategory && filters.productCategory !== 'All') {
      products = products.filter(p => p.category === filters.productCategory);
    }
    if (filters.productSubCategory && filters.productSubCategory !== 'All') {
      products = products.filter(p => p.subCategory === filters.productSubCategory);
    }

    return { products };
  }

  getCategorySummary(filters: RevenueFilterDto & { feesType?: string }) {
    const customers = this.filterCustomers(this.buildCustomers(), filters);
    const prodCatIndex = this.buildProdCatIndex();

    const filteredCustomers = filters.feesType && filters.feesType !== 'All'
      ? customers.filter(c => c.feesType === filters.feesType)
      : customers;

    const categoryMap = new Map<string, {
      totalARR: number; customers: Set<string>; subCategories: Set<string>;
    }>();

    filteredCustomers.forEach(c => {
      Object.entries(c.productARR).forEach(([subCat, arr]) => {
        const category = prodCatIndex[subCat] || 'Other';
        if (!categoryMap.has(category)) {
          categoryMap.set(category, { totalARR: 0, customers: new Set(), subCategories: new Set() });
        }
        const cat = categoryMap.get(category)!;
        cat.totalARR += arr;
        cat.customers.add(c.name);
        cat.subCategories.add(subCat);
      });
    });

    const categories = Array.from(categoryMap.entries())
      .map(([name, data]) => ({
        category: name,
        totalARR: Math.round(data.totalARR),
        customerCount: data.customers.size,
        subCategoryCount: data.subCategories.size,
        avgARRPerCustomer: data.customers.size > 0 ? Math.round(data.totalARR / data.customers.size) : 0,
      }))
      .sort((a, b) => b.totalARR - a.totalARR);

    const totalSubCategories = new Set<string>();
    categoryMap.forEach(data => data.subCategories.forEach(s => totalSubCategories.add(s)));

    const mostAdopted = categories.reduce(
      (best, cat) => cat.customerCount > best.count ? { name: cat.category, count: cat.customerCount } : best,
      { name: '', count: 0 },
    );

    return {
      categories,
      summary: {
        totalCategories: categories.length,
        topCategory: categories.length > 0 ? { name: categories[0].category, totalARR: categories[0].totalARR } : null,
        totalSubCategories: totalSubCategories.size,
        mostAdopted: mostAdopted.name ? { name: mostAdopted.name, customerCount: mostAdopted.count } : null,
      },
    };
  }

  getCustomerCategoryMatrix(filters: RevenueFilterDto & { feesType?: string; search?: string }) {
    const customers = this.filterCustomers(this.buildCustomers(), filters);
    const prodCatIndex = this.buildProdCatIndex();

    const filteredCustomers = filters.feesType && filters.feesType !== 'All'
      ? customers.filter(c => c.feesType === filters.feesType)
      : customers;

    // Group SOW-level customers by customer name
    const custGroupMap = new Map<string, {
      region: string; vertical: string; totalARR: number;
      categoryARR: Record<string, number>;
      sows: Array<{ sowId: string; categoryARR: Record<string, number>; totalARR: number }>;
    }>();

    filteredCustomers.forEach(c => {
      const sowCategoryARR: Record<string, number> = {};
      Object.entries(c.productARR).forEach(([subCat, arr]) => {
        const category = prodCatIndex[subCat] || 'Other';
        sowCategoryARR[category] = (sowCategoryARR[category] || 0) + arr;
      });
      const sowTotal = Object.values(sowCategoryARR).reduce((s, v) => s + v, 0);

      const existing = custGroupMap.get(c.name);
      if (existing) {
        existing.totalARR += c.currentARR;
        Object.entries(sowCategoryARR).forEach(([cat, arr]) => {
          existing.categoryARR[cat] = (existing.categoryARR[cat] || 0) + arr;
        });
        existing.sows.push({ sowId: c.sowId, categoryARR: sowCategoryARR, totalARR: Math.round(sowTotal) });
      } else {
        custGroupMap.set(c.name, {
          region: c.region,
          vertical: c.vertical,
          totalARR: c.currentARR,
          categoryARR: { ...sowCategoryARR },
          sows: [{ sowId: c.sowId, categoryARR: sowCategoryARR, totalARR: Math.round(sowTotal) }],
        });
      }
    });

    let result = Array.from(custGroupMap.entries())
      .map(([customerName, data]) => ({
        customerName,
        region: data.region,
        vertical: data.vertical,
        totalARR: Math.round(data.totalARR),
        categoryARR: Object.fromEntries(
          Object.entries(data.categoryARR).map(([k, v]) => [k, Math.round(v)]),
        ),
        sows: data.sows.map(s => ({
          sowId: s.sowId,
          categoryARR: Object.fromEntries(
            Object.entries(s.categoryARR).map(([k, v]) => [k, Math.round(v)]),
          ),
          totalARR: s.totalARR,
        })),
      }))
      .sort((a, b) => b.totalARR - a.totalARR);

    if (filters.search) {
      const search = filters.search.toLowerCase();
      result = result.filter(c => c.customerName.toLowerCase().includes(search));
    }

    const allCategories = Array.from(
      new Set(result.flatMap(c => Object.keys(c.categoryARR))),
    ).sort();

    const truncated = result.length > 50;
    return {
      data: result.slice(0, 50),
      allCategories,
      truncated,
      total: result.length,
    };
  }

  getCrossSellAnalysis(filters: RevenueFilterDto & { feesType?: string }) {
    const customers = this.filterCustomers(this.buildCustomers(), filters);
    const prodCatIndex = this.buildProdCatIndex();

    const filteredCustomers = filters.feesType && filters.feesType !== 'All'
      ? customers.filter(c => c.feesType === filters.feesType)
      : customers;

    // Group by customer name, collect unique sub-categories
    const custSubCats = new Map<string, Set<string>>();
    filteredCustomers.forEach(c => {
      if (!custSubCats.has(c.name)) custSubCats.set(c.name, new Set());
      const set = custSubCats.get(c.name)!;
      Object.keys(c.productARR).forEach(subCat => set.add(subCat));
    });

    let one = 0, two = 0, threePlus = 0;
    custSubCats.forEach(subs => {
      const count = subs.size;
      if (count === 1) one++;
      else if (count === 2) two++;
      else if (count >= 3) threePlus++;
    });

    const totalCustomers = custSubCats.size;
    const crossSellRate = totalCustomers > 0
      ? Math.round(((two + threePlus) / totalCustomers) * 1000) / 10
      : 0;

    // Category performance for scatter chart
    const categoryMap = new Map<string, { totalARR: number; customers: Set<string> }>();
    filteredCustomers.forEach(c => {
      Object.entries(c.productARR).forEach(([subCat, arr]) => {
        const category = prodCatIndex[subCat] || 'Other';
        if (!categoryMap.has(category)) categoryMap.set(category, { totalARR: 0, customers: new Set() });
        const cat = categoryMap.get(category)!;
        cat.totalARR += arr;
        cat.customers.add(c.name);
      });
    });

    const categoryPerformance = Array.from(categoryMap.entries())
      .map(([name, data]) => ({
        category: name,
        customerCount: data.customers.size,
        totalARR: Math.round(data.totalARR),
        avgARRPerCustomer: data.customers.size > 0 ? Math.round(data.totalARR / data.customers.size) : 0,
      }))
      .sort((a, b) => b.totalARR - a.totalARR);

    return {
      distribution: [
        { name: '1 Sub-Category', count: one },
        { name: '2 Sub-Categories', count: two },
        { name: '3+ Sub-Categories', count: threePlus },
      ],
      totalCustomers,
      crossSellRate,
      categoryPerformance,
    };
  }
}
