import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const instant = false;

type Props = {
  params: Promise<{ id: string }>;
};

async function updateTestimonial(
  id: string,
  formData: FormData,
) {
  "use server";

  const supabase = await createClient();

  const customerName = String(
    formData.get("customer_name") || "",
  ).trim();

  const companyName = String(
    formData.get("company_name") || "",
  ).trim();

  const content = String(
    formData.get("content") || "",
  ).trim();

  const ratingValue = Number(
    formData.get("rating") || 5,
  );

  const imageUrl = String(
    formData.get("image_url") || "",
  ).trim();

  const isFeatured = formData.get("is_featured") === "on";
  const isPublished = formData.get("is_published") === "on";

  if (!customerName || !content) {
    throw new Error(
      "Customer name and testimonial content are required.",
    );
  }

  const rating = Math.max(
    1,
    Math.min(5, Math.round(ratingValue)),
  );

  const { error } = await supabase
    .from("testimonials")
    .update({
      customer_name: customerName,
      company_name: companyName || null,
      content,
      rating,
      image_url: imageUrl || null,
      is_featured: isFeatured,
      is_published: isPublished,
    })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  redirect("/admin/testimonials");
}

export default async function EditTestimonialPage({
  params,
}: Props) {
  const { id } = await params;

  const supabase = await createClient();

  const { data: testimonial, error } = await supabase
    .from("testimonials")
    .select(`
      id,
      customer_name,
      company_name,
      content,
      rating,
      image_url,
      is_featured,
      is_published
    `)
    .eq("id", id)
    .single();

  if (error || !testimonial) {
    return (
      <main className="min-h-screen bg-[#F4F3F5] px-4 py-12 text-[#211C24] sm:px-6">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
            <p className="mb-2 text-sm font-medium uppercase tracking-[0.18em] text-red-600">
              BEEBZ PRINTS CMS
            </p>

            <h1 className="text-2xl font-bold">
              Testimonial Not Found
            </h1>

            <p className="mt-2 text-sm text-[#6F6872]">
              This testimonial may have been deleted or the ID is
              invalid.
            </p>

            <Link
              href="/admin/testimonials"
              className="mt-6 inline-flex rounded-xl bg-[#6A0D8F] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#48066A]"
            >
              Back to Testimonials
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const updateAction = updateTestimonial.bind(
    null,
    testimonial.id,
  );

  return (
    <main className="min-h-screen bg-[#F4F3F5] px-4 py-8 text-[#211C24] sm:px-6">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/admin/testimonials"
            className="inline-flex items-center gap-2 text-sm font-medium text-[#6F6872] transition hover:text-[#6A0D8F]"
          >
            ← Back to Testimonials
          </Link>

          <div className="mt-5">
            <p className="mb-2 text-sm font-medium uppercase tracking-[0.2em] text-[#6A0D8F]">
              BEEBZ PRINTS CMS
            </p>

            <h1 className="text-3xl font-bold tracking-tight">
              Edit Testimonial
            </h1>

            <p className="mt-2 text-sm text-[#6F6872]">
              Update this customer testimonial.
            </p>
          </div>
        </div>

        {/* Form Card */}
        <div className="overflow-hidden rounded-2xl border border-[#DDD7E0] bg-white shadow-sm">
          {/* Card Header */}
          <div className="border-b border-[#E4DFE7] px-6 py-6 sm:px-8">
            <div className="flex items-center gap-3">
              <div className="h-2.5 w-2.5 rounded-full bg-[#6A0D8F]" />

              <h2 className="text-lg font-semibold">
                Testimonial Information
              </h2>
            </div>

            <p className="mt-2 text-sm text-[#6F6872]">
              Make your changes and save when finished.
            </p>
          </div>

          {/* Form */}
          <form
            action={updateAction}
            className="space-y-6 px-6 py-6 sm:px-8"
          >
            {/* Customer Name */}
            <div>
              <label
                htmlFor="customer_name"
                className="mb-2 block text-sm font-semibold"
              >
                Customer Name
              </label>

              <input
                id="customer_name"
                name="customer_name"
                type="text"
                required
                defaultValue={testimonial.customer_name}
                className="w-full rounded-xl border border-[#D8D2DB] bg-[#F8F6F9] px-4 py-3.5 text-[#211C24] outline-none transition focus:border-[#6A0D8F] focus:ring-4 focus:ring-[#6A0D8F]/10"
              />
            </div>

            {/* Company */}
            <div>
              <label
                htmlFor="company_name"
                className="mb-2 block text-sm font-semibold"
              >
                Company Name
              </label>

              <input
                id="company_name"
                name="company_name"
                type="text"
                defaultValue={testimonial.company_name || ""}
                className="w-full rounded-xl border border-[#D8D2DB] bg-[#F8F6F9] px-4 py-3.5 text-[#211C24] outline-none transition focus:border-[#6A0D8F] focus:ring-4 focus:ring-[#6A0D8F]/10"
              />
            </div>

            {/* Testimonial */}
            <div>
              <label
                htmlFor="content"
                className="mb-2 block text-sm font-semibold"
              >
                Testimonial
              </label>

              <textarea
                id="content"
                name="content"
                required
                rows={6}
                defaultValue={testimonial.content}
                className="w-full rounded-xl border border-[#D8D2DB] bg-[#F8F6F9] px-4 py-3.5 text-[#211C24] outline-none transition focus:border-[#6A0D8F] focus:ring-4 focus:ring-[#6A0D8F]/10"
              />
            </div>

            {/* Rating */}
            <div>
              <label
                htmlFor="rating"
                className="mb-2 block text-sm font-semibold"
              >
                Rating
              </label>

              <select
                id="rating"
                name="rating"
                defaultValue={String(testimonial.rating || 5)}
                className="w-full rounded-xl border border-[#D8D2DB] bg-[#F8F6F9] px-4 py-3.5 text-[#211C24] outline-none transition focus:border-[#6A0D8F] focus:ring-4 focus:ring-[#6A0D8F]/10"
              >
                <option value="5">★★★★★ — 5 Stars</option>
                <option value="4">★★★★☆ — 4 Stars</option>
                <option value="3">★★★☆☆ — 3 Stars</option>
                <option value="2">★★☆☆☆ — 2 Stars</option>
                <option value="1">★☆☆☆☆ — 1 Star</option>
              </select>
            </div>

            {/* Image URL */}
            <div>
              <label
                htmlFor="image_url"
                className="mb-2 block text-sm font-semibold"
              >
                Customer Image URL
              </label>

              {testimonial.image_url && (
                <div className="relative mb-4 h-24 w-24 overflow-hidden rounded-full border border-[#E2DCE5]">
                  <Image
                    src={testimonial.image_url}
                    alt={testimonial.customer_name}
                    fill
                    unoptimized
                    sizes="96px"
                    className="object-cover"
                  />
                </div>
              )}

              <input
                id="image_url"
                name="image_url"
                type="url"
                defaultValue={testimonial.image_url || ""}
                placeholder="https://example.com/customer.jpg"
                className="w-full rounded-xl border border-[#D8D2DB] bg-[#F8F6F9] px-4 py-3.5 text-[#211C24] outline-none transition focus:border-[#6A0D8F] focus:ring-4 focus:ring-[#6A0D8F]/10 placeholder:text-[#8A838D]"
              />

              <p className="mt-2 text-xs text-[#6F6872]">
                Optional. Leave empty if you don&apos;t want a
                customer image.
              </p>
            </div>

            {/* Options */}
            <div className="space-y-4 rounded-xl border border-[#E2DCE5] bg-[#F8F6F9] p-4">
              <label className="flex cursor-pointer items-center gap-3">
                <input
                  name="is_featured"
                  type="checkbox"
                  defaultChecked={testimonial.is_featured}
                  className="h-4 w-4 cursor-pointer accent-[#6A0D8F]"
                />

                <span className="text-sm font-medium">
                  Feature this testimonial
                </span>
              </label>

              <label className="flex cursor-pointer items-center gap-3">
                <input
                  name="is_published"
                  type="checkbox"
                  defaultChecked={testimonial.is_published}
                  className="h-4 w-4 cursor-pointer accent-[#6A0D8F]"
                />

                <span className="text-sm font-medium">
                  Publish this testimonial
                </span>
              </label>
            </div>

            {/* Buttons */}
            <div className="flex flex-col gap-3 border-t border-[#E4DFE7] pt-6 sm:flex-row">
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-xl bg-[#6A0D8F] px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#48066A]"
              >
                Save Changes
              </button>

              <Link
                href="/admin/testimonials"
                className="inline-flex items-center justify-center rounded-xl border border-[#D8D2DB] bg-white px-6 py-3.5 text-sm font-semibold text-[#4D4651] transition hover:border-[#C5B9CC] hover:bg-[#F8F6F9] hover:text-[#48066A]"
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