"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NewPageAdminPage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [content, setContent] = useState("");
  const [featuredImage, setFeaturedImage] = useState("");
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [isPublished, setIsPublished] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function createSlug(value: string) {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  }

  function handleTitleChange(value: string) {
    setTitle(value);

    // Automatically create a slug while the slug is still empty.
    if (!slug) {
      setSlug(createSlug(value));
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");

    if (!title.trim()) {
      setError("Please enter a page title.");
      return;
    }

    if (!slug.trim()) {
      setError("Please enter a page slug.");
      return;
    }

    if (!content.trim()) {
      setError("Please enter page content.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch("/api/create-page", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          slug: slug.trim(),
          content: {
            type: "document",
            body: content.trim(),
          },
          featured_image: featuredImage.trim() || null,
          seo_title: seoTitle.trim() || null,
          seo_description: seoDescription.trim() || null,
          is_published: isPublished,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to create page.");
      }

      router.push("/admin/pages");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create page."
      );
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#F4F3F5] text-[#211C24]">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-8">
          <Link
            href="/admin/pages"
            className="inline-flex items-center text-sm font-medium text-[#6F6872] transition hover:text-[#6A0D8F]"
          >
            ← Back to Pages
          </Link>

          <div className="mt-5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#6A0D8F]">
              Website CMS
            </p>

            <h1 className="text-3xl font-bold tracking-tight text-[#211C24]">
              Add Page
            </h1>

            <p className="mt-2 text-sm text-[#6F6872]">
              Create a new page for the BEEBZ PRINTS website.
            </p>
          </div>
        </div>

        {/* Form Card */}
        <div className="overflow-hidden rounded-2xl border border-[#E9E6EB] bg-white shadow-[0_8px_30px_rgba(72,6,106,0.06)]">

          {/* Card Header */}
          <div className="border-b border-[#E9E6EB] px-6 py-6 sm:px-8">
            <div className="flex items-center gap-3">
              <div className="h-2.5 w-2.5 rounded-full bg-[#B000D4]" />

              <h2 className="text-lg font-semibold text-[#211C24]">
                Page Information
              </h2>
            </div>

            <p className="mt-2 text-sm text-[#6F6872]">
              Add the content and search-engine information for your page.
            </p>
          </div>

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="px-6 py-7 sm:px-8 sm:py-8"
          >
            {/* Error */}
            {error && (
              <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="space-y-7">

              {/* Title */}
              <div>
                <label
                  htmlFor="title"
                  className="mb-2 block text-sm font-semibold text-[#211C24]"
                >
                  Page Title
                </label>

                <input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(event) =>
                    handleTitleChange(event.target.value)
                  }
                  placeholder="About BEEBZ PRINTS"
                  required
                  className="w-full rounded-xl border border-[#E9E6EB] bg-[#F4F3F5] px-4 py-3.5 text-[#211C24] placeholder:text-[#6F6872] outline-none transition focus:border-[#B000D4] focus:ring-4 focus:ring-[#B000D4]/10"
                />

                <p className="mt-2 text-xs text-[#6F6872]">
                  The main title customers will see on the page.
                </p>
              </div>

              {/* Slug */}
              <div>
                <label
                  htmlFor="slug"
                  className="mb-2 block text-sm font-semibold text-[#211C24]"
                >
                  URL Slug
                </label>

                <div className="flex overflow-hidden rounded-xl border border-[#E9E6EB] bg-[#F4F3F5]">
                  <span className="flex items-center border-r border-[#E9E6EB] px-4 text-sm text-[#6F6872]">
                    /
                  </span>

                  <input
                    id="slug"
                    type="text"
                    value={slug}
                    onChange={(event) =>
                      setSlug(createSlug(event.target.value))
                    }
                    placeholder="about"
                    required
                    className="min-w-0 flex-1 bg-transparent px-4 py-3.5 text-[#211C24] placeholder:text-[#6F6872] outline-none"
                  />
                </div>

                <p className="mt-2 text-xs text-[#6F6872]">
                  Example:{" "}
                  <span className="font-medium text-[#211C24]">about</span>{" "}
                  creates the URL{" "}
                  <span className="font-medium text-[#211C24]">/about</span>.
                </p>
              </div>

              {/* Content */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label
                    htmlFor="content"
                    className="block text-sm font-semibold text-[#211C24]"
                  >
                    Page Content
                  </label>

                  <span className="text-xs text-[#6F6872]">
                    {content.length} characters
                  </span>
                </div>

                <textarea
                  id="content"
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                  placeholder="Write the main content for this page..."
                  rows={16}
                  required
                  className="min-h-[360px] w-full resize-y rounded-xl border border-[#E9E6EB] bg-[#F4F3F5] px-4 py-4 text-[15px] leading-7 text-[#211C24] placeholder:text-[#6F6872] outline-none transition focus:border-[#B000D4] focus:ring-4 focus:ring-[#B000D4]/10"
                />

                <p className="mt-2 text-xs leading-5 text-[#6F6872]">
                  Write clear, customer-friendly content. You can organize
                  longer content into paragraphs.
                </p>
              </div>

              {/* Featured Image */}
              <div>
                <label
                  htmlFor="featured_image"
                  className="mb-2 block text-sm font-semibold text-[#211C24]"
                >
                  Featured Image URL
                </label>

                <input
                  id="featured_image"
                  type="url"
                  value={featuredImage}
                  onChange={(event) =>
                    setFeaturedImage(event.target.value)
                  }
                  placeholder="https://..."
                  className="w-full rounded-xl border border-[#E9E6EB] bg-[#F4F3F5] px-4 py-3.5 text-[#211C24] placeholder:text-[#6F6872] outline-none transition focus:border-[#B000D4] focus:ring-4 focus:ring-[#B000D4]/10"
                />

                <p className="mt-2 text-xs text-[#6F6872]">
                  Optional. We will connect this to the Media CMS later.
                </p>
              </div>

              {/* SEO Section */}
              <div className="rounded-2xl border border-[#E9E6EB] bg-[#F4F3F5] p-5 sm:p-6">
                <div className="mb-5">
                  <h3 className="text-base font-semibold text-[#211C24]">
                    Search Engine Optimization
                  </h3>

                  <p className="mt-1 text-xs leading-5 text-[#6F6872]">
                    These fields help search engines understand your page.
                  </p>
                </div>

                <div className="space-y-5">

                  {/* SEO Title */}
                  <div>
                    <label
                      htmlFor="seo_title"
                      className="mb-2 block text-sm font-semibold text-[#211C24]"
                    >
                      SEO Title
                    </label>

                    <input
                      id="seo_title"
                      type="text"
                      value={seoTitle}
                      onChange={(event) =>
                        setSeoTitle(event.target.value)
                      }
                      placeholder="BEEBZ PRINTS — About Us"
                      className="w-full rounded-xl border border-[#E9E6EB] bg-white px-4 py-3.5 text-[#211C24] placeholder:text-[#6F6872] outline-none transition focus:border-[#B000D4] focus:ring-4 focus:ring-[#B000D4]/10"
                    />
                  </div>

                  {/* SEO Description */}
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <label
                        htmlFor="seo_description"
                        className="block text-sm font-semibold text-[#211C24]"
                      >
                        SEO Description
                      </label>

                      <span className="text-xs text-[#6F6872]">
                        {seoDescription.length} characters
                      </span>
                    </div>

                    <textarea
                      id="seo_description"
                      value={seoDescription}
                      onChange={(event) =>
                        setSeoDescription(event.target.value)
                      }
                      placeholder="Learn more about BEEBZ PRINTS and our printing and branding services."
                      rows={4}
                      className="w-full resize-y rounded-xl border border-[#E9E6EB] bg-white px-4 py-3.5 text-[#211C24] placeholder:text-[#6F6872] outline-none transition focus:border-[#B000D4] focus:ring-4 focus:ring-[#B000D4]/10"
                    />
                  </div>

                </div>
              </div>

              {/* Publish */}
              <div className="rounded-xl border border-[#E9E6EB] bg-white p-4">
                <div className="flex items-start gap-3">

                  <input
                    id="is_published"
                    type="checkbox"
                    checked={isPublished}
                    onChange={(event) =>
                      setIsPublished(event.target.checked)
                    }
                    className="mt-1 h-4 w-4 cursor-pointer accent-[#6A0D8F]"
                  />

                  <div>
                    <label
                      htmlFor="is_published"
                      className="cursor-pointer text-sm font-semibold text-[#211C24]"
                    >
                      Publish this page
                    </label>

                    <p className="mt-1 text-xs leading-5 text-[#6F6872]">
                      Published pages can appear on the public BEEBZ PRINTS
                      website. Leave unchecked to save as a draft.
                    </p>
                  </div>

                </div>
              </div>

            </div>

            {/* Buttons */}
            <div className="mt-8 flex flex-col gap-3 border-t border-[#E9E6EB] pt-6 sm:flex-row">

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center rounded-xl bg-[#6A0D8F] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(106,13,143,0.18)] transition hover:bg-[#48066A] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Creating..." : "Create Page"}
              </button>

              <Link
                href="/admin/pages"
                className="inline-flex items-center justify-center rounded-xl border border-[#E9E6EB] bg-[#F4F3F5] px-6 py-3.5 text-sm font-semibold text-[#211C24] transition hover:border-[#B000D4]/30 hover:bg-[#E9E6EB] hover:text-[#6A0D8F]"
              >
                Cancel
              </Link>

            </div>
          </form>
        </div>
      </div>
    </main>
  );
}