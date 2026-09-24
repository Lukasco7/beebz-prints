"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type PageData = {
  id: string;
  title: string;
  slug: string;
  content: {
    type?: string;
    body?: string;
    [key: string]: unknown;
  } | null;
  featured_image: string | null;
  seo_title: string | null;
  seo_description: string | null;
  is_published: boolean;
};

export default function EditPage() {
  const params = useParams();
  const router = useRouter();

  const pageId = params.id as string;

  const [page, setPage] = useState<PageData | null>(null);

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [content, setContent] = useState("");
  const [featuredImage, setFeaturedImage] = useState("");
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [isPublished, setIsPublished] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadPage() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(`/api/get-page?id=${pageId}`);

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Failed to load page.");
        }

        const loadedPage: PageData = result.page;

        setPage(loadedPage);
        setTitle(loadedPage.title || "");
        setSlug(loadedPage.slug || "");
        setContent(
          typeof loadedPage.content?.body === "string"
            ? loadedPage.content.body
            : ""
        );
        setFeaturedImage(loadedPage.featured_image || "");
        setSeoTitle(loadedPage.seo_title || "");
        setSeoDescription(loadedPage.seo_description || "");
        setIsPublished(loadedPage.is_published === true);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load page."
        );
      } finally {
        setLoading(false);
      }
    }

    if (pageId) {
      loadPage();
    }
  }, [pageId]);

  function generateSlug(value: string) {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");

    if (!title.trim()) {
      setError("Page title is required.");
      return;
    }

    if (!slug.trim()) {
      setError("Page slug is required.");
      return;
    }

    if (!content.trim()) {
      setError("Page content is required.");
      return;
    }

    try {
      setSaving(true);

      const response = await fetch("/api/update-page", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: pageId,
          title: title.trim(),
          slug: generateSlug(slug),
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
        throw new Error(
          result.error || "Failed to update page."
        );
      }

      router.push("/admin/pages");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update page."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F4F3F5] p-6 text-[#211C24]">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-2xl border border-[#E9E6EB] bg-white p-8 shadow-[0_8px_30px_rgba(72,6,106,0.06)]">
            <p className="text-[#6F6872]">
              Loading page...
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (!page) {
    return (
      <main className="min-h-screen bg-[#F4F3F5] p-6 text-[#211C24]">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-8">
            <h1 className="text-xl font-semibold text-[#211C24]">
              Page not found
            </h1>

            <p className="mt-2 text-[#6F6872]">
              {error || "The requested page could not be found."}
            </p>

            <Link
              href="/admin/pages"
              className="mt-6 inline-block rounded-xl bg-[#6A0D8F] px-5 py-3 font-medium text-white transition hover:bg-[#48066A]"
            >
              Back to Pages
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F4F3F5] px-4 py-8 text-[#211C24] sm:px-6">
      <div className="mx-auto max-w-4xl">

        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              href="/admin/pages"
              className="text-sm font-medium text-[#6F6872] transition hover:text-[#6A0D8F]"
            >
              ← Back to Pages
            </Link>

            <p className="mt-5 mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#6A0D8F]">
              Website CMS
            </p>

            <h1 className="text-3xl font-bold tracking-tight text-[#211C24]">
              Edit Page
            </h1>

            <p className="mt-2 text-[#6F6872]">
              Update your website page content and settings.
            </p>
          </div>

          <div
            className={`inline-flex w-fit rounded-full px-4 py-2 text-sm font-medium ${
              isPublished
                ? "bg-green-500/10 text-green-700"
                : "bg-[#6F6872]/10 text-[#6F6872]"
            }`}
          >
            {isPublished ? "Published" : "Draft"}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          {/* Page Information */}
          <div className="rounded-2xl border border-[#E9E6EB] bg-white p-6 shadow-[0_8px_30px_rgba(72,6,106,0.06)] sm:p-8">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-[#211C24]">
                Page Information
              </h2>

              <p className="mt-1 text-sm text-[#6F6872]">
                Basic information for this website page.
              </p>
            </div>

            {/* Title */}
            <div>
              <label className="mb-2 block text-sm font-medium text-[#211C24]">
                Page Title
              </label>

              <input
                type="text"
                value={title}
                onChange={(event) =>
                  setTitle(event.target.value)
                }
                placeholder="e.g. About Us"
                className="w-full rounded-xl border border-[#E9E6EB] bg-[#F4F3F5] px-4 py-3 text-[#211C24] outline-none transition placeholder:text-[#6F6872] focus:border-[#B000D4] focus:ring-4 focus:ring-[#B000D4]/10"
              />
            </div>

            {/* Slug */}
            <div className="mt-5">
              <label className="mb-2 block text-sm font-medium text-[#211C24]">
                URL Slug
              </label>

              <div className="flex overflow-hidden rounded-xl border border-[#E9E6EB] bg-[#F4F3F5]">
                <span className="flex items-center border-r border-[#E9E6EB] px-4 text-sm text-[#6F6872]">
                  /
                </span>

                <input
                  type="text"
                  value={slug}
                  onChange={(event) =>
                    setSlug(event.target.value)
                  }
                  className="w-full bg-transparent px-4 py-3 text-[#211C24] outline-none placeholder:text-[#6F6872]"
                  placeholder="about"
                />
              </div>

              <p className="mt-2 text-xs text-[#6F6872]">
                The slug is used in the page URL.
              </p>
            </div>

            {/* Content */}
            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between">
                <label className="block text-sm font-medium text-[#211C24]">
                  Page Content
                </label>

                <span className="text-xs text-[#6F6872]">
                  {content.length} characters
                </span>
              </div>

              <textarea
                value={content}
                onChange={(event) =>
                  setContent(event.target.value)
                }
                rows={14}
                placeholder="Write the content for this page..."
                className="min-h-[320px] w-full resize-y rounded-xl border border-[#E9E6EB] bg-[#F4F3F5] px-4 py-4 text-[#211C24] outline-none transition placeholder:text-[#6F6872] focus:border-[#B000D4] focus:ring-4 focus:ring-[#B000D4]/10"
              />

              <p className="mt-2 text-xs text-[#6F6872]">
                Write the main content that visitors will see on this page.
              </p>
            </div>
          </div>

          {/* Media */}
          <div className="rounded-2xl border border-[#E9E6EB] bg-white p-6 shadow-[0_8px_30px_rgba(72,6,106,0.06)] sm:p-8">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-[#211C24]">
                Featured Image
              </h2>

              <p className="mt-1 text-sm text-[#6F6872]">
                Optional image used to represent this page.
              </p>
            </div>

            <label className="mb-2 block text-sm font-medium text-[#211C24]">
              Featured Image URL
            </label>

            <input
              type="url"
              value={featuredImage}
              onChange={(event) =>
                setFeaturedImage(event.target.value)
              }
              placeholder="https://..."
              className="w-full rounded-xl border border-[#E9E6EB] bg-[#F4F3F5] px-4 py-3 text-[#211C24] outline-none transition placeholder:text-[#6F6872] focus:border-[#B000D4] focus:ring-4 focus:ring-[#B000D4]/10"
            />
          </div>

          {/* SEO */}
          <div className="rounded-2xl border border-[#E9E6EB] bg-white p-6 shadow-[0_8px_30px_rgba(72,6,106,0.06)] sm:p-8">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-[#211C24]">
                SEO Settings
              </h2>

              <p className="mt-1 text-sm text-[#6F6872]">
                Help search engines understand this page.
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[#211C24]">
                SEO Title
              </label>

              <input
                type="text"
                value={seoTitle}
                onChange={(event) =>
                  setSeoTitle(event.target.value)
                }
                placeholder="About BEEBZ PRINTS"
                className="w-full rounded-xl border border-[#E9E6EB] bg-[#F4F3F5] px-4 py-3 text-[#211C24] outline-none transition placeholder:text-[#6F6872] focus:border-[#B000D4] focus:ring-4 focus:ring-[#B000D4]/10"
              />
            </div>

            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between">
                <label className="block text-sm font-medium text-[#211C24]">
                  SEO Description
                </label>

                <span className="text-xs text-[#6F6872]">
                  {seoDescription.length} characters
                </span>
              </div>

              <textarea
                value={seoDescription}
                onChange={(event) =>
                  setSeoDescription(event.target.value)
                }
                rows={4}
                placeholder="Describe this page for search engines..."
                className="w-full resize-y rounded-xl border border-[#E9E6EB] bg-[#F4F3F5] px-4 py-3 text-[#211C24] outline-none transition placeholder:text-[#6F6872] focus:border-[#B000D4] focus:ring-4 focus:ring-[#B000D4]/10"
              />
            </div>
          </div>

          {/* Publishing */}
          <div className="rounded-2xl border border-[#E9E6EB] bg-white p-6 shadow-[0_8px_30px_rgba(72,6,106,0.06)] sm:p-8">
            <div className="flex items-start gap-4">
              <input
                id="isPublished"
                type="checkbox"
                checked={isPublished}
                onChange={(event) =>
                  setIsPublished(event.target.checked)
                }
                className="mt-1 h-5 w-5 rounded border-[#E9E6EB] bg-[#F4F3F5] accent-[#6A0D8F]"
              />

              <div>
                <label
                  htmlFor="isPublished"
                  className="cursor-pointer font-medium text-[#211C24]"
                >
                  Publish this page
                </label>

                <p className="mt-1 text-sm text-[#6F6872]">
                  Published pages can be displayed on the public BEEBZ PRINTS
                  website.
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Link
              href="/admin/pages"
              className="rounded-xl border border-[#E9E6EB] bg-white px-6 py-3 text-center font-medium text-[#211C24] transition hover:border-[#B000D4]/30 hover:bg-[#F4F3F5] hover:text-[#6A0D8F]"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-[#6A0D8F] px-6 py-3 font-semibold text-white shadow-[0_8px_20px_rgba(106,13,143,0.18)] transition hover:bg-[#48066A] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Saving Changes..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}