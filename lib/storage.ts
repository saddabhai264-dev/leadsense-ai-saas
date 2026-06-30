import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { v2 as cloudinary } from "cloudinary";
import crypto from "node:crypto";

type UploadInput = {
  userId: string;
  filename: string;
  contentType: string;
  body: Buffer;
  purpose?: string;
};

export type UploadedObject = {
  bucket: string;
  key: string;
  filename: string;
  contentType: string;
  size: number;
  url: string | null;
};

export function isFileStorageConfigured() {
  return isCloudinaryConfigured() || isR2Configured();
}

export async function uploadFileToStorage(input: UploadInput): Promise<UploadedObject> {
  if (isCloudinaryConfigured()) return uploadToCloudinary(input);
  if (isR2Configured()) return uploadToR2(input);
  throw new Error("File storage is not configured. Add Cloudinary or Cloudflare R2 env vars.");
}

function isCloudinaryConfigured() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET,
  );
}

function isR2Configured() {
  return Boolean(
    process.env.R2_ACCOUNT_ID &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_BUCKET,
  );
}

async function uploadToCloudinary(input: UploadInput): Promise<UploadedObject> {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });

  const publicId = buildStorageKey(input.userId, stripExtension(input.filename), input.purpose ?? "upload");
  const result = await new Promise<{ public_id: string; secure_url: string }>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({
      public_id: publicId,
      resource_type: "raw",
      use_filename: false,
      unique_filename: false,
      overwrite: false,
    }, (error, uploadResult) => {
      if (error || !uploadResult) reject(error ?? new Error("Cloudinary upload failed"));
      else resolve({ public_id: uploadResult.public_id, secure_url: uploadResult.secure_url });
    });

    stream.end(input.body);
  });

  return {
    bucket: process.env.CLOUDINARY_CLOUD_NAME!,
    key: result.public_id,
    filename: input.filename,
    contentType: input.contentType || "application/octet-stream",
    size: input.body.byteLength,
    url: result.secure_url,
  };
}

async function uploadToR2(input: UploadInput): Promise<UploadedObject> {
  const bucket = process.env.R2_BUCKET!;
  const key = buildStorageKey(input.userId, input.filename, input.purpose ?? "upload");

  await getR2Client().send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: input.body,
    ContentType: input.contentType || "application/octet-stream",
  }));

  return {
    bucket,
    key,
    filename: input.filename,
    contentType: input.contentType || "application/octet-stream",
    size: input.body.byteLength,
    url: buildR2PublicUrl(key),
  };
}

function getR2Client() {
  return new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });
}

function buildStorageKey(userId: string, filename: string, purpose: string) {
  const safeName = filename.toLowerCase().replace(/[^a-z0-9._/-]+/g, "-").replace(/^-+|-+$/g, "") || "file";
  const date = new Date().toISOString().slice(0, 10);
  const id = crypto.randomBytes(8).toString("hex");
  return `${purpose}/${userId}/${date}/${id}-${safeName}`;
}

function stripExtension(filename: string) {
  return filename.replace(/\.[^/.]+$/, "");
}

function buildR2PublicUrl(key: string) {
  const baseUrl = process.env.R2_PUBLIC_URL?.replace(/\/$/, "");
  return baseUrl ? `${baseUrl}/${key}` : null;
}
