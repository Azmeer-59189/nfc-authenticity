"use client";

import { useRef, useState } from "react";

type Props = {
  referenceImageUrl: string;
  onSubmit: (file: File) => void;
  submitting: boolean;
};

export default function ImageUploadStep({ referenceImageUrl, onSubmit, submitting }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);

  function handleFile(f: File) {
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-5">
      <div className="grid w-full grid-cols-2 gap-3">
        <div className="flex flex-col items-center gap-2">
          <span className="label-eyebrow">Reference</span>
          <img
            src={referenceImageUrl}
            alt="Reference product"
            className="aspect-square w-full rounded-xl border border-line object-cover"
          />
        </div>
        <div className="flex flex-col items-center gap-2">
          <span className="label-eyebrow">Your product</span>
          <button
            onClick={() => inputRef.current?.click()}
            className="flex aspect-square w-full items-center justify-center rounded-xl border border-dashed border-line bg-white text-xs text-foil"
          >
            {preview ? (
              <img src={preview} alt="Your upload" className="h-full w-full rounded-xl object-cover" />
            ) : (
              "Tap to add photo"
            )}
          </button>
        </div>
      </div>

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
        {submitting ? "Comparing..." : "Compare photo"}
      </button>
    </div>
  );
}
