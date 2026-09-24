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
    // PAGE ID
    // --------------------------------------------------

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id")?.trim() || "";

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
    // GET PAGE
    // --------------------------------------------------

    const { data: page, error: pageError } =
      await supabase
        .from("pages")
        .select(`
          id,
          title,
          slug,
          content,
          featured_image,
          seo_title,
          seo_description,
          is_published
        `)
        .eq("id", id)
        .single();

    if (pageError || !page) {
      console.error("Get page error:", pageError);

      return NextResponse.json(
        { error: "Page not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      page,
    });
  } catch (error) {
    console.error("Get page API error:", error);

    return NextResponse.json(
      { error: "Failed to load page." },
      { status: 500 },
    );
  }
}