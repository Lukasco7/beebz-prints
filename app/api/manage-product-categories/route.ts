import { connection } from "next/server";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const MAX_REQUEST_SIZE = 16 * 1024;

const MAX_NAME_LENGTH = 150;
const MAX_SLUG_LENGTH = 120;
const MAX_DESCRIPTION_LENGTH = 1000;
const MAX_SORT_ORDER = 1_000_000;

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

async function getAdminClient() {
  const supabase = await createClient();

  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims();

  if (claimsError || !claimsData?.claims?.sub) {
    return {
      supabase,
      authorized: false,
      status: 401,
    };
  }

  const userId = claimsData.claims.sub;

  const { data: profile, error: profileError } = await supabase
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
    return {
      supabase,
      authorized: false,
      status: 403,
    };
  }

  return {
    supabase,
    authorized: true,
    status: 200,
  };
}

function isRequestTooLarge(request: Request) {
  const contentLength = request.headers.get("content-length");

  if (!contentLength) {
    return false;
  }

  const length = Number(contentLength);

  return (
    !Number.isFinite(length) ||
    length < 0 ||
    length > MAX_REQUEST_SIZE
  );
}

async function parseJsonBody(request: Request): Promise<unknown | null> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

function isObject(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

// GET — Load categories with the number of products in each category.
export async function GET() {
  await connection();

  try {
    const { supabase, authorized, status } = await getAdminClient();

    if (!authorized) {
      return NextResponse.json(
        { message: "Unauthorized." },
        { status },
      );
    }

    const { data: categories, error } = await supabase
      .from("product_categories")
      .select(`
        id,
        name,
        slug,
        description,
        sort_order,
        is_active,
        products(count)
      `)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });

    if (error) {
      console.error("Get product categories error:", error);

      return NextResponse.json(
        {
          message: "Unable to load product categories.",
        },
        { status: 500 },
      );
    }

    const formattedCategories = (categories ?? []).map(
      (category) => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description,
        sort_order: category.sort_order,
        is_active: category.is_active,
        product_count: category.products?.[0]?.count ?? 0,
      }),
    );

    return NextResponse.json({
      categories: formattedCategories,
    });
  } catch (error) {
    console.error("Get product categories error:", error);

    return NextResponse.json(
      {
        message: "Something went wrong.",
      },
      { status: 500 },
    );
  }
}

// POST — Create category.
export async function POST(request: Request) {
  try {
    if (isRequestTooLarge(request)) {
      return NextResponse.json(
        {
          success: false,
          message: "Request is too large.",
        },
        { status: 413 },
      );
    }

    const { supabase, authorized, status } =
      await getAdminClient();

    if (!authorized) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized.",
        },
        { status },
      );
    }

    const body = await parseJsonBody(request);

    if (!isObject(body)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid request body.",
        },
        { status: 400 },
      );
    }

    const name =
      typeof body.name === "string"
        ? body.name.trim()
        : "";

    const slug =
      typeof body.slug === "string"
        ? body.slug.trim().toLowerCase()
        : "";

    const description =
      body.description === null ||
      body.description === undefined ||
      body.description === ""
        ? null
        : typeof body.description === "string"
          ? body.description.trim()
          : null;

    const sortOrder =
      body.sort_order === undefined ||
      body.sort_order === null ||
      body.sort_order === ""
        ? 0
        : Number(body.sort_order);

    const isActive = body.is_active !== false;

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          message: "Category name is required.",
        },
        { status: 400 },
      );
    }

    if (name.length > MAX_NAME_LENGTH) {
      return NextResponse.json(
        {
          success: false,
          message: `Category name must be ${MAX_NAME_LENGTH} characters or fewer.`,
        },
        { status: 400 },
      );
    }

    if (!slug) {
      return NextResponse.json(
        {
          success: false,
          message: "Category slug is required.",
        },
        { status: 400 },
      );
    }

    if (
      slug.length > MAX_SLUG_LENGTH ||
      !SLUG_REGEX.test(slug)
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Category slug must contain only lowercase letters, numbers, and single hyphens.",
        },
        { status: 400 },
      );
    }

    if (
      description !== null &&
      description.length > MAX_DESCRIPTION_LENGTH
    ) {
      return NextResponse.json(
        {
          success: false,
          message: `Category description must be ${MAX_DESCRIPTION_LENGTH} characters or fewer.`,
        },
        { status: 400 },
      );
    }

    if (
      !Number.isInteger(sortOrder) ||
      sortOrder < 0 ||
      sortOrder > MAX_SORT_ORDER
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Sort order must be a valid number.",
        },
        { status: 400 },
      );
    }

    // Check duplicate slug.
    const {
      data: existingSlug,
      error: existingSlugError,
    } = await supabase
      .from("product_categories")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (existingSlugError) {
      console.error(
        "Product category slug lookup error:",
        existingSlugError,
      );

      return NextResponse.json(
        {
          success: false,
          message: "Unable to validate category.",
        },
        { status: 500 },
      );
    }

    if (existingSlug) {
      return NextResponse.json(
        {
          success: false,
          message: "A category with this slug already exists.",
        },
        { status: 400 },
      );
    }

    const { data: category, error } = await supabase
      .from("product_categories")
      .insert({
        name,
        slug,
        description,
        sort_order: sortOrder,
        is_active: isActive,
      })
      .select(
        "id, name, slug, description, sort_order, is_active",
      )
      .single();

    if (error) {
      console.error("Create product category error:", error);

      if (error.code === "23505") {
        return NextResponse.json(
          {
            success: false,
            message:
              "A category with this name or slug already exists.",
          },
          { status: 400 },
        );
      }

      return NextResponse.json(
        {
          success: false,
          message: "Unable to create category.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Category created successfully.",
      category,
    });
  } catch (error) {
    console.error("Create product category error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong.",
      },
      { status: 500 },
    );
  }
}

