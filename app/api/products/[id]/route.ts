import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { session, unauthorized } = await requireAdmin();
  if (!session) return unauthorized;

  const product = await prisma.product.findUnique({
    where: { id: params.id },
    include: { scans: { orderBy: { createdAt: "desc" }, take: 25 } },
  });
  if (!product) {
    return NextResponse.json({ error: "Product not found." }, { status: 404 });
  }
  return NextResponse.json({ product });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { session, unauthorized } = await requireAdmin();
  if (!session) return unauthorized;

  await prisma.scan.deleteMany({ where: { productId: params.id } });
  await prisma.product.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
