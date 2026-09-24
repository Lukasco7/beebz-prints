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
    // REQUEST BODY
    // --------------------------------------------------

    const body = await request.json();

    if (!body || typeof body !== "object" || Array.isArray(body)) {
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
        { error: "Customer ID is required." },
        { status: 400 },
      );
    }

    // --------------------------------------------------
    // UUID VALIDATION
    // --------------------------------------------------

    if (!UUID_REGEX.test(id)) {
      return NextResponse.json(
        { error: "Invalid customer ID." },
        { status: 400 },
      );
    }

    // --------------------------------------------------
    // MAKE SURE CUSTOMER EXISTS
    // --------------------------------------------------

    const { data: customer, error: customerError } =
      await supabase
        .from("customers")
        .select("id, full_name")
        .eq("id", id)
        .single();

    if (customerError || !customer) {
      return NextResponse.json(
        { error: "Customer not found." },
        { status: 404 },
      );
    }

    // --------------------------------------------------
    // CHECK QUOTE HISTORY
    // --------------------------------------------------

    const { count, error: quotesError } =
      await supabase
        .from("quotes")
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq("customer_id", id);

    if (quotesError) {
      console.error(
        "Check customer quotes error:",
        quotesError,
      );

      return NextResponse.json(
        {
          error:
            "Unable to check the customer's quote history.",
        },
        { status: 500 },
      );
    }

    if ((count ?? 0) > 0) {
      return NextResponse.json(
        {
          error:
            "This customer cannot be deleted because they have existing quote requests. Remove or archive their quote history first.",
        },
        { status: 409 },
      );
    }

    // --------------------------------------------------
    // DELETE CUSTOMER
    // --------------------------------------------------

    const { error: deleteError } =
      await supabase
        .from("customers")
        .delete()
        .eq("id", id);

    if (deleteError) {
      console.error(
        "Supabase delete customer error:",
        deleteError,
      );

      return NextResponse.json(
        { error: "Failed to delete customer." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Customer deleted successfully.",
    });
  } catch (error) {
    console.error("Delete customer API error:", error);

    return NextResponse.json(
      { error: "Failed to delete customer." },
      { status: 500 },
    );
  }
}