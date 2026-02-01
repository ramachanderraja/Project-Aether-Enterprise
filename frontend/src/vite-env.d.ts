/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_APP_NAME: string;
  readonly VITE_APP_VERSION: string;
  readonly VITE_ENABLE_AI_CHAT: string;
  readonly VITE_ENABLE_SCENARIOS: string;
  readonly VITE_ENABLE_GOVERNANCE: string;
  readonly VITE_ANALYTICS_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
