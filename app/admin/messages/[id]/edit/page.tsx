"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

const statuses = [
  {
    value: "unread",
    label: "Unread",
    description: "The message has not been reviewed yet.",
  },
  {
    value: "read",
    label: "Read",
    description: "The message has been reviewed.",
  },
  {
    value: "replied",
    label: "Replied",
    description: "A response has been sent to the customer.",
  },
];

export default function EditMessagePage() {
  const params = useParams();
  const router = useRouter();

  const messageId = String(params.id);

  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [status, setStatus] = useState("unread");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function loadMessage() {
      try {
        const response = await fetch(
          `/api/get-message?id=${messageId}`,
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error || "Failed to load message.",
          );
        }

        setName(data.message.name || "");
        setSubject(data.message.subject || "");
        setStatus(data.message.status || "unread");
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load message.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadMessage();
  }, [messageId]);

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const response = await fetch("/api/update-message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: messageId,
          status,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to update message.",
        );
      }

      setSuccess("Message status updated successfully.");

      setTimeout(() => {
        router.push(`/admin/messages/${messageId}`);
      }, 700);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update message.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F3F5] p-6">
        <p className="text-[#6F6872]">Loading message...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F3F5] p-6 md:p-8">
      <div className="mx-auto max-w-3xl">
        <button
          type="button"
          onClick={() =>
            router.push(`/admin/messages/${messageId}`)
          }
          className="mb-6 text-sm text-[#6F6872] transition hover:text-[#6A0D8F]"
        >
          ← Back to Message
        </button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#211C24]">
            Update Message
          </h1>

          <p className="mt-2 text-[#6F6872]">
            Update the status of this customer message.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-[#DDD7E0] bg-white p-6 shadow-sm"
        >
          {error && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="text-sm text-red-700">
                {error}
              </p>
            </div>
          )}

          {success && (
            <div className="mb-6 rounded-lg border border-[#D9C1E2] bg-[#F1E6F5] p-4">
              <p className="text-sm text-[#6A0D8F]">
                {success}
              </p>
            </div>
          )}

          <div className="mb-8 rounded-xl border border-[#DDD7E0] bg-[#F4F3F5] p-5">
            <p className="text-sm text-[#6F6872]">
              From
            </p>

            <p className="mt-1 font-medium text-[#211C24]">
              {name}
            </p>

            <p className="mt-3 text-sm text-[#6F6872]">
              Subject
            </p>

            <p className="mt-1 text-[#211C24]">
              {subject || "No subject"}
            </p>
          </div>

          <div>
            <label className="mb-3 block text-sm font-medium text-[#211C24]">
              Message Status
            </label>

            <div className="space-y-3">
              {statuses.map((item) => (
                <label
                  key={item.value}
                  className={`flex cursor-pointer items-start gap-4 rounded-xl border p-4 transition ${
                    status === item.value
                      ? "border-[#6A0D8F] bg-[#F1E6F5]"
                      : "border-[#DDD7E0] bg-white hover:bg-[#F8F5F9]"
                  }`}
                >
                  <input
                    type="radio"
                    name="status"
                    value={item.value}
                    checked={status === item.value}
                    onChange={(e) =>
                      setStatus(e.target.value)
                    }
                    className="mt-1 accent-[#6A0D8F]"
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
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() =>
                router.push(`/admin/messages/${messageId}`)
              }
              className="rounded-lg border border-[#DDD7E0] bg-white px-5 py-3 font-medium text-[#211C24] transition hover:bg-[#F1E6F5] hover:text-[#6A0D8F]"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-[#6A0D8F] px-6 py-3 font-semibold text-white transition hover:bg-[#48066A] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}