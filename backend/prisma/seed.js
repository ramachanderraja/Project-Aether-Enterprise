const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

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

  // Seed Training Modules
  const trainingModules = [
    { slug: 'overview', title: 'System Architecture', description: 'Project Aether Overview and Core Capabilities', category: 'fundamentals', duration: '10 min', sortOrder: 1, content: { sections: [{ title: 'Core Capabilities', items: ['Digital Twin', 'Generative Reasoning', 'Auto-Correction', 'Explainable AI'] }, { title: 'Architecture Layers', items: ['Executive Experience Layer', 'Agent Orchestration', 'Intelligent Core', 'Unified Data Fabric'] }] }, resources: [{ type: 'video', title: 'Architecture Overview', url: '/videos/architecture.mp4' }, { type: 'pdf', title: 'Technical Whitepaper', url: '/docs/whitepaper.pdf' }] },
    { slug: 'sales', title: 'Sales Performance', description: 'The Revenue Engine - Pipeline and Forecasting', category: 'modules', duration: '8 min', sortOrder: 2, content: { sections: [{ title: 'Filtering & Segmentation', items: ['Region', 'Line of Business (LOB)', 'Vertical'] }, { title: 'Key Features', items: ['Sales Funnel Analysis', 'Stalled Opportunities', 'Channel Breakdown'] }] }, resources: [] },
    { slug: 'reports', title: 'Profitability Reports', description: 'Strategic Profitability Analysis', category: 'modules', duration: '7 min', sortOrder: 3, content: { sections: [{ title: 'Key Features', items: ['License vs. Implementation Toggle', 'Margin by Segment', 'Account Distribution', 'Net Margin Trend'] }] }, resources: [] },
    { slug: 'marketing', title: 'Marketing Metrics', description: 'Acquisition Engine and Channel Performance', category: 'modules', duration: '6 min', sortOrder: 4, content: { sections: [{ title: 'Key Features', items: ['Marketing Funnel', 'Lead Distribution', 'Channel Efficiency', 'Campaign Performance'] }] }, resources: [] },
    { slug: 'gtm', title: 'Go-To-Market (GTM)', description: 'Unit Economics and SaaS Metrics', category: 'modules', duration: '5 min', sortOrder: 5, content: { sections: [{ title: 'Key Metrics', items: ['CAC Payback Period', 'LTV:CAC Ratio', 'Net Revenue Retention', 'Magic Number', 'Rule of 40', 'Cost Per Lead'] }] }, resources: [] },
    { slug: 'revenue', title: 'Revenue & Profitability', description: 'Profitability & SaaS Metrics Deep Dive', category: 'modules', duration: '8 min', sortOrder: 6, content: { sections: [{ title: 'Revenue Waterfall', items: ['Base Contracted', 'New Pipeline', 'Churn', 'Final Forecast'] }, { title: 'Product Profitability', items: ['Contribution Margin analysis by product line'] }] }, resources: [] },
    { slug: 'cost', title: 'Cost Intelligence', description: 'The Efficiency Engine - Cost Control', category: 'advanced', duration: '7 min', sortOrder: 7, content: { sections: [{ title: 'Phantom Cost Hunter', items: ['Duplicate SaaS licenses', 'Unused seats', 'T&E Policy Violations'] }, { title: 'Vendor Spend Analysis', items: ['Treemap visualization', 'YoY growth tracking'] }] }, resources: [] },
    { slug: 'intelligence', title: 'The Intelligent Core', description: 'Central Neural Engine and ML Operations', category: 'advanced', duration: '9 min', sortOrder: 8, content: { sections: [{ title: 'Model Drift Detection', items: ['Accuracy monitoring', 'Auto-retraining pipeline'] }, { title: 'Active Models', items: ['Revenue Forecasting (94.3%)', 'Anomaly Detection (96.7%)', 'Churn Prediction (89.1%)', 'Driver Analysis (91.2%)'] }] }, resources: [] },
    { slug: 'scenarios', title: 'Scenario Planning', description: 'Monte Carlo Simulation and Risk Analysis', category: 'advanced', duration: '8 min', sortOrder: 9, content: { sections: [{ title: 'Simulation', items: ['10,000 Monte Carlo simulations', 'Probability distribution outputs'] }, { title: 'GenAI Analysis', items: ['Mitigation Strategies', 'Growth Opportunities'] }] }, resources: [] },
    { slug: 'governance', title: 'Governance & Lineage', description: 'Trust, Compliance, and Audit Trails', category: 'advanced', duration: '6 min', sortOrder: 10, content: { sections: [{ title: 'Key Features', items: ['Data Lineage Explorer', 'Audit Trail', 'SOX Compliance'] }] }, resources: [] },
    { slug: 'data-import', title: 'Data Import & Templates', description: 'CSV Templates and Import Best Practices', category: 'fundamentals', duration: '10 min', sortOrder: 11, content: { sections: [{ title: 'Templates', items: ['Financial Metrics', 'Profitability Data', 'Sales Performance', 'Revenue Analytics', 'Cost Data', 'Vendors', 'Cost Centers'] }, { title: 'Best Practices', items: ['Download templates first', 'Use consistent naming', 'Date format: YYYY-MM-DD', 'No currency symbols', 'Max 50MB file size'] }] }, resources: [] },
  ];

  for (const mod of trainingModules) {
    await prisma.trainingModule.upsert({
      where: { slug: mod.slug },
      update: { title: mod.title, description: mod.description, category: mod.category, duration: mod.duration, sortOrder: mod.sortOrder, content: mod.content, resources: mod.resources },
      create: { ...mod, isActive: true },
    });
  }
  console.log('Created training modules');

  // Seed Training Certificates
  const fundamentalsModules = await prisma.trainingModule.findMany({ where: { category: 'fundamentals' } });
  const advancedModules = await prisma.trainingModule.findMany({ where: { category: 'advanced' } });
  const allModules = await prisma.trainingModule.findMany();

  const certificates = [
    { title: 'Aether Fundamentals', description: 'Complete all fundamental training modules', validityDays: 365, moduleIds: fundamentalsModules.map((m) => m.id) },
    { title: 'Advanced Analytics', description: 'Master advanced analytics and AI capabilities', validityDays: 365, moduleIds: advancedModules.map((m) => m.id) },
    { title: 'Aether Platform Expert', description: 'Complete all training modules for full certification', validityDays: 730, moduleIds: allModules.map((m) => m.id) },
  ];

  for (const cert of certificates) {
    const { moduleIds, ...certData } = cert;
    const certificate = await prisma.trainingCertificate.upsert({
      where: { title: certData.title },
      update: certData,
      create: { ...certData, isActive: true }
    });
    // Delete existing requirements to avoid duplicates
    await prisma.certificateRequirement.deleteMany({ where: { certificateId: certificate.id } });
    // Create fresh requirements
    for (const moduleId of moduleIds) {
      await prisma.certificateRequirement.create({ data: { certificateId: certificate.id, moduleId } });
    }
  }
  console.log('Created training certificates');

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
