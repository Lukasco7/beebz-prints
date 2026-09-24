import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const MAX_BODY_SIZE = 16 * 1024;

const MAX_FULL_NAME_LENGTH = 100;
const MAX_EMAIL_LENGTH = 254;
const MAX_PHONE_LENGTH = 30;
const MAX_WHATSAPP_LENGTH = 30;
const MAX_COMPANY_NAME_LENGTH = 150;

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

    const fullName =
      typeof body.full_name === "string"
        ? body.full_name.trim()
        : "";

    const email =
      typeof body.email === "string"
        ? body.email.trim()
        : "";

    const phone =
      typeof body.phone === "string"
        ? body.phone.trim()
        : "";

    const whatsapp =
      typeof body.whatsapp === "string"
        ? body.whatsapp.trim()
        : "";

    const companyName =
      typeof body.company_name === "string"
        ? body.company_name.trim()
        : "";

    // --------------------------------------------------
    // REQUIRED FIELDS
    // --------------------------------------------------

    if (!id) {
      return NextResponse.json(
        { error: "Customer ID is required." },
        { status: 400 },
      );
    }

    if (!fullName) {
      return NextResponse.json(
        { error: "Full name is required." },
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
    // LENGTH VALIDATION
    // --------------------------------------------------

    if (fullName.length > MAX_FULL_NAME_LENGTH) {
      return NextResponse.json(
        {
          error: `Full name must be ${MAX_FULL_NAME_LENGTH} characters or fewer.`,
        },
        { status: 400 },
      );
    }

    if (email.length > MAX_EMAIL_LENGTH) {
      return NextResponse.json(
        {
          error: `Email must be ${MAX_EMAIL_LENGTH} characters or fewer.`,
        },
        { status: 400 },
      );
    }

    if (phone.length > MAX_PHONE_LENGTH) {
      return NextResponse.json(
        {
          error: `Phone number must be ${MAX_PHONE_LENGTH} characters or fewer.`,
        },
        { status: 400 },
      );
    }

    if (whatsapp.length > MAX_WHATSAPP_LENGTH) {
      return NextResponse.json(
        {
          error: `WhatsApp number must be ${MAX_WHATSAPP_LENGTH} characters or fewer.`,
        },
        { status: 400 },
      );
    }

    if (companyName.length > MAX_COMPANY_NAME_LENGTH) {
      return NextResponse.json(
        {
          error: `Company name must be ${MAX_COMPANY_NAME_LENGTH} characters or fewer.`,
        },
        { status: 400 },
      );
    }

    // --------------------------------------------------
    // EMAIL VALIDATION
    // --------------------------------------------------

    if (email && !EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { error: "Please provide a valid email address." },
        { status: 400 },
      );
    }

    // --------------------------------------------------
    // VERIFY CUSTOMER EXISTS
    // --------------------------------------------------

    const { data: existingCustomer, error: customerError } =
      await supabase
        .from("customers")
        .select("id")
        .eq("id", id)
        .single();

    if (customerError || !existingCustomer) {
      return NextResponse.json(
        { error: "Customer not found." },
        { status: 404 },
      );
    }

    // --------------------------------------------------
    // UPDATE CUSTOMER
    // --------------------------------------------------

    const { data: updatedCustomer, error: updateError } =
      await supabase
        .from("customers")
        .update({
          full_name: fullName,
          email: email || null,
          phone: phone || null,
          whatsapp: whatsapp || null,
          company_name: companyName || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select(`
          id,
          full_name,
          email,
          phone,
          whatsapp,
          company_name
        `)
        .single();

    if (updateError) {
      console.error(
        "Supabase update customer error:",
        updateError,
      );

      return NextResponse.json(
        { error: "Failed to update customer." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      customer: updatedCustomer,
    });
  } catch (error) {
    console.error("Update customer API error:", error);

    return NextResponse.json(
      { error: "Failed to update customer." },
      { status: 500 },
    );
  }
}