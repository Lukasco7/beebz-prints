import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const MAX_BODY_SIZE = 16 * 1024;

const MAX_NAME_LENGTH = 100;
const MAX_EMAIL_LENGTH = 254;
const MAX_PHONE_LENGTH = 30;
const MAX_SUBJECT_LENGTH = 200;
const MAX_MESSAGE_LENGTH = 3000;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidEmail(value: string) {
  return EMAIL_REGEX.test(value);
}

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
          {
            success: false,
            message: "Request is too large.",
          },
          { status: 413 },
        );
      }
    }

    // --------------------------------------------------
    // READ FORM DATA
    // --------------------------------------------------

    const formData = await request.formData();

    const name = String(formData.get("name") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const phone = String(formData.get("phone") || "").trim();
    const subject = String(formData.get("subject") || "").trim();
    const message = String(formData.get("message") || "").trim();

    // --------------------------------------------------
    // REQUIRED FIELDS
    // --------------------------------------------------

    if (!name || !email || !message) {
      return NextResponse.json(
        {
          success: false,
          message: "Please provide your name, email and message.",
        },
        { status: 400 },
      );
    }

    // --------------------------------------------------
    // LENGTH VALIDATION
    // --------------------------------------------------

    if (name.length > MAX_NAME_LENGTH) {
      return NextResponse.json(
        {
          success: false,
          message: `Name must be ${MAX_NAME_LENGTH} characters or fewer.`,
        },
        { status: 400 },
      );
    }

    if (email.length > MAX_EMAIL_LENGTH) {
      return NextResponse.json(
        {
          success: false,
          message: `Email must be ${MAX_EMAIL_LENGTH} characters or fewer.`,
        },
        { status: 400 },
      );
    }

    if (phone.length > MAX_PHONE_LENGTH) {
      return NextResponse.json(
        {
          success: false,
          message: `Phone number must be ${MAX_PHONE_LENGTH} characters or fewer.`,
        },
        { status: 400 },
      );
    }

    if (subject.length > MAX_SUBJECT_LENGTH) {
      return NextResponse.json(
        {
          success: false,
          message: `Subject must be ${MAX_SUBJECT_LENGTH} characters or fewer.`,
        },
        { status: 400 },
      );
    }

    if (message.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json(
        {
          success: false,
          message: `Message must be ${MAX_MESSAGE_LENGTH} characters or fewer.`,
        },
        { status: 400 },
      );
    }

    // --------------------------------------------------
    // EMAIL VALIDATION
    // --------------------------------------------------

    if (!isValidEmail(email)) {
      return NextResponse.json(
        {
          success: false,
          message: "Please provide a valid email address.",
        },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    // --------------------------------------------------
    // SAVE MESSAGE
    // --------------------------------------------------

    const { error } = await supabase.from("messages").insert({
      name,
      email,
      phone: phone || null,
      subject: subject || null,
      message,
      status: "unread",
    });

    if (error) {
      console.error("Message insert error:", error);

      return NextResponse.json(
        {
          success: false,
          message: "Unable to send your message. Please try again.",
        },
        { status: 500 },
      );
    }

    // --------------------------------------------------
    // SUCCESS
    // --------------------------------------------------

    return NextResponse.redirect(
      new URL("/?message=success#contact", request.url),
    );
  } catch (error) {
    console.error("Submit message error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong. Please try again.",
      },
      { status: 500 },
    );
  }
}