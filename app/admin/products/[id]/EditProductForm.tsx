"use client";

import Image from "next/image";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Product = {
  id: string;
  name: string;
  slug: string;
  category_id: string | null;
  short_description: string | null;
  description: string | null;
  image_url: string | null;
  starting_price: number | null;
  price_unit: string | null;
  features: string[] | null;
  is_featured: boolean;
  is_published: boolean;
  sort_order: number | null;
  seo_title: string | null;
  seo_description: string | null;
};

type Category = {
  id: string;
  name: string;
};

type InitialPricingTier = {
  id?: string;
  minimum_quantity: number;
  unit_price: number | string;
};

type PricingTier = {
  id?: string;
  minimumQuantity: string;
  unitPrice: string;
};

type Props = {
  product: Product;
  categories: Category[];
  pricingTiers: InitialPricingTier[];
};

export default function EditProductForm({
  product,
  categories,
  pricingTiers: initialPricingTiers,
}: Props) {
  const router = useRouter();

  const [name, setName] = useState(product.name);
  const [slug, setSlug] = useState(product.slug);
  const [categoryId, setCategoryId] = useState(product.category_id ?? "");
  const [shortDescription, setShortDescription] = useState(
    product.short_description ?? ""
  );
  const [description, setDescription] = useState(product.description ?? "");
  const [priceUnit, setPriceUnit] = useState(
    product.price_unit ?? "per piece"
  );

  const [pricingTiers, setPricingTiers] = useState<PricingTier[]>(
    initialPricingTiers.length > 0
      ? initialPricingTiers.map((tier) => ({
          id: tier.id,
          minimumQuantity: String(tier.minimum_quantity),
          unitPrice: String(tier.unit_price),
        }))
      : [
          {
            minimumQuantity: "1",
            unitPrice: "",
          },
        ]
  );

  const [features, setFeatures] = useState<string[]>(
    product.features ?? [""]
  );

  const [isFeatured, setIsFeatured] = useState(product.is_featured);
  const [isPublished, setIsPublished] = useState(product.is_published);
  const [sortOrder, setSortOrder] = useState(
    product.sort_order?.toString() ?? "0"
  );

  const [seoTitle, setSeoTitle] = useState(product.seo_title ?? "");
  const [seoDescription, setSeoDescription] = useState(
    product.seo_description ?? ""
  );

  const [image, setImage] = useState<File | null>(null);
  const [removeImage, setRemoveImage] = useState(false);

  const [currentImageUrl, setCurrentImageUrl] = useState(
    product.image_url ?? ""
  );

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(""), 4000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  function addPricingTier() {
    setPricingTiers((prev) => [
      ...prev,
      {
        minimumQuantity: "",
        unitPrice: "",
      },
    ]);
  }

  function updatePricingTier(
    index: number,
    field: keyof PricingTier,
    value: string
  ) {
    setPricingTiers((prev) =>
      prev.map((tier, i) =>
        i === index
          ? {
              ...tier,
              [field]: value,
            }
          : tier
      )
    );
  }

  function removePricingTier(index: number) {
    if (pricingTiers.length === 1) {
      return;
    }

    setPricingTiers((prev) => prev.filter((_, i) => i !== index));
  }

  function addFeature() {
    setFeatures((prev) => [...prev, ""]);
  }

  function updateFeature(index: number, value: string) {
    setFeatures((prev) =>
      prev.map((feature, i) => (i === index ? value : feature))
    );
  }

  function removeFeature(index: number) {
    if (features.length === 1) {
      return;
    }

    setFeatures((prev) => prev.filter((_, i) => i !== index));
  }

  function handleImageChange(file: File | null) {
    setImage(file);

    if (file) {
      setRemoveImage(false);
    }
  }

  function handleRemoveImageChange(checked: boolean) {
    setRemoveImage(checked);

    if (checked) {
      setImage(null);
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setError("");
    setMessage("");

    // -----------------------------
    // Validate pricing tiers
    // -----------------------------

    if (pricingTiers.length === 0) {
      setError("Please add at least one pricing tier.");
      return;
    }

    const parsedPricingTiers = pricingTiers.map((tier) => ({
      id: tier.id,
      minimumQuantity: Number(tier.minimumQuantity),
      unitPrice: Number(tier.unitPrice),
    }));

    for (const tier of parsedPricingTiers) {
      if (
        !Number.isInteger(tier.minimumQuantity) ||
        tier.minimumQuantity <= 0
      ) {
        setError(
          "Every minimum quantity must be a positive whole number."
        );
        return;
      }

      if (!Number.isFinite(tier.unitPrice) || tier.unitPrice < 0) {
        setError("Every unit price must be zero or greater.");
        return;
      }
    }

    const quantities = parsedPricingTiers.map(
      (tier) => tier.minimumQuantity
    );

    const hasDuplicateQuantity =
      new Set(quantities).size !== quantities.length;

    if (hasDuplicateQuantity) {
      setError(
        "Each pricing tier must have a different minimum quantity."
      );
      return;
    }

    // Sort from lowest quantity to highest quantity.
    const sortedPricingTiers = [...parsedPricingTiers].sort(
      (a, b) => a.minimumQuantity - b.minimumQuantity
    );

    // The first tier becomes the product's starting price.
    const startingPrice = sortedPricingTiers[0].unitPrice;

    // -----------------------------
    // Clean features
    // -----------------------------

    const cleanedFeatures = features
      .map((feature) => feature.trim())
      .filter(Boolean);

    // -----------------------------
    // Create form data
    // -----------------------------

    const formData = new FormData();

    formData.append("id", product.id);
    formData.append("name", name.trim());
    formData.append("slug", slug.trim());
    formData.append("category_id", categoryId);

    formData.append(
      "short_description",
      shortDescription.trim()
    );

    formData.append("description", description.trim());

    formData.append(
      "starting_price",
      String(startingPrice)
    );

    formData.append(
      "price_unit",
      priceUnit.trim()
    );

    formData.append(
      "features",
      JSON.stringify(cleanedFeatures)
    );

    formData.append(
      "pricing_tiers",
      JSON.stringify(
        sortedPricingTiers.map((tier) => ({
          minimumQuantity: tier.minimumQuantity,
          unitPrice: tier.unitPrice,
        }))
      )
    );

    formData.append(
      "is_published",
      String(isPublished)
    );

    formData.append(
      "is_featured",
      String(isFeatured)
    );

    formData.append(
      "sort_order",
      sortOrder || "0"
    );

    formData.append(
      "seo_title",
      seoTitle.trim()
    );

    formData.append(
      "seo_description",
      seoDescription.trim()
    );

    formData.append(
      "remove_image",
      String(removeImage)
    );

    if (image) {
      formData.append("image", image);
    }

    // -----------------------------
    // Save
    // -----------------------------

    try {
      setLoading(true);

      const response = await fetch("/api/update-product", {
        method: "PUT",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to update product."
        );
      }

      setMessage("Product updated successfully.");

      if (data.image_url !== undefined) {
        setCurrentImageUrl(data.image_url ?? "");
      }

      router.refresh();

      setTimeout(() => {
        router.push("/admin/products");
      }, 1000);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while updating the product."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-8"
    >
      {/* Success message */}
      {message && (
        <div className="rounded-xl border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-400">
          {message}
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* =========================
          BASIC INFORMATION
      ========================== */}

      <section className="rounded-2xl border border-[#E9E6EB] bg-white p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-[#211C24]">
            Basic Information
          </h2>

          <p className="mt-1 text-sm text-[#6F6872]">
            Update the main information about this product.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Name */}
          <div>
            <label className="mb-2 block text-sm font-medium text-[#211C24]">
              Product Name
            </label>

            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-xl border border-[#E9E6EB] bg-white px-4 py-3 text-[#211C24] outline-none transition focus:border-[#6A0D8F]"
            />
          </div>

          {/* Slug */}
          <div>
            <label className="mb-2 block text-sm font-medium text-[#211C24]">
              Slug
            </label>

            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              required
              className="w-full rounded-xl border border-[#E9E6EB] bg-white px-4 py-3 text-[#211C24] outline-none transition focus:border-[#6A0D8F]"
            />

            <p className="mt-2 text-xs text-[#6F6872]">
              Example: business-cards
            </p>
          </div>

          {/* Category */}
          <div>
            <label className="mb-2 block text-sm font-medium text-[#211C24]">
              Product Category
            </label>

            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full rounded-xl border border-[#E9E6EB] bg-white px-4 py-3 text-[#211C24] outline-none transition focus:border-[#6A0D8F]"
            >
              <option value="">
                Select category
              </option>

              {categories.map((category) => (
                <option
                  key={category.id}
                  value={category.id}
                >
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Short Description */}
          <div>
            <label className="mb-2 block text-sm font-medium text-[#211C24]">
              Short Description
            </label>

            <input
              type="text"
              value={shortDescription}
              onChange={(e) =>
                setShortDescription(e.target.value)
              }
              className="w-full rounded-xl border border-[#E9E6EB] bg-white px-4 py-3 text-[#211C24] outline-none transition focus:border-[#6A0D8F]"
            />
          </div>

          {/* Description */}
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium text-[#211C24]">
              Description
            </label>

            <textarea
              value={description}
              onChange={(e) =>
                setDescription(e.target.value)
              }
              rows={6}
              className="w-full rounded-xl border border-[#E9E6EB] bg-white px-4 py-3 text-[#211C24] outline-none transition focus:border-[#6A0D8F]"
            />
          </div>
        </div>
      </section>

      {/* =========================
          PRODUCT IMAGE
      ========================== */}

      <section className="rounded-2xl border border-[#E9E6EB] bg-white p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-[#211C24]">
            Product Image
          </h2>

          <p className="mt-1 text-sm text-[#6F6872]">
            Replace or remove the current product image.
          </p>
        </div>

        {currentImageUrl && !removeImage && (
          <div className="mb-6">
            <p className="mb-3 text-sm font-medium text-[#211C24]">
              Current Image
            </p>

            <div className="relative h-48 w-48 overflow-hidden rounded-xl border border-[#E9E6EB]">
              <Image
                src={currentImageUrl}
                alt={product.name}
                fill
                unoptimized
                sizes="192px"
                className="object-cover"
              />
            </div>
          </div>
        )}

        <div>
          <label className="mb-2 block text-sm font-medium text-[#211C24]">
            Upload New Image
          </label>

          <input
            type="file"
            accept="image/*"
            onChange={(e) =>
              handleImageChange(
                e.target.files?.[0] ?? null
              )
            }
            className="block w-full text-sm text-[#6F6872] file:mr-4 file:rounded-lg file:border-0 file:bg-[#6A0D8F] file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:opacity-90"
          />
        </div>

        <label className="mt-5 flex items-center gap-3 text-sm text-[#211C24]">
          <input
            type="checkbox"
            checked={removeImage}
            onChange={(e) =>
              handleRemoveImageChange(e.target.checked)
            }
            className="h-4 w-4 rounded border-[#E9E6EB] bg-white"
          />

          Remove current image
        </label>
      </section>

      {/* =========================
          PRICING
      ========================== */}

      <section className="rounded-2xl border border-[#E9E6EB] bg-white p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-[#211C24]">
            Pricing
          </h2>

          <p className="mt-1 text-sm text-[#6F6872]">
            Set different prices based on the quantity a customer orders.
          </p>
        </div>

        <div className="mb-5 rounded-xl border border-[#6A0D8F]/20 bg-[#6A0D8F]/5 p-4">
          <p className="text-sm text-[#211C24]">
            Example:
          </p>

          <p className="mt-1 text-sm text-[#6F6872]">
            1 unit = GH₵30 · 100 units = GH₵25 · 500 units = GH₵22
          </p>

          <p className="mt-2 text-xs text-[#6F6872]">
            The system automatically uses the highest quantity tier
            that the customer&apos;s order qualifies for.
          </p>
        </div>

        <div className="space-y-4">
          {pricingTiers.map((tier, index) => (
            <div
              key={tier.id || `new-tier-${index}`}
              className="rounded-xl border border-[#E9E6EB] bg-white p-4"
            >
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-[#211C24]">
                    Tier {index + 1}
                  </p>

                  <p className="text-xs text-[#6F6872]">
                    Minimum quantity and unit price
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    removePricingTier(index)
                  }
                  disabled={pricingTiers.length === 1}
                  className="rounded-lg border border-red-500/20 px-3 py-2 text-xs font-medium text-red-400 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  Remove
                </button>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {/* Minimum Quantity */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-[#211C24]">
                    Minimum Quantity
                  </label>

                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={tier.minimumQuantity}
                    onChange={(e) =>
                      updatePricingTier(
                        index,
                        "minimumQuantity",
                        e.target.value
                      )
                    }
                    required
                    placeholder="1"
                    className="w-full rounded-xl border border-[#E9E6EB] bg-white px-4 py-3 text-[#211C24] outline-none transition focus:border-[#6A0D8F]"
                  />
                </div>

                {/* Unit Price */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-[#211C24]">
                    Unit Price (GH₵)
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={tier.unitPrice}
                    onChange={(e) =>
                      updatePricingTier(
                        index,
                        "unitPrice",
                        e.target.value
                      )
                    }
                    required
                    placeholder="30"
                    className="w-full rounded-xl border border-[#E9E6EB] bg-white px-4 py-3 text-[#211C24] outline-none transition focus:border-[#6A0D8F]"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addPricingTier}
          className="mt-5 rounded-xl border border-[#6A0D8F]/30 bg-[#F4F3F5] px-4 py-3 text-sm font-semibold text-[#6A0D8F] transition hover:bg-[#6A0D8F]/20"
        >
          + Add Pricing Tier
        </button>

        <div className="mt-6">
          <label className="mb-2 block text-sm font-medium text-[#211C24]">
            Price Unit
          </label>

          <input
            type="text"
            value={priceUnit}
            onChange={(e) =>
              setPriceUnit(e.target.value)
            }
            placeholder="per piece"
            className="w-full rounded-xl border border-[#E9E6EB] bg-white px-4 py-3 text-[#211C24] outline-none transition focus:border-[#6A0D8F]"
          />
        </div>
      </section>

      {/* =========================
          FEATURES
      ========================== */}

      <section className="rounded-2xl border border-[#E9E6EB] bg-white p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-[#211C24]">
            Features
          </h2>

          <p className="mt-1 text-sm text-[#6F6872]">
            Add the key selling points of this product.
          </p>
        </div>

        <div className="space-y-3">
          {features.map((feature, index) => (
            <div
              key={index}
              className="flex gap-3"
            >
              <input
                type="text"
                value={feature}
                onChange={(e) =>
                  updateFeature(index, e.target.value)
                }
                placeholder={`Feature ${index + 1}`}
                className="flex-1 rounded-xl border border-[#E9E6EB] bg-white px-4 py-3 text-[#211C24] outline-none transition focus:border-[#6A0D8F]"
              />

              <button
                type="button"
                onClick={() => removeFeature(index)}
                disabled={features.length === 1}
                className="rounded-xl border border-red-500/20 px-4 text-sm text-red-400 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-30"
              >
                Remove
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addFeature}
          className="mt-4 rounded-xl border border-[#E9E6EB] bg-white px-4 py-3 text-sm font-medium text-[#211C24] transition hover:bg-[#E9E6EB] hover:text-[#211C24]"
        >
          + Add Feature
        </button>
      </section>

      {/* =========================
          PUBLISHING
      ========================== */}

      <section className="rounded-2xl border border-[#E9E6EB] bg-white p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-[#211C24]">
            Publishing
          </h2>

          <p className="mt-1 text-sm text-[#6F6872]">
            Control how this product appears on the public website.
          </p>
        </div>

        <div className="space-y-5">
          <label className="flex items-center gap-3 text-sm text-[#211C24]">
            <input
              type="checkbox"
              checked={isPublished}
              onChange={(e) =>
                setIsPublished(e.target.checked)
              }
              className="h-4 w-4 rounded border-[#E9E6EB] bg-white"
            />

            Published
          </label>

          <label className="flex items-center gap-3 text-sm text-[#211C24]">
            <input
              type="checkbox"
              checked={isFeatured}
              onChange={(e) =>
                setIsFeatured(e.target.checked)
              }
              className="h-4 w-4 rounded border-[#E9E6EB] bg-white"
            />

            Featured Product
          </label>

          <div className="max-w-xs">
            <label className="mb-2 block text-sm font-medium text-[#211C24]">
              Sort Order
            </label>

            <input
              type="number"
              value={sortOrder}
              onChange={(e) =>
                setSortOrder(e.target.value)
              }
              className="w-full rounded-xl border border-[#E9E6EB] bg-white px-4 py-3 text-[#211C24] outline-none transition focus:border-[#6A0D8F]"
            />
          </div>
        </div>
      </section>

      {/* =========================
          SEO
      ========================== */}

      <section className="rounded-2xl border border-[#E9E6EB] bg-white p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-[#211C24]">
            SEO
          </h2>

          <p className="mt-1 text-sm text-[#6F6872]">
            Search engine information for this product.
          </p>
        </div>

        <div className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-[#211C24]">
              SEO Title
            </label>

            <input
              type="text"
              value={seoTitle}
              onChange={(e) =>
                setSeoTitle(e.target.value)
              }
              className="w-full rounded-xl border border-[#E9E6EB] bg-white px-4 py-3 text-[#211C24] outline-none transition focus:border-[#6A0D8F]"
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
              rows={4}
              className="w-full rounded-xl border border-[#E9E6EB] bg-white px-4 py-3 text-[#211C24] outline-none transition focus:border-[#6A0D8F]"
            />
          </div>
        </div>
      </section>

      {/* =========================
          ACTIONS
      ========================== */}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={() => router.push("/admin/products")}
          className="rounded-xl border border-[#E9E6EB] bg-white px-6 py-3 text-sm font-semibold text-[#211C24] transition hover:bg-[#E9E6EB] hover:text-[#211C24]"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-[#6A0D8F] px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </form>
  );
}