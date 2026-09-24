import { connection } from "next/server";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
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
    // GET SITE SETTINGS
    // --------------------------------------------------

    const {
      data: settings,
      error: settingsError,
    } = await supabase
      .from("site_settings")
      .select(`
        id,
        business_name,
        logo_url,
        favicon_url,
        tagline,
        phone,
        whatsapp,
        email,
        address,
        opening_hours,
        instagram_url,
        facebook_url,
        tiktok_url,
        map_url,
        default_seo_title,
        default_seo_description
      `)
      .limit(1)
      .maybeSingle();

    if (settingsError) {
      console.error(
        "Get site settings database error:",
        settingsError,
      );

      return NextResponse.json(
        { error: "Failed to load site settings." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      settings: settings || null,
    });
  } catch (error) {
    console.error(
      "Get settings API error:",
      error,
    );

    return NextResponse.json(
      { error: "Failed to load site settings." },
      { status: 500 },
    );
  }
}