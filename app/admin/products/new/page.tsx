"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Category = {
  id: string;
  name: string;
};

type PricingTier = {
  minimum_quantity: string;
  unit_price: string;
};

export default function NewProductPage() {
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
  const [pricingTiers, setPricingTiers] = useState<PricingTier[]>([
    { minimum_quantity: "1", unit_price: "" },
  ]);
  const [features, setFeatures] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);
  const [isPublished, setIsPublished] = useState(true);
  const [sortOrder, setSortOrder] = useState("0");
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [image, setImage] = useState<File | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadCategories() {
      try {
        const supabase = createClient();

        const { data, error } = await supabase
          .from("product_categories")
          .select("id, name")
          .eq("is_active", true)
          .order("sort_order", { ascending: true })
          .order("name", { ascending: true });

        if (error) {
          throw new Error(error.message);
        }

        if (mounted) {
          setCategories(data ?? []);
        }
      } catch (error) {
        console.error("Failed to load product categories:", error);
      } finally {
        if (mounted) {
          setLoadingCategories(false);
        }
      }
    }

    loadCategories();

    return () => {
      mounted = false;
    };
  }, []);

  function generateSlug(value: string) {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function handleNameChange(value: string) {
    setName(value);

    if (!slug || slug === generateSlug(name)) {
      setSlug(generateSlug(value));
    }
  }

  function updatePricingTier(
    index: number,
    field: keyof PricingTier,
    value: string
  ) {
    setPricingTiers((current) =>
      current.map((tier, tierIndex) =>
        tierIndex === index ? { ...tier, [field]: value } : tier
      )
    );
  }

  function addPricingTier() {
    setPricingTiers((current) => [
      ...current,
      { minimum_quantity: "", unit_price: "" },
    ]);
  }

  function removePricingTier(index: number) {
    setPricingTiers((current) => {
      if (current.length === 1) {
        return current;
      }

      return current.filter((_, tierIndex) => tierIndex !== index);
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!name.trim()) {
      alert("Product name is required.");
      return;
    }

    if (!slug.trim()) {
      alert("Product slug is required.");
      return;
    }

    if (!categoryId) {
      alert("Please select a product category.");
      return;
    }

    if (pricingTiers.length === 0) {
      alert("Please add at least one pricing tier.");
      return;
    }

    const normalizedTiers = pricingTiers.map((tier) => ({
      minimum_quantity: Number(tier.minimum_quantity),
      unit_price: Number(tier.unit_price),
    }));

    const invalidTier = normalizedTiers.some(
      (tier) =>
        !Number.isInteger(tier.minimum_quantity) ||
        tier.minimum_quantity <= 0 ||
        !Number.isFinite(tier.unit_price) ||
        tier.unit_price < 0
    );

    if (invalidTier) {
      alert(
        "Each pricing tier needs a whole-number minimum quantity greater than 0 and a valid unit price of 0 or greater."
      );
      return;
    }

    const quantities = normalizedTiers.map(
      (tier) => tier.minimum_quantity
    );

    if (new Set(quantities).size !== quantities.length) {
      alert("Each pricing tier must have a different minimum quantity.");
      return;
    }

    setSaving(true);

    try {
      const formData = new FormData();

      formData.append("name", name.trim());
      formData.append("slug", slug.trim());
      formData.append("category_id", categoryId);
      formData.append("short_description", shortDescription.trim());
      formData.append("description", description.trim());
      formData.append("starting_price", startingPrice);
      formData.append("price_unit", priceUnit.trim());
      formData.append("pricing_tiers", JSON.stringify(normalizedTiers));
      formData.append("features", features);
      formData.append("is_featured", String(isFeatured));
      formData.append("is_published", String(isPublished));
      formData.append("sort_order", sortOrder);
      formData.append("seo_title", seoTitle.trim());
      formData.append("seo_description", seoDescription.trim());

      if (image) {
        formData.append("image", image);
      }

      const response = await fetch("/api/create-product", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        alert(result.message || "Unable to create product.");
        return;
      }

      router.push("/admin/products");
      router.refresh();
    } catch (error) {
      console.error(error);
      alert("Something went wrong while creating the product.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-6 md:p-10">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <button
            type="button"
            onClick={() => router.back()}
            className="mb-5 inline-flex items-center gap-2 rounded-lg border border-[#E9E6EB] bg-white px-4 py-2 text-sm font-medium text-[#6F6872] transition hover:border-[#6A0D8F] hover:text-[#6A0D8F]"
          >
            ← Back to Products
          </button>

          <p className="text-sm uppercase tracking-[0.2em] text-[#6A0D8F]">
            Catalog Management
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#211C24]">
            Add Product
          </h1>

          <p className="mt-2 text-sm text-[#6F6872]">
            Add a product to the BEEBZ PRINTS catalog.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <section className="rounded-xl border border-[#E9E6EB] bg-white p-6">
            <h2 className="text-lg font-semibold text-[#211C24]">
              Basic Information
            </h2>

            <p className="mt-1 text-sm text-[#6F6872]">
              Basic details about the product.
            </p>

            <div className="mt-6 grid gap-6 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-[#211C24]">
                  Product Name *
                </label>

                <input
                  type="text"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. Premium Business Cards"
                  className="w-full rounded-lg border border-[#E9E6EB] bg-white px-4 py-3 text-sm text-[#211C24] outline-none transition placeholder:text-[#6F6872] focus:border-[#6A0D8F] focus:ring-2 focus:ring-[#6A0D8F]/10"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[#211C24]">
                  Slug *
                </label>

                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(generateSlug(e.target.value))}
                  placeholder="premium-business-cards"
                  className="w-full rounded-lg border border-[#E9E6EB] bg-white px-4 py-3 text-sm text-[#211C24] outline-none transition placeholder:text-[#6F6872] focus:border-[#6A0D8F] focus:ring-2 focus:ring-[#6A0D8F]/10"
                  required
                />

                <p className="mt-2 text-xs text-[#6F6872]">
                  Used for the product URL.
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[#211C24]">
                  Category *
                </label>

                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  disabled={loadingCategories || categories.length === 0}
                  required
                  className="w-full rounded-lg border border-[#E9E6EB] bg-white px-4 py-3 text-sm text-[#211C24] outline-none focus:border-[#6A0D8F] focus:ring-2 focus:ring-[#6A0D8F]/10"
                >
                  <option value="">
                    {loadingCategories
                      ? "Loading categories..."
                      : categories.length === 0
                        ? "No categories available"
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
                <label className="mb-2 block text-sm font-medium text-[#211C24]">
                  Sort Order
                </label>

                <input
                  type="number"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  min="0"
                  className="w-full rounded-lg border border-[#E9E6EB] bg-white px-4 py-3 text-sm text-[#211C24] outline-none focus:border-[#6A0D8F] focus:ring-2 focus:ring-[#6A0D8F]/10"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-[#211C24]">
                  Short Description
                </label>

                <input
                  type="text"
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                  placeholder="A short description of the product"
                  maxLength={200}
                  className="w-full rounded-lg border border-[#E9E6EB] bg-white px-4 py-3 text-sm text-[#211C24] outline-none placeholder:text-[#6F6872] focus:border-[#6A0D8F] focus:ring-2 focus:ring-[#6A0D8F]/10"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-[#211C24]">
                  Full Description
                </label>

                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the product in more detail..."
                  rows={6}
                  className="w-full resize-none rounded-lg border border-[#E9E6EB] bg-white px-4 py-3 text-sm text-[#211C24] outline-none placeholder:text-[#6F6872] focus:border-[#6A0D8F] focus:ring-2 focus:ring-[#6A0D8F]/10"
                />
              </div>
            </div>
          </section>

          {/* Pricing */}
          <section className="rounded-xl border border-[#E9E6EB] bg-white p-6">
            <h2 className="text-lg font-semibold text-[#211C24]">
              Pricing
            </h2>

            <p className="mt-1 text-sm text-[#6F6872]">
              Add at least one pricing tier. The first tier is used as the
              product starting price.
            </p>

            <div className="mt-6 grid gap-6 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-[#211C24]">
                  Starting Price
                </label>

                <div className="flex">
                  <span className="flex items-center rounded-l-lg border border-r-0 border-[#E9E6EB] bg-[#F4F3F5] px-4 text-sm text-[#6F6872]">
                    GH₵
                  </span>

                  <input
                    type="number"
                    value={startingPrice}
                    onChange={(e) => setStartingPrice(e.target.value)}
                    placeholder="Optional — first tier will be used"
                    min="0"
                    step="0.01"
                    className="w-full rounded-r-lg border border-[#E9E6EB] bg-white px-4 py-3 text-sm text-[#211C24] outline-none placeholder:text-[#6F6872] focus:border-[#6A0D8F] focus:ring-2 focus:ring-[#6A0D8F]/10"
                  />
                </div>

                <p className="mt-2 text-xs text-[#6F6872]">
                  The API automatically sets this to the lowest-quantity tier
                  price.
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[#211C24]">
                  Price Unit
                </label>

                <input
                  type="text"
                  value={priceUnit}
                  onChange={(e) => setPriceUnit(e.target.value)}
                  placeholder="e.g. per 100 cards"
                  className="w-full rounded-lg border border-[#E9E6EB] bg-white px-4 py-3 text-sm text-[#211C24] outline-none placeholder:text-[#6F6872] focus:border-[#6A0D8F] focus:ring-2 focus:ring-[#6A0D8F]/10"
                />
              </div>
            </div>

            <div className="mt-8 border-t border-[#E9E6EB] pt-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-base font-semibold text-[#211C24]">
                    Pricing Tiers
                  </h3>

                  <p className="mt-1 text-sm text-[#6F6872]">
                    Example: 1 unit = GH₵30, 100 units = GH₵25, 500 units =
                    GH₵22.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={addPricingTier}
                  className="inline-flex items-center justify-center rounded-lg bg-[#6A0D8F] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#48066A]"
                >
                  + Add Tier
                </button>
              </div>

              <div className="mt-5 space-y-4">
                {pricingTiers.map((tier, index) => (
                  <div
                    key={index}
                    className="rounded-xl border border-[#E9E6EB] bg-[#F4F3F5] p-4"
                  >
                    <div className="mb-4 flex items-center justify-between">
                      <span className="text-sm font-semibold text-[#211C24]">
                        Tier {index + 1}
                      </span>

                      {pricingTiers.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removePricingTier(index)}
                          className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 hover:text-red-700"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-[#211C24]">
                          Minimum Quantity
                        </label>

                        <input
                          type="number"
                          min="1"
                          step="1"
                          value={tier.minimum_quantity}
                          onChange={(e) =>
                            updatePricingTier(
                              index,
                              "minimum_quantity",
                              e.target.value
                            )
                          }
                          placeholder="1"
                          className="w-full rounded-lg border border-[#E9E6EB] bg-white px-4 py-3 text-sm text-[#211C24] outline-none placeholder:text-[#6F6872] focus:border-[#6A0D8F] focus:ring-2 focus:ring-[#6A0D8F]/10"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium text-[#211C24]">
                          Unit Price
                        </label>

                        <div className="flex">
                          <span className="flex items-center rounded-l-lg border border-r-0 border-[#E9E6EB] bg-[#F4F3F5] px-4 text-sm text-[#6F6872]">
                            GH₵
                          </span>

                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={tier.unit_price}
                            onChange={(e) =>
                              updatePricingTier(
                                index,
                                "unit_price",
                                e.target.value
                              )
                            }
                            placeholder="30.00"
                            className="w-full rounded-r-lg border border-[#E9E6EB] bg-white px-4 py-3 text-sm text-[#211C24] outline-none placeholder:text-[#6F6872] focus:border-[#6A0D8F] focus:ring-2 focus:ring-[#6A0D8F]/10"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Image */}
          <section className="rounded-xl border border-[#E9E6EB] bg-white p-6">
            <h2 className="text-lg font-semibold text-[#211C24]">
              Product Image
            </h2>

            <p className="mt-1 text-sm text-[#6F6872]">
              Upload a high-quality image for this product.
            </p>

            <div className="mt-6">
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-[#E9E6EB] bg-[#F4F3F5] px-6 py-12 text-center transition hover:border-[#6A0D8F] hover:bg-white">
                <div className="text-4xl">🖼️</div>

                <p className="mt-4 text-sm font-medium text-[#211C24]">
                  {image
                    ? image.name
                    : "Click to choose a product image"}
                </p>

                <p className="mt-2 text-xs text-[#6F6872]">
                  JPG, JPEG, PNG or WEBP — maximum 10MB
                </p>

                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) =>
                    setImage(e.target.files?.[0] ?? null)
                  }
                  className="hidden"
                />
              </label>
            </div>
          </section>

          {/* Features */}
          <section className="rounded-xl border border-[#E9E6EB] bg-white p-6">
            <h2 className="text-lg font-semibold text-[#211C24]">
              Features
            </h2>

            <p className="mt-1 text-sm text-[#6F6872]">
              Enter one feature per line.
            </p>

            <textarea
              value={features}
              onChange={(e) => setFeatures(e.target.value)}
              placeholder={`Premium paper stock
Full-color printing
Professional finishing
Fast turnaround`}
              rows={6}
              className="mt-6 w-full resize-none rounded-lg border border-[#E9E6EB] bg-white px-4 py-3 text-sm text-[#211C24] outline-none placeholder:text-[#6F6872] focus:border-[#6A0D8F] focus:ring-2 focus:ring-[#6A0D8F]/10"
            />
          </section>

          {/* Publishing */}
          <section className="rounded-xl border border-[#E9E6EB] bg-white p-6">
            <h2 className="text-lg font-semibold text-[#211C24]">
              Publishing
            </h2>

            <div className="mt-6 space-y-5">
              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={isPublished}
                  onChange={(e) =>
                    setIsPublished(e.target.checked)
                  }
                  className="h-4 w-4 accent-[#6A0D8F]"
                />

                <div>
                  <p className="text-sm font-medium text-[#211C24]">
                    Published
                  </p>

                  <p className="text-xs text-[#6F6872]">
                    Published products can appear on the public website.
                  </p>
                </div>
              </label>

              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) =>
                    setIsFeatured(e.target.checked)
                  }
                  className="h-4 w-4 accent-[#6A0D8F]"
                />

                <div>
                  <p className="text-sm font-medium text-[#211C24]">
                    Featured Product
                  </p>

                  <p className="text-xs text-[#6F6872]">
                    Featured products can be highlighted on the website.
                  </p>
                </div>
              </label>
            </div>
          </section>

          {/* SEO */}
          <section className="rounded-xl border border-[#E9E6EB] bg-white p-6">
            <h2 className="text-lg font-semibold text-[#211C24]">
              SEO
            </h2>

            <p className="mt-1 text-sm text-[#6F6872]">
              Optional search engine information.
            </p>

            <div className="mt-6 space-y-6">
              <div>
                <label className="mb-2 block text-sm font-medium text-[#211C24]">
                  SEO Title
                </label>

                <input
                  type="text"
                  value={seoTitle}
                  onChange={(e) => setSeoTitle(e.target.value)}
                  placeholder="Premium Business Cards | BEEBZ PRINTS"
                  className="w-full rounded-lg border border-[#E9E6EB] bg-white px-4 py-3 text-sm text-[#211C24] outline-none placeholder:text-[#6F6872] focus:border-[#6A0D8F] focus:ring-2 focus:ring-[#6A0D8F]/10"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[#211C24]">
                  SEO Description
                </label>

                <textarea
                  value={seoDescription}
                  onChange={(e) =>
                    setSeoDescription(e.target.value)
                  }
                  placeholder="Professional business card printing from BEEBZ PRINTS..."
                  rows={4}
                  className="w-full resize-none rounded-lg border border-[#E9E6EB] bg-white px-4 py-3 text-sm text-[#211C24] outline-none placeholder:text-[#6F6872] focus:border-[#6A0D8F] focus:ring-2 focus:ring-[#6A0D8F]/10"
                />
              </div>
            </div>
          </section>

          {/* Actions */}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => router.back()}
              className="rounded-lg border border-[#E9E6EB] bg-white px-6 py-3 text-sm font-medium text-[#6F6872] transition hover:border-[#6A0D8F] hover:text-[#6A0D8F]"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-[#6A0D8F] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#48066A] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Creating Product..." : "Create Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}