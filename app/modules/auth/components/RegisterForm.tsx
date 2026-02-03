import { useState } from "react";
import { Form, useActionData, useNavigation } from "react-router";
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

export function RegisterForm({
  onSuccess,
  onSwitchToLogin,
}: RegisterFormProps) {
  const [selectedPackage, setSelectedPackage] = useState("FREE");
  const actionData = useActionData() as { error?: string } | undefined;
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

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

        {actionData?.error && (
          <Alert icon={<FiAlertCircle />} color="red">
            {actionData.error}
          </Alert>
        )}

        <Form method="post" action="/api/auth/register">
          <Stack gap="md">
            {/* Name */}
            <TextInput
              label="Full Name"
              name="name"
              placeholder="John Doe"
              leftSection={<FiUser size={16} />}
              disabled={isSubmitting}
              required
            />

            {/* Email */}
            <TextInput
              label="Email"
              name="email"
              type="email"
              placeholder="your@email.com"
              leftSection={<FiMail size={16} />}
              disabled={isSubmitting}
              required
            />

            {/* Password */}
            <PasswordInput
              label="Password"
              name="password"
              placeholder="Create a strong password"
              leftSection={<FiLock size={16} />}
              disabled={isSubmitting}
              required
            />

            {/* Confirm Password - client-side validation only */}
            <PasswordInput
              label="Confirm Password"
              placeholder="Confirm your password"
              leftSection={<FiLock size={16} />}
              disabled={isSubmitting}
              required
            />

            {/* Package Selection */}
            <Select
              label="Choose Your Package"
              name="packageType"
              placeholder="Select package"
              value={selectedPackage}
              onChange={(value) => setSelectedPackage(value || "FREE")}
              leftSection={<FiPackage size={16} />}
              data={PACKAGES.map((pkg) => ({
                value: pkg.value,
                label: pkg.label,
              }))}
              disabled={isSubmitting}
              required
            />

            {packageInfo && (
              <Alert icon={<FiInfo />} color="blue">
                <Text size="sm" fw={500}>
                  {packageInfo.label}
                </Text>
                <Text size="xs" c="dimmed">
                  {packageInfo.description}
                </Text>
              </Alert>
            )}

            <Button type="submit" fullWidth loading={isSubmitting}>
              Create Account
            </Button>
          </Stack>
        </Form>

        <Divider label="OR" labelPosition="center" />

        <Group justify="center" gap="xs">
          <Text size="sm" c="dimmed">
            Already have an account?
          </Text>
          <Anchor size="sm" onClick={onSwitchToLogin}>
            Sign In
          </Anchor>
        </Group>
      </Stack>
  );
}
