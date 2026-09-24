export const instant = false;

import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import DeleteGalleryButton from "./DeleteGalleryButton";

type SearchParams = {
  search?: string;
  category?: string;
  status?: string;
  featured?: string;
};

export default async function GalleryPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  const search = (params.search ?? "").trim();
  const categoryFilter = params.category ?? "all";
  const statusFilter = params.status ?? "all";
  const featuredFilter = params.featured ?? "all";

  const [{ data: gallery, error }, { data: categories }] =
    await Promise.all([
      supabase
        .from("gallery")
        .select(`
          id,
          title,
          slug,
          image_url,
          is_featured,
          is_published,
          gallery_categories (
            id,
            name
          )
        `)
        .order("sort_order", { ascending: true }),
      supabase
        .from("gallery_categories")
        .select("id, name")
        .order("name", { ascending: true }),
    ]);

  if (error) {
    return (
      <div className="min-h-screen bg-[#F4F3F5] p-6 md:p-8">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 rounded-lg border border-[#E9E6EB] bg-white px-4 py-2 text-sm font-medium text-[#211C24] transition hover:bg-[#F1E6F5] hover:text-[#6A0D8F]"
        >
          ← Back to Dashboard
        </Link>

        <h1 className="mt-6 text-3xl font-bold text-[#211C24]">
          Gallery
        </h1>

        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Failed to load gallery items: {error.message}
        </div>
      </div>
    );
  }

  const allItems = gallery ?? [];

  const getCategory = (item: (typeof allItems)[number]) =>
    Array.isArray(item.gallery_categories)
      ? item.gallery_categories[0]
      : item.gallery_categories;

  const normalizedSearch = search.toLowerCase();

  const filteredGallery = allItems.filter((item) => {
    const category = getCategory(item);

    const matchesSearch =
      !normalizedSearch ||
      item.title
        ?.toLowerCase()
        .includes(normalizedSearch) ||
      item.slug
        ?.toLowerCase()
        .includes(normalizedSearch);

    const matchesCategory =
      categoryFilter === "all" ||
      category?.id === categoryFilter;

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "published" &&
        item.is_published) ||
      (statusFilter === "draft" &&
        !item.is_published);

    const matchesFeatured =
      featuredFilter === "all" ||
      (featuredFilter === "featured" &&
        item.is_featured) ||
      (featuredFilter === "not-featured" &&
        !item.is_featured);

    return (
      matchesSearch &&
      matchesCategory &&
      matchesStatus &&
      matchesFeatured
    );
  });

  const totalItems = allItems.length;

  const publishedItems = allItems.filter(
    (item) => item.is_published,
  ).length;

  const draftItems = totalItems - publishedItems;

  const featuredItems = allItems.filter(
    (item) => item.is_featured,
  ).length;

  const hasFilters =
    Boolean(search) ||
    categoryFilter !== "all" ||
    statusFilter !== "all" ||
    featuredFilter !== "all";

  return (
    <div className="min-h-screen bg-[#F4F3F5] text-[#211C24]">
      <div className="mx-auto max-w-7xl px-6 py-8 md:px-8 md:py-10">
        {/* Back */}
        <div className="mb-6">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 rounded-lg border border-[#E9E6EB] bg-white px-4 py-2 text-sm font-medium text-[#211C24] transition hover:bg-[#F1E6F5] hover:text-[#6A0D8F]"
          >
            ← Back to Dashboard
          </Link>
        </div>

        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="mb-2 text-sm font-medium uppercase tracking-[0.2em] text-[#6A0D8F]">
              BEEBZ PRINTS CMS
            </p>

            <h1 className="text-3xl font-bold text-[#211C24]">
              Gallery
            </h1>

            <p className="mt-2 text-sm text-[#6F6872]">
              Manage the projects and work displayed in your
              portfolio.
            </p>
          </div>

          <Link
            href="/admin/gallery/new"
            className="inline-flex items-center justify-center rounded-lg bg-[#6A0D8F] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#48066A]"
          >
            + Add Gallery Item
          </Link>
        </div>

        {/* Stats */}
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-[#D9C1E2] bg-white p-5 shadow-sm">
            <p className="text-sm text-[#6F6872]">
              Total Projects
            </p>

            <p className="mt-2 text-2xl font-bold text-[#211C24]">
              {totalItems}
            </p>
          </div>

          <div className="rounded-xl border border-[#D9C1E2] bg-[#F1E6F5] p-5 shadow-sm">
            <p className="text-sm text-[#6F6872]">
              Published
            </p>

            <p className="mt-2 text-2xl font-bold text-[#6A0D8F]">
              {publishedItems}
            </p>
          </div>

          <div className="rounded-xl border border-[#E9E6EB] bg-white p-5 shadow-sm">
            <p className="text-sm text-[#6F6872]">
              Drafts
            </p>

            <p className="mt-2 text-2xl font-bold text-[#211C24]">
              {draftItems}
            </p>
          </div>

          <div className="rounded-xl border border-[#D9C1E2] bg-white p-5 shadow-sm">
            <p className="text-sm text-[#6F6872]">
              Featured
            </p>

            <p className="mt-2 text-2xl font-bold text-[#B000D4]">
              {featuredItems}
            </p>
          </div>
        </div>

        {/* Search and Filters */}
        <form
          method="GET"
          className="mt-6 rounded-xl border border-[#E9E6EB] bg-white p-4 shadow-sm"
        >
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_190px_170px_170px_auto]">
            <input
              name="search"
              defaultValue={search}
              placeholder="Search project title or slug..."
              className="w-full rounded-lg border border-[#E9E6EB] bg-[#F4F3F5] px-4 py-3 text-sm text-[#211C24] outline-none placeholder:text-[#6F6872] focus:border-[#6A0D8F] focus:bg-white focus:ring-2 focus:ring-[#6A0D8F]/10"
            />

            <select
              name="category"
              defaultValue={categoryFilter}
              className="rounded-lg border border-[#E9E6EB] bg-[#F4F3F5] px-4 py-3 text-sm text-[#211C24] outline-none focus:border-[#6A0D8F] focus:bg-white focus:ring-2 focus:ring-[#6A0D8F]/10"
            >
              <option value="all">All Categories</option>

              {(categories ?? []).map((category) => (
                <option
                  key={category.id}
                  value={category.id}
                >
                  {category.name}
                </option>
              ))}
            </select>

            <select
              name="status"
              defaultValue={statusFilter}
              className="rounded-lg border border-[#E9E6EB] bg-[#F4F3F5] px-4 py-3 text-sm text-[#211C24] outline-none focus:border-[#6A0D8F] focus:bg-white focus:ring-2 focus:ring-[#6A0D8F]/10"
            >
              <option value="all">All Statuses</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>

            <select
              name="featured"
              defaultValue={featuredFilter}
              className="rounded-lg border border-[#E9E6EB] bg-[#F4F3F5] px-4 py-3 text-sm text-[#211C24] outline-none focus:border-[#6A0D8F] focus:bg-white focus:ring-2 focus:ring-[#6A0D8F]/10"
            >
              <option value="all">All Projects</option>
              <option value="featured">Featured</option>
              <option value="not-featured">
                Not Featured
              </option>
            </select>

            <button
              type="submit"
              className="rounded-lg bg-[#6A0D8F] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#48066A]"
            >
              Search
            </button>
          </div>

          {hasFilters && (
            <div className="mt-3">
              <Link
                href="/admin/gallery"
                className="text-sm text-[#6F6872] transition hover:text-[#6A0D8F]"
              >
                Clear filters
              </Link>
            </div>
          )}
        </form>

        {/* Gallery Results */}
        {filteredGallery.length === 0 ? (
          <div className="mt-8 rounded-xl border border-[#E9E6EB] bg-white p-12 text-center shadow-sm">
            <h2 className="text-xl font-semibold text-[#211C24]">
              {hasFilters
                ? "No matching gallery items"
                : "No gallery items yet"}
            </h2>

            <p className="mt-2 text-sm text-[#6F6872]">
              {hasFilters
                ? "Try changing your search or filters."
                : "Add your first project to start building the BEEBZ PRINTS portfolio."}
            </p>

            {!hasFilters && (
              <Link
                href="/admin/gallery/new"
                className="mt-6 inline-block rounded-lg bg-[#6A0D8F] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#48066A]"
              >
                Add First Gallery Item
              </Link>
            )}
          </div>
        ) : (
          <div className="mt-8 overflow-hidden rounded-xl border border-[#E9E6EB] bg-white shadow-sm">
            <div className="border-b border-[#E9E6EB] px-6 py-4">
              <h2 className="font-semibold text-[#211C24]">
                Portfolio
              </h2>

              <p className="mt-1 text-sm text-[#6F6872]">
                Showing {filteredGallery.length} matching
                item
                {filteredGallery.length === 1 ? "" : "s"}{" "}
                of {totalItems}
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px] text-left">
                <thead className="border-b border-[#E9E6EB] bg-[#F4F3F5]">
                  <tr>
                    <th className="px-6 py-4 text-sm font-semibold text-[#211C24]">
                      Project
                    </th>

                    <th className="px-6 py-4 text-sm font-semibold text-[#211C24]">
                      Category
                    </th>

                    <th className="px-6 py-4 text-sm font-semibold text-[#211C24]">
                      Status
                    </th>

                    <th className="px-6 py-4 text-sm font-semibold text-[#211C24]">
                      Featured
                    </th>

                    <th className="px-6 py-4 text-sm font-semibold text-[#211C24]">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredGallery.map((item) => {
                    const category = getCategory(item);

                    return (
                      <tr
                        key={item.id}
                        className={`border-b border-[#E9E6EB] last:border-0 transition hover:bg-[#F8F5F9] ${
                          !item.is_published
                            ? "opacity-75"
                            : ""
                        }`}
                      >
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-4">
                            {item.image_url ? (
                              <Image
                                src={item.image_url}
                                alt={item.title}
                                width={96}
                                height={64}
                                unoptimized
                                className="h-16 w-24 rounded-lg border border-[#E9E6EB] object-cover"
                              />
                            ) : (
                              <div className="flex h-16 w-24 items-center justify-center rounded-lg bg-[#F4F3F5] text-xs text-[#6F6872]">
                                No image
                              </div>
                            )}

                            <div className="min-w-0">
                              <p className="font-medium text-[#211C24]">
                                {item.title}
                              </p>

                              <p className="mt-1 truncate text-xs text-[#6F6872]">
                                {item.slug}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-5 text-sm text-[#6F6872]">
                          {category?.name ||
                            "Uncategorized"}
                        </td>

                        <td className="px-6 py-5">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-medium ${
                              item.is_published
                                ? "bg-[#F1E6F5] text-[#6A0D8F]"
                                : "bg-[#E9E6EB] text-[#6F6872]"
                            }`}
                          >
                            {item.is_published
                              ? "Published"
                              : "Draft"}
                          </span>
                        </td>

                        <td className="px-6 py-5">
                          {item.is_featured ? (
                            <span className="rounded-full bg-[#F3E7F7] px-3 py-1 text-xs font-medium text-[#B000D4]">
                              Featured
                            </span>
                          ) : (
                            <span className="text-sm text-[#6F6872]">
                              No
                            </span>
                          )}
                        </td>

                        <td className="px-6 py-5">
                          <div className="flex items-center gap-4">
                            <Link
                              href={`/admin/gallery/${item.id}`}
                              className="text-sm font-medium text-[#6A0D8F] transition hover:text-[#B000D4]"
                            >
                              Edit
                            </Link>

                            <DeleteGalleryButton
                              itemId={item.id}
                              itemTitle={item.title}
                              imageUrl={item.image_url}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}