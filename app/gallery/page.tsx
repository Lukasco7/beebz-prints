import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import GalleryFilter from "@/components/GalleryFilterWithLightbox";

export const instant = false;

export default async function GalleryPage() {
  const supabase = await createClient();

  const { data: gallery, error } = await supabase
    .from("gallery")
    .select(`
      id,
      title,
      slug,
      image_url,
      alt_text,
      description,
      is_featured,
      gallery_categories (
        name
      )
    `)
    .eq("is_published", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to load gallery:", error);
  }

  const items = gallery || [];

  return (
    <main className="min-h-screen bg-[#080A0F] text-white">
      {/* NAVIGATION */}
      <header className="border-b border-white/10 bg-[#080A0F]/95">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link href="/" className="text-xl font-bold tracking-tight">
            <span className="text-white">BEEBZ</span>{" "}
            <span className="text-[#B000D4]">PRINTS</span>
          </Link>

          <Link
            href="/"
            className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-gray-300 transition hover:border-[#B000D4]/50 hover:text-white"
          >
            ← Back to Website
          </Link>
        </div>
      </header>

      {/* HERO */}
      <section className="border-b border-white/10 py-24">
        <div className="mx-auto max-w-7xl px-6">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-[#B000D4]">
            Our Portfolio
          </p>

          <h1 className="max-w-4xl text-5xl font-bold leading-[0.95] tracking-tight sm:text-6xl lg:text-8xl">
            WORK THAT
            <br />
            <span className="text-[#B000D4]">STANDS OUT.</span>
          </h1>

          <p className="mt-8 max-w-2xl text-lg leading-8 text-gray-400">
            Explore our collection of printing, branding, design, and creative
            projects created for businesses, organizations, brands, and
            individuals.
          </p>
        </div>
      </section>

      {/* GALLERY */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-6">
          {items.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-12 text-center">
              <p className="text-lg font-semibold text-white">
                Portfolio coming soon.
              </p>

              <p className="mt-2 text-sm text-gray-500">
                Our latest projects will appear here.
              </p>
            </div>
          ) : (
            <GalleryFilter gallery={items} />
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-white/10 py-24">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#B000D4]">
            Start Your Project
          </p>

          <h2 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
            HAVE AN IDEA?
            <br />
            LET&apos;S BRING IT TO LIFE.
          </h2>

          <p className="mx-auto mt-5 max-w-xl text-gray-400">
            Tell us what you need and let&apos;s create something that gets
            noticed.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              href="/#quote"
              className="rounded-full bg-[#B000D4] px-7 py-4 text-sm font-bold text-white shadow-[0_0_30px_rgba(176,0,212,0.18)] transition hover:bg-[#8F00A8]"
            >
              GET A QUOTE
            </Link>

            <Link
              href="/"
              className="rounded-full border border-white/15 px-7 py-4 text-sm font-bold text-white transition hover:bg-white/5"
            >
              BACK TO WEBSITE
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/10 py-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 text-sm text-gray-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            <span className="font-bold text-white">BEEBZ</span>{" "}
            <span className="font-bold text-[#B000D4]">PRINTS</span>
          </p>

          <p>Professional Printing. Creative Branding.</p>
        </div>
      </footer>
    </main>
  );
}
