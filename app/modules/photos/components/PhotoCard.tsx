import { Card, Image, Text, Badge, Group, Stack, Avatar, ActionIcon } from "@mantine/core";
import { FiEye, FiDownload, FiCalendar, FiTrash2 } from "react-icons/fi";
import type { PhotoGridItem } from "./PhotoGrid";

interface PhotoCardProps {
  photo: PhotoGridItem;
  onClick?: () => void;
  isAdmin?: boolean;
  onDelete?: (photoId: string) => void;
}

export function PhotoCard({ photo, onClick, isAdmin, onDelete }: PhotoCardProps) {
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Card
      shadow="sm"
      padding="lg"
      radius="md"
      withBorder
      style={{ cursor: "pointer", transition: "transform 0.2s" }}
      onClick={onClick}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-4px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      <Card.Section pos="relative">
        <Image
          src={`/storage/${photo.thumbnailPath}`}
          height={200}
          alt={photo.title || "Photo"}
          fit="cover"
        />
        {isAdmin && onDelete && (
          <ActionIcon
            color="red"
            variant="filled"
            size="sm"
            pos="absolute"
            top={8}
            right={8}
            onClick={(e) => {
              e.stopPropagation();
              onDelete(photo.id);
            }}
            title="Delete photo"
          >
            <FiTrash2 size={14} />
          </ActionIcon>
        )}
      </Card.Section>

      <Stack gap="xs" mt="md">
        {/* Title */}
        <Text fw={600} lineClamp={1}>
          {photo.title || "Untitled"}
        </Text>

        {/* Description */}
        {photo.description && (
          <Text size="sm" c="dimmed" lineClamp={2}>
            {photo.description}
          </Text>
        )}

        {/* Hashtags */}
        {photo.hashtags.length > 0 && (
          <Group gap="xs">
            {photo.hashtags.slice(0, 3).map((tag) => (
              <Badge key={tag} size="sm" variant="light">
                #{tag}
              </Badge>
            ))}
            {photo.hashtags.length > 3 && (
              <Text size="xs" c="dimmed">
                +{photo.hashtags.length - 3}
              </Text>
            )}
          </Group>
        )}

        {/* Author */}
        <Group gap="xs">
          <Avatar size="sm" radius="xl" color="blue">
            {photo.author.name?.[0] || photo.author.email?.[0] || "?"}
          </Avatar>
          <Text size="sm" c="dimmed">
            {photo.author.name || photo.author.email || "Anonymous"}
          </Text>
        </Group>

        {/* Stats */}
        <Group justify="space-between">
          <Group gap="xs">
            <Group gap={4}>
              <FiEye size={14} />
              <Text size="xs" c="dimmed">
                {photo.viewCount}
              </Text>
            </Group>
            <Group gap={4}>
              <FiDownload size={14} />
              <Text size="xs" c="dimmed">
                {photo.downloadCount}
              </Text>
            </Group>
          </Group>
          <Text size="xs" c="dimmed">
            {formatSize(photo.sizeBytes)}
          </Text>
        </Group>

        {/* Date */}
        <Group gap={4}>
          <FiCalendar size={12} />
          <Text size="xs" c="dimmed">
            {formatDate(photo.uploadedAt)}
          </Text>
        </Group>
      </Stack>
    </Card>
  );
}
