import { connection } from "next/server";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const MAX_REQUEST_SIZE = 2 * 1024;

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  await connection();

  try {
    const contentLength = request.headers.get("content-length");

    if (contentLength) {
      const length = Number(contentLength);

      if (
        !Number.isFinite(length) ||
        length < 0 ||
        length > MAX_REQUEST_SIZE
      ) {
        return NextResponse.json(
          { error: "Request is too large." },
          { status: 413 },
        );
      }
    }

    const supabase = await createClient();

    // Verify authentication using server-verified claims.
    const { data: claimsData, error: claimsError } =
      await supabase.auth.getClaims();

    const userId = claimsData?.claims?.sub;

    if (claimsError || !userId) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 },
      );
    }

    // Verify active admin profile.
    const { data: profile, error: profileError } =
      await supabase
        .from("profiles")
        .select("role, is_active")
        .eq("id", userId)
        .maybeSingle();

    if (
      profileError ||
      !profile ||
      profile.role !== "admin" ||
      profile.is_active !== true
    ) {
      return NextResponse.json(
        {
          error:
            "You do not have permission to delete categories.",
        },
        { status: 403 },
      );
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 },
      );
    }

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

    const rawId = (body as { id?: unknown }).id;

    const id =
      typeof rawId === "string"
        ? rawId.trim()
        : "";

    if (!id) {
      return NextResponse.json(
        { error: "Category ID is required." },
        { status: 400 },
      );
    }

    if (!UUID_REGEX.test(id)) {
      return NextResponse.json(
        { error: "Invalid category ID." },
        { status: 400 },
      );
    }

    // Confirm that the category actually exists.
    const {
      data: category,
      error: categoryError,
    } = await supabase
      .from("gallery_categories")
      .select("id")
      .eq("id", id)
      .maybeSingle();

    if (categoryError) {
      console.error(
        "Gallery category lookup error:",
        categoryError,
      );

      return NextResponse.json(
        { error: "Unable to load the category." },
        { status: 500 },
      );
    }

    if (!category) {
      return NextResponse.json(
        { error: "Gallery category not found." },
        { status: 404 },
      );
    }

    // Check whether gallery items are using this category.
    const {
      data: galleryItems,
      error: galleryError,
    } = await supabase
      .from("gallery")
      .select("id")
      .eq("category_id", id)
      .limit(1);

    if (galleryError) {
      console.error(
        "Gallery category usage check error:",
        galleryError,
      );

      return NextResponse.json(
        {
          error:
            "Could not check whether this category is being used.",
        },
        { status: 500 },
      );
    }

    if (galleryItems && galleryItems.length > 0) {
      return NextResponse.json(
        {
          error:
            "This category cannot be deleted because gallery items are using it. Edit those gallery items first or deactivate the category instead.",
        },
        { status: 409 },
      );
    }

    // Delete category.
    const { error: deleteError } = await supabase
      .from("gallery_categories")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error(
        "Delete gallery category error:",
        deleteError,
      );

      return NextResponse.json(
        { error: "Failed to delete the category." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Gallery category deleted successfully.",
    });
  } catch (error) {
    console.error(
      "Delete gallery category error:",
      error,
    );

    return NextResponse.json(
      { error: "Something went wrong while deleting the category." },
      { status: 500 },
    );
  }
}