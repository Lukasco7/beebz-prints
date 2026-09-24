import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const MAX_BODY_SIZE = 2 * 1024;

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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
        contentLengthNumber > MAX_BODY_SIZE
      ) {
        return NextResponse.json(
          { error: "Request is too large." },
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
    // REQUEST BODY
    // --------------------------------------------------

    const body = await request.json();

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

    const id =
      typeof body.id === "string"
        ? body.id.trim()
        : "";

    if (!id) {
      return NextResponse.json(
        { error: "Media ID is required." },
        { status: 400 },
      );
    }

    if (!UUID_REGEX.test(id)) {
      return NextResponse.json(
        { error: "Invalid media ID." },
        { status: 400 },
      );
    }

    // --------------------------------------------------
    // VERIFY MEDIA
    // --------------------------------------------------

    const {
      data: media,
      error: mediaError,
    } = await supabase
      .from("media")
      .select("id, storage_path")
      .eq("id", id)
      .maybeSingle();

    if (mediaError) {
      console.error(
        "Media lookup error:",
        mediaError,
      );

      return NextResponse.json(
        { error: "Failed to verify the media item." },
        { status: 500 },
      );
    }

    if (!media) {
      return NextResponse.json(
        { error: "Media item not found." },
        { status: 404 },
      );
    }

    const pathToDelete = media.storage_path;

    // --------------------------------------------------
    // DELETE DATABASE RECORD
    // --------------------------------------------------

    const { error: deleteError } =
      await supabase
        .from("media")
        .delete()
        .eq("id", id);

    if (deleteError) {
      console.error(
        "Delete media database error:",
        deleteError,
      );

      return NextResponse.json(
        { error: "Failed to delete media." },
        { status: 500 },
      );
    }

    // --------------------------------------------------
    // DELETE STORAGE FILE
    // --------------------------------------------------

    if (pathToDelete) {
      const { error: storageError } =
        await supabase.storage
          .from("media")
          .remove([pathToDelete]);

      if (storageError) {
        console.error(
          "Media storage cleanup error:",
          storageError,
        );

        // The database record has already been deleted.
        // Do not expose storage details to the client.
      }
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Delete media error:", error);

    return NextResponse.json(
      { error: "Failed to delete media." },
      { status: 500 },
    );
  }
}