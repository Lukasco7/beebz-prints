import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const MAX_BODY_SIZE = 1024;

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
        { error: "Page ID is required." },
        { status: 400 },
      );
    }

    if (!UUID_REGEX.test(id)) {
      return NextResponse.json(
        { error: "Invalid page ID." },
        { status: 400 },
      );
    }

    // --------------------------------------------------
    // VERIFY PAGE EXISTS
    // --------------------------------------------------

    const { data: page, error: pageError } =
      await supabase
        .from("pages")
        .select("id, title")
        .eq("id", id)
        .maybeSingle();

    if (pageError) {
      console.error(
        "Page lookup error:",
        pageError,
      );

      return NextResponse.json(
        { error: "Failed to verify the page." },
        { status: 500 },
      );
    }

    if (!page) {
      return NextResponse.json(
        { error: "Page not found." },
        { status: 404 },
      );
    }

    // --------------------------------------------------
    // DELETE PAGE
    // --------------------------------------------------

    const { error: deleteError } =
      await supabase
        .from("pages")
        .delete()
        .eq("id", id);

    if (deleteError) {
      console.error(
        "Supabase delete page error:",
        deleteError,
      );

      return NextResponse.json(
        { error: "Failed to delete page." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: `"${page.title}" was deleted successfully.`,
    });
  } catch (error) {
    console.error(
      "Delete page API error:",
      error,
    );

    return NextResponse.json(
      { error: "Failed to delete page." },
      { status: 500 },
    );
  }
}