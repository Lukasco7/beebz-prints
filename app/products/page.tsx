import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";

export const instant = false;

type Product = {
  id: string;
  name: string;
  slug: string;
  short_description: string | null;
  image_url: string | null;
  starting_price: number | null;
  price_unit: string | null;
  is_featured: boolean;
};

export default async function ProductsPage() {
  const supabase = await createClient();

  const { data: products, error } = await supabase
    .from("products")
    .select(
      "id, name, slug, short_description, image_url, starting_price, price_unit, is_featured"
    )
    .eq("is_published", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Products page error:", error);
  }

  const items = (products || []) as Product[];

  return (
    <main className="min-h-screen bg-[#080A0F] text-white">
      <section className="border-b border-white/10">
        <div className="mx-auto max-w-7xl px-6 py-20 md:px-10 md:py-28">
          <Link
            href="/"
            className="mb-8 inline-flex text-sm font-medium text-white/60 transition hover:text-[#B000D4]"
          >
            ← Back to Home
          </Link>

          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.25em] text-[#B000D4]">
            BEEBZ PRINTS
          </p>

          <h1 className="max-w-4xl text-5xl font-bold tracking-tight md:text-7xl">
            PRINT PRODUCTS
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-white/60">
            Explore our printing and branding products. Choose what you need,
            view the details, and request a quote for your project.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16 md:px-10 md:py-24">
        {items.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] px-6 py-16 text-center">
            <h2 className="text-2xl font-semibold">No products available yet</h2>
            <p className="mx-auto mt-3 max-w-lg text-white/50">
              Published products added through the admin dashboard will appear
              here automatically.
            </p>
            <Link
              href="/#quote"
              className="mt-8 inline-flex rounded-full bg-[#B000D4] px-6 py-3 font-semibold text-white shadow-[0_0_30px_rgba(176,0,212,0.18)] transition hover:scale-[1.02] hover:bg-[#8F00A8]"
            >
              Request a Quote
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((product) => (
              <article
                key={product.id}
                className="group overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035] transition duration-300 hover:-translate-y-1 hover:border-[#B000D4]/40 hover:shadow-[0_16px_50px_rgba(176,0,212,0.10)]"
              >
                <Link href={`/products/${product.slug}`} className="block">
                  <div className="relative aspect-[4/3] overflow-hidden bg-white/[0.05]">
                    {product.image_url ? (
                      <Image
                        src={product.image_url}
                        alt={product.name}
                        fill
                        className="object-cover transition duration-500 group-hover:scale-105"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-white/30">
                        BEEBZ PRINTS
                      </div>
                    )}

                    {product.is_featured && (
                      <span className="absolute left-4 top-4 rounded-full bg-[#B000D4] px-3 py-1 text-xs font-semibold text-white shadow-[0_0_20px_rgba(176,0,212,0.25)]">
                        Featured
                      </span>
                    )}
                  </div>

                  <div className="p-6">
                    <h2 className="text-2xl font-semibold transition group-hover:text-[#B000D4]">
                      {product.name}
                    </h2>

                    {product.short_description && (
                      <p className="mt-3 line-clamp-3 text-sm leading-6 text-white/55">
                        {product.short_description}
                      </p>
                    )}

                    <div className="mt-6 flex items-end justify-between gap-4">
                      <div>
                        <p className="text-xs uppercase tracking-wider text-white/35">
                          Starting from
                        </p>
                        <p className="mt-1 text-lg font-semibold">
                          {product.starting_price !== null
                            ? `GH₵ ${Number(product.starting_price).toLocaleString()}`
                            : "Get a quote"}
                          {product.price_unit && (
                            <span className="ml-1 text-sm font-normal text-white/40">
                              {product.price_unit}
                            </span>
                          )}
                        </p>
                      </div>

                      <span className="text-sm font-semibold text-[#B000D4] transition group-hover:translate-x-0.5">
                        View Product →
                      </span>
                    </div>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="border-t border-white/10">
        <div className="mx-auto max-w-7xl px-6 py-16 text-center md:px-10 md:py-20">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#B000D4]">
            Need something custom?
          </p>
          <h2 className="mx-auto mt-4 max-w-3xl text-3xl font-bold tracking-tight md:text-5xl">
            Tell us what you want to print.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-white/55">
            Send us your requirements and our team can help you choose the
            right product and finish.
          </p>
          <Link
            href="/#quote"
            className="mt-8 inline-flex rounded-full bg-[#B000D4] px-7 py-3.5 font-semibold text-white shadow-[0_0_30px_rgba(176,0,212,0.18)] transition hover:scale-[1.02] hover:bg-[#8F00A8]"
          >
            Request a Quote
          </Link>
        </div>
      </section>
    </main>
  );
}
