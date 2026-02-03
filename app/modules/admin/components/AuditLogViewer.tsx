import { useState } from "react";
import {
  Table,
  Badge,
  Paper,
  Stack,
  Text,
  Group,
  Pagination,
  TextInput,
  Select,
  Button,
  Collapse,
  Code,
} from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { FiFilter, FiX, FiChevronDown, FiChevronUp } from "react-icons/fi";

interface AuditLog {
  id: string;
  timestamp: Date;
  action: string;
  resource: string | null;
  resourceId: string | null;
  user: {
    id: string;
    email: string | null;
    name: string | null;
  } | null;
  userEmail: string | null;
  userRole: string;
  metadata: any;
  success: boolean;
  errorMsg: string | null;
  ipAddress: string | null;
  userAgent: string | null;
}

interface AuditLogViewerProps {
  logs: AuditLog[];
  total: number;
  page: number;
  onPageChange: (page: number) => void;
  onFilter: (filters: any) => void;
}

export function AuditLogViewer({
  logs,
  total,
  page,
  onPageChange,
  onFilter,
}: AuditLogViewerProps) {
  const [filterOpened, setFilterOpened] = useState(false);
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  // Filter state
  const [actionFilter, setActionFilter] = useState("");
  const [successFilter, setSuccessFilter] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);

  const handleApplyFilters = () => {
    const filters: any = {};

    if (actionFilter) filters.action = actionFilter;
    if (successFilter !== null) filters.success = successFilter === "true";
    if (dateFrom) filters.dateFrom = dateFrom.toISOString();
    if (dateTo) filters.dateTo = dateTo.toISOString();

    onFilter(filters);
  };

  const handleClearFilters = () => {
    setActionFilter("");
    setSuccessFilter(null);
    setDateFrom(null);
    setDateTo(null);
    onFilter({});
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const getStatusBadge = (success: boolean) => {
    return success ? (
      <Badge color="green" size="sm">
        Success
      </Badge>
    ) : (
      <Badge color="red" size="sm">
        Failed
      </Badge>
    );
  };

  const getRoleBadge = (role: string) => {
    const colors: Record<string, string> = {
      ADMINISTRATOR: "red",
      REGISTERED: "blue",
      ANONYMOUS: "gray",
    };
    return (
      <Badge color={colors[role] || "gray"} size="sm">
        {role}
      </Badge>
    );
  };

  const toggleExpand = (logId: string) => {
    setExpandedLog(expandedLog === logId ? null : logId);
  };

  return (
    <Paper shadow="sm" p="md" radius="md">
      <Stack gap="md">
        <Group justify="space-between">
          <Text size="lg" fw={600}>
            Audit Logs
          </Text>
          <Group>
            <Text size="sm" c="dimmed">
              Total Logs: {total}
            </Text>
            <Button
              size="xs"
              variant="light"
              leftSection={<FiFilter size={14} />}
              onClick={() => setFilterOpened(!filterOpened)}
            >
              Filters
            </Button>
          </Group>
        </Group>

        {/* Filters */}
        <Collapse in={filterOpened}>
          <Paper p="md" withBorder>
            <Stack gap="md">
              <Group grow>
                <TextInput
                  label="Action"
                  placeholder="e.g., UPLOAD_PHOTO"
                  value={actionFilter}
                  onChange={(e) => setActionFilter(e.target.value)}
                />
                <Select
                  label="Status"
                  placeholder="All"
                  clearable
                  data={[
                    { value: "true", label: "Success" },
                    { value: "false", label: "Failed" },
                  ]}
                  value={successFilter}
                  onChange={setSuccessFilter}
                />
              </Group>

              <Group grow>
                <DateInput
                  label="Date From"
                  placeholder="Start date"
                  value={dateFrom}
                  onChange={setDateFrom}
                  clearable
                />
                <DateInput
                  label="Date To"
                  placeholder="End date"
                  value={dateTo}
                  onChange={setDateTo}
                  clearable
                />
              </Group>

              <Group justify="flex-end">
                <Button
                  variant="light"
                  leftSection={<FiX size={14} />}
                  onClick={handleClearFilters}
                >
                  Clear
                </Button>
                <Button onClick={handleApplyFilters}>Apply Filters</Button>
              </Group>
            </Stack>
          </Paper>
        </Collapse>

        {/* Logs Table */}
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Timestamp</Table.Th>
              <Table.Th>Action</Table.Th>
              <Table.Th>User</Table.Th>
              <Table.Th>Role</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Details</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {logs.map((log) => (
              <>
                <Table.Tr key={log.id}>
                  <Table.Td>
                    <Text size="xs">{formatDate(log.timestamp)}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" fw={500}>
                      {log.action}
                    </Text>
                    {log.resource && (
                      <Text size="xs" c="dimmed">
                        {log.resource}
                      </Text>
                    )}
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">
                      {log.user ? (log.user.name || log.user.email) : (log.userEmail || "Unknown")}
                    </Text>
                  </Table.Td>
                  <Table.Td>{getRoleBadge(log.userRole)}</Table.Td>
                  <Table.Td>{getStatusBadge(log.success)}</Table.Td>
                  <Table.Td>
                    <Button
                      size="xs"
                      variant="subtle"
                      onClick={() => toggleExpand(log.id)}
                      rightSection={
                        expandedLog === log.id ? (
                          <FiChevronUp size={14} />
                        ) : (
                          <FiChevronDown size={14} />
                        )
                      }
                    >
                      {expandedLog === log.id ? "Hide" : "Show"}
                    </Button>
                  </Table.Td>
                </Table.Tr>

                {/* Expanded Details */}
                {expandedLog === log.id && (
                  <Table.Tr>
                    <Table.Td colSpan={6}>
                      <Paper p="md" withBorder bg="gray.0">
                        <Stack gap="xs">
                          <Group>
                            <Text size="sm" fw={600}>
                              Resource ID:
                            </Text>
                            <Code>{log.resourceId || "N/A"}</Code>
                          </Group>

                          {log.errorMsg && (
                            <Group>
                              <Text size="sm" fw={600} c="red">
                                Error:
                              </Text>
                              <Text size="sm" c="red">
                                {log.errorMsg}
                              </Text>
                            </Group>
                          )}

                          {log.metadata && (
                            <Stack gap="xs">
                              <Text size="sm" fw={600}>
                                Metadata:
                              </Text>
                              <Code block>
                                {JSON.stringify(log.metadata, null, 2)}
                              </Code>
                            </Stack>
                          )}

                          {log.ipAddress && (
                            <Group>
                              <Text size="sm" fw={600}>
                                IP Address:
                              </Text>
                              <Code>{log.ipAddress}</Code>
                            </Group>
                          )}

                          {log.userAgent && (
                            <Group>
                              <Text size="sm" fw={600}>
                                User Agent:
                              </Text>
                              <Text size="xs" c="dimmed">
                                {log.userAgent}
                              </Text>
                            </Group>
                          )}
                        </Stack>
                      </Paper>
                    </Table.Td>
                  </Table.Tr>
                )}
              </>
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
    </Paper>
  );
}
