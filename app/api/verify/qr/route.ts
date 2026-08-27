import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

// Step 2 (low priority): does the scanned QR code match the value on file
// for the product this scan session is already tied to? The expected value
// never leaves the server, so a comparison here can't be spoofed by reading
// client-side code.
export async function POST(req: NextRequest) {
  const { scanId, qrValue } = await req.json();
  if (!scanId || !qrValue) {
    return NextResponse.json({ error: "scanId and qrValue are required." }, { status: 400 });
  }

  const scan = await prisma.scan.findUnique({ where: { id: scanId } });
  if (!scan || !scan.productId) {
    return NextResponse.json({ error: "Unknown or invalid scan session." }, { status: 404 });
  }

  const product = await prisma.product.findUnique({ where: { id: scan.productId } });
  if (!product) {
    return NextResponse.json({ error: "Product no longer exists." }, { status: 404 });
  }

  const matched = product.qrValue === qrValue.trim();

  await prisma.scan.update({
    where: { id: scanId },
    data: { qrMatched: matched },
  });

  return NextResponse.json({ matched });
}
