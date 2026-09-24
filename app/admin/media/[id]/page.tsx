"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type MediaItem = {
  id: string;
  file_name: string;
  alt_text: string | null;
  public_url: string;
};

export default function EditMediaPage() {
  const params = useParams();
  const router = useRouter();

  const mediaId = String(params.id);

  const [media, setMedia] = useState<MediaItem | null>(null);
  const [altText, setAltText] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadMedia() {
      try {
        const response = await fetch(
          `/api/get-media?id=${encodeURIComponent(mediaId)}`
        );

        const result = await response.json();

        if (!response.ok) {
          setError(result.error || "Failed to load media.");
          return;
        }

        setMedia(result.media);
        setAltText(result.media.alt_text || "");
      } catch (error) {
        console.error(error);
        setError("Failed to load media.");
      } finally {
        setLoading(false);
      }
    }

    if (mediaId) {
      loadMedia();
    }
  }, [mediaId]);

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSaving(true);
    setError("");

    try {
      const response = await fetch("/api/update-media", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: mediaId,
          alt_text: altText,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Failed to update media.");
        return;
      }

      router.push("/admin/media");
      router.refresh();
    } catch (error) {
      console.error(error);
      setError("Something went wrong while saving.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F3F5] p-8 text-[#211C24]">
        <p className="text-[#6F6872]">Loading media...</p>
      </div>
    );
  }

  if (error && !media) {
    return (
      <div className="min-h-screen bg-[#F4F3F5] p-8 text-[#211C24]">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (!media) {
    return null;
  }

  return (
    <main className="min-h-screen bg-[#F4F3F5] px-6 py-10 text-[#211C24]">
      <div className="mx-auto max-w-3xl">
        <button
          type="button"
          onClick={() => router.push("/admin/media")}
          className="mb-8 text-sm font-medium text-[#6F6872] transition hover:text-[#48066A]"
        >
          ← Back to Media
        </button>

        <div className="mb-8">
          <p className="mb-2 text-sm font-medium uppercase tracking-[0.2em] text-[#6A0D8F]">
            Media Library
          </p>

          <h1 className="text-3xl font-bold text-[#48066A]">
            Edit Media
          </h1>

          <p className="mt-2 text-[#6F6872]">
            Update the information associated with this image.
          </p>
        </div>

        <div className="rounded-3xl border border-[#E9E6EB] bg-white p-6 shadow-sm">
          <div className="relative mb-8 h-[420px] overflow-hidden rounded-2xl border border-[#E9E6EB] bg-[#E9E6EB]">
            <Image
              src={media.public_url}
              alt={media.alt_text || media.file_name}
              fill
              unoptimized
              sizes="(max-width: 768px) 100vw, 768px"
              className="object-contain"
            />
          </div>

          <div className="mb-6">
            <p className="text-xs font-medium uppercase tracking-wider text-[#6F6872]">
              File Name
            </p>

            <p className="mt-1 break-all text-sm text-[#211C24]">
              {media.file_name}
            </p>
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            <div>
              <label
                htmlFor="alt_text"
                className="mb-2 block text-sm font-medium text-[#211C24]"
              >
                Alt Text
              </label>

              <input
                id="alt_text"
                type="text"
                value={altText}
                onChange={(event) => setAltText(event.target.value)}
                placeholder="Describe the image"
                className="w-full rounded-xl border border-[#E9E6EB] bg-[#F4F3F5] px-4 py-3 text-[#211C24] outline-none placeholder:text-[#6F6872] focus:border-[#B000D4] focus:ring-2 focus:ring-[#B000D4]/10"
              />

              <p className="mt-2 text-xs text-[#6F6872]">
                Useful for accessibility and SEO.
              </p>
            </div>

            {error && (
              <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </p>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => router.push("/admin/media")}
                className="rounded-xl border border-[#E9E6EB] bg-white px-5 py-3 text-sm font-medium text-[#6F6872] transition hover:border-[#6A0D8F] hover:bg-[#F4F3F5] hover:text-[#48066A]"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-[#6A0D8F] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#48066A] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}