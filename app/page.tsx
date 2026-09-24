import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import GalleryFilter from "@/components/GalleryFilterWithLightbox";

export const instant = false;

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ quote?: string; product?: string }>;
}) {
  const supabase = await createClient();

  const params = await searchParams;
  const quoteSubmitted = params.quote === "success";
  const selectedProductId = params.product || "";
  const [
  settingsResult,
  servicesResult,
  galleryResult,
  galleryCategoriesResult,
  testimonialsResult,
  faqsResult,
  productsResult,
] = await Promise.all([
    supabase
      .from("site_settings")
      .select("business_name, tagline, logo_url, hero_image_url")
      .limit(1)
      .maybeSingle(),

    supabase
      .from("services")
      .select(`
        id,
        name,
        slug,
        short_description,
        starting_price,
        price_unit,
        is_featured,
        service_categories (
          name
        )
      `)
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),

    supabase
      .from("gallery")
      .select(`
        id,
        category_id,
        title,
        slug,
        image_url,
        alt_text,
        description,
        is_featured
      `)
      .eq("is_published", true)
      .order("sort_order", { ascending: true }),

    supabase
      .from("gallery_categories")
      .select("id, name")
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),

    supabase
      .from("testimonials")
      .select(`
        id,
        customer_name,
        company_name,
        content,
        rating,
        image_url
      `)
      .eq("is_published", true)
      .order("sort_order", { ascending: true }),

    supabase
      .from("faqs")
      .select(`
        id,
        question,
        answer
      `)
      .eq("is_published", true)
      .order("sort_order", { ascending: true }),

    supabase
      .from("products")
      .select(`
        id,
        name,
        slug,
        short_description,
        image_url,
        starting_price,
        price_unit,
        is_featured
      `)
      .eq("is_published", true)
      .order("sort_order", { ascending: true })
      .limit(6),
  ]);

  const businessName =
    settingsResult.data?.business_name || "BEEBZ PRINTS";

  const heroImage = settingsResult.data?.hero_image_url || null;
  const logoUrl = settingsResult.data?.logo_url || null;

  const tagline =
    settingsResult.data?.tagline ||
    "Professional Printing. Creative Branding.";

  const services = servicesResult.data || [];

  const galleryCategories = galleryCategoriesResult.data || [];
  const gallery = (galleryResult.data || []).map((item) => ({
    ...item,
    gallery_categories: item.category_id
      ? galleryCategories.find((category) => category.id === item.category_id) || null
      : null,
  }));

  if (galleryResult.error) {
    console.error("Failed to load homepage gallery:", galleryResult.error);
  }

  const testimonials = testimonialsResult.data || [];
  const faqs = faqsResult.data || [];
  const products = productsResult.data || [];

  return (
    <main className="min-h-screen bg-[#080A0F] text-white">
      {/* NAVIGATION */}
      <header className="fixed left-0 right-0 top-0 z-50 border-b border-white/10 bg-[#080A0F]/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link href="/" className="flex items-center">
            {logoUrl ? (
              <Image src={logoUrl} alt={businessName} width={180} height={36} className="h-9 w-auto max-w-[180px] object-contain" />
            ) : (
              <span className="text-xl font-bold tracking-tight">
                <span className="text-white">BEEBZ</span>{" "}
                <span className="text-[#B000D4]">PRINTS</span>
              </span>
            )}
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            {/* SERVICES DROPDOWN */}
            <div className="group relative">
              <a
                href="#services"
                className="inline-flex items-center gap-1.5 py-3 text-sm text-gray-300 transition hover:text-white"
                aria-haspopup="true"
              >
                Services

                <span className="text-[10px] text-gray-500 transition group-hover:rotate-180">
                  ▾
                </span>
              </a>

              <div className="invisible absolute left-1/2 top-[calc(100%+10px)] z-50 w-72 -translate-x-1/2 translate-y-2 rounded-2xl border border-white/10 bg-[#11151D] p-2 opacity-0 shadow-[0_20px_50px_rgba(0,0,0,0.45)] backdrop-blur-xl transition-all duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                <div className="px-4 pb-2 pt-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#B000D4]">
                    Our Services
                  </p>
                </div>

                <div className="max-h-80 overflow-y-auto">
                  {services.length > 0 ? (
                    services.map((service) => (
                      <a
                        key={service.id}
                        href="#services"
                        className="block rounded-xl px-4 py-2.5 text-sm text-gray-300 transition hover:bg-white/5 hover:text-[#B000D4]"
                      >
                        {service.name}
                      </a>
                    ))
                  ) : (
                    <p className="px-4 py-3 text-sm text-gray-500">
                      Services coming soon.
                    </p>
                  )}
                </div>

                <div className="mt-2 border-t border-white/10 pt-2">
                  <a
                    href="#services"
                    className="block rounded-xl px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#B000D4]/10 hover:text-[#B000D4]"
                  >
                    View All Services →
                  </a>
                </div>
              </div>
            </div>

            {/* PRODUCTS DROPDOWN */}
            <div className="group relative">
              <Link
                href="/products"
                className="inline-flex items-center gap-1.5 py-3 text-sm text-gray-300 transition hover:text-white"
                aria-haspopup="true"
              >
                Products
                <span className="text-[10px] text-gray-500 transition group-hover:rotate-180">
                  ▾
                </span>
              </Link>

              <div className="invisible absolute left-1/2 top-[calc(100%+10px)] z-50 w-72 -translate-x-1/2 translate-y-2 rounded-2xl border border-white/10 bg-[#11151D] p-2 opacity-0 shadow-[0_20px_50px_rgba(0,0,0,0.45)] backdrop-blur-xl transition-all duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                <div className="px-4 pb-2 pt-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#B000D4]">
                    Our Products
                  </p>
                </div>

                <div className="max-h-80 overflow-y-auto">
                  {products.length > 0 ? (
                    products.map((product) => (
                      <Link
                        key={product.id}
                        href={`/products/${product.slug}`}
                        className="block rounded-xl px-4 py-2.5 text-sm text-gray-300 transition hover:bg-white/5 hover:text-[#B000D4]"
                      >
                        {product.name}
                      </Link>
                    ))
                  ) : (
                    <p className="px-4 py-3 text-sm text-gray-500">
                      Products coming soon.
                    </p>
                  )}
                </div>

                <div className="mt-2 border-t border-white/10 pt-2">
                  <Link
                    href="/products"
                    className="block rounded-xl px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#B000D4]/10 hover:text-[#B000D4]"
                  >
                    View All Products →
                  </Link>
                </div>
              </div>
            </div>

            <a
              href="#work"
              className="text-sm text-gray-300 transition hover:text-white"
            >
              Our Work
            </a>

            <a
              href="#about"
              className="text-sm text-gray-300 transition hover:text-white"
            >
              Why Us
            </a>

            <a
              href="#faq"
              className="text-sm text-gray-300 transition hover:text-white"
            >
              FAQ
            </a>
          </nav>

          <Link
            href="#quote"
            className="hidden rounded-full bg-[#B000D4] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#C026D3] md:inline-flex"
          >
            Get a Quote
          </Link>
        </div>

        {/* MOBILE NAVIGATION */}
        <div className="border-t border-white/10 md:hidden">
          <details className="group">

            <summary className="flex cursor-pointer list-none items-center justify-between px-6 py-4 text-sm font-semibold text-white [&::-webkit-details-marker]:hidden">
              <span>MENU</span>
              <span className="text-[#B000D4] transition-transform duration-200 group-open:rotate-180">
                ▾
              </span>
            </summary>

            <div className="border-t border-white/10 bg-[#11151D] px-6 pb-5">
              <div className="pt-3">
                <a
                  href="#services"
                  className="block rounded-xl px-4 py-3 text-sm font-semibold text-gray-200 transition hover:bg-white/5 hover:text-[#B000D4]"
                >
                  Services
                </a>

                <div className="ml-4 border-l border-white/10 pl-3">
                  {services.length > 0 ? (
                    services.map((service) => (
                      <a
                        key={service.id}
                        href="#services"
                        className="block rounded-lg px-4 py-2.5 text-sm text-gray-400 transition hover:bg-white/5 hover:text-[#B000D4]"
                      >
                        {service.name}
                      </a>
                    ))
                  ) : (
                    <p className="px-4 py-2.5 text-sm text-gray-500">
                      Services coming soon.
                    </p>
                  )}
                </div>

                <Link
                  href="/products"
                  className="mt-2 block rounded-xl px-4 py-3 text-sm font-semibold text-gray-200 transition hover:bg-white/5 hover:text-[#B000D4]"
                >
                  Products
                </Link>

                <div className="ml-4 border-l border-white/10 pl-3">
                  {products.length > 0 ? (
                    products.map((product) => (
                      <Link
                        key={product.id}
                        href={`/products/${product.slug}`}
                        className="block rounded-lg px-4 py-2.5 text-sm text-gray-400 transition hover:bg-white/5 hover:text-[#B000D4]"
                      >
                        {product.name}
                      </Link>
                    ))
                  ) : (
                    <p className="px-4 py-2.5 text-sm text-gray-500">
                      Products coming soon.
                    </p>
                  )}
                </div>

                <a
                  href="#work"
                  className="mt-2 block rounded-xl px-4 py-3 text-sm font-semibold text-gray-200 transition hover:bg-white/5 hover:text-[#B000D4]"
                >
                  Our Work
                </a>

                <a
                  href="#about"
                  className="block rounded-xl px-4 py-3 text-sm font-semibold text-gray-200 transition hover:bg-white/5 hover:text-[#B000D4]"
                >
                  Why Us
                </a>

                <a
                  href="#faq"
                  className="block rounded-xl px-4 py-3 text-sm font-semibold text-gray-200 transition hover:bg-white/5 hover:text-[#B000D4]"
                >
                  FAQ
                </a>

                <Link
                  href="#quote"
                  className="mt-3 block rounded-xl bg-[#B000D4] px-4 py-3 text-center text-sm font-bold text-white transition hover:bg-[#C026D3]"
                >
                  Get a Quote
                </Link>
              </div>
            </div>
          </details>
        </div>
      </header>

      {/* HERO */}
      <section className="relative flex min-h-screen items-center overflow-hidden pt-24">
        <div className="absolute right-[-10%] top-[10%] h-[500px] w-[500px] rounded-full bg-[#48066A]/30 blur-[120px]" />

        <div className="relative mx-auto grid w-full max-w-7xl gap-16 px-6 py-24 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="mb-6 text-sm font-semibold uppercase tracking-[0.3em] text-[#B000D4]">
              {tagline}
            </p>

            <h1 className="max-w-4xl text-5xl font-bold leading-[0.95] tracking-tight sm:text-6xl lg:text-8xl">
              BRING YOUR
              <br />
              <span className="text-[#B000D4]">IDEAS</span> TO LIFE.
            </h1>

            <p className="mt-9 max-w-xl text-lg leading-8 text-gray-500">
              Premium printing and creative branding solutions designed to
              make your business stand out.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href="#quote"
                className="rounded-full bg-[#B000D4] px-7 py-4 text-sm font-bold shadow-[0_10px_35px_rgba(176,0,212,0.22)] transition hover:bg-[#C026D3]"
              >
                GET A QUOTE
              </Link>

              <a
                href="#work"
                className="rounded-full border border-white/15 px-7 py-4 text-sm font-bold transition hover:bg-white/5"
              >
                EXPLORE OUR WORK
              </a>
            </div>
          </div>

          <div className="relative">
            {heroImage ? (
              <div className="overflow-hidden rounded-3xl border border-white/10">
                <Image src={heroImage} alt={`${businessName} hero image`} width={1200} height={520} priority className="h-[520px] w-full object-cover" />
              </div>
            ) : (
              <div className="flex h-[520px] items-center justify-center rounded-3xl border border-white/10 bg-white/[0.03]">
                <span className="text-gray-500">
                  BEEBZ PRINTS
                </span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section id="services" className="scroll-mt-24 border-t border-white/10 py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-14 max-w-2xl">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-[#B000D4]">
              What We Do
            </p>

            <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">
              PRINTING THAT
              <br />
              GETS NOTICED.
            </h2>

            <p className="mt-5 text-gray-400">
              From everyday business materials to complete branding projects,
              we bring your ideas from concept to finished product.
            </p>
          </div>

          {services.length === 0 ? (
            <p className="text-gray-500">
              Services coming soon.
            </p>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {services.map((service, index) => (
                <div
                  key={service.id}
                  className="group rounded-2xl border border-white/10 bg-white/[0.03] p-7 transition duration-300 hover:-translate-y-1 hover:border-[#B000D4]/40 hover:shadow-[0_12px_40px_rgba(176,0,212,0.08)]"
                >
                  <span className="text-sm font-semibold text-[#B000D4]">
                    {String(index + 1).padStart(2, "0")}
                  </span>

                  <h3 className="mt-6 text-xl font-bold">
                    {service.name}
                  </h3>

                  <p className="mt-3 text-sm leading-6 text-gray-400">
                    {service.short_description ||
                      "Professional printing and branding solutions."}
                  </p>

                  {service.starting_price !== null && (
                    <p className="mt-6 text-sm font-medium text-white">
                      From{" "}
                      <span className="text-[#B000D4]">
                        GH₵
                        {Number(
                          service.starting_price
                        ).toLocaleString()}
                      </span>
                      {service.price_unit
                        ? ` / ${service.price_unit}`
                        : ""}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* PRODUCTS */}
      <section id="products" className="scroll-mt-24 border-t border-white/10 py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-14 flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-[#B000D4]">
                Our Products
              </p>

              <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">
                PRODUCTS MADE
                <br />
                TO IMPRESS.
              </h2>
            </div>

            <Link
              href="/products"
              className="inline-flex w-fit rounded-full border border-white/15 px-6 py-3 text-sm font-bold transition hover:bg-white/5"
            >
              VIEW ALL PRODUCTS
            </Link>
          </div>

          {products.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8">
              <p className="text-gray-500">
                Products coming soon.
              </p>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <Link
                  key={product.id}
                  href={`/products/${product.slug}`}
                  className="group overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] transition duration-300 hover:-translate-y-1 hover:border-[#B000D4]/40 hover:shadow-[0_12px_40px_rgba(176,0,212,0.08)]"
                >
                  {product.image_url ? (
                    <div className="overflow-hidden">
                      <Image src={product.image_url} alt={product.name} width={800} height={288} className="h-72 w-full object-cover transition duration-500 group-hover:scale-105" />
                    </div>
                  ) : (
                    <div className="flex h-72 items-center justify-center bg-white/[0.03]">
                      <span className="text-sm font-semibold text-gray-500">
                        BEEBZ PRINTS
                      </span>
                    </div>
                  )}

                  <div className="p-6">
                    {product.is_featured && (
                      <p className="text-xs font-semibold uppercase tracking-wider text-[#B000D4]">
                        Featured
                      </p>
                    )}

                    <h3 className="mt-2 text-xl font-bold">
                      {product.name}
                    </h3>

                    {product.short_description && (
                      <p className="mt-3 text-sm leading-6 text-gray-400">
                        {product.short_description}
                      </p>
                    )}

                    {product.starting_price !== null && (
                      <p className="mt-5 text-sm font-medium text-white">
                        From{" "}
                        <span className="text-[#B000D4]">
                          GH₵{" "}
                          {Number(product.starting_price).toLocaleString()}
                        </span>
                        {product.price_unit ? ` / ${product.price_unit}` : ""}
                      </p>
                    )}

                    <p className="mt-5 text-sm font-semibold text-white transition group-hover:text-[#B000D4]">
                      VIEW PRODUCT →
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* GALLERY */}
      <section id="work" className="scroll-mt-24 border-t border-white/10 py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-14 flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-[#B000D4]">
                Our Work
              </p>

              <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">
                BUILT TO
                <br />
                STAND OUT.
              </h2>
            </div>

            <p className="max-w-md text-sm leading-6 text-gray-400">
              A selection of projects created for businesses, organizations,
              brands, and individuals.
            </p>
          </div>

          {gallery.length === 0 ? (
            <p className="text-gray-500">
              Portfolio coming soon.
            </p>
          ) : (
            <GalleryFilter gallery={gallery} />
          )}
        </div>
      </section>

      {/* WHY US */}
      <section
        id="about"
        className="scroll-mt-24 border-t border-white/10 bg-white/[0.02] py-24"
      >
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-16 lg:grid-cols-2">
            <div>
              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-[#B000D4]">
                Why BEEBZ PRINTS
              </p>

              <h2 className="text-4xl font-bold sm:text-5xl">
                QUALITY YOU
                <br />
                CAN SEE.
              </h2>
            </div>

            <div className="grid gap-8 sm:grid-cols-2">
              <div>
                <h3 className="text-lg font-bold">
                  Premium Quality
                </h3>

                <p className="mt-2 text-sm leading-6 text-gray-400">
                  We focus on clean finishing, strong materials and
                  professional results.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-bold">
                  Fast Turnaround
                </h3>

                <p className="mt-2 text-sm leading-6 text-gray-400">
                  We understand that your projects often have deadlines.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-bold">
                  Competitive Pricing
                </h3>

                <p className="mt-2 text-sm leading-6 text-gray-400">
                  Professional results without unnecessary costs.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-bold">
                  Creative Solutions
                </h3>

                <p className="mt-2 text-sm leading-6 text-gray-400">
                  We help turn your ideas into practical, memorable
                  designs.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      {testimonials.length > 0 && (
        <section className="border-t border-white/10 py-24">
          <div className="mx-auto max-w-7xl px-6">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-[#B000D4]">
              Client Feedback
            </p>

            <h2 className="text-4xl font-bold sm:text-5xl">
              WHAT OUR CLIENTS SAY.
            </h2>

            <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {testimonials.map((testimonial) => (
                <div
                  key={testimonial.id}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-7"
                >
                  <div className="text-[#B000D4]">
                    {"★".repeat(
                      Math.min(testimonial.rating || 5, 5)
                    )}
                  </div>

                  <p className="mt-5 text-sm leading-7 text-gray-300">
                    “{testimonial.content}”
                  </p>

                  <div className="mt-7">
                    <p className="font-semibold">
                      {testimonial.customer_name}
                    </p>

                    {testimonial.company_name && (
                      <p className="mt-1 text-xs text-gray-500">
                        {testimonial.company_name}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* QUOTE */}
<section
  id="quote"
  className="scroll-mt-24 border-t border-white/10 py-24"
>
  <div className="mx-auto max-w-5xl px-6">
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 sm:p-12">
      {quoteSubmitted ? (
        /* SUCCESS STATE */
        <div className="flex min-h-[500px] flex-col items-center justify-center text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full border border-[#B000D4]/40 bg-[#B000D4]/10">
            <span className="text-4xl text-[#B000D4]">✓</span>
          </div>

          <p className="mt-8 text-sm font-semibold uppercase tracking-[0.25em] text-[#B000D4]">
            Request Received
          </p>

          <h2 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
            QUOTE REQUEST
            <br />
            RECEIVED.
          </h2>

          <p className="mt-6 max-w-lg text-base leading-7 text-gray-400">
            Thank you for contacting BEEBZ PRINTS. We&apos;ve received your
            request and will review the details. Our team will get back to
            you shortly.
          </p>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Link
              href="/"
              className="rounded-full bg-[#B000D4] px-7 py-4 text-sm font-bold shadow-[0_10px_35px_rgba(176,0,212,0.22)] transition hover:bg-[#C026D3]"
            >
              BACK TO WEBSITE
            </Link>

            <Link
              href="/?newquote=true#quote"
              className="rounded-full border border-white/15 px-7 py-4 text-sm font-bold transition hover:bg-white/5"
            >
              SUBMIT ANOTHER REQUEST
            </Link>
          </div>
        </div>
      ) : (
        /* QUOTE FORM */
        <>
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#B000D4]">
            Start Your Project
          </p>

          <h2 className="mt-4 text-4xl font-bold sm:text-5xl">
            LET&apos;S MAKE
            <br />
            SOMETHING GREAT.
          </h2>

          <p className="mt-5 max-w-xl text-gray-400">
           <b> Tell us what you need and we&apos;ll get back to you with a quote.</b>
          </p>

          <form
  action="/api/submit-quote"
  method="POST"
  className="mt-10 grid gap-5 sm:grid-cols-2"
>
  {/* CUSTOMER INFORMATION */}

  <div className="sm:col-span-2">
    <p className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#B000D4]">
      Customer Information
    </p>
    <p className="text-sm text-gray-500">
      Tell us how we can reach you.
    </p>
  </div>

  <input
    name="name"
    required
    placeholder="Your Name *"
    className="rounded-xl border border-white/10 bg-black/20 px-4 py-4 text-white outline-none placeholder:text-gray-600 focus:border-[#B000D4]"
  />

  <input
    name="company"
    placeholder="Company Name"
    className="rounded-xl border border-white/10 bg-black/20 px-4 py-4 text-white outline-none placeholder:text-gray-600 focus:border-[#B000D4]"
  />

  <input
    name="email"
    type="email"
    placeholder="Email Address"
    className="rounded-xl border border-white/10 bg-black/20 px-4 py-4 text-white outline-none placeholder:text-gray-600 focus:border-[#B000D4]"
  />

  <input
    name="phone"
    required
    placeholder="Phone / WhatsApp *"
    className="rounded-xl border border-white/10 bg-black/20 px-4 py-4 text-white outline-none placeholder:text-gray-600 focus:border-[#B000D4]"
  />

 {/* PRODUCT */}

<div className="sm:col-span-2">
  <p className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#B000D4]">
    Product
  </p>

  <p className="mb-3 text-sm text-gray-500">
    Select the product you want a quote for.
  </p>

  <select
    name="product_id"
    required
    defaultValue={selectedProductId}
    className="w-full rounded-xl border border-white/10 bg-[#11151D] px-4 py-4 text-white outline-none focus:border-[#B000D4]"
  >
    <option value="">Select a product *</option>

    {products.map((product) => (
      <option key={product.id} value={product.id}>
        {product.name}
      </option>
    ))}
  </select>
</div>
  {/* REQUEST DETAILS */}

  <div className="sm:col-span-2 mt-4">
    <p className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#B000D4]">
      Request Details
    </p>

    <p className="text-sm text-gray-500">
      Give us the details of what you need.
    </p>
  </div>

  <select
    name="service"
    required
    className="rounded-xl border border-white/10 bg-[#11151D] px-4 py-4 text-white outline-none focus:border-[#B000D4]"
  >
    <option value="">Select a service *</option>

    {services.map((service) => (
      <option key={service.id} value={service.name}>
        {service.name}
      </option>
    ))}
  </select>

  <input
    name="quantity"
    type="number"
    min="1"
    placeholder="Quantity"
    className="rounded-xl border border-white/10 bg-black/20 px-4 py-4 text-white outline-none placeholder:text-gray-600 focus:border-[#B000D4]"
  />

  <input
    name="size"
    placeholder="Size / Dimensions (e.g. A4, 3ft × 6ft)"
    className="rounded-xl border border-white/10 bg-black/20 px-4 py-4 text-white outline-none placeholder:text-gray-600 focus:border-[#B000D4]"
  />

  <input
    name="budget"
    type="number"
    min="0"
    step="0.01"
    placeholder="Budget (GH₵)"
    className="rounded-xl border border-white/10 bg-black/20 px-4 py-4 text-white outline-none placeholder:text-gray-600 focus:border-[#B000D4]"
  />

  <textarea
    name="description"
    rows={5}
    placeholder="Tell us about your project..."
    className="sm:col-span-2 rounded-xl border border-white/10 bg-black/20 px-4 py-4 text-white outline-none placeholder:text-gray-600 focus:border-[#B000D4]"
  />

  <button
    type="submit"
    className="sm:col-span-2 rounded-xl bg-[#B000D4] px-6 py-4 font-bold transition hover:bg-[#C026D3]"
  >
    REQUEST A QUOTE
  </button>
</form>
        </>
      )}
    </div>
  </div>
</section>

      {/* FAQ */}
      <section
        id="faq"
        className="scroll-mt-24 border-t border-white/10 py-24"
      >
        <div className="mx-auto max-w-4xl px-6">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-[#B000D4]">
            FAQ
          </p>

          <h2 className="text-4xl font-bold sm:text-5xl">
            FREQUENTLY ASKED QUESTIONS.
          </h2>

          {faqs.length === 0 ? (
            <p className="mt-12 text-gray-500">
              Frequently asked questions coming soon.
            </p>
          ) : (
            <div className="mt-12 space-y-4">
              {faqs.map((faq) => (
                <details
                  key={faq.id}
                  className="group rounded-xl border border-white/10 bg-white/[0.03] p-6"
                >
                  <summary className="cursor-pointer list-none font-semibold">
                    {faq.question}
                  </summary>

                  <p className="mt-4 text-sm leading-7 text-gray-400">
                    {faq.answer}
                  </p>
                </details>
              ))}
            </div>
          )}
        </div>
      </section>
      <section
  id="contact"
  className="border-t border-white/10 bg-[#080A0F] px-6 py-20"
>
  <div className="mx-auto max-w-6xl">
    <div className="mb-10 max-w-2xl">
      <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-[#B000D4]">
        Contact Us
      </p>

      <h2 className="text-3xl font-bold tracking-tight text-white md:text-5xl">
        Send Us a Message
      </h2>

      <p className="mt-4 text-base leading-7 text-gray-400">
        Have a question, need more information, or want to discuss a project?
        Send us a message and our team will get back to you.
      </p>
    </div>

    <form
      action="/api/submit-message"
      method="POST"
      className="max-w-3xl space-y-6"
    >
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <label
            htmlFor="message-name"
            className="mb-2 block text-sm font-medium text-gray-300"
          >
            Name
          </label>

          <input
            id="message-name"
            type="text"
            name="name"
            required
            placeholder="Your name"
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-gray-500 focus:border-[#B000D4]"
          />
        </div>

        <div>
          <label
            htmlFor="message-email"
            className="mb-2 block text-sm font-medium text-gray-300"
          >
            Email
          </label>

          <input
            id="message-email"
            type="email"
            name="email"
            required
            placeholder="you@example.com"
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-gray-500 focus:border-[#B000D4]"
          />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <label
            htmlFor="message-phone"
            className="mb-2 block text-sm font-medium text-gray-300"
          >
            Phone / WhatsApp
          </label>

          <input
            id="message-phone"
            type="tel"
            name="phone"
            placeholder="Your phone number"
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-gray-500 focus:border-[#B000D4]"
          />
        </div>

        <div>
          <label
            htmlFor="message-subject"
            className="mb-2 block text-sm font-medium text-gray-300"
          >
            Subject
          </label>

          <input
            id="message-subject"
            type="text"
            name="subject"
            placeholder="What is your message about?"
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-gray-500 focus:border-[#B000D4]"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="message-content"
          className="mb-2 block text-sm font-medium text-gray-300"
        >
          Message
        </label>

        <textarea
          id="message-content"
          name="message"
          rows={6}
          required
          placeholder="Write your message here..."
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-gray-500 focus:border-[#B000D4]"
        />
      </div>

      <button
        type="submit"
        className="rounded-xl bg-[#B000D4] px-7 py-3.5 text-sm font-bold text-white transition hover:bg-[#8F00A8]"
      >
        SEND MESSAGE
      </button>
    </form>
  </div>
</section>

      {/* FOOTER */}
      <footer className="border-t border-white/10 py-12">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 md:flex-row md:items-center md:justify-between">
          <div>
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt={businessName}
                width={180}
                height={36}
                className="h-9 w-auto max-w-[180px] object-contain"
              />
            ) : (
              <p className="text-lg font-bold">
                <span>BEEBZ</span>{" "}
                <span className="text-[#B000D4]">PRINTS</span>
              </p>
            )}

            <p className="mt-2 text-sm text-gray-500">
              {tagline}
            </p>
          </div>

          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} {businessName}. All rights reserved.
          </p>
        </div>
      </footer>
    </main>
  );
}