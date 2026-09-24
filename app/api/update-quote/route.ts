import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const MAX_BODY_SIZE = 16 * 1024;
const MAX_ADMIN_NOTES_LENGTH = 5000;

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const allowedStatuses = [
  "pending",
  "reviewing",
  "quoted",
  "approved",
  "rejected",
  "completed",
] as const;

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

    const id = String(body.id ?? "").trim();
    const status = String(body.status ?? "").trim();
    const adminNotes = String(body.admin_notes ?? "").trim();

    // --------------------------------------------------
    // VALIDATE QUOTE ID
    // --------------------------------------------------

    if (!id) {
      return NextResponse.json(
        { error: "Quote ID is required." },
        { status: 400 },
      );
    }

    if (!UUID_REGEX.test(id)) {
      return NextResponse.json(
        { error: "Invalid quote ID." },
        { status: 400 },
      );
    }

    // --------------------------------------------------
    // VALIDATE STATUS
    // --------------------------------------------------

    if (
      !allowedStatuses.includes(
        status as (typeof allowedStatuses)[number],
      )
    ) {
      return NextResponse.json(
        { error: "Invalid quote status." },
        { status: 400 },
      );
    }

    // --------------------------------------------------
    // VALIDATE ADMIN NOTES
    // --------------------------------------------------

    if (adminNotes.length > MAX_ADMIN_NOTES_LENGTH) {
      return NextResponse.json(
        {
          error: `Admin notes must be ${MAX_ADMIN_NOTES_LENGTH} characters or fewer.`,
        },
        { status: 400 },
      );
    }

    // --------------------------------------------------
    // VERIFY QUOTE EXISTS
    // --------------------------------------------------

    const {
      data: existingQuote,
      error: quoteError,
    } = await supabase
      .from("quotes")
      .select("id")
      .eq("id", id)
      .maybeSingle();

    if (quoteError) {
      console.error(
        "Get quote before update error:",
        quoteError,
      );

      return NextResponse.json(
        { error: "Failed to load quote." },
        { status: 500 },
      );
    }

    if (!existingQuote) {
      return NextResponse.json(
        { error: "Quote not found." },
        { status: 404 },
      );
    }

    // --------------------------------------------------
    // UPDATE QUOTE
    // --------------------------------------------------

    const {
      data: updatedQuote,
      error: updateError,
    } = await supabase
      .from("quotes")
      .update({
        status,
        admin_notes: adminNotes || null,
      })
      .eq("id", id)
      .select("id, status, admin_notes")
      .maybeSingle();

    if (updateError) {
      console.error(
        "Supabase update quote error:",
        updateError,
      );

      return NextResponse.json(
        { error: "Failed to update quote." },
        { status: 500 },
      );
    }

    if (!updatedQuote) {
      return NextResponse.json(
        { error: "Quote could not be updated." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      quote: updatedQuote,
    });
  } catch (error) {
    console.error(
      "Update quote API error:",
      error,
    );

    return NextResponse.json(
      { error: "Failed to update quote." },
      { status: 500 },
    );
  }
}