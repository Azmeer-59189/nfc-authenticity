"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DeleteProductButton({ productId }: { productId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    const res = await fetch(`/api/products/${productId}`, { method: "DELETE" });
    setLoading(false);
    if (res.ok) {
      router.push("/admin/dashboard");
      router.refresh();
    }
  }

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="label-eyebrow text-alert hover:underline"
      >
        Delete product
      </button>
    );
  }

  return (
    <span className="flex items-center gap-3 text-sm">
      <span className="text-foil">Remove this product and its scan history?</span>
      <button onClick={handleDelete} disabled={loading} className="text-alert underline">
        {loading ? "Deleting..." : "Confirm delete"}
      </button>
      <button onClick={() => setConfirming(false)} className="text-foil underline">
        Cancel
      </button>
    </span>
  );
}
