import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const instant = false;

type Props = {
  params: Promise<{ id: string }>;
};

async function updateCategory(
  id: string,
  formData: FormData,
) {
  "use server";

  const supabase = await createClient();

  const name = String(formData.get("name") || "").trim();
  const slug = String(formData.get("slug") || "").trim();
  const isActive = formData.get("is_active") === "on";

  if (!name || !slug) {
    throw new Error("Category name and slug are required.");
  }

  const { error } = await supabase
    .from("gallery_categories")
    .update({
      name,
      slug,
      is_active: isActive,
    })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  redirect("/admin/gallery/categories");
}

export default async function EditGalleryCategoryPage({
  params,
}: Props) {
  const { id } = await params;

  const supabase = await createClient();

  const { data: category, error } = await supabase
    .from("gallery_categories")
    .select("id, name, slug, is_active")
    .eq("id", id)
    .single();

  if (error || !category) {
    return (
      <div className="min-h-screen bg-[#F4F3F5] px-6 py-10 text-[#211C24]">
        <div className="mx-auto max-w-4xl">
          <p className="mb-2 text-sm font-medium uppercase tracking-[0.2em] text-[#6A0D8F]">
            BEEBZ PRINTS CMS
          </p>

          <h1 className="text-2xl font-bold text-[#211C24]">
            Category not found
          </h1>

          <p className="mt-2 text-sm text-[#6F6872]">
            This category may have been deleted or the ID is invalid.
          </p>

          <Link
            href="/admin/gallery/categories"
            className="mt-6 inline-block rounded-lg bg-[#6A0D8F] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#48066A]"
          >
            Back to Categories
          </Link>
        </div>
      </div>
    );
  }

  const updateAction = updateCategory.bind(null, category.id);

  return (
    <div className="min-h-screen bg-[#F4F3F5] text-[#211C24]">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <div className="mb-8">
          <p className="mb-2 text-sm font-medium uppercase tracking-[0.2em] text-[#6A0D8F]">
            BEEBZ PRINTS CMS
          </p>

          <h1 className="text-3xl font-bold text-[#211C24]">
            Edit Gallery Category
          </h1>

          <p className="mt-2 text-sm text-[#6F6872]">
            Update this gallery category.
          </p>
        </div>

        <form
          action={updateAction}
          className="space-y-6 rounded-xl border border-[#E9E6EB] bg-white p-6 shadow-sm"
        >
          <div>
            <label className="mb-2 block text-sm font-medium text-[#211C24]">
              Category Name
            </label>

            <input
              name="name"
              type="text"
              required
              defaultValue={category.name}
              className="w-full rounded-lg border border-[#E9E6EB] bg-white px-4 py-3 text-[#211C24] outline-none focus:border-[#6A0D8F] focus:ring-2 focus:ring-[#6A0D8F]/10"
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
              defaultValue={category.slug}
              className="w-full rounded-lg border border-[#E9E6EB] bg-white px-4 py-3 text-[#211C24] outline-none focus:border-[#6A0D8F] focus:ring-2 focus:ring-[#6A0D8F]/10"
            />

            <p className="mt-2 text-xs text-[#6F6872]">
              Use lowercase letters and hyphens.
            </p>
          </div>

          <div className="rounded-lg border border-[#E9E6EB] bg-[#F4F3F5] p-4">
            <label className="flex cursor-pointer items-center gap-3">
              <input
                name="is_active"
                type="checkbox"
                defaultChecked={category.is_active}
                className="h-4 w-4 accent-[#6A0D8F]"
              />

              <span className="text-sm text-[#211C24]">
                Category is active
              </span>
            </label>
          </div>

          <div className="flex items-center gap-4 pt-2">
            <Link
              href="/admin/gallery/categories"
              className="rounded-lg border border-[#E9E6EB] bg-white px-5 py-3 text-sm font-medium text-[#6F6872] transition hover:bg-[#F4F3F5] hover:text-[#211C24]"
            >
              Cancel
            </Link>

            <button
              type="submit"
              className="rounded-lg bg-[#6A0D8F] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#48066A]"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}