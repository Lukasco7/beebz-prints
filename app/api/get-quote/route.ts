import { connection } from "next/server";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(request: Request) {
  await connection();

  try {
    const supabase = await createClient();

    // --------------------------------------------------
    // AUTHENTICATION
    // --------------------------------------------------

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
    // QUOTE ID
    // --------------------------------------------------

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id")?.trim() || "";

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
    // GET QUOTE
    // --------------------------------------------------

    const {
      data: quote,
      error: quoteError,
    } = await supabase
      .from("quotes")
      .select(`
        id,
        status,
        admin_notes
      `)
      .eq("id", id)
      .maybeSingle();

    if (quoteError) {
      console.error(
        "Get quote database error:",
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

    return NextResponse.json({
      quote,
    });
  } catch (error) {
    console.error(
      "Get quote API error:",
      error,
    );

    return NextResponse.json(
      { error: "Failed to load quote." },
      { status: 500 },
    );
  }
}