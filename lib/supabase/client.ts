import { createBrowserClient } from "@supabase/ssr";

/**
 * Supabase browser client for client-side operations
 * Used in Client Components and browser contexts
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
