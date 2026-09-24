import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const MAX_BODY_SIZE = 16 * 1024;

const MAX_FULL_NAME_LENGTH = 100;
const MAX_EMAIL_LENGTH = 254;
const MAX_PHONE_LENGTH = 30;
const MAX_WHATSAPP_LENGTH = 30;
const MAX_COMPANY_NAME_LENGTH = 150;

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
    // REQUIRED FIELD
    // --------------------------------------------------

    if (!fullName) {
      return NextResponse.json(
        { error: "Full name is required." },
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
    // CREATE CUSTOMER
    // --------------------------------------------------

    const { data: customer, error: customerError } =
      await supabase
        .from("customers")
        .insert({
          full_name: fullName,
          email: email || null,
          phone: phone || null,
          whatsapp: whatsapp || null,
          company_name: companyName || null,
        })
        .select(`
          id,
          full_name,
          email,
          phone,
          whatsapp,
          company_name,
          created_at
        `)
        .single();

    if (customerError) {
      console.error(
        "Supabase create customer error:",
        customerError,
      );

      return NextResponse.json(
        { error: "Failed to create customer." },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        customer,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Create customer API error:", error);

    return NextResponse.json(
      { error: "Failed to create customer." },
      { status: 500 },
    );
  }
}