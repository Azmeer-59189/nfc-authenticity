"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function HomePage() {
  const router = useRouter();
  const [code, setCode] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = code.trim();
    if (trimmed) router.push(`/verify/${encodeURIComponent(trimmed)}`);
  }

  return (
    <main className="min-h-screen flex flex-col">
      <header className="flex items-center justify-between px-6 py-5 md:px-12">
        <span className="font-display italic text-lg">Provenance</span>
        <Link
          href="/admin/login"
          className="label-eyebrow border border-line rounded-full px-4 py-2 hover:border-ink transition-colors"
        >
          Admin
        </Link>
      </header>

      <section className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div className="relative mb-8 flex h-28 w-28 items-center justify-center rounded-full border border-gold/60 shadow-seal">
          <div className="absolute inset-2 rounded-full border border-dashed border-gold/40" />
          <span className="font-display italic text-sm text-gold">genuine</span>
        </div>

        <p className="label-eyebrow mb-3">Three-step verification</p>
        <h1 className="font-display text-4xl md:text-5xl leading-[1.1] max-w-2xl mb-5">
          Confirm your product is <em className="italic">the real thing.</em>
        </h1>
        <p className="max-w-md text-foil mb-10">
          Tap your phone on the NFC tag built into the product to start
          verification automatically. No tag nearby? Enter the code printed
          under the tag below.
        </p>

        <form
          onSubmit={handleSubmit}
          className="flex w-full max-w-sm flex-col gap-3 sm:flex-row"
        >
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Enter product code"
            className="flex-1 rounded-full border border-line bg-white px-5 py-3 font-mono text-sm outline-none focus:border-gold"
          />
          <button
            type="submit"
            className="rounded-full bg-ink px-6 py-3 text-sm text-paper transition-opacity hover:opacity-85"
          >
            Verify
          </button>
        </form>
      </section>

      <footer className="px-6 py-6 text-center label-eyebrow md:px-12">
        Every tap is logged &mdash; unusual scan patterns help us catch counterfeits.
      </footer>
    </main>
  );
}
