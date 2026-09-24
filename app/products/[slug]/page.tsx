import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProductInquiryForm from "@/components/ProductInquiryForm";
import ProductPriceCalculator from "@/components/ProductPriceCalculator";

export const instant = false;

type Product = {
  id: string;
  name: string;
  slug: string;
  short_description: string | null;
  description: string | null;
  image_url: string | null;
  starting_price: number | null;
  price_unit: string | null;
  features: string[] | null;
  is_featured: boolean;
};

type PricingTier = {
  id: string;
  minimum_quantity: number;
  unit_price: number;
};

function ProductPricing({
  tiers,
  fallbackPrice,
  priceUnit,
}: {
  tiers: PricingTier[];
  fallbackPrice: number | null;
  priceUnit: string | null;
}) {
  const formatPrice = (price: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "GHS",
    }).format(price);

  if (tiers.length === 0 && fallbackPrice === null) return null;

  return (
    <div>
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/50">
        {tiers.length > 0 ? "Volume Pricing" : "Starting Price"}
      </p>
      {tiers.length > 0 ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {tiers.map((tier) => (
            <div
              key={tier.id}
              className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"
            >
              <p className="text-sm text-white/55">
                {tier.minimum_quantity}+ {priceUnit ?? "units"}
              </p>
              <p className="mt-1 text-2xl font-bold">
                {formatPrice(tier.unit_price)}
                <span className="ml-1 text-sm font-normal text-white/50">
                  / {priceUnit ?? "unit"}
                </span>
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-2 text-3xl font-bold">
          {formatPrice(fallbackPrice as number)}
          {priceUnit && (
            <span className="ml-2 text-base font-normal text-white/50">
              / {priceUnit}
            </span>
          )}
        </p>
      )}
    </div>
  );
}

export default async function ProductDetailsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: product, error } = await supabase
    .from("products")
    .select(
      "id, name, slug, short_description, description, image_url, starting_price, price_unit, features, is_featured"
    )
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();

  if (error) {
    console.error("Product details error:", error);
  }

  if (!product) {
    notFound();
  }

  const item = product as Product;

  const { data: pricingTiers, error: pricingError } = await supabase
    .from("product_price_tiers")
    .select("id, minimum_quantity, unit_price")
    .eq("product_id", item.id)
    .order("minimum_quantity", { ascending: true });

  if (pricingError) {
    console.error("Product pricing error:", pricingError);
  }

  const tiers: PricingTier[] = (pricingTiers ?? []).map((tier) => ({
    id: tier.id,
    minimum_quantity: Number(tier.minimum_quantity),
    unit_price: Number(tier.unit_price),
  }));

  const features = Array.isArray(item.features) ? item.features : [];

  return (
    <main className="min-h-screen bg-[#080A0F] text-white">
      <section className="border-b border-white/10">
        <div className="mx-auto max-w-7xl px-6 py-8 md:px-10">
          <Link
            href="/products"
            className="inline-flex text-sm font-medium text-white/60 transition hover:text-[#B000D4]"
          >
            ← Back to Products
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-12 md:px-10 md:py-20">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-start">
          <div className="relative aspect-square overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04]">
            {item.image_url ? (
              <Image
                src={item.image_url}
                alt={item.name}
                fill
                priority
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-white/30">
                BEEBZ PRINTS
              </div>
            )}
          </div>

          <div className="pt-2">
            {item.is_featured && (
              <span className="inline-flex rounded-full bg-[#B000D4] px-3 py-1 text-xs font-semibold uppercase tracking-wider shadow-[0_0_20px_rgba(176,0,212,0.25)]">
                Featured
              </span>
            )}

            <p className="mt-5 text-sm font-semibold uppercase tracking-[0.25em] text-[#B000D4]">
              BEEBZ PRINTS
            </p>

            <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-6xl">
              {item.name}
            </h1>

            {item.short_description && (
              <p className="mt-6 text-lg leading-8 text-white/60">
                {item.short_description}
              </p>
            )}

            {/* Volume Pricing */}
            <div className="mt-8">
              <ProductPricing
                tiers={tiers}
                fallbackPrice={item.starting_price}
                priceUnit={item.price_unit}
              />

              <ProductPriceCalculator
                tiers={tiers}
                fallbackPrice={item.starting_price}
                priceUnit={item.price_unit}
              />
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href="#product-inquiry"
                className="inline-flex w-full items-center justify-center rounded-full bg-[#B000D4] px-7 py-4 font-semibold shadow-[0_0_30px_rgba(176,0,212,0.18)] transition hover:scale-[1.01] hover:bg-[#8F00A8] sm:w-auto"
              >
                Ask About This Product
              </a>

              <Link
                href="/#quote"
                className="inline-flex w-full items-center justify-center rounded-full border border-white/15 px-7 py-4 font-semibold text-white/80 transition hover:border-[#B000D4]/50 hover:text-white sm:w-auto"
              >
                Request a Quote
              </Link>
            </div>
          </div>
        </div>
      </section>

      {(item.description || features.length > 0) && (
        <section className="border-t border-white/10">
          <div className="mx-auto grid max-w-7xl gap-12 px-6 py-16 md:px-10 md:py-20 lg:grid-cols-[1.2fr_0.8fr]">
            {item.description && (
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#B000D4]">
                  Product Details
                </p>

                <h2 className="mt-3 text-3xl font-bold">What you get</h2>

                <p className="mt-6 whitespace-pre-line text-base leading-8 text-white/60">
                  {item.description}
                </p>
              </div>
            )}

            {features.length > 0 && (
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#B000D4]">
                  Features
                </p>

                <ul className="mt-5 space-y-4">
                  {features.map((feature, index) => (
                    <li
                      key={`${feature}-${index}`}
                      className="flex gap-3 border-b border-white/10 pb-4 text-white/75"
                    >
                      <span className="font-bold text-[#B000D4]">✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      )}

      <section id="product-inquiry" className="border-t border-white/10">
        <div className="mx-auto max-w-3xl px-6 py-16 md:px-10 md:py-20">
          <ProductInquiryForm
            productId={item.id}
            productName={item.name}
          />
        </div>
      </section>

      <section className="border-t border-white/10">
        <div className="mx-auto max-w-7xl px-6 py-16 text-center md:px-10 md:py-20">
          <h2 className="text-3xl font-bold md:text-5xl">
            Ready to print?
          </h2>

          <p className="mx-auto mt-4 max-w-xl text-white/55">
            Tell us what you need and we&apos;ll help you get the right
            printing solution for your project.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/#quote"
              className="rounded-full bg-[#B000D4] px-7 py-3.5 font-semibold shadow-[0_0_30px_rgba(176,0,212,0.18)] transition hover:scale-[1.02] hover:bg-[#8F00A8]"
            >
              Request a Quote
            </Link>

            <Link
              href="/products"
              className="rounded-full border border-white/15 px-7 py-3.5 font-semibold transition hover:border-white/30"
            >
              Browse Products
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
