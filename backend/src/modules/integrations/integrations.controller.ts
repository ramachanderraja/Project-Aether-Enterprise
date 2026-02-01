import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { IntegrationsService } from './integrations.service';
import {
  CreateIntegrationDto,
  UpdateIntegrationDto,
  CreateWebhookDto,
  GetWebhookLogsDto,
  CreateApiKeyDto,
  OAuthCallbackDto,
  TestIntegrationDto,
} from './dto';

@ApiTags('Integrations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('integrations')
export class IntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  // Available Integrations
  @Get('catalog')
  @ApiOperation({ summary: 'Get available integration types' })
  @ApiResponse({ status: 200, description: 'Integration catalog' })
  async getAvailableIntegrations() {
    return this.integrationsService.getAvailableIntegrations();
  }

  // Configured Integrations
  @Get()
  @ApiOperation({ summary: 'Get all configured integrations' })
  @ApiResponse({ status: 200, description: 'List of integrations' })
  async getIntegrations() {
    return this.integrationsService.getIntegrations();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get integration by ID' })
  @ApiParam({ name: 'id', description: 'Integration ID' })
  @ApiResponse({ status: 200, description: 'Integration details' })
  @ApiResponse({ status: 404, description: 'Integration not found' })
  async getIntegrationById(@Param('id') id: string) {
    return this.integrationsService.getIntegrationById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new integration' })
  @ApiResponse({ status: 201, description: 'Integration created' })
  async createIntegration(@Body() dto: CreateIntegrationDto) {
    return this.integrationsService.createIntegration(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update integration' })
  @ApiParam({ name: 'id', description: 'Integration ID' })
  @ApiResponse({ status: 200, description: 'Integration updated' })
  async updateIntegration(@Param('id') id: string, @Body() dto: UpdateIntegrationDto) {
    return this.integrationsService.updateIntegration(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete integration' })
  @ApiParam({ name: 'id', description: 'Integration ID' })
  @ApiResponse({ status: 204, description: 'Integration deleted' })
  async deleteIntegration(@Param('id') id: string) {
    return this.integrationsService.deleteIntegration(id);
  }

  @Post('test')
  @ApiOperation({ summary: 'Test integration connection' })
  @ApiResponse({ status: 200, description: 'Test results' })
  async testIntegration(@Body() dto: TestIntegrationDto) {
    return this.integrationsService.testIntegration(dto);
  }

  // OAuth
  @Get(':id/oauth/url')
  @ApiOperation({ summary: 'Get OAuth authorization URL' })
  @ApiParam({ name: 'id', description: 'Integration ID' })
  @ApiResponse({ status: 200, description: 'OAuth URL' })
  async getOAuthUrl(@Param('id') id: string) {
    return this.integrationsService.getOAuthUrl(id);
  }

  @Post('oauth/callback')
  @ApiOperation({ summary: 'Handle OAuth callback' })
  @ApiResponse({ status: 200, description: 'OAuth callback processed' })
  async handleOAuthCallback(@Body() dto: OAuthCallbackDto) {
    return this.integrationsService.handleOAuthCallback(dto);
  }

  // Webhooks
  @Get('webhooks')
  @ApiOperation({ summary: 'Get all webhooks' })
  @ApiResponse({ status: 200, description: 'List of webhooks' })
  async getWebhooks(@Query('integration_id') integrationId?: string) {
    return this.integrationsService.getWebhooks(integrationId);
  }

  @Get('webhooks/:id')
  @ApiOperation({ summary: 'Get webhook by ID' })
  @ApiParam({ name: 'id', description: 'Webhook ID' })
  @ApiResponse({ status: 200, description: 'Webhook details' })
  async getWebhookById(@Param('id') id: string) {
    return this.integrationsService.getWebhookById(id);
  }

  @Post('webhooks')
  @ApiOperation({ summary: 'Create a new webhook' })
  @ApiResponse({ status: 201, description: 'Webhook created' })
  async createWebhook(@Body() dto: CreateWebhookDto) {
    return this.integrationsService.createWebhook(dto);
  }

  @Delete('webhooks/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete webhook' })
  @ApiParam({ name: 'id', description: 'Webhook ID' })
  @ApiResponse({ status: 204, description: 'Webhook deleted' })
  async deleteWebhook(@Param('id') id: string) {
    return this.integrationsService.deleteWebhook(id);
  }

  @Get('webhooks/logs')
  @ApiOperation({ summary: 'Get webhook logs' })
  @ApiResponse({ status: 200, description: 'Webhook logs' })
  async getWebhookLogs(@Query() query: GetWebhookLogsDto) {
    return this.integrationsService.getWebhookLogs(query);
  }

  @Post('webhooks/:id/receive')
  @ApiOperation({ summary: 'Receive incoming webhook' })
  @ApiParam({ name: 'id', description: 'Webhook ID' })
  @ApiResponse({ status: 200, description: 'Webhook received' })
  async receiveWebhook(@Param('id') id: string, @Body() payload: any) {
    return this.integrationsService.receiveWebhook(id, payload);
  }

  // API Keys
  @Get('api-keys')
  @ApiOperation({ summary: 'Get all API keys' })
  @ApiResponse({ status: 200, description: 'List of API keys (without secrets)' })
  async getApiKeys() {
    return this.integrationsService.getApiKeys();
  }

  @Post('api-keys')
  @ApiOperation({ summary: 'Create a new API key' })
  @ApiResponse({ status: 201, description: 'API key created (secret shown only once)' })
  async createApiKey(@Body() dto: CreateApiKeyDto) {
    return this.integrationsService.createApiKey(dto);
  }

  @Delete('api-keys/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Revoke API key' })
  @ApiParam({ name: 'id', description: 'API key ID' })
  @ApiResponse({ status: 204, description: 'API key revoked' })
  async revokeApiKey(@Param('id') id: string) {
    return this.integrationsService.revokeApiKey(id);
  }
}
