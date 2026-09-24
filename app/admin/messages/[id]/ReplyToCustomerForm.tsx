"use client";

import { FormEvent, useState } from "react";

export default function ReplyToCustomerForm({
  messageId,
  customerName,
  customerEmail,
  originalSubject,
}: {
  messageId: string;
  customerName: string;
  customerEmail: string;
  originalSubject: string | null;
}) {
  const [subject, setSubject] = useState(
    originalSubject
      ? originalSubject.toLowerCase().startsWith("re:")
        ? originalSubject
        : `Re: ${originalSubject}`
      : "Re: Your message to BEEBZ PRINTS",
  );

  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setResult(null);
    setError(false);

    if (!reply.trim()) {
      setError(true);
      setResult("Please enter your reply before sending.");
      return;
    }

    setSending(true);

    try {
      const res = await fetch("/api/admin/messages/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId, subject, reply }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to send reply.");
      }

      setReply("");
      setResult(`Reply sent successfully to ${customerEmail}.`);
    } catch (err) {
      setError(true);
      setResult(
        err instanceof Error
          ? err.message
          : "Failed to send reply.",
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="rounded-2xl border border-[#DDD7E0] bg-white p-6">
      <p className="text-sm font-medium uppercase tracking-[0.18em] text-[#6A0D8F]">
        Customer Reply
      </p>

      <h2 className="mt-2 text-xl font-semibold text-[#211C24]">
        Reply to {customerName}
      </h2>

      <p className="mt-1 text-sm text-[#6F6872]">
        Your reply will be sent directly to {customerEmail}.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <div>
          <label
            htmlFor="reply-subject"
            className="mb-2 block text-sm font-medium text-[#211C24]"
          >
            Subject
          </label>

          <input
            id="reply-subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full rounded-lg border border-[#DDD7E0] bg-[#F4F3F5] px-4 py-3 text-[#211C24] outline-none focus:border-[#6A0D8F] focus:bg-white"
          />
        </div>

        <div>
          <label
            htmlFor="reply-message"
            className="mb-2 block text-sm font-medium text-[#211C24]"
          >
            Your Reply
          </label>

          <textarea
            id="reply-message"
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            rows={7}
            placeholder="Type your reply to the customer..."
            className="w-full resize-y rounded-lg border border-[#DDD7E0] bg-[#F4F3F5] px-4 py-3 text-[#211C24] outline-none placeholder:text-[#6F6872] focus:border-[#6A0D8F] focus:bg-white"
          />
        </div>

        {result && (
          <div
            className={`rounded-lg border p-4 text-sm ${
              error
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-[#D9C1E2] bg-[#F1E6F5] text-[#6A0D8F]"
            }`}
          >
            {result}
          </div>
        )}

        <button
          type="submit"
          disabled={sending}
          className="rounded-lg bg-[#6A0D8F] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#48066A] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {sending ? "Sending Reply..." : "Send Reply"}
        </button>
      </form>
    </section>
  );
}