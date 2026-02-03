import {
  SimpleGrid,
  Paper,
  Stack,
  Text,
  Group,
  RingProgress,
  Table,
} from "@mantine/core";
import { FiUsers, FiImage, FiHardDrive, FiTrendingUp } from "react-icons/fi";

interface Statistics {
  overview: {
    totalUsers: number;
    totalPhotos: number;
    totalStorageGB: string;
    totalStorageDisplay: string;
    recentUploads7Days: number;
  };
  usersByPackage: Array<{
    packageType: string;
    count: number;
  }>;
  usersByRole: Array<{
    role: string;
    count: number;
  }>;
  topUploaders: Array<{
    id: string;
    email: string | null;
    name: string | null;
    photoCount: number;
  }>;
}

interface StatsDashboardProps {
  statistics: Statistics;
}

export function StatsDashboard({ statistics }: StatsDashboardProps) {
  const { overview, usersByPackage, usersByRole, topUploaders } = statistics;

  const StatCard = ({
    title,
    value,
    icon: Icon,
    color,
    subtitle,
  }: {
    title: string;
    value: string | number;
    icon: React.ElementType;
    color: string;
    subtitle?: string;
  }) => (
    <Paper shadow="sm" p="md" radius="md" withBorder>
      <Group justify="space-between">
        <Stack gap="xs">
          <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
            {title}
          </Text>
          <Text size="xl" fw={700}>
            {value}
          </Text>
          {subtitle && (
            <Text size="xs" c="dimmed">
              {subtitle}
            </Text>
          )}
        </Stack>
        <Icon size={32} color={color} style={{ opacity: 0.6 }} />
      </Group>
    </Paper>
  );

  const totalUsers = overview.totalUsers;
  const packageDistribution = usersByPackage.map((pkg) => ({
    ...pkg,
    percentage:
      totalUsers > 0 ? ((pkg.count / totalUsers) * 100).toFixed(1) : "0",
  }));

  return (
    <Stack gap="lg">
      {/* Overview Cards */}
      <SimpleGrid cols={{ base: 1, xs: 2, md: 4 }} spacing="md">
        <StatCard
          title="Total Users"
          value={overview.totalUsers}
          icon={FiUsers}
          color="#4CAF50"
        />
        <StatCard
          title="Total Photos"
          value={overview.totalPhotos}
          icon={FiImage}
          color="#2196F3"
        />
        <StatCard
          title="Storage Used"
          value={
            overview.totalStorageDisplay || `${overview.totalStorageGB} GB`
          }
          icon={FiHardDrive}
          color="#FF9800"
        />
        <StatCard
          title="Recent Uploads"
          value={overview.recentUploads7Days}
          icon={FiTrendingUp}
          color="#9C27B0"
          subtitle="Last 7 days"
        />
      </SimpleGrid>

      {/* Package Distribution */}
      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
        <Paper shadow="sm" p="md" radius="md" withBorder>
          <Stack gap="md">
            <Text size="lg" fw={600}>
              Users by Package
            </Text>

            {packageDistribution.map((pkg) => {
              const colors: Record<string, string> = {
                GOLD: "#FFD700",
                PRO: "#9C27B0",
                FREE: "#757575",
              };

              return (
                <Group key={pkg.packageType} justify="space-between">
                  <Group gap="xs">
                    <RingProgress
                      size={50}
                      thickness={5}
                      sections={[
                        {
                          value: Number(pkg.percentage),
                          color: colors[pkg.packageType] || "#757575",
                        },
                      ]}
                      label={
                        <Text ta="center" size="xs" fw={700}>
                          {pkg.percentage}%
                        </Text>
                      }
                    />
                    <Stack gap={0}>
                      <Text size="sm" fw={600}>
                        {pkg.packageType}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {pkg.count} users
                      </Text>
                    </Stack>
                  </Group>
                </Group>
              );
            })}
          </Stack>
        </Paper>

        {/* Top Uploaders */}
        <Paper shadow="sm" p="md" radius="md" withBorder>
          <Stack gap="md">
            <Text size="lg" fw={600}>
              Top Uploaders
            </Text>

            <Table>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>User</Table.Th>
                  <Table.Th ta="right">Photos</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {topUploaders.map((user, index) => (
                  <Table.Tr key={user.id}>
                    <Table.Td>
                      <Group gap="xs">
                        <Text size="xs" c="dimmed">
                          #{index + 1}
                        </Text>
                        <Stack gap={0}>
                          <Text size="sm" fw={500}>
                            {user.name || user.email || "Unknown"}
                          </Text>
                          {user.name && (
                            <Text size="xs" c="dimmed">
                              {user.email}
                            </Text>
                          )}
                        </Stack>
                      </Group>
                    </Table.Td>
                    <Table.Td ta="right">
                      <Text size="sm" fw={600}>
                        {user.photoCount}
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Stack>
        </Paper>
      </SimpleGrid>
    </Stack>
  );
}
