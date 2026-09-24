"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  product_count: number;
};

async function fetchCategories(): Promise<Category[]> {
  const response = await fetch("/api/manage-product-categories");

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Unable to load categories.");
  }

  return result.categories ?? [];
}

export default function ProductCategoriesPage() {
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [sortOrder, setSortOrder] = useState("0");
  const [isActive, setIsActive] = useState(true);

  function generateSlug(value: string) {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function handleNameChange(value: string) {
    setName(value);

    if (!editingId || !slug || slug === generateSlug(name)) {
      setSlug(generateSlug(value));
    }
  }

  async function loadCategories() {
    try {
      setLoading(true);

      const nextCategories = await fetchCategories();

      setCategories(nextCategories);
    } catch (error) {
      console.error(error);
      alert("Unable to load product categories.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function loadInitialCategories() {
      try {
        const nextCategories = await fetchCategories();

        if (!cancelled) {
          setCategories(nextCategories);
          setLoading(false);
        }
      } catch (error) {
        console.error(error);

        if (!cancelled) {
          setLoading(false);
          alert("Unable to load product categories.");
        }
      }
    }

    void loadInitialCategories();

    return () => {
      cancelled = true;
    };
  }, []);

  function resetForm() {
    setEditingId(null);
    setName("");
    setSlug("");
    setDescription("");
    setSortOrder("0");
    setIsActive(true);
  }

  function startEditing(category: Category) {
    setEditingId(category.id);
    setName(category.name);
    setSlug(category.slug);
    setDescription(category.description ?? "");
    setSortOrder(String(category.sort_order));
    setIsActive(category.is_active);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!name.trim()) {
      alert("Category name is required.");
      return;
    }

    if (!slug.trim()) {
      alert("Category slug is required.");
      return;
    }

    const parsedSortOrder = Number.parseInt(sortOrder, 10);

    if (!Number.isFinite(parsedSortOrder) || parsedSortOrder < 0) {
      alert("Sort order must be a valid number.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch("/api/manage-product-categories", {
        method: editingId ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: editingId,
          name: name.trim(),
          slug: slug.trim(),
          description: description.trim() || null,
          sort_order: parsedSortOrder,
          is_active: isActive,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        alert(result.message || "Unable to save category.");
        return;
      }

      resetForm();
      await loadCategories();
    } catch (error) {
      console.error(error);
      alert("Something went wrong while saving the category.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(category: Category) {
    try {
      const response = await fetch("/api/manage-product-categories", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: category.id,
          name: category.name,
          slug: category.slug,
          description: category.description,
          sort_order: category.sort_order,
          is_active: !category.is_active,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        alert(result.message || "Unable to update category.");
        return;
      }

      await loadCategories();
    } catch (error) {
      console.error(error);
      alert("Something went wrong while updating the category.");
    }
  }

  async function deleteCategory(category: Category) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${category.name}"?`,
    );

    if (!confirmed) return;

    try {
      const response = await fetch("/api/manage-product-categories", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: category.id,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        alert(result.message || "Unable to delete category.");
        return;
      }

      await loadCategories();
    } catch (error) {
      console.error(error);
      alert("Something went wrong while deleting the category.");
    }
  }

  return (
    <div className="min-h-screen bg-[#F4F3F5] p-6 text-[#211C24] md:p-10">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <button
            type="button"
            onClick={() => router.push("/admin/products")}
            className="mb-5 text-sm text-[#6F6872] transition hover:text-[#6A0D8F]"
          >
            ← Back to Products
          </button>

          <p className="text-sm uppercase tracking-[0.2em] text-[#6A0D8F]">
            Catalog Management
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            Product Categories
          </h1>

          <p className="mt-2 text-sm text-[#6F6872]">
            Organize your products into categories for the BEEBZ PRINTS
            catalog.
          </p>
        </div>

        {/* Add / Edit Form */}
        <section className="mb-8 rounded-xl border border-[#E9E6EB] bg-white p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">
                {editingId ? "Edit Category" : "Add Category"}
              </h2>

              <p className="mt-1 text-sm text-[#6F6872]">
                {editingId
                  ? "Update the selected product category."
                  : "Create a category for your product catalog."}
              </p>
            </div>

            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg border border-[#E9E6EB] px-4 py-2 text-sm text-[#211C24] transition hover:bg-[#E9E6EB]"
              >
                Cancel Edit
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="mt-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Category Name *
                </label>

                <input
                  type="text"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. Business Cards"
                  required
                  className="w-full rounded-lg border border-[#E9E6EB] bg-[#F4F3F5] px-4 py-3 text-sm outline-none transition focus:border-[#6A0D8F]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Slug *
                </label>

                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(generateSlug(e.target.value))}
                  placeholder="business-cards"
                  required
                  className="w-full rounded-lg border border-[#E9E6EB] bg-[#F4F3F5] px-4 py-3 text-sm outline-none transition focus:border-[#6A0D8F]"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium">
                  Description
                </label>

                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe this product category..."
                  rows={4}
                  className="w-full resize-none rounded-lg border border-[#E9E6EB] bg-[#F4F3F5] px-4 py-3 text-sm outline-none transition focus:border-[#6A0D8F]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Sort Order
                </label>

                <input
                  type="number"
                  min="0"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="w-full rounded-lg border border-[#E9E6EB] bg-[#F4F3F5] px-4 py-3 text-sm outline-none transition focus:border-[#6A0D8F]"
                />
              </div>

              <div className="flex items-center">
                <label className="flex cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="h-4 w-4 accent-[#6A0D8F]"
                  />

                  <div>
                    <p className="text-sm font-medium">Active Category</p>

                    <p className="text-xs text-[#6F6872]">
                      Active categories appear in the product form.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-[#6A0D8F] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#B000D4] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving
                  ? "Saving..."
                  : editingId
                    ? "Update Category"
                    : "Add Category"}
              </button>
            </div>
          </form>
        </section>

        {/* Categories List */}
        <section className="overflow-hidden rounded-xl border border-[#E9E6EB] bg-white">
          <div className="border-b border-[#E9E6EB] px-6 py-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold">Categories</h2>

                <p className="mt-1 text-xs text-[#6F6872]">
                  {categories.length}{" "}
                  {categories.length === 1 ? "category" : "categories"}
                </p>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="px-6 py-16 text-center text-sm text-[#6F6872]">
              Loading categories...
            </div>
          ) : categories.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#F4F3F5] text-2xl">
                📁
              </div>

              <h3 className="text-lg font-semibold">
                No product categories yet
              </h3>

              <p className="mt-2 text-sm text-[#6F6872]">
                Create your first category above.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] text-left">
                <thead className="border-b border-[#E9E6EB] text-xs uppercase tracking-wider text-[#6F6872]">
                  <tr>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Products</th>
                    <th className="px-6 py-4">Slug</th>
                    <th className="px-6 py-4">Order</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#E9E6EB]">
                  {categories.map((category) => (
                    <tr
                      key={category.id}
                      className="transition hover:bg-[#F4F3F5]"
                    >
                      <td className="px-6 py-5">
                        <p className="font-semibold">{category.name}</p>

                        {category.description && (
                          <p className="mt-1 max-w-md truncate text-xs text-[#6F6872]">
                            {category.description}
                          </p>
                        )}
                      </td>

                      <td className="px-6 py-5">
                        <span className="inline-flex min-w-[40px] items-center justify-center rounded-full bg-[#6A0D8F]/10 px-3 py-1 text-sm font-semibold text-[#6A0D8F]">
                          {category.product_count}
                        </span>
                      </td>

                      <td className="px-6 py-5 text-sm text-[#6F6872]">
                        {category.slug}
                      </td>

                      <td className="px-6 py-5 text-sm text-[#211C24]">
                        {category.sort_order}
                      </td>

                      <td className="px-6 py-5">
                        {category.is_active ? (
                          <span className="rounded-full bg-green-500/10 px-3 py-1 text-xs font-medium text-green-400">
                            Active
                          </span>
                        ) : (
                          <span className="rounded-full bg-gray-500/10 px-3 py-1 text-xs font-medium text-[#6F6872]">
                            Inactive
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-5">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => startEditing(category)}
                            className="rounded-lg border border-[#E9E6EB] px-3 py-2 text-xs text-[#211C24] transition hover:bg-[#E9E6EB] hover:text-[#6A0D8F]"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() => toggleActive(category)}
                            className="rounded-lg border border-[#E9E6EB] px-3 py-2 text-xs text-[#211C24] transition hover:bg-[#E9E6EB] hover:text-[#6A0D8F]"
                          >
                            {category.is_active ? "Disable" : "Enable"}
                          </button>

                          <button
                            type="button"
                            onClick={() => deleteCategory(category)}
                            className="rounded-lg border border-red-500/20 px-3 py-2 text-xs text-red-400 transition hover:bg-red-500/10"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}