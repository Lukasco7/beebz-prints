import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import UploadMediaButton from "./UploadMediaButton";
import DeleteMediaButton from "./DeleteMediaButton";

export const instant = false;

export default async function MediaPage() {
  const supabase = await createClient();

  const { data: media, error } = await supabase
    .from("media")
    .select(`
      id,
      file_name,
      file_size,
      mime_type,
      storage_path,
      public_url,
      alt_text,
      created_at
    `)
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="min-h-screen bg-[#F4F3F5] p-6 text-[#211C24]">
        <div className="mb-6">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 rounded-lg border border-[#E9E6EB] bg-white px-4 py-2 text-sm font-medium text-[#6F6872] transition hover:border-[#B000D4] hover:bg-[#F4F3F5] hover:text-[#48066A]"
          >
            ← Back to Dashboard
          </Link>
        </div>

        <h1 className="text-3xl font-bold text-[#211C24]">
          Media Library
        </h1>

        <p className="mt-4 text-sm text-red-600">
          Failed to load media: {error.message}
        </p>
      </div>
    );
  }

  function formatFileSize(bytes: number | null) {
    if (!bytes) return "—";

    if (bytes < 1024) {
      return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return (
    <div className="min-h-screen bg-[#F4F3F5] p-6 text-[#211C24]">
      <div className="mb-6">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 rounded-lg border border-[#E9E6EB] bg-white px-4 py-2 text-sm font-medium text-[#6F6872] shadow-sm transition hover:border-[#B000D4] hover:bg-[#F4F3F5] hover:text-[#48066A]"
        >
          ← Back to Dashboard
        </Link>
      </div>

      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#48066A]">
            Media Library
          </h1>

          <p className="mt-2 text-[#6F6872]">
            Manage images and other media used across BEEBZ PRINTS.
          </p>
        </div>

        <UploadMediaButton />
      </div>

      {media && media.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {media.map((item) => (
            <div
              key={item.id}
              className="overflow-hidden rounded-xl border border-[#E9E6EB] bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="relative aspect-square bg-[#E9E6EB]">
                {item.mime_type?.startsWith("image/") &&
                item.public_url ? (
                  <Image
                    src={item.public_url}
                    alt={item.alt_text || item.file_name}
                    fill
                    unoptimized
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm font-medium text-[#6F6872]">
                    No Preview
                  </div>
                )}
              </div>

              <div className="p-4">
                <p
                  className="truncate font-medium text-[#211C24]"
                  title={item.file_name}
                >
                  {item.file_name}
                </p>

                <div className="mt-2 flex items-center justify-between gap-3 text-xs text-[#6F6872]">
                  <span>{formatFileSize(item.file_size)}</span>

                  <span className="truncate">
                    {item.mime_type || "Unknown"}
                  </span>
                </div>

                <p className="mt-3 text-xs text-[#6F6872]">
                  {new Date(item.created_at).toLocaleDateString()}
                </p>

                {/* Actions */}
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Link
                    href={`/admin/media/${item.id}`}
                    className="rounded-lg border border-[#E9E6EB] bg-white px-3 py-2 text-sm font-medium text-[#6F6872] transition hover:border-[#6A0D8F] hover:bg-[#F4F3F5] hover:text-[#48066A]"
                  >
                    Edit
                  </Link>

                  <Link
                    href={`/admin/media/${item.id}/view`}
                    className="rounded-lg bg-[#6A0D8F] px-3 py-2 text-sm font-medium text-white transition hover:bg-[#48066A]"
                  >
                    View
                  </Link>

                  <DeleteMediaButton
                    id={item.id}
                    storagePath={item.storage_path}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-[#E9E6EB] bg-white p-12 text-center shadow-sm">
          <h2 className="text-xl font-semibold text-[#211C24]">
            No media yet
          </h2>

          <p className="mt-2 text-[#6F6872]">
            Uploaded images and files will appear here.
          </p>
        </div>
      )}
    </div>
  );
}