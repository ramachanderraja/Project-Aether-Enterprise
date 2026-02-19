import dotenv from 'dotenv';
import { AzureOpenAI } from 'openai';

dotenv.config({ path: new URL('../.env', import.meta.url) });

function deriveEndpointFromBasePath(basePath) {
  if (!basePath) return null;
  // e.g. https://.../openai/deployments  -> https://...
  return basePath.replace(/\/openai\/deployments\/?$/i, '');
}

async function tryRequest({ apiKey, apiVersion, endpoint, deployment }) {
  const client = new AzureOpenAI({
    apiKey,
    apiVersion,
    endpoint,
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60_000);

  try {
    return await client.chat.completions.create(
      {
        model: deployment,
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: 'Say "pong" and one short sentence.' },
        ],
        temperature: 0.2,
      },
      { signal: controller.signal },
    );
  } finally {
    clearTimeout(timeout);
  }
}

async function main() {
  const apiKey = process.env.AZURE_OPENAI_API_KEY;
  const apiVersion = process.env.AZURE_OPENAI_API_VERSION;
  const deployment = process.env.AZURE_OPENAI_API_DEPLOYMENT_NAME;

  const basePath = process.env.AZURE_OPENAI_BASE_PATH;
  const preferredEndpoint =
    process.env.AZURE_OPENAI_ENDPOINT || deriveEndpointFromBasePath(basePath);

  if (!apiKey || !apiVersion || !deployment || !(preferredEndpoint || basePath)) {
    console.error('Missing required env vars.');
    console.error('Need: AZURE_OPENAI_API_KEY, AZURE_OPENAI_API_VERSION, AZURE_OPENAI_API_DEPLOYMENT_NAME, and either AZURE_OPENAI_ENDPOINT or AZURE_OPENAI_BASE_PATH');
    process.exit(1);
  }

  console.log('Azure OpenAI test config (attempt order):');
  if (preferredEndpoint) console.log(`- endpoint #1: ${preferredEndpoint}`);
  if (basePath) console.log(`- endpoint #2 (fallback): ${basePath}`);
  console.log(`- apiVersion: ${apiVersion}`);
  console.log(`- deployment(model): ${deployment}`);

  const endpoints = [preferredEndpoint, basePath].filter(Boolean);
  let lastErr;
  for (const endpoint of endpoints) {
    try {
      console.log(`\nTrying endpoint: ${endpoint}`);
      const response = await tryRequest({ apiKey, apiVersion, endpoint, deployment });
      const text = response.choices?.[0]?.message?.content ?? '';
      console.log('\nResponse:\n');
      console.log(text);
      console.log('\nUsage:', response.usage ?? {});
      return;
    } catch (err) {
      lastErr = err;
      console.error(`Failed for endpoint ${endpoint}:`, err?.message || err);
    }
  }

  throw lastErr ?? new Error('All endpoint attempts failed');
}

main().catch((err) => {
  console.error('Test failed:', err?.message || err);
  process.exit(1);
});

