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
    // MESSAGE ID
    // --------------------------------------------------

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id")?.trim() || "";

    if (!id) {
      return NextResponse.json(
        { error: "Message ID is required." },
        { status: 400 },
      );
    }

    if (!UUID_REGEX.test(id)) {
      return NextResponse.json(
        { error: "Invalid message ID." },
        { status: 400 },
      );
    }

    // --------------------------------------------------
    // GET MESSAGE
    // --------------------------------------------------

    const {
      data: message,
      error: messageError,
    } = await supabase
      .from("messages")
      .select(`
        id,
        name,
        email,
        phone,
        subject,
        message,
        status,
        created_at,
        updated_at
      `)
      .eq("id", id)
      .maybeSingle();

    if (messageError) {
      console.error(
        "Get message database error:",
        messageError,
      );

      return NextResponse.json(
        { error: "Failed to load message." },
        { status: 500 },
      );
    }

    if (!message) {
      return NextResponse.json(
        { error: "Message not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      message,
    });
  } catch (error) {
    console.error("Get message API error:", error);

    return NextResponse.json(
      { error: "Failed to load message." },
      { status: 500 },
    );
  }
}