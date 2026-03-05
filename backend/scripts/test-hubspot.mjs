/**
 * Quick script to fetch sample data from HubSpot API
 * Usage: node scripts/test-hubspot.mjs
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Read token from .env
const envPath = resolve(__dirname, '..', '.env');
const envContent = readFileSync(envPath, 'utf-8');
const tokenMatch = envContent.match(/^HUBSPOT_API_TOKEN=(.+)$/m);
if (!tokenMatch) {
  console.error('HUBSPOT_API_TOKEN not found in backend/.env');
  process.exit(1);
}
const TOKEN = tokenMatch[1].trim();

const BASE = 'https://api.hubapi.com';
const headers = {
  Authorization: `Bearer ${TOKEN}`,
  'Content-Type': 'application/json',
};

async function fetchEndpoint(label, path, params = {}) {
  const url = new URL(`${BASE}${path}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  console.log(`\n${'='.repeat(60)}`);
  console.log(`  ${label}`);
  console.log(`  GET ${url.pathname}${url.search}`);
  console.log('='.repeat(60));

  try {
    const res = await fetch(url.toString(), { headers });
    if (!res.ok) {
      const body = await res.text();
      console.error(`  HTTP ${res.status}: ${body.slice(0, 300)}`);
      return null;
    }
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
    return data;
  } catch (err) {
    console.error(`  Error: ${err.message}`);
    return null;
  }
}

async function main() {
  console.log('HubSpot API Sample Data Fetch');
  console.log(`Token prefix: ${TOKEN.slice(0, 8)}...`);

  // 1. Contacts (first 5)
  await fetchEndpoint(
    'CONTACTS (first 5)',
    '/crm/v3/objects/contacts',
    { limit: '5', properties: 'firstname,lastname,email,company,phone' },
  );

  // 2. Companies (first 5)
  await fetchEndpoint(
    'COMPANIES (first 5)',
    '/crm/v3/objects/companies',
    { limit: '5', properties: 'name,domain,industry,annualrevenue,numberofemployees' },
  );

  // 3. Deals (first 5)
  await fetchEndpoint(
    'DEALS (first 5)',
    '/crm/v3/objects/deals',
    { limit: '5', properties: 'dealname,amount,dealstage,closedate,pipeline' },
  );

  // 4. Owners / Users
  await fetchEndpoint(
    'OWNERS (first 5)',
    '/crm/v3/owners',
    { limit: '5' },
  );

  // 5. Deal Pipelines
  await fetchEndpoint(
    'DEAL PIPELINES',
    '/crm/v3/pipelines/deals',
  );

  // 6. Account info (portal details)
  await fetchEndpoint(
    'ACCOUNT INFO',
    '/account-info/v3/details',
  );

  // 7. Deal Properties (discover custom property names)
  const propsData = await fetchEndpoint(
    'DEAL PROPERTIES (all custom + standard)',
    '/crm/v3/properties/deals',
  );

  if (propsData?.results) {
    console.log(`\n${'='.repeat(60)}`);
    console.log('  DEAL PROPERTIES SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total properties: ${propsData.results.length}`);
    console.log('\nCustom properties (not hubspot-defined):');
    const custom = propsData.results
      .filter(p => !p.hubspotDefined)
      .map(p => `  - ${p.name} (${p.type}) "${p.label}"`)
      .sort();
    custom.forEach(line => console.log(line));

    // Highlight likely pipeline-relevant properties
    const keywords = ['acv', 'license', 'implementation', 'logo', 'region', 'vertical', 'segment', 'category', 'created'];
    console.log('\nProperties matching pipeline keywords:');
    propsData.results
      .filter(p => keywords.some(kw => p.name.toLowerCase().includes(kw) || (p.label || '').toLowerCase().includes(kw)))
      .forEach(p => console.log(`  - ${p.name} (${p.type}) "${p.label}" [hubspotDefined=${p.hubspotDefined}]`));
  }

  // 8. Deals with extended properties (first 3 with all pipeline-relevant fields)
  await fetchEndpoint(
    'DEALS (first 3, extended properties)',
    '/crm/v3/objects/deals',
    {
      limit: '3',
      properties: 'dealname,amount,dealstage,closedate,pipeline,hubspot_owner_id,createdate,hs_deal_stage_probability,total_acv,technology_license_fees1,technology_implementation_fees,existing_business__c,continent__c,gep_priority_vertical_,opportunity_segment_software__c,sub_cato__c,created_date__c,weighted_acv,license_weighted,weighted_implementation_fee',
      associations: 'companies',
    },
  );

  console.log('\n--- Done ---');
}

main();
