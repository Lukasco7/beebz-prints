import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const instant = false;

async function createGalleryItem(formData: FormData) {
  "use server";

  const supabase = await createClient();

  const title = String(formData.get("title") || "").trim();
  const slug = String(formData.get("slug") || "").trim();
  const categoryId = String(formData.get("category_id") || "");
  const description = String(formData.get("description") || "").trim();
  const altText = String(formData.get("alt_text") || "").trim();

  const isFeatured = formData.get("is_featured") === "on";
  const isPublished = formData.get("is_published") === "on";

  const image = formData.get("image");

  if (!title || !slug) {
    throw new Error("Project title and slug are required.");
  }

  /*
   * Check for duplicate slug BEFORE uploading the image.
   */
  const { data: existingGalleryItem, error: slugCheckError } =
    await supabase
      .from("gallery")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

  if (slugCheckError) {
    throw new Error(
      `Could not check the gallery slug: ${slugCheckError.message}`,
    );
  }

  if (existingGalleryItem) {
    throw new Error(
      `A gallery item with the slug "${slug}" already exists. Please choose a different slug.`,
    );
  }

  if (!(image instanceof File) || image.size === 0) {
    throw new Error("Please select an image.");
  }

  if (!image.type.startsWith("image/")) {
    throw new Error("Only image files are allowed.");
  }

  if (image.size > 10 * 1024 * 1024) {
    throw new Error("Image must be smaller than 10 MB.");
  }

  const extension =
    image.name.split(".").pop()?.toLowerCase() || "jpg";

  const allowedExtensions = [
    "jpg",
    "jpeg",
    "png",
    "webp",
    "gif",
  ];

  if (!allowedExtensions.includes(extension)) {
    throw new Error(
      "Please upload a JPG, JPEG, PNG, WEBP, or GIF image.",
    );
  }

  const fileName = `${crypto.randomUUID()}.${extension}`;
  const filePath = `gallery/${fileName}`;

  const fileBuffer = await image.arrayBuffer();

  const { error: uploadError } = await supabase.storage
    .from("gallery")
    .upload(filePath, fileBuffer, {
      contentType: image.type,
      upsert: false,
    });

  if (uploadError) {
    throw new Error(
      `Image upload failed: ${uploadError.message}`,
    );
  }

  const { data: publicUrlData } = supabase.storage
    .from("gallery")
    .getPublicUrl(filePath);

  const imageUrl = publicUrlData.publicUrl;

  const { error: insertError } = await supabase
    .from("gallery")
    .insert({
      title,
      slug,
      category_id: categoryId || null,
      description: description || null,
      image_url: imageUrl,
      alt_text: altText || title,
      is_featured: isFeatured,
      is_published: isPublished,
    });

  if (insertError) {
    // Remove uploaded image if database insertion fails
    await supabase.storage
      .from("gallery")
      .remove([filePath]);

    throw new Error(
      `Gallery item could not be created: ${insertError.message}`,
    );
  }

  redirect("/admin/gallery");
}

export default async function NewGalleryItemPage() {
  const supabase = await createClient();

  const { data: categories, error } = await supabase
    .from("gallery_categories")
    .select("id, name")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  return (
    <div className="min-h-screen bg-[#F4F3F5] text-[#211C24]">
      <div className="mx-auto max-w-4xl px-6 py-10">
        <div className="mb-8">
          <p className="mb-2 text-sm font-medium uppercase tracking-[0.2em] text-[#6A0D8F]">
            BEEBZ PRINTS CMS
          </p>

          <h1 className="text-3xl font-bold text-[#211C24]">
            Add Gallery Item
          </h1>

          <p className="mt-2 text-sm text-[#6F6872]">
            Add a project or completed work to your portfolio.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            Failed to load categories: {error.message}
          </div>
        )}

        <form
          action={createGalleryItem}
          className="space-y-6 rounded-xl border border-[#E9E6EB] bg-white p-6 shadow-sm"
        >
          <div>
            <label className="mb-2 block text-sm font-medium text-[#211C24]">
              Project Title
            </label>

            <input
              name="title"
              type="text"
              required
              placeholder="Business Card Design"
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
              placeholder="business-card-design"
              className="w-full rounded-lg border border-[#E9E6EB] bg-white px-4 py-3 text-[#211C24] outline-none placeholder:text-[#6F6872] focus:border-[#6A0D8F] focus:ring-2 focus:ring-[#6A0D8F]/10"
            />

            <p className="mt-2 text-xs text-[#6F6872]">
              Use lowercase letters and hyphens. Slugs must be unique.
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-[#211C24]">
              Category
            </label>

            <select
              name="category_id"
              className="w-full rounded-lg border border-[#E9E6EB] bg-white px-4 py-3 text-[#211C24] outline-none focus:border-[#6A0D8F] focus:ring-2 focus:ring-[#6A0D8F]/10"
            >
              <option value="">Select a category</option>

              {categories?.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-[#211C24]">
              Project Image
            </label>

            <input
              name="image"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              required
              className="block w-full cursor-pointer rounded-lg border border-[#E9E6EB] bg-white p-3 text-sm text-[#6F6872] file:mr-4 file:rounded-md file:border-0 file:bg-[#6A0D8F] file:px-4 file:py-2 file:font-medium file:text-white hover:file:bg-[#48066A]"
            />

            <p className="mt-2 text-xs text-[#6F6872]">
              JPG, PNG, WEBP or GIF. Maximum size: 10 MB.
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-[#211C24]">
              Description
            </label>

            <textarea
              name="description"
              rows={5}
              placeholder="Describe this project..."
              className="w-full rounded-lg border border-[#E9E6EB] bg-white px-4 py-3 text-[#211C24] outline-none placeholder:text-[#6F6872] focus:border-[#6A0D8F] focus:ring-2 focus:ring-[#6A0D8F]/10"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-[#211C24]">
              Alt Text
            </label>

            <input
              name="alt_text"
              type="text"
              placeholder="BEEBZ PRINTS business card design"
              className="w-full rounded-lg border border-[#E9E6EB] bg-white px-4 py-3 text-[#211C24] outline-none placeholder:text-[#6F6872] focus:border-[#6A0D8F] focus:ring-2 focus:ring-[#6A0D8F]/10"
            />
          </div>

          <div className="space-y-4 rounded-lg border border-[#E9E6EB] bg-[#F4F3F5] p-4">
            <label className="flex cursor-pointer items-center gap-3">
              <input
                name="is_featured"
                type="checkbox"
                className="h-4 w-4 accent-[#6A0D8F]"
              />

              <span className="text-sm text-[#211C24]">
                Feature this project
              </span>
            </label>

            <label className="flex cursor-pointer items-center gap-3">
              <input
                name="is_published"
                type="checkbox"
                defaultChecked
                className="h-4 w-4 accent-[#6A0D8F]"
              />

              <span className="text-sm text-[#211C24]">
                Publish this project
              </span>
            </label>
          </div>

          <div className="flex items-center gap-4 pt-2">
            <Link
              href="/admin/gallery"
              className="rounded-lg border border-[#E9E6EB] bg-white px-5 py-3 text-sm font-medium text-[#6F6872] transition hover:bg-[#F4F3F5] hover:text-[#211C24]"
            >
              Cancel
            </Link>

            <button
              type="submit"
              className="rounded-lg bg-[#6A0D8F] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#48066A]"
            >
              Save Gallery Item
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}