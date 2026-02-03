import {
  Stack,
  TextInput,
  PasswordInput,
  Button,
  Text,
  Anchor,
  Divider,
  Group,
} from "@mantine/core";
import { FiMail, FiLock } from "react-icons/fi";

interface LoginFormProps {
  onSuccess?: () => void;
  onSwitchToRegister?: () => void;
}

export function LoginForm({ onSwitchToRegister }: LoginFormProps) {
  return (
    <Stack gap="md">
      <div>
        <Text size="xl" fw={700}>
          Welcome Back
        </Text>
        <Text size="sm" c="dimmed">
          Sign in to your account to continue
        </Text>
      </div>

      {/* Pure HTML form - no React Router interference */}
      <form method="post" action="/api/auth/login">
        <input type="hidden" name="_action" value="login" />
        <Stack gap="md">
          <TextInput
            label="Email"
            name="email"
            type="email"
            placeholder="your@gallery.com"
            defaultValue="admin@gallery.com"
            leftSection={<FiMail size={16} />}
            required
          />

          <PasswordInput
            label="Password"
            name="password"
            placeholder="Enter your password"
            defaultValue="admin123"
            leftSection={<FiLock size={16} />}
            required
          />

          <Button type="submit" fullWidth>
            Sign In
          </Button>
        </Stack>
      </form>

      <Divider label="OR" labelPosition="center" />

      <Group justify="center" gap="xs">
        <Text size="sm" c="dimmed">
          Don't have an account?
        </Text>
        <Anchor size="sm" onClick={onSwitchToRegister}>
          Register
        </Anchor>
      </Group>
    </Stack>
  );
}
