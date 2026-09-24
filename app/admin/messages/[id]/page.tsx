import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ReplyToCustomerForm from "./ReplyToCustomerForm";

export const instant = false;

const statusLabels: Record<string, string> = {
  unread: "Unread",
  read: "Read",
  replied: "Replied",
};

const statusStyles: Record<string, string> = {
  unread: "bg-[#F1E6F5] text-[#6A0D8F]",
  read: "bg-[#F4F3F5] text-[#6F6872]",
  replied: "bg-[#F1E6F5] text-[#6A0D8F]",
};

type MessageDetailsPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function MessageDetailsPage({
  params,
}: MessageDetailsPageProps) {
  const { id } = await params;

  const supabase = await createClient();

  // Get the original customer message
  const { data: message, error } = await supabase
    .from("messages")
    .select(`
      id,
      name,
      email,
      phone,
      subject,
      message,
      status,
      product_id,
      created_at,
      updated_at
    `)
    .eq("id", id)
    .single();

  if (error || !message) {
    notFound();
  }

  // Mark unread messages as read
  if (message.status === "unread") {
    await supabase
      .from("messages")
      .update({ status: "read" })
      .eq("id", message.id);

    message.status = "read";
  }

  const status = message.status || "unread";

  // Get product information if this is a product inquiry
  let product = null;

  if (message.product_id) {
    const { data: productData } = await supabase
      .from("products")
      .select(`
        id,
        name,
        slug,
        description,
        starting_price,
        price_unit
      `)
      .eq("id", message.product_id)
      .maybeSingle();

    product = productData;
  }

  // Get previous replies
  const { data: replies, error: repliesError } = await supabase
    .from("message_replies")
    .select(`
      id,
      sender_type,
      sender_id,
      message,
      created_at
    `)
    .eq("message_id", message.id)
    .order("created_at", { ascending: true });

  if (repliesError) {
    console.error("Failed to load message replies:", repliesError);
  }

  return (
    <div className="min-h-screen bg-[#F4F3F5] p-6 md:p-8">
      <div className="mx-auto max-w-4xl">
        {/* Back button */}
        <div className="mb-6">
          <Link
            href="/admin/messages"
            className="inline-flex items-center gap-2 rounded-lg border border-[#DDD7E0] bg-white px-4 py-2 text-sm font-medium text-[#211C24] transition hover:bg-[#F1E6F5] hover:text-[#6A0D8F]"
          >
            ← Back to Messages
          </Link>
        </div>

        {/* Page heading */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#211C24]">
            Message Details
          </h1>

          <p className="mt-2 text-[#6F6872]">
            View the customer inquiry and conversation history.
          </p>
        </div>

        <div className="space-y-6">
          {/* Customer Information */}
          <section className="rounded-2xl border border-[#DDD7E0] bg-white p-6">
            <h2 className="mb-5 text-xl font-semibold text-[#211C24]">
              Customer Information
            </h2>

            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <p className="text-sm text-[#6F6872]">Name</p>
                <p className="mt-1 text-[#211C24]">{message.name}</p>
              </div>

              <div>
                <p className="text-sm text-[#6F6872]">Email</p>
                <p className="mt-1 text-[#211C24]">
                  {message.email || "Not provided"}
                </p>
              </div>

              <div>
                <p className="text-sm text-[#6F6872]">
                  WhatsApp / Phone
                </p>

                <p className="mt-1 text-[#211C24]">
                  {message.phone || "Not provided"}
                </p>
              </div>

              <div>
                <p className="text-sm text-[#6F6872]">Received</p>

                <p className="mt-1 text-[#211C24]">
                  {new Date(message.created_at).toLocaleString()}
                </p>
              </div>
            </div>
          </section>

          {/* Product Information */}
          {product && (
            <section className="rounded-2xl border border-[#D9C1E2] bg-[#F1E6F5] p-6">
              <div className="mb-5 flex items-center justify-between gap-4">
                <h2 className="text-xl font-semibold text-[#211C24]">
                  Product Information
                </h2>

                <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-[#6A0D8F]">
                  Product Inquiry
                </span>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <p className="text-sm text-[#6F6872]">Product</p>

                  <p className="mt-1 text-lg font-medium text-[#6A0D8F]">
                    {product.name}
                  </p>
                </div>

                {product.starting_price !== null &&
                  product.starting_price !== undefined && (
                    <div>
                      <p className="text-sm text-[#6F6872]">
                        Starting Price
                      </p>

                      <p className="mt-1 text-[#211C24]">
                        GH₵{" "}
                        {Number(
                          product.starting_price,
                        ).toLocaleString()}
                        {product.price_unit
                          ? ` / ${product.price_unit}`
                          : ""}
                      </p>
                    </div>
                  )}

                <div>
                  <p className="text-sm text-[#6F6872]">
                    Product Slug
                  </p>

                  <p className="mt-1 text-[#211C24]">
                    {product.slug}
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* Original Question / Message */}
          <section className="rounded-2xl border border-[#DDD7E0] bg-white p-6">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
              <h2 className="text-xl font-semibold text-[#211C24]">
                Original Question / Message
              </h2>

              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  statusStyles[status] ||
                  "bg-[#F4F3F5] text-[#6F6872]"
                }`}
              >
                {statusLabels[status] || status}
              </span>
            </div>

            <div>
              <p className="text-sm text-[#6F6872]">Subject</p>

              <p className="mt-1 text-lg font-medium text-[#211C24]">
                {message.subject || "No subject"}
              </p>
            </div>

            <div className="mt-6">
              <p className="mb-2 text-sm text-[#6F6872]">
                Customer&apos;s Message
              </p>

              <div className="min-h-[220px] whitespace-pre-wrap rounded-xl border border-[#DDD7E0] bg-[#F4F3F5] p-6 leading-8 text-base text-[#211C24]">
                {message.message}
              </div>
            </div>
          </section>

          {/* Previous Replies */}
          {replies && replies.length > 0 && (
            <section className="rounded-2xl border border-[#DDD7E0] bg-white p-6">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-[#211C24]">
                  Previous Replies
                </h2>

                <p className="mt-1 text-sm text-[#6F6872]">
                  Previous responses sent from the BEEBZ PRINTS
                  dashboard.
                </p>
              </div>

              <div className="space-y-4">
                {replies.map((reply) => (
                  <div
                    key={reply.id}
                    className="rounded-xl border border-[#D9C1E2] bg-[#F1E6F5] p-5"
                  >
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                      <span className="text-sm font-semibold text-[#6A0D8F]">
                        {reply.sender_type === "admin"
                          ? "BEEBZ PRINTS"
                          : "Customer"}
                      </span>

                      <span className="text-xs text-[#6F6872]">
                        {new Date(
                          reply.created_at,
                        ).toLocaleString()}
                      </span>
                    </div>

                    <div className="whitespace-pre-wrap leading-7 text-[#211C24]">
                      {reply.message}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Reply Box */}
          <div className="max-w-3xl">
            <ReplyToCustomerForm
              messageId={message.id}
              customerName={message.name}
              customerEmail={message.email || "the customer"}
              originalSubject={message.subject}
            />
          </div>
        </div>
      </div>
    </div>
  );
}