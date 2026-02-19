import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import {
  parseCSV,
  parseNumber,
  parseDate,
  normalizeLogoType,
} from './csv-parser.util';
import {
  ClosedAcvRecord,
  PipelineSnapshotRecord,
  ARRSnapshotRecord,
  SalesTeamRecord,
  CustomerNameMappingRecord,
  SOWMappingRecord,
  ARRSubCategoryRecord,
  ProductCategoryMappingRecord,
  AllDataResponse,
} from './dto';

@Injectable()
export class DataService implements OnModuleInit {
  private readonly logger = new Logger(DataService.name);

  // In-memory data stores
  private closedAcv: ClosedAcvRecord[] = [];
  private pipelineSnapshots: PipelineSnapshotRecord[] = [];
  private arrSnapshots: ARRSnapshotRecord[] = [];
  private salesTeam: SalesTeamRecord[] = [];
  private customerNameMappings: CustomerNameMappingRecord[] = [];
  private sowMappings: SOWMappingRecord[] = [];
  private arrSubCategoryBreakdown: ARRSubCategoryRecord[] = [];
  private productCategoryMapping: ProductCategoryMappingRecord[] = [];

  // Indexes
  private sowMappingIndex: Record<string, SOWMappingRecord> = {};
  private productCategoryIndex: Record<string, string> = {};
  private customerNameIndex: Record<string, string> = {};

  private dataDir: string;

  constructor() {
    this.dataDir = path.resolve(process.cwd(), 'data');
  }

  async onModuleInit() {
    await this.loadAllData();
  }

