import { os } from "@orpc/server";

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

export const appRouter = os.router({
  // Authentication routes
  auth: os.router({
    login,
    register,
    logout,
  }),

  // Photo routes
  photos: os.router({
    upload: uploadPhoto,
    list: getPhotos,
    getById: getPhotoById,
    search: searchPhotos,
    downloadOriginal,
    downloadProcessed,
  }),

  // Admin routes
  admin: os.router({
    getUsers,
    updateUser,
    getStatistics,
    getAuditLogs,
  }),
});

export type AppRouter = typeof appRouter;
