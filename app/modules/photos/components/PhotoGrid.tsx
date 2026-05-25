import { Text, Stack, Loader, Center, Box } from "@mantine/core";
import { FiCamera } from "react-icons/fi";
import { PhotoCard } from "./PhotoCard";

export interface PhotoGridItem {
  id: string;
  title: string | null;
  description: string | null;
  thumbnailPath: string;
  width: number;
  height: number;
  sizeBytes: number;
  hashtags: string[];
  author: {
    id: string;
    name: string | null;
    email: string | null;
  };
  viewCount: number;
  downloadCount: number;
  uploadedAt: Date;
}

interface PhotoGridProps {
  photos: PhotoGridItem[];
  loading?: boolean;
  onPhotoClick?: (photoId: string) => void;
  isAdmin?: boolean;
  onDeletePhoto?: (photoId: string) => void;
}

export function PhotoGrid({ photos, loading = false, onPhotoClick, isAdmin, onDeletePhoto }: PhotoGridProps) {
  if (loading) {
    return (
      <Center py="xl">
        <Stack align="center" gap="md">
          <Loader size="lg" color="violet" />
          <Text c="dimmed">Loading photos...</Text>
        </Stack>
      </Center>
    );
  }

  if (photos.length === 0) {
    return (
      <Center py={60}>
        <Stack align="center" gap="sm">
          <Box
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              background: "rgba(124, 58, 237, 0.15)",
              border: "1px solid rgba(124, 58, 237, 0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <FiCamera size={28} color="#a78bfa" />
          </Box>
          <Text size="lg" c="dimmed" fw={500}>No photos yet</Text>
          <Text size="sm" c="dimmed">Upload your first photo to get started</Text>
        </Stack>
      </Center>
    );
  }

  return (
    <div className="photo-masonry">
      {photos.map((photo) => (
        <div key={photo.id} className="photo-masonry-item">
          <PhotoCard
            photo={photo}
            onClick={() => onPhotoClick?.(photo.id)}
            isAdmin={isAdmin}
            onDelete={onDeletePhoto}
          />
        </div>
      ))}
    </div>
  );
}
