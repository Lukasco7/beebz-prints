import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import DeleteTestimonialButton from "./DeleteTestimonialButton";

export const instant = false;

type SearchParams = {
  search?: string;
  status?: string;
  featured?: string;
  rating?: string;
};

export default async function TestimonialsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  const search = (params.search ?? "").trim();
  const statusFilter = params.status ?? "all";
  const featuredFilter = params.featured ?? "all";
  const ratingFilter = params.rating ?? "all";

  const { data: allTestimonials, error } = await supabase
    .from("testimonials")
    .select(`
      id,
      customer_name,
      company_name,
      content,
      rating,
      image_url,
      is_featured,
      is_published,
      sort_order
    `)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="min-h-screen bg-[#F4F3F5] p-6 text-[#211C24] md:p-10">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 rounded-lg border border-[#DDD7E0] bg-white px-4 py-2 text-sm font-medium text-[#4D4651] transition hover:bg-[#F1EAF4] hover:text-[#48066A]"
        >
          ← Back to Dashboard
        </Link>

        <h1 className="mt-6 text-3xl font-bold">Testimonials</h1>

        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          <h2 className="font-semibold">Failed to load testimonials</h2>
          <p className="mt-2">{error.message}</p>
        </div>
      </div>
    );
  }

  const testimonials = allTestimonials ?? [];

  const filteredTestimonials = testimonials.filter((testimonial) => {
    const searchLower = search.toLowerCase();

    const matchesSearch =
      !search ||
      testimonial.customer_name?.toLowerCase().includes(searchLower) ||
      testimonial.company_name?.toLowerCase().includes(searchLower) ||
      testimonial.content?.toLowerCase().includes(searchLower);

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "published" && testimonial.is_published) ||
      (statusFilter === "draft" && !testimonial.is_published);

    const matchesFeatured =
      featuredFilter === "all" ||
      (featuredFilter === "featured" && testimonial.is_featured) ||
      (featuredFilter === "not-featured" && !testimonial.is_featured);

    const matchesRating =
      ratingFilter === "all" ||
      Number(testimonial.rating ?? 0) === Number(ratingFilter);

    return (
      matchesSearch &&
      matchesStatus &&
      matchesFeatured &&
      matchesRating
    );
  });

  const totalTestimonials = testimonials.length;

  const publishedTestimonials = testimonials.filter(
    (testimonial) => testimonial.is_published,
  ).length;

  const draftTestimonials =
    totalTestimonials - publishedTestimonials;

  const ratingValues = testimonials
    .map((testimonial) => Number(testimonial.rating ?? 0))
    .filter((rating) => rating > 0);

  const averageRating =
    ratingValues.length > 0
      ? ratingValues.reduce((sum, rating) => sum + rating, 0) /
        ratingValues.length
      : 0;

  const hasFilters =
    Boolean(search) ||
    statusFilter !== "all" ||
    featuredFilter !== "all" ||
    ratingFilter !== "all";

  return (
    <div className="min-h-screen bg-[#F4F3F5] text-[#211C24]">
      <div className="mx-auto max-w-7xl px-6 py-10">
        {/* Back to Dashboard */}
        <div className="mb-6">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 rounded-lg border border-[#DDD7E0] bg-white px-4 py-2 text-sm font-medium text-[#4D4651] transition hover:bg-[#F1EAF4] hover:text-[#48066A]"
          >
            ← Back to Dashboard
          </Link>
        </div>

        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-sm font-medium uppercase tracking-[0.2em] text-[#6A0D8F]">
              BEEBZ PRINTS CMS
            </p>

            <h1 className="text-3xl font-bold">Testimonials</h1>

            <p className="mt-2 text-sm text-[#6F6872]">
              Manage customer testimonials for your website.
            </p>
          </div>

          <Link
            href="/admin/testimonials/new"
            className="inline-flex w-fit rounded-lg bg-[#6A0D8F] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#48066A]"
          >
            + Add Testimonial
          </Link>
        </div>

        {/* Stats */}
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-[#DDD7E0] bg-white p-5">
            <p className="text-sm text-[#6F6872]">
              Total Testimonials
            </p>

            <p className="mt-2 text-2xl font-bold text-[#211C24]">
              {totalTestimonials}
            </p>
          </div>

          <div className="rounded-xl border border-green-200 bg-green-50 p-5">
            <p className="text-sm text-[#6F6872]">Published</p>

            <p className="mt-2 text-2xl font-bold text-green-700">
              {publishedTestimonials}
            </p>
          </div>

          <div className="rounded-xl border border-[#DDD7E0] bg-[#F8F6F9] p-5">
            <p className="text-sm text-[#6F6872]">Drafts</p>

            <p className="mt-2 text-2xl font-bold text-[#4D4651]">
              {draftTestimonials}
            </p>
          </div>

          <div className="rounded-xl border border-[#E2CFE8] bg-[#F7EFF9] p-5">
            <p className="text-sm text-[#6F6872]">Average Rating</p>

            <p className="mt-2 text-2xl font-bold text-[#6A0D8F]">
              {averageRating.toFixed(1)} ★
            </p>
          </div>
        </div>

        {/* Search and filters */}
        <form
          method="GET"
          className="mt-6 rounded-xl border border-[#DDD7E0] bg-white p-4"
        >
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_170px_170px_150px_auto]">
            <input
              name="search"
              defaultValue={search}
              placeholder="Search customer, company or testimonial..."
              className="w-full rounded-lg border border-[#D8D2DB] bg-[#F8F6F9] px-4 py-3 text-sm text-[#211C24] outline-none placeholder:text-[#8A838D] focus:border-[#6A0D8F] focus:ring-2 focus:ring-[#6A0D8F]/10"
            />

            <select
              name="status"
              defaultValue={statusFilter}
              className="rounded-lg border border-[#D8D2DB] bg-[#F8F6F9] px-4 py-3 text-sm text-[#211C24] outline-none focus:border-[#6A0D8F] focus:ring-2 focus:ring-[#6A0D8F]/10"
            >
              <option value="all">All Statuses</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>

            <select
              name="featured"
              defaultValue={featuredFilter}
              className="rounded-lg border border-[#D8D2DB] bg-[#F8F6F9] px-4 py-3 text-sm text-[#211C24] outline-none focus:border-[#6A0D8F] focus:ring-2 focus:ring-[#6A0D8F]/10"
            >
              <option value="all">All Testimonials</option>
              <option value="featured">Featured</option>
              <option value="not-featured">Not Featured</option>
            </select>

            <select
              name="rating"
              defaultValue={ratingFilter}
              className="rounded-lg border border-[#D8D2DB] bg-[#F8F6F9] px-4 py-3 text-sm text-[#211C24] outline-none focus:border-[#6A0D8F] focus:ring-2 focus:ring-[#6A0D8F]/10"
            >
              <option value="all">All Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
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
                href="/admin/testimonials"
                className="text-sm text-[#6F6872] transition hover:text-[#6A0D8F]"
              >
                Clear filters
              </Link>
            </div>
          )}
        </form>

        {/* Table */}
        <div className="mt-8 overflow-hidden rounded-xl border border-[#DDD7E0] bg-white">
          {filteredTestimonials.length === 0 ? (
            <div className="p-12 text-center">
              <h2 className="text-xl font-semibold">
                {hasFilters
                  ? "No matching testimonials"
                  : "No testimonials yet"}
              </h2>

              <p className="mt-2 text-sm text-[#6F6872]">
                {hasFilters
                  ? "Try changing your search or filters."
                  : "Add your first customer testimonial."}
              </p>

              {!hasFilters && (
                <Link
                  href="/admin/testimonials/new"
                  className="mt-6 inline-flex rounded-lg bg-[#6A0D8F] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#48066A]"
                >
                  Add Testimonial
                </Link>
              )}
            </div>
          ) : (
            <>
              <div className="border-b border-[#E4DFE7] px-6 py-4">
                <h2 className="font-semibold">Customer Testimonials</h2>

                <p className="mt-1 text-sm text-[#6F6872]">
                  Showing {filteredTestimonials.length} matching testimonial
                  {filteredTestimonials.length === 1 ? "" : "s"} of{" "}
                  {totalTestimonials}
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[1050px] text-left">
                  <thead className="border-b border-[#E4DFE7] bg-[#F8F6F9]">
                    <tr>
                      <th className="px-6 py-4 text-sm font-semibold">
                        Customer
                      </th>

                      <th className="px-6 py-4 text-sm font-semibold">
                        Testimonial
                      </th>

                      <th className="px-6 py-4 text-sm font-semibold">
                        Rating
                      </th>

                      <th className="px-6 py-4 text-sm font-semibold">
                        Status
                      </th>

                      <th className="px-6 py-4 text-sm font-semibold">
                        Featured
                      </th>

                      <th className="px-6 py-4 text-sm font-semibold">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredTestimonials.map((testimonial) => {
                      const rating = Math.max(
                        0,
                        Math.min(
                          5,
                          Number(testimonial.rating ?? 0),
                        ),
                      );

                      return (
                        <tr
                          key={testimonial.id}
                          className={`border-b border-[#EEEAF0] last:border-0 transition hover:bg-[#FAF7FB] ${
                            !testimonial.is_published
                              ? "opacity-75"
                              : ""
                          }`}
                        >
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-3">
                              {testimonial.image_url ? (
                                <div className="relative h-11 w-11 overflow-hidden rounded-full">
                                  <Image
                                    src={testimonial.image_url}
                                    alt={testimonial.customer_name}
                                    fill
                                    unoptimized
                                    sizes="44px"
                                    className="object-cover"
                                  />
                                </div>
                              ) : (
                                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#F1EAF4] text-sm font-semibold text-[#6A0D8F]">
                                  {testimonial.customer_name
                                    .charAt(0)
                                    .toUpperCase()}
                                </div>
                              )}

                              <div>
                                <p className="font-medium text-[#211C24]">
                                  {testimonial.customer_name}
                                </p>

                                {testimonial.company_name && (
                                  <p className="mt-1 text-xs text-[#6F6872]">
                                    {testimonial.company_name}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="max-w-md px-6 py-5">
                            <p className="line-clamp-2 text-sm text-[#4D4651]">
                              {testimonial.content}
                            </p>
                          </td>

                          <td className="px-6 py-5">
                            <div className="flex items-center gap-2">
                              <span className="text-sm tracking-wide text-[#6A0D8F]">
                                {"★".repeat(rating)}
                              </span>

                              <span className="text-xs text-[#6F6872]">
                                {rating}/5
                              </span>
                            </div>
                          </td>

                          <td className="px-6 py-5">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-medium ${
                                testimonial.is_published
                                  ? "bg-green-50 text-green-700"
                                  : "bg-[#F1EEF2] text-[#6F6872]"
                              }`}
                            >
                              {testimonial.is_published
                                ? "Published"
                                : "Draft"}
                            </span>
                          </td>

                          <td className="px-6 py-5">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-medium ${
                                testimonial.is_featured
                                  ? "bg-[#F1EAF4] text-[#6A0D8F]"
                                  : "bg-[#F1EEF2] text-[#6F6872]"
                              }`}
                            >
                              {testimonial.is_featured
                                ? "Featured"
                                : "No"}
                            </span>
                          </td>

                          <td className="px-6 py-5">
                            <div className="flex items-center gap-4">
                              <Link
                                href={`/admin/testimonials/${testimonial.id}`}
                                className="text-sm font-medium text-[#6A0D8F] hover:text-[#48066A] hover:underline"
                              >
                                Edit
                              </Link>

                              <DeleteTestimonialButton
                                testimonialId={testimonial.id}
                              />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}