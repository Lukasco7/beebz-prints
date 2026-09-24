import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const MAX_BODY_SIZE = 2 * 1024;

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
    // VERIFY MESSAGE
    // --------------------------------------------------

    const {
      data: message,
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

    if (!message) {
      return NextResponse.json(
        { error: "Message not found." },
        { status: 404 },
      );
    }

    // --------------------------------------------------
    // DELETE MESSAGE
    // --------------------------------------------------

    const { error: deleteError } =
      await supabase
        .from("messages")
        .delete()
        .eq("id", id);

    if (deleteError) {
      console.error(
        "Supabase delete message error:",
        deleteError,
      );

      return NextResponse.json(
        { error: "Failed to delete message." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Message deleted successfully.",
    });
  } catch (error) {
    console.error(
      "Delete message API error:",
      error,
    );

    return NextResponse.json(
      { error: "Failed to delete message." },
      { status: 500 },
    );
  }
}