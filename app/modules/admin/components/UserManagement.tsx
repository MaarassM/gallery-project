import { useState } from "react";
import {
  Table,
  Badge,
  Button,
  Group,
  Modal,
  Stack,
  TextInput,
  Select,
  Text,
  Paper,
  Pagination,
} from "@mantine/core";
import { FiEdit, FiUser } from "react-icons/fi";
import { notifications } from "@mantine/notifications";

interface User {
  id: string;
  email: string | null;
  name: string | null;
  role: string;
  packageType: string;
  package: {
    name: string;
    maxPhotosPerMonth: number;
    maxPhotoSizeMB: number;
    maxStorageGB: number;
  } | null;
  photoCount: number;
  createdAt: Date;
}

interface UserManagementProps {
  users: User[];
  total: number;
  page: number;
  onPageChange: (page: number) => void;
  onUserUpdate: (userId: string, data: any) => Promise<void>;
}

export function UserManagement({
  users,
  total,
  page,
  onPageChange,
  onUserUpdate,
}: UserManagementProps) {
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editModalOpened, setEditModalOpened] = useState(false);
  const [updating, setUpdating] = useState(false);

  // Edit form state
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState("");
  const [editPackageType, setEditPackageType] = useState("");

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setEditName(user.name || "");
    setEditRole(user.role);
    setEditPackageType(user.packageType);
    setEditModalOpened(true);
  };

  const handleSave = async () => {
    if (!editingUser) return;

    setUpdating(true);
    try {
      await onUserUpdate(editingUser.id, {
        name: editName || undefined,
        role: editRole,
        packageType: editPackageType,
      });

      notifications.show({
        title: "Success",
        message: "User updated successfully",
        color: "green",
      });

      setEditModalOpened(false);
      setEditingUser(null);
    } catch (error) {
      notifications.show({
        title: "Error",
        message: error instanceof Error ? error.message : "Failed to update user",
        color: "red",
      });
    } finally {
      setUpdating(false);
    }
  };

  const getRoleBadge = (role: string) => {
    const colors: Record<string, string> = {
      ADMINISTRATOR: "red",
      REGISTERED: "blue",
      ANONYMOUS: "gray",
    };
    return <Badge color={colors[role] || "gray"}>{role}</Badge>;
  };

  const getPackageBadge = (packageType: string) => {
    const colors: Record<string, string> = {
      GOLD: "yellow",
      PRO: "violet",
      FREE: "gray",
    };
    return <Badge color={colors[packageType] || "gray"}>{packageType}</Badge>;
  };

  return (
    <Paper shadow="sm" p="md" radius="md">
      <Stack gap="md">
        <Group justify="space-between">
          <Text size="lg" fw={600}>
            User Management
          </Text>
          <Text size="sm" c="dimmed">
            Total Users: {total}
          </Text>
        </Group>

        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Email</Table.Th>
              <Table.Th>Name</Table.Th>
              <Table.Th>Role</Table.Th>
              <Table.Th>Package</Table.Th>
              <Table.Th>Photos</Table.Th>
              <Table.Th>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {users.map((user) => (
              <Table.Tr key={user.id}>
                <Table.Td>{user.email}</Table.Td>
                <Table.Td>{user.name || "-"}</Table.Td>
                <Table.Td>{getRoleBadge(user.role)}</Table.Td>
                <Table.Td>{getPackageBadge(user.packageType)}</Table.Td>
                <Table.Td>{user.photoCount}</Table.Td>
                <Table.Td>
                  <Button
                    size="xs"
                    variant="light"
                    leftSection={<FiEdit size={14} />}
                    onClick={() => handleEdit(user)}
                  >
                    Edit
                  </Button>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>

        <Group justify="center">
          <Pagination
            total={Math.ceil(total / 50)}
            value={page}
            onChange={onPageChange}
          />
        </Group>
      </Stack>

      {/* Edit User Modal */}
      <Modal
        opened={editModalOpened}
        onClose={() => setEditModalOpened(false)}
        title="Edit User"
        size="md"
      >
        <Stack gap="md">
          <TextInput
            label="Name"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            leftSection={<FiUser size={16} />}
          />

          <Select
            label="Role"
            data={[
              { value: "REGISTERED", label: "Registered" },
              { value: "ADMINISTRATOR", label: "Administrator" },
            ]}
            value={editRole}
            onChange={(val) => setEditRole(val || "REGISTERED")}
          />

          <Select
            label="Package Type"
            data={[
              { value: "FREE", label: "Free Tier" },
              { value: "PRO", label: "Pro Plan" },
              { value: "GOLD", label: "Gold Premium" },
            ]}
            value={editPackageType}
            onChange={(val) => setEditPackageType(val || "FREE")}
          />

          <Group justify="flex-end">
            <Button
              variant="light"
              onClick={() => setEditModalOpened(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} loading={updating}>
              Save Changes
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Paper>
  );
}
