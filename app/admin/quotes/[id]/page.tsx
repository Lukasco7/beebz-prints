import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const instant = false;

type QuotePageProps = {
  params: Promise<{ id: string }>;
};

type PricingTier = {
  id: string;
  minimum_quantity: number;
  unit_price: number;
};

const statusLabels: Record<string, string> = {
  pending: "Pending",
  reviewing: "Reviewing",
  quoted: "Quoted",
  approved: "Approved",
  rejected: "Rejected",
  completed: "Completed",
};

function StatusBadge({ status }: { status: string | null }) {
  const label = statusLabels[status ?? ""] ?? status ?? "Unknown";

  return (
    <span className="inline-flex rounded-full border border-[#E9E6EB] bg-[#F4F3F5] px-3 py-1 text-xs font-medium text-[#6A0D8F]">
      {label}
    </span>
  );
}

function formatPrice(price: number) {
  return new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency: "GHS",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);
}

function getApplicableTier(
  tiers: PricingTier[],
  quantity: number
) {
  const sorted = [...tiers].sort(
    (a, b) => a.minimum_quantity - b.minimum_quantity
  );

  if (sorted.length === 0) return null;

  let applicable = sorted[0];

  for (const tier of sorted) {
    if (quantity >= tier.minimum_quantity) {
      applicable = tier;
    } else {
      break;
    }
  }

  return applicable;
}

