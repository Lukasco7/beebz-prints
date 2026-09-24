import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { randomUUID } from "crypto";

const MAX_REQUEST_SIZE = 12 * 1024 * 1024;
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

const MAX_NAME_LENGTH = 200;
const MAX_SLUG_LENGTH = 120;
const MAX_SHORT_DESCRIPTION_LENGTH = 1000;
const MAX_DESCRIPTION_LENGTH = 5000;
const MAX_PRICE_UNIT_LENGTH = 100;
const MAX_FEATURES = 100;
const MAX_FEATURE_LENGTH = 300;
const MAX_PRICING_TIERS = 100;
const MAX_QUANTITY = 1_000_000_000;
const MAX_PRICE = 1_000_000_000;
const MAX_SORT_ORDER = 1_000_000;
const MAX_SEO_TITLE_LENGTH = 200;
const MAX_SEO_DESCRIPTION_LENGTH = 500;

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const SLUG_REGEX =
  /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

function getExtension(file: File): string {
  switch (file.type) {
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/jpeg":
    default:
      return "jpg";
  }
}

function isAdminProfile(
  profile: {
    role?: string;
    is_active?: boolean;
  } | null,
) {
  return (
    !!profile &&
    profile.role === "admin" &&
    profile.is_active === true
  );
}

function isValidUuid(value: string): boolean {
  return UUID_REGEX.test(value);
}

type PricingTierInput = {
  minimumQuantity: number;
  unitPrice: number;
};

