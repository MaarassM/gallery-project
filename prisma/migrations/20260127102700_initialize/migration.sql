-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ANONYMOUS', 'REGISTERED', 'ADMINISTRATOR');

-- CreateEnum
CREATE TYPE "PackageType" AS ENUM ('FREE', 'PRO', 'GOLD');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "name" TEXT,
    "image" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'REGISTERED',
    "packageType" "PackageType" NOT NULL DEFAULT 'FREE',
    "packageId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "scope" TEXT,
    "accessToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "accountId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "idToken" TEXT,
    "password" TEXT,
    "providerId" TEXT NOT NULL,
    "refreshToken" TEXT,
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "token" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userAgent" TEXT,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "photos" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "thumbnailPath" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "processingOptions" JSONB,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "downloadCount" INTEGER NOT NULL DEFAULT 0,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "photos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hashtags" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hashtags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "photo_hashtags" (
    "photoId" TEXT NOT NULL,
    "hashtagId" TEXT NOT NULL,

    CONSTRAINT "photo_hashtags_pkey" PRIMARY KEY ("photoId","hashtagId")
);

-- CreateTable
CREATE TABLE "packages" (
    "id" TEXT NOT NULL,
    "type" "PackageType" NOT NULL,
    "name" TEXT NOT NULL,
    "maxPhotosPerMonth" INTEGER NOT NULL,
    "maxPhotoSizeMB" INTEGER NOT NULL,
    "maxStorageGB" INTEGER NOT NULL,
    "canDownloadOriginal" BOOLEAN NOT NULL,
    "canApplyFilters" BOOLEAN NOT NULL,
    "maxFiltersPerDownload" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "packages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usage_tracking" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "photosUploaded" INTEGER NOT NULL DEFAULT 0,
    "storageUsedMB" INTEGER NOT NULL DEFAULT 0,
    "downloads" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usage_tracking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "userEmail" TEXT,
    "userRole" "UserRole" NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "action" TEXT NOT NULL,
    "resource" TEXT,
    "resourceId" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "errorMsg" TEXT,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_packageType_idx" ON "users"("packageType");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_accountId_key" ON "accounts"("accountId");

-- CreateIndex
CREATE INDEX "accounts_userId_idx" ON "accounts"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_key" ON "sessions"("token");

-- CreateIndex
CREATE INDEX "sessions_userId_idx" ON "sessions"("userId");

-- CreateIndex
CREATE INDEX "photos_userId_idx" ON "photos"("userId");

-- CreateIndex
CREATE INDEX "photos_uploadedAt_idx" ON "photos"("uploadedAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "hashtags_name_key" ON "hashtags"("name");

-- CreateIndex
CREATE INDEX "hashtags_name_idx" ON "hashtags"("name");

-- CreateIndex
CREATE UNIQUE INDEX "packages_type_key" ON "packages"("type");

-- CreateIndex
CREATE INDEX "usage_tracking_userId_idx" ON "usage_tracking"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "usage_tracking_userId_month_year_key" ON "usage_tracking"("userId", "month", "year");

-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_timestamp_idx" ON "audit_logs"("timestamp" DESC);

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "packages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "photos" ADD CONSTRAINT "photos_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "photo_hashtags" ADD CONSTRAINT "photo_hashtags_hashtagId_fkey" FOREIGN KEY ("hashtagId") REFERENCES "hashtags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "photo_hashtags" ADD CONSTRAINT "photo_hashtags_photoId_fkey" FOREIGN KEY ("photoId") REFERENCES "photos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usage_tracking" ADD CONSTRAINT "usage_tracking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
