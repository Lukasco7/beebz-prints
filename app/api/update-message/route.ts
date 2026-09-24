import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const MAX_BODY_SIZE = 4 * 1024;

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const allowedStatuses = [
  "unread",
  "read",
  "replied",
] as const;

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

    const id =
      typeof body.id === "string"
        ? body.id.trim()
        : "";

    const status =
      typeof body.status === "string"
        ? body.status.trim()
        : "";

    // --------------------------------------------------
    // MESSAGE ID VALIDATION
    // --------------------------------------------------

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
    // STATUS VALIDATION
    // --------------------------------------------------

    if (
      !allowedStatuses.includes(
        status as (typeof allowedStatuses)[number],
      )
    ) {
      return NextResponse.json(
        { error: "Invalid message status." },
        { status: 400 },
      );
    }

    // --------------------------------------------------
    // VERIFY MESSAGE
    // --------------------------------------------------

    const {
      data: existingMessage,
      error: messageError,
    } = await supabase
      .from("messages")
      .select("id")
      .eq("id", id)
      .maybeSingle();

    if (messageError) {
      console.error(
        "Message lookup error:",
        messageError,
      );

      return NextResponse.json(
        { error: "Failed to verify the message." },
        { status: 500 },
      );
    }

    if (!existingMessage) {
      return NextResponse.json(
        { error: "Message not found." },
        { status: 404 },
      );
    }

    // --------------------------------------------------
    // UPDATE MESSAGE
    // --------------------------------------------------

    const {
      data: updatedMessage,
      error: updateError,
    } = await supabase
      .from("messages")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
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
      .single();

    if (updateError) {
      console.error(
        "Supabase update message error:",
        updateError,
      );

      return NextResponse.json(
        { error: "Failed to update message." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: updatedMessage,
    });
  } catch (error) {
    console.error(
      "Update message API error:",
      error,
    );

    return NextResponse.json(
      { error: "Failed to update message." },
      { status: 500 },
    );
  }
}