"use client";

import { FormEvent, useState } from "react";

type Props = {
  productId: string;
  productName: string;
};

export default function ProductInquiryForm({
  productId,
  productName,
}: Props) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [quantity, setQuantity] = useState("");
  const [question, setQuestion] = useState("");
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSending(true);
    setSuccess(false);
    setError("");

    try {
      const response = await fetch("/api/product-inquiry", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId,
          productName,
          name,
          phone,
          email,
          quantity,
          question,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to send inquiry.");
      }

      setSuccess(true);

      setName("");
      setPhone("");
      setEmail("");
      setQuantity("");
      setQuestion("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <section
      id="product-inquiry"
      className="mt-10 rounded-3xl border border-white/10 bg-white/[0.04] p-6 md:p-8"
    >
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#B000D4]">
        Product Inquiry
      </p>

      <h2 className="mt-2 text-2xl font-bold text-white md:text-3xl">
        Ask About This Product
      </h2>

      <p className="mt-3 text-sm leading-7 text-white/55">
        Interested in{" "}
        <span className="font-medium text-white">{productName}</span>? Send us
        your question and any details about what you need.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        {/* Product */}
        <div>
          <label className="mb-2 block text-sm font-medium text-white/80">
            Product
          </label>

          <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/70">
            {productName}
          </div>
        </div>

        {/* Name + Phone */}
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label
              htmlFor="inquiry-name"
              className="mb-2 block text-sm font-medium text-white/80"
            >
              Name *
            </label>

            <input
              id="inquiry-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
              required
              className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-[#B000D4]"
            />
          </div>

          <div>
            <label
              htmlFor="inquiry-phone"
              className="mb-2 block text-sm font-medium text-white/80"
            >
              WhatsApp / Phone *
            </label>

            <input
              id="inquiry-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="024 XXX XXXX"
              required
              className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-[#B000D4]"
            />
          </div>
        </div>

        {/* Email + Quantity */}
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label
              htmlFor="inquiry-email"
              className="mb-2 block text-sm font-medium text-white/80"
            >
              Email
              <span className="ml-1 text-white/35">(Optional)</span>
            </label>

            <input
              id="inquiry-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-[#B000D4]"
            />
          </div>

          <div>
            <label
              htmlFor="inquiry-quantity"
              className="mb-2 block text-sm font-medium text-white/80"
            >
              Quantity
              <span className="ml-1 text-white/35">(Optional)</span>
            </label>

            <input
              id="inquiry-quantity"
              type="text"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="e.g. 500"
              className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-[#B000D4]"
            />
          </div>
        </div>

        {/* Question / Message */}
        <div>
          <label
            htmlFor="inquiry-question"
            className="mb-2 block text-sm font-medium text-white/80"
          >
            Your Question / Message *
          </label>

          <textarea
            id="inquiry-question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Tell us what you need, ask your question, or provide any other details about your request..."
            rows={8}
            required
            className="w-full resize-y rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm leading-7 text-white outline-none transition placeholder:text-white/25 focus:border-[#B000D4]"
          />

          <p className="mt-2 text-xs text-white/35">
            You can include your question, requirements, preferred design,
            deadline, size, colour, or anything else you want us to know.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* Success */}
        {success && (
          <div className="rounded-xl border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-300">
            Your inquiry has been sent successfully. BEEBZ PRINTS will get
            back to you soon.
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={sending}
          className="w-full rounded-full bg-[#B000D4] px-7 py-4 text-sm font-semibold text-white shadow-[0_0_30px_rgba(176,0,212,0.18)] transition hover:bg-[#8F00A8] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {sending ? "Sending Inquiry..." : "Send Inquiry"}
        </button>
      </form>
    </section>
  );
}
