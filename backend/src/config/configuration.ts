export default () => ({
  // Application
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3001', 10),

  // Database
  database: {
    url: process.env.DATABASE_URL,
  },

  // Redis
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET,
    accessTokenExpiry: process.env.JWT_ACCESS_EXPIRY || '1h',
    refreshTokenExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
  },

  // OAuth/SSO
  oauth: {
    okta: {
      issuer: process.env.OKTA_ISSUER,
      clientId: process.env.OKTA_CLIENT_ID,
      clientSecret: process.env.OKTA_CLIENT_SECRET,
      audience: process.env.OKTA_AUDIENCE,
    },
    azureAd: {
      tenantId: process.env.AZURE_AD_TENANT_ID,
      clientId: process.env.AZURE_AD_CLIENT_ID,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET,
    },
  },

  // Google Gemini AI
  gemini: {
    apiKey: process.env.GEMINI_API_KEY,
    model: process.env.GEMINI_MODEL || 'gemini-2.5-pro',
    maxTokens: parseInt(process.env.GEMINI_MAX_TOKENS || '8192', 10),
  },

  // External Integrations
  integrations: {
    sap: {
      baseUrl: process.env.SAP_BASE_URL,
      clientId: process.env.SAP_CLIENT_ID,
      clientSecret: process.env.SAP_CLIENT_SECRET,
    },
    salesforce: {
      instanceUrl: process.env.SALESFORCE_INSTANCE_URL,
      clientId: process.env.SALESFORCE_CLIENT_ID,
      clientSecret: process.env.SALESFORCE_CLIENT_SECRET,
    },
    workday: {
      baseUrl: process.env.WORKDAY_BASE_URL,
      clientId: process.env.WORKDAY_CLIENT_ID,
      clientSecret: process.env.WORKDAY_CLIENT_SECRET,
    },
    snowflake: {
      account: process.env.SNOWFLAKE_ACCOUNT,
      username: process.env.SNOWFLAKE_USERNAME,
      password: process.env.SNOWFLAKE_PASSWORD,
      warehouse: process.env.SNOWFLAKE_WAREHOUSE,
      database: process.env.SNOWFLAKE_DATABASE,
    },
  },

  // CORS
  cors: {
    origins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
  },

  // Rate Limiting
  throttle: {
    ttl: parseInt(process.env.THROTTLE_TTL || '60000', 10),
    limit: parseInt(process.env.THROTTLE_LIMIT || '60', 10),
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
});
