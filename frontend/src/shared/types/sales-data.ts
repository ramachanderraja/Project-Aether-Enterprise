// Data types as per requirements document
import { Region, Vertical, Segment, Platform, LogoType } from '../constants/filters';

// =============================================================================
// 1. CLOSED ACV REPORT
// =============================================================================
export interface ClosedACVRecord {
  closedAcvId: string;           // Primary key - unique identifier
  pipelineDealId: string | null; // Foreign key to Pipeline Report (can be NULL)
  dealName: string;
  dealValue: number;             // Total deal value
  licenseValue: number;          // License component
  implementationValue: number;   // Implementation component
  logoType: LogoType;            // New Logo, Upsell, Cross-Sell, Extension, Renewal
  closeDate: string;             // ISO date string
  region: Region;
  vertical: Vertical;
  segment: Segment;
  salesperson: string;
  salesManager: string;
  sowId?: string;                // SOW ID for sub-category breakdown linkage
  notes?: string;
}

// Calculated Closed ACV with business rules applied
export interface CalculatedClosedACV extends ClosedACVRecord {
  // Calculated fields
  closedACV: number;             // License (if not Extension/Renewal) + Implementation (always)
  licenseACV: number;            // License value that counts toward ACV (excludes Extension/Renewal)
  implementationACV: number;     // Always included
  normalizedLogoType: string;    // Extension and Renewal combined
  productSubCategory?: string;   // From Pipeline linkage
  productCategory?: string;      // Derived from mapping
  subCategoryBreakdown?: { subCategory: string; pct: number }[]; // From ARR Sub-Category data
}

// =============================================================================
// 2. MONTHLY PIPELINE SNAPSHOTS
// =============================================================================
export interface PipelineSnapshot {
  snapshotDate: string;          // Month/Date stamp (ISO date)
  pipelineDealId: string;        // Unique identifier
  dealName: string;
  customerName: string;          // For ARR forecasting linkage
  dealValue: number;             // Total deal value at snapshot
  licenseACV: number;            // License component
  implementationValue: number;   // Implementation component
  logoType: LogoType;
  dealStage: string;
  currentStage: string;
  probability: number;           // 0-100% likelihood of closing
  expectedCloseDate: string;
  region: Region;
  vertical: Vertical;
  segment: Segment;
  productSubCategory: string;
}

// Pipeline Report is the latest snapshot
export type PipelineReport = PipelineSnapshot & {
  productCategory: string;       // Derived from Product Category Mapping
};

// Pipeline Movement calculated between snapshots
export interface PipelineMovement {
  period: string;                // e.g., "Jan 2024"
  startingPipeline: number;
  newDeals: number;
  valueIncreased: number;
  valueDecreased: number;
  closedWon: number;
  closedWonACV: number;          // ACV impact (License rules + Implementation)
  lostDeals: number;
  endingPipeline: number;

  // Breakdown by Logo Type
  byLogoType: {
    logoType: string;
    newDeals: number;
    closedWon: number;
    closedWonACV: number;
  }[];
}

// =============================================================================
// 3. MONTHLY ARR SNAPSHOTS
// =============================================================================
export interface ARRSnapshot {
  snapshotDate: string;          // Month/Date (snapshot date)
  customerName: string;          // For ARR forecasting linkage
  sowId: string;                 // Unique contract identifier
  arrValue: number;
  region: Region;
  vertical: Vertical;
  segment: Segment;
  platform: Platform;
  productSubCategory: string;
  contractStartDate: string;
  contractEndDate: string;
}

// ARR with derived category
export interface ARRRecord extends ARRSnapshot {
  productCategory: string;       // Derived from mapping
}

// ARR Movement between snapshots
export interface ARRMovement {
  period: string;
  startingARR: number;
  newBusiness: number;           // SOW IDs appearing for first time
  expansion: number;             // Existing SOWs with increased ARR
  contraction: number;           // Existing SOWs with decreased ARR
  churn: number;                 // SOWs that disappeared
  endingARR: number;

  // Retention metrics
  ndr: number;                   // Net Dollar Retention
  grr: number;                   // Gross Revenue Retention
  logoRetention: number;         // Customer count retention
}

// =============================================================================
// 4. CUSTOMER NAME MAPPING
// =============================================================================
export interface CustomerNameMapping {
  arrCustomerName: string;       // As it appears in ARR Snapshots
  pipelineCustomerName: string;  // As it appears in Pipeline Snapshots
  mappingNotes?: string;
}