  async loadAllData(): Promise<void> {
    this.logger.log(`Loading CSV data from ${this.dataDir}`);

    if (!fs.existsSync(this.dataDir)) {
      this.logger.error(`Data directory not found: ${this.dataDir}`);
      return;
    }

    try {
      const fileNames = [
        'closed_acv',
        'monthly_pipeline_snapshot',
        'monthly_arr_snapshot',
        'sales_team_structure',
        'customer_name_mapping',
        'sow_mapping',
        'arr_subcategory_breakdown',
        'product_category_mapping',
      ];

      const texts = fileNames.map(f => {
        const filePath = path.join(this.dataDir, `${f}.csv`);
        if (!fs.existsSync(filePath)) {
          this.logger.warn(`CSV file not found: ${filePath}`);
          return '';
        }
        return fs.readFileSync(filePath, 'utf-8');
      });

      const [
        closedAcvText,
        pipelineText,
        arrText,
        salesTeamText,
        customerMappingText,
        sowMappingText,
        arrSubCatText,
        prodCatText,
      ] = texts;

      // Parse Closed ACV
      this.closedAcv = parseCSV(closedAcvText).map(row => ({
        Closed_ACV_ID: row['Closed_ACV_ID'] || '',
        Pipeline_Deal_ID: row['Pipeline_Deal_ID'] || '',
        Deal_Name: row['Deal_Name'] || '',
        Customer_Name: row['Customer_Name'] || '',
        Close_Date: parseDate(row['Close_Date'] || ''),
        Logo_Type: normalizeLogoType(row['Logo_Type'] || ''),
        Value_Type: (row['Value_Type'] || '').trim(),
        Amount: parseNumber(row['Amount'] || ''),
        License_ACV: parseNumber(row['License_ACV'] || ''),
        Implementation_Value: parseNumber(row['Implementation_Value'] || ''),
        Region: row['Region'] || '',
        Vertical: row['Vertical'] || '',
        Segment: row['Segment'] || '',
        Platform: row['Platform'] || '',
        Sales_Rep: (row['Sales_Rep'] || '').trim(),
        SOW_ID: row['SOW_ID'] || '',
        Sold_By: (row['Sold By'] || row['Sold_By'] || 'Sales').trim(),
      }));

      // Parse Pipeline Snapshots
      this.pipelineSnapshots = parseCSV(pipelineText).map(row => ({
        Snapshot_Month: parseDate(row['Snapshot_Month'] || ''),
        Pipeline_Deal_ID: row['Pipeline_Deal_ID'] || '',
        Deal_Name: row['Deal_Name'] || '',
        Customer_Name: row['Customer_Name'] || '',
        Deal_Value: parseNumber(row['Deal_Value'] || ''),
        License_ACV: parseNumber(row['License_ACV'] || ''),
        Implementation_Value: parseNumber(row['Implementation_Value'] || ''),
        Logo_Type: normalizeLogoType(row['Logo_Type'] || ''),
        Deal_Stage: (row['Deal_Stage'] || '').trim(),
        Current_Stage: (row['Current_Stage'] || '').trim(),
        Probability: parseNumber(row['Probability'] || ''),
        Expected_Close_Date: parseDate(row['Expected_Close_Date'] || ''),
        Region: (row['Region'] || '').trim(),
        Vertical: (row['Vertical'] || '').trim(),
        Segment: (row['Segment'] || '').trim(),
        Product_Sub_Category: (row['Product_Sub_Category'] || '').trim(),
        Sales_Rep: (row['Sales_Rep'] || '').trim(),
      }));

      // Parse ARR Snapshots
      this.arrSnapshots = parseCSV(arrText).map(row => ({
        Snapshot_Month: parseDate(row['Snapshot_Month'] || ''),
        SOW_ID: row['SOW_ID'] || '',
        Customer_Name: row['Customer_Name'] || '',
        Quantum_SMART: (row['Quantum/SMART'] || '').trim(),
        Quantum_GoLive_Date: parseDate(
          row['Quantum Go-Live Date'] || row['Quantum_GoLive_Date'] || '',
        ),
        Starting_ARR: parseNumber(row['Starting_ARR'] || ''),
        New_ARR: parseNumber(row['New_ARR'] || row['New Business_ARR'] || ''),
        Expansion_ARR: parseNumber(row['Expansion_ARR'] || ''),
        Schedule_Change: parseNumber(
          row['Schedule Change'] ||
            row['Schedule_Change'] ||
            row['Schedule Change_ARR'] ||
            '',
        ),
        Contraction_ARR: parseNumber(row['Contraction_ARR'] || ''),
        Churn_ARR: parseNumber(row['Churn_ARR'] || ''),
        Ending_ARR: parseNumber(row['Ending_ARR'] || ''),
        Region: (row['Region'] || '').trim(),
        Vertical: (row['Vertical'] || '').trim(),
        Segment: (row['Segment'] || '').trim(),
        Contract_Start_Date: parseDate(row['Contract_Start_Date'] || ''),
        Contract_End_Date: parseDate(row['Contract_End_Date'] || ''),
        Renewal_Risk: (row['Renewal_Risk'] || '').trim(),
      }));

      // Parse Sales Team
      this.salesTeam = parseCSV(salesTeamText).map(row => ({
        Sales_Rep_ID: row['Sales_Rep_ID'] || '',
        Name: (row['Name'] || '').trim(),
        Email: row['Email'] || '',
        Role: (row['Role'] || '').trim(),
        Region: (row['Region'] || '').trim(),
        Vertical_Focus: row['Vertical_Focus'] || '',
        Segment: (row['Segment'] || '').trim(),
        Manager_ID: row['Manager_ID'] || '',
        Manager_Name: (row['Manager_Name'] || '').trim(),
        Annual_Quota: parseNumber(row['Annual_Quota'] || ''),
        Q1_Quota: parseNumber(row['Q1_Quota'] || ''),
        Q2_Quota: parseNumber(row['Q2_Quota'] || ''),
        Q3_Quota: parseNumber(row['Q3_Quota'] || ''),
        Q4_Quota: parseNumber(row['Q4_Quota'] || ''),
        Hire_Date: parseDate(row['Hire_Date'] || ''),
        Status: row['Status'] || '',
      }));

      // Parse Customer Name Mapping
      this.customerNameMappings = parseCSV(customerMappingText).map(row => ({
        ARR_Customer_Name: row['ARR_Customer_Name'] || '',
        Pipeline_Customer_Name: row['Pipeline_Customer_Name'] || '',
      }));

      // Parse SOW Mapping
      this.sowMappings = parseCSV(sowMappingText).map(row => ({
        SOW_ID: row['SOW_ID'] || '',
        SOW_Name: (row['SOW Name'] || row['SOW_Name'] || '').trim(),
        Vertical: (row['Vertical'] || '').trim(),
        Region: (row['Region'] || '').trim(),
        Fees_Type: (row['Fees_Type'] || '').trim(),
        Revenue_Type: (row['Revenue_Type'] || '').trim(),
        Segment_Type: (row['Segment_Type'] || '').trim(),
        Start_Date: parseDate(row['Start_Date'] || ''),
      }));

      // Parse ARR Sub-Category Breakdown
      this.arrSubCategoryBreakdown = parseCSV(arrSubCatText).map(row => ({
        SOW_ID: row['SOW_ID'] || '',
        Customer_Name: row['Customer_Name'] || '',
        Product_Sub_Category: (row['Product_Sub_Category'] || '').trim(),
        Pct_2024: parseNumber(row['2024_Contribution_Pct'] || ''),
        Pct_2025: parseNumber(row['2025_Contribution_Pct'] || ''),
        Pct_2026: parseNumber(row['2026_Contribution_Pct'] || ''),
      }));

      // Parse Product Category Mapping
      this.productCategoryMapping = parseCSV(prodCatText)
        .filter(row => row['Product_Sub_Category'])
        .map(row => ({
          Product_Sub_Category: (row['Product_Sub_Category'] || '').trim(),
          Product_Category: (row['Product_Category'] || '').trim(),
          Description: row['Description'] || '',
          Status: row['Status'] || '',
        }));

      // Build indexes
      this.sowMappingIndex = {};
      this.sowMappings.forEach(m => {
        if (m.SOW_ID) this.sowMappingIndex[m.SOW_ID] = m;
      });

      this.productCategoryIndex = {};
      this.productCategoryMapping.forEach(m => {
        if (m.Product_Sub_Category)
          this.productCategoryIndex[m.Product_Sub_Category] = m.Product_Category;
      });

      this.customerNameIndex = {};
      this.customerNameMappings.forEach(m => {
        if (m.ARR_Customer_Name)
          this.customerNameIndex[m.ARR_Customer_Name] = m.Pipeline_Customer_Name;
      });

      this.logger.log(
        `[DataService] Loaded: ${this.closedAcv.length} closed ACV, ` +
          `${this.pipelineSnapshots.length} pipeline snapshots, ` +
          `${this.arrSnapshots.length} ARR snapshots, ` +
          `${this.salesTeam.length} team members, ` +
          `${this.sowMappings.length} SOW mappings, ` +
          `${this.arrSubCategoryBreakdown.length} sub-categories, ` +
          `${this.productCategoryMapping.length} product categories`,
      );
    } catch (err) {
      this.logger.error(`Failed to load CSV data: ${err}`);
    }
  }

