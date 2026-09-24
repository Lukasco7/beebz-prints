import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const instant = false;

type ViewMediaPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ViewMediaPage({
  params,
}: ViewMediaPageProps) {
  const { id } = await params;

  const supabase = await createClient();

  const { data: media, error } = await supabase
    .from("media")
    .select(`
      id,
      file_name,
      file_size,
      mime_type,
      public_url,
      alt_text,
      created_at
    `)
    .eq("id", id)
    .single();

  if (error || !media) {
    notFound();
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
    <main className="min-h-screen bg-[#F4F3F5] px-6 py-10 text-[#211C24]">
      <div className="mx-auto max-w-5xl">
        {/* Back button */}
        <Link
          href="/admin/media"
          className="mb-8 inline-flex items-center gap-2 rounded-xl border border-[#E9E6EB] bg-white px-4 py-2.5 text-sm font-medium text-[#6F6872] shadow-sm transition hover:border-[#B000D4] hover:bg-[#F4F3F5] hover:text-[#48066A]"
        >
          ← Back to Media Library
        </Link>

        {/* Header */}
        <div className="mb-8">
          <p className="mb-2 text-sm font-medium uppercase tracking-[0.2em] text-[#6A0D8F]">
            Media Preview
          </p>

          <h1 className="break-all text-3xl font-bold text-[#48066A]">
            {media.file_name}
          </h1>
        </div>

        {/* Image */}
        <div className="overflow-hidden rounded-3xl border border-[#E9E6EB] bg-white p-4 shadow-sm">
          <div className="relative flex min-h-[400px] items-center justify-center rounded-2xl bg-[#E9E6EB] p-4">
            {media.mime_type?.startsWith("image/") &&
            media.public_url ? (
              <Image
                src={media.public_url}
                alt={media.alt_text || media.file_name}
                width={1200}
                height={700}
                unoptimized
                sizes="(max-width: 1024px) 100vw, 1024px"
                className="max-h-[700px] w-auto max-w-full rounded-xl object-contain"
              />
            ) : (
              <p className="text-[#6F6872]">
                No preview available
              </p>
            )}
          </div>
        </div>

        {/* Information */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-[#E9E6EB] bg-white p-5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wider text-[#6F6872]">
              File Name
            </p>

            <p className="mt-2 break-all text-sm text-[#211C24]">
              {media.file_name}
            </p>
          </div>

          <div className="rounded-2xl border border-[#E9E6EB] bg-white p-5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wider text-[#6F6872]">
              File Size
            </p>

            <p className="mt-2 text-sm text-[#211C24]">
              {formatFileSize(media.file_size)}
            </p>
          </div>

          <div className="rounded-2xl border border-[#E9E6EB] bg-white p-5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wider text-[#6F6872]">
              File Type
            </p>

            <p className="mt-2 break-all text-sm text-[#211C24]">
              {media.mime_type || "Unknown"}
            </p>
          </div>

          <div className="rounded-2xl border border-[#E9E6EB] bg-white p-5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wider text-[#6F6872]">
              Uploaded
            </p>

            <p className="mt-2 text-sm text-[#211C24]">
              {new Date(media.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Alt text */}
        <div className="mt-4 rounded-2xl border border-[#E9E6EB] bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-[#6F6872]">
            Alt Text
          </p>

          <p className="mt-2 text-sm text-[#6F6872]">
            {media.alt_text || "No alt text provided."}
          </p>
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href={`/admin/media/${media.id}`}
            className="rounded-xl bg-[#6A0D8F] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#48066A]"
          >
            Edit Media
          </Link>

          <Link
            href="/admin/media"
            className="rounded-xl border border-[#E9E6EB] bg-white px-5 py-3 text-sm font-medium text-[#6F6872] transition hover:border-[#6A0D8F] hover:bg-[#F4F3F5] hover:text-[#48066A]"
          >
            Back to Library
          </Link>
        </div>
      </div>
    </main>
  );
}