import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { apiError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { uploadFileToStorage } from "@/lib/storage";

const maxFileSize = 10 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    const formData = await request.formData();
    const file = formData.get("file");
    const purpose = String(formData.get("purpose") || "upload").slice(0, 50);

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Upload a file using the `file` form field." }, { status: 400 });
    }

    if (file.size > maxFileSize) {
      return NextResponse.json({ error: "File is too large. Maximum size is 10 MB." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const uploaded = await uploadFileToStorage({
      userId: user.id,
      filename: file.name,
      contentType: file.type || "application/octet-stream",
      body: buffer,
      purpose,
    });

    const storedFile = await prisma.storedFile.create({
      data: {
        userId: user.id,
        bucket: uploaded.bucket,
        key: uploaded.key,
        filename: uploaded.filename,
        contentType: uploaded.contentType,
        size: uploaded.size,
        url: uploaded.url,
        purpose,
      },
    });

    return NextResponse.json({
      id: storedFile.id,
      filename: storedFile.filename,
      contentType: storedFile.contentType,
      size: storedFile.size,
      url: storedFile.url,
      purpose: storedFile.purpose,
      createdAt: storedFile.createdAt,
    });
  } catch (error) {
    return apiError(error);
  }
}
