import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const MAX_BODY_SIZE = 16 * 1024;
const MAX_REPLY_LENGTH = 5000;

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

    // --------------------------------------------------
    // AUTHENTICATION
    // --------------------------------------------------

    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "You must be logged in." },
        { status: 401 },
      );
    }

    // --------------------------------------------------
    // ADMIN AUTHORIZATION
    // --------------------------------------------------

    const { data: profile, error: profileError } =
      await supabase
        .from("profiles")
        .select("role, is_active")
        .eq("id", user.id)
        .single();

    if (
      profileError ||
      !profile ||
      profile.role !== "admin" ||
      profile.is_active !== true
    ) {
      return NextResponse.json(
        { error: "You are not authorized to send replies." },
        { status: 403 },
      );
    }

    // --------------------------------------------------
    // REQUEST BODY
    // --------------------------------------------------

    const body = await request.json();

    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body)
    ) {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 },
      );
    }

    const messageId =
      typeof body.messageId === "string"
        ? body.messageId.trim()
        : "";

    const reply =
      typeof body.reply === "string"
        ? body.reply.trim()
        : "";

    // --------------------------------------------------
    // VALIDATION
    // --------------------------------------------------

    if (!messageId || !reply) {
      return NextResponse.json(
        {
          error:
            "Message ID and reply are required.",
        },
        { status: 400 },
      );
    }

    if (!UUID_REGEX.test(messageId)) {
      return NextResponse.json(
        { error: "Invalid message ID." },
        { status: 400 },
      );
    }

    if (reply.length > MAX_REPLY_LENGTH) {
      return NextResponse.json(
        {
          error: `Reply must be ${MAX_REPLY_LENGTH} characters or fewer.`,
        },
        { status: 400 },
      );
    }

    // --------------------------------------------------
    // VERIFY ORIGINAL MESSAGE
    // --------------------------------------------------

    const {
      data: originalMessage,
      error: messageError,
    } = await supabase
      .from("messages")
      .select("id")
      .eq("id", messageId)
      .maybeSingle();

    if (messageError) {
      console.error(
        "Original message lookup error:",
        messageError,
      );

      return NextResponse.json(
        { error: "Failed to verify the customer message." },
        { status: 500 },
      );
    }

    if (!originalMessage) {
      return NextResponse.json(
        { error: "Customer message not found." },
        { status: 404 },
      );
    }

    // --------------------------------------------------
    // SAVE ADMIN REPLY
    // --------------------------------------------------

    const { error: replyError } =
      await supabase
        .from("message_replies")
        .insert({
          message_id: messageId,
          sender_type: "admin",
          sender_id: user.id,
          message: reply,
        });

    if (replyError) {
      console.error(
        "Reply insert error:",
        replyError,
      );

      return NextResponse.json(
        { error: "Failed to save the reply." },
        { status: 500 },
      );
    }

    // --------------------------------------------------
    // MARK ORIGINAL MESSAGE AS REPLIED
    // --------------------------------------------------

    const { error: statusError } =
      await supabase
        .from("messages")
        .update({
          status: "replied",
          updated_at: new Date().toISOString(),
        })
        .eq("id", messageId);

    if (statusError) {
      console.error(
        "Status update error:",
        statusError,
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Reply was saved, but the message status could not be updated.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Reply saved successfully.",
    });
  } catch (error) {
    console.error(
      "Reply API error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Something went wrong while saving the reply.",
      },
      { status: 500 },
    );
  }
}