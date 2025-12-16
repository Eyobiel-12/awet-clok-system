import { createBrowserClient } from "@supabase/ssr"
import { AuthApiError } from "@supabase/supabase-js"

let client: ReturnType<typeof createBrowserClient> | null = null

export function createClient() {
  if (client) {
    return client
  }

  client = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

  // Add global error handler for refresh token errors
  if (typeof window !== "undefined") {
    // Listen for auth state changes and handle errors
    client.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_OUT") {
        return
      }
      
      // Handle token refresh errors
      if (event === "TOKEN_REFRESHED" && !session) {
        // Token refresh failed, clear session and redirect
        await client?.auth.signOut()
        if (window.location.pathname !== "/auth/login" && !window.location.pathname.startsWith("/auth")) {
          window.location.href = "/auth/login"
        }
      }
    })
  }

  return client
}

/**
 * Helper function to handle Supabase auth errors
 * Automatically signs out and redirects on refresh token errors
 */
export async function handleAuthError(error: unknown): Promise<never> {
  if (error instanceof AuthApiError) {
    const errorMessage = error.message || ""
    if (
      errorMessage.includes("Refresh Token") ||
      errorMessage.includes("refresh_token") ||
      errorMessage.includes("JWT") ||
      error.status === 401
    ) {
      // Clear session and redirect to login
      if (client) {
        await client.auth.signOut()
      }
      if (typeof window !== "undefined" && window.location.pathname !== "/auth/login") {
        window.location.href = "/auth/login"
      }
    }
  }
  throw error
}
