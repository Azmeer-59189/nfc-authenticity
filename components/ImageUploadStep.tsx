"use client";

import { useRef, useState } from "react";

type Props = {
  onSubmit: (file: File) => void;
  submitting: boolean;
};

export default function ImageUploadStep({ onSubmit, submitting }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);

  function handleFile(f: File) {
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-5">
      <button
        onClick={() => inputRef.current?.click()}
        className="flex aspect-square w-full max-w-xs items-center justify-center overflow-hidden rounded-xl border border-dashed border-line bg-white text-xs text-foil"
      >
        {preview ? (
          <img src={preview} alt="Your upload" className="h-full w-full object-cover" />
        ) : (
          "Tap to photograph the logo"
        )}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />

      <button
        disabled={!file || submitting}
        onClick={() => file && onSubmit(file)}
        className="rounded-full bg-ink px-6 py-3 text-sm text-paper transition-opacity hover:opacity-85 disabled:opacity-40"
      >
        {submitting ? "Checking logo..." : "Check logo"}
      </button>
    </div>
  );
}