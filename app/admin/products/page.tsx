import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import DeleteProductButton from "./DeleteProductButton";
import ProductFilters from "./ProductFilters";

export const instant = false;

type SearchParams = {
  search?: string;
  category?: string;
  status?: string;
  featured?: string;
  sort?: string;
  page?: string;
};

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const supabase = await createClient();

  const params = await searchParams;

  const search = params.search?.trim() ?? "";
  const category = params.category ?? "";
  const status = params.status ?? "";
  const featured = params.featured ?? "";
  const sort = params.sort ?? "newest";
  const page = Math.max(Number(params.page ?? "1") || 1, 1);

  const pageSize = 20;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  // --------------------------------------------------
  // Categories
  // --------------------------------------------------

  const { data: categories, error: categoriesError } = await supabase
    .from("product_categories")
    .select("id, name")
    .order("name", { ascending: true });

  if (categoriesError) {
    return (
      <div className="p-6 md:p-10">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <h1 className="text-2xl font-bold text-red-700">
            Unable to load product categories
          </h1>

          <p className="mt-3 text-sm text-red-600">
            {categoriesError.message}
          </p>
        </div>
      </div>
    );
  }

  // --------------------------------------------------
  // Products
  // --------------------------------------------------

  let query = supabase
    .from("products")
    .select(
      `
        id,
        name,
        slug,
        short_description,
        image_url,
        starting_price,
        price_unit,
        is_featured,
        is_published,
        sort_order,
        created_at,
        product_categories (
          id,
          name
        )
      `,
      { count: "exact" }
    );

  // Search
  if (search) {
    const escapedSearch = search.replace(/[%_]/g, "\\$&");

    query = query.or(
      `name.ilike.%${escapedSearch}%,slug.ilike.%${escapedSearch}%,short_description.ilike.%${escapedSearch}%`
    );
  }

  // Category
  if (category) {
    query = query.eq("category_id", category);
  }

  // Published / Draft
  if (status === "published") {
    query = query.eq("is_published", true);
  }

  if (status === "draft") {
    query = query.eq("is_published", false);
  }

  // Featured
  if (featured === "featured") {
    query = query.eq("is_featured", true);
  }

  if (featured === "not-featured") {
    query = query.eq("is_featured", false);
  }

  // Sorting
  switch (sort) {
    case "oldest":
      query = query.order("created_at", { ascending: true });
      break;

    case "name-asc":
      query = query.order("name", { ascending: true });
      break;

    case "name-desc":
      query = query.order("name", { ascending: false });
      break;

    case "price-low":
      query = query.order("starting_price", {
        ascending: true,
        nullsFirst: false,
      });
      break;

    case "price-high":
      query = query.order("starting_price", {
        ascending: false,
        nullsFirst: false,
      });
      break;

    default:
      query = query
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });
      break;
  }

  query = query.range(from, to);

  const { data: products, error, count } = await query;

  if (error) {
    return (
      <div className="p-6 md:p-10">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <h1 className="text-2xl font-bold text-red-700">
            Unable to load products
          </h1>

          <p className="mt-3 text-sm text-red-600">
            {error.message}
          </p>
        </div>
      </div>
    );
  }

  // --------------------------------------------------
  // Statistics
  // --------------------------------------------------

  const totalMatchingProducts = count ?? 0;

  const publishedProducts =
    products?.filter((product) => product.is_published).length ?? 0;

  const featuredProducts =
    products?.filter((product) => product.is_featured).length ?? 0;

  const unpublishedProducts =
    products?.filter((product) => !product.is_published).length ?? 0;

  const totalPages = Math.max(
    Math.ceil(totalMatchingProducts / pageSize),
    1
  );

  const currentPage = Math.min(page, totalPages);

  const showingFrom =
    totalMatchingProducts === 0 ? 0 : from + 1;

  const showingTo = Math.min(
    to + 1,
    totalMatchingProducts
  );

  return (
    <div className="min-h-screen bg-[#F4F3F5] p-6 text-[#211C24] md:p-10">
      {/* Back to Dashboard */}
      <div className="mb-6">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 rounded-lg border border-[#E9E6EB] bg-white px-4 py-2 text-sm font-medium text-[#6F6872] shadow-sm transition hover:bg-[#E9E6EB] hover:text-[#48066A]"
        >
          ← Back to Dashboard
        </Link>
      </div>

      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-[#6A0D8F]">
            Catalog Management
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#211C24]">
            Products
          </h1>

          <p className="mt-2 text-sm text-[#6F6872]">
            Manage the products displayed on your BEEBZ PRINTS website.
          </p>
        </div>

        <Link
          href="/admin/products/new"
          className="inline-flex items-center justify-center rounded-lg bg-[#6A0D8F] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#48066A]"
        >
          + Add Product
        </Link>
      </div>

      {/* Stats */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-[#E9E6EB] bg-white p-5 shadow-sm">
          <p className="text-sm text-[#6F6872]">
            Products Found
          </p>

          <p className="mt-2 text-3xl font-bold text-[#211C24]">
            {totalMatchingProducts}
          </p>
        </div>

        <div className="rounded-xl border border-[#E9E6EB] bg-white p-5 shadow-sm">
          <p className="text-sm text-[#6F6872]">
            Published
          </p>

          <p className="mt-2 text-3xl font-bold text-green-600">
            {publishedProducts}
          </p>
        </div>

        <div className="rounded-xl border border-[#E9E6EB] bg-white p-5 shadow-sm">
          <p className="text-sm text-[#6F6872]">
            Featured
          </p>

          <p className="mt-2 text-3xl font-bold text-[#B000D4]">
            {featuredProducts}
          </p>
        </div>

        <div className="rounded-xl border border-[#E9E6EB] bg-white p-5 shadow-sm">
          <p className="text-sm text-[#6F6872]">
            Drafts
          </p>

          <p className="mt-2 text-3xl font-bold text-[#6A0D8F]">
            {unpublishedProducts}
          </p>
        </div>
      </div>

      {/* Product Catalog */}
      <div className="overflow-hidden rounded-xl border border-[#E9E6EB] bg-white shadow-sm">
        <div className="border-b border-[#E9E6EB] px-6 py-5">
          <h2 className="font-semibold text-[#211C24]">
            Product Catalog
          </h2>

          <p className="mt-1 text-xs text-[#6F6872]">
            Search, filter and manage your products.
          </p>

          {totalMatchingProducts > 0 && (
            <p className="mt-2 text-xs text-[#6F6872]">
              Showing {showingFrom}–{showingTo} of{" "}
              {totalMatchingProducts} matching products
            </p>
          )}
        </div>

        {/* Filters */}
        <ProductFilters categories={categories ?? []} />

        {!products || products.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#F4F3F5] text-2xl">
              📦
            </div>

            <h3 className="text-lg font-semibold text-[#211C24]">
              No products found
            </h3>

            <p className="mt-2 text-sm text-[#6F6872]">
              Try changing your search or filters.
            </p>

            <Link
              href="/admin/products/new"
              className="mt-6 inline-flex rounded-lg bg-[#6A0D8F] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#48066A]"
            >
              Add Product
            </Link>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left">
                <thead className="border-b border-[#E9E6EB] bg-[#F4F3F5] text-xs uppercase tracking-wider text-[#6F6872]">
                  <tr>
                    <th className="px-6 py-4">
                      Product
                    </th>

                    <th className="px-6 py-4">
                      Category
                    </th>

                    <th className="px-6 py-4">
                      Price
                    </th>

                    <th className="px-6 py-4">
                      Status
                    </th>

                    <th className="px-6 py-4">
                      Featured
                    </th>

                    <th className="px-6 py-4 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#E9E6EB]">
                  {products.map((product) => {
                    const categoryData = Array.isArray(
                      product.product_categories
                    )
                      ? product.product_categories[0]
                      : product.product_categories;

                    return (
                      <tr
                        key={product.id}
                        className="transition hover:bg-[#F4F3F5]"
                      >
                        {/* Product */}
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-4">
                            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-[#E9E6EB] bg-[#F4F3F5]">
                              {product.image_url ? (
                                <Image
                                  src={product.image_url}
                                  alt={product.name}
                                  fill
                                  unoptimized
                                  sizes="64px"
                                  className="object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-xl">
                                  📦
                                </div>
                              )}
                            </div>

                            <div>
                              <p className="font-semibold text-[#211C24]">
                                {product.name}
                              </p>

                              <p className="mt-1 text-xs text-[#6F6872]">
                                /{product.slug}
                              </p>

                              {product.short_description && (
                                <p className="mt-1 max-w-xs truncate text-xs text-[#6F6872]">
                                  {product.short_description}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="px-6 py-5 text-sm text-[#211C24]">
                          {categoryData?.name ?? "Uncategorized"}
                        </td>

                        {/* Price */}
                        <td className="px-6 py-5 text-sm text-[#211C24]">
                          {product.starting_price !== null ? (
                            <div>
                              <span className="font-semibold">
                                GH₵{" "}
                                {Number(
                                  product.starting_price
                                ).toFixed(2)}
                              </span>

                              {product.price_unit && (
                                <span className="ml-1 text-xs text-[#6F6872]">
                                  / {product.price_unit}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-[#6F6872]">
                              Contact for price
                            </span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="px-6 py-5">
                          {product.is_published ? (
                            <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
                              Published
                            </span>
                          ) : (
                            <span className="rounded-full bg-[#F4F3F5] px-3 py-1 text-xs font-medium text-[#6A0D8F]">
                              Draft
                            </span>
                          )}
                        </td>

                        {/* Featured */}
                        <td className="px-6 py-5">
                          {product.is_featured ? (
                            <span className="rounded-full bg-[#B000D4]/10 px-3 py-1 text-xs font-medium text-[#6A0D8F]">
                              Featured
                            </span>
                          ) : (
                            <span className="text-xs text-[#6F6872]">
                              —
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-5">
                          <div className="flex justify-end gap-2">
                            <Link
                              href={`/products/${product.slug}`}
                              target="_blank"
                              className="rounded-lg border border-[#E9E6EB] bg-white px-3 py-2 text-xs font-medium text-[#6F6872] transition hover:bg-[#F4F3F5] hover:text-[#48066A]"
                            >
                              View
                            </Link>

                            <Link
                              href={`/admin/products/${product.id}`}
                              className="rounded-lg border border-[#E9E6EB] bg-white px-3 py-2 text-xs font-medium text-[#6F6872] transition hover:bg-[#F4F3F5] hover:text-[#48066A]"
                            >
                              Edit
                            </Link>

                            <DeleteProductButton
                              productId={product.id}
                              productName={product.name}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {totalMatchingProducts > 0 && totalPages > 1 && (
              <div className="flex flex-col gap-3 border-t border-[#E9E6EB] px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-[#6F6872]">
                  Page {currentPage} of {totalPages}
                </p>

                <div className="flex items-center gap-2">
                  {currentPage > 1 ? (
                    <Link
                      href={{
                        pathname: "/admin/products",
                        query: {
                          ...(search ? { search } : {}),
                          ...(category ? { category } : {}),
                          ...(status ? { status } : {}),
                          ...(featured ? { featured } : {}),
                          ...(sort ? { sort } : {}),
                          page: String(currentPage - 1),
                        },
                      }}
                      className="rounded-lg border border-[#E9E6EB] bg-white px-4 py-2 text-sm text-[#6F6872] transition hover:bg-[#F4F3F5] hover:text-[#48066A]"
                    >
                      ← Previous
                    </Link>
                  ) : (
                    <span className="cursor-not-allowed rounded-lg border border-[#E9E6EB] px-4 py-2 text-sm text-[#CFC8D4]">
                      ← Previous
                    </span>
                  )}

                  <span className="rounded-lg bg-[#6A0D8F] px-4 py-2 text-sm font-medium text-white">
                    {currentPage}
                  </span>

                  {currentPage < totalPages ? (
                    <Link
                      href={{
                        pathname: "/admin/products",
                        query: {
                          ...(search ? { search } : {}),
                          ...(category ? { category } : {}),
                          ...(status ? { status } : {}),
                          ...(featured ? { featured } : {}),
                          ...(sort ? { sort } : {}),
                          page: String(currentPage + 1),
                        },
                      }}
                      className="rounded-lg border border-[#E9E6EB] bg-white px-4 py-2 text-sm text-[#6F6872] transition hover:bg-[#F4F3F5] hover:text-[#48066A]"
                    >
                      Next →
                    </Link>
                  ) : (
                    <span className="cursor-not-allowed rounded-lg border border-[#E9E6EB] px-4 py-2 text-sm text-[#CFC8D4]">
                      Next →
                    </span>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}