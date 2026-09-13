import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

// Step 1 (high priority): does this NFC id exist in our database at all?
export async function GET(
  req: NextRequest,
  { params }: { params: { nfcId: string } }
) {
  const nfcId = params.nfcId;

  const product = await prisma.product.findUnique({
    where: { nfcId },
    select: { id: true, name: true, sku: true, description: true, brand: true },
  });

  const scan = await prisma.scan.create({
    data: {
      nfcIdScanned: nfcId,
      nfcMatched: Boolean(product),
      productId: product?.id,
      overallResult: product ? "pending" : "not_authentic",
      ipAddress: req.headers.get("x-forwarded-for") ?? undefined,
      userAgent: req.headers.get("user-agent") ?? undefined,
    },
  });

  if (!product) {
    return NextResponse.json({ valid: false, scanId: scan.id });
  }

  return NextResponse.json({
    valid: true,
    scanId: scan.id,
    product: {
      id: product.id,
      name: product.name,
      sku: product.sku,
      description: product.description,
    },
  });
}