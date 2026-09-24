export const instant = false;

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

type SearchParams = {
  search?: string;
  category?: string;
  status?: string;
};

async function deleteFaq(formData: FormData) {
  "use server";

  const id =
    typeof formData.get("id") === "string"
      ? String(formData.get("id")).trim()
      : "";

  if (!id) {
    return;
  }

  const UUID_REGEX =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  if (!UUID_REGEX.test(id)) {
    return;
  }

  const supabase = await createClient();

  const {
    data: claimsData,
    error: claimsError,
  } = await supabase.auth.getClaims();

  if (claimsError || !claimsData?.claims?.sub) {
    return;
  }

  const userId = claimsData.claims.sub;

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
    return;
  }

  const { error: deleteError } = await supabase
    .from("faqs")
    .delete()
    .eq("id", id);

  if (deleteError) {
    console.error("Delete FAQ error:", deleteError);
    return;
  }

  const { revalidatePath } = await import("next/cache");
  revalidatePath("/admin/faqs");
}

export default async function FaqsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  const search = (params.search ?? "").trim();
  const categoryFilter = params.category ?? "all";
  const statusFilter = params.status ?? "all";

  const { data: allFaqs, error } = await supabase
    .from("faqs")
    .select(`
      id,
      question,
      answer,
      category,
      sort_order,
      is_published,
      created_at
    `)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="min-h-screen bg-[#F4F3F5] p-6 text-[#211C24] md:p-10">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 rounded-xl border border-[#E1D9E5] bg-white px-4 py-2 text-sm font-medium text-[#6F6872] shadow-sm transition hover:border-[#CDB8D5] hover:text-[#6A0D8F]"
        >
          ← Back to Dashboard
        </Link>

        <h1 className="mt-6 text-3xl font-bold">FAQs</h1>

        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
          <h2 className="font-semibold">Failed to load FAQs</h2>
          <p className="mt-2 text-sm">{error.message}</p>
        </div>
      </div>
    );
  }

  const faqs = allFaqs ?? [];

  const categories = Array.from(
    new Set(
      faqs
        .map((faq) => faq.category)
        .filter((category): category is string => Boolean(category)),
    ),
  ).sort((a, b) => a.localeCompare(b));

  const filteredFaqs = faqs.filter((faq) => {
    const searchLower = search.toLowerCase();

    const matchesSearch =
      !search ||
      faq.question?.toLowerCase().includes(searchLower) ||
      faq.answer?.toLowerCase().includes(searchLower) ||
      faq.category?.toLowerCase().includes(searchLower);

    const matchesCategory =
      categoryFilter === "all" || faq.category === categoryFilter;

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "published" && faq.is_published) ||
      (statusFilter === "draft" && !faq.is_published);

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const totalFaqs = faqs.length;
  const publishedFaqs = faqs.filter((faq) => faq.is_published).length;
  const draftFaqs = totalFaqs - publishedFaqs;
  const categoryCount = categories.length;

  const hasFilters =
    Boolean(search) ||
    categoryFilter !== "all" ||
    statusFilter !== "all";

  return (
    <div className="min-h-screen bg-[#F4F3F5] text-[#211C24]">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-6">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 rounded-xl border border-[#E1D9E5] bg-white px-4 py-2 text-sm font-medium text-[#6F6872] shadow-sm transition hover:border-[#CDB8D5] hover:text-[#6A0D8F]"
          >
            ← Back to Dashboard
          </Link>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-[#6A0D8F]">
              BEEBZ PRINTS CMS
            </p>

            <h1 className="text-3xl font-bold tracking-tight text-[#211C24]">
              FAQs
            </h1>

            <p className="mt-2 text-sm text-[#6F6872]">
              Manage frequently asked questions for your website.
            </p>
          </div>

          <Link
            href="/admin/faqs/new"
            className="inline-flex w-fit items-center justify-center rounded-xl bg-[#6A0D8F] px-5 py-3 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(106,13,143,0.18)] transition hover:bg-[#48066A]"
          >
            + Add FAQ
          </Link>
        </div>

        {/* Stats */}
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-[#E1D9E5] bg-white p-5 shadow-[0_8px_30px_rgba(72,6,106,0.05)]">
            <p className="text-sm text-[#6F6872]">Total FAQs</p>
            <p className="mt-2 text-2xl font-bold text-[#211C24]">
              {totalFaqs}
            </p>
          </div>

          <div className="rounded-2xl border border-green-200 bg-white p-5 shadow-[0_8px_30px_rgba(72,6,106,0.05)]">
            <p className="text-sm text-[#6F6872]">Published</p>
            <p className="mt-2 text-2xl font-bold text-green-600">
              {publishedFaqs}
            </p>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-white p-5 shadow-[0_8px_30px_rgba(72,6,106,0.05)]">
            <p className="text-sm text-[#6F6872]">Drafts</p>
            <p className="mt-2 text-2xl font-bold text-amber-600">
              {draftFaqs}
            </p>
          </div>

          <div className="rounded-2xl border border-[#E1D9E5] bg-white p-5 shadow-[0_8px_30px_rgba(72,6,106,0.05)]">
            <p className="text-sm text-[#6F6872]">Categories</p>
            <p className="mt-2 text-2xl font-bold text-[#6A0D8F]">
              {categoryCount}
            </p>
          </div>
        </div>

        {/* Search and filters */}
        <form
          method="GET"
          className="mt-6 rounded-2xl border border-[#E1D9E5] bg-white p-4 shadow-[0_8px_30px_rgba(72,6,106,0.05)]"
        >
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_200px_180px_auto]">
            <input
              name="search"
              defaultValue={search}
              placeholder="Search question, answer or category..."
              className="w-full rounded-xl border border-[#D9D0DE] bg-[#F4F3F5] px-4 py-3 text-sm text-[#211C24] outline-none placeholder:text-[#8B838F] focus:border-[#6A0D8F] focus:ring-4 focus:ring-[#6A0D8F]/10"
            />

            <select
              name="category"
              defaultValue={categoryFilter}
              className="rounded-xl border border-[#D9D0DE] bg-[#F4F3F5] px-4 py-3 text-sm text-[#211C24] outline-none focus:border-[#6A0D8F] focus:ring-4 focus:ring-[#6A0D8F]/10"
            >
              <option value="all">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>

            <select
              name="status"
              defaultValue={statusFilter}
              className="rounded-xl border border-[#D9D0DE] bg-[#F4F3F5] px-4 py-3 text-sm text-[#211C24] outline-none focus:border-[#6A0D8F] focus:ring-4 focus:ring-[#6A0D8F]/10"
            >
              <option value="all">All Statuses</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>

            <button
              type="submit"
              className="rounded-xl bg-[#6A0D8F] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#48066A]"
            >
              Search
            </button>
          </div>

          {hasFilters && (
            <div className="mt-3">
              <Link
                href="/admin/faqs"
                className="text-sm font-medium text-[#6F6872] transition hover:text-[#6A0D8F]"
              >
                Clear filters
              </Link>
            </div>
          )}
        </form>

        {/* FAQ list */}
        <div className="mt-8 overflow-hidden rounded-2xl border border-[#E1D9E5] bg-white shadow-[0_8px_30px_rgba(72,6,106,0.06)]">
          {filteredFaqs.length === 0 ? (
            <div className="p-12 text-center">
              <h2 className="text-xl font-semibold text-[#211C24]">
                {hasFilters ? "No matching FAQs" : "No FAQs yet"}
              </h2>

              <p className="mt-2 text-sm text-[#6F6872]">
                {hasFilters
                  ? "Try changing your search or filters."
                  : "Add your first frequently asked question."}
              </p>

              {!hasFilters && (
                <Link
                  href="/admin/faqs/new"
                  className="mt-6 inline-flex rounded-xl bg-[#6A0D8F] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#48066A]"
                >
                  Add Your First FAQ
                </Link>
              )}
            </div>
          ) : (
            <>
              <div className="border-b border-[#E9E6EB] px-6 py-4">
                <h2 className="font-semibold text-[#211C24]">
                  FAQ Library
                </h2>

                <p className="mt-1 text-sm text-[#6F6872]">
                  Showing {filteredFaqs.length} matching FAQ
                  {filteredFaqs.length === 1 ? "" : "s"} of {totalFaqs}
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-left text-sm">
                  <thead className="border-b border-[#E9E6EB] bg-[#F4F3F5]">
                    <tr>
                      <th className="px-6 py-4 font-semibold text-[#211C24]">
                        Question
                      </th>

                      <th className="px-6 py-4 font-semibold text-[#211C24]">
                        Category
                      </th>

                      <th className="px-6 py-4 font-semibold text-[#211C24]">
                        Order
                      </th>

                      <th className="px-6 py-4 font-semibold text-[#211C24]">
                        Status
                      </th>

                      <th className="px-6 py-4 font-semibold text-[#211C24]">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredFaqs.map((faq) => (
                      <tr
                        key={faq.id}
                        className={`border-b border-[#E9E6EB] last:border-b-0 transition hover:bg-[#F9F7FA] ${
                          !faq.is_published ? "opacity-75" : ""
                        }`}
                      >
                        <td className="px-6 py-5">
                          <div className="max-w-xl">
                            <p className="font-medium text-[#211C24]">
                              {faq.question}
                            </p>

                            <p className="mt-2 line-clamp-2 text-[#6F6872]">
                              {faq.answer}
                            </p>
                          </div>
                        </td>

                        <td className="px-6 py-5">
                          {faq.category ? (
                            <span className="rounded-full bg-[#F0E8F3] px-3 py-1 text-xs font-medium text-[#6A0D8F]">
                              {faq.category}
                            </span>
                          ) : (
                            <span className="text-[#8B838F]">
                              Uncategorized
                            </span>
                          )}
                        </td>

                        <td className="px-6 py-5 text-[#6F6872]">
                          {faq.sort_order}
                        </td>

                        <td className="px-6 py-5">
                          {faq.is_published ? (
                            <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
                              Published
                            </span>
                          ) : (
                            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
                              Draft
                            </span>
                          )}
                        </td>

                        <td className="px-6 py-5">
                          <div className="flex items-center gap-4">
                            <Link
                              href={`/admin/faqs/${faq.id}`}
                              className="font-medium text-[#6A0D8F] transition hover:text-[#48066A] hover:underline"
                            >
                              Edit
                            </Link>

                            <form action={deleteFaq}>
                              <input
                                type="hidden"
                                name="id"
                                value={faq.id}
                              />

                              <button
                                type="submit"
                                className="font-medium text-red-600 transition hover:text-red-700 hover:underline"
                              >
                                Delete
                              </button>
                            </form>
                          </div>
                        </td>
                      </tr>
                    ))}
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