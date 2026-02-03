import { useState } from "react";
import { Container, Paper, Stack, Tabs } from "@mantine/core";
import { LoginForm } from "~/modules/auth/components/LoginForm";
import { RegisterForm } from "~/modules/auth/components/RegisterForm";
import { FiLogIn, FiUserPlus } from "react-icons/fi";
import { useNavigate, redirect } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { getSessionUser, parseCookies } from "~/lib/auth/simple-auth";

export async function loader({ request }: LoaderFunctionArgs) {
  // If already logged in, redirect to home
  const cookieHeader = request.headers.get("cookie");
  const cookies = parseCookies(cookieHeader);
  const sessionToken = cookies.session;
  const user = await getSessionUser(sessionToken);

  if (user) {
    return redirect("/");
  }
  return null;
}

export function meta() {
  return [
    { title: "Authentication - Photo Gallery" },
    { name: "description", content: "Sign in or create an account" },
  ];
}

export default function Auth() {
  const [activeTab, setActiveTab] = useState<string | null>("login");
  const navigate = useNavigate();

  const handleLoginSuccess = () => {
    console.log("Login successful!");
    // TODO: Redirect to home page
    navigate("/");
  };

  const handleRegisterSuccess = () => {
    console.log("Registration successful!");
    // Switch to login tab
    setActiveTab("login");
  };

  return (
    <Container size="sm" py="xl">
      <Stack gap="lg">
        <Paper shadow="md" p="xl" radius="md" withBorder>
          <Tabs value={activeTab} onChange={setActiveTab}>
            <Tabs.List grow>
              <Tabs.Tab value="login" leftSection={<FiLogIn size={16} />}>
                Sign In
              </Tabs.Tab>
              <Tabs.Tab value="register" leftSection={<FiUserPlus size={16} />}>
                Register
              </Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="login" pt="lg">
              <LoginForm
                onSuccess={handleLoginSuccess}
                onSwitchToRegister={() => setActiveTab("register")}
              />
            </Tabs.Panel>

            <Tabs.Panel value="register" pt="lg">
              <RegisterForm
                onSuccess={handleRegisterSuccess}
                onSwitchToLogin={() => setActiveTab("login")}
              />
            </Tabs.Panel>
          </Tabs>
        </Paper>
      </Stack>
    </Container>
  );
}