  // ============ Getters ============

  getAllData(): AllDataResponse {
    return {
      closedAcv: this.closedAcv,
      pipelineSnapshots: this.pipelineSnapshots,
      arrSnapshots: this.arrSnapshots,
      salesTeam: this.salesTeam,
      customerNameMappings: this.customerNameMappings,
      sowMappings: this.sowMappings,
      arrSubCategoryBreakdown: this.arrSubCategoryBreakdown,
      productCategoryMapping: this.productCategoryMapping,
      sowMappingIndex: this.sowMappingIndex,
      productCategoryIndex: this.productCategoryIndex,
      customerNameIndex: this.customerNameIndex,
    };
  }

  getClosedAcv(): ClosedAcvRecord[] {
    return this.closedAcv;
  }

  getPipelineSnapshots(): PipelineSnapshotRecord[] {
    return this.pipelineSnapshots;
  }

  getArrSnapshots(): ARRSnapshotRecord[] {
    return this.arrSnapshots;
  }

  getSalesTeam(): SalesTeamRecord[] {
    return this.salesTeam;
  }

  getCustomerNameMappings(): CustomerNameMappingRecord[] {
    return this.customerNameMappings;
  }

  getSowMappings(): SOWMappingRecord[] {
    return this.sowMappings;
  }

  getArrSubCategoryBreakdown(): ARRSubCategoryRecord[] {
    return this.arrSubCategoryBreakdown;
  }

  getProductCategoryMapping(): ProductCategoryMappingRecord[] {
    return this.productCategoryMapping;
  }

  getDataDir(): string {
    return this.dataDir;
  }
}
