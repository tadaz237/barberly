import { v2 as cloudinary } from "cloudinary";

const APP_CLOUDINARY_FOLDER_PREFIX = "barberly/";

export async function uploadImageToCloudinary(
  dataUrl: string,
  folder: string,
) {
  const result = await cloudinary.uploader.upload(dataUrl, {
    folder: `barberly/${folder}`,
    resource_type: "image",
  });

  return result.secure_url;
}

function getConfiguredCloudName() {
  if (process.env.CLOUDINARY_CLOUD_NAME) {
    return process.env.CLOUDINARY_CLOUD_NAME;
  }

  const cloudinaryUrl = process.env.CLOUDINARY_URL;
  if (!cloudinaryUrl) return null;

  try {
    return new URL(cloudinaryUrl).hostname || null;
  } catch {
    return null;
  }
}

export function getCloudinaryPublicId(imageUrl: string | null | undefined) {
  if (!imageUrl) return null;

  let url: URL;
  try {
    url = new URL(imageUrl);
  } catch {
    return null;
  }

  if (url.hostname !== "res.cloudinary.com") return null;

  const segments = url.pathname
    .split("/")
    .filter(Boolean)
    .map((segment) => decodeURIComponent(segment));
  const configuredCloudName = getConfiguredCloudName();

  if (configuredCloudName && segments[0] !== configuredCloudName) {
    return null;
  }

  const uploadIndex = segments.indexOf("upload");
  if (uploadIndex === -1) return null;

  const afterUpload = segments.slice(uploadIndex + 1);
  const versionIndex = afterUpload.findIndex((segment) => /^v\d+$/.test(segment));
  const publicIdSegments =
    versionIndex >= 0 ? afterUpload.slice(versionIndex + 1) : afterUpload;

  if (publicIdSegments.length === 0) return null;

  const lastSegment = publicIdSegments[publicIdSegments.length - 1];
  publicIdSegments[publicIdSegments.length - 1] = lastSegment.replace(
    /\.[a-z0-9]+$/i,
    "",
  );

  const publicId = publicIdSegments.join("/");
  if (!publicId.startsWith(APP_CLOUDINARY_FOLDER_PREFIX)) return null;

  return publicId;
}

export async function deleteImageFromCloudinary(
  imageUrl: string | null | undefined,
) {
  const publicId = getCloudinaryPublicId(imageUrl);
  if (!publicId) return "skipped" as const;

  const result = (await cloudinary.uploader.destroy(publicId, {
    invalidate: true,
    resource_type: "image",
  })) as { result?: string };

  if (result.result === "ok" || result.result === "not found") {
    return result.result;
  }

  throw new Error(`Cloudinary deletion failed for ${publicId}`);
}

export async function deleteImagesFromCloudinary(
  imageUrls: Iterable<string | null | undefined>,
) {
  const uniqueUrls = Array.from(new Set(imageUrls));

  for (const imageUrl of uniqueUrls) {
    await deleteImageFromCloudinary(imageUrl);
  }
}
