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
          {
            success: false,
            message: "Request is too large.",
          },
          { status: 413 },
        );
      }
    }

    const supabase = await createClient();

    // Verify authentication and obtain server-verified claims.
    const { data: claimsData, error: claimsError } =
      await supabase.auth.getClaims();

    if (claimsError || !claimsData?.claims?.sub) {
      return NextResponse.json(
        {
          success: false,
          message: "You must be logged in.",
        },
        { status: 401 },
      );
    }

    const userId = claimsData.claims.sub;

    // Verify active admin account.
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
      return NextResponse.json(
        {
          success: false,
          message: "You are not authorized to perform this action.",
        },
        { status: 403 },
      );
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid request body.",
        },
        { status: 400 },
      );
    }

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid request body.",
        },
        { status: 400 },
      );
    }

    const productId =
      typeof (body as { id?: unknown }).id === "string"
        ? (body as { id: string }).id.trim()
        : "";

    if (!productId) {
      return NextResponse.json(
        {
          success: false,
          message: "Product ID is required.",
        },
        { status: 400 },
      );
    }

    if (!UUID_REGEX.test(productId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid product ID.",
        },
        { status: 400 },
      );
    }

    // Get the product first so its associated image can be cleaned up.
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("id, image_url")
      .eq("id", productId)
      .maybeSingle();

    if (productError) {
      console.error("Delete product lookup error:", productError);

      return NextResponse.json(
        {
          success: false,
          message: "Unable to load product.",
        },
        { status: 500 },
      );
    }

    if (!product) {
      return NextResponse.json(
        {
          success: false,
          message: "Product not found.",
        },
        { status: 404 },
      );
    }

    // Delete the database record first.
    const { error: deleteError } = await supabase
      .from("products")
      .delete()
      .eq("id", productId);

    if (deleteError) {
      console.error("Delete product database error:", deleteError);

      return NextResponse.json(
        {
          success: false,
          message: "Unable to delete product.",
        },
        { status: 500 },
      );
    }

    // Clean up the associated storage image.
    // Only remove files belonging to the public products bucket.
    if (product.image_url) {
      try {
        const marker = "/storage/v1/object/public/products/";
        const markerIndex = product.image_url.indexOf(marker);

        if (markerIndex !== -1) {
          const storagePath = product.image_url
            .slice(markerIndex + marker.length)
            .trim();

          if (storagePath) {
            const { error: storageError } = await supabase.storage
              .from("products")
              .remove([storagePath]);

            if (storageError) {
              console.error(
                "Product image cleanup failed:",
                storageError,
              );
            }
          }
        }
      } catch (storageError) {
        console.error(
          "Product image cleanup failed:",
          storageError,
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: "Product deleted successfully.",
    });
  } catch (error) {
    console.error("Delete product error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong.",
      },
      { status: 500 },
    );
  }
}