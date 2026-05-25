import { Group, Button, Container, Text, Badge } from "@mantine/core";
import { FiHome, FiLogIn, FiLogOut, FiShield, FiCamera } from "react-icons/fi";
import { Link } from "react-router";

interface NavigationProps {
  currentUser?: {
    id: string;
    email: string | null;
    name: string | null;
    role: string;
  } | null;
  onLogout?: () => void;
}

export function Navigation({ currentUser, onLogout }: NavigationProps) {
  const isAdmin = currentUser?.role === "ADMINISTRATOR";

  return (
    <Container size="xl" h="100%">
      <Group justify="space-between" h="100%">
        <Link to="/" style={{ textDecoration: "none" }}>
          <Group gap="xs">
            <FiCamera size={22} color="#a78bfa" />
            <Text fw={700} size="lg" style={{ color: "white", letterSpacing: "-0.3px" }}>
              Gallery
            </Text>
          </Group>
        </Link>

        <Group gap="sm">
          <Button
            component={Link}
            to="/"
            variant="subtle"
            color="gray"
            leftSection={<FiHome size={15} />}
            size="sm"
          >
            Browse
          </Button>

          {isAdmin && (
            <Button
              component={Link}
              to="/admin"
              variant="light"
              color="violet"
              leftSection={<FiShield size={15} />}
              size="sm"
            >
              Admin
            </Button>
          )}

          {currentUser ? (
            <Group gap="xs">
              <Badge
                variant="dot"
                color="violet"
                size="lg"
                style={{ cursor: "default", fontWeight: 500, color: "rgba(255,255,255,0.7)" }}
              >
                {currentUser.name || currentUser.email}
              </Badge>
              <Button
                variant="subtle"
                color="red"
                leftSection={<FiLogOut size={15} />}
                size="sm"
                onClick={onLogout}
              >
                Sign out
              </Button>
            </Group>
          ) : (
            <Button
              component={Link}
              to="/auth"
              variant="gradient"
              gradient={{ from: "violet", to: "blue", deg: 135 }}
              leftSection={<FiLogIn size={15} />}
              size="sm"
            >
              Sign In
            </Button>
          )}
        </Group>
      </Group>
    </Container>
  );
}
