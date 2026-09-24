import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const MAX_BODY_SIZE = 128 * 1024;

const MAX_TITLE_LENGTH = 200;
const MAX_SLUG_LENGTH = 120;
const MAX_FEATURED_IMAGE_LENGTH = 2000;
const MAX_SEO_TITLE_LENGTH = 200;
const MAX_SEO_DESCRIPTION_LENGTH = 500;

const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

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

    const title =
      typeof body.title === "string"
        ? body.title.trim()
        : "";

    const slug =
      typeof body.slug === "string"
        ? body.slug.trim()
        : "";

    const featuredImage =
      typeof body.featured_image === "string"
        ? body.featured_image.trim()
        : "";

    const seoTitle =
      typeof body.seo_title === "string"
        ? body.seo_title.trim()
        : "";

    const seoDescription =
      typeof body.seo_description === "string"
        ? body.seo_description.trim()
        : "";

    const isPublished = body.is_published === true;

    // Preserve the existing page content structure.
    const content =
      body.content &&
      typeof body.content === "object" &&
      !Array.isArray(body.content)
        ? body.content
        : null;

    // --------------------------------------------------
    // ID VALIDATION
    // --------------------------------------------------

    if (!id) {
      return NextResponse.json(
        { error: "Page ID is required." },
        { status: 400 },
      );
    }

    if (!UUID_REGEX.test(id)) {
      return NextResponse.json(
        { error: "Invalid page ID." },
        { status: 400 },
      );
    }

    // --------------------------------------------------
    // REQUIRED FIELDS
    // --------------------------------------------------

    if (!title) {
      return NextResponse.json(
        { error: "Page title is required." },
        { status: 400 },
      );
    }

    if (!slug) {
      return NextResponse.json(
        { error: "Page slug is required." },
        { status: 400 },
      );
    }

    if (!content) {
      return NextResponse.json(
        { error: "Page content is required." },
        { status: 400 },
      );
    }

    // --------------------------------------------------
    // FIELD LENGTH VALIDATION
    // --------------------------------------------------

    if (title.length > MAX_TITLE_LENGTH) {
      return NextResponse.json(
        {
          error: `Page title must be ${MAX_TITLE_LENGTH} characters or fewer.`,
        },
        { status: 400 },
      );
    }

    if (slug.length > MAX_SLUG_LENGTH) {
      return NextResponse.json(
        {
          error: `Page slug must be ${MAX_SLUG_LENGTH} characters or fewer.`,
        },
        { status: 400 },
      );
    }

    if (featuredImage.length > MAX_FEATURED_IMAGE_LENGTH) {
      return NextResponse.json(
        { error: "Featured image URL is too long." },
        { status: 400 },
      );
    }

    if (seoTitle.length > MAX_SEO_TITLE_LENGTH) {
      return NextResponse.json(
        {
          error: `SEO title must be ${MAX_SEO_TITLE_LENGTH} characters or fewer.`,
        },
        { status: 400 },
      );
    }

    if (seoDescription.length > MAX_SEO_DESCRIPTION_LENGTH) {
      return NextResponse.json(
        {
          error: `SEO description must be ${MAX_SEO_DESCRIPTION_LENGTH} characters or fewer.`,
        },
        { status: 400 },
      );
    }

    // --------------------------------------------------
    // NORMALIZE SLUG
    // --------------------------------------------------

    const normalizedSlug = slug
      .toLowerCase()
      .replace(/^\/+|\/+$/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");

    if (
      !normalizedSlug ||
      normalizedSlug.length > MAX_SLUG_LENGTH ||
      !SLUG_REGEX.test(normalizedSlug)
    ) {
      return NextResponse.json(
        { error: "Please enter a valid page slug." },
        { status: 400 },
      );
    }

    // --------------------------------------------------
    // VERIFY PAGE EXISTS
    // --------------------------------------------------

    const { data: existingPageById, error: pageLookupError } =
      await supabase
        .from("pages")
        .select("id")
        .eq("id", id)
        .maybeSingle();

    if (pageLookupError) {
      console.error(
        "Page lookup error:",
        pageLookupError,
      );

      return NextResponse.json(
        { error: "Unable to verify the page." },
        { status: 500 },
      );
    }

    if (!existingPageById) {
      return NextResponse.json(
        { error: "Page not found." },
        { status: 404 },
      );
    }

    // --------------------------------------------------
    // CHECK FOR DUPLICATE SLUG
    // --------------------------------------------------

    const {
      data: existingPage,
      error: existingError,
    } = await supabase
      .from("pages")
      .select("id")
      .eq("slug", normalizedSlug)
      .neq("id", id)
      .maybeSingle();

    if (existingError) {
      console.error(
        "Slug check error:",
        existingError,
      );

      return NextResponse.json(
        { error: "Unable to verify the page slug." },
        { status: 500 },
      );
    }

    if (existingPage) {
      return NextResponse.json(
        {
          error:
            "Another page already uses this slug. Please choose another slug.",
        },
        { status: 409 },
      );
    }

    // --------------------------------------------------
    // UPDATE PAGE
    // --------------------------------------------------

    const {
      data: page,
      error: updateError,
    } = await supabase
      .from("pages")
      .update({
        title,
        slug: normalizedSlug,
        content,
        featured_image: featuredImage || null,
        seo_title: seoTitle || null,
        seo_description: seoDescription || null,
        is_published: isPublished,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      console.error(
        "Supabase update page error:",
        updateError,
      );

      return NextResponse.json(
        { error: "Failed to update page." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      page,
    });
  } catch (error) {
    console.error(
      "Update page API error:",
      error,
    );

    return NextResponse.json(
      { error: "Failed to update page." },
      { status: 500 },
    );
  }
}