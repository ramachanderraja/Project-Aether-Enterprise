// Standard filter options as per requirements document

// Region Filter - All Tabs
export const REGIONS = [
  'North America',
  'Europe',
  'LATAM',
  'Middle East',
  'APAC',
] as const;

// Vertical Filter - All Tabs
export const VERTICALS = [
  'Life Sciences',
  'Other Services',
  'CPG & Retail',
  'Chemicals/Oil/Gas/Resources',
  'Automotive and Industrial',
  'BFSI',
  'Telecom/Media/Tech',
  'Public Sector',
  'Energy & Utilities',
  'Private Equity',
  'Unilever',
] as const;

// Segment Filter - Sales Performance & ARR Analytics tabs only
export const SEGMENTS = [
  'Enterprise',
  'SMB',
] as const;

// Platform Filter - ARR Analytics tab only
export const PLATFORMS = [
  'Quantum',
  'SMART',
  'Cost Drivers',
  'Opus',
] as const;

// Default selected platforms (as per requirements)
export const DEFAULT_PLATFORMS = ['Quantum', 'SMART', 'Cost Drivers'] as const;

// Logo Types (Extension and Renewal are interchangeable)
export const LOGO_TYPES = [
  'New Logo',
  'Upsell',
  'Cross-Sell',
  'Extension', // Same as Renewal
  'Renewal',   // Same as Extension
] as const;

// Normalized Logo Types (combine Extension/Renewal)
export const NORMALIZED_LOGO_TYPES = [
  'New Logo',
  'Upsell',
  'Cross-Sell',
  'Extension/Renewal',
] as const;

// Logo types that count toward License ACV
export const LICENSE_ACV_LOGO_TYPES = ['New Logo', 'Upsell', 'Cross-Sell'] as const;

// Logo types excluded from License ACV (but Implementation still counts)
export const RENEWAL_LOGO_TYPES = ['Extension', 'Renewal'] as const;

// Type exports
export type Region = typeof REGIONS[number];
export type Vertical = typeof VERTICALS[number];
export type Segment = typeof SEGMENTS[number];
export type Platform = typeof PLATFORMS[number];
export type LogoType = typeof LOGO_TYPES[number];
export type NormalizedLogoType = typeof NORMALIZED_LOGO_TYPES[number];

// Helper function to normalize Logo Type (Extension = Renewal)
export function normalizeLogoType(logoType: string): NormalizedLogoType {
  if (logoType === 'Extension' || logoType === 'Renewal') {
    return 'Extension/Renewal';
  }
  return logoType as NormalizedLogoType;
}

// Helper function to check if Logo Type counts toward License ACV
export function countsTowardLicenseACV(logoType: string): boolean {
  return LICENSE_ACV_LOGO_TYPES.includes(logoType as any);
}

// Helper function to check if Logo Type is a renewal
export function isRenewalLogoType(logoType: string): boolean {
  return RENEWAL_LOGO_TYPES.includes(logoType as any);
}
