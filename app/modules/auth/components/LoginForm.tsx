import {
  Stack,
  TextInput,
  PasswordInput,
  Button,
  Text,
  Anchor,
  Divider,
  Group,
  Alert,
} from "@mantine/core";
import { FiMail, FiLock, FiAlertCircle } from "react-icons/fi";
import { useSearchParams } from "react-router";

interface LoginFormProps {
  onSuccess?: () => void;
  onSwitchToRegister?: () => void;
}

const ERROR_MESSAGES: Record<string, string> = {
  "invalid-credentials": "Incorrect email or password.",
  "missing-fields": "Please enter your email and password.",
  "server-error": "Something went wrong. Please try again.",
};

export function LoginForm({ onSwitchToRegister }: LoginFormProps) {
  const [searchParams] = useSearchParams();
  const errorKey = searchParams.get("error");
  const errorMsg = errorKey ? (ERROR_MESSAGES[errorKey] ?? "Login failed.") : null;

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

      {errorMsg && (
        <Alert icon={<FiAlertCircle size={16} />} color="red" variant="light">
          {errorMsg}
        </Alert>
      )}

      <form method="post" action="/api/auth/login">
        <Stack gap="md">
          <TextInput
            label="Email"
            name="email"
            type="email"
            placeholder="your@gallery.com"
            leftSection={<FiMail size={16} />}
            required
          />

          <PasswordInput
            label="Password"
            name="password"
            placeholder="Enter your password"
            leftSection={<FiLock size={16} />}
            required
          />

          <Button type="submit" fullWidth variant="gradient" gradient={{ from: "violet", to: "blue", deg: 135 }}>
            Sign In
          </Button>
        </Stack>
      </form>

      <Divider label="OR" labelPosition="center" />

      <Group justify="center" gap="xs">
        <Text size="sm" c="dimmed">
          Don't have an account?
        </Text>
        <Anchor size="sm" onClick={onSwitchToRegister} style={{ color: "#a78bfa" }}>
          Register
        </Anchor>
      </Group>
    </Stack>
  );
}