export default async function QuoteDetailsPage({
  params,
}: QuotePageProps) {
  const { id } = await params;

  const supabase = await createClient();

  const { data: quote, error } = await supabase
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
      updated_at,
      customers (
        full_name,
        email,
        phone,
        whatsapp,
        company_name
      ),
      services (
        name
      ),
      products (
        name,
        price_unit,
        starting_price
      )
    `)
    .eq("id", id)
    .single();

  if (error || !quote) {
    notFound();
  }

  const customer = Array.isArray(quote.customers)
    ? quote.customers[0]
    : quote.customers;

  const service = Array.isArray(quote.services)
    ? quote.services[0]
    : quote.services;

  const product = Array.isArray(quote.products)
    ? quote.products[0]
    : quote.products;

  let pricingTiers: PricingTier[] = [];

  if (quote.product_id) {
    const { data: tiers, error: pricingError } = await supabase
      .from("product_price_tiers")
      .select("id, minimum_quantity, unit_price")
      .eq("product_id", quote.product_id)
      .order("minimum_quantity", {
        ascending: true,
      });

    if (pricingError) {
      console.error(
        "Quote pricing error:",
        pricingError
      );
    }

    pricingTiers = (tiers ?? []).map((tier) => ({
      id: tier.id,
      minimum_quantity: Number(tier.minimum_quantity),
      unit_price: Number(tier.unit_price),
    }));
  }

  const quantity =
    quote.quantity !== null
      ? Number(quote.quantity)
      : null;

  const applicableTier =
    quantity !== null && quantity > 0
      ? getApplicableTier(pricingTiers, quantity)
      : null;

  const unitPrice =
    applicableTier?.unit_price ??
    (product?.starting_price !== null &&
    product?.starting_price !== undefined
      ? Number(product.starting_price)
      : null);

  const estimatedTotal =
    quantity !== null &&
    quantity > 0 &&
    unitPrice !== null
      ? quantity * unitPrice
      : null;

  return (
    <div className="min-h-screen bg-[#F4F3F5] px-6 py-10 text-[#211C24]">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="mb-2 text-sm font-medium uppercase tracking-[0.2em] text-[#6A0D8F]">
              Quote Request
            </p>

            <h1 className="text-3xl font-bold tracking-tight text-[#211C24]">
              Quote Details
            </h1>

            <p className="mt-2 text-sm text-[#6F6872]">
              Review the customer request and manage its status.
            </p>
          </div>

          <div className="flex gap-3">
            <Link
              href="/admin/quotes"
              className="rounded-xl border border-[#E9E6EB] bg-white px-4 py-2.5 text-sm font-medium text-[#6F6872] transition hover:border-[#6A0D8F]/30 hover:bg-[#F4F3F5] hover:text-[#6A0D8F]"
            >
              ← Back
            </Link>

            <Link
              href={`/admin/quotes/${quote.id}/edit`}
              className="rounded-xl bg-[#6A0D8F] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#48066A]"
            >
              Edit Quote
            </Link>
          </div>
        </div>

        {/* Status */}
        <div className="mb-6 rounded-2xl border border-[#E9E6EB] bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-[#6F6872]">
                Current Status
              </p>

              <div className="mt-2">
                <StatusBadge status={quote.status} />
              </div>
            </div>

            <p className="text-sm text-[#6F6872]">
              Submitted{" "}
              {new Date(
                quote.created_at
              ).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Customer Information */}
          <section className="rounded-2xl border border-[#E9E6EB] bg-white p-6 shadow-sm">
            <h2 className="mb-5 text-lg font-semibold text-[#211C24]">
              Customer Information
            </h2>

            <div className="space-y-4">
              <div>
                <p className="text-xs uppercase tracking-wider text-[#6F6872]">
                  Name
                </p>

                <p className="mt-1 text-[#211C24]">
                  {customer?.full_name ||
                    "Not provided"}
                </p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wider text-[#6F6872]">
                  Company
                </p>

                <p className="mt-1 text-[#211C24]">
                  {customer?.company_name ||
                    "Not provided"}
                </p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wider text-[#6F6872]">
                  Email
                </p>

                <p className="mt-1 text-[#211C24]">
                  {customer?.email ||
                    "Not provided"}
                </p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wider text-[#6F6872]">
                  Phone
                </p>

                <p className="mt-1 text-[#211C24]">
                  {customer?.phone ||
                    "Not provided"}
                </p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wider text-[#6F6872]">
                  WhatsApp
                </p>

                <p className="mt-1 text-[#211C24]">
                  {customer?.whatsapp ||
                    "Not provided"}
                </p>
              </div>
            </div>
          </section>

          {/* Request Details */}
          <section className="rounded-2xl border border-[#E9E6EB] bg-white p-6 shadow-sm">
            <h2 className="mb-5 text-lg font-semibold text-[#211C24]">
              Request Details
            </h2>

            <div className="space-y-4">
              {/* Product */}
              <div>
                <p className="text-xs uppercase tracking-wider text-[#6F6872]">
                  Product
                </p>

                <p className="mt-1 text-[#211C24]">
                  {product?.name ||
                    "Not specified"}
                </p>
              </div>

              {/* Service */}
              <div>
                <p className="text-xs uppercase tracking-wider text-[#6F6872]">
                  Service
                </p>

                <p className="mt-1 text-[#211C24]">
                  {service?.name ||
                    "Not specified"}
                </p>
              </div>

              {/* Quantity */}
              <div>
                <p className="text-xs uppercase tracking-wider text-[#6F6872]">
                  Quantity
                </p>

                <p className="mt-1 text-[#211C24]">
                  {quote.quantity ??
                    "Not specified"}
                </p>
              </div>

              {/* Unit Price */}
              {unitPrice !== null && (
                <div>
                  <p className="text-xs uppercase tracking-wider text-[#6F6872]">
                    Applicable Unit Price
                  </p>

                  <p className="mt-1 text-xl font-semibold text-[#6A0D8F]">
                    {formatPrice(unitPrice)}
                  </p>

                  {applicableTier && (
                    <p className="mt-1 text-xs text-[#6F6872]">
                      {applicableTier.minimum_quantity}+
                      {" "}
                      {product?.price_unit ||
                        "units"}
                    </p>
                  )}
                </div>
              )}

              {/* Estimated Total */}
              {estimatedTotal !== null && (
                <div className="rounded-xl border border-[#E9E6EB] bg-[#F4F3F5] p-4">
                  <p className="text-xs uppercase tracking-wider text-[#6F6872]">
                    Estimated Total
                  </p>

                  <p className="mt-1 text-2xl font-bold text-[#48066A]">
                    {formatPrice(
                      estimatedTotal
                    )}
                  </p>

                  <p className="mt-1 text-xs text-[#6F6872]">
                    {quantity}{" "}
                    {product?.price_unit ||
                      "units"} ×{" "}
                    {formatPrice(unitPrice!)}
                  </p>
                </div>
              )}

              {/* Size */}
              <div>
                <p className="text-xs uppercase tracking-wider text-[#6F6872]">
                  Size
                </p>

                <p className="mt-1 text-[#211C24]">
                  {quote.size ||
                    "Not specified"}
                </p>
              </div>

              {/* Budget */}
              <div>
                <p className="text-xs uppercase tracking-wider text-[#6F6872]">
                  Customer Budget
                </p>

                <p className="mt-1 text-[#211C24]">
                  {quote.budget !== null
                    ? formatPrice(
                        Number(quote.budget)
                      )
                    : "Not specified"}
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* Description */}
        <section className="mt-6 rounded-2xl border border-[#E9E6EB] bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-[#211C24]">
            Customer Description
          </h2>

          <div className="rounded-xl border border-[#E9E6EB] bg-[#F4F3F5] p-4">
            <p className="whitespace-pre-wrap text-sm leading-7 text-[#211C24]">
              {quote.description ||
                "No description provided."}
            </p>
          </div>
        </section>

        {/* Attachment */}
        {quote.attachment_url && (
          <section className="mt-6 rounded-2xl border border-[#E9E6EB] bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-[#211C24]">
              Customer Attachment
            </h2>

            <a
              href={quote.attachment_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex rounded-xl border border-[#E9E6EB] bg-[#F4F3F5] px-4 py-2.5 text-sm font-medium text-[#6A0D8F] transition hover:border-[#6A0D8F]/30 hover:bg-[#E9E6EB]"
            >
              View Attachment ↗
            </a>
          </section>
        )}

        {/* Admin Notes */}
        <section className="mt-6 rounded-2xl border border-[#E9E6EB] bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-[#211C24]">
            Admin Notes
          </h2>

          <div className="rounded-xl border border-[#E9E6EB] bg-[#F4F3F5] p-4">
            <p className="whitespace-pre-wrap text-sm leading-7 text-[#211C24]">
              {quote.admin_notes ||
                "No admin notes yet."}
            </p>
          </div>

          <div className="mt-5">
            <Link
              href={`/admin/quotes/${quote.id}/edit`}
              className="inline-flex rounded-xl bg-[#6A0D8F] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#48066A]"
            >
              Update Status & Notes
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}