import { createBrowserClient } from "@supabase/ssr";
import { supabaseAnonKey, supabaseUrl } from "@/lib/supabase/env";

let browserClient: ReturnType<typeof createBrowserClient> | undefined;

export function createClient() {
  browserClient ??= createBrowserClient(
    supabaseUrl,
    supabaseAnonKey,
    { cookieOptions: { secure: process.env.NODE_ENV === "production" } },
  );

  return browserClient;
}
