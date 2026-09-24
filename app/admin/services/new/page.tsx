"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Category = {
  id: string;
  name: string;
};

const supabase = createClient();

export default function NewServicePage() {
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [description, setDescription] = useState("");
  const [startingPrice, setStartingPrice] = useState("");
  const [priceUnit, setPriceUnit] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [sortOrder, setSortOrder] = useState("0");

  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadCategories() {
      setLoadingCategories(true);

      const { data, error: categoriesError } = await supabase
        .from("service_categories")
        .select("id, name")
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true });

      if (cancelled) return;

      if (categoriesError) {
        setError(categoriesError.message);
      } else {
        setCategories(data || []);
      }

      setLoadingCategories(false);
    }

    void loadCategories();

    return () => {
      cancelled = true;
    };
  }, []);

  function generateSlug(value: string) {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  }

  function handleNameChange(value: string) {
    setName(value);

    if (!slug) {
      setSlug(generateSlug(value));
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");

    const trimmedName = name.trim();
    const trimmedSlug = slug.trim();

    if (!trimmedName) {
      setError("Service name is required.");
      return;
    }

    if (!trimmedSlug) {
      setError("Service slug is required.");
      return;
    }

    const parsedSortOrder = Number(sortOrder);

    if (!Number.isFinite(parsedSortOrder)) {
      setError("Sort order must be a valid number.");
      return;
    }

    const parsedStartingPrice =
      startingPrice.trim() === "" ? null : Number(startingPrice);

    if (
      parsedStartingPrice !== null &&
      (!Number.isFinite(parsedStartingPrice) || parsedStartingPrice < 0)
    ) {
      setError("Starting price must be a valid non-negative number.");
      return;
    }

    setSaving(true);

    try {
      const { error: insertError } = await supabase
        .from("services")
        .insert({
          name: trimmedName,
          slug: trimmedSlug,
          category_id: categoryId || null,
          short_description: shortDescription.trim() || null,
          description: description.trim() || null,
          starting_price: parsedStartingPrice,
          price_unit: priceUnit.trim() || null,
          is_featured: isFeatured,
          is_active: isActive,
          sort_order: parsedSortOrder,
        });

      if (insertError) {
        throw new Error(insertError.message);
      }

      router.push("/admin/services");
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Failed to create service.",
      );
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F4F3F5] text-[#211C24]">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="mb-3 flex items-center gap-2 text-sm text-[#6F6872]">
            <Link
              href="/admin"
              className="transition-colors hover:text-[#6A0D8F]"
            >
              Dashboard
            </Link>

            <span>/</span>

            <Link
              href="/admin/services"
              className="transition-colors hover:text-[#6A0D8F]"
            >
              Services
            </Link>

            <span>/</span>

            <span className="text-[#211C24]">New</span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-[#211C24]">
            Add Service
          </h1>

          <p className="mt-2 text-sm text-[#6F6872]">
            Create a new service for your website.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-white p-4 text-sm text-red-600 shadow-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <section className="rounded-2xl border border-[#E9E6EB] bg-white p-6 shadow-sm">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-[#211C24]">
                Basic Information
              </h2>

              <p className="mt-1 text-sm text-[#6F6872]">
                Add the main details for this service.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <label
                  htmlFor="name"
                  className="mb-2 block text-sm font-medium text-[#211C24]"
                >
                  Service Name *
                </label>

                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(event) => handleNameChange(event.target.value)}
                  placeholder="e.g. Business Card Printing"
                  required
                  className="w-full rounded-xl border border-[#E9E6EB] bg-white px-4 py-3 text-sm text-[#211C24] outline-none transition focus:border-[#6A0D8F] focus:ring-2 focus:ring-[#6A0D8F]/15"
                />
              </div>

              <div>
                <label
                  htmlFor="slug"
                  className="mb-2 block text-sm font-medium text-[#211C24]"
                >
                  Slug *
                </label>

                <input
                  id="slug"
                  type="text"
                  value={slug}
                  onChange={(event) => setSlug(event.target.value)}
                  placeholder="business-card-printing"
                  required
                  className="w-full rounded-xl border border-[#E9E6EB] bg-white px-4 py-3 text-sm text-[#211C24] outline-none transition focus:border-[#6A0D8F] focus:ring-2 focus:ring-[#6A0D8F]/15"
                />

                <p className="mt-2 text-xs text-[#6F6872]">
                  Used in the service URL.
                </p>
              </div>

              <div>
                <label
                  htmlFor="category"
                  className="mb-2 block text-sm font-medium text-[#211C24]"
                >
                  Category
                </label>

                <select
                  id="category"
                  value={categoryId}
                  onChange={(event) => setCategoryId(event.target.value)}
                  disabled={loadingCategories}
                  className="w-full rounded-xl border border-[#E9E6EB] bg-white px-4 py-3 text-sm text-[#211C24] outline-none transition focus:border-[#6A0D8F] focus:ring-2 focus:ring-[#6A0D8F]/15 disabled:cursor-not-allowed disabled:bg-[#F4F3F5]"
                >
                  <option value="">
                    {loadingCategories
                      ? "Loading categories..."
                      : "Select a category"}
                  </option>

                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="sortOrder"
                  className="mb-2 block text-sm font-medium text-[#211C24]"
                >
                  Sort Order
                </label>

                <input
                  id="sortOrder"
                  type="number"
                  value={sortOrder}
                  onChange={(event) => setSortOrder(event.target.value)}
                  min="0"
                  step="1"
                  className="w-full rounded-xl border border-[#E9E6EB] bg-white px-4 py-3 text-sm text-[#211C24] outline-none transition focus:border-[#6A0D8F] focus:ring-2 focus:ring-[#6A0D8F]/15"
                />

                <p className="mt-2 text-xs text-[#6F6872]">
                  Lower numbers appear first.
                </p>
              </div>
            </div>
          </section>

          {/* Description */}
          <section className="rounded-2xl border border-[#E9E6EB] bg-white p-6 shadow-sm">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-[#211C24]">
                Description
              </h2>

              <p className="mt-1 text-sm text-[#6F6872]">
                Add information customers should see about the service.
              </p>
            </div>

            <div className="space-y-5">
              <div>
                <label
                  htmlFor="shortDescription"
                  className="mb-2 block text-sm font-medium text-[#211C24]"
                >
                  Short Description
                </label>

                <textarea
                  id="shortDescription"
                  value={shortDescription}
                  onChange={(event) =>
                    setShortDescription(event.target.value)
                  }
                  rows={3}
                  placeholder="A short summary of the service..."
                  className="w-full resize-y rounded-xl border border-[#E9E6EB] bg-white px-4 py-3 text-sm text-[#211C24] outline-none transition placeholder:text-[#6F6872] focus:border-[#6A0D8F] focus:ring-2 focus:ring-[#6A0D8F]/15"
                />
              </div>

              <div>
                <label
                  htmlFor="description"
                  className="mb-2 block text-sm font-medium text-[#211C24]"
                >
                  Full Description
                </label>

                <textarea
                  id="description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  rows={8}
                  placeholder="Describe the service in more detail..."
                  className="w-full resize-y rounded-xl border border-[#E9E6EB] bg-white px-4 py-3 text-sm text-[#211C24] outline-none transition placeholder:text-[#6F6872] focus:border-[#6A0D8F] focus:ring-2 focus:ring-[#6A0D8F]/15"
                />
              </div>
            </div>
          </section>

          {/* Pricing */}
          <section className="rounded-2xl border border-[#E9E6EB] bg-white p-6 shadow-sm">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-[#211C24]">
                Pricing
              </h2>

              <p className="mt-1 text-sm text-[#6F6872]">
                Set the starting price and pricing unit.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <label
                  htmlFor="startingPrice"
                  className="mb-2 block text-sm font-medium text-[#211C24]"
                >
                  Starting Price
                </label>

                <div className="relative">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium text-[#6F6872]">
                    GH₵
                  </span>

                  <input
                    id="startingPrice"
                    type="number"
                    value={startingPrice}
                    onChange={(event) =>
                      setStartingPrice(event.target.value)
                    }
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    className="w-full rounded-xl border border-[#E9E6EB] bg-white py-3 pl-14 pr-4 text-sm text-[#211C24] outline-none transition focus:border-[#6A0D8F] focus:ring-2 focus:ring-[#6A0D8F]/15"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="priceUnit"
                  className="mb-2 block text-sm font-medium text-[#211C24]"
                >
                  Price Unit
                </label>

                <input
                  id="priceUnit"
                  type="text"
                  value={priceUnit}
                  onChange={(event) => setPriceUnit(event.target.value)}
                  placeholder="per piece, per page, from..."
                  className="w-full rounded-xl border border-[#E9E6EB] bg-white px-4 py-3 text-sm text-[#211C24] outline-none transition focus:border-[#6A0D8F] focus:ring-2 focus:ring-[#6A0D8F]/15"
                />
              </div>
            </div>
          </section>

          {/* Publishing */}
          <section className="rounded-2xl border border-[#E9E6EB] bg-white p-6 shadow-sm">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-[#211C24]">
                Publishing
              </h2>

              <p className="mt-1 text-sm text-[#6F6872]">
                Control how the service appears on your website.
              </p>
            </div>

            <div className="space-y-4">
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#E9E6EB] bg-[#F4F3F5] p-4 transition hover:border-[#6A0D8F]">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(event) => setIsActive(event.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-[#E9E6EB] text-[#6A0D8F] accent-[#6A0D8F]"
                />

                <span>
                  <span className="block text-sm font-semibold text-[#211C24]">
                    Active
                  </span>

                  <span className="mt-1 block text-xs text-[#6F6872]">
                    Make this service visible and available on the website.
                  </span>
                </span>
              </label>

              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#E9E6EB] bg-[#F4F3F5] p-4 transition hover:border-[#B000D4]">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(event) => setIsFeatured(event.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-[#E9E6EB] text-[#B000D4] accent-[#B000D4]"
                />

                <span>
                  <span className="block text-sm font-semibold text-[#211C24]">
                    Featured
                  </span>

                  <span className="mt-1 block text-xs text-[#6F6872]">
                    Highlight this service in featured sections.
                  </span>
                </span>
              </label>
            </div>
          </section>

          {/* Actions */}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Link
              href="/admin/services"
              className="inline-flex items-center justify-center rounded-xl border border-[#E9E6EB] bg-white px-6 py-3 text-sm font-semibold text-[#211C24] transition-colors hover:border-[#6A0D8F] hover:text-[#6A0D8F]"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center rounded-xl bg-[#6A0D8F] px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#48066A] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Creating..." : "Create Service"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}