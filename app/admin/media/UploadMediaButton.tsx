"use client";

import { useRef, useState } from "react";

export default function UploadMediaButton() {
  const inputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [altText, setAltText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  function openFilePicker() {
    inputRef.current?.click();
  }

  async function handleUpload() {
    if (!file) {
      setMessage("Please select an image first.");
      return;
    }

    setUploading(true);
    setMessage("");

    try {
      const formData = new FormData();

      formData.append("file", file);
      formData.append("alt_text", altText);

      const response = await fetch("/api/upload-media", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        setMessage(result.error || "Upload failed.");
        return;
      }

      setMessage("Media uploaded successfully.");

      setFile(null);
      setAltText("");

      if (inputRef.current) {
        inputRef.current.value = "";
      }

      window.location.reload();
    } catch (error) {
      console.error(error);
      setMessage("Something went wrong while uploading.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(event) => {
          const selectedFile = event.target.files?.[0] ?? null;
          setFile(selectedFile);
          setMessage("");
        }}
      />

      <button
        type="button"
        onClick={openFilePicker}
        className="rounded-xl bg-[#6A0D8F] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#48066A]"
      >
        {file ? "Change Image" : "Choose Image"}
      </button>

      {file && (
        <div className="w-full max-w-md rounded-2xl border border-[#E9E6EB] bg-white p-4 shadow-sm">
          <p
            className="truncate text-sm font-medium text-[#211C24]"
            title={file.name}
          >
            {file.name}
          </p>

          <p className="mt-1 text-xs text-[#6F6872]">
            {(file.size / 1024 / 1024).toFixed(2)} MB
          </p>

          <input
            type="text"
            value={altText}
            onChange={(event) => setAltText(event.target.value)}
            placeholder="Alt text (optional)"
            className="mt-4 w-full rounded-xl border border-[#E9E6EB] bg-[#F4F3F5] px-4 py-3 text-sm text-[#211C24] outline-none placeholder:text-[#6F6872] focus:border-[#B000D4] focus:ring-2 focus:ring-[#B000D4]/10"
          />

          <button
            type="button"
            onClick={handleUpload}
            disabled={uploading}
            className="mt-4 w-full rounded-xl bg-[#48066A] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#6A0D8F] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {uploading ? "Uploading..." : "Upload Media"}
          </button>

          {message && (
            <p
              className={`mt-3 text-sm ${
                message.toLowerCase().includes("success")
                  ? "text-[#48066A]"
                  : "text-red-600"
              }`}
            >
              {message}
            </p>
          )}
        </div>
      )}
    </div>
  );
}