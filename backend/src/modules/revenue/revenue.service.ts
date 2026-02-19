import { Injectable } from '@nestjs/common';
import { DataService } from '../data/data.service';

@Injectable()
export class RevenueService {
  constructor(private readonly dataService: DataService) {}

  getRevenueData() {
    return {
      arrSnapshots: this.dataService.getArrSnapshots(),
      pipelineSnapshots: this.dataService.getPipelineSnapshots(),
      closedAcv: this.dataService.getClosedAcv(),
      sowMappings: this.dataService.getSowMappings(),
      customerNameMappings: this.dataService.getCustomerNameMappings(),
      arrSubCategoryBreakdown: this.dataService.getArrSubCategoryBreakdown(),
      productCategoryMapping: this.dataService.getProductCategoryMapping(),
    };
  }

  async getRevenueOverview(period?: string) {
    const arr = this.dataService.getArrSnapshots();
    const closedAcv = this.dataService.getClosedAcv();

    const latestMonth = arr.length > 0
      ? arr.reduce((max, r) => r.Snapshot_Month > max ? r.Snapshot_Month : max, arr[0].Snapshot_Month)
      : '';

    const latestSnapshots = arr.filter(r => r.Snapshot_Month === latestMonth);
    const totalEndingARR = latestSnapshots.reduce((s, r) => s + r.Ending_ARR, 0);
    const totalNewARR = latestSnapshots.reduce((s, r) => s + r.New_ARR, 0);
    const totalExpansion = latestSnapshots.reduce((s, r) => s + r.Expansion_ARR, 0);
    const totalContraction = latestSnapshots.reduce((s, r) => s + r.Contraction_ARR, 0);
    const totalChurn = latestSnapshots.reduce((s, r) => s + r.Churn_ARR, 0);
    const totalClosed = closedAcv.reduce((s, d) => s + d.Amount, 0);

    return {
      period: period || latestMonth || 'current',
      summary: {
        total_arr: totalEndingARR,
        new_arr: totalNewARR,
        expansion_arr: totalExpansion,
        contraction_arr: totalContraction,
        churn_arr: totalChurn,
        total_closed_acv: totalClosed,
        customer_count: new Set(latestSnapshots.map(r => r.Customer_Name)).size,
      },
    };
  }

  async getArrMovement(period?: string) {
    const arr = this.dataService.getArrSnapshots();

    const monthMap = new Map<string, {
      starting: number; newArr: number; expansion: number;
      scheduleChange: number; contraction: number; churn: number; ending: number;
    }>();

    arr.forEach(r => {
      const month = r.Snapshot_Month?.slice(0, 7) || '';
      if (!month) return;
      const entry = monthMap.get(month) || {
        starting: 0, newArr: 0, expansion: 0,
        scheduleChange: 0, contraction: 0, churn: 0, ending: 0,
      };
      entry.starting += r.Starting_ARR;
      entry.newArr += r.New_ARR;
      entry.expansion += r.Expansion_ARR;
      entry.scheduleChange += r.Schedule_Change;
      entry.contraction += r.Contraction_ARR;
      entry.churn += r.Churn_ARR;
      entry.ending += r.Ending_ARR;
      monthMap.set(month, entry);
    });

    const sorted = [...monthMap.entries()].sort((a, b) => a[0].localeCompare(b[0]));

    return {
      period: period || 'all',
      movements: sorted.map(([month, v]) => ({
        month,
        starting_arr: v.starting,
        new_business: v.newArr,
        expansion: v.expansion,
        schedule_change: v.scheduleChange,
        contraction: v.contraction,
        churn: v.churn,
        ending_arr: v.ending,
        net_change: v.newArr + v.expansion + v.scheduleChange + v.contraction + v.churn,
      })),
    };
  }

  async getCustomerHealth(riskLevel?: string) {
    const arr = this.dataService.getArrSnapshots();

    const latestMonth = arr.length > 0
      ? arr.reduce((max, r) => r.Snapshot_Month > max ? r.Snapshot_Month : max, arr[0].Snapshot_Month)
      : '';

    const latestSnapshots = arr.filter(r => r.Snapshot_Month === latestMonth);
    const filtered = riskLevel
      ? latestSnapshots.filter(r => r.Renewal_Risk?.toLowerCase() === riskLevel.toLowerCase())
      : latestSnapshots;

    return {
      summary: {
        total_customers: new Set(latestSnapshots.map(r => r.Customer_Name)).size,
        arr_at_risk: latestSnapshots.filter(r => r.Renewal_Risk === 'High' || r.Renewal_Risk === 'Critical')
          .reduce((s, r) => s + r.Ending_ARR, 0),
      },
      customers: filtered.slice(0, 50).map(r => ({
        name: r.Customer_Name,
        sow_id: r.SOW_ID,
        arr: r.Ending_ARR,
        risk_level: r.Renewal_Risk || 'Low',
        contract_end: r.Contract_End_Date,
      })),
    };
  }

  async getCohortAnalysis() {
    const arr = this.dataService.getArrSnapshots();

    const cohortMap = new Map<string, { customers: Set<string>; initialArr: number; currentArr: number }>();
    arr.forEach(r => {
      const startYear = r.Contract_Start_Date?.slice(0, 4);
      if (!startYear) return;
      const cohort = startYear;
      const entry = cohortMap.get(cohort) || { customers: new Set<string>(), initialArr: 0, currentArr: 0 };
      entry.customers.add(r.Customer_Name);
      entry.currentArr += r.Ending_ARR;
      cohortMap.set(cohort, entry);
    });

    return {
      cohorts: [...cohortMap.entries()]
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([cohort, v]) => ({
          cohort,
          customers: v.customers.size,
          current_arr: v.currentArr,
        })),
    };
  }

  async getChurnAnalysis() {
    const arr = this.dataService.getArrSnapshots();

    const churned = arr.filter(r => r.Churn_ARR < 0);
    const churnedARR = churned.reduce((s, r) => s + Math.abs(r.Churn_ARR), 0);

    return {
      total_churned_rows: churned.length,
      churned_arr: churnedARR,
      unique_customers: new Set(churned.map(r => r.Customer_Name)).size,
    };
  }
}
