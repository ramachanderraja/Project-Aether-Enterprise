import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...');

  // Create default tenant
  const tenant = await prisma.tenant.upsert({
    where: { domain: 'demo.aether.local' },
    update: {},
    create: {
      name: 'Demo Organization',
      domain: 'demo.aether.local',
      plan: 'enterprise',
      isActive: true,
    },
  });
  console.log('Created tenant:', tenant.name);

  // Create permissions
  const permissions = [
    { name: 'dashboard:view', resource: 'dashboard', action: 'view', description: 'View dashboard' },
    { name: 'dashboard:edit', resource: 'dashboard', action: 'edit', description: 'Edit dashboard' },
    { name: 'scenarios:view', resource: 'scenarios', action: 'view', description: 'View scenarios' },
    { name: 'scenarios:create', resource: 'scenarios', action: 'create', description: 'Create scenarios' },
    { name: 'scenarios:edit', resource: 'scenarios', action: 'edit', description: 'Edit scenarios' },
    { name: 'scenarios:delete', resource: 'scenarios', action: 'delete', description: 'Delete scenarios' },
    { name: 'users:view', resource: 'users', action: 'view', description: 'View users' },
    { name: 'users:manage', resource: 'users', action: 'manage', description: 'Manage users' },
    { name: 'settings:view', resource: 'settings', action: 'view', description: 'View settings' },
    { name: 'settings:edit', resource: 'settings', action: 'edit', description: 'Edit settings' },
    { name: 'ai:use', resource: 'ai', action: 'use', description: 'Use AI features' },
  ];

  for (const perm of permissions) {
    await prisma.permission.upsert({
      where: { name: perm.name },
      update: {},
      create: perm,
    });
  }
  console.log('Created permissions');

  // Create admin role with all permissions
  const adminRole = await prisma.role.upsert({
    where: { name: 'admin' },
    update: {},
    create: {
      name: 'admin',
      description: 'Administrator with full access',
      isSystem: true,
    },
  });

  // Assign all permissions to admin role
  const allPermissions = await prisma.permission.findMany();
  for (const perm of allPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: adminRole.id,
          permissionId: perm.id,
        },
      },
      update: {},
      create: {
        roleId: adminRole.id,
        permissionId: perm.id,
      },
    });
  }
  console.log('Created admin role with permissions');

  // Create analyst role
  const analystRole = await prisma.role.upsert({
    where: { name: 'analyst' },
    update: {},
    create: {
      name: 'analyst',
      description: 'Financial analyst',
      isSystem: true,
    },
  });

  const analystPermissions = ['dashboard:view', 'scenarios:view', 'scenarios:create', 'ai:use'];
  for (const permName of analystPermissions) {
    const perm = await prisma.permission.findUnique({ where: { name: permName } });
    if (perm) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: analystRole.id,
            permissionId: perm.id,
          },
        },
        update: {},
        create: {
          roleId: analystRole.id,
          permissionId: perm.id,
        },
      });
    }
  }
  console.log('Created analyst role');

  // Create demo admin user
  // Password: Demo@2024
  const hashedPassword = await bcrypt.hash('Demo@2024', 10);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@demo.com' },
    update: {
      passwordHash: hashedPassword,
    },
    create: {
      email: 'admin@demo.com',
      passwordHash: hashedPassword,
      firstName: 'Demo',
      lastName: 'Admin',
      isActive: true,
      tenantId: tenant.id,
    },
  });

  // Assign admin role to user
  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: adminUser.id,
        roleId: adminRole.id,
      },
    },
    update: {},
    create: {
      userId: adminUser.id,
      roleId: adminRole.id,
    },
  });

  // Create user preferences
  await prisma.userPreference.upsert({
    where: { userId: adminUser.id },
    update: {},
    create: {
      userId: adminUser.id,
      theme: 'light',
      locale: 'en-US',
      timezone: 'America/New_York',
      defaultCurrency: 'USD',
    },
  });

  console.log('Created demo admin user: admin@demo.com / Demo@2024');

  // Create a regular analyst user
  const analystUser = await prisma.user.upsert({
    where: { email: 'analyst@demo.com' },
    update: {
      passwordHash: hashedPassword,
    },
    create: {
      email: 'analyst@demo.com',
      passwordHash: hashedPassword,
      firstName: 'Demo',
      lastName: 'Analyst',
      isActive: true,
      tenantId: tenant.id,
    },
  });

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: analystUser.id,
        roleId: analystRole.id,
      },
    },
    update: {},
    create: {
      userId: analystUser.id,
      roleId: analystRole.id,
    },
  });

  await prisma.userPreference.upsert({
    where: { userId: analystUser.id },
    update: {},
    create: {
      userId: analystUser.id,
      theme: 'light',
      locale: 'en-US',
      timezone: 'America/New_York',
      defaultCurrency: 'USD',
    },
  });

  console.log('Created demo analyst user: analyst@demo.com / Demo@2024');

  console.log('\n=== Seed completed successfully ===');
  console.log('\nDemo Credentials:');
  console.log('  Admin:   admin@demo.com / Demo@2024');
  console.log('  Analyst: analyst@demo.com / Demo@2024');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
