import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const instant = false;

type Props = {
  params: Promise<{ id: string }>;
};

async function updateGalleryItem(
  id: string,
  formData: FormData,
) {
  "use server";

  const supabase = await createClient();

  const title = String(formData.get("title") || "").trim();
  const slug = String(formData.get("slug") || "").trim();
  const categoryId = String(formData.get("category_id") || "");
  const description = String(formData.get("description") || "").trim();
  const altText = String(formData.get("alt_text") || "").trim();

  const currentImageUrl = String(
    formData.get("current_image_url") || "",
  ).trim();

  const imageFile = formData.get("image");

  const isFeatured = formData.get("is_featured") === "on";
  const isPublished = formData.get("is_published") === "on";

  if (!title || !slug) {
    throw new Error("Project title and slug are required.");
  }

  let imageUrl = currentImageUrl;

  // If a new image was selected, upload it
  if (
    imageFile instanceof File &&
    imageFile.size > 0
  ) {
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
    ];

    if (!allowedTypes.includes(imageFile.type)) {
      throw new Error(
        "Invalid image type. Please use JPG, PNG, WEBP, or GIF.",
      );
    }

    const maxSize = 10 * 1024 * 1024;

    if (imageFile.size > maxSize) {
      throw new Error("Image must be 10MB or smaller.");
    }

    const extension =
      imageFile.name.split(".").pop()?.toLowerCase() || "jpg";

    const fileName = `${crypto.randomUUID()}.${extension}`;
    const storagePath = `gallery/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("gallery")
      .upload(storagePath, imageFile, {
        contentType: imageFile.type,
        upsert: false,
      });

    if (uploadError) {
      throw new Error(
        `Image upload failed: ${uploadError.message}`,
      );
    }

    const {
      data: { publicUrl },
    } = supabase.storage
      .from("gallery")
      .getPublicUrl(storagePath);

    imageUrl = publicUrl;
  }

  if (!imageUrl) {
    throw new Error("An image is required.");
  }

  const { error } = await supabase
    .from("gallery")
    .update({
      title,
      slug,
      category_id: categoryId || null,
      description: description || null,
      image_url: imageUrl,
      alt_text: altText || title,
      is_featured: isFeatured,
      is_published: isPublished,
    })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  // Delete the old image after the database update succeeds
  if (
    imageFile instanceof File &&
    imageFile.size > 0 &&
    currentImageUrl
  ) {
    try {
      const marker = "/storage/v1/object/public/gallery/";

      if (currentImageUrl.includes(marker)) {
        const oldPath = decodeURIComponent(
          currentImageUrl.split(marker)[1],
        );

        if (oldPath) {
          await supabase.storage
            .from("gallery")
            .remove([oldPath]);
        }
      }
    } catch (error) {
      console.error(
        "Old gallery image cleanup failed:",
        error,
      );
    }
  }

  redirect("/admin/gallery");
}

export default async function EditGalleryItemPage({
  params,
}: Props) {
  const { id } = await params;

  const supabase = await createClient();

  const [
    { data: item, error: itemError },
    { data: categories, error: categoryError },
  ] = await Promise.all([
    supabase
      .from("gallery")
      .select(`
        id,
        title,
        slug,
        description,
        image_url,
        alt_text,
        is_featured,
        is_published,
        category_id
      `)
      .eq("id", id)
      .single(),

    supabase
      .from("gallery_categories")
      .select("id, name")
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
  ]);

  if (itemError || !item) {
    return (
      <div className="min-h-screen bg-[#F4F3F5] px-6 py-10 text-[#211C24]">
        <div className="mx-auto max-w-4xl">
          <p className="mb-2 text-sm font-medium uppercase tracking-[0.2em] text-[#6A0D8F]">
            BEEBZ PRINTS CMS
          </p>

          <h1 className="text-2xl font-bold text-[#211C24]">
            Gallery item not found
          </h1>

          <p className="mt-2 text-sm text-[#6F6872]">
            This gallery item may have been deleted or the ID is
            invalid.
          </p>

          <Link
            href="/admin/gallery"
            className="mt-6 inline-block rounded-lg bg-[#6A0D8F] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#48066A]"
          >
            Back to Gallery
          </Link>
        </div>
      </div>
    );
  }

  const updateAction = updateGalleryItem.bind(null, item.id);

  return (
    <div className="min-h-screen bg-[#F4F3F5] text-[#211C24]">
      <div className="mx-auto max-w-4xl px-6 py-10">
        <div className="mb-8">
          <p className="mb-2 text-sm font-medium uppercase tracking-[0.2em] text-[#6A0D8F]">
            BEEBZ PRINTS CMS
          </p>

          <h1 className="text-3xl font-bold text-[#211C24]">
            Edit Gallery Item
          </h1>

          <p className="mt-2 text-sm text-[#6F6872]">
            Update this project in your portfolio.
          </p>
        </div>

        {categoryError && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            Failed to load categories: {categoryError.message}
          </div>
        )}

        <form
          action={updateAction}
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
              defaultValue={item.title}
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
              defaultValue={item.slug}
              className="w-full rounded-lg border border-[#E9E6EB] bg-white px-4 py-3 text-[#211C24] outline-none placeholder:text-[#6F6872] focus:border-[#6A0D8F] focus:ring-2 focus:ring-[#6A0D8F]/10"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-[#211C24]">
              Category
            </label>

            <select
              name="category_id"
              defaultValue={item.category_id || ""}
              className="w-full rounded-lg border border-[#E9E6EB] bg-white px-4 py-3 text-[#211C24] outline-none focus:border-[#6A0D8F] focus:ring-2 focus:ring-[#6A0D8F]/10"
            >
              <option value="">
                Select a category
              </option>

              {categories?.map((category) => (
                <option
                  key={category.id}
                  value={category.id}
                >
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Image */}
          <div>
            <label className="mb-2 block text-sm font-medium text-[#211C24]">
              Current Image
            </label>

            <Image
              src={item.image_url}
              alt={item.alt_text || item.title}
              width={1200}
              height={600}
              className="mb-4 h-64 w-full rounded-lg border border-[#E9E6EB] object-cover"
              unoptimized
            />

            <input
              type="hidden"
              name="current_image_url"
              value={item.image_url}
            />

            <label className="mb-2 block text-sm font-medium text-[#211C24]">
              Replace Image
            </label>

            <input
              name="image"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="block w-full rounded-lg border border-[#E9E6EB] bg-white px-4 py-3 text-sm text-[#6F6872] file:mr-4 file:rounded-md file:border-0 file:bg-[#6A0D8F] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-[#48066A]"
            />

            <p className="mt-2 text-xs text-[#6F6872]">
              Select a new JPG, PNG, WEBP, or GIF image. Maximum
              size: 10MB. Leave empty to keep the current image.
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-[#211C24]">
              Description
            </label>

            <textarea
              name="description"
              rows={5}
              defaultValue={item.description || ""}
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
              defaultValue={item.alt_text || ""}
              className="w-full rounded-lg border border-[#E9E6EB] bg-white px-4 py-3 text-[#211C24] outline-none placeholder:text-[#6F6872] focus:border-[#6A0D8F] focus:ring-2 focus:ring-[#6A0D8F]/10"
            />
          </div>

          <div className="space-y-4 rounded-lg border border-[#E9E6EB] bg-[#F4F3F5] p-4">
            <label className="flex cursor-pointer items-center gap-3">
              <input
                name="is_featured"
                type="checkbox"
                defaultChecked={item.is_featured}
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
                defaultChecked={item.is_published}
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
              className="rounded-lg border border-[#E9E6EB] bg-white px-5 py-3 text-sm font-medium text-[#6F6872] transition hover:bg-[#F4F3F5] hover:text-[#48066A]"
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