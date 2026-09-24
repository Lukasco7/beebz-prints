"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewCustomerPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [companyName, setCompanyName] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!fullName.trim()) {
      setError("Full name is required.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch("/api/create-customer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          full_name: fullName,
          email,
          phone,
          whatsapp,
          company_name: companyName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to create customer.",
        );
      }

      setSuccess("Customer created successfully.");

      setTimeout(() => {
        router.push("/admin/customers");
      }, 700);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to create customer.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F4F3F5] p-6 md:p-8">
      <div className="mx-auto max-w-3xl">
        {/* Back */}
        <button
          type="button"
          onClick={() =>
            router.push("/admin/customers")
          }
          className="mb-6 text-sm font-medium text-[#6F6872] transition hover:text-[#6A0D8F]"
        >
          ← Back to Customers
        </button>

        {/* Page Header */}
        <div className="mb-8">
          <p className="text-sm uppercase tracking-[0.2em] text-[#6A0D8F]">
            Customer Management
          </p>

          <h1 className="mt-2 text-3xl font-bold text-[#211C24]">
            Add Customer
          </h1>

          <p className="mt-2 text-[#6F6872]">
            Create a new customer record.
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-[#E9E6EB] bg-white p-6 shadow-sm md:p-8"
        >
          {/* Error */}
          {error && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="text-sm text-red-700">
                {error}
              </p>
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="mb-6 rounded-lg border border-[#D9C1E2] bg-[#F1E6F5] p-4">
              <p className="text-sm text-[#6A0D8F]">
                {success}
              </p>
            </div>
          )}

          <div className="space-y-6">
            {/* Full Name */}
            <div>
              <label
                htmlFor="full-name"
                className="mb-2 block text-sm font-medium text-[#211C24]"
              >
                Full Name *
              </label>

              <input
                id="full-name"
                type="text"
                value={fullName}
                onChange={(e) =>
                  setFullName(e.target.value)
                }
                placeholder="Enter customer's full name"
                required
                className="w-full rounded-lg border border-[#E9E6EB] bg-[#F4F3F5] px-4 py-3 text-[#211C24] outline-none transition placeholder:text-[#6F6872] focus:border-[#6A0D8F] focus:bg-white focus:ring-2 focus:ring-[#6A0D8F]/10"
              />
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="customer-email"
                className="mb-2 block text-sm font-medium text-[#211C24]"
              >
                Email
              </label>

              <input
                id="customer-email"
                type="email"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                placeholder="customer@example.com"
                className="w-full rounded-lg border border-[#E9E6EB] bg-[#F4F3F5] px-4 py-3 text-[#211C24] outline-none transition placeholder:text-[#6F6872] focus:border-[#6A0D8F] focus:bg-white focus:ring-2 focus:ring-[#6A0D8F]/10"
              />
            </div>

            {/* Phone + WhatsApp */}
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label
                  htmlFor="customer-phone"
                  className="mb-2 block text-sm font-medium text-[#211C24]"
                >
                  Phone
                </label>

                <input
                  id="customer-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) =>
                    setPhone(e.target.value)
                  }
                  placeholder="0240000000"
                  className="w-full rounded-lg border border-[#E9E6EB] bg-[#F4F3F5] px-4 py-3 text-[#211C24] outline-none transition placeholder:text-[#6F6872] focus:border-[#6A0D8F] focus:bg-white focus:ring-2 focus:ring-[#6A0D8F]/10"
                />
              </div>

              <div>
                <label
                  htmlFor="customer-whatsapp"
                  className="mb-2 block text-sm font-medium text-[#211C24]"
                >
                  WhatsApp
                </label>

                <input
                  id="customer-whatsapp"
                  type="tel"
                  value={whatsapp}
                  onChange={(e) =>
                    setWhatsapp(e.target.value)
                  }
                  placeholder="0240000000"
                  className="w-full rounded-lg border border-[#E9E6EB] bg-[#F4F3F5] px-4 py-3 text-[#211C24] outline-none transition placeholder:text-[#6F6872] focus:border-[#6A0D8F] focus:bg-white focus:ring-2 focus:ring-[#6A0D8F]/10"
                />
              </div>
            </div>

            {/* Company */}
            <div>
              <label
                htmlFor="company-name"
                className="mb-2 block text-sm font-medium text-[#211C24]"
              >
                Company Name
              </label>

              <input
                id="company-name"
                type="text"
                value={companyName}
                onChange={(e) =>
                  setCompanyName(e.target.value)
                }
                placeholder="Company or organization name"
                className="w-full rounded-lg border border-[#E9E6EB] bg-[#F4F3F5] px-4 py-3 text-[#211C24] outline-none transition placeholder:text-[#6F6872] focus:border-[#6A0D8F] focus:bg-white focus:ring-2 focus:ring-[#6A0D8F]/10"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() =>
                router.push("/admin/customers")
              }
              className="rounded-lg border border-[#E9E6EB] bg-white px-5 py-3 font-medium text-[#211C24] transition hover:bg-[#F1E6F5] hover:text-[#6A0D8F]"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-[#6A0D8F] px-6 py-3 font-semibold text-white transition hover:bg-[#48066A] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving
                ? "Creating..."
                : "Create Customer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}