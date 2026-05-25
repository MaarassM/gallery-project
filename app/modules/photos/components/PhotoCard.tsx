import { Text, Badge, Group, ActionIcon } from "@mantine/core";
import { FiEye, FiDownload, FiTrash2 } from "react-icons/fi";
import type { PhotoGridItem } from "./PhotoGrid";

interface PhotoCardProps {
  photo: PhotoGridItem;
  onClick?: () => void;
  isAdmin?: boolean;
  onDelete?: (photoId: string) => void;
}

export function PhotoCard({ photo, onClick, isAdmin, onDelete }: PhotoCardProps) {
  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="photo-card" onClick={onClick}>
      <img
        src={`/storage/${photo.thumbnailPath}`}
        alt={photo.title || "Photo"}
        loading="lazy"
        style={{ minHeight: 120 }}
      />

      {/* Admin delete button — always visible */}
      {isAdmin && onDelete && (
        <ActionIcon
          color="red"
          variant="filled"
          size="sm"
          style={{ position: "absolute", top: 8, right: 8, zIndex: 2 }}
          onClick={(e) => {
            e.stopPropagation();
            onDelete(photo.id);
          }}
        >
          <FiTrash2 size={13} />
        </ActionIcon>
      )}

      {/* Hover overlay */}
      <div className="photo-card-overlay">
        <Text fw={600} size="sm" c="white" lineClamp={1} mb={4}>
          {photo.title || "Untitled"}
        </Text>

        {photo.hashtags.length > 0 && (
          <Group gap={4} mb={6}>
            {photo.hashtags.slice(0, 3).map((tag) => (
              <Badge
                key={tag}
                size="xs"
                variant="filled"
                color="violet"
                style={{ opacity: 0.85 }}
              >
                #{tag}
              </Badge>
            ))}
            {photo.hashtags.length > 3 && (
              <Text size="xs" c="dimmed">+{photo.hashtags.length - 3}</Text>
            )}
          </Group>
        )}

        <Group justify="space-between">
          <Group gap={8}>
            <Group gap={3}>
              <FiEye size={12} color="rgba(255,255,255,0.7)" />
              <Text size="xs" c="dimmed">{photo.viewCount}</Text>
            </Group>
            <Group gap={3}>
              <FiDownload size={12} color="rgba(255,255,255,0.7)" />
              <Text size="xs" c="dimmed">{photo.downloadCount}</Text>
            </Group>
          </Group>
          <Text size="xs" c="dimmed">{formatSize(photo.sizeBytes)}</Text>
        </Group>
      </div>
    </div>
  );
}
