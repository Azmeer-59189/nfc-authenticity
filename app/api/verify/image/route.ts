import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

// Step (was: photo similarity, now: logo detection). We forward the
// customer's photo to a separately-hosted YOLO model (see
// logo-verification/inference-api in the project docs) and check whether
// the logo it detects matches the brand this product claims to be.
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

  const logoApiUrl = process.env.LOGO_API_URL;
  if (!logoApiUrl) {
    return NextResponse.json(
      { error: "Logo detection service is not configured." },
      { status: 500 }
    );
  }

  const forwardForm = new FormData();
  forwardForm.append("file", image, image.name || "photo.jpg");

  let detection: {
    detected: boolean;
    best_match: { brand: string; confidence: number } | null;
  };
  try {
    const res = await fetch(`${logoApiUrl.replace(/\/$/, "")}/detect`, {
      method: "POST",
      body: forwardForm,
    });
    if (!res.ok) throw new Error(`Logo API returned ${res.status}`);
    detection = await res.json();
  } catch (err) {
    return NextResponse.json(
      { error: "Couldn't reach the logo detection service. Try again in a moment." },
      { status: 502 }
    );
  }

  const detectedBrand = detection.best_match?.brand?.toLowerCase();
  const confidence = detection.best_match?.confidence ?? 0;
  const matched = detection.detected && detectedBrand === product.brand.toLowerCase();

  // NFC is required and already known from the initial tap. QR and logo
  // detection are supplementary: both passing means "authentic", NFC
  // passing but one of these failing means "suspicious" (worth review).
  const overallResult =
    scan.nfcMatched && scan.qrMatched && matched ? "authentic" : "suspicious";

  await prisma.scan.update({
    where: { id: scanId },
    data: {
      imageMatched: matched,
      imageDistance: Math.round((1 - confidence) * 100), // reused column: 0 = perfect match, 100 = none
      overallResult,
    },
  });

  return NextResponse.json({
    matched,
    detectedBrand: detectedBrand ?? null,
    confidence,
    overallResult,
  });
}