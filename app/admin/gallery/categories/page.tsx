import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import DeleteGalleryCategoryButton from "./DeleteGalleryCategoryButton";

export const instant = false;

async function createCategory(formData: FormData) {
  "use server";

  const supabase = await createClient();

  const name = String(formData.get("name") || "").trim();
  const slug = String(formData.get("slug") || "").trim();

  if (!name || !slug) {
    throw new Error("Category name and slug are required.");
  }

  const { error } = await supabase
    .from("gallery_categories")
    .insert({
      name,
      slug,
      sort_order: 0,
      is_active: true,
    });

  if (error) {
    throw new Error(error.message);
  }

  redirect("/admin/gallery/categories");
}

export default async function GalleryCategoriesPage() {
  const supabase = await createClient();

  const { data: categories, error } = await supabase
    .from("gallery_categories")
    .select("id, name, slug, sort_order, is_active")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  return (
    <div className="min-h-screen bg-[#F4F3F5] text-[#211C24]">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8">
          <p className="mb-2 text-sm font-medium uppercase tracking-[0.2em] text-[#6A0D8F]">
            BEEBZ PRINTS CMS
          </p>

          <h1 className="text-3xl font-bold text-[#211C24]">
            Gallery Categories
          </h1>

          <p className="mt-2 text-sm text-[#6F6872]">
            Organize your portfolio projects into categories.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[360px_1fr]">
          {/* Add Category */}
          <div className="rounded-xl border border-[#E9E6EB] bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-[#211C24]">
              Add Category
            </h2>

            <p className="mt-2 text-sm text-[#6F6872]">
              Create a category for your gallery projects.
            </p>

            <form action={createCategory} className="mt-6 space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-[#211C24]">
                  Category Name
                </label>

                <input
                  name="name"
                  type="text"
                  required
                  placeholder="Business Cards"
                  className="w-full rounded-lg border border-[#E9E6EB] bg-white px-4 py-3 text-[#211C24] outline-none placeholder:text-[#6F6872] focus:border-[#6A0D8F] focus:ring-2 focus:ring-[#6A0D8F]/10"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[#211C24]">
                  Slug
                </label>

                <input
                  name="slug"
                  type="text"
                  required
                  placeholder="business-cards"
                  className="w-full rounded-lg border border-[#E9E6EB] bg-white px-4 py-3 text-[#211C24] outline-none placeholder:text-[#6F6872] focus:border-[#6A0D8F] focus:ring-2 focus:ring-[#6A0D8F]/10"
                />

                <p className="mt-2 text-xs text-[#6F6872]">
                  Use lowercase letters and hyphens.
                </p>
              </div>

              <button
                type="submit"
                className="w-full rounded-lg bg-[#6A0D8F] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#48066A]"
              >
                Add Category
              </button>
            </form>
          </div>

          {/* Categories */}
          <div>
            {error && (
              <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                Failed to load categories: {error.message}
              </div>
            )}

            {!categories || categories.length === 0 ? (
              <div className="rounded-xl border border-[#E9E6EB] bg-white p-10 text-center shadow-sm">
                <h2 className="text-xl font-semibold text-[#211C24]">
                  No categories yet
                </h2>

                <p className="mt-2 text-sm text-[#6F6872]">
                  Create your first gallery category.
                </p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-[#E9E6EB] bg-white shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="border-b border-[#E9E6EB] bg-[#F4F3F5]">
                      <tr>
                        <th className="px-6 py-4 text-sm font-semibold text-[#211C24]">
                          Category
                        </th>

                        <th className="px-6 py-4 text-sm font-semibold text-[#211C24]">
                          Slug
                        </th>

                        <th className="px-6 py-4 text-sm font-semibold text-[#211C24]">
                          Status
                        </th>

                        <th className="px-6 py-4 text-sm font-semibold text-[#211C24]">
                          Actions
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {categories.map((category) => (
                        <tr
                          key={category.id}
                          className="border-b border-[#E9E6EB] last:border-0 hover:bg-[#F8F5F9]"
                        >
                          <td className="px-6 py-5 font-medium text-[#211C24]">
                            {category.name}
                          </td>

                          <td className="px-6 py-5 text-sm text-[#6F6872]">
                            {category.slug}
                          </td>

                          <td className="px-6 py-5">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-medium ${
                                category.is_active
                                  ? "bg-green-50 text-green-700"
                                  : "bg-[#E9E6EB] text-[#6F6872]"
                              }`}
                            >
                              {category.is_active
                                ? "Active"
                                : "Inactive"}
                            </span>
                          </td>

                          <td className="px-6 py-5">
                            <div className="flex items-center gap-4">
                              <a
                                href={`/admin/gallery/categories/${category.id}`}
                                className="text-sm font-medium text-[#6A0D8F] transition hover:text-[#B000D4] hover:underline"
                              >
                                Edit
                              </a>

                              <DeleteGalleryCategoryButton
                                categoryId={category.id}
                              />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}