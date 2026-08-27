import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import AdminNav from "@/components/AdminNav";

export default async function DashboardPage() {
  const session = await getSession();
  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { scans: true } } },
  });

  return (
    <main className="min-h-screen">
      <AdminNav name={session?.name} />

      <div className="mx-auto max-w-5xl px-6 py-10 md:px-10">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="label-eyebrow mb-1">Inventory</p>
            <h1 className="font-display text-3xl">Products</h1>
          </div>
          <Link
            href="/admin/dashboard/new"
            className="rounded-full bg-ink px-5 py-2.5 text-sm text-paper transition-opacity hover:opacity-85"
          >
            + New product
          </Link>
        </div>

        {products.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line px-6 py-16 text-center">
            <p className="text-foil">No products yet. Add your first one to generate its NFC and QR pairing.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-line">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line bg-white/60 text-left label-eyebrow">
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">SKU</th>
                  <th className="px-4 py-3">NFC ID</th>
                  <th className="px-4 py-3">Scans</th>
                  <th className="px-4 py-3">Added</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className="border-b border-line last:border-0 hover:bg-white/40">
                    <td className="px-4 py-3">
                      <Link href={`/admin/dashboard/${p.id}`} className="flex items-center gap-3">
                        <img src={p.imageUrl} alt="" className="h-10 w-10 rounded-lg object-cover" />
                        <span className="font-medium">{p.name}</span>
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-foil">{p.sku}</td>
                    <td className="px-4 py-3 font-mono text-xs text-foil">{p.nfcId.slice(0, 12)}...</td>
                    <td className="px-4 py-3">{p._count.scans}</td>
                    <td className="px-4 py-3 text-foil">
                      {new Date(p.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
