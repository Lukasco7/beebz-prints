import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const instant = false;

export default async function AdminDashboard() {
  const supabase = await createClient();

  const [
    servicesResult,
    galleryResult,
    quotesResult,
    pendingQuotesResult,
    unreadMessagesResult,
    customersResult,
    productsResult,
    testimonialsResult,
    recentQuotesResult,
    recentMessagesResult,
  ] = await Promise.all([
    // Active services
    supabase
      .from("services")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true),

    // Published gallery
    supabase
      .from("gallery")
      .select("id", { count: "exact", head: true })
      .eq("is_published", true),

    // Total quotes
    supabase
      .from("quotes")
      .select("id", { count: "exact", head: true }),

    // Pending quotes
    supabase
      .from("quotes")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),

    // Unread messages
    supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("status", "unread"),

    // Customers
    supabase
      .from("customers")
      .select("id", { count: "exact", head: true }),

    // Products
    supabase
      .from("products")
      .select("id", { count: "exact", head: true }),

    // Published testimonials
    supabase
      .from("testimonials")
      .select("id", { count: "exact", head: true })
      .eq("is_published", true),

    // Recent quotes
    supabase
      .from("quotes")
      .select(`
        id,
        quantity,
        status,
        estimated_total,
        created_at,
        customers (
          full_name
        ),
        products (
          name
        )
      `)
      .order("created_at", { ascending: false })
      .limit(5),

    // Recent messages
    supabase
      .from("messages")
      .select(`
        id,
        name,
        email,
        subject,
        status,
        created_at
      `)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const stats = [
    {
      title: "Total Quotes",
      value: quotesResult.count ?? 0,
      description: "Customer requests",
      href: "/admin/quotes",
      cardClass: "bg-white border-[#E9E6EB]",
    },
    {
      title: "Pending Quotes",
      value: pendingQuotesResult.count ?? 0,
      description: "Need attention",
      href: "/admin/quotes",
      highlight: true,
      cardClass: "bg-[#F4F3F5] border-[#E9E6EB]",
    },
    {
      title: "Customers",
      value: customersResult.count ?? 0,
      description: "Customer records",
      href: "/admin/customers",
      cardClass: "bg-white border-[#E9E6EB]",
    },
    {
      title: "Products",
      value: productsResult.count ?? 0,
      description: "Product catalog",
      href: "/admin/products",
      cardClass: "bg-[#F4F3F5] border-[#E9E6EB]",
    },
    {
      title: "Unread Messages",
      value: unreadMessagesResult.count ?? 0,
      description: "Need a reply",
      href: "/admin/messages",
      highlight: true,
      cardClass: "bg-[#F4F3F5] border-[#E9E6EB]",
    },
    {
      title: "Services",
      value: servicesResult.count ?? 0,
      description: "Active services",
      href: "/admin/services",
      cardClass: "bg-white border-[#E9E6EB]",
    },
    {
      title: "Gallery",
      value: galleryResult.count ?? 0,
      description: "Published projects",
      href: "/admin/gallery",
      cardClass: "bg-[#F4F3F5] border-[#E9E6EB]",
    },
    {
      title: "Testimonials",
      value: testimonialsResult.count ?? 0,
      description: "Published testimonials",
      href: "/admin/testimonials",
      cardClass: "bg-[#F4F3F5] border-[#E9E6EB]",
    },
  ];

  const recentQuotes = recentQuotesResult.data ?? [];
  const recentMessages = recentMessagesResult.data ?? [];

  return (
    <div className="min-h-screen bg-[#F4F3F5] p-6 md:p-10">
      {/* HEADER */}
      <div className="mb-10 rounded-3xl border border-[#E9E6EB] bg-white p-6 shadow-sm md:p-8">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-[#6A0D8F]">
          BEEBZ PRINTS CMS
        </p>

        <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#211C24] md:text-4xl">
          Dashboard
        </h1>

        <p className="mt-2 text-[#6F6872]">
          Manage your printing business website from one place.
        </p>
      </div>

      {/* STATISTICS */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link
            key={stat.title}
            href={stat.href}
            className={`group rounded-2xl border p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-[#B000D4]/50 hover:shadow-lg ${stat.cardClass}`}
          >
            <div className="flex items-start justify-between gap-4">
              <p className="text-sm text-[#6F6872]">{stat.title}</p>

              {stat.highlight && stat.value > 0 && (
                <span className="rounded-full bg-[#6A0D8F]/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#6A0D8F]">
                  Action
                </span>
              )}
            </div>

            <p className="mt-3 text-3xl font-bold text-[#211C24]">
              {stat.value}
            </p>

            <p className="mt-1 text-xs text-[#6F6872]">
              {stat.description}
            </p>

            <p className="mt-4 text-xs font-medium text-[#6A0D8F] opacity-0 transition group-hover:opacity-100">
              Manage →
            </p>
          </Link>
        ))}
      </div>

      {/* RECENT ACTIVITY */}
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* RECENT QUOTES */}
        <section className="overflow-hidden rounded-2xl border border-[#E9E6EB] bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-[#E9E6EB] px-6 py-5">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#6A0D8F]">
                Quotes
              </p>

              <h2 className="mt-1 text-lg font-semibold text-[#211C24]">
                Recent Quote Requests
              </h2>
            </div>

            <Link
              href="/admin/quotes"
              className="text-xs font-medium text-[#6A0D8F] transition hover:text-[#B000D4] hover:underline"
            >
              View all →
            </Link>
          </div>

          {recentQuotes.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-sm text-[#6F6872]">
                No quote requests yet.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#E9E6EB]">
              {recentQuotes.map((quote) => {
                const customer = Array.isArray(quote.customers)
                  ? quote.customers[0]
                  : quote.customers;

                const product = Array.isArray(quote.products)
                  ? quote.products[0]
                  : quote.products;

                return (
                  <Link
                    key={quote.id}
                    href={`/admin/quotes/${quote.id}`}
                    className="block px-6 py-4 transition hover:bg-[#F4F3F5]"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-[#211C24]">
                          {customer?.full_name || "Unknown customer"}
                        </p>

                        <p className="mt-1 truncate text-xs text-[#6F6872]">
                          {product?.name || "Custom request"}
                        </p>

                        <p className="mt-1 text-xs text-[#6F6872]">
                          Quantity: {quote.quantity ?? "—"}
                        </p>
                      </div>

                      <div className="text-right">
                        <span
                          className={`rounded-full px-2.5 py-1 text-[10px] font-medium ${
                            quote.status === "pending"
                              ? "bg-[#F4F3F5] text-[#6A0D8F]"
                              : quote.status === "completed"
                                ? "bg-green-50 text-green-700"
                                : "bg-[#E9E6EB] text-[#6F6872]"
                          }`}
                        >
                          {quote.status || "pending"}
                        </span>

                        {quote.estimated_total !== null && (
                          <p className="mt-2 text-xs font-medium text-[#211C24]">
                            GH₵{" "}
                            {Number(
                              quote.estimated_total,
                            ).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* RECENT MESSAGES */}
        <section className="overflow-hidden rounded-2xl border border-[#E9E6EB] bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-[#E9E6EB] px-6 py-5">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#6A0D8F]">
                Messages
              </p>

              <h2 className="mt-1 text-lg font-semibold text-[#211C24]">
                Recent Messages
              </h2>
            </div>

            <Link
              href="/admin/messages"
              className="text-xs font-medium text-[#6A0D8F] transition hover:text-[#B000D4] hover:underline"
            >
              View all →
            </Link>
          </div>

          {recentMessages.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-sm text-[#6F6872]">
                No messages yet.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#E9E6EB]">
              {recentMessages.map((message) => (
                <Link
                  key={message.id}
                  href="/admin/messages"
                  className="block px-6 py-4 transition hover:bg-[#F4F3F5]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-[#211C24]">
                        {message.name || "Customer"}
                      </p>

                      <p className="mt-1 truncate text-xs text-[#6F6872]">
                        {message.subject || "New message"}
                      </p>

                      <p className="mt-1 truncate text-xs text-[#6F6872]">
                        {message.email}
                      </p>
                    </div>

                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-medium ${
                        message.status === "unread"
                          ? "bg-[#F4F3F5] text-[#6A0D8F]"
                          : message.status === "replied"
                            ? "bg-green-50 text-green-700"
                            : "bg-[#E9E6EB] text-[#6F6872]"
                      }`}
                    >
                      {message.status || "unread"}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* QUICK ACTIONS */}
      <section className="mt-8 rounded-2xl border border-[#E9E6EB] bg-white p-6 shadow-sm">
        <div className="mb-5">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#6A0D8F]">
            Quick Actions
          </p>

          <h2 className="mt-1 text-lg font-semibold text-[#211C24]">
            Manage BEEBZ PRINTS
          </h2>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            href="/admin/products/new"
            className="rounded-xl border border-[#E9E6EB] bg-[#F4F3F5] px-5 py-4 text-sm font-semibold text-[#211C24] transition hover:border-[#B000D4]/40 hover:bg-[#F4F3F5] hover:text-[#48066A]"
          >
            + Add Product
          </Link>

          <Link
            href="/admin/services/new"
            className="rounded-xl border border-[#E9E6EB] bg-[#F4F3F5] px-5 py-4 text-sm font-semibold text-[#211C24] transition hover:border-[#B000D4]/40 hover:bg-[#F4F3F5] hover:text-[#48066A]"
          >
            + Add Service
          </Link>

          <Link
            href="/admin/gallery/new"
            className="rounded-xl border border-[#E9E6EB] bg-[#F4F3F5] px-5 py-4 text-sm font-semibold text-[#211C24] transition hover:border-[#B000D4]/40 hover:bg-[#F4F3F5] hover:text-[#48066A]"
          >
            + Add Gallery Item
          </Link>

          <Link
            href="/admin/settings"
            className="rounded-xl border border-[#E9E6EB] bg-[#F4F3F5] px-5 py-4 text-sm font-semibold text-[#211C24] transition hover:border-[#B000D4]/40 hover:bg-[#F4F3F5] hover:text-[#48066A]"
          >
            ⚙ Site Settings
          </Link>
        </div>
      </section>

      {/* WELCOME */}
      <div className="mt-8 rounded-2xl border border-[#E9E6EB] bg-white p-6 shadow-sm">
        <p className="text-sm font-medium text-[#6A0D8F]">
          BEEBZ PRINTS
        </p>

        <h2 className="mt-2 text-xl font-semibold text-[#211C24]">
          Welcome to your CMS
        </h2>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6F6872]">
          This dashboard allows you to manage BEEBZ PRINTS services,
          products, gallery projects, customer quotes, testimonials,
          FAQs, customers, messages, media, and website settings without
          changing your website code.
        </p>
      </div>
    </div>
  );
}