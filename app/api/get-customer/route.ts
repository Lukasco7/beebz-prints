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
    // CUSTOMER ID
    // --------------------------------------------------

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id")?.trim() || "";

    if (!id) {
      return NextResponse.json(
        { error: "Customer ID is required." },
        { status: 400 },
      );
    }

    if (!UUID_REGEX.test(id)) {
      return NextResponse.json(
        { error: "Invalid customer ID." },
        { status: 400 },
      );
    }

    // --------------------------------------------------
    // GET CUSTOMER
    // --------------------------------------------------

    const {
      data: customer,
      error: customerError,
    } = await supabase
      .from("customers")
      .select(`
        id,
        full_name,
        email,
        phone,
        whatsapp,
        company_name
      `)
      .eq("id", id)
      .maybeSingle();

    if (customerError) {
      console.error(
        "Get customer database error:",
        customerError,
      );

      return NextResponse.json(
        { error: "Failed to load customer." },
        { status: 500 },
      );
    }

    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      customer,
    });
  } catch (error) {
    console.error(
      "Get customer API error:",
      error,
    );

    return NextResponse.json(
      { error: "Failed to load customer." },
      { status: 500 },
    );
  }
}