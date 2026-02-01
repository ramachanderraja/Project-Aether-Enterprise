import { Injectable, Logger, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';
import { PrismaService } from '../../../database/prisma.service';

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

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Generate a new TOTP secret for MFA setup
   */
  async generateMfaSecret(userId: string): Promise<MfaSetupResult> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, mfaEnabled: false },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Generate TOTP secret
    const secret = speakeasy.generateSecret({
      name: `Project Aether (${user.email})`,
      issuer: 'Project Aether',
      length: 32,
    });

    // Generate QR code
    const qrCodeDataUrl = await QRCode.toDataURL(secret.otpauth_url);

    // Generate backup codes
    const backupCodes = this.generateBackupCodes(8);

    // Store the secret temporarily (will be confirmed after verification)
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        mfaSecret: secret.base32,
        mfaBackupCodes: backupCodes.map((code) => code.replace(/-/g, '')),
      },
    });

    return {
      secret: secret.base32,
      qrCodeDataUrl,
      backupCodes,
    };
  }

  /**
   * Verify TOTP code and enable MFA
   */
  async verifyAndEnableMfa(userId: string, token: string): Promise<MfaVerifyResult> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { mfaSecret: true, mfaEnabled: true },
    });

    if (!user || !user.mfaSecret) {
      throw new BadRequestException('MFA setup not initiated');
    }

    if (user.mfaEnabled) {
      throw new BadRequestException('MFA is already enabled');
    }

    const verified = speakeasy.totp.verify({
      secret: user.mfaSecret,
      encoding: 'base32',
      token,
      window: 1, // Allow 1 period before/after for clock drift
    });

    if (!verified) {
      throw new UnauthorizedException('Invalid verification code');
    }

    // Enable MFA
    await this.prisma.user.update({
      where: { id: userId },
      data: { mfaEnabled: true },
    });

    this.logger.log(`MFA enabled for user ${userId}`);

    return {
      verified: true,
      message: 'MFA has been enabled successfully',
    };
  }

  /**
   * Verify TOTP code during login
   */
  async verifyMfaToken(userId: string, token: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { mfaSecret: true, mfaEnabled: true, mfaBackupCodes: true },
    });

    if (!user || !user.mfaEnabled || !user.mfaSecret) {
      throw new BadRequestException('MFA is not enabled for this user');
    }

    // First, try TOTP verification
    const verified = speakeasy.totp.verify({
      secret: user.mfaSecret,
      encoding: 'base32',
      token,
      window: 1,
    });

    if (verified) {
      return true;
    }

    // If TOTP fails, try backup code
    const normalizedToken = token.replace(/-/g, '').toUpperCase();
    const backupCodes = user.mfaBackupCodes as string[];

    if (backupCodes && backupCodes.includes(normalizedToken)) {
      // Remove used backup code
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          mfaBackupCodes: backupCodes.filter((code) => code !== normalizedToken),
        },
      });

      this.logger.log(`Backup code used for user ${userId}`);
      return true;
    }

    return false;
  }

  /**
   * Disable MFA for a user
   */
  async disableMfa(userId: string, token: string): Promise<void> {
    const verified = await this.verifyMfaToken(userId, token);

    if (!verified) {
      throw new UnauthorizedException('Invalid verification code');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        mfaEnabled: false,
        mfaSecret: null,
        mfaBackupCodes: [],
      },
    });

    this.logger.log(`MFA disabled for user ${userId}`);
  }

  /**
   * Generate new backup codes
   */
  async regenerateBackupCodes(userId: string, token: string): Promise<string[]> {
    const verified = await this.verifyMfaToken(userId, token);

    if (!verified) {
      throw new UnauthorizedException('Invalid verification code');
    }

    const backupCodes = this.generateBackupCodes(8);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        mfaBackupCodes: backupCodes.map((code) => code.replace(/-/g, '')),
      },
    });

    return backupCodes;
  }

  /**
   * Check if MFA is enabled for a user
   */
  async isMfaEnabled(userId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { mfaEnabled: true },
    });

    return user?.mfaEnabled ?? false;
  }

  /**
   * Get remaining backup codes count
   */
  async getBackupCodesCount(userId: string): Promise<number> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { mfaBackupCodes: true },
    });

    const codes = user?.mfaBackupCodes as string[] | null;
    return codes?.length ?? 0;
  }

  /**
   * Generate random backup codes
   */
  private generateBackupCodes(count: number): string[] {
    const codes: string[] = [];
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

    for (let i = 0; i < count; i++) {
      let code = '';
      for (let j = 0; j < 8; j++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      // Format as XXXX-XXXX
      codes.push(`${code.slice(0, 4)}-${code.slice(4)}`);
    }

    return codes;
  }
}
