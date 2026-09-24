import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import DeleteCustomerButton from "./DeleteCustomerButton";

export const instant = false;

type CustomersPageProps = {
  searchParams: Promise<{ search?: string; page?: string }>;
};

type Customer = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  company_name: string | null;
  created_at: string;
};

type QuoteSummary = {
  id: string;
  customer_id: string | null;
  status: string | null;
  estimated_total: number | string | null;
};

function formatPrice(value: number) {
  return new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency: "GHS",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function buildPageUrl(search: string, page: number) {
  const params = new URLSearchParams();

  if (search) {
    params.set("search", search);
  }

  if (page > 1) {
    params.set("page", String(page));
  }

  const query = params.toString();

  return query
    ? `/admin/customers?${query}`
    : "/admin/customers";
}

export default async function CustomersPage({
  searchParams,
}: CustomersPageProps) {
  const params = await searchParams;

  const search = (params.search ?? "").trim();
  const requestedPage = Math.max(
    Number(params.page ?? "1") || 1,
    1,
  );

  const pageSize = 20;

  const supabase = await createClient();

  const { data: customers, error } = await supabase
    .from("customers")
    .select(
      "id, full_name, email, phone, whatsapp, company_name, created_at",
    )
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="min-h-screen bg-[#F4F3F5] p-6 md:p-8">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 rounded-lg border border-[#E9E6EB] bg-white px-4 py-2 text-sm font-medium text-[#211C24] transition hover:bg-[#F1E6F5] hover:text-[#6A0D8F]"
        >
          ← Back to Dashboard
        </Link>

        <h1 className="mt-6 text-2xl font-bold text-[#211C24]">
          Customers
        </h1>

        <p className="mt-4 text-sm text-red-600">
          Failed to load customers: {error.message}
        </p>
      </div>
    );
  }

  const allCustomers = (customers ?? []) as Customer[];

  const { data: quotes } = await supabase
    .from("quotes")
    .select("id, customer_id, status, estimated_total");

  const allQuotes = (quotes ?? []) as QuoteSummary[];

  const normalizedSearch = search.toLowerCase();

  const filteredCustomers = normalizedSearch
    ? allCustomers.filter((customer) =>
        [
          customer.full_name,
          customer.email,
          customer.phone,
          customer.whatsapp,
          customer.company_name,
        ]
          .filter(Boolean)
          .some((value) =>
            String(value)
              .toLowerCase()
              .includes(normalizedSearch),
          ),
      )
    : allCustomers;

  const totalCustomers = filteredCustomers.length;

  const totalPages = Math.max(
    Math.ceil(totalCustomers / pageSize),
    1,
  );

  const currentPage = Math.min(
    requestedPage,
    totalPages,
  );

  const from = (currentPage - 1) * pageSize;

  const pageCustomers = filteredCustomers.slice(
    from,
    from + pageSize,
  );

  const quoteStats = new Map<
    string,
    {
      count: number;
      total: number;
      pending: number;
    }
  >();

  for (const quote of allQuotes) {
    if (!quote.customer_id) {
      continue;
    }

    const stats =
      quoteStats.get(quote.customer_id) ?? {
        count: 0,
        total: 0,
        pending: 0,
      };

    stats.count += 1;
    stats.total += Number(
      quote.estimated_total ?? 0,
    );

    if (quote.status === "pending") {
      stats.pending += 1;
    }

    quoteStats.set(quote.customer_id, stats);
  }

  const customerIds = new Set(
    filteredCustomers.map((customer) => customer.id),
  );

  const matchingQuotes = allQuotes.filter(
    (quote) =>
      quote.customer_id &&
      customerIds.has(quote.customer_id),
  );

  const customersWithQuotes = filteredCustomers.filter(
    (customer) =>
      (quoteStats.get(customer.id)?.count ?? 0) > 0,
  ).length;

  const totalEstimatedValue = filteredCustomers.reduce(
    (sum, customer) =>
      sum +
      (quoteStats.get(customer.id)?.total ?? 0),
    0,
  );

  const showingFrom =
    totalCustomers === 0 ? 0 : from + 1;

  const showingTo = Math.min(
    from + pageSize,
    totalCustomers,
  );

  return (
    <div className="min-h-screen bg-[#F4F3F5] p-6 md:p-8">
      <div className="mb-6">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 rounded-lg border border-[#E9E6EB] bg-white px-4 py-2 text-sm font-medium text-[#211C24] transition hover:bg-[#F1E6F5] hover:text-[#6A0D8F]"
        >
          ← Back to Dashboard
        </Link>
      </div>

      {/* Page Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-[#6A0D8F]">
            Customer Management
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#211C24]">
            Customers
          </h1>

          <p className="mt-2 text-sm text-[#6F6872]">
            Manage customers, quote activity and estimated
            business value.
          </p>
        </div>

        <Link
          href="/admin/customers/new"
          className="inline-flex items-center justify-center rounded-lg bg-[#6A0D8F] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#48066A]"
        >
          + Add Customer
        </Link>
      </div>

      {/* Stats */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-[#D9C1E2] bg-[#F1E6F5] p-5 shadow-sm">
          <p className="text-sm text-[#6F6872]">
            Customers Found
          </p>

          <p className="mt-2 text-3xl font-bold text-[#211C24]">
            {totalCustomers}
          </p>
        </div>

        <div className="rounded-2xl border border-[#D9C1E2] bg-white p-5 shadow-sm">
          <p className="text-sm text-[#6F6872]">
            With Quotes
          </p>

          <p className="mt-2 text-3xl font-bold text-[#6A0D8F]">
            {customersWithQuotes}
          </p>
        </div>

        <div className="rounded-2xl border border-[#E9E6EB] bg-white p-5 shadow-sm">
          <p className="text-sm text-[#6F6872]">
            Total Quotes
          </p>

          <p className="mt-2 text-3xl font-bold text-[#211C24]">
            {matchingQuotes.length}
          </p>
        </div>

        <div className="rounded-2xl border border-[#D9C1E2] bg-white p-5 shadow-sm">
          <p className="text-sm text-[#6F6872]">
            Estimated Quote Value
          </p>

          <p className="mt-2 text-2xl font-bold text-[#6A0D8F]">
            {formatPrice(totalEstimatedValue)}
          </p>
        </div>
      </div>

      {/* Customer Directory */}
      <div className="overflow-hidden rounded-2xl border border-[#E9E6EB] bg-white shadow-sm">
        <div className="border-b border-[#E9E6EB] px-6 py-5">
          <h2 className="font-semibold text-[#211C24]">
            Customer Directory
          </h2>

          <p className="mt-1 text-xs text-[#6F6872]">
            Search and manage customer records.
          </p>

          {totalCustomers > 0 && (
            <p className="mt-2 text-xs text-[#6F6872]">
              Showing {showingFrom}–{showingTo} of{" "}
              {totalCustomers} customers
            </p>
          )}
        </div>

        {/* Search */}
        <form
          method="GET"
          className="flex flex-col gap-3 border-b border-[#E9E6EB] p-5 sm:flex-row"
        >
          <input
            name="search"
            defaultValue={search}
            placeholder="Search name, company, email or phone..."
            className="min-w-0 flex-1 rounded-lg border border-[#E9E6EB] bg-[#F4F3F5] px-4 py-3 text-sm text-[#211C24] outline-none placeholder:text-[#6F6872] focus:border-[#6A0D8F] focus:bg-white focus:ring-2 focus:ring-[#6A0D8F]/10"
          />

          <button
            type="submit"
            className="rounded-lg bg-[#6A0D8F] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#48066A]"
          >
            Search
          </button>

          {search && (
            <Link
              href="/admin/customers"
              className="rounded-lg border border-[#E9E6EB] bg-white px-5 py-3 text-center text-sm font-semibold text-[#6F6872] transition hover:bg-[#F1E6F5] hover:text-[#6A0D8F]"
            >
              Clear
            </Link>
          )}
        </form>

        {pageCustomers.length > 0 ? (
          <>
            {/* Customer Table */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1050px] text-left">
                <thead className="border-b border-[#E9E6EB] bg-[#F4F3F5]">
                  <tr>
                    <th className="px-6 py-4 text-sm font-semibold text-[#211C24]">
                      Customer
                    </th>

                    <th className="px-6 py-4 text-sm font-semibold text-[#211C24]">
                      Contact
                    </th>

                    <th className="px-6 py-4 text-sm font-semibold text-[#211C24]">
                      Quotes
                    </th>

                    <th className="px-6 py-4 text-sm font-semibold text-[#211C24]">
                      Estimated Value
                    </th>

                    <th className="px-6 py-4 text-sm font-semibold text-[#211C24]">
                      Joined
                    </th>

                    <th className="px-6 py-4 text-sm font-semibold text-[#211C24]">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {pageCustomers.map((customer) => {
                    const stats =
                      quoteStats.get(customer.id) ?? {
                        count: 0,
                        total: 0,
                        pending: 0,
                      };

                    return (
                      <tr
                        key={customer.id}
                        className="border-b border-[#E9E6EB] last:border-0 hover:bg-[#F8F5F9]"
                      >
                        <td className="px-6 py-5">
                          <p className="font-semibold text-[#211C24]">
                            {customer.full_name ||
                              "Unnamed Customer"}
                          </p>

                          <p className="mt-1 text-xs text-[#6F6872]">
                            {customer.company_name ||
                              "Individual customer"}
                          </p>
                        </td>

                        <td className="px-6 py-5">
                          <p className="text-sm text-[#6F6872]">
                            {customer.email ||
                              customer.phone ||
                              "No contact"}
                          </p>

                          {customer.phone &&
                            customer.email && (
                              <p className="mt-1 text-xs text-[#6F6872]">
                                {customer.phone}
                              </p>
                            )}
                        </td>

                        <td className="px-6 py-5">
                          <p className="font-semibold text-[#211C24]">
                            {stats.count}
                          </p>

                          {stats.pending > 0 && (
                            <span className="mt-1 inline-flex rounded-full bg-[#F1E6F5] px-2.5 py-1 text-xs font-medium text-[#6A0D8F]">
                              {stats.pending} pending
                            </span>
                          )}
                        </td>

                        <td className="px-6 py-5 text-sm font-semibold text-[#6A0D8F]">
                          {formatPrice(stats.total)}
                        </td>

                        <td className="px-6 py-5 text-sm text-[#6F6872]">
                          {new Date(
                            customer.created_at,
                          ).toLocaleDateString()}
                        </td>

                        <td className="px-6 py-5">
                          <div className="flex items-center gap-4">
                            <Link
                              href={`/admin/customers/${customer.id}`}
                              className="font-medium text-[#6A0D8F] transition hover:text-[#B000D4]"
                            >
                              View
                            </Link>

                            <DeleteCustomerButton
                              customerId={customer.id}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-col gap-3 border-t border-[#E9E6EB] px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-[#6F6872]">
                  Page {currentPage} of {totalPages}
                </p>

                <div className="flex gap-2">
                  {currentPage > 1 ? (
                    <Link
                      href={buildPageUrl(
                        search,
                        currentPage - 1,
                      )}
                      className="rounded-lg border border-[#E9E6EB] bg-white px-4 py-2 text-sm font-medium text-[#211C24] transition hover:bg-[#F1E6F5] hover:text-[#6A0D8F]"
                    >
                      ← Previous
                    </Link>
                  ) : (
                    <span className="rounded-lg border border-[#E9E6EB] px-4 py-2 text-sm text-[#6F6872] opacity-50">
                      ← Previous
                    </span>
                  )}

                  {currentPage < totalPages ? (
                    <Link
                      href={buildPageUrl(
                        search,
                        currentPage + 1,
                      )}
                      className="rounded-lg bg-[#6A0D8F] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#48066A]"
                    >
                      Next →
                    </Link>
                  ) : (
                    <span className="rounded-lg border border-[#E9E6EB] px-4 py-2 text-sm text-[#6F6872] opacity-50">
                      Next →
                    </span>
                  )}
                </div>
              </div>
            )}
          </>
        ) : (
          /* Empty State */
          <div className="px-6 py-16 text-center">
            <h2 className="text-xl font-semibold text-[#211C24]">
              {search
                ? "No matching customers"
                : "No customers yet"}
            </h2>

            <p className="mt-2 text-sm text-[#6F6872]">
              {search
                ? "Try a different name, company, email or phone number."
                : "Add your first customer to begin managing customer records."}
            </p>

            {!search && (
              <Link
                href="/admin/customers/new"
                className="mt-6 inline-flex rounded-lg bg-[#6A0D8F] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#48066A]"
              >
                Add Customer
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}