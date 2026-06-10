import { useState, useCallback } from "react";
import {
  Container,
  Title,
  Text,
  Stack,
  Tabs,
  Button,
  Group,
  Loader,
  Alert,
} from "@mantine/core";
import { useLoaderData, useRevalidator } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { PhotoGrid } from "~/modules/photos/components/PhotoGrid";
import { PhotoDetailModal } from "~/modules/photos/components/PhotoDetailModal";
import { PhotoUploader } from "~/modules/photos/components/PhotoUploader";
import { SearchBar } from "~/modules/photos/components/SearchBar";
import {
  FilterPanel,
  type FilterCriteria,
} from "~/modules/photos/components/FilterPanel";
import { FiHome, FiUpload, FiSearch, FiAlertCircle } from "react-icons/fi";
import { PhotoRepository } from "~/modules/photos/repositories/photo-repository";
import { getSessionUser, parseCookies } from "~/lib/auth/simple-auth";

const photoRepository = new PhotoRepository();

export function meta() {
  return [
    { title: "Photo Gallery - Home" },
    { name: "description", content: "Browse and upload photos" },
  ];
}

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const photos = await photoRepository.findMany({ limit: 20, offset: 0 });

    // Get user session
    const cookies = parseCookies(request.headers.get("cookie"));
    const user = await getSessionUser(cookies.session ?? null);
    const userRole = user?.role || null;

    return {
      photos: photos.map((photo: any) => ({
        id: photo.id,
        title: photo.title,
        description: photo.description,
        thumbnailPath: photo.thumbnailPath,
        width: photo.width,
        height: photo.height,
        sizeBytes: photo.sizeBytes,
        hashtags: photo.hashtags?.map((pt: any) => pt.hashtag.name) || [],
        author: {
          id: photo.user?.id || "",
          name: photo.user?.name || null,
          email: photo.user?.email || null,
        },
        viewCount: photo.viewCount,
        downloadCount: photo.downloadCount,
        uploadedAt: photo.uploadedAt,
      })),
      userRole,
    };
  } catch (error) {
    console.error("Failed to load photos:", error);
    return { photos: [], userRole: null };
  }
}

