import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const MAX_REQUEST_SIZE = 12 * 1024 * 1024;
const MAX_FILE_SIZE = 10 * 1024 * 1024;

const MAX_NAME_LENGTH = 200;
const MAX_SLUG_LENGTH = 120;
const MAX_DESCRIPTION_LENGTH = 5000;
const MAX_SHORT_DESCRIPTION_LENGTH = 1000;
const MAX_PRICE_UNIT_LENGTH = 100;
const MAX_FEATURES = 100;
const MAX_FEATURE_LENGTH = 300;
const MAX_SEO_TITLE_LENGTH = 200;
const MAX_SEO_DESCRIPTION_LENGTH = 500;
const MAX_PRICING_TIERS = 100;
const MAX_QUANTITY = 1_000_000_000;
const MAX_PRICE = 1_000_000_000;
const MAX_SORT_ORDER = 1_000_000;

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const SLUG_REGEX =
  /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

type PricingTier = {
  minimum_quantity: number;
  unit_price: number;
};

function getExtensionForMimeType(
  mimeType: string,
): string {
  switch (mimeType) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    default:
      return "jpg";
  }
}

function isValidUuid(value: string): boolean {
  return UUID_REGEX.test(value);
}

export async function POST(request: Request) {
  let uploadedImagePath: string | null = null;

  try {
    // --------------------------------------------------
    // REQUEST SIZE
    // --------------------------------------------------

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
            success: false,
            message: "Request body is too large.",
          },
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

    if (
      claimsError ||
      !claimsData?.claims?.sub
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "You must be logged in.",
        },
        { status: 401 },
      );
    }

    const userId = claimsData.claims.sub;

    // --------------------------------------------------
    // ADMIN AUTHORIZATION
    // --------------------------------------------------

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
      !profile ||
      profile.role !== "admin" ||
      profile.is_active !== true
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You are not authorized to create products.",
        },
        { status: 403 },
      );
    }

    // --------------------------------------------------
    // READ FORM DATA
    // --------------------------------------------------

    const formData = await request.formData();

    const name = String(
      formData.get("name") || "",
    ).trim();

    const rawSlug = String(
      formData.get("slug") || "",
    ).trim();

    const slug = rawSlug.toLowerCase();

    const categoryId = String(
      formData.get("category_id") || "",
    ).trim();

    const shortDescription = String(
      formData.get("short_description") || "",
    ).trim();

    const description = String(
      formData.get("description") || "",
    ).trim();

    const startingPriceText = String(
      formData.get("starting_price") || "",
    ).trim();

    const priceUnit = String(
      formData.get("price_unit") || "",
    ).trim();

    const pricingTiersText = String(
      formData.get("pricing_tiers") || "[]",
    ).trim();

    const featuresText = String(
      formData.get("features") || "",
    );

    const isFeatured =
      String(formData.get("is_featured")) ===
      "true";

    const isPublished =
      String(formData.get("is_published")) ===
      "true";

    const sortOrderText = String(
      formData.get("sort_order") || "0",
    ).trim();

    const seoTitle = String(
      formData.get("seo_title") || "",
    ).trim();

    const seoDescription = String(
      formData.get("seo_description") || "",
    ).trim();

    const image = formData.get("image");

    // --------------------------------------------------
    // REQUIRED FIELDS
    // --------------------------------------------------

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          message: "Product name is required.",
        },
        { status: 400 },
      );
    }

    if (!slug) {
      return NextResponse.json(
        {
          success: false,
          message: "Product slug is required.",
        },
        { status: 400 },
      );
    }

    if (!categoryId) {
      return NextResponse.json(
        {
          success: false,
          message: "Product category is required.",
        },
        { status: 400 },
      );
    }

    // --------------------------------------------------
    // TEXT LENGTH VALIDATION
    // --------------------------------------------------

    if (name.length > MAX_NAME_LENGTH) {
      return NextResponse.json(
        {
          success: false,
          message: `Product name must be ${MAX_NAME_LENGTH} characters or fewer.`,
        },
        { status: 400 },
      );
    }

    if (slug.length > MAX_SLUG_LENGTH) {
      return NextResponse.json(
        {
          success: false,
          message: `Product slug must be ${MAX_SLUG_LENGTH} characters or fewer.`,
        },
        { status: 400 },
      );
    }

    if (!SLUG_REGEX.test(slug)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Product slug may only contain lowercase letters, numbers, and single hyphens.",
        },
        { status: 400 },
      );
    }

    if (!isValidUuid(categoryId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid product category.",
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
          success: false,
          message: `Short description must be ${MAX_SHORT_DESCRIPTION_LENGTH} characters or fewer.`,
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
          success: false,
          message: `Description must be ${MAX_DESCRIPTION_LENGTH} characters or fewer.`,
        },
        { status: 400 },
      );
    }

    if (priceUnit.length > MAX_PRICE_UNIT_LENGTH) {
      return NextResponse.json(
        {
          success: false,
          message: `Price unit must be ${MAX_PRICE_UNIT_LENGTH} characters or fewer.`,
        },
        { status: 400 },
      );
    }

    if (seoTitle.length > MAX_SEO_TITLE_LENGTH) {
      return NextResponse.json(
        {
          success: false,
          message: `SEO title must be ${MAX_SEO_TITLE_LENGTH} characters or fewer.`,
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
          success: false,
          message: `SEO description must be ${MAX_SEO_DESCRIPTION_LENGTH} characters or fewer.`,
        },
        { status: 400 },
      );
    }

    // --------------------------------------------------
    // CHECK DUPLICATE SLUG
    // --------------------------------------------------

    const {
      data: existingProduct,
      error: existingProductError,
    } = await supabase
      .from("products")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (existingProductError) {
      console.error(
        "Product slug lookup error:",
        existingProductError,
      );

      return NextResponse.json(
        {
          success: false,
          message: "Unable to validate product slug.",
        },
        { status: 500 },
      );
    }

    if (existingProduct) {
      return NextResponse.json(
        {
          success: false,
          message:
            "A product with this slug already exists.",
        },
        { status: 400 },
      );
    }

    // --------------------------------------------------
    // PRICE
    // --------------------------------------------------

    let startingPrice: number | null = null;

    if (startingPriceText) {
      const parsedPrice = Number(
        startingPriceText,
      );

      if (
        !Number.isFinite(parsedPrice) ||
        parsedPrice < 0 ||
        parsedPrice > MAX_PRICE
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Please enter a valid starting price.",
          },
          { status: 400 },
        );
      }

      startingPrice = parsedPrice;
    }

    // --------------------------------------------------
    // PRICING TIERS
    // --------------------------------------------------

    let pricingTiers: PricingTier[] = [];

    try {
      const parsedTiers = JSON.parse(
        pricingTiersText,
      );

      if (!Array.isArray(parsedTiers)) {
        throw new Error(
          "Pricing tiers must be an array.",
        );
      }

      if (
        parsedTiers.length >
        MAX_PRICING_TIERS
      ) {
        throw new Error(
          "Too many pricing tiers.",
        );
      }

      pricingTiers = parsedTiers.map(
        (tier) => ({
          minimum_quantity: Number(
            tier?.minimum_quantity,
          ),
          unit_price: Number(
            tier?.unit_price,
          ),
        }),
      );
    } catch {
      return NextResponse.json(
        {
          success: false,
          message:
            "Pricing tiers contain invalid data.",
        },
        { status: 400 },
      );
    }

    if (pricingTiers.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please add at least one pricing tier.",
        },
        { status: 400 },
      );
    }

    // --------------------------------------------------
    // VALIDATE PRICING TIERS
    // --------------------------------------------------

    for (const tier of pricingTiers) {
      if (
        !Number.isInteger(
          tier.minimum_quantity,
        ) ||
        tier.minimum_quantity <= 0 ||
        tier.minimum_quantity > MAX_QUANTITY
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Minimum quantity must be a whole number between 1 and 1,000,000,000.",
          },
          { status: 400 },
        );
      }

      if (
        !Number.isFinite(tier.unit_price) ||
        tier.unit_price < 0 ||
        tier.unit_price > MAX_PRICE
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Unit price must be a valid amount between 0 and 1,000,000,000.",
          },
          { status: 400 },
        );
      }
    }

    // --------------------------------------------------
    // CHECK DUPLICATE MINIMUM QUANTITIES
    // --------------------------------------------------

    const quantities =
      pricingTiers.map(
        (tier) => tier.minimum_quantity,
      );

    if (
      new Set(quantities).size !==
      quantities.length
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Each pricing tier must have a different minimum quantity.",
        },
        { status: 400 },
      );
    }

    // --------------------------------------------------
    // SORT PRICING TIERS
    // --------------------------------------------------

    pricingTiers.sort(
      (a, b) =>
        a.minimum_quantity -
        b.minimum_quantity,
    );

    // --------------------------------------------------
    // STARTING PRICE
    // --------------------------------------------------

    startingPrice =
      pricingTiers[0].unit_price;

    // --------------------------------------------------
    // SORT ORDER
    // --------------------------------------------------

    const sortOrder =
      Number.parseInt(
        sortOrderText,
        10,
      );

    if (
      !Number.isFinite(sortOrder) ||
      sortOrder < 0 ||
      sortOrder > MAX_SORT_ORDER
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Sort order must be a valid number between 0 and 1,000,000.",
        },
        { status: 400 },
      );
    }

    // --------------------------------------------------
    // FEATURES
    // --------------------------------------------------

    const features = featuresText
      .split("\n")
      .map((feature) =>
        feature.trim(),
      )
      .filter(Boolean);

    if (features.length > MAX_FEATURES) {
      return NextResponse.json(
        {
          success: false,
          message: `A maximum of ${MAX_FEATURES} features is allowed.`,
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
            success: false,
            message: `Each feature must be ${MAX_FEATURE_LENGTH} characters or fewer.`,
          },
          { status: 400 },
        );
      }
    }

    // --------------------------------------------------
    // IMAGE UPLOAD
    // --------------------------------------------------

    let imageUrl: string | null = null;

    if (
      image instanceof File &&
      image.size > 0
    ) {
      if (
        !ALLOWED_TYPES.includes(
          image.type as (typeof ALLOWED_TYPES)[number],
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Invalid image type. Use JPG, JPEG, PNG or WEBP.",
          },
          { status: 400 },
        );
      }

      if (image.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Image must be smaller than 10MB.",
          },
          { status: 400 },
        );
      }

      const extension =
        getExtensionForMimeType(
          image.type,
        );

      const filePath =
        `products/${crypto.randomUUID()}.${extension}`;

      const {
        error: uploadError,
      } = await supabase.storage
        .from("products")
        .upload(
          filePath,
          image,
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

        return NextResponse.json(
          {
            success: false,
            message:
              "Unable to upload product image.",
          },
          { status: 500 },
        );
      }

      uploadedImagePath = filePath;

      const {
        data: {
          publicUrl,
        },
      } = supabase.storage
        .from("products")
        .getPublicUrl(
          filePath,
        );

      imageUrl = publicUrl;
    }

    // --------------------------------------------------
    // INSERT PRODUCT
    // --------------------------------------------------

    const {
      data: product,
      error: insertError,
    } = await supabase
      .from("products")
      .insert({
        name,
        slug,
        category_id:
          categoryId || null,
        short_description:
          shortDescription || null,
        description:
          description || null,
        image_url: imageUrl,
        starting_price:
          startingPrice,
        price_unit:
          priceUnit || null,
        features,
        is_featured:
          isFeatured,
        is_published:
          isPublished,
        sort_order:
          sortOrder,
        seo_title:
          seoTitle || null,
        seo_description:
          seoDescription || null,
      })
      .select("id")
      .single();

    if (insertError) {
      console.error(
        "Product insert error:",
        insertError,
      );

      if (uploadedImagePath) {
        try {
          await supabase.storage
            .from("products")
            .remove([
              uploadedImagePath,
            ]);
        } catch (cleanupError) {
          console.error(
            "Image cleanup failed:",
            cleanupError,
          );
        }
      }

      uploadedImagePath = null;

      if (
        insertError.code ===
        "23505"
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "A product with this slug already exists.",
          },
          { status: 400 },
        );
      }

      return NextResponse.json(
        {
          success: false,
          message:
            "Unable to create product.",
        },
        { status: 500 },
      );
    }

    // --------------------------------------------------
    // INSERT PRICING TIERS
    // --------------------------------------------------

    const tierRows =
      pricingTiers.map(
        (tier) => ({
          product_id:
            product.id,
          minimum_quantity:
            tier.minimum_quantity,
          unit_price:
            tier.unit_price,
        }),
      );

    const {
      error: tierInsertError,
    } = await supabase
      .from("product_price_tiers")
      .insert(
        tierRows,
      );

    if (tierInsertError) {
      console.error(
        "Pricing tier insert failed:",
        tierInsertError,
      );

      // Delete product if pricing tiers fail.
      await supabase
        .from("products")
        .delete()
        .eq(
          "id",
          product.id,
        );

      // Delete uploaded image if one exists.
      if (uploadedImagePath) {
        try {
          await supabase.storage
            .from("products")
            .remove([
              uploadedImagePath,
            ]);
        } catch (cleanupError) {
          console.error(
            "Image cleanup after tier failure failed:",
            cleanupError,
          );
        }
      }

      uploadedImagePath = null;

      return NextResponse.json(
        {
          success: false,
          message:
            "Product could not be created because the pricing tiers could not be saved.",
        },
        { status: 500 },
      );
    }

    uploadedImagePath = null;

    return NextResponse.json({
      success: true,
      message:
        "Product created successfully.",
      productId:
        product.id,
    });
  } catch (error) {
    console.error(
      "Create product API error:",
      error,
    );

    // Best-effort cleanup if an unexpected error
    // happens after the image has been uploaded.
    if (uploadedImagePath) {
      try {
        const supabase =
          await createClient();

        await supabase.storage
          .from("products")
          .remove([
            uploadedImagePath,
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
        success: false,
        message:
          "Something went wrong while creating the product.",
      },
      { status: 500 },
    );
  }
}