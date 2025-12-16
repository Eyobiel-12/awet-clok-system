import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
    },
  )

  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    // Handle refresh token errors
    if (authError) {
      const errorMessage = authError.message || ""
      if (
        errorMessage.includes("Refresh Token") ||
        errorMessage.includes("refresh_token") ||
        errorMessage.includes("JWT") ||
        authError.status === 401
      ) {
        // Clear auth cookies and redirect to login
        const url = request.nextUrl.clone()
        url.pathname = "/auth/login"
        const response = NextResponse.redirect(url)
        
        // Clear all Supabase auth cookies
        const cookieNames = request.cookies.getAll().map((c) => c.name)
        cookieNames.forEach((cookieName) => {
          if (
            cookieName.includes("auth") ||
            cookieName.includes("supabase") ||
            cookieName.includes("sb-")
          ) {
            response.cookies.delete(cookieName)
          }
        })
        
        return response
      }
    }

    // Redirect unauthenticated users to login
    if (!user && !request.nextUrl.pathname.startsWith("/auth") && request.nextUrl.pathname !== "/") {
      const url = request.nextUrl.clone()
      url.pathname = "/auth/login"
      return NextResponse.redirect(url)
    }

    // Redirect authenticated users from auth pages based on role
    if (user && request.nextUrl.pathname.startsWith("/auth")) {
      const url = request.nextUrl.clone()
      // Check user role
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single()
      
      if (profile?.role === "admin") {
        url.pathname = "/admin"
      } else {
        url.pathname = "/dashboard"
      }
      return NextResponse.redirect(url)
    }

    return supabaseResponse
  } catch (error) {
    // Catch any unexpected errors and redirect to login
    const url = request.nextUrl.clone()
    url.pathname = "/auth/login"
    const response = NextResponse.redirect(url)
    
    // Clear auth cookies on error
    const cookieNames = request.cookies.getAll().map((c) => c.name)
    cookieNames.forEach((cookieName) => {
      if (
        cookieName.includes("auth") ||
        cookieName.includes("supabase") ||
        cookieName.includes("sb-")
      ) {
        response.cookies.delete(cookieName)
      }
    })
    
    return response
  }
}
