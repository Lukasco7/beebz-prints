import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import DeletePageButton from "./DeletePageButton";

export const instant = false;

export default async function PagesAdminPage() {
  const supabase = await createClient();

  const { data: pages, error } = await supabase
    .from("pages")
    .select(`
      id,
      title,
      slug,
      seo_title,
      seo_description,
      is_published,
      created_at,
      updated_at
    `)
    .order("created_at", { ascending: false });

  return (
    <main className="min-h-screen bg-[#F4F3F5] text-[#211C24]">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#6A0D8F]">
              Website CMS
            </p>

            <h1 className="text-3xl font-bold tracking-tight text-[#211C24]">
              Pages
            </h1>

            <p className="mt-2 text-sm text-[#6F6872]">
              Manage the pages and SEO content of the BEEBZ PRINTS website.
            </p>
          </div>

          <Link
            href="/admin/pages/new"
            className="inline-flex items-center justify-center rounded-xl bg-[#6A0D8F] px-5 py-3 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(106,13,143,0.18)] transition hover:bg-[#48066A]"
          >
            + Add Page
          </Link>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-700">
            Failed to load pages: {error.message}
          </div>
        )}

        {/* Pages Table */}
        <div className="overflow-hidden rounded-2xl border border-[#E9E6EB] bg-white shadow-[0_8px_30px_rgba(72,6,106,0.06)]">

          {/* Table Header */}
          <div className="border-b border-[#E9E6EB] px-6 py-5 sm:px-8">
            <div className="flex items-center gap-3">
              <div className="h-2.5 w-2.5 rounded-full bg-[#B000D4]" />

              <h2 className="text-lg font-semibold text-[#211C24]">
                Website Pages
              </h2>
            </div>

            <p className="mt-2 text-sm text-[#6F6872]">
              Create and manage the content pages displayed on your website.
            </p>
          </div>

          {/* Empty State */}
          {!pages || pages.length === 0 ? (
            <div className="px-6 py-16 text-center sm:px-8">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F4F3F5]">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="h-8 w-8 text-[#6A0D8F]"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 5.5A2.5 2.5 0 016.5 3H20v16H6.5A2.5 2.5 0 004 16.5v-11z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 16.5A2.5 2.5 0 016.5 14H20M8 7h8M8 10h6"
                  />
                </svg>
              </div>

              <h3 className="mt-5 text-lg font-semibold text-[#211C24]">
                No pages yet
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#6F6872]">
                You have not created any website pages yet. Create your first
                page to start managing your website content.
              </p>

              <Link
                href="/admin/pages/new"
                className="mt-6 inline-flex items-center justify-center rounded-xl bg-[#6A0D8F] px-5 py-3 text-sm font-semibold text-white shadow-[0_6px_16px_rgba(106,13,143,0.16)] transition hover:bg-[#48066A]"
              >
                Create First Page
              </Link>
            </div>
          ) : (
            /* Table */
            <div className="overflow-x-auto">
              <table className="min-w-full">

                <thead>
                  <tr className="border-b border-[#E9E6EB] bg-[#F4F3F5] text-left">
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[#6F6872] sm:px-8">
                      Page
                    </th>

                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[#6F6872]">
                      Slug
                    </th>

                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[#6F6872]">
                      Status
                    </th>

                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[#6F6872]">
                      SEO
                    </th>

                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-[#6F6872] sm:px-8">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#E9E6EB]">
                  {pages.map((page) => (
                    <tr
                      key={page.id}
                      className="transition hover:bg-[#F4F3F5]"
                    >
                      {/* Page */}
                      <td className="px-6 py-5 sm:px-8">
                        <div>
                          <p className="font-semibold text-[#211C24]">
                            {page.title}
                          </p>

                          <p className="mt-1 text-xs text-[#6F6872]">
                            Updated{" "}
                            {new Date(page.updated_at).toLocaleDateString()}
                          </p>
                        </div>
                      </td>

                      {/* Slug */}
                      <td className="px-6 py-5">
                        <code className="rounded-lg bg-[#F4F3F5] px-2.5 py-1.5 text-xs text-[#6F6872]">
                          /{page.slug}
                        </code>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-5">
                        {page.is_published ? (
                          <span className="inline-flex rounded-full bg-green-500/10 px-3 py-1 text-xs font-semibold text-green-700">
                            Published
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full bg-[#6F6872]/10 px-3 py-1 text-xs font-semibold text-[#6F6872]">
                            Draft
                          </span>
                        )}
                      </td>

                      {/* SEO */}
                      <td className="px-6 py-5">
                        {page.seo_title || page.seo_description ? (
                          <span className="inline-flex rounded-full bg-[#6A0D8F]/10 px-3 py-1 text-xs font-semibold text-[#6A0D8F]">
                            Configured
                          </span>
                        ) : (
                          <span className="text-xs text-[#6F6872]">
                            Not configured
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/admin/pages/${page.id}`}
                            className="rounded-lg border border-[#E9E6EB] bg-white px-3 py-2 text-sm font-medium text-[#211C24] transition hover:border-[#B000D4]/40 hover:bg-[#F4F3F5] hover:text-[#6A0D8F]"
                          >
                            Edit
                          </Link>

                          <DeletePageButton
                            pageId={page.id}
                            pageTitle={page.title}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>

              </table>
            </div>
          )}
        </div>

      </div>
    </main>
  );
}