import { PrismaClient, PackageType } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create packages
  const packages = [
    {
      type: PackageType.FREE,
      name: "Free Tier",
      maxPhotosPerMonth: 10,
      maxPhotoSizeMB: 5,
      maxStorageGB: 1,
      canDownloadOriginal: false,
      canApplyFilters: false,
      maxFiltersPerDownload: 0,
    },
    {
      type: PackageType.PRO,
      name: "Pro Plan",
      maxPhotosPerMonth: 100,
      maxPhotoSizeMB: 20,
      maxStorageGB: 10,
      canDownloadOriginal: true,
      canApplyFilters: true,
      maxFiltersPerDownload: 2,
    },
    {
      type: PackageType.GOLD,
      name: "Gold Premium",
      maxPhotosPerMonth: -1, // unlimited
      maxPhotoSizeMB: 50,
      maxStorageGB: 50,
      canDownloadOriginal: true,
      canApplyFilters: true,
      maxFiltersPerDownload: -1, // unlimited
    },
  ];

  for (const pkg of packages) {
    await prisma.package.upsert({
      where: { type: pkg.type },
      update: pkg,
      create: pkg,
    });
    console.log(`✅ Created/Updated package: ${pkg.name}`);
  }

  // Get Gold package
  const goldPackage = await prisma.package.findUnique({
    where: { type: PackageType.GOLD },
  });

  if (!goldPackage) {
    throw new Error("Gold package not found");
  }

  // Create admin user (for testing)
  const adminEmail = "admin@gallery.com";
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      emailVerified: true,
      name: "Admin User",
      role: "ADMINISTRATOR",
      packageType: PackageType.GOLD,
      packageId: goldPackage.id,
    },
  });
  console.log(`✅ Created admin user: ${admin.email}`);

  console.log("✨ Seeding completed!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
