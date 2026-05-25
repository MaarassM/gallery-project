import { useState } from "react";
import { Stack, Tabs, Text, Title, Box } from "@mantine/core";
import { LoginForm } from "~/modules/auth/components/LoginForm";
import { RegisterForm } from "~/modules/auth/components/RegisterForm";
import { FiLogIn, FiUserPlus, FiCamera } from "react-icons/fi";
import { useNavigate, redirect } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { getSessionUser, parseCookies } from "~/lib/auth/simple-auth";

export async function loader({ request }: LoaderFunctionArgs) {
  const cookieHeader = request.headers.get("cookie");
  const cookies = parseCookies(cookieHeader);
  const sessionToken = cookies.session;
  const user = await getSessionUser(sessionToken);
  if (user) return redirect("/");
  return null;
}

export function meta() {
  return [
    { title: "Sign In — Gallery" },
    { name: "description", content: "Sign in or create an account" },
  ];
}

export default function Auth() {
  const [activeTab, setActiveTab] = useState<string | null>("login");
  const navigate = useNavigate();

  return (
    <Box
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        position: "relative",
        zIndex: 1,
      }}
    >
      <Box style={{ width: "100%", maxWidth: 420 }}>
        {/* Logo / brand */}
        <Stack align="center" gap="xs" mb="xl">
          <Box
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: "linear-gradient(135deg, #7c3aed, #3b82f6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 8px 32px rgba(124, 58, 237, 0.4)",
            }}
          >
            <FiCamera size={26} color="white" />
          </Box>
          <Title order={2} className="gradient-text" style={{ textAlign: "center" }}>
            Gallery
          </Title>
          <Text size="sm" c="dimmed" style={{ textAlign: "center" }}>
            Your personal photo collection
          </Text>
        </Stack>

        {/* Glass card */}
        <Box
          className="glass"
          style={{ padding: "28px", boxShadow: "0 24px 64px rgba(0,0,0,0.4)" }}
        >
          <Tabs value={activeTab} onChange={setActiveTab}>
            <Tabs.List grow mb="lg">
              <Tabs.Tab value="login" leftSection={<FiLogIn size={15} />}>
                Sign In
              </Tabs.Tab>
              <Tabs.Tab value="register" leftSection={<FiUserPlus size={15} />}>
                Register
              </Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="login">
              <LoginForm
                onSuccess={() => navigate("/")}
                onSwitchToRegister={() => setActiveTab("register")}
              />
            </Tabs.Panel>

            <Tabs.Panel value="register">
              <RegisterForm
                onSuccess={() => setActiveTab("login")}
                onSwitchToLogin={() => setActiveTab("login")}
              />
            </Tabs.Panel>
          </Tabs>
        </Box>
      </Box>
    </Box>
  );
}
