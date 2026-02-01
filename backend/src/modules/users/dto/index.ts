import {
  IsOptional,
  IsString,
  IsEmail,
  IsEnum,
  IsArray,
  IsBoolean,
  IsInt,
  Min,
  Max,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ description: 'User email address' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'First name' })
  @IsString()
  @MinLength(1)
  first_name: string;

  @ApiProperty({ description: 'Last name' })
  @IsString()
  @MinLength(1)
  last_name: string;

  @ApiPropertyOptional({ description: 'User password (for local auth)' })
  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;

  @ApiProperty({ description: 'Role IDs to assign', type: [String] })
  @IsArray()
  @IsString({ each: true })
  role_ids: string[];

  @ApiPropertyOptional({ description: 'Department' })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiPropertyOptional({ description: 'Job title' })
  @IsOptional()
  @IsString()
  title?: string;
}

export class UpdateUserDto {
  @ApiPropertyOptional({ description: 'First name' })
  @IsOptional()
  @IsString()
  first_name?: string;

  @ApiPropertyOptional({ description: 'Last name' })
  @IsOptional()
  @IsString()
  last_name?: string;

  @ApiPropertyOptional({ description: 'Role IDs to assign', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  role_ids?: string[];

  @ApiPropertyOptional({ description: 'Department' })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiPropertyOptional({ description: 'Job title' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: 'Active status' })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

export class GetUsersDto {
  @ApiPropertyOptional({ description: 'Filter by role' })
  @IsOptional()
  @IsString()
  role?: string;

  @ApiPropertyOptional({ enum: ['active', 'inactive', 'pending'] })
  @IsOptional()
  @IsEnum(['active', 'inactive', 'pending'])
  status?: string;

  @ApiPropertyOptional({ description: 'Filter by department' })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiPropertyOptional({ description: 'Search by name or email' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

export class InviteUserDto {
  @ApiProperty({ description: 'Email to invite' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Role IDs to assign', type: [String] })
  @IsArray()
  @IsString({ each: true })
  role_ids: string[];

  @ApiPropertyOptional({ description: 'Personal message in invitation' })
  @IsOptional()
  @IsString()
  message?: string;
}

export class ChangePasswordDto {
  @ApiProperty({ description: 'Current password' })
  @IsString()
  current_password: string;

  @ApiProperty({ description: 'New password' })
  @IsString()
  @MinLength(8)
  new_password: string;
}

export class UpdateProfileDto {
  @ApiPropertyOptional({ description: 'First name' })
  @IsOptional()
  @IsString()
  first_name?: string;

  @ApiPropertyOptional({ description: 'Last name' })
  @IsOptional()
  @IsString()
  last_name?: string;

  @ApiPropertyOptional({ description: 'Phone number' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'Timezone' })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiPropertyOptional({ description: 'Notification preferences' })
  @IsOptional()
  notification_preferences?: Record<string, boolean>;
}
