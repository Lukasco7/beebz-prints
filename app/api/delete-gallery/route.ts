import { connection } from "next/server";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const MAX_REQUEST_SIZE = 2 * 1024;

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  await connection();

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

    const { data: claimsData, error: claimsError } =
      await supabase.auth.getClaims();

    if (claimsError || !claimsData?.claims?.sub) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 },
      );
    }

    const userId = claimsData.claims.sub;

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

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 },
      );
    }

    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body)
    ) {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 },
      );
    }

    const rawId = (body as { id?: unknown }).id;

    const id =
      typeof rawId === "string"
        ? rawId.trim()
        : "";

    if (!id) {
      return NextResponse.json(
        { error: "Gallery item ID is required." },
        { status: 400 },
      );
    }

    if (!UUID_REGEX.test(id)) {
      return NextResponse.json(
        { error: "Invalid gallery item ID." },
        { status: 400 },
      );
    }

    // Load the gallery record first.
    // The stored image URL is trusted instead of a client-supplied URL.
    const { data: galleryItem, error: galleryError } =
      await supabase
        .from("gallery")
        .select("id, image_url")
        .eq("id", id)
        .maybeSingle();

    if (galleryError) {
      console.error(
        "Delete gallery lookup error:",
        galleryError,
      );

      return NextResponse.json(
        { error: "Unable to load gallery item." },
        { status: 500 },
      );
    }

    if (!galleryItem) {
      return NextResponse.json(
        { error: "Gallery item not found." },
        { status: 404 },
      );
    }

    // Delete the database record first.
    const { error: deleteError } = await supabase
      .from("gallery")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error(
        "Delete gallery database error:",
        deleteError,
      );

      return NextResponse.json(
        { error: "Unable to delete gallery item." },
        { status: 500 },
      );
    }

    // Remove the associated image from the gallery bucket.
    if (galleryItem.image_url) {
      try {
        const marker =
          "/storage/v1/object/public/gallery/";

        const markerIndex =
          galleryItem.image_url.indexOf(marker);

        if (markerIndex !== -1) {
          const filePath = decodeURIComponent(
            galleryItem.image_url
              .substring(markerIndex + marker.length)
              .trim(),
          );

          if (filePath) {
            const { error: storageError } =
              await supabase.storage
                .from("gallery")
                .remove([filePath]);

            if (storageError) {
              console.error(
                "Gallery image cleanup failed:",
                storageError,
              );
            }
          }
        }
      } catch (storageError) {
        console.error(
          "Gallery image cleanup failed:",
          storageError,
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: "Gallery item deleted successfully.",
    });
  } catch (error) {
    console.error("Delete gallery error:", error);

    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 },
    );
  }
}