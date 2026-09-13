import { NextRequest, NextResponse } from "next/server";
import { v4 as uuid } from "uuid";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { getSupabaseAdmin, PRODUCT_IMAGES_BUCKET } from "@/lib/supabase";

export const runtime = "nodejs";

export async function GET() {
  const { session, unauthorized } = await requireAdmin();
  if (!session) return unauthorized;

  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      sku: true,
      brand: true,
      nfcId: true,
      qrValue: true,
      imageUrl: true,
      createdAt: true,
      _count: { select: { scans: true } },
    },
  });
  return NextResponse.json({ products });
}

export async function POST(req: NextRequest) {
  const { session, unauthorized } = await requireAdmin();
  if (!session) return unauthorized;

  const form = await req.formData();
  const name = form.get("name")?.toString().trim();
  const sku = form.get("sku")?.toString().trim();
  const brand = form.get("brand")?.toString().trim().toLowerCase();
  const description = form.get("description")?.toString().trim() || null;
  const nfcId = form.get("nfcId")?.toString().trim() || uuid();
  const qrValue = form.get("qrValue")?.toString().trim() || uuid();
  const image = form.get("image") as File | null;

  if (!name || !sku || !brand) {
    return NextResponse.json(
      { error: "Product name, SKU, and brand are all required." },
      { status: 400 }
    );
  }
  if (!image || image.size === 0) {
    return NextResponse.json(
      { error: "A reference photo is required." },
      { status: 400 }
    );
  }

  const [existingSku, existingNfc, existingQr] = await Promise.all([
    prisma.product.findUnique({ where: { sku } }),
    prisma.product.findUnique({ where: { nfcId } }),
    prisma.product.findUnique({ where: { qrValue } }),
  ]);
  if (existingSku)
    return NextResponse.json({ error: "That SKU is already in use." }, { status: 409 });
  if (existingNfc)
    return NextResponse.json({ error: "That NFC ID is already assigned to a product." }, { status: 409 });
  if (existingQr)
    return NextResponse.json({ error: "That QR value is already assigned to a product." }, { status: 409 });

  const bytes = Buffer.from(await image.arrayBuffer());
  const ext = (image.type.split("/")[1] || "jpg").replace("jpeg", "jpg");
  const filename = `${uuid()}.${ext}`;

  const supabase = getSupabaseAdmin();
  const { error: uploadError } = await supabase.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .upload(filename, bytes, { contentType: image.type, upsert: false });

  if (uploadError) {
    return NextResponse.json(
      { error: `Failed to upload photo: ${uploadError.message}` },
      { status: 500 }
    );
  }

  const { data: publicUrlData } = supabase.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .getPublicUrl(filename);
  const imageUrl = publicUrlData.publicUrl;

  const product = await prisma.product.create({
    data: {
      name,
      sku,
      brand,
      description,
      nfcId,
      qrValue,
      imageUrl,
      createdById: session.adminId,
    },
  });

  return NextResponse.json({ product }, { status: 201 });
}