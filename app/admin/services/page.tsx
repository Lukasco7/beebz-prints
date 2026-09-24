import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import DeleteServiceButton from "./DeleteServiceButton";

export const instant = false;

type SearchParams = {
  search?: string;
  status?: string;
  featured?: string;
};

type Service = {
  id: string;
  name: string;
  slug: string;
  short_description: string | null;
  starting_price: number | null;
  price_unit: string | null;
  is_featured: boolean;
  is_active: boolean;
  sort_order: number;
  service_categories:
    | {
        name: string;
      }
    | {
        name: string;
      }[]
    | null;
};

function getCategoryName(
  category: Service["service_categories"],
): string {
  if (Array.isArray(category)) {
    return category[0]?.name || "Uncategorized";
  }

  return category?.name || "Uncategorized";
}

export default async function ServicesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;

  const search = (params.search || "").trim().toLowerCase();
  const status = params.status || "all";
  const featured = params.featured || "all";

  const supabase = await createClient();

  const { data: services, error } = await supabase
    .from("services")
    .select(
      `
        id,
        name,
        slug,
        short_description,
        starting_price,
        price_unit,
        is_featured,
        is_active,
        sort_order,
        service_categories(name)
      `,
    )
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  const allServices = (services || []) as Service[];

  const filteredServices = allServices.filter((service) => {
    const matchesSearch =
      !search ||
      service.name.toLowerCase().includes(search) ||
      service.slug.toLowerCase().includes(search) ||
      (service.short_description || "").toLowerCase().includes(search);

    const matchesStatus =
      status === "all" ||
      (status === "active" && service.is_active) ||
      (status === "inactive" && !service.is_active);

    const matchesFeatured =
      featured === "all" ||
      (featured === "featured" && service.is_featured) ||
      (featured === "not-featured" && !service.is_featured);

    return matchesSearch && matchesStatus && matchesFeatured;
  });

  const totalServices = allServices.length;
  const activeServices = allServices.filter(
    (service) => service.is_active,
  ).length;
  const inactiveServices = allServices.filter(
    (service) => !service.is_active,
  ).length;
  const featuredServices = allServices.filter(
    (service) => service.is_featured,
  ).length;

  return (
    <div className="min-h-screen bg-[#F4F3F5] text-[#211C24]">
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm text-[#6F6872]">
              <Link
                href="/admin"
                className="transition-colors hover:text-[#6A0D8F]"
              >
                Dashboard
              </Link>
              <span>/</span>
              <span className="text-[#211C24]">Services</span>
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-[#211C24]">
              Services
            </h1>

            <p className="mt-2 text-sm text-[#6F6872]">
              Manage the services displayed on your website.
            </p>
          </div>

          <Link
            href="/admin/services/new"
            className="inline-flex items-center justify-center rounded-xl bg-[#6A0D8F] px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#48066A]"
          >
            + Add Service
          </Link>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-2xl border border-red-200 bg-white p-5 text-sm text-red-600 shadow-sm">
            Failed to load services: {error.message}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-[#E9E6EB] bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-[#6F6872]">
              Total Services
            </p>
            <p className="mt-2 text-3xl font-bold text-[#211C24]">
              {totalServices}
            </p>
          </div>

          <div className="rounded-2xl border border-[#E9E6EB] bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-[#6F6872]">
              Active Services
            </p>
            <p className="mt-2 text-3xl font-bold text-[#6A0D8F]">
              {activeServices}
            </p>
          </div>

          <div className="rounded-2xl border border-[#E9E6EB] bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-[#6F6872]">
              Inactive Services
            </p>
            <p className="mt-2 text-3xl font-bold text-[#211C24]">
              {inactiveServices}
            </p>
          </div>

          <div className="rounded-2xl border border-[#E9E6EB] bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-[#6F6872]">
              Featured Services
            </p>
            <p className="mt-2 text-3xl font-bold text-[#B000D4]">
              {featuredServices}
            </p>
          </div>
        </div>

        {/* Filters */}
        <form
          method="GET"
          className="rounded-2xl border border-[#E9E6EB] bg-white p-5 shadow-sm"
        >
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
            <div className="lg:col-span-2">
              <label
                htmlFor="search"
                className="mb-2 block text-sm font-medium text-[#211C24]"
              >
                Search
              </label>

              <input
                id="search"
                name="search"
                type="text"
                defaultValue={params.search || ""}
                placeholder="Search services..."
                className="w-full rounded-xl border border-[#E9E6EB] bg-white px-4 py-3 text-sm text-[#211C24] outline-none transition focus:border-[#6A0D8F] focus:ring-2 focus:ring-[#6A0D8F]/15"
              />
            </div>

            <div>
              <label
                htmlFor="status"
                className="mb-2 block text-sm font-medium text-[#211C24]"
              >
                Status
              </label>

              <select
                id="status"
                name="status"
                defaultValue={status}
                className="w-full rounded-xl border border-[#E9E6EB] bg-white px-4 py-3 text-sm text-[#211C24] outline-none transition focus:border-[#6A0D8F] focus:ring-2 focus:ring-[#6A0D8F]/15"
              >
                <option value="all">All Services</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="featured"
                className="mb-2 block text-sm font-medium text-[#211C24]"
              >
                Featured
              </label>

              <select
                id="featured"
                name="featured"
                defaultValue={featured}
                className="w-full rounded-xl border border-[#E9E6EB] bg-white px-4 py-3 text-sm text-[#211C24] outline-none transition focus:border-[#6A0D8F] focus:ring-2 focus:ring-[#6A0D8F]/15"
              >
                <option value="all">All Services</option>
                <option value="featured">Featured</option>
                <option value="not-featured">Not Featured</option>
              </select>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="submit"
              className="rounded-xl bg-[#6A0D8F] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#48066A]"
            >
              Apply Filters
            </button>

            <Link
              href="/admin/services"
              className="rounded-xl border border-[#E9E6EB] bg-white px-5 py-2.5 text-sm font-semibold text-[#211C24] transition-colors hover:border-[#6A0D8F] hover:text-[#6A0D8F]"
            >
              Clear Filters
            </Link>

            <span className="text-sm text-[#6F6872]">
              Showing {filteredServices.length} of {totalServices} services
            </span>
          </div>
        </form>

        {/* Services table */}
        <div className="overflow-hidden rounded-2xl border border-[#E9E6EB] bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead className="border-b border-[#E9E6EB] bg-[#F4F3F5]">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-[#6F6872]">
                    Service
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-[#6F6872]">
                    Category
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-[#6F6872]">
                    Price
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-[#6F6872]">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-[#6F6872]">
                    Featured
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wide text-[#6F6872]">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#E9E6EB]">
                {filteredServices.map((service) => (
                  <tr
                    key={service.id}
                    className="transition-colors hover:bg-[#F4F3F5]"
                  >
                    <td className="px-6 py-5">
                      <div>
                        <p className="font-semibold text-[#211C24]">
                          {service.name}
                        </p>

                        <p className="mt-1 text-xs text-[#6F6872]">
                          /{service.slug}
                        </p>

                        {service.short_description && (
                          <p className="mt-2 max-w-md truncate text-sm text-[#6F6872]">
                            {service.short_description}
                          </p>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-5 text-sm text-[#211C24]">
                      {getCategoryName(service.service_categories)}
                    </td>

                    <td className="px-6 py-5">
                      <div className="text-sm font-semibold text-[#211C24]">
                        {service.starting_price !== null
                          ? `GH₵ ${Number(service.starting_price).toFixed(2)}`
                          : "—"}
                      </div>

                      {service.price_unit && (
                        <div className="mt-1 text-xs text-[#6F6872]">
                          {service.price_unit}
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-5">
                      {service.is_active ? (
                        <span className="inline-flex rounded-full bg-[#E9E6EB] px-3 py-1 text-xs font-semibold text-[#6A0D8F]">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full bg-[#F4F3F5] px-3 py-1 text-xs font-semibold text-[#6F6872]">
                          Inactive
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-5">
                      {service.is_featured ? (
                        <span className="inline-flex rounded-full bg-[#F4F3F5] px-3 py-1 text-xs font-semibold text-[#B000D4]">
                          Featured
                        </span>
                      ) : (
                        <span className="text-sm text-[#6F6872]">—</span>
                      )}
                    </td>

                    <td className="px-6 py-5">
                      <div className="flex items-center justify-end gap-4">
                        <Link
                          href={`/admin/services/${service.id}`}
                          className="text-sm font-semibold text-[#6A0D8F] transition-colors hover:text-[#48066A] hover:underline"
                        >
                          Edit
                        </Link>

                        <DeleteServiceButton
                          serviceId={service.id}
                          serviceName={service.name}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredServices.length === 0 && (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F4F3F5] text-2xl text-[#6A0D8F]">
                ◉
              </div>

              <h2 className="mt-5 text-lg font-semibold text-[#211C24]">
                No services found
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm text-[#6F6872]">
                Try adjusting your search or filters, or create a new service.
              </p>

              <Link
                href="/admin/services/new"
                className="mt-6 inline-flex rounded-xl bg-[#6A0D8F] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#48066A]"
              >
                Add Service
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}