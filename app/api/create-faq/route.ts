import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const MAX_BODY_SIZE = 32 * 1024;

const MAX_QUESTION_LENGTH = 500;
const MAX_ANSWER_LENGTH = 5000;
const MAX_CATEGORY_LENGTH = 100;

const MAX_SORT_ORDER = 1_000_000;

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

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "Unable to verify your admin account." },
        { status: 403 },
      );
    }

    if (
      profile.role !== "admin" ||
      profile.is_active !== true
    ) {
      return NextResponse.json(
        { error: "You do not have permission to create FAQs." },
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
    // REQUIRED FIELDS
    // --------------------------------------------------

    if (!question) {
      return NextResponse.json(
        { error: "Question is required." },
        { status: 400 },
      );
    }

    if (!answer) {
      return NextResponse.json(
        { error: "Answer is required." },
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
    // CREATE FAQ
    // --------------------------------------------------

    const { data, error } = await supabase
      .from("faqs")
      .insert({
        question,
        answer,
        category: category || null,
        sort_order: sortOrder,
        is_published: isPublished,
      })
      .select()
      .single();

    if (error) {
      console.error("Supabase create FAQ error:", error);

      return NextResponse.json(
        { error: "Failed to create FAQ." },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        faq: data,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Create FAQ API error:", error);

    return NextResponse.json(
      { error: "Failed to create FAQ." },
      { status: 500 },
    );
  }
}