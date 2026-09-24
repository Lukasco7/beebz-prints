"use client";

import {
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import { useTransition } from "react";

type Category = {
  id: string;
  name: string;
};

export default function ProductFilters({
  categories,
}: {
  categories: Category[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());

    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }

    params.delete("page");

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  function clearFilters() {
    startTransition(() => {
      router.push(pathname);
    });
  }

  const search = searchParams.get("search") ?? "";
  const category = searchParams.get("category") ?? "";
  const status = searchParams.get("status") ?? "";
  const featured = searchParams.get("featured") ?? "";
  const sort = searchParams.get("sort") ?? "newest";

  const inputClass =
    "shrink-0 rounded-xl border border-[#E9E6EB] bg-white px-4 py-3 text-sm text-[#211C24] shadow-sm outline-none transition placeholder:text-[#6F6872] focus:border-[#6A0D8F] focus:ring-2 focus:ring-[#6A0D8F]/10";

  return (
    <div className="border-b border-[#E9E6EB] bg-white p-5">
      {/* Horizontal Filter Area */}
      <div className="w-full overflow-x-auto pb-3">
        <div className="flex w-max min-w-full items-center gap-3">
          {/* Search */}
          <input
            type="search"
            placeholder="Search products..."
            defaultValue={search}
            onChange={(event) => {
              updateFilter("search", event.target.value);
            }}
            className={`${inputClass} w-[280px]`}
          />

          {/* Category */}
          <select
            value={category}
            onChange={(event) =>
              updateFilter("category", event.target.value)
            }
            className={`${inputClass} w-[190px]`}
          >
            <option value="">All Categories</option>

            {categories.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>

          {/* Status */}
          <select
            value={status}
            onChange={(event) =>
              updateFilter("status", event.target.value)
            }
            className={`${inputClass} w-[160px]`}
          >
            <option value="">All Status</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>

          {/* Featured */}
          <select
            value={featured}
            onChange={(event) =>
              updateFilter("featured", event.target.value)
            }
            className={`${inputClass} w-[180px]`}
          >
            <option value="">All Products</option>
            <option value="featured">Featured</option>
            <option value="not-featured">Not Featured</option>
          </select>

          {/* Sort */}
          <select
            value={sort}
            onChange={(event) =>
              updateFilter("sort", event.target.value)
            }
            className={`${inputClass} w-[180px]`}
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="name-asc">Name A–Z</option>
            <option value="name-desc">Name Z–A</option>
            <option value="price-low">Price Low–High</option>
            <option value="price-high">Price High–Low</option>
          </select>

          {/* Clear */}
          <button
            type="button"
            onClick={clearFilters}
            disabled={isPending}
            className="w-[100px] shrink-0 rounded-xl border border-[#E9E6EB] bg-[#F4F3F5] px-4 py-3 text-sm font-medium text-[#211C24] transition hover:border-[#6A0D8F] hover:bg-white hover:text-[#6A0D8F] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Scroll hint */}
      <div className="flex items-center justify-between text-xs text-[#6F6872]">
        <span>
          {isPending ? "Updating products..." : "Use the filters above"}
        </span>

        <span className="hidden sm:block">
          ← Scroll horizontally →
        </span>
      </div>
    </div>
  );
}