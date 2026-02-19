import { plainToInstance } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString, validateSync } from 'class-validator';

enum Environment {
  Development = 'development',
  Staging = 'staging',
  Production = 'production',
  Test = 'test',
}

class EnvironmentVariables {
  @IsEnum(Environment)
  @IsOptional()
  NODE_ENV: Environment = Environment.Development;

  @IsNumber()
  @IsOptional()
  PORT: number = 3001;

  @IsString()
  @IsOptional()
  DATABASE_URL: string;

  @IsString()
  @IsOptional()
  REDIS_HOST: string = 'localhost';

  @IsNumber()
  @IsOptional()
  REDIS_PORT: number = 6379;

  @IsString()
  @IsOptional()
  REDIS_PASSWORD: string;

  @IsString()
  @IsOptional()
  JWT_SECRET: string = 'dev-secret-change-in-production';

  @IsString()
  @IsOptional()
  JWT_ACCESS_EXPIRY: string = '1h';

  @IsString()
  @IsOptional()
  JWT_REFRESH_EXPIRY: string = '7d';

  @IsString()
  @IsOptional()
  GEMINI_API_KEY: string;

  @IsString()
  @IsOptional()
  GEMINI_MODEL: string = 'gemini-2.5-pro';

  @IsString()
  @IsOptional()
  CORS_ORIGINS: string = 'http://localhost:3000';

  @IsString()
  @IsOptional()
  OPENAI_API_KEY: string;

  @IsString()
  @IsOptional()
  OPENAI_MODEL: string = 'o4-mini';

  @IsString()
  @IsOptional()
  AZURE_OPENAI_BASE_PATH: string;

  @IsString()
  @IsOptional()
  AZURE_OPENAI_API_KEY: string;

  @IsString()
  @IsOptional()
  AZURE_OPENAI_API_DEPLOYMENT_NAME: string;

  @IsString()
  @IsOptional()
  AZURE_OPENAI_API_VERSION: string;

  @IsString()
  @IsOptional()
  AZURE_OPENAI_API_INSTANCE_NAME: string;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }

  return validatedConfig;
}
