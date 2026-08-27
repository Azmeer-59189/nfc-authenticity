import { createClient } from "@supabase/supabase-js";

// Server-only client using the service role key, which can write to storage
// buckets regardless of RLS policies. Never import this from client
// components or expose the service role key to the browser.
export function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in your environment."
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false },
  });
}

export const PRODUCT_IMAGES_BUCKET = "product-images";