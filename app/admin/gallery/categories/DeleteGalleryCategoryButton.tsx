"use client";

import { useState } from "react";

type Props = {
  categoryId: string;
};

export default function DeleteGalleryCategoryButton({
  categoryId,
}: Props) {
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    const confirmed = window.confirm(
      "Are you sure you want to delete this gallery category?",
    );

    if (!confirmed) return;

    setDeleting(true);

    try {
      const response = await fetch("/api/delete-gallery-category", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: categoryId,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        alert(result.error || "Failed to delete category.");
        return;
      }

      window.location.reload();
    } catch {
      alert("Something went wrong while deleting the category.");
    } finally {
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