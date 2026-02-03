import { useState } from "react";
import {
  Modal,
  Image,
  Stack,
  Text,
  Badge,
  Group,
  Avatar,
  Button,
  Menu,
  NumberInput,
  Select,
  Checkbox,
  Paper,
  Collapse,
  Alert,
  Loader,
} from "@mantine/core";
import {
  FiEye,
  FiDownload,
  FiCalendar,
  FiImage,
  FiMaximize,
  FiChevronDown,
  FiSettings,
  FiAlertCircle,
} from "react-icons/fi";

export interface PhotoDetail {
  id: string;
  title: string | null;
  description: string | null;
  originalName: string;
  storagePath: string;
  thumbnailPath: string;
  mimeType: string;
  format: string;
  width: number;
  height: number;
  sizeBytes: number;
  hashtags: string[];
  processingOptions: any;
  author: {
    id: string;
    name: string | null;
    email: string | null;
  };
  viewCount: number;
  downloadCount: number;
  uploadedAt: Date;
  updatedAt: Date;
}

interface PhotoDetailModalProps {
  opened: boolean;
  onClose: () => void;
  photo: PhotoDetail | null;
  onDownload?: () => void;
}

export function PhotoDetailModal({
  opened,
  onClose,
  photo,
}: PhotoDetailModalProps) {
  const [showDownloadOptions, setShowDownloadOptions] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  // Download options state
  const [resizeWidth, setResizeWidth] = useState<number | string>("");
  const [resizeHeight, setResizeHeight] = useState<number | string>("");
  const [outputFormat, setOutputFormat] = useState<string | null>(null);
  const [applySepia, setApplySepia] = useState(false);
  const [applyGrayscale, setApplyGrayscale] = useState(false);
  const [applyBlur, setApplyBlur] = useState(false);

  if (!photo) return null;

  const handleDownloadOriginal = async () => {
    setDownloading(true);
    setDownloadError(null);

    try {
      const response = await fetch(`/api/photos/${photo.id}/download`, {
        credentials: "include",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Download failed");
      }

      // Get filename from Content-Disposition header or use default
      const contentDisposition = response.headers.get("Content-Disposition");
      let filename = photo.originalName || "photo.jpg";
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+)"/);
        if (match) filename = match[1];
      }

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error: any) {
      console.error("Download error:", error);
      setDownloadError(error.message || "Failed to download photo");
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadProcessed = async () => {
    setDownloading(true);
    setDownloadError(null);

    try {
      // Build filters array
      const filters: string[] = [];
      if (applySepia) filters.push("sepia");
      if (applyGrayscale) filters.push("grayscale");
      if (applyBlur) filters.push("blur");

      // Build resize options
      const resize =
        typeof resizeWidth === "number" || typeof resizeHeight === "number"
          ? {
              width: typeof resizeWidth === "number" ? resizeWidth : undefined,
              height: typeof resizeHeight === "number" ? resizeHeight : undefined,
            }
          : undefined;

      const response = await fetch(`/api/photos/${photo.id}/download-processed`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          resize,
          filters,
          format: outputFormat,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Download failed");
      }

      // Get filename from Content-Disposition header or use default
      const contentDisposition = response.headers.get("Content-Disposition");
      let filename = photo.originalName || "photo.jpg";
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+)"/);
        if (match) filename = match[1];
      }

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // Reset options after successful download
      setShowDownloadOptions(false);
    } catch (error: any) {
      console.error("Download error:", error);
      setDownloadError(error.message || "Failed to download photo");
    } finally {
      setDownloading(false);
    }
  };

  const hasProcessingOptions =
    typeof resizeWidth === "number" ||
    typeof resizeHeight === "number" ||
    outputFormat !== null ||
    applySepia ||
    applyGrayscale ||
    applyBlur;

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      size="xl"
      title={photo.title || "Photo Details"}
      centered
    >
      <Stack gap="md">
        {/* Full Image */}
        <Image
          src={`/storage/${photo.storagePath}`}
          alt={photo.title || "Photo"}
          fit="contain"
          radius="md"
        />

        {/* Title and Description */}
        <Stack gap="xs">
          <Text size="xl" fw={600}>
            {photo.title || "Untitled"}
          </Text>
          {photo.description && (
            <Text size="sm" c="dimmed">
              {photo.description}
            </Text>
          )}
        </Stack>

        {/* Hashtags */}
        {photo.hashtags.length > 0 && (
          <Group gap="xs">
            {photo.hashtags.map((tag) => (
              <Badge key={tag} size="md" variant="light">
                #{tag}
              </Badge>
            ))}
          </Group>
        )}

        {/* Author */}
        <Group gap="sm">
          <Avatar size="md" radius="xl" color="blue">
            {photo.author.name?.[0] || photo.author.email?.[0] || "?"}
          </Avatar>
          <Stack gap={0}>
            <Text size="sm" fw={500}>
              {photo.author.name || "Anonymous"}
            </Text>
            <Text size="xs" c="dimmed">
              {photo.author.email}
            </Text>
          </Stack>
        </Group>

        {/* Stats */}
        <Group justify="space-between">
          <Group gap="lg">
            <Group gap={6}>
              <FiEye size={16} />
              <Stack gap={0}>
                <Text size="sm" fw={500}>
                  {photo.viewCount}
                </Text>
                <Text size="xs" c="dimmed">
                  Views
                </Text>
              </Stack>
            </Group>
            <Group gap={6}>
              <FiDownload size={16} />
              <Stack gap={0}>
                <Text size="sm" fw={500}>
                  {photo.downloadCount}
                </Text>
                <Text size="xs" c="dimmed">
                  Downloads
                </Text>
              </Stack>
            </Group>
          </Group>
        </Group>

        {/* Metadata */}
        <Stack gap="xs">
          <Text size="sm" fw={600}>
            Metadata
          </Text>
          <Group gap="xs">
            <FiImage size={14} />
            <Text size="sm" c="dimmed">
              {photo.width} × {photo.height} px
            </Text>
          </Group>
          <Group gap="xs">
            <FiMaximize size={14} />
            <Text size="sm" c="dimmed">
              {formatSize(photo.sizeBytes)} • {photo.format.toUpperCase()}
            </Text>
          </Group>
          <Group gap="xs">
            <FiCalendar size={14} />
            <Text size="sm" c="dimmed">
              Uploaded {formatDate(photo.uploadedAt)}
            </Text>
          </Group>
        </Stack>

        {/* Download Error */}
        {downloadError && (
          <Alert icon={<FiAlertCircle />} color="red" title="Download Error" withCloseButton onClose={() => setDownloadError(null)}>
            {downloadError}
          </Alert>
        )}

        {/* Download Options */}
        <Paper withBorder p="md" radius="md">
          <Stack gap="md">
            <Group justify="space-between">
              <Text size="sm" fw={600}>Download Options</Text>
              <Button
                variant="subtle"
                size="xs"
                leftSection={<FiSettings size={14} />}
                onClick={() => setShowDownloadOptions(!showDownloadOptions)}
              >
                {showDownloadOptions ? "Hide Options" : "Show Options"}
              </Button>
            </Group>

            <Collapse in={showDownloadOptions}>
              <Stack gap="md">
                {/* Resize Options */}
                <Stack gap="xs">
                  <Text size="sm" c="dimmed">Resize (optional)</Text>
                  <Group grow>
                    <NumberInput
                      placeholder="Width"
                      value={resizeWidth}
                      onChange={setResizeWidth}
                      min={1}
                      max={4000}
                      suffix=" px"
                    />
                    <NumberInput
                      placeholder="Height"
                      value={resizeHeight}
                      onChange={setResizeHeight}
                      min={1}
                      max={4000}
                      suffix=" px"
                    />
                  </Group>
                </Stack>

                {/* Format Options */}
                <Select
                  label="Output Format"
                  placeholder="Keep original format"
                  data={[
                    { value: "jpg", label: "JPEG" },
                    { value: "png", label: "PNG" },
                    { value: "webp", label: "WebP" },
                  ]}
                  value={outputFormat}
                  onChange={setOutputFormat}
                  clearable
                />

                {/* Filter Options */}
                <Stack gap="xs">
                  <Text size="sm" c="dimmed">Filters (PRO: max 2, GOLD: unlimited)</Text>
                  <Group>
                    <Checkbox
                      label="Sepia"
                      checked={applySepia}
                      onChange={(e) => setApplySepia(e.currentTarget.checked)}
                    />
                    <Checkbox
                      label="Grayscale"
                      checked={applyGrayscale}
                      onChange={(e) => setApplyGrayscale(e.currentTarget.checked)}
                    />
                    <Checkbox
                      label="Blur"
                      checked={applyBlur}
                      onChange={(e) => setApplyBlur(e.currentTarget.checked)}
                    />
                  </Group>
                </Stack>
              </Stack>
            </Collapse>
          </Stack>
        </Paper>

        {/* Actions */}
        <Group justify="flex-end">
          <Button variant="light" onClick={onClose} disabled={downloading}>
            Close
          </Button>
          {hasProcessingOptions ? (
            <Button
              leftSection={downloading ? <Loader size={16} /> : <FiDownload size={16} />}
              onClick={handleDownloadProcessed}
              disabled={downloading}
            >
              {downloading ? "Processing..." : "Download with Options"}
            </Button>
          ) : (
            <Menu shadow="md" width={200}>
              <Menu.Target>
                <Button
                  leftSection={downloading ? <Loader size={16} /> : <FiDownload size={16} />}
                  rightSection={<FiChevronDown size={14} />}
                  disabled={downloading}
                >
                  {downloading ? "Downloading..." : "Download"}
                </Button>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Item onClick={handleDownloadOriginal}>
                  Download Original
                </Menu.Item>
                <Menu.Item onClick={() => setShowDownloadOptions(true)}>
                  Download with Filters...
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          )}
        </Group>
      </Stack>
    </Modal>
  );
}
