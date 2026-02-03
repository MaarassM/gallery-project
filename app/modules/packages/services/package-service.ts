import { prisma } from "~/lib/db/client";
import type { PackageType } from "@prisma/client";

/**
 * Package Service
 *
 * Handles package limits and usage tracking
 */

export class PackageService {
  static async getPackage(type: PackageType) {
    return await prisma.package.findUnique({ where: { type } });
  }

  static async getUserPackage(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { package: true },
    });
    if (!user) throw new Error("User not found");
    if (!user.package) throw new Error("Package not found");
    return user.package;
  }

  static async checkUploadLimit(userId: string): Promise<void> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error("User not found");

    const pkg = await this.getPackage(user.packageType);
    if (!pkg) throw new Error("Package not found");

    // Check monthly limit
    const now = new Date();
    const usage = await prisma.usageTracking.findUnique({
      where: {
        userId_month_year: {
          userId,
          month: now.getMonth() + 1,
          year: now.getFullYear(),
        },
      },
    });

    if (pkg.maxPhotosPerMonth !== -1) {
      const uploaded = usage?.photosUploaded || 0;
      if (uploaded >= pkg.maxPhotosPerMonth) {
        throw new Error(
          `Monthly upload limit reached (${pkg.maxPhotosPerMonth} photos)`,
        );
      }
    }

    // Check storage limit
    if (pkg.maxStorageGB !== -1) {
      const storageUsedGB = (usage?.storageUsedMB || 0) / 1024;
      if (storageUsedGB >= pkg.maxStorageGB) {
        throw new Error(
          `Storage limit reached (${pkg.maxStorageGB}GB). Please delete some photos or upgrade your package.`,
        );
      }
    }
  }

  static async trackUpload(userId: string, fileSizeMB: number): Promise<void> {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    await prisma.usageTracking.upsert({
      where: {
        userId_month_year: { userId, month, year },
      },
      update: {
        photosUploaded: { increment: 1 },
        storageUsedMB: { increment: fileSizeMB },
      },
      create: {
        userId,
        month,
        year,
        photosUploaded: 1,
        storageUsedMB: fileSizeMB,
      },
    });
  }

  static async trackDownload(userId: string): Promise<void> {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    await prisma.usageTracking.upsert({
      where: {
        userId_month_year: { userId, month, year },
      },
      update: {
        downloads: { increment: 1 },
      },
      create: {
        userId,
        month,
        year,
        downloads: 1,
      },
    });
  }

  static async canDownloadOriginal(userId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return false;

    const pkg = await this.getPackage(user.packageType);
    return pkg?.canDownloadOriginal || false;
  }

  static async canApplyFilters(userId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return false;

    const pkg = await this.getPackage(user.packageType);
    return pkg?.canApplyFilters || false;
  }

  static async getMaxFilters(userId: string): Promise<number> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return 0;

    const pkg = await this.getPackage(user.packageType);
    return pkg?.maxFiltersPerDownload || 0;
  }
}
