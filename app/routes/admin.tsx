import { useState } from "react";
import {
  Container,
  Title,
  Text,
  Stack,
  Tabs,
  Alert,
} from "@mantine/core";
import { useLoaderData, useRevalidator, redirect } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { getSessionUser, parseCookies } from "~/lib/auth/simple-auth";
import { prisma } from "~/lib/db/client";
import { UserManagement } from "~/modules/admin/components/UserManagement";
import { StatsDashboard } from "~/modules/admin/components/StatsDashboard";
import { AuditLogViewer } from "~/modules/admin/components/AuditLogViewer";
import { FiUsers, FiBarChart2, FiFileText, FiShield } from "react-icons/fi";

export function meta() {
  return [
    { title: "Admin Panel - Photo Gallery" },
    { name: "description", content: "Administrative dashboard" },
  ];
}

export async function loader({ request }: LoaderFunctionArgs) {
  // Check if user is admin
  const cookieHeader = request.headers.get("cookie");
  const cookies = parseCookies(cookieHeader);
  const sessionToken = cookies.session;
  const user = await getSessionUser(sessionToken);

  if (!user) {
    return redirect("/auth");
  }

  if ((user as any).role !== "ADMINISTRATOR") {
    return redirect("/"); // Redirect non-admin users to home
  }

  try {
    // Fetch all data directly from database in parallel
    const [
      users,
      totalUsers,
      totalPhotos,
      totalStorage,
      packageDistribution,
      topUploaders,
      recentUploads,
      auditLogs,
      totalLogs,
    ] = await Promise.all([
      // Users with packages
      prisma.user.findMany({
        include: {
          package: true,
          _count: { select: { photos: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.count(),
      prisma.photo.count(),
      prisma.photo.aggregate({ _sum: { sizeBytes: true } }),
      prisma.user.groupBy({
        by: ["packageType"],
        _count: { packageType: true },
      }),
      prisma.user.findMany({
        include: {
          _count: { select: { photos: true } },
          package: { select: { name: true, type: true } },
        },
        orderBy: { photos: { _count: "desc" } },
        take: 10,
      }),
      // Recent uploads (last 30 days)
      prisma.photo.count({
        where: {
          uploadedAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),
      // Audit logs
      prisma.auditLog.findMany({
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { timestamp: "desc" },
        take: 50,
      }),
      prisma.auditLog.count(),
    ]);

    // Calculate storage display
    const storageBytes = totalStorage._sum.sizeBytes || 0;
    const storageMB = storageBytes / 1024 / 1024;
    const storageGB = storageMB / 1024;
    const totalStorageDisplay = storageGB >= 1
      ? `${storageGB.toFixed(2)} GB`
      : `${storageMB.toFixed(2)} MB`;

    return {
      users: users.map((u) => ({
        id: u.id,
        email: u.email,
        name: u.name,
        role: u.role,
        packageType: u.packageType,
        package: u.package
          ? {
              name: u.package.name,
              type: u.package.type,
              maxPhotosPerMonth: u.package.maxPhotosPerMonth,
              maxPhotoSizeMB: u.package.maxPhotoSizeMB,
              maxStorageGB: u.package.maxStorageGB,
            }
          : null,
        photoCount: u._count.photos,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
      })),
      statistics: {
        overview: {
          totalUsers,
          totalPhotos,
          totalStorageGB: storageGB.toFixed(2),
          totalStorageDisplay,
          recentUploads,
        },
        packageDistribution: packageDistribution.map((p) => ({
          packageType: p.packageType,
          count: p._count.packageType,
        })),
        topUploaders: topUploaders.map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          photoCount: u._count.photos,
          packageType: u.packageType,
          packageName: u.package?.name,
        })),
      },
      auditLogs: auditLogs.map((log) => ({
        id: log.id,
        userId: log.userId,
        user: log.user
          ? { id: log.user.id, name: log.user.name, email: log.user.email }
          : null,
        userEmail: log.userEmail,
        userRole: log.userRole,
        timestamp: log.timestamp,
        action: log.action,
        resource: log.resource,
        resourceId: log.resourceId,
        metadata: log.metadata,
        ipAddress: log.ipAddress,
        userAgent: log.userAgent,
        success: log.success,
        errorMsg: log.errorMsg,
      })),
      totalUsers,
      totalLogs,
    };
  } catch (error) {
    console.error("Failed to load admin data:", error);
    return {
      users: [],
      statistics: {},
      auditLogs: [],
      totalUsers: 0,
      totalLogs: 0,
    };
  }
}

export default function Admin() {
  const data = useLoaderData<typeof loader>();
  const revalidator = useRevalidator();

  const [activeTab, setActiveTab] = useState<string | null>("dashboard");
  const [usersPage, setUsersPage] = useState(1);
  const [logsPage, setLogsPage] = useState(1);

  const handleUserUpdate = async (userId: string, updateData: any) => {
    console.log("Updating user:", userId, updateData);
    // TODO: Call update endpoint
  };

  const handleLogsFilter = (filters: any) => {
    console.log("Filtering logs:", filters);
    // TODO: Implement filtering
  };

  // Format statistics for StatsDashboard component
  const formattedStatistics = {
    overview: {
      totalUsers: data.statistics.overview?.totalUsers || 0,
      totalPhotos: data.statistics.overview?.totalPhotos || 0,
      totalStorageGB: data.statistics.overview?.totalStorageGB || "0",
      totalStorageDisplay: data.statistics.overview?.totalStorageDisplay || "0 MB",
      recentUploads7Days: data.statistics.overview?.recentUploads || 0,
    },
    usersByPackage: data.statistics.packageDistribution || [],
    usersByRole: [], // Not included in stats endpoint yet
    topUploaders: data.statistics.topUploaders || [],
  };

  // Use real data from backend
  const users = data.users;
  const statistics = formattedStatistics;
  const auditLogs = data.auditLogs;


  return (
    <Container size="xl" py="xl">
      <Stack gap="lg">
        {/* Header */}
        <div>
          <Title order={1}>Admin Panel</Title>
          <Text c="dimmed">Manage users, view statistics, and audit logs</Text>
        </div>

        {/* Admin Warning */}
        <Alert icon={<FiShield size={16} />} color="red" variant="light">
          <Text size="sm" fw={500}>
            Administrator Access
          </Text>
          <Text size="xs">
            You have full access to all system features. Use with caution.
          </Text>
        </Alert>

        {/* Navigation Tabs */}
        <Tabs value={activeTab} onChange={setActiveTab}>
          <Tabs.List>
            <Tabs.Tab value="dashboard" leftSection={<FiBarChart2 size={16} />}>
              Dashboard
            </Tabs.Tab>
            <Tabs.Tab value="users" leftSection={<FiUsers size={16} />}>
              User Management
            </Tabs.Tab>
            <Tabs.Tab value="audit" leftSection={<FiFileText size={16} />}>
              Audit Logs
            </Tabs.Tab>
          </Tabs.List>

          {/* Dashboard Tab */}
          <Tabs.Panel value="dashboard" pt="lg">
            <StatsDashboard statistics={statistics} />
          </Tabs.Panel>

          {/* Users Tab */}
          <Tabs.Panel value="users" pt="lg">
            <UserManagement
              users={users}
              total={data.totalUsers}
              page={usersPage}
              onPageChange={setUsersPage}
              onUserUpdate={handleUserUpdate}
            />
          </Tabs.Panel>

          {/* Audit Logs Tab */}
          <Tabs.Panel value="audit" pt="lg">
            <AuditLogViewer
              logs={auditLogs}
              total={data.totalLogs}
              page={logsPage}
              onPageChange={setLogsPage}
              onFilter={handleLogsFilter}
            />
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </Container>
  );
}
