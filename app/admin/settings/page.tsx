"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

type SiteSettings = {
  id: string;
  business_name: string;
  logo_url: string | null;
  favicon_url: string | null;
  hero_image_url: string | null;
  tagline: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  address: string | null;
  opening_hours: Record<string, string> | null;
  instagram_url: string | null;
  facebook_url: string | null;
  tiktok_url: string | null;
  map_url: string | null;
  default_seo_title: string | null;
  default_seo_description: string | null;
};

const emptySettings: SiteSettings = {
  id: "",
  business_name: "BEEBZ PRINTS",
  logo_url: null,
  favicon_url: null,
  hero_image_url: null,
  tagline: "Bring your ideas to life.",
  phone: null,
  whatsapp: null,
  email: null,
  address: null,
  opening_hours: {},
  instagram_url: null,
  facebook_url: null,
  tiktok_url: null,
  map_url: null,
  default_seo_title: null,
  default_seo_description: null,
};

function SettingsCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-[#E9E6EB] bg-white p-6 shadow-[0_8px_30px_rgba(72,6,106,0.06)] sm:p-8">
      <div className="mb-6">
        <h2 className="text-xl font-semibold">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-[#6F6872]">
          {description}
        </p>
      </div>
      {children}
    </section>
  );
}

export default function SettingsPage() {
  const [settings, setSettings] =
    useState<SiteSettings>(emptySettings);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [uploadingHero, setUploadingHero] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch("/api/get-settings");
        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.error || "Failed to load settings.",
          );
        }

        if (result.settings) {
          setSettings({
            ...emptySettings,
            ...result.settings,
            opening_hours:
              result.settings.opening_hours || {},
          });
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load settings.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
  }, []);

  function updateField(
    field: keyof SiteSettings,
    value: string,
  ) {
    setSettings((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function updateOpeningHour(
    day: string,
    value: string,
  ) {
    setSettings((current) => ({
      ...current,
      opening_hours: {
        ...(current.opening_hours || {}),
        [day]: value,
      },
    }));
  }

  async function handleBrandImageUpload(
    file: File,
    field: "logo_url" | "favicon_url",
  ) {
    if (!file) return;

    setError("");
    setSuccess("");

    if (!file.type.startsWith("image/") && file.type !== "image/x-icon") {
      setError("Please select an image file.");
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setError("Image must be 8MB or smaller.");
      return;
    }

    if (!settings.id) {
      setError("Site settings are not loaded yet.");
      return;
    }

    const isLogo = field === "logo_url";
    const setUploading = isLogo ? setUploadingLogo : setUploadingFavicon;
    const label = isLogo ? "Logo" : "Favicon";

    try {
      setUploading(true);

      const supabase = createClient();

      const extension =
        file.name.split(".").pop()?.toLowerCase() ||
        (file.type === "image/x-icon" ? "ico" : "png");

      const filePath = `site-settings/${isLogo ? "logo" : "favicon"}-${Date.now()}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from("media")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type,
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data: publicUrlData } = supabase.storage
        .from("media")
        .getPublicUrl(filePath);

      const imageUrl = publicUrlData.publicUrl;

      const { error: updateError } = await supabase
        .from("site_settings")
        .update({ [field]: imageUrl })
        .eq("id", settings.id);

      if (updateError) {
        throw updateError;
      }

      setSettings((current) => ({
        ...current,
        [field]: imageUrl,
      }));

      setSuccess(`${label} uploaded successfully.`);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : `Failed to upload ${label.toLowerCase()}.`,
      );
    } finally {
      setUploading(false);
    }
  }

  async function removeBrandImage(field: "logo_url" | "favicon_url") {
    if (!settings.id) return;

    setError("");
    setSuccess("");

    const isLogo = field === "logo_url";
    const setUploading = isLogo ? setUploadingLogo : setUploadingFavicon;
    const label = isLogo ? "Logo" : "Favicon";

    try {
      setUploading(true);

      const supabase = createClient();

      const { error: updateError } = await supabase
        .from("site_settings")
        .update({ [field]: null })
        .eq("id", settings.id);

      if (updateError) {
        throw updateError;
      }

      setSettings((current) => ({
        ...current,
        [field]: null,
      }));

      setSuccess(`${label} removed.`);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : `Failed to remove ${label.toLowerCase()}.`,
      );
    } finally {
      setUploading(false);
    }
  }

  async function handleHeroUpload(file: File) {
    if (!file) return;

    setError("");
    setSuccess("");

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setError("Hero image must be 8MB or smaller.");
      return;
    }

    if (!settings.id) {
      setError("Site settings are not loaded yet.");
      return;
    }

    try {
      setUploadingHero(true);

      const supabase = createClient();

      const extension =
        file.name.split(".").pop()?.toLowerCase() || "jpg";

      const filePath = `site-settings/hero-${Date.now()}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from("media")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type,
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data: publicUrlData } = supabase.storage
        .from("media")
        .getPublicUrl(filePath);

      const heroUrl = publicUrlData.publicUrl;

      const { error: updateError } = await supabase
        .from("site_settings")
        .update({ hero_image_url: heroUrl })
        .eq("id", settings.id);

      if (updateError) {
        throw updateError;
      }

      setSettings((current) => ({
        ...current,
        hero_image_url: heroUrl,
      }));

      setSuccess("Hero image uploaded successfully.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to upload hero image.",
      );
    } finally {
      setUploadingHero(false);
    }
  }

  async function removeHeroImage() {
    if (!settings.id) return;

    setError("");
    setSuccess("");

    try {
      setUploadingHero(true);

      const supabase = createClient();

      const { error: updateError } = await supabase
        .from("site_settings")
        .update({ hero_image_url: null })
        .eq("id", settings.id);

      if (updateError) {
        throw updateError;
      }

      setSettings((current) => ({
        ...current,
        hero_image_url: null,
      }));

      setSuccess("Hero image removed.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to remove hero image.",
      );
    } finally {
      setUploadingHero(false);
    }
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!settings.business_name.trim()) {
      setError("Business name is required.");
      return;
    }

    try {
      setSaving(true);

      const response = await fetch("/api/update-settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          business_name: settings.business_name.trim(),
          logo_url: settings.logo_url?.trim() || null,
          favicon_url: settings.favicon_url?.trim() || null,
          hero_image_url:
            settings.hero_image_url?.trim() || null,
          tagline: settings.tagline?.trim() || null,
          phone: settings.phone?.trim() || null,
          whatsapp: settings.whatsapp?.trim() || null,
          email: settings.email?.trim() || null,
          address: settings.address?.trim() || null,
          opening_hours: settings.opening_hours || {},
          instagram_url:
            settings.instagram_url?.trim() || null,
          facebook_url:
            settings.facebook_url?.trim() || null,
          tiktok_url:
            settings.tiktok_url?.trim() || null,
          map_url: settings.map_url?.trim() || null,
          default_seo_title:
            settings.default_seo_title?.trim() || null,
          default_seo_description:
            settings.default_seo_description?.trim() || null,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Failed to save settings.",
        );
      }

      if (result.settings) {
        setSettings({
          ...emptySettings,
          ...result.settings,
          opening_hours:
            result.settings.opening_hours || {},
        });
      }

      setSuccess("Site settings saved successfully.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to save settings.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F4F3F5] p-6 text-[#211C24]">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-2xl border border-[#E9E6EB] bg-white p-8 shadow-[0_8px_30px_rgba(72,6,106,0.05)]">
            <p className="text-[#6F6872]">
              Loading site settings...
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F4F3F5] px-4 py-8 text-[#211C24] sm:px-6">
      <div className="mx-auto max-w-5xl">

        {/* Back to Dashboard */}
        <div className="mb-6">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 rounded-lg border border-[#E9E6EB] bg-white px-4 py-2 text-sm font-medium text-[#211C24] shadow-sm transition hover:border-[#B000D4]/30 hover:bg-[#E9E6EB] hover:text-[#48066A]"
          >
            ← Back to Dashboard
          </Link>
        </div>

        {/* Header */}
        <div className="mb-8 rounded-2xl bg-gradient-to-br from-[#48066A] via-[#6A0D8F] to-[#B000D4] p-7 text-white shadow-[0_12px_35px_rgba(72,6,106,0.18)] sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/70">
            BEEBZ PRINTS CMS
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            Site Settings
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/75">
            Manage the global information displayed across the BEEBZ PRINTS website.
          </p>
        </div>

        {/* Settings overview */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">

          {/* Business */}
          <div className="rounded-xl border border-[#E9E6EB] bg-white p-5 shadow-[0_5px_20px_rgba(72,6,106,0.04)]">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6F6872]">
              Business
            </p>

            <p className="mt-2 truncate text-lg font-semibold">
              {settings.business_name || "Not set"}
            </p>

            <p className="mt-1 text-sm text-[#6F6872]">
              {settings.tagline || "No tagline set"}
            </p>
          </div>

          {/* Contact */}
          <div className="rounded-xl border border-[#E9E6EB] bg-white p-5 shadow-[0_5px_20px_rgba(72,6,106,0.04)]">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6F6872]">
              Contact
            </p>

            <p className="mt-2 text-lg font-semibold">
              {settings.phone || "Phone not set"}
            </p>

            <p className="mt-1 truncate text-sm text-[#6F6872]">
              {settings.email || "Email not set"}
            </p>
          </div>

          {/* Website */}
          <div className="overflow-hidden rounded-xl border border-[#E9E6EB] bg-white shadow-[0_5px_20px_rgba(72,6,106,0.07)]">
            <div className="relative h-32 w-full bg-[#F4F3F5]">
              {settings.hero_image_url ? (
                <>
                  <Image
                    src={settings.hero_image_url}
                    alt="BEEBZ PRINTS Hero preview"
                    fill
                    unoptimized
                    className="object-cover"
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-[#211C24]/70 via-transparent to-transparent" />

                  <div className="absolute bottom-3 left-4">
                    <span className="rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#48066A] shadow-sm">
                      Hero Image Ready
                    </span>
                  </div>
                </>
              ) : (
                <div className="flex h-full items-center justify-center bg-gradient-to-br from-[#F4F3F5] to-[#E9E6EB]">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#6A0D8F]/10 text-xl">
                    🖼️
                  </div>
                </div>
              )}
            </div>

            <div className="p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6A0D8F]">
                Website
              </p>

              <div className="mt-3">
                <p className="text-base font-semibold text-[#211C24]">
                  {settings.hero_image_url
                    ? "Hero image configured"
                    : "Hero image not set"}
                </p>

                <p className="mt-1 text-sm text-[#6F6872]">
                  {settings.logo_url
                    ? "Logo configured"
                    : "Logo not configured"}
                </p>
              </div>

              <a
                href="#hero-image"
                className="mt-4 inline-flex items-center gap-2 rounded-lg border border-[#E9E6EB] bg-[#F4F3F5] px-3.5 py-2 text-xs font-semibold text-[#48066A] transition hover:border-[#B000D4]/40 hover:bg-[#E9E6EB]"
              >
                {settings.hero_image_url
                  ? "Manage Hero Image"
                  : "Set Hero Image"}
                <span>→</span>
              </a>
            </div>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 rounded-xl border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-[#287A42]">
            {success}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          {/* Business Information */}
          <SettingsCard
            title="Business Information"
            description="Basic information about your printing business."
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-[#211C24]">
                  Business Name
                </label>

                <input
                  type="text"
                  value={settings.business_name}
                  onChange={(event) =>
                    updateField(
                      "business_name",
                      event.target.value,
                    )
                  }
                  className="w-full rounded-xl border border-[#E9E6EB] bg-[#F4F3F5] px-4 py-3 text-[#211C24] outline-none transition placeholder:text-[#6F6872] focus:border-[#B000D4] focus:ring-2 focus:ring-[#B000D4]/10"
                  placeholder="BEEBZ PRINTS"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[#211C24]">
                  Tagline
                </label>

                <input
                  type="text"
                  value={settings.tagline || ""}
                  onChange={(event) =>
                    updateField(
                      "tagline",
                      event.target.value,
                    )
                  }
                  className="w-full rounded-xl border border-[#E9E6EB] bg-[#F4F3F5] px-4 py-3 text-[#211C24] outline-none transition placeholder:text-[#6F6872] focus:border-[#B000D4] focus:ring-2 focus:ring-[#B000D4]/10"
                  placeholder="Bring your ideas to life."
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[#211C24]">
                  Logo
                </label>

                <div className="rounded-xl border border-[#E9E6EB] bg-[#F4F3F5] p-4">
                  {settings.logo_url ? (
                    <div className="mb-4 flex items-center gap-4">
                      <div className="relative h-16 w-32 overflow-hidden rounded-lg border border-[#E9E6EB] bg-white">
                        <Image
                          src={settings.logo_url}
                          alt="BEEBZ PRINTS Logo preview"
                          fill
                          unoptimized
                          className="object-contain p-2"
                        />
                      </div>

                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#211C24]">
                          Logo configured
                        </p>
                        <p className="mt-1 truncate text-xs text-[#6F6872]">
                          Stored in Supabase Storage
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="mb-4 text-sm text-[#6F6872]">
                      No logo uploaded yet.
                    </p>
                  )}

                  <div className="flex flex-wrap gap-3">
                    <label className="inline-flex cursor-pointer items-center justify-center rounded-lg bg-[#6A0D8F] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#48066A]">
                      {uploadingLogo
                        ? "Uploading..."
                        : settings.logo_url
                          ? "Replace Logo"
                          : "Upload Logo"}

                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/svg+xml"
                        className="hidden"
                        disabled={uploadingLogo}
                        onChange={(event) => {
                          const file = event.target.files?.[0];

                          if (file) {
                            handleBrandImageUpload(file, "logo_url");
                          }

                          event.currentTarget.value = "";
                        }}
                      />
                    </label>

                    {settings.logo_url && (
                      <button
                        type="button"
                        onClick={() => removeBrandImage("logo_url")}
                        disabled={uploadingLogo}
                        className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="mt-4">
                    <label className="mb-2 block text-xs font-medium text-[#6F6872]">
                      Or use a Logo URL
                    </label>
                    <input
                      type="url"
                      value={settings.logo_url || ""}
                      onChange={(event) =>
                        updateField("logo_url", event.target.value)
                      }
                      className="w-full rounded-xl border border-[#E9E6EB] bg-white px-4 py-3 text-sm text-[#211C24] outline-none transition placeholder:text-[#6F6872] focus:border-[#B000D4] focus:ring-2 focus:ring-[#B000D4]/10"
                      placeholder="https://..."
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[#211C24]">
                  Favicon
                </label>

                <div className="rounded-xl border border-[#E9E6EB] bg-[#F4F3F5] p-4">
                  {settings.favicon_url ? (
                    <div className="mb-4 flex items-center gap-4">
                      <div className="relative h-16 w-16 overflow-hidden rounded-lg border border-[#E9E6EB] bg-white">
                        <Image
                          src={settings.favicon_url}
                          alt="BEEBZ PRINTS Favicon preview"
                          fill
                          unoptimized
                          className="object-contain p-2"
                        />
                      </div>

                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#211C24]">
                          Favicon configured
                        </p>
                        <p className="mt-1 truncate text-xs text-[#6F6872]">
                          Used for the browser tab icon
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="mb-4 text-sm text-[#6F6872]">
                      No favicon uploaded yet.
                    </p>
                  )}

                  <div className="flex flex-wrap gap-3">
                    <label className="inline-flex cursor-pointer items-center justify-center rounded-lg bg-[#6A0D8F] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#48066A]">
                      {uploadingFavicon
                        ? "Uploading..."
                        : settings.favicon_url
                          ? "Replace Favicon"
                          : "Upload Favicon"}

                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/x-icon,.ico"
                        className="hidden"
                        disabled={uploadingFavicon}
                        onChange={(event) => {
                          const file = event.target.files?.[0];

                          if (file) {
                            handleBrandImageUpload(file, "favicon_url");
                          }

                          event.currentTarget.value = "";
                        }}
                      />
                    </label>

                    {settings.favicon_url && (
                      <button
                        type="button"
                        onClick={() => removeBrandImage("favicon_url")}
                        disabled={uploadingFavicon}
                        className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="mt-4">
                    <label className="mb-2 block text-xs font-medium text-[#6F6872]">
                      Or use a Favicon URL
                    </label>
                    <input
                      type="url"
                      value={settings.favicon_url || ""}
                      onChange={(event) =>
                        updateField("favicon_url", event.target.value)
                      }
                      className="w-full rounded-xl border border-[#E9E6EB] bg-white px-4 py-3 text-sm text-[#211C24] outline-none transition placeholder:text-[#6F6872] focus:border-[#B000D4] focus:ring-2 focus:ring-[#B000D4]/10"
                      placeholder="https://..."
                    />
                  </div>
                </div>
              </div>

            </div>
          </SettingsCard>

          {/* Hero Image */}
          <section
            id="hero-image"
            className="scroll-mt-6 rounded-2xl border border-[#E9E6EB] bg-white p-6 shadow-[0_8px_30px_rgba(72,6,106,0.06)] sm:p-8"
          >
            <div className="mb-6">
              <h2 className="text-xl font-semibold">
                Hero Image
              </h2>

              <p className="mt-1 text-sm text-[#6F6872]">
                This image is used only in the main Hero section of the
                website. It is separate from your Gallery and Product images.
              </p>
            </div>

            {settings.hero_image_url ? (
              <div className="overflow-hidden rounded-2xl border border-[#E9E6EB] bg-[#F4F3F5] shadow-[0_6px_24px_rgba(72,6,106,0.05)]">
                <div className="relative aspect-[16/7] w-full">
                  <Image
                    src={settings.hero_image_url}
                    alt="BEEBZ PRINTS Hero"
                    fill
                    unoptimized
                    className="object-cover"
                  />
                </div>

                <div className="flex flex-col gap-3 border-t border-[#E9E6EB] bg-white/80 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-[#6F6872]">
                    Current Hero image
                  </p>

                  <div className="flex flex-wrap gap-3">
                    <label className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-[#E9E6EB] bg-white px-4 py-2.5 text-sm font-semibold text-[#211C24] shadow-sm transition hover:border-[#B000D4]/30 hover:bg-[#E9E6EB]">
                      {uploadingHero ? "Uploading..." : "Replace Image"}

                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/avif"
                        className="hidden"
                        disabled={uploadingHero}
                        onChange={(event) => {
                          const file = event.target.files?.[0];

                          if (file) {
                            handleHeroUpload(file);
                          }

                          event.currentTarget.value = "";
                        }}
                      />
                    </label>

                    <button
                      type="button"
                      onClick={removeHeroImage}
                      disabled={uploadingHero}
                      className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <label className="group flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-[#E9E6EB] bg-[#F4F3F5] px-6 py-14 text-center transition hover:border-[#B000D4]/50 hover:bg-[#E9E6EB]">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#6A0D8F]/10 text-2xl">
                  🖼️
                </div>

                <p className="font-semibold">
                  {uploadingHero
                    ? "Uploading Hero image..."
                    : "Upload Hero image"}
                </p>

                <p className="mt-2 max-w-md text-sm text-[#6F6872]">
                  Recommended: wide landscape image. JPG, PNG, WebP or AVIF,
                  maximum 8MB.
                </p>

                <span className="mt-5 rounded-lg bg-[#6A0D8F] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_6px_16px_rgba(106,13,143,0.2)] transition group-hover:bg-[#48066A]">
                  Choose Image
                </span>

                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  className="hidden"
                  disabled={uploadingHero}
                  onChange={(event) => {
                    const file = event.target.files?.[0];

                    if (file) {
                      handleHeroUpload(file);
                    }

                    event.currentTarget.value = "";
                  }}
                />
              </label>
            )}
          </section>

          {/* Contact */}
          <SettingsCard
            title="Contact Information"
            description="Contact details customers can use to reach you."
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-[#211C24]">
                  Phone
                </label>

                <input
                  type="tel"
                  value={settings.phone || ""}
                  onChange={(event) =>
                    updateField(
                      "phone",
                      event.target.value,
                    )
                  }
                  className="w-full rounded-xl border border-[#E9E6EB] bg-[#F4F3F5] px-4 py-3 text-[#211C24] outline-none transition focus:border-[#B000D4] focus:ring-2 focus:ring-[#B000D4]/10"
                  placeholder="+233..."
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[#211C24]">
                  WhatsApp
                </label>

                <input
                  type="tel"
                  value={settings.whatsapp || ""}
                  onChange={(event) =>
                    updateField(
                      "whatsapp",
                      event.target.value,
                    )
                  }
                  className="w-full rounded-xl border border-[#E9E6EB] bg-[#F4F3F5] px-4 py-3 text-[#211C24] outline-none transition focus:border-[#B000D4] focus:ring-2 focus:ring-[#B000D4]/10"
                  placeholder="+233..."
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[#211C24]">
                  Email
                </label>

                <input
                  type="email"
                  value={settings.email || ""}
                  onChange={(event) =>
                    updateField(
                      "email",
                      event.target.value,
                    )
                  }
                  className="w-full rounded-xl border border-[#E9E6EB] bg-[#F4F3F5] px-4 py-3 text-[#211C24] outline-none transition focus:border-[#B000D4] focus:ring-2 focus:ring-[#B000D4]/10"
                  placeholder="hello@beebzprints.com"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[#211C24]">
                  Address
                </label>

                <input
                  type="text"
                  value={settings.address || ""}
                  onChange={(event) =>
                    updateField(
                      "address",
                      event.target.value,
                    )
                  }
                  className="w-full rounded-xl border border-[#E9E6EB] bg-[#F4F3F5] px-4 py-3 text-[#211C24] outline-none transition focus:border-[#B000D4] focus:ring-2 focus:ring-[#B000D4]/10"
                  placeholder="Your business address"
                />
              </div>
            </div>
          </SettingsCard>

          {/* Opening Hours */}
          <SettingsCard
            title="Opening Hours"
            description="Set the hours displayed on the website."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                "Monday",
                "Tuesday",
                "Wednesday",
                "Thursday",
                "Friday",
                "Saturday",
                "Sunday",
              ].map((day) => (
                <div key={day}>
                  <label className="mb-2 block text-sm font-medium text-[#211C24]">
                    {day}
                  </label>

                  <input
                    type="text"
                    value={
                      settings.opening_hours?.[day] || ""
                    }
                    onChange={(event) =>
                      updateOpeningHour(
                        day,
                        event.target.value,
                      )
                    }
                    className="w-full rounded-xl border border-[#E9E6EB] bg-[#F4F3F5] px-4 py-3 text-[#211C24] outline-none transition focus:border-[#B000D4] focus:ring-2 focus:ring-[#B000D4]/10"
                    placeholder="8:00 AM - 5:00 PM"
                  />
                </div>
              ))}
            </div>
          </SettingsCard>

          {/* Social Media */}
          <SettingsCard
            title="Social Media & Maps"
            description="Add your social media and location links."
          >
            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-[#211C24]">
                  Instagram URL
                </label>

                <input
                  type="url"
                  value={settings.instagram_url || ""}
                  onChange={(event) =>
                    updateField(
                      "instagram_url",
                      event.target.value,
                    )
                  }
                  className="w-full rounded-xl border border-[#E9E6EB] bg-[#F4F3F5] px-4 py-3 text-[#211C24] outline-none transition focus:border-[#B000D4] focus:ring-2 focus:ring-[#B000D4]/10"
                  placeholder="https://instagram.com/..."
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[#211C24]">
                  Facebook URL
                </label>

                <input
                  type="url"
                  value={settings.facebook_url || ""}
                  onChange={(event) =>
                    updateField(
                      "facebook_url",
                      event.target.value,
                    )
                  }
                  className="w-full rounded-xl border border-[#E9E6EB] bg-[#F4F3F5] px-4 py-3 text-[#211C24] outline-none transition focus:border-[#B000D4] focus:ring-2 focus:ring-[#B000D4]/10"
                  placeholder="https://facebook.com/..."
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[#211C24]">
                  TikTok URL
                </label>

                <input
                  type="url"
                  value={settings.tiktok_url || ""}
                  onChange={(event) =>
                    updateField(
                      "tiktok_url",
                      event.target.value,
                    )
                  }
                  className="w-full rounded-xl border border-[#E9E6EB] bg-[#F4F3F5] px-4 py-3 text-[#211C24] outline-none transition focus:border-[#B000D4] focus:ring-2 focus:ring-[#B000D4]/10"
                  placeholder="https://tiktok.com/@..."
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[#211C24]">
                  Google Maps URL
                </label>

                <input
                  type="url"
                  value={settings.map_url || ""}
                  onChange={(event) =>
                    updateField(
                      "map_url",
                      event.target.value,
                    )
                  }
                  className="w-full rounded-xl border border-[#E9E6EB] bg-[#F4F3F5] px-4 py-3 text-[#211C24] outline-none transition focus:border-[#B000D4] focus:ring-2 focus:ring-[#B000D4]/10"
                  placeholder="https://maps.google.com/..."
                />
              </div>
            </div>
          </SettingsCard>

          {/* SEO */}
          <SettingsCard
            title="Default SEO"
            description="Default search-engine information for the website."
          >
            <div>
              <label className="mb-2 block text-sm font-medium text-[#211C24]">
                Default SEO Title
              </label>

              <input
                type="text"
                value={
                  settings.default_seo_title || ""
                }
                onChange={(event) =>
                  updateField(
                    "default_seo_title",
                    event.target.value,
                  )
                }
                className="w-full rounded-xl border border-[#E9E6EB] bg-[#F4F3F5] px-4 py-3 text-[#211C24] outline-none transition focus:border-[#B000D4] focus:ring-2 focus:ring-[#B000D4]/10"
                placeholder="BEEBZ PRINTS | Printing & Branding"
              />
            </div>

            <div className="mt-5">
              <label className="mb-2 block text-sm font-medium text-[#211C24]">
                Default SEO Description
              </label>

              <textarea
                value={
                  settings.default_seo_description || ""
                }
                onChange={(event) =>
                  updateField(
                    "default_seo_description",
                    event.target.value,
                  )
                }
                rows={4}
                className="w-full resize-y rounded-xl border border-[#E9E6EB] bg-[#F4F3F5] px-4 py-3 text-[#211C24] outline-none transition focus:border-[#B000D4] focus:ring-2 focus:ring-[#B000D4]/10"
                placeholder="Professional printing and branding services..."
              />
            </div>
          </SettingsCard>

          {/* Save */}
          <div className="flex justify-end pb-8">
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-gradient-to-r from-[#6A0D8F] to-[#B000D4] px-7 py-3 font-semibold text-white shadow-[0_8px_22px_rgba(106,13,143,0.24)] transition hover:from-[#48066A] hover:to-[#6A0D8F] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving
                ? "Saving Settings..."
                : "Save Settings"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}