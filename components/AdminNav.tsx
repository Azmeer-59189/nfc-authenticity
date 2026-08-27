"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AdminNav({ name }: { name?: string }) {
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <header className="flex items-center justify-between border-b border-line px-6 py-5 md:px-10">
      <Link href="/admin/dashboard" className="font-display italic text-lg">
        Provenance <span className="text-foil not-italic">/ admin</span>
      </Link>
      <div className="flex items-center gap-4">
        {name && <span className="label-eyebrow hidden sm:inline">{name}</span>}
        <button onClick={logout} className="label-eyebrow hover:text-alert">
          Log out
        </button>
      </div>
    </header>
  );
}
