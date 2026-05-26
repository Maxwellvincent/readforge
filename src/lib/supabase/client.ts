import { createBrowserClient } from "@supabase/ssr";

let _client: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  if (typeof window === "undefined") {
    // Return a stub during SSR/prerender — never used for real requests
    return {
      auth: {
        signInWithPassword: async () => ({ error: null }),
        signUp: async () => ({ error: null }),
        signOut: async () => {},
        getUser: async () => ({ data: { user: null } }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      },
      from: () => ({
        select: () => ({ eq: () => ({ single: async () => ({ data: null }) }) }),
        update: () => ({ eq: async () => ({ error: null }) }),
      }),
    } as unknown as ReturnType<typeof createBrowserClient>;
  }
  if (!_client) {
    _client = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return _client;
}
