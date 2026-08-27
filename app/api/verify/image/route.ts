import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeImageHash, hammingDistance, IMAGE_MATCH_THRESHOLD } from "@/lib/phash";

export const runtime = "nodejs";

// Step (low priority): does the uploaded photo perceptually resemble the
// reference photo on file? This is the easiest check to spoof (anyone can
// hold up a good replica or a photo of the real product) so it only ever
// contributes to a "suspicious" flag, never fails verification by itself.
export async function POST(req: NextRequest) {
  const form = await req.formData();
  const scanId = form.get("scanId")?.toString();
  const image = form.get("image") as File | null;

  if (!scanId || !image || image.size === 0) {
    return NextResponse.json({ error: "scanId and image are required." }, { status: 400 });
  }

  const scan = await prisma.scan.findUnique({ where: { id: scanId } });
  if (!scan || !scan.productId) {
    return NextResponse.json({ error: "Unknown or invalid scan session." }, { status: 404 });
  }

  const product = await prisma.product.findUnique({ where: { id: scan.productId } });
  if (!product) {
    return NextResponse.json({ error: "Product no longer exists." }, { status: 404 });
  }

  const bytes = Buffer.from(await image.arrayBuffer());
  const uploadedHash = await computeImageHash(bytes);
  const distance = hammingDistance(uploadedHash, product.imageHash);
  const matched = distance <= IMAGE_MATCH_THRESHOLD;

  // NFC is required and already known from the initial tap. QR and image are
  // supplementary: both passing means "authentic", NFC passing but one of
  // the easy-to-spoof checks failing means "suspicious" (worth a human
  // review), and NFC not matching at all (handled at the /verify/[nfcId]
  // step) means "not_authentic".
  const overallResult =
    scan.nfcMatched && scan.qrMatched && matched ? "authentic" : "suspicious";

  await prisma.scan.update({
    where: { id: scanId },
    data: { imageMatched: matched, imageDistance: distance, overallResult },
  });

  return NextResponse.json({ matched, distance, overallResult });
}
