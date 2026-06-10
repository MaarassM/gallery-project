import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/_index.tsx"),
  route("auth", "routes/auth.tsx"),
  route("admin", "routes/admin.tsx"),

  // API Routes - Photos
  route("api/photos/upload", "routes/api.photos.upload.ts"),
  route("api/photos/list", "routes/api.photos.list.ts"),
  route("api/photos/search", "routes/api.photos.search.ts"),
  route("api/photos/:id", "routes/api.photos.$id.ts"),
  route("api/photos/:id/download", "routes/api.photos.$id.download.ts"),
  route("api/photos/:id/download-processed", "routes/api.photos.$id.download-processed.ts"),

  // API Routes - Auth
  route("api/auth/login", "routes/api.auth.login.ts"),
  route("api/auth/register", "routes/api.auth.register.ts"),
  route("api/auth/logout", "routes/api.auth.logout.ts"),

  // API Routes - Admin
  route("api/admin/users", "routes/api.admin.users.ts"),
  route("api/admin/users/:id", "routes/api.admin.users.$id.ts"),
  route("api/admin/statistics", "routes/api.admin.statistics.ts"),
  route("api/admin/audit-logs", "routes/api.admin.audit-logs.ts"),

  // Observability
  route("api/metrics", "routes/api/metrics.ts"),

  // Storage - serve uploaded images
  route("storage/*", "routes/storage.$.ts"),
] satisfies RouteConfig;
