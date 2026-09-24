import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const MAX_BODY_SIZE = 16 * 1024;

const MAX_NAME_LENGTH = 100;
const MAX_PHONE_LENGTH = 30;
const MAX_EMAIL_LENGTH = 254;
const MAX_QUANTITY_LENGTH = 50;
const MAX_QUESTION_LENGTH = 2000;

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const EMAIL_REGEX =
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidUuid(value: string) {
  return UUID_REGEX.test(value);
}

function isValidEmail(value: string) {
  return EMAIL_REGEX.test(value);
}

export async function POST(request: Request) {
  try {
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

    const body = await request.json();

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 },
      );
    }

    const productId =
      typeof body.productId === "string" ? body.productId.trim() : "";

    const name =
      typeof body.name === "string" ? body.name.trim() : "";

    const phone =
      typeof body.phone === "string" ? body.phone.trim() : "";

    const email =
      typeof body.email === "string" ? body.email.trim() : "";

    const quantity =
      typeof body.quantity === "string" ? body.quantity.trim() : "";

    const question =
      typeof body.question === "string" ? body.question.trim() : "";

    // Required fields
    if (!productId || !name || !phone || !question) {
      return NextResponse.json(
        {
          error:
            "Please provide your name, phone number, product, and question.",
        },
        { status: 400 },
      );
    }

    // Validate product ID
    if (!isValidUuid(productId)) {
      return NextResponse.json(
        { error: "Invalid product." },
        { status: 400 },
      );
    }

    // Server-side length validation
    if (name.length > MAX_NAME_LENGTH) {
      return NextResponse.json(
        { error: `Name must be ${MAX_NAME_LENGTH} characters or fewer.` },
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

    if (email.length > MAX_EMAIL_LENGTH) {
      return NextResponse.json(
        {
          error: `Email must be ${MAX_EMAIL_LENGTH} characters or fewer.`,
        },
        { status: 400 },
      );
    }

    if (quantity.length > MAX_QUANTITY_LENGTH) {
      return NextResponse.json(
        {
          error: `Quantity must be ${MAX_QUANTITY_LENGTH} characters or fewer.`,
        },
        { status: 400 },
      );
    }

    if (question.length > MAX_QUESTION_LENGTH) {
      return NextResponse.json(
        {
          error: `Question must be ${MAX_QUESTION_LENGTH} characters or fewer.`,
        },
        { status: 400 },
      );
    }

    // Validate email only when supplied
    if (email && !isValidEmail(email)) {
      return NextResponse.json(
        { error: "Please provide a valid email address." },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    // Verify that the product exists and is published.
    // The product name comes from the database, not the browser.
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("id, name")
      .eq("id", productId)
      .eq("is_published", true)
      .maybeSingle();

    if (productError) {
      console.error("Product lookup error:", productError);

      return NextResponse.json(
        { error: "Unable to verify the selected product." },
        { status: 500 },
      );
    }

    if (!product) {
      return NextResponse.json(
        { error: "The selected product could not be found." },
        { status: 404 },
      );
    }

    // Use the customer's complete question/message.
    let message = question;

    if (quantity) {
      message += `\n\nRequested Quantity: ${quantity}`;
    }

    // Save inquiry
    const { error: insertError } = await supabase
      .from("messages")
      .insert({
        name,
        email: email || null,
        phone,
        subject: `Product Inquiry: ${product.name}`,
        message,
        product_id: product.id,
        status: "unread",
      });

    if (insertError) {
      console.error("Product inquiry insert error:", insertError);

      return NextResponse.json(
        { error: "Unable to send your inquiry. Please try again." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Your inquiry has been sent successfully.",
    });
  } catch (error) {
    console.error("Product inquiry API error:", error);

    return NextResponse.json(
      { error: "Something went wrong while sending your inquiry." },
      { status: 500 },
    );
  }
}