// PUT — Update category.
export async function PUT(request: Request) {
  try {
    if (isRequestTooLarge(request)) {
      return NextResponse.json(
        {
          success: false,
          message: "Request is too large.",
        },
        { status: 413 },
      );
    }

    const { supabase, authorized, status } =
      await getAdminClient();

    if (!authorized) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized.",
        },
        { status },
      );
    }

    const body = await parseJsonBody(request);

    if (!isObject(body)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid request body.",
        },
        { status: 400 },
      );
    }

    const id =
      typeof body.id === "string"
        ? body.id.trim()
        : "";

    const name =
      typeof body.name === "string"
        ? body.name.trim()
        : "";

    const slug =
      typeof body.slug === "string"
        ? body.slug.trim().toLowerCase()
        : "";

    const description =
      body.description === null ||
      body.description === undefined ||
      body.description === ""
        ? null
        : typeof body.description === "string"
          ? body.description.trim()
          : null;

    const sortOrder =
      body.sort_order === undefined ||
      body.sort_order === null ||
      body.sort_order === ""
        ? 0
        : Number(body.sort_order);

    const isActive = body.is_active !== false;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Category ID is required.",
        },
        { status: 400 },
      );
    }

    if (!UUID_REGEX.test(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid category ID.",
        },
        { status: 400 },
      );
    }

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          message: "Category name is required.",
        },
        { status: 400 },
      );
    }

    if (name.length > MAX_NAME_LENGTH) {
      return NextResponse.json(
        {
          success: false,
          message: `Category name must be ${MAX_NAME_LENGTH} characters or fewer.`,
        },
        { status: 400 },
      );
    }

    if (!slug) {
      return NextResponse.json(
        {
          success: false,
          message: "Category slug is required.",
        },
        { status: 400 },
      );
    }

    if (
      slug.length > MAX_SLUG_LENGTH ||
      !SLUG_REGEX.test(slug)
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Category slug must contain only lowercase letters, numbers, and single hyphens.",
        },
        { status: 400 },
      );
    }

    if (
      description !== null &&
      description.length > MAX_DESCRIPTION_LENGTH
    ) {
      return NextResponse.json(
        {
          success: false,
          message: `Category description must be ${MAX_DESCRIPTION_LENGTH} characters or fewer.`,
        },
        { status: 400 },
      );
    }

    if (
      !Number.isInteger(sortOrder) ||
      sortOrder < 0 ||
      sortOrder > MAX_SORT_ORDER
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Sort order must be a valid number.",
        },
        { status: 400 },
      );
    }

    // Confirm the category exists.
    const {
      data: existingCategory,
      error: existingCategoryError,
    } = await supabase
      .from("product_categories")
      .select("id")
      .eq("id", id)
      .maybeSingle();

    if (existingCategoryError) {
      console.error(
        "Product category lookup error:",
        existingCategoryError,
      );

      return NextResponse.json(
        {
          success: false,
          message: "Unable to load category.",
        },
        { status: 500 },
      );
    }

    if (!existingCategory) {
      return NextResponse.json(
        {
          success: false,
          message: "Category not found.",
        },
        { status: 404 },
      );
    }

    // Make sure another category isn't already using the slug.
    const {
      data: duplicate,
      error: duplicateError,
    } = await supabase
      .from("product_categories")
      .select("id")
      .eq("slug", slug)
      .neq("id", id)
      .maybeSingle();

    if (duplicateError) {
      console.error(
        "Product category duplicate lookup error:",
        duplicateError,
      );

      return NextResponse.json(
        {
          success: false,
          message: "Unable to validate category slug.",
        },
        { status: 500 },
      );
    }

    if (duplicate) {
      return NextResponse.json(
        {
          success: false,
          message: "Another category already uses this slug.",
        },
        { status: 400 },
      );
    }

    const { data: category, error } = await supabase
      .from("product_categories")
      .update({
        name,
        slug,
        description,
        sort_order: sortOrder,
        is_active: isActive,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select(
        "id, name, slug, description, sort_order, is_active",
      )
      .maybeSingle();

    if (error) {
      console.error("Update product category error:", error);

      if (error.code === "23505") {
        return NextResponse.json(
          {
            success: false,
            message:
              "A category with this name or slug already exists.",
          },
          { status: 400 },
        );
      }

      return NextResponse.json(
        {
          success: false,
          message: "Unable to update category.",
        },
        { status: 500 },
      );
    }

    if (!category) {
      return NextResponse.json(
        {
          success: false,
          message: "Category not found.",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Category updated successfully.",
      category,
    });
  } catch (error) {
    console.error("Update product category error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong.",
      },
      { status: 500 },
    );
  }
}

