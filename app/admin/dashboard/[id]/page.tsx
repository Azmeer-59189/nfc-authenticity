import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import AdminNav from "@/components/AdminNav";
import DeleteProductButton from "@/components/DeleteProductButton";

const RESULT_COLOR: Record<string, string> = {
  authentic: "text-verify",
  suspicious: "text-gold",
  not_authentic: "text-alert",
  pending: "text-foil",
};

export default async function ProductDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getSession();
  const product = await prisma.product.findUnique({
    where: { id: params.id },
    include: { scans: { orderBy: { createdAt: "desc" }, take: 25 } },
  });
  if (!product) notFound();

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const nfcUrl = `${baseUrl}/verify/${product.nfcId}`;

  return (
    <main className="min-h-screen">
      <AdminNav name={session?.name} />

      <div className="mx-auto max-w-3xl px-6 py-10 md:px-10">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <p className="label-eyebrow mb-1">Inventory / {product.sku}</p>
            <h1 className="font-display text-3xl">{product.name}</h1>
          </div>
          <DeleteProductButton productId={product.id} />
        </div>

        <div className="mb-10 grid gap-8 md:grid-cols-2">
          <div>
            <img
              src={product.imageUrl}
              alt={product.name}
              className="aspect-square w-full rounded-2xl border border-line object-cover"
            />
            {product.description && (
              <p className="mt-4 text-sm text-foil">{product.description}</p>
            )}
          </div>

          <div className="flex flex-col gap-6">
            <div className="rounded-2xl border border-line p-5">
              <p className="label-eyebrow mb-2">Write this URL to the NFC tag</p>
              <p className="break-all rounded-lg bg-panel px-3 py-2 font-mono text-xs text-paper">
                {nfcUrl}
              </p>
              <p className="mt-2 text-xs text-foil">
                Use any NFC writer app (e.g. NFC Tools) to program an NTAG21x
                tag with this URL as an NDEF record.
              </p>
            </div>

            <div className="rounded-2xl border border-line p-5">
              <p className="label-eyebrow mb-3">Printable QR code</p>
              <img
                src={`/api/qrcode?value=${encodeURIComponent(product.qrValue)}`}
                alt="Product QR code"
                className="mx-auto h-40 w-40"
              />
              <p className="mt-3 text-center font-mono text-xs text-foil">
                {product.qrValue}
              </p>
            </div>
          </div>
        </div>

        <div>
          <p className="label-eyebrow mb-3">Recent scans</p>
          {product.scans.length === 0 ? (
            <p className="text-sm text-foil">No verification attempts yet.</p>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-line">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line bg-white/60 text-left label-eyebrow">
                    <th className="px-4 py-3">Result</th>
                    <th className="px-4 py-3">QR</th>
                    <th className="px-4 py-3">Photo</th>
                    <th className="px-4 py-3">Distance</th>
                    <th className="px-4 py-3">When</th>
                  </tr>
                </thead>
                <tbody>
                  {product.scans.map((s) => (
                    <tr key={s.id} className="border-b border-line last:border-0">
                      <td className={`px-4 py-3 font-medium ${RESULT_COLOR[s.overallResult]}`}>
                        {s.overallResult.replace("_", " ")}
                      </td>
                      <td className="px-4 py-3">{fmtBool(s.qrMatched)}</td>
                      <td className="px-4 py-3">{fmtBool(s.imageMatched)}</td>
                      <td className="px-4 py-3 text-foil">{s.imageDistance ?? "-"}</td>
                      <td className="px-4 py-3 text-foil">
                        {new Date(s.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function fmtBool(v: boolean | null) {
  if (v === null) return "-";
  return v ? "yes" : "no";
}
