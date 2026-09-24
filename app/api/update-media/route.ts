import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const MAX_BODY_SIZE = 16 * 1024;
const MAX_ALT_TEXT_LENGTH = 300;

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

    const altText =
      typeof body.alt_text === "string"
        ? body.alt_text.trim()
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

    if (altText.length > MAX_ALT_TEXT_LENGTH) {
      return NextResponse.json(
        {
          error: `Alt text must be ${MAX_ALT_TEXT_LENGTH} characters or fewer.`,
        },
        { status: 400 },
      );
    }

    // --------------------------------------------------
    // VERIFY MEDIA EXISTS
    // --------------------------------------------------

    const {
      data: existingMedia,
      error: existingError,
    } = await supabase
      .from("media")
      .select("id")
      .eq("id", id)
      .maybeSingle();

    if (existingError) {
      console.error(
        "Media lookup error:",
        existingError,
      );

      return NextResponse.json(
        { error: "Failed to verify the media item." },
        { status: 500 },
      );
    }

    if (!existingMedia) {
      return NextResponse.json(
        { error: "Media item not found." },
        { status: 404 },
      );
    }

    // --------------------------------------------------
    // UPDATE MEDIA
    // --------------------------------------------------

    const { error: updateError } =
      await supabase
        .from("media")
        .update({
          alt_text: altText || null,
        })
        .eq("id", id);

    if (updateError) {
      console.error(
        "Supabase update media error:",
        updateError,
      );

      return NextResponse.json(
        { error: "Failed to update media." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Update media error:", error);

    return NextResponse.json(
      { error: "Failed to update media." },
      { status: 500 },
    );
  }
}