import { Group, Button, Container, Title } from "@mantine/core";
import { FiHome, FiLogIn, FiLogOut, FiShield, FiUser } from "react-icons/fi";
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
    <Container size="xl" py="md">
      <Group justify="space-between">
        {/* Logo / Title */}
        <Link to="/" style={{ textDecoration: "none", color: "inherit" }}>
          <Group gap="xs"></Group>
        </Link>

        {/* Navigation Links */}
        <Group gap="md">
          <Button
            component={Link}
            to="/"
            variant="subtle"
            leftSection={<FiHome size={16} />}
          >
            Home
          </Button>

          {isAdmin && (
            <Button
              component={Link}
              to="/admin"
              variant="subtle"
              leftSection={<FiShield size={16} />}
              color="red"
            >
              Admin Panel
            </Button>
          )}

          {currentUser ? (
            <>
              <Button
                variant="subtle"
                leftSection={<FiUser size={16} />}
                disabled
              >
                {currentUser.name || currentUser.email}
              </Button>
              <Button
                variant="light"
                color="red"
                leftSection={<FiLogOut size={16} />}
                onClick={onLogout}
              >
                Logout
              </Button>
            </>
          ) : (
            <Button
              component={Link}
              to="/auth"
              variant="filled"
              leftSection={<FiLogIn size={16} />}
            >
              Sign In
            </Button>
          )}
        </Group>
      </Group>
    </Container>
  );
}
