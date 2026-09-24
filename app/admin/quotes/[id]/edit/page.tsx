"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type QuoteData = {
  id: string;
  status: string | null;
  admin_notes: string | null;
};

const statuses = [
  {
    value: "pending",
    label: "Pending",
    description: "The request has not been reviewed yet.",
  },
  {
    value: "reviewing",
    label: "Reviewing",
    description: "You are currently reviewing the request.",
  },
  {
    value: "quoted",
    label: "Quoted",
    description: "A price has been provided to the customer.",
  },
  {
    value: "approved",
    label: "Approved",
    description: "The customer has approved the quote.",
  },
  {
    value: "rejected",
    label: "Rejected",
    description: "The request has been rejected.",
  },
  {
    value: "completed",
    label: "Completed",
    description: "The customer's order has been completed.",
  },
];

export default function EditQuotePage() {
  const params = useParams();
  const router = useRouter();

  const quoteId = params.id as string;

  const [quote, setQuote] = useState<QuoteData | null>(null);
  const [status, setStatus] = useState("pending");
  const [adminNotes, setAdminNotes] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function loadQuote() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(`/api/get-quote?id=${quoteId}`);

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Failed to load quote.");
        }

        const loadedQuote: QuoteData = result.quote;

        setQuote(loadedQuote);
        setStatus(loadedQuote.status || "pending");
        setAdminNotes(loadedQuote.admin_notes || "");
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load quote.",
        );
      } finally {
        setLoading(false);
      }
    }

    if (quoteId) {
      loadQuote();
    }
  }, [quoteId]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!status) {
      setError("Please select a quote status.");
      return;
    }

    try {
      setSaving(true);

      const response = await fetch("/api/update-quote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: quoteId,
          status,
          admin_notes: adminNotes.trim() || null,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to update quote.");
      }

      setSuccess("Quote updated successfully.");

      setTimeout(() => {
        router.push(`/admin/quotes/${quoteId}`);
        router.refresh();
      }, 700);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update quote.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F4F3F5] p-6 text-[#211C24]">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-2xl border border-[#E9E6EB] bg-white p-8 shadow-sm">
            <p className="text-[#6F6872]">Loading quote...</p>
          </div>
        </div>
      </main>
    );
  }

  if (!quote) {
    return (
      <main className="min-h-screen bg-[#F4F3F5] p-6 text-[#211C24]">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-2xl border border-red-200 bg-white p-8 shadow-sm">
            <h1 className="text-xl font-semibold text-[#211C24]">
              Quote not found
            </h1>

            <p className="mt-2 text-[#6F6872]">
              {error || "The requested quote could not be found."}
            </p>

            <Link
              href="/admin/quotes"
              className="mt-6 inline-block rounded-xl bg-[#6A0D8F] px-5 py-3 font-medium text-white transition hover:bg-[#48066A]"
            >
              Back to Quotes
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F4F3F5] px-4 py-8 text-[#211C24] sm:px-6">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/admin/quotes/${quoteId}`}
            className="text-sm text-[#6F6872] transition hover:text-[#6A0D8F]"
          >
            ← Back to Quote
          </Link>

          <h1 className="mt-4 text-3xl font-bold tracking-tight text-[#211C24]">
            Update Quote
          </h1>

          <p className="mt-2 text-[#6F6872]">
            Update the request status and add internal notes.
          </p>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Status */}
          <section className="rounded-2xl border border-[#E9E6EB] bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-[#211C24]">
                Quote Status
              </h2>

              <p className="mt-1 text-sm text-[#6F6872]">
                Keep track of where this customer&apos;s request currently
                stands.
              </p>
            </div>

            <div className="space-y-3">
              {statuses.map((item) => (
                <label
                  key={item.value}
                  className={`flex cursor-pointer items-start gap-4 rounded-xl border p-4 transition ${
                    status === item.value
                      ? "border-[#6A0D8F]/40 bg-[#F4F3F5]"
                      : "border-[#E9E6EB] bg-white hover:bg-[#F4F3F5]"
                  }`}
                >
                  <input
                    type="radio"
                    name="status"
                    value={item.value}
                    checked={status === item.value}
                    onChange={(event) => setStatus(event.target.value)}
                    className="mt-1 h-4 w-4 accent-[#6A0D8F]"
                  />

                  <div>
                    <p className="font-medium text-[#211C24]">
                      {item.label}
                    </p>

                    <p className="mt-1 text-sm text-[#6F6872]">
                      {item.description}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </section>

          {/* Admin Notes */}
          <section className="rounded-2xl border border-[#E9E6EB] bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-[#211C24]">
                  Admin Notes
                </h2>

                <span className="text-xs text-[#6F6872]">
                  {adminNotes.length} characters
                </span>
              </div>

              <p className="mt-1 text-sm text-[#6F6872]">
                These notes are for your team and are not shown to customers.
              </p>
            </div>

            <textarea
              value={adminNotes}
              onChange={(event) => setAdminNotes(event.target.value)}
              rows={10}
              placeholder="Add internal notes about this quote request..."
              className="min-h-[240px] w-full resize-y rounded-xl border border-[#E9E6EB] bg-[#F4F3F5] px-4 py-4 text-[#211C24] outline-none transition placeholder:text-[#6F6872] focus:border-[#B000D4] focus:ring-2 focus:ring-[#B000D4]/10"
            />
          </section>

          {/* Actions */}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Link
              href={`/admin/quotes/${quoteId}`}
              className="rounded-xl border border-[#E9E6EB] bg-white px-6 py-3 text-center font-medium text-[#6F6872] transition hover:bg-[#E9E6EB] hover:text-[#6A0D8F]"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-[#6A0D8F] px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-[#48066A] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Saving Changes..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}