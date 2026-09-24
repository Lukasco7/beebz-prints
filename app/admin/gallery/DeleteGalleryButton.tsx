"use client";

import { useState } from "react";

export default function DeleteGalleryButton({
  itemId,
  itemTitle,
  imageUrl,
}: {
  itemId: string;
  itemTitle: string;
  imageUrl: string;
}) {
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${itemTitle}"? This will also remove its image. This action cannot be undone.`,
    );

    if (!confirmed) return;

    setDeleting(true);

    try {
      const response = await fetch("/api/delete-gallery", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: itemId,
          imageUrl,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to delete gallery item.");
      }

      window.location.reload();
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Something went wrong while deleting the gallery item.",
      );

      setDeleting(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={deleting}
      className="text-sm font-medium text-red-600 transition hover:text-red-700 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
    >
      {deleting ? "Deleting..." : "Delete"}
    </button>
  );
}