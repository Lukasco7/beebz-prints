"use client";

import { useState } from "react";

type DeletePageButtonProps = {
  pageId: string;
  pageTitle: string;
};

export default function DeletePageButton({
  pageId,
  pageTitle,
}: DeletePageButtonProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function confirmDelete() {
    try {
      setDeleting(true);

      const response = await fetch("/api/delete-page", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: pageId,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Failed to delete page."
        );
      }

      window.location.reload();
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Failed to delete page."
      );

      setDeleting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setShowConfirm(true)}
        disabled={deleting}
        className="rounded-lg border border-red-500/20 bg-white px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Delete
      </button>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#211C24]/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-[#E9E6EB] bg-white p-6 shadow-[0_20px_60px_rgba(33,28,36,0.18)]">
            <div className="mb-5">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-red-500/10 text-red-700">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="h-5 w-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v4"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 17h.01"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M10.3 3.8 2.7 17a2 2 0 0 0 1.73 3h15.14a2 2 0 0 0 1.73-3L13.7 3.8a2 2 0 0 0-3.4 0Z"
                  />
                </svg>
              </div>

              <h2 className="text-xl font-semibold text-[#211C24]">
                Delete Page?
              </h2>

              <p className="mt-2 text-sm leading-6 text-[#6F6872]">
                Are you sure you want to delete{" "}
                <span className="font-semibold text-[#211C24]">
                  &quot;{pageTitle}&quot;
                </span>
                ? This action cannot be undone.
              </p>
            </div>

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                disabled={deleting}
                className="rounded-xl border border-[#E9E6EB] bg-[#F4F3F5] px-5 py-3 font-medium text-[#211C24] transition hover:bg-[#E9E6EB] disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleting}
                className="rounded-xl bg-red-600 px-5 py-3 font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Yes, Delete Page"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}