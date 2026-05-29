import { v2 as cloudinary } from "cloudinary";

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