// =============================================================================
// 5. SUB-CATEGORY CONTRIBUTION BREAKDOWN
// =============================================================================
export interface SubCategoryContribution {
  sowId: string;
  year: number;                  // 2024, 2025, 2026
  subCategoryName: string;
  contributionPercent: number;   // Percentage of total ARR for that SOW in that year
}

// =============================================================================
// 6. PRODUCT CATEGORY MAPPING
// =============================================================================
export interface ProductCategoryMapping {
  productSubCategory: string;    // Unique
  productCategory: string;       // Parent grouping
}

// =============================================================================
// 7. SALES TEAM STRUCTURE
// =============================================================================
export interface SalesTeamMember {
  salespersonName: string;
  managerName: string;
  quota: number;                 // Current year quota
  region: Region;
  segment: Segment;
}

export interface SalesPerformance extends SalesTeamMember {
  // Calculated from Closed ACV Report
  totalClosedACV: number;        // Using correct ACV calculation rules
  newBusinessLicenseACV: number; // New Logo + Upsell + Cross-Sell license
  implementationACV: number;     // All types
  extensionRenewalLicense: number; // License excluded from ACV (tracked separately)
  quotaAttainment: number;       // (Total Closed ACV / Quota) * 100
  dealsClosedCount: number;

  // Breakdown by product
  byProductCategory: {
    category: string;
    closedACV: number;
  }[];
}

// Manager aggregated performance
export interface ManagerPerformance {
  managerName: string;
  region: Region;
  teamQuota: number;
  teamClosedACV: number;
  teamAttainment: number;
  directReports: SalesPerformance[];

  // Team breakdown by Logo Type
  byLogoType: {
    logoType: string;
    count: number;
    licenseACV: number;
    implementationACV: number;
    totalACV: number;
  }[];
}

// =============================================================================
// 8. PRIOR YEAR SALES PERFORMANCE
// =============================================================================
export interface PriorYearPerformance {
  salespersonName: string;
  year: number;
  totalClosedACV: number;
  quota: number;
  dealsClosed: number;
  region: Region;
  verticalBreakdown: {
    vertical: Vertical;
    closedACV: number;
  }[];
}

// =============================================================================
// ARR FORECASTING
// =============================================================================
export interface ARRForecast {
  month: string;                 // e.g., "2024-03"
  startingARR: number;           // Current ARR from Monthly ARR Snapshot
  pipelineAdditions: number;     // Weighted pipeline (ALL license types including Extension/Renewal)
  forecastedARR: number;         // Starting + Pipeline Additions

  // Breakdown
  byLogoType: {
    logoType: string;
    weightedValue: number;
  }[];

  byRegion: {
    region: Region;
    forecastedARR: number;
  }[];

  byVertical: {
    vertical: Vertical;
    forecastedARR: number;
  }[];

  // Customers with no ARR history (flagged)
  newCustomers: {
    customerName: string;
    pipelineValue: number;
    expectedCloseDate: string;
  }[];
}

// =============================================================================
// CALCULATION HELPERS (used by components)
// =============================================================================

/**
 * Calculate Closed ACV for a deal using business rules:
 * - License: Only count if Logo Type in (New Logo, Upsell, Cross-Sell)
 * - Implementation: Always count regardless of Logo Type
 * - Extension = Renewal (treat identically)
 */
export function calculateClosedACV(record: ClosedACVRecord): number {
  const normalizedLogoType = record.logoType === 'Renewal' ? 'Extension' : record.logoType;

  // License: Only New Logo, Upsell, Cross-Sell
  const licenseContribution =
    ['New Logo', 'Upsell', 'Cross-Sell'].includes(normalizedLogoType)
      ? record.licenseValue
      : 0;

  // Implementation: Always included
  const implementationContribution = record.implementationValue;

  return licenseContribution + implementationContribution;
}

/**
 * Calculate weighted pipeline value for ARR forecasting
 * Note: ARR Forecasting includes ALL license types (including Extension/Renewal)
 */
export function calculateWeightedPipeline(snapshot: PipelineSnapshot): number {
  return snapshot.licenseACV * (snapshot.probability / 100);
}

/**
 * Check if deal's license counts toward Closed ACV
 */
export function licenseCountsTowardACV(logoType: LogoType): boolean {
  return ['New Logo', 'Upsell', 'Cross-Sell'].includes(logoType);
}
