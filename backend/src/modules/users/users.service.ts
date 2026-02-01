import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import {
  CreateUserDto,
  UpdateUserDto,
  GetUsersDto,
  InviteUserDto,
  ChangePasswordDto,
  UpdateProfileDto,
} from './dto';

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  password_hash?: string;
  role_ids: string[];
  department?: string;
  title?: string;
  phone?: string;
  timezone: string;
  notification_preferences: Record<string, boolean>;
  status: 'active' | 'inactive' | 'pending';
  last_login: Date | null;
  created_at: Date;
  updated_at: Date;
  tenant_id: string;
}

interface Invitation {
  id: string;
  email: string;
  role_ids: string[];
  message?: string;
  status: 'pending' | 'accepted' | 'expired';
  expires_at: Date;
  created_at: Date;
  invited_by: string;
}

@Injectable()
export class UsersService {
  private users: Map<string, User> = new Map();
  private invitations: Map<string, Invitation> = new Map();

  constructor() {
    this.initializeMockData();
  }

  private initializeMockData(): void {
    const users: User[] = [
      {
        id: 'user_001',
        email: 'john.smith@company.com',
        first_name: 'John',
        last_name: 'Smith',
        password_hash: 'hashed_password',
        role_ids: ['role_001'],
        department: 'Finance',
        title: 'CFO',
        timezone: 'America/New_York',
        notification_preferences: { email: true, slack: true, in_app: true },
        status: 'active',
        last_login: new Date(Date.now() - 3600000),
        created_at: new Date('2024-01-01'),
        updated_at: new Date(),
        tenant_id: 'tenant_001',
      },
      {
        id: 'user_002',
        email: 'jane.doe@company.com',
        first_name: 'Jane',
        last_name: 'Doe',
        password_hash: 'hashed_password',
        role_ids: ['role_002'],
        department: 'Finance',
        title: 'FP&A Director',
        timezone: 'America/New_York',
        notification_preferences: { email: true, slack: true, in_app: true },
        status: 'active',
        last_login: new Date(Date.now() - 86400000),
        created_at: new Date('2024-01-01'),
        updated_at: new Date(),
        tenant_id: 'tenant_001',
      },
      {
        id: 'user_003',
        email: 'mike.wilson@company.com',
        first_name: 'Mike',
        last_name: 'Wilson',
        password_hash: 'hashed_password',
        role_ids: ['role_003'],
        department: 'Sales',
        title: 'VP of Sales',
        timezone: 'America/Los_Angeles',
        notification_preferences: { email: true, slack: false, in_app: true },
        status: 'active',
        last_login: new Date(Date.now() - 172800000),
        created_at: new Date('2024-01-15'),
        updated_at: new Date(),
        tenant_id: 'tenant_001',
      },
      {
        id: 'user_004',
        email: 'sarah.johnson@company.com',
        first_name: 'Sarah',
        last_name: 'Johnson',
        password_hash: 'hashed_password',
        role_ids: ['role_004'],
        department: 'Finance',
        title: 'Senior Analyst',
        timezone: 'America/Chicago',
        notification_preferences: { email: true, slack: true, in_app: true },
        status: 'active',
        last_login: new Date(Date.now() - 7200000),
        created_at: new Date('2024-01-15'),
        updated_at: new Date(),
        tenant_id: 'tenant_001',
      },
      {
        id: 'user_005',
        email: 'bob.williams@company.com',
        first_name: 'Bob',
        last_name: 'Williams',
        password_hash: 'hashed_password',
        role_ids: ['role_004'],
        department: 'Finance',
        title: 'Analyst',
        timezone: 'America/New_York',
        notification_preferences: { email: true, slack: false, in_app: true },
        status: 'inactive',
        last_login: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        created_at: new Date('2024-01-15'),
        updated_at: new Date(),
        tenant_id: 'tenant_001',
      },
    ];

    users.forEach(user => this.users.set(user.id, user));

    // Add a pending invitation
    this.invitations.set('inv_001', {
      id: 'inv_001',
      email: 'emily.davis@company.com',
      role_ids: ['role_005'],
      message: 'Welcome to Aether! Please complete your registration.',
      status: 'pending',
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      created_at: new Date(),
      invited_by: 'user_001',
    });
  }

  async getUsers(dto: GetUsersDto): Promise<{
    data: Omit<User, 'password_hash'>[];
    pagination: { page: number; limit: number; total: number; pages: number };
  }> {
    let users = Array.from(this.users.values());

    // Apply filters
    if (dto.status) {
      users = users.filter(u => u.status === dto.status);
    }
    if (dto.role) {
      users = users.filter(u => u.role_ids.includes(dto.role!));
    }
    if (dto.department) {
      users = users.filter(u => u.department === dto.department);
    }
    if (dto.search) {
      const search = dto.search.toLowerCase();
      users = users.filter(u =>
        u.email.toLowerCase().includes(search) ||
        u.first_name.toLowerCase().includes(search) ||
        u.last_name.toLowerCase().includes(search)
      );
    }

    // Sort by name
    users.sort((a, b) => `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`));

    const total = users.length;
    const page = dto.page || 1;
    const limit = dto.limit || 20;
    const start = (page - 1) * limit;
    const paginatedUsers = users.slice(start, start + limit);

    // Remove password hash from response
    const sanitizedUsers = paginatedUsers.map(({ password_hash, ...user }) => user);

