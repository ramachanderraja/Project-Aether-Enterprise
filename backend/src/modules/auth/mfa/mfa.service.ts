import { Injectable, Logger, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface MfaSetupResult {
  secret: string;
  qrCodeDataUrl: string;
  backupCodes: string[];
}

export interface MfaVerifyResult {
  verified: boolean;
  message: string;
}

@Injectable()
export class MfaService {
  private readonly logger = new Logger(MfaService.name);

  constructor(private readonly configService: ConfigService) {}

  async generateMfaSecret(userId: string): Promise<MfaSetupResult> {
    throw new BadRequestException('MFA is not available in file-based mode');
  }

  async verifyAndEnableMfa(userId: string, token: string): Promise<MfaVerifyResult> {
    throw new BadRequestException('MFA is not available in file-based mode');
  }

  async verifyMfaToken(userId: string, token: string): Promise<boolean> {
    return false;
  }

  async disableMfa(userId: string, token: string): Promise<void> {
    throw new BadRequestException('MFA is not available in file-based mode');
  }

  async regenerateBackupCodes(userId: string, token: string): Promise<string[]> {
    throw new BadRequestException('MFA is not available in file-based mode');
  }

  async isMfaEnabled(userId: string): Promise<boolean> {
    return false;
  }

  async getBackupCodesCount(userId: string): Promise<number> {
    return 0;
  }

  private generateBackupCodes(count: number): string[] {
    const codes: string[] = [];
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    for (let i = 0; i < count; i++) {
      let code = '';
      for (let j = 0; j < 8; j++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      codes.push(`${code.slice(0, 4)}-${code.slice(4)}`);
    }
    return codes;
  }
}