// DELETE — Delete category.
export async function DELETE(request: Request) {
  try {
    if (isRequestTooLarge(request)) {
      return NextResponse.json(
        {
          success: false,
          message: "Request is too large.",
        },
        { status: 413 },
      );
    }

    const { supabase, authorized, status } =
      await getAdminClient();

    if (!authorized) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized.",
        },
        { status },
      );
    }

    const body = await parseJsonBody(request);

    if (!isObject(body)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid request body.",
        },
        { status: 400 },
      );
    }

    const id =
      typeof body.id === "string"
        ? body.id.trim()
        : "";

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Category ID is required.",
        },
        { status: 400 },
      );
    }

    if (!UUID_REGEX.test(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid category ID.",
        },
        { status: 400 },
      );
    }

    // Confirm the category exists.
    const {
      data: category,
      error: categoryError,
    } = await supabase
      .from("product_categories")
      .select("id")
      .eq("id", id)
      .maybeSingle();

    if (categoryError) {
      console.error(
        "Delete product category lookup error:",
        categoryError,
      );

      return NextResponse.json(
        {
          success: false,
          message: "Unable to load category.",
        },
        { status: 500 },
      );
    }

    if (!category) {
      return NextResponse.json(
        {
          success: false,
          message: "Category not found.",
        },
        { status: 404 },
      );
    }

    // Never allow deletion while products are using this category.
    const { count, error: countError } = await supabase
      .from("products")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("category_id", id);

    if (countError) {
      console.error(
        "Product category usage check error:",
        countError,
      );

      return NextResponse.json(
        {
          success: false,
          message: "Unable to check category usage.",
        },
        { status: 500 },
      );
    }

    if ((count ?? 0) > 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "This category cannot be deleted because products are using it. Move those products to another category first.",
        },
        { status: 400 },
      );
    }

    const { error } = await supabase
      .from("product_categories")
      .delete()
      .eq("id", id);

    if (error) {
      console.error(
        "Delete product category error:",
        error,
      );

      return NextResponse.json(
        {
          success: false,
          message: "Unable to delete category.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Category deleted successfully.",
    });
  } catch (error) {
    console.error("Delete product category error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong.",
      },
      { status: 500 },
    );
  }
}