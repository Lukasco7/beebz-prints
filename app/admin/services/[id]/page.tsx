"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Category = {
  id: string;
  name: string;
};

type Service = {
  id: string;
  name: string;
  slug: string;
  category_id: string | null;
  short_description: string | null;
  description: string | null;
  starting_price: number | null;
  price_unit: string | null;
  is_featured: boolean;
  is_active: boolean;
  sort_order: number;
};

export default function EditServicePage() {
  const params = useParams();
  const router = useRouter();
  const serviceId = params.id as string;

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

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

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      const supabase = createClient();

      try {
        const [serviceResult, categoryResult] = await Promise.all([
          supabase
            .from("services")
            .select(
              "id, name, slug, category_id, short_description, description, starting_price, price_unit, is_featured, is_active, sort_order",
            )
            .eq("id", serviceId)
            .single(),

          supabase
            .from("service_categories")
            .select("id, name")
            .eq("is_active", true)
            .order("sort_order", { ascending: true })
            .order("name", { ascending: true }),
        ]);

        if (serviceResult.error) {
          throw new Error(serviceResult.error.message);
        }

        if (categoryResult.error) {
          throw new Error(categoryResult.error.message);
        }

        if (!mounted) return;

        const service = serviceResult.data as Service;

        setName(service.name ?? "");
        setSlug(service.slug ?? "");
        setCategoryId(service.category_id ?? "");
        setShortDescription(service.short_description ?? "");
        setDescription(service.description ?? "");
        setStartingPrice(
          service.starting_price === null ||
            service.starting_price === undefined
            ? ""
            : String(service.starting_price),
        );
        setPriceUnit(service.price_unit ?? "");
        setIsFeatured(Boolean(service.is_featured));
        setIsActive(Boolean(service.is_active));
        setSortOrder(String(service.sort_order ?? 0));
        setCategories(categoryResult.data ?? []);
      } catch (err) {
        if (!mounted) return;

        setError(
          err instanceof Error ? err.message : "Unable to load this service.",
        );
      } finally {
        if (mounted) {
          setLoading(false);
          setLoadingCategories(false);
        }
      }
    }

    if (serviceId) {
      loadData();
    }

    return () => {
      mounted = false;
    };
  }, [serviceId]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Service name is required.");
      return;
    }

    if (!slug.trim()) {
      setError("Service slug is required.");
      return;
    }

    const parsedSortOrder = Number.parseInt(sortOrder, 10);

    if (!Number.isFinite(parsedSortOrder) || parsedSortOrder < 0) {
      setError("Display order must be a valid number.");
      return;
    }

    if (startingPrice.trim() && Number(startingPrice) < 0) {
      setError("Starting price cannot be negative.");
      return;
    }

    setSaving(true);

    try {
      const supabase = createClient();

      const { error: updateError } = await supabase
        .from("services")
        .update({
          name: name.trim(),
          slug: slug.trim(),
          category_id: categoryId || null,
          short_description: shortDescription.trim() || null,
          description: description.trim() || null,
          starting_price: startingPrice.trim()
            ? Number(startingPrice)
            : null,
          price_unit: priceUnit.trim() || null,
          is_featured: isFeatured,
          is_active: isActive,
          sort_order: parsedSortOrder,
        })
        .eq("id", serviceId);

      if (updateError) {
        throw new Error(updateError.message);
      }

      router.push("/admin/services");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to update this service.",
      );
      setSaving(false);
    }
  }

  const inputClass =
    "mt-2 w-full rounded-xl border border-[#E9E6EB] !bg-white !px-4 !py-3.5 text-[15px] text-[#211C24] outline-none transition placeholder:text-[#6F6872] focus:border-[#6A0D8F] focus:ring-4 focus:ring-[#6A0D8F]/10";

  const textareaClass =
    "mt-2 w-full resize-y rounded-xl border border-[#E9E6EB] !bg-white !px-4 !py-3.5 text-[15px] leading-6 text-[#211C24] outline-none transition placeholder:text-[#6F6872] focus:border-[#6A0D8F] focus:ring-4 focus:ring-[#6A0D8F]/10";

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F4F3F5]">
        <div className="mx-auto max-w-7xl p-6 md:p-8">
          <div className="rounded-2xl border border-[#E9E6EB] bg-white p-10 text-center shadow-sm">
            <p className="text-sm font-medium text-[#6F6872]">
              Loading service...
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F4F3F5]">
      <div className="mx-auto max-w-7xl p-6 md:p-8">
        <div className="mb-6">
          <Link
            href="/admin/services"
            className="inline-flex items-center rounded-lg border border-[#E9E6EB] bg-white px-4 py-2 text-sm font-medium text-[#211C24] transition hover:bg-[#F4F3F5] hover:text-[#6A0D8F]"
          >
            ← Back to Services
          </Link>
        </div>

        <div className="mb-8">
          <p className="text-sm uppercase tracking-[0.2em] text-[#6A0D8F]">
            Service Management
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#211C24]">
            Edit Service
          </h1>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#6F6872]">
            Update the service information below and save your changes.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <section className="overflow-hidden rounded-2xl border border-[#E9E6EB] !bg-white shadow-sm">
            <div className="border-b border-[#E9E6EB] bg-[#F4F3F5] px-6 py-5">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#6A0D8F]">
                01
              </p>

              <h2 className="mt-1 text-lg font-bold text-[#211C24]">
                Basic Information
              </h2>

              <p className="mt-1 text-sm text-[#6F6872]">
                Update the service name, category, and web address.
              </p>
            </div>

            <div className="grid gap-6 p-6 md:grid-cols-2">
              <label className="block">
                <span className="text-sm font-semibold text-[#211C24]">
                  Service Name <span className="text-[#B000D4]">*</span>
                </span>

                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputClass}
                  required
                />
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-[#211C24]">
                  Service Category
                </span>

                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className={inputClass}
                  disabled={loadingCategories}
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
              </label>

              <label className="block md:col-span-2">
                <span className="text-sm font-semibold text-[#211C24]">
                  URL Slug <span className="text-[#B000D4]">*</span>
                </span>

                <input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className={inputClass}
                  required
                />

                <span className="mt-2 block text-xs text-[#6F6872]">
                  The web address used for this service.
                </span>
              </label>
            </div>
          </section>

          {/* Service Description */}
          <section className="overflow-hidden rounded-2xl border border-[#E9E6EB] !bg-white shadow-sm">
            <div className="border-b border-[#E9E6EB] bg-white px-6 py-5">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#6A0D8F]">
                02
              </p>

              <h2 className="mt-1 text-lg font-bold text-[#211C24]">
                Service Description
              </h2>

              <p className="mt-1 text-sm text-[#6F6872]">
                Give customers enough information to understand the service.
              </p>
            </div>

            <div className="space-y-6 p-6">
              <label className="block">
                <span className="text-sm font-semibold text-[#211C24]">
                  Short Description
                </span>

                <input
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                  className={inputClass}
                />
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-[#211C24]">
                  Full Description
                </span>

                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={7}
                  className={textareaClass}
                />
              </label>
            </div>
          </section>

          {/* Pricing */}
          <section className="overflow-hidden rounded-2xl border border-[#E9E6EB] !bg-white shadow-sm">
            <div className="border-b border-[#E9E6EB] bg-[#F4F3F5] px-6 py-5">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#6A0D8F]">
                03
              </p>

              <h2 className="mt-1 text-lg font-bold text-[#211C24]">
                Pricing
              </h2>

              <p className="mt-1 text-sm text-[#6F6872]">
                Update the starting price and pricing unit.
              </p>
            </div>

            <div className="grid gap-6 p-6 md:grid-cols-2">
              <label className="block">
                <span className="text-sm font-semibold text-[#211C24]">
                  Starting Price
                </span>

                <div className="mt-2 flex w-full overflow-hidden rounded-xl border border-[#E9E6EB] bg-white transition focus-within:border-[#6A0D8F] focus-within:ring-4 focus-within:ring-[#6A0D8F]/10">
                  <span className="flex shrink-0 items-center border-r border-[#E9E6EB] bg-[#F4F3F5] px-4 text-sm font-semibold text-[#6A0D8F]">
                    GH₵
                  </span>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={startingPrice}
                    onChange={(e) => setStartingPrice(e.target.value)}
                    placeholder="0.00"
                    className="min-w-0 flex-1 border-0 !bg-white px-4 py-3.5 text-[15px] text-[#211C24] outline-none"
                  />
                </div>
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-[#211C24]">
                  Price Unit
                </span>

                <input
                  value={priceUnit}
                  onChange={(e) => setPriceUnit(e.target.value)}
                  placeholder="per piece, per 100, per design..."
                  className={inputClass}
                />
              </label>
            </div>
          </section>

          {/* Publishing & Display */}
          <section className="overflow-hidden rounded-2xl border border-[#E9E6EB] !bg-white shadow-sm">
            <div className="border-b border-[#E9E6EB] bg-[#F4F3F5] px-6 py-5">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#B000D4]">
                04
              </p>

              <h2 className="mt-1 text-lg font-bold text-[#211C24]">
                Publishing & Display
              </h2>

              <p className="mt-1 text-sm text-[#6F6872]">
                Decide whether customers can see the service and how it is
                highlighted.
              </p>
            </div>

            <div className="grid gap-4 p-6 md:grid-cols-2">
              <button
                type="button"
                onClick={() => setIsActive(!isActive)}
                aria-pressed={isActive}
                className={`flex items-center justify-between rounded-xl border p-4 text-left transition ${
                  isActive
                    ? "border-[#E9E6EB] bg-[#F4F3F5]"
                    : "border-[#E9E6EB] bg-white"
                }`}
              >
                <span>
                  <span className="block text-sm font-semibold text-[#211C24]">
                    Active Service
                  </span>

                  <span className="mt-1 block text-xs leading-5 text-[#6F6872]">
                    {isActive
                      ? "Customers can see and request this service."
                      : "The service is hidden from active listings."}
                  </span>
                </span>

                <span
                  className={`ml-4 flex h-6 w-11 shrink-0 items-center rounded-full p-1 transition ${
                    isActive ? "bg-[#6A0D8F]" : "bg-[#6F6872]"
                  }`}
                >
                  <span
                    className={`h-4 w-4 rounded-full bg-white transition ${
                      isActive ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </span>
              </button>

              <button
                type="button"
                onClick={() => setIsFeatured(!isFeatured)}
                aria-pressed={isFeatured}
                className={`flex items-center justify-between rounded-xl border p-4 text-left transition ${
                  isFeatured
                    ? "border-[#E9E6EB] bg-[#F4F3F5]"
                    : "border-[#E9E6EB] bg-white"
                }`}
              >
                <span>
                  <span className="block text-sm font-semibold text-[#211C24]">
                    Featured Service
                  </span>

                  <span className="mt-1 block text-xs leading-5 text-[#6F6872]">
                    Highlight this service in featured areas.
                  </span>
                </span>

                <span
                  className={`ml-4 flex h-6 w-11 shrink-0 items-center rounded-full p-1 transition ${
                    isFeatured ? "bg-[#B000D4]" : "bg-[#6F6872]"
                  }`}
                >
                  <span
                    className={`h-4 w-4 rounded-full bg-white transition ${
                      isFeatured ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </span>
              </button>

              <label className="block md:col-span-2 md:max-w-xs">
                <span className="text-sm font-semibold text-[#211C24]">
                  Display Order
                </span>

                <input
                  type="number"
                  min="0"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className={inputClass}
                />

                <span className="mt-2 block text-xs text-[#6F6872]">
                  Lower numbers appear first.
                </span>
              </label>
            </div>
          </section>

          {/* Actions */}
          <div className="flex flex-col gap-4 rounded-2xl border border-[#E9E6EB] bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-[#211C24]">
                Ready to save your changes?
              </p>

              <p className="mt-1 text-xs text-[#6F6872]">
                Your changes will update this existing service.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => router.push("/admin/services")}
                className="rounded-xl border border-[#E9E6EB] bg-white px-5 py-3 text-sm font-semibold text-[#211C24] transition hover:bg-[#F4F3F5] hover:text-[#6A0D8F]"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-[#6A0D8F] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#48066A] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Saving Changes..." : "Save Changes"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}