    return {
      data: sanitizedUsers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getUserById(id: string): Promise<Omit<User, 'password_hash'>> {
    const user = this.users.get(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    const { password_hash, ...sanitizedUser } = user;
    return sanitizedUser;
  }

  async createUser(dto: CreateUserDto, tenantId: string): Promise<Omit<User, 'password_hash'>> {
    // Check if email already exists
    const existingUser = Array.from(this.users.values()).find(u => u.email === dto.email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const id = `user_${Date.now()}`;

    const user: User = {
      id,
      email: dto.email,
      first_name: dto.first_name,
      last_name: dto.last_name,
      password_hash: dto.password ? `hashed_${dto.password}` : undefined,
      role_ids: dto.role_ids,
      department: dto.department,
      title: dto.title,
      timezone: 'America/New_York',
      notification_preferences: { email: true, slack: false, in_app: true },
      status: 'active',
      last_login: null,
      created_at: new Date(),
      updated_at: new Date(),
      tenant_id: tenantId,
    };

    this.users.set(id, user);

    const { password_hash, ...sanitizedUser } = user;
    return sanitizedUser;
  }

  async updateUser(id: string, dto: UpdateUserDto): Promise<Omit<User, 'password_hash'>> {
    const user = this.users.get(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    const updated: User = {
      ...user,
      ...dto,
      updated_at: new Date(),
    };

    this.users.set(id, updated);

    const { password_hash, ...sanitizedUser } = updated;
    return sanitizedUser;
  }

  async deleteUser(id: string): Promise<void> {
    const user = this.users.get(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    this.users.delete(id);
  }

  async inviteUser(dto: InviteUserDto, inviterId: string): Promise<Invitation> {
    // Check if email already exists
    const existingUser = Array.from(this.users.values()).find(u => u.email === dto.email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Check for existing pending invitation
    const existingInvitation = Array.from(this.invitations.values()).find(
      i => i.email === dto.email && i.status === 'pending'
    );
    if (existingInvitation) {
      throw new ConflictException('Pending invitation already exists for this email');
    }

    const id = `inv_${Date.now()}`;

    const invitation: Invitation = {
      id,
      email: dto.email,
      role_ids: dto.role_ids,
      message: dto.message,
      status: 'pending',
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      created_at: new Date(),
      invited_by: inviterId,
    };

    this.invitations.set(id, invitation);

    // In real implementation, send invitation email here

    return invitation;
  }

  async getPendingInvitations(): Promise<Invitation[]> {
    return Array.from(this.invitations.values()).filter(i => i.status === 'pending');
  }

  async resendInvitation(id: string): Promise<Invitation> {
    const invitation = this.invitations.get(id);
    if (!invitation) {
      throw new NotFoundException(`Invitation with ID ${id} not found`);
    }

    if (invitation.status !== 'pending') {
      throw new BadRequestException('Only pending invitations can be resent');
    }

    // Reset expiration
    invitation.expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    this.invitations.set(id, invitation);

    // In real implementation, resend invitation email here

    return invitation;
  }

  async cancelInvitation(id: string): Promise<void> {
    const invitation = this.invitations.get(id);
    if (!invitation) {
      throw new NotFoundException(`Invitation with ID ${id} not found`);
    }

    this.invitations.delete(id);
  }

  async changePassword(userId: string, dto: ChangePasswordDto): Promise<{ success: boolean }> {
    const user = this.users.get(userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // In real implementation, verify current password
    if (user.password_hash !== `hashed_${dto.current_password}`) {
      throw new BadRequestException('Current password is incorrect');
    }

    user.password_hash = `hashed_${dto.new_password}`;
    user.updated_at = new Date();
    this.users.set(userId, user);

    return { success: true };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<Omit<User, 'password_hash'>> {
    const user = this.users.get(userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const updated: User = {
      ...user,
      ...dto,
      updated_at: new Date(),
    };

    this.users.set(userId, updated);

    const { password_hash, ...sanitizedUser } = updated;
    return sanitizedUser;
  }

  async getUserActivity(userId: string): Promise<{
    last_login: Date | null;
    sessions_count: number;
    recent_actions: { action: string; timestamp: Date; resource: string }[];
  }> {
    const user = await this.getUserById(userId);

    // Mock activity data
    return {
      last_login: user.last_login,
      sessions_count: 2,
      recent_actions: [
        { action: 'login', timestamp: new Date(Date.now() - 3600000), resource: 'auth' },
        { action: 'view', timestamp: new Date(Date.now() - 3700000), resource: 'dashboard' },
        { action: 'create', timestamp: new Date(Date.now() - 4000000), resource: 'scenario' },
        { action: 'approve', timestamp: new Date(Date.now() - 86400000), resource: 'budget' },
      ],
    };
  }

  async deactivateUser(id: string): Promise<Omit<User, 'password_hash'>> {
    const user = this.users.get(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    user.status = 'inactive';
    user.updated_at = new Date();
    this.users.set(id, user);

    const { password_hash, ...sanitizedUser } = user;
    return sanitizedUser;
  }

  async reactivateUser(id: string): Promise<Omit<User, 'password_hash'>> {
    const user = this.users.get(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    user.status = 'active';
    user.updated_at = new Date();
    this.users.set(id, user);

    const { password_hash, ...sanitizedUser } = user;
    return sanitizedUser;
  }
}
