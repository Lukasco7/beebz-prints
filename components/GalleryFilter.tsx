"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

type GalleryItem = {
  id: string;
  title: string;
  image_url: string | null;
  alt_text: string | null;
  description: string | null;
  is_featured: boolean | null;
  gallery_categories:
    | { name: string | null }[]
    | { name: string | null }
    | null;
};

type GalleryFilterProps = {
  gallery: GalleryItem[];
};

function getCategory(item: GalleryItem) {
  if (Array.isArray(item.gallery_categories)) {
    return item.gallery_categories[0]?.name || "Portfolio";
  }

  return item.gallery_categories?.name || "Portfolio";
}

export default function GalleryFilter({ gallery }: GalleryFilterProps) {
  const [activeCategory, setActiveCategory] = useState("All");

  const categories = useMemo(() => {
    const names = gallery
      .map(getCategory)
      .filter((name) => name && name !== "Portfolio");

    return ["All", ...Array.from(new Set(names))];
  }, [gallery]);

  const filteredGallery =
    activeCategory === "All"
      ? gallery
      : gallery.filter((item) => getCategory(item) === activeCategory);

  return (
    <div>
      <div className="mb-8 flex gap-2 overflow-x-auto pb-2">
        {categories.map((category) => {
          const active = activeCategory === category;

          return (
            <button
              key={category}
              type="button"
              onClick={() => setActiveCategory(category)}
              className={`whitespace-nowrap rounded-full border px-5 py-2.5 text-sm font-semibold transition ${
                active
                  ? "border-[#FF6B35] bg-[#FF6B35] text-white"
                  : "border-white/10 bg-white/[0.03] text-gray-400 hover:border-[#FF6B35]/40 hover:text-white"
              }`}
            >
              {category}
            </button>
          );
        })}
      </div>

      {filteredGallery.length === 0 ? (
        <p className="text-gray-500">No projects in this category yet.</p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredGallery.map((item) => (
            <div
              key={item.id}
              className="group overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]"
            >
              {item.image_url ? (
                <div className="relative h-80 w-full overflow-hidden">
                  <Image
                    src={item.image_url}
                    alt={item.alt_text || item.title}
                    fill
                    unoptimized
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition duration-500 group-hover:scale-105"
                  />
                </div>
              ) : (
                <div className="flex h-80 items-center justify-center bg-white/[0.03]">
                  <span className="text-sm font-semibold text-gray-600">
                    BEEBZ PRINTS
                  </span>
                </div>
              )}

              <div className="p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#FF6B35]">
                  {getCategory(item)}
                </p>

                <h3 className="mt-2 text-lg font-bold">{item.title}</h3>

                {item.description && (
                  <p className="mt-2 text-sm leading-6 text-gray-400">
                    {item.description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}