export async function PUT(request: Request) {
  let uploadedPath: string | null = null;

  try {
    // --------------------------------
    // Request size
    // --------------------------------

    const contentLength =
      request.headers.get("content-length");

    if (contentLength) {
      const size = Number(contentLength);

      if (
        !Number.isFinite(size) ||
        size > MAX_REQUEST_SIZE
      ) {
        return NextResponse.json(
          {
            error:
              "Request body is too large.",
          },
          { status: 413 },
        );
      }
    }

    // --------------------------------
    // Authentication
    // --------------------------------

    const supabase = await createClient();

    const {
      data: claimsData,
      error: claimsError,
    } = await supabase.auth.getClaims();

    if (
      claimsError ||
      !claimsData?.claims?.sub
    ) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 },
      );
    }

    const userId =
      claimsData.claims.sub;

    // --------------------------------
    // Admin authorization
    // --------------------------------

    const {
      data: profile,
      error: profileError,
    } = await supabase
      .from("profiles")
      .select("role, is_active")
      .eq("id", userId)
      .single();

    if (
      profileError ||
      !isAdminProfile(profile)
    ) {
      return NextResponse.json(
        { error: "Forbidden." },
        { status: 403 },
      );
    }

    // --------------------------------
    // Read form data
    // --------------------------------

    const formData =
      await request.formData();

    const id = String(
      formData.get("id") ?? "",
    ).trim();

    const name = String(
      formData.get("name") ?? "",
    ).trim();

    const rawSlug = String(
      formData.get("slug") ?? "",
    ).trim();

    const slug =
      rawSlug.toLowerCase();

    const categoryId = String(
      formData.get("category_id") ?? "",
    ).trim();

    const shortDescription =
      String(
        formData.get(
          "short_description",
        ) ?? "",
      ).trim();

    const description = String(
      formData.get("description") ?? "",
    ).trim();

    const startingPriceRaw =
      String(
        formData.get(
          "starting_price",
        ) ?? "",
      ).trim();

    const priceUnit = String(
      formData.get("price_unit") ?? "",
    ).trim();

    const featuresRaw = String(
      formData.get("features") ?? "",
    );

    const pricingTiersRaw =
      String(
        formData.get(
          "pricing_tiers",
        ) ?? "",
      );

    const isPublished =
      String(
        formData.get(
          "is_published",
        ) ?? "false",
      ) === "true";

    const isFeatured =
      String(
        formData.get(
          "is_featured",
        ) ?? "false",
      ) === "true";

    const sortOrderRaw = String(
      formData.get("sort_order") ??
        "0",
    ).trim();

    const seoTitle = String(
      formData.get("seo_title") ?? "",
    ).trim();

    const seoDescription =
      String(
        formData.get(
          "seo_description",
        ) ?? "",
      ).trim();

    const removeImage =
      String(
        formData.get(
          "remove_image",
        ) ?? "false",
      ) === "true";

    const imageValue =
      formData.get("image");

    const image =
      imageValue instanceof File &&
      imageValue.size > 0
        ? imageValue
        : null;

    // --------------------------------
    // Basic validation
    // --------------------------------

    if (
      !id ||
      !name ||
      !slug ||
      !categoryId
    ) {
      return NextResponse.json(
        {
          error:
            "Product ID, name, slug and category are required.",
        },
        { status: 400 },
      );
    }

    if (!isValidUuid(id)) {
      return NextResponse.json(
        {
          error:
            "Invalid product ID.",
        },
        { status: 400 },
      );
    }

    if (!isValidUuid(categoryId)) {
      return NextResponse.json(
        {
          error:
            "Invalid product category.",
        },
        { status: 400 },
      );
    }

    // --------------------------------
    // Text length validation
    // --------------------------------

    if (
      name.length >
      MAX_NAME_LENGTH
    ) {
      return NextResponse.json(
        {
          error:
            `Product name must be ${MAX_NAME_LENGTH} characters or fewer.`,
        },
        { status: 400 },
      );
    }

    if (
      slug.length >
      MAX_SLUG_LENGTH
    ) {
      return NextResponse.json(
        {
          error:
            `Product slug must be ${MAX_SLUG_LENGTH} characters or fewer.`,
        },
        { status: 400 },
      );
    }

    if (!SLUG_REGEX.test(slug)) {
      return NextResponse.json(
        {
          error:
            "Product slug may only contain lowercase letters, numbers, and single hyphens.",
        },
        { status: 400 },
      );
    }

    if (
      shortDescription.length >
      MAX_SHORT_DESCRIPTION_LENGTH
    ) {
      return NextResponse.json(
        {
          error:
            `Short description must be ${MAX_SHORT_DESCRIPTION_LENGTH} characters or fewer.`,
        },
        { status: 400 },
      );
    }

    if (
      description.length >
      MAX_DESCRIPTION_LENGTH
    ) {
      return NextResponse.json(
        {
          error:
            `Description must be ${MAX_DESCRIPTION_LENGTH} characters or fewer.`,
        },
        { status: 400 },
      );
    }

    if (
      priceUnit.length >
      MAX_PRICE_UNIT_LENGTH
    ) {
      return NextResponse.json(
        {
          error:
            `Price unit must be ${MAX_PRICE_UNIT_LENGTH} characters or fewer.`,
        },
        { status: 400 },
      );
    }

    if (
      seoTitle.length >
      MAX_SEO_TITLE_LENGTH
    ) {
      return NextResponse.json(
        {
          error:
            `SEO title must be ${MAX_SEO_TITLE_LENGTH} characters or fewer.`,
        },
        { status: 400 },
      );
    }

    if (
      seoDescription.length >
      MAX_SEO_DESCRIPTION_LENGTH
    ) {
      return NextResponse.json(
        {
          error:
            `SEO description must be ${MAX_SEO_DESCRIPTION_LENGTH} characters or fewer.`,
        },
        { status: 400 },
      );
    }

    // --------------------------------
    // Image validation
    // --------------------------------

    if (image) {
      if (
        image.size > MAX_IMAGE_SIZE
      ) {
        return NextResponse.json(
          {
            error:
              "Image must be 10MB or smaller.",
          },
          { status: 400 },
        );
      }

      if (
        !ALLOWED_TYPES.includes(
          image.type as
            (typeof ALLOWED_TYPES)[number],
        )
      ) {
        return NextResponse.json(
          {
            error:
              "Only JPG, PNG and WebP images are allowed.",
          },
          { status: 400 },
        );
      }
    }

    // --------------------------------
    // Parse price
    // --------------------------------

    const startingPrice =
      startingPriceRaw === ""
        ? null
        : Number(startingPriceRaw);

    if (
      startingPrice !== null &&
      (!Number.isFinite(
        startingPrice,
      ) ||
        startingPrice < 0 ||
        startingPrice > MAX_PRICE)
    ) {
      return NextResponse.json(
        {
          error:
            "Starting price must be a valid amount between 0 and 1,000,000,000.",
        },
        { status: 400 },
      );
    }

    // --------------------------------
    // Parse sort order
    // --------------------------------

    const sortOrder =
      sortOrderRaw === ""
        ? 0
        : Number(sortOrderRaw);

    if (
      !Number.isInteger(sortOrder) ||
      sortOrder < 0 ||
      sortOrder > MAX_SORT_ORDER
    ) {
      return NextResponse.json(
        {
          error:
            "Sort order must be a whole number between 0 and 1,000,000.",
        },
        { status: 400 },
      );
    }

    // --------------------------------
    // Parse features
    // --------------------------------

    let features: string[] = [];

    try {
      if (featuresRaw.trim()) {
        const parsedFeatures =
          JSON.parse(
            featuresRaw,
          );

        if (
          Array.isArray(
            parsedFeatures,
          )
        ) {
          features =
            parsedFeatures
              .map((item) =>
                String(item).trim(),
              )
              .filter(Boolean);
        } else {
          throw new Error(
            "Features must be an array.",
          );
        }
      }
    } catch {
      features = featuresRaw
        .split("\n")
        .map((item) =>
          item.trim(),
        )
        .filter(Boolean);
    }

    if (
      features.length >
      MAX_FEATURES
    ) {
      return NextResponse.json(
        {
          error:
            `A maximum of ${MAX_FEATURES} features is allowed.`,
        },
        { status: 400 },
      );
    }

    for (const feature of features) {
      if (
        feature.length >
        MAX_FEATURE_LENGTH
      ) {
        return NextResponse.json(
          {
            error:
              `Each feature must be ${MAX_FEATURE_LENGTH} characters or fewer.`,
          },
          { status: 400 },
        );
      }
    }

    // --------------------------------
    // Parse pricing tiers
    // --------------------------------

    let pricingTiers: PricingTierInput[] =
      [];

    if (
      pricingTiersRaw.trim()
    ) {
      try {
        const parsedPricingTiers =
          JSON.parse(
            pricingTiersRaw,
          );

        if (
          !Array.isArray(
            parsedPricingTiers,
          )
        ) {
          return NextResponse.json(
            {
              error:
                "Pricing tiers must be provided as a list.",
            },
            { status: 400 },
          );
        }

        if (
          parsedPricingTiers.length >
          MAX_PRICING_TIERS
        ) {
          return NextResponse.json(
            {
              error:
                `A maximum of ${MAX_PRICING_TIERS} pricing tiers is allowed.`,
            },
            { status: 400 },
          );
        }

        pricingTiers =
          parsedPricingTiers.map(
            (tier) => ({
              minimumQuantity:
                Number(
                  tier?.minimumQuantity,
                ),
              unitPrice:
                Number(
                  tier?.unitPrice,
                ),
            }),
          );
      } catch {
        return NextResponse.json(
          {
            error:
              "Pricing tiers contain invalid data.",
          },
          { status: 400 },
        );
      }
    }

    // --------------------------------
    // Require pricing tiers
    // --------------------------------

    if (
      pricingTiers.length === 0
    ) {
      return NextResponse.json(
        {
          error:
            "Please provide at least one pricing tier.",
        },
        { status: 400 },
      );
    }

    // --------------------------------
    // Validate pricing tiers
    // --------------------------------

    for (const tier of pricingTiers) {
      if (
        !Number.isInteger(
          tier.minimumQuantity,
        ) ||
        tier.minimumQuantity <= 0 ||
        tier.minimumQuantity >
          MAX_QUANTITY
      ) {
        return NextResponse.json(
          {
            error:
              "Every minimum quantity must be a whole number between 1 and 1,000,000,000.",
          },
          { status: 400 },
        );
      }

      if (
        !Number.isFinite(
          tier.unitPrice,
        ) ||
        tier.unitPrice < 0 ||
        tier.unitPrice > MAX_PRICE
      ) {
        return NextResponse.json(
          {
            error:
              "Every unit price must be a valid amount between 0 and 1,000,000,000.",
          },
          { status: 400 },
        );
      }
    }

    // --------------------------------
    // Check duplicate quantities
    // --------------------------------

    const quantities =
      pricingTiers.map(
        (tier) =>
          tier.minimumQuantity,
      );

    if (
      new Set(quantities).size !==
      quantities.length
    ) {
      return NextResponse.json(
        {
          error:
            "Each pricing tier must have a different minimum quantity.",
        },
        { status: 400 },
      );
    }

    // --------------------------------
    // Sort pricing tiers
    // --------------------------------

    pricingTiers.sort(
      (a, b) =>
        a.minimumQuantity -
        b.minimumQuantity,
    );

    // --------------------------------
    // Calculate starting price
    // --------------------------------

    const calculatedStartingPrice =
      pricingTiers[0].unitPrice;

    // --------------------------------
    // Find existing product
    // --------------------------------

    const {
      data: existingProduct,
      error: existingError,
    } = await supabase
      .from("products")
      .select(
        "id, image_url",
      )
      .eq("id", id)
      .maybeSingle();

    if (existingError) {
      console.error(
        "Existing product lookup error:",
        existingError,
      );

      return NextResponse.json(
        {
          error:
            "Failed to load product.",
        },
        { status: 500 },
      );
    }

    if (!existingProduct) {
      return NextResponse.json(
        {
          error:
            "Product not found.",
        },
        { status: 404 },
      );
    }

    // --------------------------------
    // Check duplicate slug
    // --------------------------------

    const {
      data: duplicate,
      error: duplicateError,
    } = await supabase
      .from("products")
      .select("id")
      .eq("slug", slug)
      .neq("id", id)
      .maybeSingle();

    if (duplicateError) {
      console.error(
        "Duplicate slug lookup error:",
        duplicateError,
      );

      return NextResponse.json(
        {
          error:
            "Unable to validate product slug.",
        },
        { status: 500 },
      );
    }

    if (duplicate) {
      return NextResponse.json(
        {
          error:
            "Another product already uses this slug.",
        },
        { status: 409 },
      );
    }

    // --------------------------------
    // Handle image
    // --------------------------------

    let imageUrl =
      existingProduct.image_url as
        | string
        | null;

    if (image) {
      uploadedPath =
        `products/${randomUUID()}.${getExtension(image)}`;

      const buffer =
        Buffer.from(
          await image.arrayBuffer(),
        );

      const {
        error: uploadError,
      } = await supabase.storage
        .from("products")
        .upload(
          uploadedPath,
          buffer,
          {
            contentType:
              image.type,
            upsert: false,
          },
        );

      if (uploadError) {
        console.error(
          "Product image upload error:",
          uploadError,
        );

        uploadedPath = null;

        return NextResponse.json(
          {
            error:
              "Image upload failed.",
          },
          { status: 500 },
        );
      }

      const {
        data: publicUrlData,
      } = supabase.storage
        .from("products")
        .getPublicUrl(
          uploadedPath,
        );

      imageUrl =
        publicUrlData.publicUrl;
    } else if (removeImage) {
      imageUrl = null;
    }

    // --------------------------------
    // Update product
    // --------------------------------

    const {
      error: updateError,
    } = await supabase
      .from("products")
      .update({
        name,
        slug,
        category_id:
          categoryId,
        short_description:
          shortDescription || null,
        description:
          description || null,
        image_url:
          imageUrl,
        starting_price:
          calculatedStartingPrice,
        price_unit:
          priceUnit || null,
        features,
        is_published:
          isPublished,
        is_featured:
          isFeatured,
        sort_order:
          sortOrder,
        seo_title:
          seoTitle || null,
        seo_description:
          seoDescription || null,
        updated_at:
          new Date().toISOString(),
      })
      .eq("id", id);

    if (updateError) {
      console.error(
        "Product update error:",
        updateError,
      );

      if (uploadedPath) {
        try {
          await supabase.storage
            .from("products")
            .remove([
              uploadedPath,
            ]);
        } catch (cleanupError) {
          console.error(
            "New image cleanup failed:",
            cleanupError,
          );
        }

        uploadedPath = null;
      }

      return NextResponse.json(
        {
          error:
            "Failed to update product.",
        },
        { status: 500 },
      );
    }

    // --------------------------------
    // Replace pricing tiers
    // --------------------------------

    const {
      error: deleteTiersError,
    } = await supabase
      .from("product_price_tiers")
      .delete()
      .eq(
        "product_id",
        id,
      );

    if (deleteTiersError) {
      console.error(
        "Delete old pricing tiers error:",
        deleteTiersError,
      );

      return NextResponse.json(
        {
          error:
            "Product was updated, but the existing pricing tiers could not be replaced.",
        },
        { status: 500 },
      );
    }

    const tierRows =
      pricingTiers.map(
        (tier) => ({
          product_id: id,
          minimum_quantity:
            tier.minimumQuantity,
          unit_price:
            tier.unitPrice,
        }),
      );

    const {
      error: insertTiersError,
    } = await supabase
      .from("product_price_tiers")
      .insert(
        tierRows,
      );

    if (insertTiersError) {
      console.error(
        "Insert pricing tiers error:",
        insertTiersError,
      );

      return NextResponse.json(
        {
          error:
            "Product was updated, but the new pricing tiers could not be saved.",
        },
        { status: 500 },
      );
    }

    // --------------------------------
    // Delete old image
    // --------------------------------

    const oldImageUrl =
      existingProduct.image_url as
        | string
        | null;

    const shouldDeleteOldImage =
      (image || removeImage) &&
      !!oldImageUrl &&
      oldImageUrl.includes(
        "/storage/v1/object/public/products/",
      );

    if (shouldDeleteOldImage) {
      const marker =
        "/storage/v1/object/public/products/";

      const oldPath =
        oldImageUrl!.split(marker)[1];

      if (oldPath) {
        const {
          error: oldImageDeleteError,
        } = await supabase.storage
          .from("products")
          .remove([
            oldPath,
          ]);

        if (oldImageDeleteError) {
          console.error(
            "Old product image cleanup failed:",
            oldImageDeleteError,
          );
        }
      }
    }

    uploadedPath = null;

    // --------------------------------
    // Success
    // --------------------------------

    return NextResponse.json({
      success: true,
      starting_price:
        calculatedStartingPrice,
      pricing_tiers:
        pricingTiers.length,
      image_url:
        imageUrl,
    });
  } catch (error) {
    console.error(
      "Update product API error:",
      error,
    );

    if (uploadedPath) {
      try {
        const supabase =
          await createClient();

        await supabase.storage
          .from("products")
          .remove([
            uploadedPath,
          ]);
      } catch (cleanupError) {
        console.error(
          "Unexpected-error image cleanup failed:",
          cleanupError,
        );
      }
    }

    return NextResponse.json(
      {
        error:
          "Something went wrong while updating the product.",
      },
      { status: 500 },
    );
  }
}