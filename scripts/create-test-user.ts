import { prisma } from "../app/lib/db/client";
import { auth } from "../app/lib/auth/config";

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

    // Create user with Better-Auth
    const result = await auth.api.signUpEmail({
      body: {
        email,
        password,
        name,
      },
    });

    if (!result || !result.user) {
      throw new Error("Failed to create user with Better-Auth");
    }

    // Update user with package
    const updatedUser = await prisma.user.update({
      where: { id: result.user.id },
      data: {
        role: "REGISTERED",
        packageType: "FREE",
        packageId: freePackage.id,
      },
    });

    console.log(`✅ Test user created successfully!`);
    console.log(`\nUser details:`);
    console.log(`ID: ${updatedUser.id}`);
    console.log(`Email: ${updatedUser.email}`);
    console.log(`Name: ${updatedUser.name}`);
    console.log(`Role: ${updatedUser.role}`);
    console.log(`Package: ${updatedUser.packageType}`);
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
