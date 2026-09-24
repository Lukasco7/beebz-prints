"use client";

import { useState } from "react";

type DeleteFaqButtonProps = {
  faqId: string;
};

export default function DeleteFaqButton({
  faqId,
}: DeleteFaqButtonProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  // FIRST CLICK: ONLY SHOW CONFIRMATION
  function handleDeleteClick() {
    if (deleting) return;

    setError("");
    setShowConfirm(true);
  }

  // SECOND CLICK: ACTUALLY DELETE
  async function confirmDelete() {
    if (deleting) return;

    setDeleting(true);
    setError("");

    try {
      const response = await fetch("/api/delete-faq", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: faqId,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to delete FAQ.");
      }

      setShowConfirm(false);

      window.location.reload();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to delete FAQ."
      );

      setDeleting(false);
    }
  }

  function cancelDelete() {
    if (deleting) return;

    setShowConfirm(false);
    setError("");
  }

  return (
    <>
      {/* DELETE BUTTON */}
      <button
        type="button"
        onClick={handleDeleteClick}
        disabled={deleting}
        className="font-medium text-red-600 transition hover:text-red-700 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
      >
        Delete
      </button>

      {/* CONFIRMATION */}
      {showConfirm && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
          onClick={cancelDelete}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-[#333333] bg-[#1A1A1A] p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            {/* Warning Icon */}
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="h-7 w-7 text-red-500"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v4m0 4h.01M10.29 3.86l-7.82 13.5A2 2 0 004.2 20.36h15.6a2 2 0 001.73-3L13.71 3.86a2 2 0 00-3.42 0z"
                />
              </svg>
            </div>

            {/* Title */}
            <h2 className="mt-5 text-center text-xl font-bold text-white">
              Delete FAQ?
            </h2>

            {/* Message */}
            <p className="mt-3 text-center text-sm leading-6 text-[#B5B5B5]">
              Are you sure you want to delete this FAQ?
            </p>

            <p className="mt-2 text-center text-xs leading-5 text-[#777777]">
              This action cannot be undone.
            </p>

            {/* Error */}
            {error && (
              <div className="mt-4 rounded-xl border border-red-900/60 bg-red-950/40 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}

            {/* Buttons */}
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">

              {/* CANCEL */}
              <button
                type="button"
                onClick={cancelDelete}
                disabled={deleting}
                className="rounded-xl border border-[#444444] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#242424] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              {/* CONFIRM DELETE */}
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleting}
                className="rounded-xl bg-red-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Yes, Delete FAQ"}
              </button>

            </div>
          </div>
        </div>
      )}
    </>
  );
}