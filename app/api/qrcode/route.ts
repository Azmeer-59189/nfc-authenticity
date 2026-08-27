import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";

export const runtime = "nodejs";

// GET /api/qrcode?value=xyz -> PNG image of a QR code encoding that value.
// Used by the admin dashboard to display/download a printable QR code.
export async function GET(req: NextRequest) {
  const value = req.nextUrl.searchParams.get("value");
  if (!value) {
    return NextResponse.json({ error: "Missing 'value' query param." }, { status: 400 });
  }

  const buffer = await QRCode.toBuffer(value, {
    type: "png",
    width: 480,
    margin: 2,
    color: { dark: "#12181B", light: "#F6F5F1" },
  });

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
