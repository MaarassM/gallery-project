import { Links, Meta, Outlet, Scripts, ScrollRestoration, useLoaderData, redirect } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { MantineProvider, ColorSchemeScript, AppShell, createTheme } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import { Navigation } from "~/components/Navigation";
import { getSessionUser, parseCookies } from "~/lib/auth/simple-auth";
import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "@mantine/dates/styles.css";
import "~/styles/global.css";

const theme = createTheme({
  primaryColor: "violet",
  defaultRadius: "md",
  fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
  headings: { fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" },
  colors: {
    dark: [
      "#C1C2C5", "#A6A7AB", "#909296", "#5C5F66",
      "#373A40", "#2C2E33", "#25262B", "#1A1B1E", "#141517", "#101113",
    ],
  },
  components: {
    Paper: {
      defaultProps: {
        bg: "rgba(255,255,255,0.05)",
        style: {
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.1)",
        },
      },
    },
    Button: {
      defaultProps: { radius: "md" },
    },
    Input: {
      defaultProps: { variant: "filled" },
    },
  },
});

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  console.log("=== ROOT LOADER ===", url.pathname);

  const cookieHeader = request.headers.get("cookie");
  console.log("Cookies:", cookieHeader);

  const cookies = parseCookies(cookieHeader);
  const sessionToken = cookies.session;

  const user = await getSessionUser(sessionToken);
  console.log("Session user:", user?.email || "NO SESSION");

  // If no session and not on auth/api pages, redirect to auth
  const isPublicPath = url.pathname === "/auth" || url.pathname.startsWith("/api/");
  if (!user && !isPublicPath) {
    console.log("No session, redirecting to /auth");
    return redirect("/auth");
  }

  return {
    user: user || null,
  };
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
        <ColorSchemeScript />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function Root() {
  const { user } = useLoaderData<typeof loader>();

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      if (response.ok) {
        // Redirect to auth page after logout
        window.location.href = "/auth";
      }
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <MantineProvider theme={theme} defaultColorScheme="dark">
      <Notifications position="top-right" />
      <AppShell header={{ height: 70 }} padding="md">
        <AppShell.Header>
          <Navigation
            currentUser={user ? {
              id: user.id,
              email: user.email,
              name: user.name || user.email,
              role: (user as any).role || "REGISTERED",
            } : null}
            onLogout={handleLogout}
          />
        </AppShell.Header>
        <AppShell.Main>
          <Outlet />
        </AppShell.Main>
      </AppShell>
    </MantineProvider>
  );
}
