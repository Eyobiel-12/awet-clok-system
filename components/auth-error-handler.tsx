"use client"

import { useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { AuthApiError } from "@supabase/supabase-js"

/**
 * Global error handler for authentication errors
 * Automatically handles refresh token errors and redirects to login
 */
export function AuthErrorHandler() {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Handle token refresh failures
      if (event === "TOKEN_REFRESHED" && !session) {
        // Token refresh failed, sign out and redirect
        await supabase.auth.signOut()
        if (window.location.pathname !== "/auth/login" && !window.location.pathname.startsWith("/auth")) {
          router.push("/auth/login")
        }
      }

      // Handle signed out events
      if (event === "SIGNED_OUT") {
        // Clear any remaining local storage
        if (typeof window !== "undefined") {
          localStorage.removeItem("supabase.auth.token")
          sessionStorage.clear()
        }
      }
    })

    // Global error handler for unhandled auth errors
    const handleError = (event: ErrorEvent) => {
      const error = event.error
      if (error instanceof AuthApiError) {
        const errorMessage = error.message || ""
        if (
          errorMessage.includes("Refresh Token") ||
          errorMessage.includes("refresh_token") ||
          errorMessage.includes("JWT") ||
          error.status === 401
        ) {
          // Clear session and redirect to login
          supabase.auth.signOut().then(() => {
            if (window.location.pathname !== "/auth/login" && !window.location.pathname.startsWith("/auth")) {
              router.push("/auth/login")
            }
          })
        }
      }
    }

    window.addEventListener("error", handleError)
    window.addEventListener("unhandledrejection", (event) => {
      const error = event.reason
      if (error instanceof AuthApiError) {
        const errorMessage = error.message || ""
        if (
          errorMessage.includes("Refresh Token") ||
          errorMessage.includes("refresh_token") ||
          errorMessage.includes("JWT") ||
          error.status === 401
        ) {
          event.preventDefault()
          supabase.auth.signOut().then(() => {
            if (window.location.pathname !== "/auth/login" && !window.location.pathname.startsWith("/auth")) {
              router.push("/auth/login")
            }
          })
        }
      }
    })

    return () => {
      subscription.unsubscribe()
      window.removeEventListener("error", handleError)
    }
  }, [router])

  return null
}

