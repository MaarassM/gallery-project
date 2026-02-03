import type { LoaderFunctionArgs } from "react-router";
import { promises as fs } from "node:fs";
import path from "node:path";

const MIME_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
};

export async function loader({ params }: LoaderFunctionArgs) {
  const filePath = params["*"];

  if (!filePath) {
    return new Response("Not found", { status: 404 });
  }

  // Prevent directory traversal attacks
  const normalizedPath = path.normalize(filePath);
  if (normalizedPath.includes("..")) {
    return new Response("Forbidden", { status: 403 });
  }

  const storagePath = process.env.STORAGE_PATH || "./storage";
  const fullPath = path.join(process.cwd(), storagePath, normalizedPath);

  try {
    const file = await fs.readFile(fullPath);
    const ext = path.extname(fullPath).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";

    return new Response(file, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("Storage file not found:", fullPath);
    return new Response("Not found", { status: 404 });
  }
}
