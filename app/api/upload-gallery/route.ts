import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const MAX_REQUEST_SIZE = 12 * 1024 * 1024;
const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const MIME_TO_EXTENSION: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export async function POST(request: Request) {
  try {
    const contentLength = request.headers.get("content-length");

    if (contentLength) {
      const length = Number(contentLength);

      if (
        !Number.isFinite(length) ||
        length < 0 ||
        length > MAX_REQUEST_SIZE
      ) {
        return NextResponse.json(
          { error: "Request is too large." },
          { status: 413 },
        );
      }
    }

    const supabase = await createClient();

    // Verify authentication using server-verified claims.
    const { data: claimsData, error: claimsError } =
      await supabase.auth.getClaims();

    const userId = claimsData?.claims?.sub;

    if (claimsError || !userId) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 },
      );
    }

    // Verify active admin.
    const { data: profile, error: profileError } =
      await supabase
        .from("profiles")
        .select("role, is_active")
        .eq("id", userId)
        .maybeSingle();

    if (
      profileError ||
      !profile ||
      profile.role !== "admin" ||
      profile.is_active !== true
    ) {
      return NextResponse.json(
        { error: "Forbidden." },
        { status: 403 },
      );
    }

    let formData: FormData;

    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json(
        { error: "Invalid upload request." },
        { status: 400 },
      );
    }

    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "No image file was provided." },
        { status: 400 },
      );
    }

    if (file.size <= 0) {
      return NextResponse.json(
        { error: "The image file is empty." },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Image must be 10 MB or smaller." },
        { status: 400 },
      );
    }

    // Only allow the exact image types supported by the gallery bucket.
    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json(
        {
          error:
            "Only JPEG, PNG, WebP, and GIF images are allowed.",
        },
        { status: 400 },
      );
    }

    const extension = MIME_TO_EXTENSION[file.type];

    if (!extension) {
      return NextResponse.json(
        { error: "Unsupported image type." },
        { status: 400 },
      );
    }

    // Never use the client-provided filename as the storage path.
    const fileName = `${crypto.randomUUID()}.${extension}`;
    const filePath = `gallery/${fileName}`;

    const fileBuffer = await file.arrayBuffer();

    const { error: uploadError } = await supabase.storage
      .from("gallery")
      .upload(filePath, fileBuffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error(
        "Gallery storage upload error:",
        uploadError,
      );

      return NextResponse.json(
        { error: "Unable to upload image." },
        { status: 500 },
      );
    }

    const { data: publicUrlData } = supabase.storage
      .from("gallery")
      .getPublicUrl(filePath);

    if (!publicUrlData?.publicUrl) {
      // Clean up the uploaded object if a public URL cannot be generated.
      const { error: cleanupError } = await supabase.storage
        .from("gallery")
        .remove([filePath]);

      if (cleanupError) {
        console.error(
          "Gallery upload cleanup failed:",
          cleanupError,
        );
      }

      return NextResponse.json(
        { error: "Unable to prepare uploaded image." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      url: publicUrlData.publicUrl,
      path: filePath,
    });
  } catch (error) {
    console.error("Gallery upload error:", error);

    return NextResponse.json(
      {
        error:
          "Something went wrong while uploading the image.",
      },
      { status: 500 },
    );
  }
}