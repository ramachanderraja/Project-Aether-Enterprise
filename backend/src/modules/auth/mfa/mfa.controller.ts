import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { MfaService } from './mfa.service';

class VerifyMfaDto {
  token: string;
}

@ApiTags('Multi-Factor Authentication')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('auth/mfa')
export class MfaController {
  constructor(private readonly mfaService: MfaService) {}

  @Post('setup')
  @ApiOperation({ summary: 'Initialize MFA setup and get QR code' })
  async setupMfa(@Request() req) {
    return this.mfaService.generateMfaSecret(req.user.id);
  }

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify TOTP code and enable MFA' })
  @ApiBody({ type: VerifyMfaDto })
  async verifyMfa(@Request() req, @Body() body: VerifyMfaDto) {
    return this.mfaService.verifyAndEnableMfa(req.user.id, body.token);
  }

  @Delete('disable')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Disable MFA (requires current TOTP code)' })
  @ApiBody({ type: VerifyMfaDto })
  async disableMfa(@Request() req, @Body() body: VerifyMfaDto) {
    await this.mfaService.disableMfa(req.user.id, body.token);
    return { success: true, message: 'MFA has been disabled' };
  }

  @Get('status')
  @ApiOperation({ summary: 'Get MFA status for current user' })
  async getMfaStatus(@Request() req) {
    const [enabled, backupCodesCount] = await Promise.all([
      this.mfaService.isMfaEnabled(req.user.id),
      this.mfaService.getBackupCodesCount(req.user.id),
    ]);

    return {
      enabled,
      backupCodesRemaining: enabled ? backupCodesCount : 0,
    };
  }

  @Post('backup-codes/regenerate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Regenerate backup codes (requires current TOTP code)' })
  @ApiBody({ type: VerifyMfaDto })
  async regenerateBackupCodes(@Request() req, @Body() body: VerifyMfaDto) {
    const codes = await this.mfaService.regenerateBackupCodes(req.user.id, body.token);
    return {
      success: true,
      backupCodes: codes,
      message: 'New backup codes have been generated. Please save them securely.',
    };
  }
}
