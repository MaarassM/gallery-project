import {
  Paper,
  Stack,
  Text,
  NumberInput,
  Button,
  Group,
  Collapse,
} from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { FiFilter, FiX } from "react-icons/fi";
import { useState } from "react";

export interface FilterCriteria {
  minSize?: number;
  maxSize?: number;
  dateFrom?: Date;
  dateTo?: Date;
}

interface FilterPanelProps {
  onApplyFilters: (filters: FilterCriteria) => void;
  onClearFilters?: () => void;
}

export function FilterPanel({
  onApplyFilters,
  onClearFilters,
}: FilterPanelProps) {
  const [opened, setOpened] = useState(false);
  const [minSize, setMinSize] = useState<number | string>("");
  const [maxSize, setMaxSize] = useState<number | string>("");
  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);

  const hasActiveFilters =
    minSize !== "" || maxSize !== "" || dateFrom !== null || dateTo !== null;

  const handleApply = () => {
    const filters: FilterCriteria = {};

    if (typeof minSize === "number") {
      filters.minSize = minSize * 1024 * 1024; // Convert MB to bytes
    }
    if (typeof maxSize === "number") {
      filters.maxSize = maxSize * 1024 * 1024; // Convert MB to bytes
    }
    if (dateFrom) {
      filters.dateFrom = dateFrom;
    }
    if (dateTo) {
      filters.dateTo = dateTo;
    }

    onApplyFilters(filters);
  };

  const handleClear = () => {
    setMinSize("");
    setMaxSize("");
    setDateFrom(null);
    setDateTo(null);
    onClearFilters?.();
  };

  return (
    <Paper shadow="sm" p="md" radius="md">
      <Stack gap="md">
        <Group justify="space-between">
          <Button
            variant={hasActiveFilters ? "filled" : "light"}
            leftSection={<FiFilter size={16} />}
            onClick={() => setOpened(!opened)}
          >
            {hasActiveFilters ? "Filters Active" : "Show Filters"}
          </Button>
          {hasActiveFilters && (
            <Button
              variant="subtle"
              color="red"
              leftSection={<FiX size={16} />}
              onClick={handleClear}
            >
              Clear
            </Button>
          )}
        </Group>

        <Collapse in={opened}>
          <Stack gap="md">
            <Text size="sm" fw={600}>
              Filter Photos
            </Text>

            {/* Size Range */}
            <Stack gap="xs">
              <Text size="sm" c="dimmed">
                File Size (MB)
              </Text>
              <Group grow>
                <NumberInput
                  placeholder="Min"
                  value={minSize}
                  onChange={setMinSize}
                  min={0}
                  step={0.1}
                  decimalScale={1}
                />
                <NumberInput
                  placeholder="Max"
                  value={maxSize}
                  onChange={setMaxSize}
                  min={0}
                  step={0.1}
                  decimalScale={1}
                />
              </Group>
            </Stack>

            {/* Date Range */}
            <Stack gap="xs">
              <Text size="sm" c="dimmed">
                Upload Date Range
              </Text>
              <Group grow>
                <DateInput
                  placeholder="From"
                  value={dateFrom}
                  onChange={setDateFrom}
                  clearable
                />
                <DateInput
                  placeholder="To"
                  value={dateTo}
                  onChange={setDateTo}
                  clearable
                />
              </Group>
            </Stack>

            {/* Apply Button */}
            <Button onClick={handleApply} fullWidth>
              Apply Filters
            </Button>
          </Stack>
        </Collapse>
      </Stack>
    </Paper>
  );
}
