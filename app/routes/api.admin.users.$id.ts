import type { ActionFunctionArgs } from "react-router";
import { auth } from "~/lib/auth/config";
import { prisma } from "~/lib/db/client";
import { auditService } from "~/modules/audit/services/audit-service";
import { PackageType, UserRole } from "@prisma/client";

export async function action({ request, params }: ActionFunctionArgs) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const adminUser = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!adminUser || adminUser.role !== "ADMINISTRATOR") {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const userId = params.id;
    if (!userId) {
      return Response.json({ error: "User ID is required" }, { status: 400 });
    }

    const body = await request.json();
    const { role, packageType } = body;

    // Validate role
    if (role && !Object.values(UserRole).includes(role)) {
      return Response.json({ error: "Invalid role" }, { status: 400 });
    }

    // Validate package type
    if (packageType && !Object.values(PackageType).includes(packageType)) {
      return Response.json({ error: "Invalid package type" }, { status: 400 });
    }

    // Get package ID if packageType is provided
    let packageId: string | undefined;
    if (packageType) {
      const pkg = await prisma.package.findUnique({
        where: { type: packageType },
      });
      if (!pkg) {
        return Response.json({ error: "Package not found" }, { status: 404 });
      }
      packageId = pkg.id;
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(role && { role }),
        ...(packageType && { packageType, packageId }),
      },
      include: {
        package: true,
      },
    });

    // Log admin action
    await auditService.log({
      userId: session.user.id,
      userEmail: session.user.email,
      userRole: adminUser.role,
      action: "UPDATE_USER",
      resource: "User",
      resourceId: userId,
      metadata: { role, packageType },
      success: true,
    });

    return Response.json({
      success: true,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role,
        packageType: updatedUser.packageType,
        package: updatedUser.package,
      },
    });
  } catch (error) {
    console.error("Update user error:", error);
    return Response.json({ error: "Failed to update user" }, { status: 500 });
  }
}