export default function Index() {
  const { photos, userRole } = useLoaderData<typeof loader>();
  const revalidator = useRevalidator();
  const isAdmin = userRole === "ADMINISTRATOR";

  const [activeTab, setActiveTab] = useState<string | null>("browse");
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null);
  const [detailModalOpened, setDetailModalOpened] = useState(false);
  const [photoDetail, setPhotoDetail] = useState<any | null>(null);
  const [photoDetailLoading, setPhotoDetailLoading] = useState(false);

  // Search state
  const [searchResults, setSearchResults] = useState<any[] | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [currentSearchQuery, setCurrentSearchQuery] = useState<string>("");
  const [currentFilters, setCurrentFilters] = useState<FilterCriteria>({});

  const handlePhotoClick = async (photoId: string) => {
    setSelectedPhotoId(photoId);
    setDetailModalOpened(true);
    setPhotoDetailLoading(true);
    setPhotoDetail(null);

    try {
      const response = await fetch(`/api/photos/${photoId}`);
      const data = await response.json();
      if (data.success && data.photo) {
        setPhotoDetail({
          id: data.photo.id,
          title: data.photo.title,
          description: data.photo.description,
          originalName: data.photo.title || "photo.jpg",
          storagePath: data.photo.originalPath,
          thumbnailPath: data.photo.thumbnailPath,
          mimeType: "image/jpeg",
          format: data.photo.format || "jpg",
          width: data.photo.width,
          height: data.photo.height,
          sizeBytes: data.photo.sizeBytes,
          hashtags: data.photo.hashtags || [],
          processingOptions: null,
          author: data.photo.author,
          viewCount: data.photo.viewCount,
          downloadCount: data.photo.downloadCount,
          uploadedAt: data.photo.uploadedAt,
          updatedAt: new Date(),
        });
      }
    } catch (error) {
      console.error("Failed to load photo details:", error);
    } finally {
      setPhotoDetailLoading(false);
    }
  };

  const handleDeletePhoto = useCallback(
    async (photoId: string) => {
      if (!confirm("Are you sure you want to delete this photo?")) {
        return;
      }

      try {
        const response = await fetch(`/api/photos/${photoId}`, {
          method: "DELETE",
        });

        if (response.ok) {
          revalidator.revalidate();
          // Also clear from search results if present
          if (searchResults) {
            setSearchResults(searchResults.filter((p) => p.id !== photoId));
          }
        } else {
          const data = await response.json();
          alert(data.error || "Failed to delete photo");
        }
      } catch (error) {
        console.error("Delete error:", error);
        alert("Failed to delete photo");
      }
    },
    [revalidator, searchResults],
  );

  // Perform search with current query and filters
  const performSearch = useCallback(
    async (query: string, filters: FilterCriteria) => {
      setSearchLoading(true);
      setSearchError(null);

      try {
        const params = new URLSearchParams();

        // Add hashtag search (split query by spaces/commas)
        if (query.trim()) {
          const hashtags = query
            .split(/[\s,]+/)
            .map((tag) => tag.replace(/^#/, "").trim())
            .filter((tag) => tag.length > 0);
          if (hashtags.length > 0) {
            params.set("hashtags", hashtags.join(","));
          }
        }

        // Add size filters
        if (filters.minSize) {
          params.set("minSize", filters.minSize.toString());
        }
        if (filters.maxSize) {
          params.set("maxSize", filters.maxSize.toString());
        }

        // Add date filters
        if (filters.dateFrom) {
          params.set("dateFrom", filters.dateFrom.toISOString());
        }
        if (filters.dateTo) {
          params.set("dateTo", filters.dateTo.toISOString());
        }

        const url = `/api/photos/search?${params.toString()}`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.success) {
          setSearchResults(data.photos);
        } else {
          setSearchError(data.error || "Search failed");
          setSearchResults([]);
        }
      } catch (error) {
        console.error("Search error:", error);
        setSearchError("Failed to search photos");
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    },
    [],
  );

  const handleSearch = (query: string) => {
    setCurrentSearchQuery(query);
    performSearch(query, currentFilters);
  };

  const handleFilter = (filters: FilterCriteria) => {
    setCurrentFilters(filters);
    performSearch(currentSearchQuery, filters);
  };

  const handleClearSearch = () => {
    setCurrentSearchQuery("");
    setCurrentFilters({});
    setSearchResults(null);
    setSearchError(null);
  };

  const handleUploadSuccess = () => {
    console.log("Photo uploaded successfully!");
    setActiveTab("browse");
    revalidator.revalidate(); // Refresh photos list
  };

  return (
    <Container size="xl" py="xl" style={{ position: "relative", zIndex: 1 }}>
      <Stack gap="lg">
        {/* Header */}
        <Stack gap={4} mb="sm">
          <Title order={1} className="gradient-text" style={{ fontSize: 36, fontWeight: 800 }}>
            Photo Gallery
          </Title>
          <Text c="dimmed" size="sm">
            {photos.length} photo{photos.length !== 1 ? "s" : ""} in your collection
          </Text>
        </Stack>

        {/* Navigation Tabs */}
        <Tabs value={activeTab} onChange={setActiveTab}>
          <Tabs.List>
            <Tabs.Tab value="browse" leftSection={<FiHome size={15} />}>
              Browse
            </Tabs.Tab>
            <Tabs.Tab value="upload" leftSection={<FiUpload size={15} />}>
              Upload
            </Tabs.Tab>
            <Tabs.Tab value="search" leftSection={<FiSearch size={15} />}>
              Search
            </Tabs.Tab>
          </Tabs.List>

          {/* Browse Tab */}
          <Tabs.Panel value="browse" pt="lg">
            <Stack gap="md">
              <Group justify="flex-end">
                <Button
                  variant="subtle"
                  color="violet"
                  size="xs"
                  onClick={() => revalidator.revalidate()}
                >
                  Refresh
                </Button>
              </Group>

              <PhotoGrid
                photos={photos}
                onPhotoClick={handlePhotoClick}
                isAdmin={isAdmin}
                onDeletePhoto={handleDeletePhoto}
              />
            </Stack>
          </Tabs.Panel>

          {/* Upload Tab */}
          <Tabs.Panel value="upload" pt="lg">
            <Stack gap="md">
              <Text size="sm" c="dimmed">
                Upload a new photo to your gallery
              </Text>
              <PhotoUploader onSuccess={handleUploadSuccess} />
            </Stack>
          </Tabs.Panel>

          {/* Search Tab */}
          <Tabs.Panel value="search" pt="lg">
            <Stack gap="md">
              <Group justify="space-between">
                <Text size="lg" fw={600}>
                  Search & Filter Photos
                </Text>
                {searchResults !== null && (
                  <Button
                    variant="subtle"
                    color="red"
                    size="sm"
                    onClick={handleClearSearch}
                  >
                    Clear Search
                  </Button>
                )}
              </Group>

              <SearchBar
                onSearch={handleSearch}
                onClear={handleClearSearch}
                placeholder="Search by hashtags (e.g., nature sunset)"
              />

              <FilterPanel
                onApplyFilters={handleFilter}
                onClearFilters={handleClearSearch}
              />

              {/* Search Status */}
              {searchLoading && (
                <Group justify="center" py="xl">
                  <Loader size="lg" />
                  <Text>Searching...</Text>
                </Group>
              )}

              {searchError && (
                <Alert
                  icon={<FiAlertCircle />}
                  color="red"
                  title="Search Error"
                >
                  {searchError}
                </Alert>
              )}

              {/* Results Info */}
              {searchResults !== null && !searchLoading && (
                <Text size="sm" c="dimmed">
                  Found {searchResults.length} photo
                  {searchResults.length !== 1 ? "s" : ""}
                  {currentSearchQuery && ` matching "${currentSearchQuery}"`}
                </Text>
              )}

              {/* Photo Grid */}
              {!searchLoading && (
                <PhotoGrid
                  photos={searchResults !== null ? searchResults : photos}
                  onPhotoClick={handlePhotoClick}
                  isAdmin={isAdmin}
                  onDeletePhoto={handleDeletePhoto}
                />
              )}
            </Stack>
          </Tabs.Panel>
        </Tabs>
      </Stack>

      {/* Photo Detail Modal */}
      <PhotoDetailModal
        opened={detailModalOpened}
        onClose={() => setDetailModalOpened(false)}
        photo={photoDetail}
      />
    </Container>
  );
}
