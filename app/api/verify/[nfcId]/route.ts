import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

// Step 1 (high priority): does this NFC id exist in our database at all?
// This is what a customer hits the instant they tap their phone on the tag,
// since the tag itself is programmed with a URL like /verify/<nfcId>.
export async function GET(
  req: NextRequest,
  { params }: { params: { nfcId: string } }
) {
  const nfcId = params.nfcId;

  const product = await prisma.product.findUnique({
    where: { nfcId },
    select: { id: true, name: true, sku: true, description: true, imageUrl: true },
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
      // The reference photo itself is fine to show back to the customer
      // ("here's what the real thing looks like") -- only the perceptual
      // hash and QR value stay server-side.
      referenceImageUrl: product.imageUrl,
    },
  });
}
