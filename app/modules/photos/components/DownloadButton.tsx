import { useState } from "react";
import {
  Button,
  Menu,
  Modal,
  Stack,
  Text,
  Group,
  Checkbox,
  NumberInput,
  Select,
  Divider,
} from "@mantine/core";
import { FiDownload, FiSettings } from "react-icons/fi";
import { notifications } from "@mantine/notifications";

interface DownloadButtonProps {
  photoId: string;
  photoTitle?: string | null;
  canDownloadOriginal: boolean;
  canApplyFilters: boolean;
  maxFilters: number; // -1 for unlimited
}

export function DownloadButton({
  photoId,
  photoTitle,
  canDownloadOriginal,
  canApplyFilters,
  maxFilters,
}: DownloadButtonProps) {
  const [modalOpened, setModalOpened] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // Filter options
  const [enableResize, setEnableResize] = useState(false);
  const [resizeWidth, setResizeWidth] = useState<number | string>(1920);
  const [resizeHeight, setResizeHeight] = useState<number | string>(1080);
  const [resizeFit, setResizeFit] = useState<"cover" | "contain">("cover");

  const [filter, setFilter] = useState<string | null>(null);
  const [format, setFormat] = useState<string | null>(null);
  const [quality, setQuality] = useState<number | string>(90);

  const handleDownloadOriginal = async () => {
    if (!canDownloadOriginal) {
      notifications.show({
        title: "Upgrade Required",
        message: "Your package does not allow downloading originals. Please upgrade to PRO or GOLD.",
        color: "yellow",
      });
      return;
    }

    setDownloading(true);
    try {
      // TODO: Call ORPC procedure to download original
      notifications.show({
        title: "Download Started",
        message: "Your download will begin shortly",
        color: "blue",
      });
    } catch (error) {
      notifications.show({
        title: "Download Failed",
        message: error instanceof Error ? error.message : "Unknown error",
        color: "red",
      });
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadProcessed = async () => {
    if (!canApplyFilters) {
      notifications.show({
        title: "Upgrade Required",
        message: "Your package does not allow applying filters. Please upgrade to PRO or GOLD.",
        color: "yellow",
      });
      return;
    }

    // Count active filters
    const activeFilters = [enableResize, filter !== null, format !== null].filter(
      Boolean
    ).length;

    if (maxFilters !== -1 && activeFilters > maxFilters) {
      notifications.show({
        title: "Too Many Filters",
        message: `Your package allows maximum ${maxFilters} filters. You selected ${activeFilters}.`,
        color: "red",
      });
      return;
    }

    setDownloading(true);
    try {
      const processingOptions: any = {};

      if (enableResize) {
        processingOptions.resize = {
          width: Number(resizeWidth),
          height: Number(resizeHeight),
          fit: resizeFit,
        };
      }

      if (filter) {
        processingOptions.filter = filter;
      }

      if (format) {
        processingOptions.format = format;
        processingOptions.quality = Number(quality);
      }

      // TODO: Call ORPC procedure to download processed
      notifications.show({
        title: "Processing & Download",
        message: "Your photo is being processed and will download shortly",
        color: "blue",
      });

      setModalOpened(false);
    } catch (error) {
      notifications.show({
        title: "Download Failed",
        message: error instanceof Error ? error.message : "Unknown error",
        color: "red",
      });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <>
      <Menu shadow="md" width={200}>
        <Menu.Target>
          <Button
            leftSection={<FiDownload size={16} />}
            loading={downloading}
          >
            Download
          </Button>
        </Menu.Target>

        <Menu.Dropdown>
          <Menu.Label>Download Options</Menu.Label>
          <Menu.Item
            leftSection={<FiDownload size={14} />}
            onClick={handleDownloadOriginal}
            disabled={!canDownloadOriginal}
          >
            Original
          </Menu.Item>
          <Menu.Item
            leftSection={<FiSettings size={14} />}
            onClick={() => setModalOpened(true)}
            disabled={!canApplyFilters}
          >
            With Filters
          </Menu.Item>

          {!canDownloadOriginal && (
            <>
              <Menu.Divider />
              <Menu.Label>
                <Text size="xs" c="dimmed">
                  Upgrade to PRO/GOLD for more options
                </Text>
              </Menu.Label>
            </>
          )}
        </Menu.Dropdown>
      </Menu>

      {/* Filter Options Modal */}
      <Modal
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
        title="Download with Filters"
        size="md"
      >
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            {maxFilters === -1
              ? "Apply unlimited filters to your download"
              : `You can apply up to ${maxFilters} filters`}
          </Text>

          <Divider />

          {/* Resize Option */}
          <Stack gap="xs">
            <Checkbox
              label="Resize Image"
              checked={enableResize}
              onChange={(e) => setEnableResize(e.currentTarget.checked)}
            />

            {enableResize && (
              <Group grow>
                <NumberInput
                  label="Width"
                  value={resizeWidth}
                  onChange={setResizeWidth}
                  min={100}
                  max={4000}
                />
                <NumberInput
                  label="Height"
                  value={resizeHeight}
                  onChange={setResizeHeight}
                  min={100}
                  max={4000}
                />
                <Select
                  label="Fit"
                  data={[
                    { value: "cover", label: "Cover" },
                    { value: "contain", label: "Contain" },
                  ]}
                  value={resizeFit}
                  onChange={(val) => setResizeFit(val as "cover" | "contain")}
                />
              </Group>
            )}
          </Stack>

          {/* Filter Option */}
          <Select
            label="Apply Filter"
            placeholder="None"
            clearable
            data={[
              { value: "sepia", label: "Sepia" },
              { value: "blur", label: "Blur" },
              { value: "grayscale", label: "Grayscale" },
              { value: "sharpen", label: "Sharpen" },
            ]}
            value={filter}
            onChange={setFilter}
          />

          {/* Format Conversion */}
          <Group grow>
            <Select
              label="Convert Format"
              placeholder="Keep original"
              clearable
              data={[
                { value: "jpg", label: "JPG" },
                { value: "png", label: "PNG" },
                { value: "bmp", label: "BMP" },
                { value: "webp", label: "WebP" },
              ]}
              value={format}
              onChange={setFormat}
            />

            <NumberInput
              label="Quality"
              description="For JPG/WebP"
              value={quality}
              onChange={setQuality}
              min={1}
              max={100}
              disabled={!format || (format !== "jpg" && format !== "webp")}
            />
          </Group>

          <Divider />

          <Group justify="flex-end">
            <Button variant="light" onClick={() => setModalOpened(false)}>
              Cancel
            </Button>
            <Button
              leftSection={<FiDownload size={16} />}
              onClick={handleDownloadProcessed}
              loading={downloading}
            >
              Download
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
