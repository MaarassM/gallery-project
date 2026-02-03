import type { ActionFunctionArgs } from "react-router";
import { redirect } from "react-router";
import { prisma } from "~/lib/db/client";
import { createSession } from "~/lib/auth/simple-auth";
import { AuditService } from "~/modules/audit/services/audit-service";
import { PackageType, UserRole } from "@prisma/client";

/**
 * Register Endpoint using custom auth
 *
 * Uses native form submission to properly set HttpOnly cookies
 */

export async function loader() {
  // Redirect GET requests to auth page
  return redirect("/auth");
}

export async function action({ request }: ActionFunctionArgs) {
  console.log("=== REGISTER ACTION ===");

  try {
    // Parse form data
    const formData = await request.formData();
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const name = formData.get("name") as string;
    const packageType = (formData.get("packageType") as string) || PackageType.FREE;

    if (!email || !password || !name) {
      return new Response(null, {
        status: 303,
        headers: { Location: "/auth?error=missing-fields" },
      });
    }

    // Validate package type
    if (!Object.values(PackageType).includes(packageType as PackageType)) {
      return new Response(null, {
        status: 303,
        headers: { Location: "/auth?error=invalid-package" },
      });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return new Response(null, {
        status: 303,
        headers: { Location: "/auth?error=user-exists" },
      });
    }

    // Get package ID
    const packageRecord = await prisma.package.findUnique({
      where: { type: packageType as PackageType },
    });

    if (!packageRecord) {
      return new Response(null, {
        status: 303,
        headers: { Location: "/auth?error=package-not-found" },
      });
    }

    // Hash password
    const bcrypt = await import("bcryptjs");
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        name,
        role: UserRole.REGISTERED,
        packageType: packageType as PackageType,
        packageId: packageRecord.id,
      },
    });

    // Create credential account for login
    await prisma.account.create({
      data: {
        userId: user.id,
        providerId: "credential",
        accountId: user.id,
        password: hashedPassword, // Store hashed password
      },
    });

    // Log successful registration
    await AuditService.log({
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: "REGISTER",
      resource: "Auth",
      metadata: { packageType },
      success: true,
    });

    // Create session
    const sessionToken = await createSession(user.id);

    console.log("Registration successful, session created");

    // Set cookie and redirect
    return new Response(null, {
      status: 303,
      headers: {
        Location: "/",
        "Set-Cookie": `session=${sessionToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${
          7 * 24 * 60 * 60
        }`,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    return new Response(null, {
      status: 303,
      headers: { Location: "/auth?error=server-error" },
    });
  }
}
