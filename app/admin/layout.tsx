export const instant = false;

import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "@/components/logout-button";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: "⌂" },
  { href: "/admin/services", label: "Services", icon: "▣" },
  { href: "/admin/products", label: "Products", icon: "▤" },
  {
    href: "/admin/products/categories",
    label: "Product Categories",
    icon: "↳",
    nested: true,
  },
  { href: "/admin/gallery", label: "Gallery", icon: "▧" },
  { href: "/admin/quotes", label: "Quotes", icon: "▤" },
  { href: "/admin/customers", label: "Customers", icon: "◉" },
  { href: "/admin/messages", label: "Messages", icon: "✉" },
  { href: "/admin/testimonials", label: "Testimonials", icon: "★" },
  { href: "/admin/faqs", label: "FAQs", icon: "?" },
  { href: "/admin/settings", label: "Site Settings", icon: "⚙" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const { data: claimsData } = await supabase.auth.getClaims();

  if (!claimsData?.claims) {
    redirect("/auth/login");
  }

  const userId = claimsData.claims.sub;

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role, is_active")
    .eq("id", userId)
    .single();

  if (error || !profile || profile.role !== "admin" || !profile.is_active) {
    redirect("/protected");
  }

  return (
    <div className="min-h-screen bg-[#F4F3F5] text-[#211C24]">
      {/* ADMIN SIDEBAR */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 flex-col border-r border-[#5B1780] bg-[#48066A] text-white md:flex">
        {/* BRAND */}
        <div className="border-b border-white/10 px-6 py-5">
          <Link href="/admin" className="group block">
            <div className="text-2xl font-black tracking-tight">
              BEEBZ{" "}
              <span className="text-[#B000D4] transition group-hover:text-white">
                PRINTS
              </span>
            </div>

            <div className="mt-2 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#B000D4]" />
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/60">
                Admin CMS
              </p>
            </div>
          </Link>
        </div>

        {/* NAVIGATION */}
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5">
          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.22em] text-white/45">
            Management
          </p>

          <nav className="space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "group flex items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 transition-all",
                  item.nested
                    ? "ml-4 py-2 text-sm text-white/60 hover:bg-white/[0.06] hover:text-white"
                    : "text-sm font-medium text-white/80 hover:border-white/15 hover:bg-white/[0.08] hover:text-white",
                ].join(" ")}
              >
                <span
                  className={[
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-sm transition",
                    item.nested
                      ? "bg-white/[0.06] text-white/55 group-hover:bg-white/[0.10] group-hover:text-white"
                      : "bg-white/[0.08] text-white/70 group-hover:bg-white/[0.14] group-hover:text-white",
                  ].join(" ")}
                >
                  {item.icon}
                </span>

                <span className="truncate">{item.label}</span>
              </Link>
            ))}
          </nav>
        </div>

        {/* BOTTOM */}
        <div className="border-t border-white/10 p-4">
          <div className="mb-3 rounded-xl border border-white/10 bg-white/[0.08] px-4 py-3">
            <p className="text-xs font-semibold text-white">
              BEEBZ PRINTS
            </p>

            <p className="mt-1 text-[11px] leading-5 text-white/60">
              Professional Printing. Creative Branding.
            </p>
          </div>

          <Link
            href="/"
            className="mb-2 flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.06] px-4 py-3 text-sm font-medium text-white/80 transition hover:border-white/30 hover:bg-white/[0.10] hover:text-white"
          >
            <span>↗</span>
            View Website
          </Link>

          <LogoutButton />
        </div>
      </aside>

      {/* MOBILE TOP BAR */}
      <div className="sticky top-0 z-30 border-b border-[#E9E6EB] bg-white/95 px-4 py-4 backdrop-blur md:hidden">
        <div className="flex items-center justify-between">
          <Link
            href="/admin"
            className="text-lg font-black tracking-tight text-[#211C24]"
          >
            BEEBZ <span className="text-[#B000D4]">PRINTS</span>
          </Link>

          <Link
            href="/"
            className="rounded-lg border border-[#E9E6EB] bg-[#F4F3F5] px-3 py-2 text-xs font-medium text-[#6F6872] transition hover:border-[#6A0D8F] hover:bg-[#F1E6F4] hover:text-[#48066A]"
          >
            View Website
          </Link>
        </div>

        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="shrink-0 rounded-lg border border-[#E9E6EB] bg-[#F4F3F5] px-3 py-2 text-xs font-medium text-[#6F6872] transition hover:border-[#6A0D8F]/40 hover:bg-[#F1E6F4] hover:text-[#48066A]"
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="mt-3">
          <LogoutButton />
        </div>
      </div>

      {/* MAIN CONTENT */}
      <main className="min-h-screen md:ml-72">
        {children}
      </main>
    </div>
  );
}