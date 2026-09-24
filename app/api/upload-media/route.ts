import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const MAX_FILE_SIZE = 8 * 1024 * 1024;
const MAX_REQUEST_SIZE = 9 * 1024 * 1024;

const MAX_ALT_TEXT_LENGTH = 300;
const MAX_FILE_NAME_LENGTH = 255;

const allowedTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

const extensionByMimeType: Record<
  (typeof allowedTypes)[number],
  string
> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export async function POST(request: Request) {
  try {
    // --------------------------------------------------
    // REQUEST SIZE
    // --------------------------------------------------

    const contentLength = request.headers.get("content-length");

    if (contentLength) {
      const contentLengthNumber = Number(contentLength);

      if (
        !Number.isFinite(contentLengthNumber) ||
        contentLengthNumber > MAX_REQUEST_SIZE
      ) {
        return NextResponse.json(
          { error: "Upload request is too large." },
          { status: 413 },
        );
      }
    }

    // --------------------------------------------------
    // AUTHENTICATION
    // --------------------------------------------------

    const supabase = await createClient();

    const {
      data: claimsData,
      error: claimsError,
    } = await supabase.auth.getClaims();

    if (claimsError || !claimsData?.claims?.sub) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    const userId = claimsData.claims.sub;

    // --------------------------------------------------
    // ADMIN AUTHORIZATION
    // --------------------------------------------------

    const { data: profile, error: profileError } =
      await supabase
        .from("profiles")
        .select("role, is_active")
        .eq("id", userId)
        .single();

    if (
      profileError ||
      profile?.role !== "admin" ||
      profile?.is_active !== true
    ) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 },
      );
    }

    // --------------------------------------------------
    // FORM DATA
    // --------------------------------------------------

    const formData = await request.formData();

    const file = formData.get("file");

    const altTextValue = formData.get("alt_text");

    const altText =
      typeof altTextValue === "string"
        ? altTextValue.trim()
        : "";

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Please select an image to upload." },
        { status: 400 },
      );
    }

    // --------------------------------------------------
    // ALT TEXT VALIDATION
    // --------------------------------------------------

    if (altText.length > MAX_ALT_TEXT_LENGTH) {
      return NextResponse.json(
        {
          error: `Alt text must be ${MAX_ALT_TEXT_LENGTH} characters or fewer.`,
        },
        { status: 400 },
      );
    }

    // --------------------------------------------------
    // FILE VALIDATION
    // --------------------------------------------------

    if (
      !allowedTypes.includes(
        file.type as (typeof allowedTypes)[number],
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid file type. Please upload JPG, PNG, WEBP, or GIF.",
        },
        { status: 400 },
      );
    }

    if (file.size <= 0) {
      return NextResponse.json(
        { error: "The selected file is empty." },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error: "File is too large. Maximum file size is 8MB.",
        },
        { status: 400 },
      );
    }

    // --------------------------------------------------
    // FILE NAME VALIDATION
    // --------------------------------------------------

    const originalFileName =
      typeof file.name === "string"
        ? file.name.trim()
        : "";

    if (!originalFileName) {
      return NextResponse.json(
        { error: "The uploaded file must have a valid name." },
        { status: 400 },
      );
    }

    if (originalFileName.length > MAX_FILE_NAME_LENGTH) {
      return NextResponse.json(
        {
          error: `File name must be ${MAX_FILE_NAME_LENGTH} characters or fewer.`,
        },
        { status: 400 },
      );
    }

    // --------------------------------------------------
    // SAFE STORAGE PATH
    // --------------------------------------------------

    const extension =
      extensionByMimeType[
        file.type as (typeof allowedTypes)[number]
      ];

    const storagePath =
      `media/${crypto.randomUUID()}.${extension}`;

    // --------------------------------------------------
    // UPLOAD TO STORAGE
    // --------------------------------------------------

    const { error: uploadError } =
      await supabase.storage
        .from("media")
        .upload(storagePath, file, {
          contentType: file.type,
          upsert: false,
        });

    if (uploadError) {
      console.error(
        "Supabase media upload error:",
        uploadError,
      );

      return NextResponse.json(
        { error: "Failed to upload media." },
        { status: 500 },
      );
    }

    // --------------------------------------------------
    // PUBLIC URL
    // --------------------------------------------------

    const {
      data: { publicUrl },
    } = supabase.storage
      .from("media")
      .getPublicUrl(storagePath);

    // --------------------------------------------------
    // SAVE MEDIA RECORD
    // --------------------------------------------------

    const {
      data: media,
      error: mediaError,
    } = await supabase
      .from("media")
      .insert({
        file_name: originalFileName,
        file_size: file.size,
        mime_type: file.type,
        storage_path: storagePath,
        public_url: publicUrl,
        alt_text: altText || null,
        uploaded_by: userId,
      })
      .select(`
        id,
        file_name,
        file_size,
        mime_type,
        storage_path,
        public_url,
        alt_text,
        created_at
      `)
      .single();

    if (mediaError) {
      console.error(
        "Supabase media database error:",
        mediaError,
      );

      // Remove the uploaded file if the database
      // record could not be created.
      const { error: cleanupError } =
        await supabase.storage
          .from("media")
          .remove([storagePath]);

      if (cleanupError) {
        console.error(
          "Media upload cleanup error:",
          cleanupError,
        );
      }

      return NextResponse.json(
        { error: "Failed to save media information." },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        media,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error(
      "Upload media API error:",
      error,
    );

    return NextResponse.json(
      { error: "Failed to upload media." },
      { status: 500 },
    );
  }
}