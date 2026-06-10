import bcrypt from "bcryptjs";
import { prisma } from "../app/lib/db/client";

async function createTestUser() {
  const email = "test@gallery.com";
  const password = "Test123!";
  const name = "Test User";

  try {
    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      console.log(`✅ User ${email} already exists with ID: ${existing.id}`);
      console.log(`\nLogin credentials:`);
      console.log(`Email: ${email}`);
      console.log(`Password: ${password}`);
      return;
    }

    // Get FREE package
    const freePackage = await prisma.package.findUnique({
      where: { type: "FREE" },
    });

    if (!freePackage) {
      throw new Error("FREE package not found in database");
    }

    // Create user + credential account (same flow as the register endpoint)
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        name,
        role: "REGISTERED",
        packageType: "FREE",
        packageId: freePackage.id,
      },
    });

    await prisma.account.create({
      data: {
        userId: user.id,
        providerId: "credential",
        accountId: user.id,
        password: hashedPassword,
      },
    });

    console.log(`✅ Test user created successfully!`);
    console.log(`\nUser details:`);
    console.log(`ID: ${user.id}`);
    console.log(`Email: ${user.email}`);
    console.log(`Name: ${user.name}`);
    console.log(`Role: ${user.role}`);
    console.log(`Package: ${user.packageType}`);
    console.log(`\nLogin credentials:`);
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
  } catch (error) {
    console.error("❌ Error creating test user:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();
