import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ReportsService } from './reports.service';
import {
  CreateReportDto,
  ScheduleReportDto,
  ReportTemplateDto,
  ExportDataDto,
  ReportType,
} from './dto';

@ApiTags('Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  // Report generation
  @Post('generate')
  @ApiOperation({ summary: 'Generate a new report' })
  async generateReport(@Request() req, @Body() dto: CreateReportDto) {
    return this.reportsService.generateReport(req.user.organizationId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all generated reports' })
  @ApiQuery({ name: 'type', enum: ReportType, required: false })
  async getReports(@Request() req, @Query('type') type?: ReportType) {
    return this.reportsService.getReports(req.user.organizationId, type);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get report by ID' })
  async getReport(@Request() req, @Param('id') id: string) {
    return this.reportsService.getReport(req.user.organizationId, id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a report' })
  async deleteReport(@Request() req, @Param('id') id: string) {
    return this.reportsService.deleteReport(req.user.organizationId, id);
  }

  // Scheduled reports
  @Post('schedule')
  @ApiOperation({ summary: 'Schedule a recurring report' })
  async scheduleReport(@Request() req, @Body() dto: ScheduleReportDto) {
    return this.reportsService.scheduleReport(req.user.organizationId, dto);
  }

  @Get('schedules/list')
  @ApiOperation({ summary: 'Get all scheduled reports' })
  async getScheduledReports(@Request() req) {
    return this.reportsService.getScheduledReports(req.user.organizationId);
  }

  @Delete('schedules/:id')
  @ApiOperation({ summary: 'Cancel a scheduled report' })
  async cancelScheduledReport(@Request() req, @Param('id') id: string) {
    return this.reportsService.cancelScheduledReport(req.user.organizationId, id);
  }

  // Report templates
  @Post('templates')
  @ApiOperation({ summary: 'Create a report template' })
  async createTemplate(@Request() req, @Body() dto: ReportTemplateDto) {
    return this.reportsService.createTemplate(req.user.organizationId, dto);
  }

  @Get('templates/list')
  @ApiOperation({ summary: 'Get all report templates' })
  async getTemplates(@Request() req) {
    return this.reportsService.getTemplates(req.user.organizationId);
  }

  @Delete('templates/:id')
  @ApiOperation({ summary: 'Delete a report template' })
  async deleteTemplate(@Request() req, @Param('id') id: string) {
    return this.reportsService.deleteTemplate(req.user.organizationId, id);
  }

  // Data export
  @Post('export')
  @ApiOperation({ summary: 'Export data to file' })
  async exportData(@Request() req, @Body() dto: ExportDataDto) {
    return this.reportsService.exportData(req.user.organizationId, dto);
  }

  @Get('exports/history')
  @ApiOperation({ summary: 'Get export history' })
  async getExportHistory(@Request() req) {
    return this.reportsService.getExportHistory(req.user.organizationId);
  }
}
