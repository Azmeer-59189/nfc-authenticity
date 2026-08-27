"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewProductPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [description, setDescription] = useState("");
  const [nfcId, setNfcId] = useState("");
  const [qrValue, setQrValue] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setError("Please add a reference photo.");
      return;
    }
    setLoading(true);
    setError(null);

    const form = new FormData();
    form.append("name", name);
    form.append("sku", sku);
    form.append("description", description);
    if (nfcId.trim()) form.append("nfcId", nfcId.trim());
    if (qrValue.trim()) form.append("qrValue", qrValue.trim());
    form.append("image", file);

    const res = await fetch("/api/products", { method: "POST", body: form });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Something went wrong.");
      return;
    }
    const data = await res.json();
    router.push(`/admin/dashboard/${data.product.id}`);
  }

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-lg px-6 py-10">
        <p className="label-eyebrow mb-1">Inventory / New</p>
        <h1 className="mb-8 font-display text-3xl">Add a product</h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="label-eyebrow mb-1 block">Product name</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-line bg-white px-4 py-3 text-sm outline-none focus:border-gold"
            />
          </div>
          <div>
            <label className="label-eyebrow mb-1 block">SKU</label>
            <input
              required
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              className="w-full rounded-lg border border-line bg-white px-4 py-3 font-mono text-sm outline-none focus:border-gold"
            />
          </div>
          <div>
            <label className="label-eyebrow mb-1 block">Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-line bg-white px-4 py-3 text-sm outline-none focus:border-gold"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-eyebrow mb-1 block">NFC ID (optional)</label>
              <input
                value={nfcId}
                onChange={(e) => setNfcId(e.target.value)}
                placeholder="auto-generated"
                className="w-full rounded-lg border border-line bg-white px-4 py-3 font-mono text-xs outline-none focus:border-gold"
              />
            </div>
            <div>
              <label className="label-eyebrow mb-1 block">QR value (optional)</label>
              <input
                value={qrValue}
                onChange={(e) => setQrValue(e.target.value)}
                placeholder="auto-generated"
                className="w-full rounded-lg border border-line bg-white px-4 py-3 font-mono text-xs outline-none focus:border-gold"
              />
            </div>
          </div>
          <p className="-mt-2 text-xs text-foil">
            Leave these blank to auto-generate unique values. You&apos;ll get a
            printable QR code and the exact URL to write onto the NFC tag on the
            next screen.
          </p>

          <div>
            <label className="label-eyebrow mb-1 block">Reference photo</label>
            <label className="flex aspect-video w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-dashed border-line bg-white text-sm text-foil">
              {preview ? (
                <img src={preview} alt="" className="h-full w-full object-cover" />
              ) : (
                "Click to upload"
              )}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) {
                    setFile(f);
                    setPreview(URL.createObjectURL(f));
                  }
                }}
              />
            </label>
          </div>

          {error && <p className="text-sm text-alert">{error}</p>}

          <button
            disabled={loading}
            className="mt-2 rounded-full bg-ink px-6 py-3 text-sm text-paper transition-opacity hover:opacity-85 disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save product"}
          </button>
        </form>
      </div>
    </main>
  );
}
