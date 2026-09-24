"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

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

type Props = {
  gallery: GalleryItem[];
};

function getCategory(item: GalleryItem) {
  if (Array.isArray(item.gallery_categories)) {
    return item.gallery_categories[0]?.name || "Portfolio";
  }

  return item.gallery_categories?.name || "Portfolio";
}

export default function GalleryFilter({ gallery }: Props) {
  const [activeCategory, setActiveCategory] = useState("All");
  const [selected, setSelected] = useState<GalleryItem | null>(null);

  const categories = [
    "All",
    ...Array.from(
      new Set(
        gallery
          .map(getCategory)
          .filter((name) => name && name !== "Portfolio"),
      ),
    ),
  ];

  const filteredGallery =
    activeCategory === "All"
      ? gallery
      : gallery.filter(
          (item) => getCategory(item) === activeCategory,
        );

  const selectedIndex = selected
    ? filteredGallery.findIndex((item) => item.id === selected.id)
    : -1;

  const goToPrevious = useCallback(() => {
    if (selectedIndex === -1 || filteredGallery.length === 0) return;

    const previousIndex =
      selectedIndex === 0
        ? filteredGallery.length - 1
        : selectedIndex - 1;

    setSelected(filteredGallery[previousIndex]);
  }, [selectedIndex, filteredGallery]);

  const goToNext = useCallback(() => {
    if (selectedIndex === -1 || filteredGallery.length === 0) return;

    const nextIndex =
      selectedIndex === filteredGallery.length - 1
        ? 0
        : selectedIndex + 1;

    setSelected(filteredGallery[nextIndex]);
  }, [selectedIndex, filteredGallery]);

  useEffect(() => {
    if (!selected) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelected(null);
      }

      if (event.key === "ArrowLeft") {
        goToPrevious();
      }

      if (event.key === "ArrowRight") {
        goToNext();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [selected, goToPrevious, goToNext]);

  return (
    <>
      {/* CATEGORY FILTERS */}
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
                  ? "border-[#B000D4] bg-[#B000D4] text-white"
                  : "border-white/10 bg-white/[0.03] text-gray-400 hover:border-[#B000D4]/40 hover:text-white"
              }`}
            >
              {category}
            </button>
          );
        })}
      </div>

      {/* GALLERY GRID */}
      {filteredGallery.length === 0 ? (
        <p className="text-gray-500">
          No projects in this category yet.
        </p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredGallery.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelected(item)}
              className="group block w-full overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] text-left transition duration-300 hover:-translate-y-1 hover:border-[#B000D4]/40 focus:outline-none focus:ring-2 focus:ring-[#B000D4]/60"
              aria-label={`View ${item.title}`}
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
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#B000D4]">
                  {getCategory(item)}
                </p>

                <h3 className="mt-2 text-lg font-bold">
                  {item.title}
                </h3>

                {item.description && (
                  <p className="mt-2 text-sm leading-6 text-gray-400">
                    {item.description}
                  </p>
                )}

                <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-gray-500 transition group-hover:text-[#B000D4]">
                  Click to view
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* LIGHTBOX */}
      {selected && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-3 backdrop-blur-md sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label={selected.title}
          onClick={() => setSelected(null)}
        >
          {/* MODAL */}
          <div
            className="relative grid h-[88vh] w-full max-w-6xl grid-cols-1 overflow-hidden rounded-3xl border border-white/10 bg-[#0B0D12] shadow-[0_30px_100px_rgba(0,0,0,0.7)] lg:grid-cols-[58%_42%]"
            onClick={(event) => event.stopPropagation()}
          >
            {/* CLOSE */}
            <button
              type="button"
              onClick={() => setSelected(null)}
              aria-label="Close gallery preview"
              className="absolute right-5 top-5 z-50 flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-black/70 text-2xl leading-none text-white transition hover:border-[#B000D4] hover:bg-[#B000D4]"
            >
              ×
            </button>

            {/* IMAGE PANEL */}
            <div className="relative flex min-h-0 items-center justify-center bg-black p-4 sm:p-6 lg:p-8">
              <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-2xl">
                {selected.image_url ? (
                  <Image
                    src={selected.image_url}
                    alt={selected.alt_text || selected.title}
                    fill
                    unoptimized
                    sizes="(max-width: 1024px) 100vw, 58vw"
                    className="object-contain"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <span className="text-sm font-semibold text-gray-500">
                      BEEBZ PRINTS
                    </span>
                  </div>
                )}
              </div>

              {/* PREVIOUS */}
              {filteredGallery.length > 1 && (
                <button
                  type="button"
                  onClick={goToPrevious}
                  aria-label="Previous project"
                  className="absolute left-5 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/70 text-2xl text-white transition hover:border-[#B000D4] hover:bg-[#B000D4]"
                >
                  ‹
                </button>
              )}

              {/* NEXT */}
              {filteredGallery.length > 1 && (
                <button
                  type="button"
                  onClick={goToNext}
                  aria-label="Next project"
                  className="absolute right-5 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/70 text-2xl text-white transition hover:border-[#B000D4] hover:bg-[#B000D4]"
                >
                  ›
                </button>
              )}

              {/* COUNTER */}
              <div className="absolute bottom-5 left-6 text-sm font-medium text-gray-400">
                {selectedIndex + 1} / {filteredGallery.length}
              </div>
            </div>

            {/* DETAILS PANEL */}
            <div className="flex min-h-0 flex-col justify-center overflow-y-auto border-t border-white/10 bg-[#0B0D12] p-8 sm:p-10 lg:border-l lg:border-t-0 lg:p-12">
              <div className="max-w-md">
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#B000D4]">
                  {getCategory(selected)}
                </p>

                <h2 className="mt-5 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                  {selected.title}
                </h2>

                <div className="mt-6 h-px w-16 bg-[#B000D4]" />

                {selected.description ? (
                  <p className="mt-7 text-lg leading-8 text-gray-400">
                    {selected.description}
                  </p>
                ) : (
                  <p className="mt-7 text-lg leading-8 text-gray-400">
                    No additional project details available.
                  </p>
                )}

                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-400">
                  BEEBZ PRINTS
                </p>

                <p className="mt-2 text-base text-gray-400">
                  Professional Printing. Creative Branding.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}