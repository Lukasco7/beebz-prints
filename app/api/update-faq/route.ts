import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const MAX_BODY_SIZE = 32 * 1024;

const MAX_QUESTION_LENGTH = 500;
const MAX_ANSWER_LENGTH = 5000;
const MAX_CATEGORY_LENGTH = 100;
const MAX_SORT_ORDER = 1_000_000;

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

    const question =
      typeof body.question === "string"
        ? body.question.trim()
        : "";

    const answer =
      typeof body.answer === "string"
        ? body.answer.trim()
        : "";

    const category =
      typeof body.category === "string"
        ? body.category.trim()
        : "";

    // --------------------------------------------------
    // ID VALIDATION
    // --------------------------------------------------

    if (!id) {
      return NextResponse.json(
        { error: "FAQ ID is required." },
        { status: 400 },
      );
    }

    if (!UUID_REGEX.test(id)) {
      return NextResponse.json(
        { error: "Invalid FAQ ID." },
        { status: 400 },
      );
    }

    // --------------------------------------------------
    // REQUIRED FIELDS
    // --------------------------------------------------

    if (!question || !answer) {
      return NextResponse.json(
        { error: "Question and answer are required." },
        { status: 400 },
      );
    }

    // --------------------------------------------------
    // LENGTH VALIDATION
    // --------------------------------------------------

    if (question.length > MAX_QUESTION_LENGTH) {
      return NextResponse.json(
        {
          error: `Question must be ${MAX_QUESTION_LENGTH} characters or fewer.`,
        },
        { status: 400 },
      );
    }

    if (answer.length > MAX_ANSWER_LENGTH) {
      return NextResponse.json(
        {
          error: `Answer must be ${MAX_ANSWER_LENGTH} characters or fewer.`,
        },
        { status: 400 },
      );
    }

    if (category.length > MAX_CATEGORY_LENGTH) {
      return NextResponse.json(
        {
          error: `Category must be ${MAX_CATEGORY_LENGTH} characters or fewer.`,
        },
        { status: 400 },
      );
    }

    // --------------------------------------------------
    // SORT ORDER
    // --------------------------------------------------

    const parsedSortOrder = Number(body.sort_order);

    const sortOrder =
      Number.isFinite(parsedSortOrder)
        ? Math.min(
            MAX_SORT_ORDER,
            Math.max(0, Math.floor(parsedSortOrder)),
          )
        : 0;

    // --------------------------------------------------
    // PUBLISHED STATUS
    // --------------------------------------------------

    const isPublished = body.is_published === true;

    // --------------------------------------------------
    // VERIFY FAQ EXISTS
    // --------------------------------------------------

    const { data: existingFaq, error: lookupError } =
      await supabase
        .from("faqs")
        .select("id")
        .eq("id", id)
        .maybeSingle();

    if (lookupError) {
      console.error("FAQ lookup error:", lookupError);

      return NextResponse.json(
        { error: "Failed to verify FAQ." },
        { status: 500 },
      );
    }

    if (!existingFaq) {
      return NextResponse.json(
        { error: "FAQ not found." },
        { status: 404 },
      );
    }

    // --------------------------------------------------
    // UPDATE FAQ
    // --------------------------------------------------

    const { error: updateError } =
      await supabase
        .from("faqs")
        .update({
          question,
          answer,
          category: category || null,
          sort_order: sortOrder,
          is_published: isPublished,
        })
        .eq("id", id);

    if (updateError) {
      console.error("Update FAQ error:", updateError);

      return NextResponse.json(
        { error: "Failed to update FAQ." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Update FAQ error:", error);

    return NextResponse.json(
      { error: "Failed to update FAQ." },
      { status: 500 },
    );
  }
}