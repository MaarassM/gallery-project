import { useState } from "react";
import { useSearchParams } from "react-router";
import {
  Stack,
  TextInput,
  PasswordInput,
  Button,
  Text,
  Anchor,
  Divider,
  Group,
  Select,
  Alert,
} from "@mantine/core";
import { FiMail, FiLock, FiUser, FiPackage, FiInfo, FiAlertCircle } from "react-icons/fi";

interface RegisterFormProps {
  onSuccess?: () => void;
  onSwitchToLogin?: () => void;
}

const PACKAGES = [
  {
    value: "FREE",
    label: "Free Tier",
    description: "10 photos/month, 5MB max, 1GB storage",
  },
  {
    value: "PRO",
    label: "Pro Plan",
    description: "100 photos/month, 20MB max, 10GB storage, filters & downloads",
  },
  {
    value: "GOLD",
    label: "Gold Premium",
    description: "Unlimited photos, 50MB max, 50GB storage, all features",
  },
];

const ERROR_MESSAGES: Record<string, string> = {
  "user-exists": "An account with that email already exists.",
  "missing-fields": "Please fill in all required fields.",
  "invalid-package": "Invalid package selection.",
  "package-not-found": "Selected package is unavailable.",
  "server-error": "Something went wrong. Please try again.",
};

export function RegisterForm({ onSwitchToLogin }: RegisterFormProps) {
  const [selectedPackage, setSelectedPackage] = useState("FREE");
  const [searchParams] = useSearchParams();
  const errorKey = searchParams.get("error");
  const errorMsg = errorKey ? (ERROR_MESSAGES[errorKey] ?? "Registration failed.") : null;

  const packageInfo = PACKAGES.find((pkg) => pkg.value === selectedPackage);

  return (
    <Stack gap="md">
      <div>
        <Text size="xl" fw={700}>
          Create Account
        </Text>
        <Text size="sm" c="dimmed">
          Join our photo gallery community
        </Text>
      </div>

      {errorMsg && (
        <Alert icon={<FiAlertCircle size={16} />} color="red" variant="light">
          {errorMsg}
        </Alert>
      )}

      {/* Native form — ensures browser handles Set-Cookie on the redirect response */}
      <form method="post" action="/api/auth/register">
        {/* Hidden input carries the package type since Mantine Select is not a native element */}
        <input type="hidden" name="packageType" value={selectedPackage} />
        <Stack gap="md">
          <TextInput
            label="Full Name"
            name="name"
            placeholder="John Doe"
            leftSection={<FiUser size={16} />}
            required
          />

          <TextInput
            label="Email"
            name="email"
            type="email"
            placeholder="your@email.com"
            leftSection={<FiMail size={16} />}
            required
          />

          <PasswordInput
            label="Password"
            name="password"
            placeholder="Create a strong password"
            leftSection={<FiLock size={16} />}
            required
          />

          <PasswordInput
            label="Confirm Password"
            placeholder="Confirm your password"
            leftSection={<FiLock size={16} />}
          />

          <Select
            label="Choose Your Package"
            placeholder="Select package"
            value={selectedPackage}
            onChange={(value) => setSelectedPackage(value || "FREE")}
            leftSection={<FiPackage size={16} />}
            data={PACKAGES.map((pkg) => ({ value: pkg.value, label: pkg.label }))}
          />

          {packageInfo && (
            <Alert icon={<FiInfo size={14} />} color="blue" variant="light">
              <Text size="sm" fw={500}>{packageInfo.label}</Text>
              <Text size="xs" c="dimmed">{packageInfo.description}</Text>
            </Alert>
          )}

          <Button
            type="submit"
            fullWidth
            variant="gradient"
            gradient={{ from: "violet", to: "blue", deg: 135 }}
          >
            Create Account
          </Button>
        </Stack>
      </form>

      <Divider label="OR" labelPosition="center" />

      <Group justify="center" gap="xs">
        <Text size="sm" c="dimmed">Already have an account?</Text>
        <Anchor size="sm" onClick={onSwitchToLogin} style={{ color: "#a78bfa" }}>
          Sign In
        </Anchor>
      </Group>
    </Stack>
  );
}
