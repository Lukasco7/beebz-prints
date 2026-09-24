"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NewFaqPage() {
  const router = useRouter();

  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [category, setCategory] = useState("");
  const [sortOrder, setSortOrder] = useState("0");
  const [isPublished, setIsPublished] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");

    if (!question.trim()) {
      setError("Please enter a question.");
      return;
    }

    if (!answer.trim()) {
      setError("Please enter an answer.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch("/api/create-faq", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: question.trim(),
          answer: answer.trim(),
          category: category.trim(),
          sort_order: Number.parseInt(sortOrder, 10) || 0,
          is_published: isPublished,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to create FAQ.");
      }

      router.push("/admin/faqs");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create FAQ.",
      );
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#F4F3F5]">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/admin/faqs"
            className="inline-flex items-center text-sm font-medium text-[#6F6872] transition hover:text-[#6A0D8F]"
          >
            ← Back to FAQs
          </Link>

          <div className="mt-5">
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-[#6A0D8F]">
              BEEBZ PRINTS CMS
            </p>

            <h1 className="text-3xl font-bold tracking-tight text-[#211C24]">
              Add FAQ
            </h1>

            <p className="mt-2 text-sm text-[#6F6872]">
              Create a frequently asked question for the BEEBZ PRINTS website.
            </p>
          </div>
        </div>

        {/* Form Card */}
        <div className="overflow-hidden rounded-2xl border border-[#E1D9E5] bg-white shadow-[0_12px_40px_rgba(72,6,106,0.08)]">
          {/* Card Header */}
          <div className="border-b border-[#E9E6EB] px-6 py-6 sm:px-8">
            <div className="flex items-center gap-3">
              <div className="h-2.5 w-2.5 rounded-full bg-[#6A0D8F]" />

              <h2 className="text-lg font-semibold text-[#211C24]">
                FAQ Information
              </h2>
            </div>

            <p className="mt-2 text-sm text-[#6F6872]">
              Enter the details below to create your FAQ.
            </p>
          </div>

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="px-6 py-7 sm:px-8 sm:py-8"
          >
            {/* Error */}
            {error && (
              <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="space-y-7">
              {/* Question */}
              <div>
                <label
                  htmlFor="question"
                  className="mb-2 block text-sm font-semibold text-[#211C24]"
                >
                  Question
                </label>

                <input
                  id="question"
                  name="question"
                  type="text"
                  value={question}
                  onChange={(event) => setQuestion(event.target.value)}
                  placeholder="Do you offer same-day printing?"
                  required
                  className="w-full rounded-xl border border-[#D9D0DE] bg-[#F9F7FA] px-4 py-3.5 text-[#211C24] placeholder:text-[#8B838F] outline-none transition duration-200 focus:border-[#6A0D8F] focus:bg-white focus:ring-4 focus:ring-[#6A0D8F]/10"
                />

                <p className="mt-2 text-xs text-[#6F6872]">
                  Write the question exactly as customers are likely to ask it.
                </p>
              </div>

              {/* Answer */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label
                    htmlFor="answer"
                    className="block text-sm font-semibold text-[#211C24]"
                  >
                    Answer
                  </label>

                  <span className="text-xs text-[#6F6872]">
                    {answer.length} characters
                  </span>
                </div>

                <textarea
                  id="answer"
                  name="answer"
                  value={answer}
                  onChange={(event) => setAnswer(event.target.value)}
                  placeholder="Give a clear and helpful answer that directly addresses the customer's question. For example: Yes, we offer same-day printing for selected products depending on the quantity, design readiness, and time the order is placed."
                  rows={12}
                  required
                  className="min-h-[280px] w-full resize-y rounded-xl border border-[#D9D0DE] bg-[#F9F7FA] px-4 py-4 text-[15px] leading-7 text-[#211C24] placeholder:text-[#8B838F] outline-none transition duration-200 focus:border-[#6A0D8F] focus:bg-white focus:ring-4 focus:ring-[#6A0D8F]/10"
                />

                <div className="mt-2 flex items-start justify-between gap-4">
                  <p className="text-xs leading-5 text-[#6F6872]">
                    Keep the answer simple, direct, and useful. Customers should
                    understand it without needing additional explanation.
                  </p>

                  <span className="shrink-0 text-xs text-[#8B838F]">
                    Long answers are supported
                  </span>
                </div>
              </div>

              {/* Category */}
              <div>
                <label
                  htmlFor="category"
                  className="mb-2 block text-sm font-semibold text-[#211C24]"
                >
                  Category
                </label>

                <input
                  id="category"
                  name="category"
                  type="text"
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  placeholder="Printing"
                  className="w-full rounded-xl border border-[#D9D0DE] bg-[#F9F7FA] px-4 py-3.5 text-[#211C24] placeholder:text-[#8B838F] outline-none transition duration-200 focus:border-[#6A0D8F] focus:bg-white focus:ring-4 focus:ring-[#6A0D8F]/10"
                />

                <p className="mt-2 text-xs text-[#6F6872]">
                  Examples: Printing, Payments, Delivery, Design, Orders.
                </p>
              </div>

              {/* Display Order */}
              <div>
                <label
                  htmlFor="sort_order"
                  className="mb-2 block text-sm font-semibold text-[#211C24]"
                >
                  Display Order
                </label>

                <input
                  id="sort_order"
                  name="sort_order"
                  type="number"
                  min="0"
                  value={sortOrder}
                  onChange={(event) => setSortOrder(event.target.value)}
                  className="w-full rounded-xl border border-[#D9D0DE] bg-[#F9F7FA] px-4 py-3.5 text-[#211C24] outline-none transition duration-200 focus:border-[#6A0D8F] focus:bg-white focus:ring-4 focus:ring-[#6A0D8F]/10"
                />

                <p className="mt-2 text-xs text-[#6F6872]">
                  Lower numbers appear first.
                </p>
              </div>

              {/* Publish */}
              <div className="rounded-xl border border-[#E1D9E5] bg-[#F9F7FA] p-4">
                <div className="flex items-start gap-3">
                  <input
                    id="is_published"
                    name="is_published"
                    type="checkbox"
                    checked={isPublished}
                    onChange={(event) =>
                      setIsPublished(event.target.checked)
                    }
                    className="mt-1 h-4 w-4 cursor-pointer accent-[#6A0D8F]"
                  />

                  <div>
                    <label
                      htmlFor="is_published"
                      className="cursor-pointer text-sm font-semibold text-[#211C24]"
                    >
                      Publish this FAQ
                    </label>

                    <p className="mt-1 text-xs text-[#6F6872]">
                      Published FAQs can appear on the public BEEBZ PRINTS
                      website.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="mt-8 flex flex-col gap-3 border-t border-[#E9E6EB] pt-6 sm:flex-row">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center rounded-xl bg-[#6A0D8F] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(106,13,143,0.16)] transition duration-200 hover:bg-[#48066A] hover:shadow-[0_10px_24px_rgba(72,6,106,0.18)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Creating..." : "Create FAQ"}
              </button>

              <Link
                href="/admin/faqs"
                className="inline-flex items-center justify-center rounded-xl border border-[#D9D0DE] bg-white px-6 py-3.5 text-sm font-semibold text-[#211C24] transition duration-200 hover:border-[#BFA9C8] hover:bg-[#F9F7FA] hover:text-[#6A0D8F]"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}