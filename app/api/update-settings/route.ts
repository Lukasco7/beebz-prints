import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const MAX_BODY_SIZE = 32 * 1024;

const MAX_LENGTHS = {
  business_name: 200,
  logo_url: 2000,
  favicon_url: 2000,
  tagline: 500,
  phone: 30,
  whatsapp: 30,
  email: 254,
  address: 500,
  instagram_url: 2000,
  facebook_url: 2000,
  tiktok_url: 2000,
  map_url: 2000,
  default_seo_title: 200,
  default_seo_description: 500,
} as const;

const EMAIL_REGEX =
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);

    return (
      url.protocol === "http:" ||
      url.protocol === "https:"
    );
  } catch {
    return false;
  }
}

function validateOptionalUrl(
  value: string,
  fieldName: string,
) {
  if (!value) {
    return null;
  }

  if (!isValidHttpUrl(value)) {
    return `${fieldName} must be a valid HTTP or HTTPS URL.`;
  }

  return null;
}

export async function POST(request: Request) {
  try {
    // --------------------------------------------------
    // REQUEST SIZE
    // --------------------------------------------------

    const contentLength = request.headers.get("content-length");

    if (contentLength) {
      const size = Number(contentLength);

      if (!Number.isFinite(size) || size > MAX_BODY_SIZE) {
        return NextResponse.json(
          { error: "Request body is too large." },
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
    // READ REQUEST BODY
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

    // --------------------------------------------------
    // READ AND NORMALIZE FIELDS
    // --------------------------------------------------

    const businessName = String(
      body.business_name ?? "",
    ).trim();

    const logoUrl = String(
      body.logo_url ?? "",
    ).trim();

    const faviconUrl = String(
      body.favicon_url ?? "",
    ).trim();

    const tagline = String(
      body.tagline ?? "",
    ).trim();

    const phone = String(
      body.phone ?? "",
    ).trim();

    const whatsapp = String(
      body.whatsapp ?? "",
    ).trim();

    const email = String(
      body.email ?? "",
    ).trim();

    const address = String(
      body.address ?? "",
    ).trim();

    const instagramUrl = String(
      body.instagram_url ?? "",
    ).trim();

    const facebookUrl = String(
      body.facebook_url ?? "",
    ).trim();

    const tiktokUrl = String(
      body.tiktok_url ?? "",
    ).trim();

    const mapUrl = String(
      body.map_url ?? "",
    ).trim();

    const defaultSeoTitle = String(
      body.default_seo_title ?? "",
    ).trim();

    const defaultSeoDescription = String(
      body.default_seo_description ?? "",
    ).trim();

    // --------------------------------------------------
    // REQUIRED FIELD
    // --------------------------------------------------

    if (!businessName) {
      return NextResponse.json(
        { error: "Business name is required." },
        { status: 400 },
      );
    }

    // --------------------------------------------------
    // FIELD LENGTH VALIDATION
    // --------------------------------------------------

    const fields = {
      business_name: businessName,
      logo_url: logoUrl,
      favicon_url: faviconUrl,
      tagline,
      phone,
      whatsapp,
      email,
      address,
      instagram_url: instagramUrl,
      facebook_url: facebookUrl,
      tiktok_url: tiktokUrl,
      map_url: mapUrl,
      default_seo_title: defaultSeoTitle,
      default_seo_description: defaultSeoDescription,
    };

    for (const [field, value] of Object.entries(fields)) {
      const maxLength =
        MAX_LENGTHS[field as keyof typeof MAX_LENGTHS];

      if (value.length > maxLength) {
        return NextResponse.json(
          {
            error: `${field.replaceAll(
              "_",
              " ",
            )} must be ${maxLength} characters or fewer.`,
          },
          { status: 400 },
        );
      }
    }

    // --------------------------------------------------
    // EMAIL VALIDATION
    // --------------------------------------------------

    if (email && !EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { error: "Invalid email address." },
        { status: 400 },
      );
    }

    // --------------------------------------------------
    // URL VALIDATION
    // --------------------------------------------------

    const urlFields = [
      ["logo_url", logoUrl],
      ["favicon_url", faviconUrl],
      ["instagram_url", instagramUrl],
      ["facebook_url", facebookUrl],
      ["tiktok_url", tiktokUrl],
      ["map_url", mapUrl],
    ] as const;

    for (const [fieldName, value] of urlFields) {
      const urlError = validateOptionalUrl(
        value,
        fieldName,
      );

      if (urlError) {
        return NextResponse.json(
          { error: urlError },
          { status: 400 },
        );
      }
    }

    // --------------------------------------------------
    // OPENING HOURS VALIDATION
    // --------------------------------------------------

    const openingHours =
      body.opening_hours &&
      typeof body.opening_hours === "object" &&
      !Array.isArray(body.opening_hours)
        ? body.opening_hours
        : {};

    // --------------------------------------------------
    // SETTINGS DATA
    // --------------------------------------------------

    const settingsData = {
      business_name: businessName,
      logo_url: logoUrl || null,
      favicon_url: faviconUrl || null,
      tagline: tagline || null,
      phone: phone || null,
      whatsapp: whatsapp || null,
      email: email || null,
      address: address || null,
      opening_hours: openingHours,
      instagram_url: instagramUrl || null,
      facebook_url: facebookUrl || null,
      tiktok_url: tiktokUrl || null,
      map_url: mapUrl || null,
      default_seo_title: defaultSeoTitle || null,
      default_seo_description:
        defaultSeoDescription || null,
      updated_at: new Date().toISOString(),
    };

    // --------------------------------------------------
    // GET EXISTING SETTINGS ROW
    // --------------------------------------------------

    const {
      data: existingSettings,
      error: existingError,
    } = await supabase
      .from("site_settings")
      .select("id")
      .limit(1)
      .maybeSingle();

    if (existingError) {
      console.error(
        "Existing settings lookup error:",
        existingError,
      );

      return NextResponse.json(
        { error: "Failed to load site settings." },
        { status: 500 },
      );
    }

    let settings;

    // --------------------------------------------------
    // UPDATE EXISTING SETTINGS
    // --------------------------------------------------

    if (existingSettings) {
      const {
        data,
        error: updateError,
      } = await supabase
        .from("site_settings")
        .update(settingsData)
        .eq("id", existingSettings.id)
        .select(`
          id,
          business_name,
          logo_url,
          favicon_url,
          tagline,
          phone,
          whatsapp,
          email,
          address,
          opening_hours,
          instagram_url,
          facebook_url,
          tiktok_url,
          map_url,
          default_seo_title,
          default_seo_description
        `)
        .single();

      if (updateError) {
        console.error(
          "Supabase update settings error:",
          updateError,
        );

        return NextResponse.json(
          { error: "Failed to update site settings." },
          { status: 500 },
        );
      }

      settings = data;
    } else {
      // --------------------------------------------------
      // CREATE SETTINGS ROW
      // --------------------------------------------------

      const {
        data,
        error: insertError,
      } = await supabase
        .from("site_settings")
        .insert(settingsData)
        .select(`
          id,
          business_name,
          logo_url,
          favicon_url,
          tagline,
          phone,
          whatsapp,
          email,
          address,
          opening_hours,
          instagram_url,
          facebook_url,
          tiktok_url,
          map_url,
          default_seo_title,
          default_seo_description
        `)
        .single();

      if (insertError) {
        console.error(
          "Supabase create settings error:",
          insertError,
        );

        return NextResponse.json(
          { error: "Failed to create site settings." },
          { status: 500 },
        );
      }

      settings = data;
    }

    return NextResponse.json({
      success: true,
      settings,
    });
  } catch (error) {
    console.error(
      "Update settings API error:",
      error,
    );

    return NextResponse.json(
      { error: "Failed to save site settings." },
      { status: 500 },
    );
  }
}