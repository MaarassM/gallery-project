import { login } from "~/modules/auth/procedures/login";
import { register } from "~/modules/auth/procedures/register";
import { logout } from "~/modules/auth/procedures/logout";

import { uploadPhoto } from "~/modules/photos/procedures/upload-photo";
import { getPhotos } from "~/modules/photos/procedures/get-photos";
import { getPhotoById } from "~/modules/photos/procedures/get-photo-by-id";
import { searchPhotos } from "~/modules/photos/procedures/search-photos";
import { downloadOriginal } from "~/modules/photos/procedures/download-original";
import { downloadProcessed } from "~/modules/photos/procedures/download-processed";

import { getUsers } from "~/modules/admin/procedures/get-users";
import { updateUser } from "~/modules/admin/procedures/update-user";
import { getStatistics } from "~/modules/admin/procedures/get-statistics";
import { getAuditLogs } from "~/modules/admin/procedures/get-audit-logs";

// Nested map of the application's procedures. Procedures are built with the
// custom middleware chain in ~/lib/orpc/middleware, so the router is a plain
// object navigated by path in the /api/orpc route handler.
export const appRouter = {
  // Authentication routes
  auth: {
    login,
    register,
    logout,
  },

  // Photo routes
  photos: {
    upload: uploadPhoto,
    list: getPhotos,
    getById: getPhotoById,
    search: searchPhotos,
    downloadOriginal,
    downloadProcessed,
  },

  // Admin routes
  admin: {
    getUsers,
    updateUser,
    getStatistics,
    getAuditLogs,
  },
};

export type AppRouter = typeof appRouter;
