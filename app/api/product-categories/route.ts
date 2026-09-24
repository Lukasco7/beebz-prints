import { connection } from "next/server";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  await connection();

  try {
    const supabase = await createClient();

    // Verify authentication using server-verified claims.
    const { data: claimsData, error: claimsError } =
      await supabase.auth.getClaims();

    if (claimsError || !claimsData?.claims?.sub) {
      return NextResponse.json(
        { message: "Unauthorized." },
        { status: 401 },
      );
    }

    const userId = claimsData.claims.sub;

    // Verify that the authenticated user is an active admin.
    const { data: profile, error: profileError } =
      await supabase
        .from("profiles")
        .select("role, is_active")
        .eq("id", userId)
        .maybeSingle();

    if (
      profileError ||
      !profile ||
      profile.role !== "admin" ||
      profile.is_active !== true
    ) {
      return NextResponse.json(
        { message: "Forbidden." },
        { status: 403 },
      );
    }

    const { data: categories, error } = await supabase
      .from("product_categories")
      .select("id, name")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });

    if (error) {
      console.error(
        "Get product categories error:",
        error,
      );

      return NextResponse.json(
        { message: "Unable to load categories." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      categories: categories ?? [],
    });
  } catch (error) {
    console.error(
      "Product categories request error:",
      error,
    );

    return NextResponse.json(
      { message: "Something went wrong." },
      { status: 500 },
    );
  }
}