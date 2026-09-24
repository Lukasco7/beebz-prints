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
      const size = Number(contentLength);

      if (!Number.isFinite(size) || size > MAX_BODY_SIZE) {
        return NextResponse.json(
          { error: "Request body is too large." },
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

    const claims = claimsData?.claims;

    if (claimsError || !claims?.sub) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 },
      );
    }

    // --------------------------------------------------
    // ADMIN AUTHORIZATION
    // --------------------------------------------------

    const { data: profile, error: profileError } =
      await supabase
        .from("profiles")
        .select("role, is_active")
        .eq("id", claims.sub)
        .maybeSingle();

    if (
      profileError ||
      !profile ||
      profile.role !== "admin" ||
      profile.is_active !== true
    ) {
      return NextResponse.json(
        { error: "Admin access required." },
        { status: 403 },
      );
    }

    // --------------------------------------------------
    // READ REQUEST BODY
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

    const quoteId =
      typeof body.quoteId === "string"
        ? body.quoteId.trim()
        : "";

    // --------------------------------------------------
    // VALIDATE QUOTE ID
    // --------------------------------------------------

    if (!quoteId) {
      return NextResponse.json(
        { error: "Quote ID is required." },
        { status: 400 },
      );
    }

    if (!UUID_REGEX.test(quoteId)) {
      return NextResponse.json(
        { error: "Invalid quote ID." },
        { status: 400 },
      );
    }

    // --------------------------------------------------
    // VERIFY QUOTE EXISTS
    // --------------------------------------------------

    const {
      data: quote,
      error: quoteError,
    } = await supabase
      .from("quotes")
      .select("id")
      .eq("id", quoteId)
      .maybeSingle();

    if (quoteError) {
      console.error(
        "Quote lookup error:",
        quoteError,
      );

      return NextResponse.json(
        { error: "Failed to load quote." },
        { status: 500 },
      );
    }

    if (!quote) {
      return NextResponse.json(
        { error: "Quote not found." },
        { status: 404 },
      );
    }

    // --------------------------------------------------
    // DELETE QUOTE
    // --------------------------------------------------

    const { error: deleteError } =
      await supabase
        .from("quotes")
        .delete()
        .eq("id", quoteId);

    if (deleteError) {
      console.error(
        "Quote deletion error:",
        deleteError,
      );

      return NextResponse.json(
        { error: "Failed to delete quote." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Quote deleted successfully.",
    });
  } catch (error) {
    console.error(
      "Delete quote error:",
      error,
    );

    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 },
    );
  }
}