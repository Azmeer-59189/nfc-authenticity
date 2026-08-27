"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminSignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Something went wrong.");
      return;
    }
    router.push("/admin/dashboard");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <p className="label-eyebrow mb-2 text-center">Admin</p>
        <h1 className="mb-8 text-center font-display text-3xl">Create an account</h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="label-eyebrow mb-1 block">Name</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-line bg-white px-4 py-3 text-sm outline-none focus:border-gold"
            />
          </div>
          <div>
            <label className="label-eyebrow mb-1 block">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-line bg-white px-4 py-3 text-sm outline-none focus:border-gold"
            />
          </div>
          <div>
            <label className="label-eyebrow mb-1 block">Password</label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-line bg-white px-4 py-3 text-sm outline-none focus:border-gold"
            />
            <p className="mt-1 text-xs text-foil">At least 8 characters.</p>
          </div>
          {error && <p className="text-sm text-alert">{error}</p>}
          <button
            disabled={loading}
            className="mt-2 rounded-full bg-ink px-6 py-3 text-sm text-paper transition-opacity hover:opacity-85 disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-foil">
          Already have an account?{" "}
          <Link href="/admin/login" className="text-ink underline underline-offset-2">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
