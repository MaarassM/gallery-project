import { SimpleGrid, Container, Text, Stack, Loader, Center } from "@mantine/core";
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
          <Loader size="lg" />
          <Text c="dimmed">Loading photos...</Text>
        </Stack>
      </Center>
    );
  }

  if (photos.length === 0) {
    return (
      <Center py="xl">
        <Stack align="center" gap="sm">
          <Text size="xl" c="dimmed">
            No photos found
          </Text>
          <Text size="sm" c="dimmed">
            Upload your first photo to get started!
          </Text>
        </Stack>
      </Center>
    );
  }

  return (
    <Container size="xl" py="md">
      <SimpleGrid
        cols={{ base: 1, xs: 2, sm: 2, md: 3, lg: 4 }}
        spacing="lg"
        verticalSpacing="lg"
      >
        {photos.map((photo) => (
          <PhotoCard
            key={photo.id}
            photo={photo}
            onClick={() => onPhotoClick?.(photo.id)}
            isAdmin={isAdmin}
            onDelete={onDeletePhoto}
          />
        ))}
      </SimpleGrid>
    </Container>
  );
}
