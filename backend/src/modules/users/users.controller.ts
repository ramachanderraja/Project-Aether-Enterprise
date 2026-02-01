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
  Request,
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
import { UsersService } from './users.service';
import {
  CreateUserDto,
  UpdateUserDto,
  GetUsersDto,
  InviteUserDto,
  ChangePasswordDto,
  UpdateProfileDto,
} from './dto';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Get all users with filtering' })
  @ApiResponse({ status: 200, description: 'List of users' })
  async getUsers(@Query() query: GetUsersDto) {
    return this.usersService.getUsers(query);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Current user details' })
  async getCurrentUser(@Request() req) {
    return this.usersService.getUserById(req.user.id);
  }

  @Put('me')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated' })
  async updateProfile(@Request() req, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(req.user.id, dto);
  }

  @Post('me/change-password')
  @ApiOperation({ summary: 'Change current user password' })
  @ApiResponse({ status: 200, description: 'Password changed' })
  @ApiResponse({ status: 400, description: 'Current password incorrect' })
  async changePassword(@Request() req, @Body() dto: ChangePasswordDto) {
    return this.usersService.changePassword(req.user.id, dto);
  }

  @Get('me/activity')
  @ApiOperation({ summary: 'Get current user activity' })
  @ApiResponse({ status: 200, description: 'User activity' })
  async getMyActivity(@Request() req) {
    return this.usersService.getUserActivity(req.user.id);
  }

  @Get('invitations')
  @ApiOperation({ summary: 'Get pending invitations' })
  @ApiResponse({ status: 200, description: 'List of pending invitations' })
  async getPendingInvitations() {
    return this.usersService.getPendingInvitations();
  }

  @Post('invitations')
  @ApiOperation({ summary: 'Invite a new user' })
  @ApiResponse({ status: 201, description: 'Invitation sent' })
  @ApiResponse({ status: 409, description: 'User or invitation already exists' })
  async inviteUser(@Body() dto: InviteUserDto, @Request() req) {
    return this.usersService.inviteUser(dto, req.user.id);
  }

  @Post('invitations/:id/resend')
  @ApiOperation({ summary: 'Resend invitation' })
  @ApiParam({ name: 'id', description: 'Invitation ID' })
  @ApiResponse({ status: 200, description: 'Invitation resent' })
  async resendInvitation(@Param('id') id: string) {
    return this.usersService.resendInvitation(id);
  }

  @Delete('invitations/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Cancel invitation' })
  @ApiParam({ name: 'id', description: 'Invitation ID' })
  @ApiResponse({ status: 204, description: 'Invitation cancelled' })
  async cancelInvitation(@Param('id') id: string) {
    return this.usersService.cancelInvitation(id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User details' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserById(@Param('id') id: string) {
    return this.usersService.getUserById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: 201, description: 'User created' })
  @ApiResponse({ status: 409, description: 'User already exists' })
  async createUser(@Body() dto: CreateUserDto, @Request() req) {
    return this.usersService.createUser(dto, req.user.tenantId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update user' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User updated' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async updateUser(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.updateUser(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete user' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 204, description: 'User deleted' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async deleteUser(@Param('id') id: string) {
    return this.usersService.deleteUser(id);
  }

  @Post(':id/deactivate')
  @ApiOperation({ summary: 'Deactivate user' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User deactivated' })
  async deactivateUser(@Param('id') id: string) {
    return this.usersService.deactivateUser(id);
  }

  @Post(':id/reactivate')
  @ApiOperation({ summary: 'Reactivate user' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User reactivated' })
  async reactivateUser(@Param('id') id: string) {
    return this.usersService.reactivateUser(id);
  }

  @Get(':id/activity')
  @ApiOperation({ summary: 'Get user activity' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User activity' })
  async getUserActivity(@Param('id') id: string) {
    return this.usersService.getUserActivity(id);
  }
}
