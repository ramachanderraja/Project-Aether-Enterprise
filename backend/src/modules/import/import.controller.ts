import {
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ImportService } from './import.service';
import { ImportOptionsDto, ImportResultDto, ValidationResultDto } from './dto';

@Controller('import')
@UseGuards(JwtAuthGuard)
export class ImportController {
  constructor(private readonly importService: ImportService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async importFile(
    @UploadedFile() file: Express.Multer.File,
    @Query('entityType') entityType: string,
    @Query() options: ImportOptionsDto,
  ): Promise<ImportResultDto> {
    this.validateFile(file);
    if (!entityType) throw new BadRequestException('entityType query parameter is required');

    const csvContent = file.buffer.toString('utf-8');
    return this.importService.importCSVFile(entityType, csvContent, options);
  }

  @Post('validate')
  @UseInterceptors(FileInterceptor('file'))
  async validateImport(
    @UploadedFile() file: Express.Multer.File,
    @Query('entityType') entityType: string,
  ): Promise<ValidationResultDto> {
    this.validateFile(file);
    if (!entityType) throw new BadRequestException('entityType query parameter is required');

    const csvContent = file.buffer.toString('utf-8');
    return this.importService.validateImport(csvContent, entityType);
  }

  private validateFile(file: Express.Multer.File): void {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    if (!file.originalname.endsWith('.csv')) {
      throw new BadRequestException('File must be a CSV file');
    }

    if (file.size > 10 * 1024 * 1024) {
      throw new BadRequestException('File size must be less than 10MB');
    }
  }
}
