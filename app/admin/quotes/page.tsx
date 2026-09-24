import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import DeleteQuoteButton from "./DeleteQuoteButton";

export const instant = false;

type Quote = {
  id: string;
  customer_id: string | null;
  service_id: string | null;
  product_id: string | null;
  quantity: number | null;
  size: string | null;
  description: string | null;
  budget: number | null;
  attachment_url: string | null;
  status: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
};

export default async function QuotesPage() {
  const supabase = await createClient();

  const { data: quotes, error } = await supabase
    .from("quotes")
    .select(`
      id,
      customer_id,
      service_id,
      product_id,
      quantity,
      size,
      description,
      budget,
      attachment_url,
      status,
      admin_notes,
      created_at,
      updated_at
    `)
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="min-h-screen bg-[#F4F3F5] p-8 text-[#211C24]">
        <div className="mb-6">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 rounded-lg border border-[#E9E6EB] bg-white px-4 py-2 text-sm font-medium text-[#6F6872] transition hover:border-[#6A0D8F]/30 hover:bg-[#F4F3F5] hover:text-[#6A0D8F]"
          >
            ← Back to Dashboard
          </Link>
        </div>

        <h1 className="text-3xl font-bold text-[#211C24]">
          Quotes
        </h1>

        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">
          Failed to load quotes: {error.message}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F3F5] p-8 text-[#211C24]">
      <div className="mb-6">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 rounded-lg border border-[#E9E6EB] bg-white px-4 py-2 text-sm font-medium text-[#6F6872] transition hover:border-[#6A0D8F]/30 hover:bg-[#F4F3F5] hover:text-[#6A0D8F]"
        >
          ← Back to Dashboard
        </Link>
      </div>

      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#211C24]">
            Quotes
          </h1>

          <p className="mt-2 text-[#6F6872]">
            Manage customer quote requests.
          </p>
        </div>

        <div className="rounded-xl border border-[#E9E6EB] bg-white px-5 py-3 shadow-sm">
          <div className="text-xs uppercase tracking-wide text-[#6F6872]">
            Total Quotes
          </div>

          <div className="mt-1 text-2xl font-bold text-[#6A0D8F]">
            {quotes?.length ?? 0}
          </div>
        </div>
      </div>

      {/* No quotes */}
      {!quotes || quotes.length === 0 ? (
        <div className="rounded-2xl border border-[#E9E6EB] bg-white p-12 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#F4F3F5] text-2xl">
            📋
          </div>

          <h2 className="text-xl font-semibold text-[#211C24]">
            No quotes yet
          </h2>

          <p className="mt-2 text-[#6F6872]">
            Customer quote requests will appear here.
          </p>
        </div>
      ) : (
        /* Quotes */
        <div className="overflow-hidden rounded-2xl border border-[#E9E6EB] bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[950px]">
              <thead className="border-b border-[#E9E6EB] bg-[#F4F3F5]">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-[#6F6872]">
                    Quote ID
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-[#6F6872]">
                    Quantity
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-[#6F6872]">
                    Size
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-[#6F6872]">
                    Budget
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-[#6F6872]">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-[#6F6872]">
                    Date
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-[#6F6872]">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#E9E6EB]">
                {quotes.map((quote: Quote) => (
                  <tr
                    key={quote.id}
                    className="transition hover:bg-[#F4F3F5]"
                  >
                    <td className="px-6 py-5">
                      <div className="max-w-[180px] truncate font-mono text-sm text-[#211C24]">
                        {quote.id}
                      </div>
                    </td>

                    <td className="px-6 py-5 text-[#211C24]">
                      {quote.quantity ?? "—"}
                    </td>

                    <td className="px-6 py-5 text-[#211C24]">
                      {quote.size || "—"}
                    </td>

                    <td className="px-6 py-5 text-[#211C24]">
                      {quote.budget !== null
                        ? `GH₵ ${Number(
                            quote.budget
                          ).toLocaleString()}`
                        : "—"}
                    </td>

                    <td className="px-6 py-5">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                          quote.status === "completed"
                            ? "bg-green-50 text-green-700"
                            : quote.status === "contacted"
                              ? "bg-blue-50 text-blue-700"
                              : quote.status === "cancelled"
                                ? "bg-red-50 text-red-700"
                                : "bg-[#F4F3F5] text-[#6A0D8F]"
                        }`}
                      >
                        {quote.status || "pending"}
                      </span>
                    </td>

                    <td className="px-6 py-5 text-sm text-[#6F6872]">
                      {new Date(
                        quote.created_at
                      ).toLocaleDateString()}
                    </td>

                    <td className="whitespace-nowrap px-6 py-5 text-right">
                      <Link
                        href={`/admin/quotes/${quote.id}`}
                        className="inline-flex rounded-lg border border-[#E9E6EB] bg-white px-4 py-2 text-sm font-medium text-[#6A0D8F] transition hover:border-[#6A0D8F]/30 hover:bg-[#F4F3F5]"
                      >
                        View
                      </Link>

                      <DeleteQuoteButton quoteId={quote.id} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}