import { Container, Title, Text, Stack } from "@mantine/core";

export function meta() {
  return [
    { title: "Photo Gallery - Home" },
    { name: "description", content: "Browse and upload photos" },
  ];
}

export default function Home() {
  return (
    <Container size="xl" py="xl">
      <Stack gap="lg">
        <div>
          <Title order={1}>Photo Gallery</Title>
        </div>

        <Text>
          Welcome! This is a photo gallery application with user authentication,
          package management, and image processing features.
        </Text>

        <Text size="sm" c="dimmed">
          Status: Basic structure created. Features will be added incrementally.
        </Text>
      </Stack>
    </Container>
  );
}
