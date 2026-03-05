/**
 * Raw HubSpot deal properties from API response.
 * Property names discovered via GET /crm/v3/properties/deals
 */
export interface HubspotDealProperties {
  dealname?: string;
  dealstage?: string;
  amount?: string;
  closedate?: string;
  pipeline?: string;
  hubspot_owner_id?: string;
  createdate?: string;
  hs_deal_stage_probability?: string;
  // Custom GEP properties (verified via test-hubspot.mjs)
  total_acv?: string;
  technology_license_fees1?: string; // Note: trailing "1"
  technology_implementation_fees?: string;
  existing_business__c?: string; // Logo Type
  continent__c?: string; // Sales Region
  gep_priority_vertical_?: string; // GEP Priority Vertical (trailing "_")
  opportunity_segment_software__c?: string; // Segment
  sub_cato__c?: string; // Sub Category (Product_Sub_Category)
  created_date__c?: string; // Opportunity Created Date [SFDC/Pardot]
  weighted_acv?: string;
  license_weighted?: string;
  weighted_implementation_fee?: string;
  one_time_fees__c?: string; // Implementation Fees (alternate)
}

export interface HubspotDealRaw {
  id: string;
  properties: HubspotDealProperties;
  associations?: {
    companies?: {
      results: Array<{ id: string; type: string }>;
    };
  };
}

export interface HubspotDealSearchResponse {
  results: HubspotDealRaw[];
  paging?: {
    next?: {
      after: string;
      link: string;
    };
  };
}

export interface HubspotPipelineStage {
  id: string;
  label: string;
  displayOrder: number;
  metadata: {
    probability?: string;
    isClosed?: string;
  };
}

export interface HubspotPipeline {
  id: string;
  label: string;
  stages: HubspotPipelineStage[];
}

export interface HubspotOwner {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  teams?: Array<{ id: string; name: string; primary: boolean }>;
}

export interface OwnerInfo {
  name: string;
  primaryTeam: string | null;
}

/**
 * Transformed deal ready for DB upsert
 */
export interface PipelineSnapshotUpsert {
  snapshotMonth: Date;
  hubspotDealId: string;
  dealName: string;
  customerName: string;
  dealValue: number;
  licenseAcv: number;
  implementationValue: number;
  logoType: string | null;
  dealStage: string;
  currentStage: string;
  probability: number;
  expectedCloseDate: Date | null;
  region: string | null;
  vertical: string | null;
  segment: string | null;
  productSubCategory: string | null;
  salesRep: string | null;
  ownerSalesTeam: string | null;
  createdDate: Date | null;
  hubspotOwnerId: string | null;
  rawDealStageId: string | null;
  source: string;
}

/**
 * Response DTO for sync endpoints
 */
export class SyncResultDto {
  syncType: string;
  status: string;
  recordsFetched: number;
  recordsUpserted: number;
  recordsUpdated: number;
  recordsFailed: number;
  durationMs: number;
  errorMessage?: string;
}

/**
 * Target stages to include in pipeline snapshots
 */
export const TARGET_STAGE_PREFIXES = [
  'Stage 2',
  'Stage 3',
  'Stage 4',
  'Stage 5',
  'Stage 6',
];

/**
 * HubSpot deal properties to request from the API.
 * Verified against GET /crm/v3/properties/deals on 2026-03-05.
 */
export const DEAL_PROPERTIES = [
  'dealname',
  'dealstage',
  'amount',
  'closedate',
  'pipeline',
  'hubspot_owner_id',
  'createdate',
  'hs_deal_stage_probability',
  // Custom GEP properties
  'total_acv',
  'technology_license_fees1',
  'technology_implementation_fees',
  'existing_business__c', // Logo Type
  'continent__c', // Sales Region
  'gep_priority_vertical_', // GEP Priority Vertical
  'opportunity_segment_software__c', // Segment
  'sub_cato__c', // Sub Category
  'created_date__c', // Opportunity Created Date
  'weighted_acv',
  'license_weighted',
  'weighted_implementation_fee',
];

/**
 * Normalize HubSpot region values ("N. America", "LATAM", etc.)
 * to match CSV format ("North America", "Europe", etc.)
 */
export function normalizeHubspotRegion(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const map: Record<string, string> = {
    'N. America': 'North America',
    'North America': 'North America',
    'LATAM': 'LATAM',
    'Europe': 'Europe',
    'APAC': 'APAC',
    'Middle East': 'Middle East',
    'MEA': 'Middle East',
    'Global': 'Global',
  };
  return map[raw.trim()] || raw.trim();
}

/**
 * Normalize HubSpot vertical values to match CSV format
 */
export function normalizeHubspotVertical(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const map: Record<string, string> = {
    'CPG / Retail': 'CPG & Retail',
    'CPG & Retail': 'CPG & Retail',
    'Oil, Gas & Chemical': 'Chemicals/Oil/Gas/Resources',
    'Chemicals/Oil/Gas/Resources': 'Chemicals/Oil/Gas/Resources',
    'Telecom, Media & Technology': 'Telecom/Media/Tech',
    'Telecom/Media/Tech': 'Telecom/Media/Tech',
    'Other Services': 'Other Services',
    'Life Sciences': 'Life Sciences',
    'BFSI': 'BFSI',
    'Public Sector': 'Public Sector',
    'Automotive and Industrial': 'Automotive and Industrial',
    'Energy & Utilities': 'Energy & Utilities',
    'Private Equity': 'Private Equity',
    'Unilever': 'Unilever',
  };
  return map[raw.trim()] || raw.trim();
}

/**
 * Normalize HubSpot segment values to match CSV format
 */
export function normalizeHubspotSegment(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (trimmed.toLowerCase().includes('enterprise')) return 'Enterprise';
  if (trimmed.toLowerCase().includes('smb')) return 'SMB';
  if (trimmed.toLowerCase().includes('installed base')) return 'Enterprise';
  return trimmed;
}

