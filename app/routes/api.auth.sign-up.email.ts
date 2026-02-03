import type { ActionFunctionArgs } from "react-router";
import { auth } from "~/lib/auth/config";
import { prisma } from "~/lib/db/client";
import { UserRole, PackageType } from "@prisma/client";

export async function action({ request }: ActionFunctionArgs) {
  console.log("[Better-Auth] Handling sign-up/email:", request.method);

  const response = await auth.handler(request);
  console.log("[Better-Auth] Sign-up response status:", response.status);

  // If successful, update user with package info
  if (response.ok) {
    try {
      const body = await request.clone().json();
      const { email, packageType = "FREE" } = body;

      // Get the package record
      const packageRecord = await prisma.package.findUnique({
        where: { type: packageType as PackageType },
      });

      if (packageRecord && email) {
        // Update the user with package info
        await prisma.user.update({
          where: { email },
          data: {
            role: UserRole.REGISTERED,
            packageType: packageType as PackageType,
            packageId: packageRecord.id,
          },
        });
        console.log("[Better-Auth] Updated user package to:", packageType);
      }
    } catch (error) {
      console.error("[Better-Auth] Error updating package:", error);
      // Don't fail the sign-up if package update fails
    }
  }

  return response;
}
