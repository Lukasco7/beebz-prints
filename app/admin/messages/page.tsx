import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import DeleteMessageButton from "./DeleteMessageButton";

export const instant = false;

const statusLabels: Record<string, string> = {
  unread: "Unread",
  read: "Read",
  replied: "Replied",
};

const statusStyles: Record<string, string> = {
  unread: "bg-[#F1E6F5] text-[#6A0D8F]",
  read: "bg-[#F4F3F5] text-[#6F6872]",
};

type SearchParams = {
  search?: string;
  status?: string;
  type?: string;
};

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  const search = (params.search ?? "").trim();
  const statusFilter = params.status ?? "all";
  const typeFilter = params.type ?? "all";

  const { data: allMessages, error } = await supabase
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
      created_at
    `)
    .order("created_at", { ascending: false });

  const messages = (allMessages ?? []).filter((message) => {
    const matchesSearch =
      !search ||
      message.name?.toLowerCase().includes(search.toLowerCase()) ||
      message.email?.toLowerCase().includes(search.toLowerCase()) ||
      message.subject?.toLowerCase().includes(search.toLowerCase()) ||
      message.message?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      (message.status || "unread") === statusFilter;

    const matchesType =
      typeFilter === "all" ||
      (typeFilter === "product" && Boolean(message.product_id)) ||
      (typeFilter === "general" && !message.product_id);

    return matchesSearch && matchesStatus && matchesType;
  });

  // Load products separately so the messages page does not depend
  // on Supabase relationship naming.
  const productIds = Array.from(
    new Set(
      messages
        .map((message) => message.product_id)
        .filter(Boolean),
    ),
  );

  const { data: products } =
    productIds.length > 0
      ? await supabase
          .from("products")
          .select("id, name, slug")
          .in("id", productIds)
      : { data: [] };

  const productMap = new Map(
    (products ?? []).map((product) => [product.id, product]),
  );

  const totalMessages = allMessages?.length ?? 0;

  const unreadMessages =
    allMessages?.filter(
      (message) => (message.status || "unread") === "unread",
    ).length ?? 0;

  const repliedMessages =
    allMessages?.filter((message) => message.status === "replied")
      .length ?? 0;

  const productInquiries =
    allMessages?.filter((message) => Boolean(message.product_id))
      .length ?? 0;

  return (
    <div className="min-h-screen bg-[#F4F3F5] p-6 md:p-8">
      {/* Page Header */}
      <div className="mb-8">
        <Link
          href="/admin"
          className="mb-6 inline-flex items-center gap-2 rounded-lg border border-[#DDD7E0] bg-white px-4 py-2 text-sm font-medium text-[#211C24] transition hover:bg-[#F1E6F5] hover:text-[#6A0D8F]"
        >
          ← Back to Dashboard
        </Link>

        <h1 className="text-3xl font-bold text-[#211C24]">
          Messages
        </h1>

        <p className="mt-2 text-[#6F6872]">
          Manage messages and product inquiries submitted through the website.
        </p>
      </div>

      {/* Stats */}
      {!error && (
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-[#DDD7E0] bg-white p-5">
            <p className="text-sm text-[#6F6872]">
              Total Messages
            </p>

            <p className="mt-2 text-2xl font-bold text-[#211C24]">
              {totalMessages}
            </p>
          </div>

          <div className="rounded-xl border border-[#D9C1E2] bg-[#F1E6F5] p-5">
            <p className="text-sm text-[#6F6872]">
              Unread
            </p>

            <p className="mt-2 text-2xl font-bold text-[#6A0D8F]">
              {unreadMessages}
            </p>
          </div>

          <div className="rounded-xl border border-[#D9C1E2] bg-[#F4F3F5] p-5">
            <p className="text-sm text-[#6F6872]">
              Replied
            </p>

            <p className="mt-2 text-2xl font-bold text-[#6A0D8F]">
              {repliedMessages}
            </p>
          </div>

          <div className="rounded-xl border border-[#DCC9E2] bg-[#F1EAF4] p-5">
            <p className="text-sm text-[#6F6872]">
              Product Inquiries
            </p>

            <p className="mt-2 text-2xl font-bold text-[#6A0D8F]">
              {productInquiries}
            </p>
          </div>
        </div>
      )}

      {/* Search + Filters */}
      {!error && (
        <form
          method="GET"
          className="mb-6 rounded-xl border border-[#DDD7E0] bg-white p-4"
        >
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_180px_180px_auto]">
            <input
              name="search"
              defaultValue={search}
              placeholder="Search name, email, subject or message..."
              className="w-full rounded-lg border border-[#DDD7E0] bg-white px-4 py-3 text-sm text-[#211C24] outline-none placeholder:text-[#6F6872] focus:border-[#6A0D8F]"
            />

            <select
              name="status"
              defaultValue={statusFilter}
              className="rounded-lg border border-[#DDD7E0] bg-white px-4 py-3 text-sm text-[#211C24] outline-none focus:border-[#6A0D8F]"
            >
              <option value="all">All Statuses</option>
              <option value="unread">Unread</option>
              <option value="read">Read</option>
              <option value="replied">Replied</option>
            </select>

            <select
              name="type"
              defaultValue={typeFilter}
              className="rounded-lg border border-[#DDD7E0] bg-white px-4 py-3 text-sm text-[#211C24] outline-none focus:border-[#6A0D8F]"
            >
              <option value="all">All Messages</option>
              <option value="product">Product Inquiries</option>
              <option value="general">General Messages</option>
            </select>

            <button
              type="submit"
              className="rounded-lg bg-[#6A0D8F] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#48066A]"
            >
              Search
            </button>
          </div>

          {(search || statusFilter !== "all" || typeFilter !== "all") && (
            <div className="mt-3">
              <Link
                href="/admin/messages"
                className="text-sm text-[#6F6872] transition hover:text-[#6A0D8F]"
              >
                Clear filters
              </Link>
            </div>
          )}
        </form>
      )}

      {/* Error */}
      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6">
          <h2 className="text-lg font-semibold text-red-700">
            Failed to load messages
          </h2>

          <p className="mt-2 text-sm text-red-600">
            {error.message}
          </p>
        </div>
      ) : messages.length > 0 ? (
        <div className="overflow-hidden rounded-xl border border-[#DDD7E0] bg-white">
          <div className="flex items-center justify-between border-b border-[#DDD7E0] px-6 py-4">
            <div>
              <h2 className="font-semibold text-[#211C24]">
                Message Inbox
              </h2>

              <p className="mt-1 text-sm text-[#85808A]">
                Showing {messages.length} matching message
                {messages.length === 1 ? "" : "s"}
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-left">
              <thead className="border-b border-[#DDD7E0] bg-[#F4F3F5]">
                <tr>
                  <th className="px-6 py-4 text-sm font-semibold text-[#211C24]">
                    Name
                  </th>

                  <th className="px-6 py-4 text-sm font-semibold text-[#211C24]">
                    Product
                  </th>

                  <th className="px-6 py-4 text-sm font-semibold text-[#211C24]">
                    Subject
                  </th>

                  <th className="px-6 py-4 text-sm font-semibold text-[#211C24]">
                    Email
                  </th>

                  <th className="px-6 py-4 text-sm font-semibold text-[#211C24]">
                    Status
                  </th>

                  <th className="px-6 py-4 text-sm font-semibold text-[#211C24]">
                    Received
                  </th>

                  <th className="px-6 py-4 text-sm font-semibold text-[#211C24]">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {messages.map((message) => {
                  const status = message.status || "unread";

                  const product = message.product_id
                    ? productMap.get(message.product_id)
                    : null;

                  return (
                    <tr
                      key={message.id}
                      className={`border-b border-[#EEEAF0] last:border-0 hover:bg-[#F8F5F9] ${
                        status === "unread"
                          ? "bg-[#F8F1FA]"
                          : ""
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="font-medium text-[#211C24]">
                          {message.name}
                        </div>

                        {message.phone && (
                          <div className="mt-1 text-xs text-[#85808A]">
                            {message.phone}
                          </div>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        {product ? (
                          <div>
                            <div className="font-medium text-[#6A0D8F]">
                              {product.name}
                            </div>

                            <div className="mt-1 text-xs text-[#85808A]">
                              Product inquiry
                            </div>
                          </div>
                        ) : (
                          <span className="text-[#6F6872]">
                            General message
                          </span>
                        )}
                      </td>

                      <td className="max-w-xs px-6 py-4">
                        <div className="truncate text-[#211C24]">
                          {message.subject || "No subject"}
                        </div>
                      </td>

                      <td className="px-6 py-4 text-[#211C24]">
                        {message.email || (
                          <span className="text-[#6F6872]">
                            No email
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${
                            statusStyles[status] ||
                            "bg-[#F4F3F5] text-[#6F6872]"
                          }`}
                        >
                          {statusLabels[status] || status}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-6 py-4 text-sm text-[#6F6872]">
                        {new Date(
                          message.created_at,
                        ).toLocaleDateString()}
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <Link
                            href={`/admin/messages/${message.id}`}
                            className="font-medium text-[#6A0D8F] transition hover:text-[#B000D4]"
                          >
                            View
                          </Link>

                          <DeleteMessageButton
                            messageId={message.id}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-[#DDD7E0] bg-white p-12 text-center">
          <h2 className="text-xl font-semibold text-[#211C24]">
            {search ||
            statusFilter !== "all" ||
            typeFilter !== "all"
              ? "No matching messages"
              : "No messages yet"}
          </h2>

          <p className="mt-2 text-[#6F6872]">
            {search ||
            statusFilter !== "all" ||
            typeFilter !== "all"
              ? "Try changing your search or filters."
              : "Messages submitted through the website will appear here."}
          </p>
        </div>
      )}
    </div>
  );
}