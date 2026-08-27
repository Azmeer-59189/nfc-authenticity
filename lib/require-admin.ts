import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

/** Use at the top of any admin-only Route Handler. Returns the session if
 * logged in, or an unauthorized NextResponse to return immediately. */
export async function requireAdmin() {
  const session = await getSession();
  if (!session) {
    return {
      session: null,
      unauthorized: NextResponse.json({ error: "Not authenticated." }, { status: 401 }),
    };
  }
  return { session, unauthorized: null };
}
