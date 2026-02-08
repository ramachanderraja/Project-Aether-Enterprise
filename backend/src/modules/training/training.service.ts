import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class TrainingService {
  constructor(private readonly prisma: PrismaService) {}

  async getTrainingModules(userId: string, category?: string) {
    const where: Record<string, unknown> = { isActive: true };
    if (category) {
      where.category = category;
    }

    const modules = await this.prisma.trainingModule.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        category: true,
        duration: true,
        sortOrder: true,
      },
    });

    const completions = await this.prisma.trainingCompletion.findMany({
      where: { userId },
      select: { moduleId: true },
    });
    const completedIds = new Set(completions.map((c) => c.moduleId));

    const categories = [...new Set(modules.map((m) => m.category))];
    const totalMinutes = modules.reduce((sum, m) => {
      const match = m.duration.match(/(\d+)/);
      return sum + (match ? parseInt(match[1], 10) : 0);
    }, 0);

    return {
      modules: modules.map((m) => ({
        ...m,
        isCompleted: completedIds.has(m.id),
      })),
      totalDuration: `${totalMinutes} min`,
      categories,
    };
  }

  async getModuleDetails(moduleId: string, userId: string) {
    const module = await this.prisma.trainingModule.findFirst({
      where: {
        OR: [{ id: moduleId }, { slug: moduleId }],
        isActive: true,
      },
    });

    if (!module) {
      throw new NotFoundException(`Training module "${moduleId}" not found`);
    }

    const completion = await this.prisma.trainingCompletion.findUnique({
      where: {
        userId_moduleId: { userId, moduleId: module.id },
      },
    });

    return {
      ...module,
      isCompleted: !!completion,
      completedAt: completion?.completedAt?.toISOString() ?? null,
    };
  }

  async getUserProgress(userId: string) {
    const [totalModules, completions] = await Promise.all([
      this.prisma.trainingModule.count({ where: { isActive: true } }),
      this.prisma.trainingCompletion.findMany({
        where: { userId },
        include: { module: { select: { slug: true } } },
        orderBy: { completedAt: 'desc' },
      }),
    ]);

    const completedSlugs = completions.map((c) => c.module.slug);
    const totalTimeSpentMin = completions.reduce(
      (sum, c) => sum + (c.timeSpentMin ?? 0),
      0,
    );
    const lastActivity = completions[0]?.completedAt ?? null;

    // Calculate streak (consecutive days with completions)
    let streak = 0;
    if (completions.length > 0) {
      const dates = [
        ...new Set(
          completions.map((c) =>
            c.completedAt.toISOString().split('T')[0],
          ),
        ),
      ].sort((a, b) => b.localeCompare(a));

      const today = new Date().toISOString().split('T')[0];
      if (dates[0] === today || dates[0] === getPreviousDay(today)) {
        streak = 1;
        for (let i = 1; i < dates.length; i++) {
          if (dates[i] === getPreviousDay(dates[i - 1])) {
            streak++;
          } else {
            break;
          }
        }
      }
    }

    return {
      completedModules: completedSlugs,
      totalModules,
      percentComplete:
        totalModules > 0
          ? Math.round((completions.length / totalModules) * 100)
          : 0,
      lastActivity: lastActivity?.toISOString() ?? null,
      totalTimeSpentMin,
      streak,
    };
  }

  async markModuleComplete(
    moduleSlugOrId: string,
    userId: string,
    timeSpentMin?: number,
  ) {
    const module = await this.prisma.trainingModule.findFirst({
      where: {
        OR: [{ id: moduleSlugOrId }, { slug: moduleSlugOrId }],
        isActive: true,
      },
    });

    if (!module) {
      throw new NotFoundException(
        `Training module "${moduleSlugOrId}" not found`,
      );
    }

    const completion = await this.prisma.trainingCompletion.upsert({
      where: {
        userId_moduleId: { userId, moduleId: module.id },
      },
      update: {
        timeSpentMin: timeSpentMin ?? undefined,
      },
      create: {
        userId,
        moduleId: module.id,
        timeSpentMin: timeSpentMin ?? null,
      },
    });

    // Check if any certificates are now earned
    const newCertificates = await this.checkAndIssueCertificates(userId);

    return {
      success: true,
      moduleId: module.id,
      moduleSlug: module.slug,
      completedAt: completion.completedAt.toISOString(),
      newCertificates,
    };
  }

  async uncompleteModule(moduleSlugOrId: string, userId: string) {
    const module = await this.prisma.trainingModule.findFirst({
      where: {
        OR: [{ id: moduleSlugOrId }, { slug: moduleSlugOrId }],
        isActive: true,
      },
    });

    if (!module) {
      throw new NotFoundException(
        `Training module "${moduleSlugOrId}" not found`,
      );
    }

    await this.prisma.trainingCompletion.deleteMany({
      where: { userId, moduleId: module.id },
    });

    return { success: true, moduleId: module.id, moduleSlug: module.slug };
  }

  async getUserCertificates(userId: string) {
    const certificates = await this.prisma.trainingCertificate.findMany({
      where: { isActive: true },
      include: {
        requirements: {
          include: { module: { select: { id: true, slug: true, title: true } } },
        },
        issuances: {
          where: { userId },
        },
      },
    });

    const completions = await this.prisma.trainingCompletion.findMany({
      where: { userId },
      select: { moduleId: true },
    });
    const completedIds = new Set(completions.map((c) => c.moduleId));

    return certificates.map((cert) => {
      const requiredModuleSlugs = cert.requirements.map((r) => r.module.slug);
      const completedModuleSlugs = cert.requirements
        .filter((r) => completedIds.has(r.moduleId))
        .map((r) => r.module.slug);
      const issuance = cert.issuances[0];

      const progress =
        cert.requirements.length > 0
          ? Math.round(
              (completedModuleSlugs.length / cert.requirements.length) * 100,
            )
          : 0;

      return {
        id: cert.id,
        title: cert.title,
        description: cert.description,
        status: issuance ? ('earned' as const) : ('available' as const),
        progress,
        requiredModules: requiredModuleSlugs,
        completedModules: completedModuleSlugs,
        issuedAt: issuance?.issuedAt?.toISOString(),
        expiresAt: issuance?.expiresAt?.toISOString() ?? null,
      };
    });
  }

  private async checkAndIssueCertificates(userId: string): Promise<string[]> {
    const completions = await this.prisma.trainingCompletion.findMany({
      where: { userId },
      select: { moduleId: true },
    });
    const completedIds = new Set(completions.map((c) => c.moduleId));

    const certificates = await this.prisma.trainingCertificate.findMany({
      where: { isActive: true },
      include: {
        requirements: true,
        issuances: { where: { userId } },
      },
    });

    const newlyEarned: string[] = [];

    for (const cert of certificates) {
      // Skip if already issued
      if (cert.issuances.length > 0) continue;

      const allComplete = cert.requirements.every((r) =>
        completedIds.has(r.moduleId),
      );

      if (allComplete && cert.requirements.length > 0) {
        const expiresAt = cert.validityDays
          ? new Date(Date.now() + cert.validityDays * 86400000)
          : null;

        await this.prisma.certificateIssuance.create({
          data: {
            userId,
            certificateId: cert.id,
            expiresAt,
          },
        });
        newlyEarned.push(cert.title);
      }
    }

    return newlyEarned;
  }
}

function getPreviousDay(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().split('T')[0];
}
