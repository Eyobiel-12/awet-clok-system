import { updateSession } from "@/lib/supabase/proxy"
import { NextResponse, type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  try {
    return await updateSession(request)
  } catch (error) {
    // If there's a refresh token error, clear session and redirect to login
    if (error instanceof Error && error.message.includes("Refresh Token")) {
      const url = request.nextUrl.clone()
      url.pathname = "/auth/login"
      const response = NextResponse.redirect(url)
      
      // Clear all auth cookies
      const authCookies = [
        "sb-access-token",
        "sb-refresh-token",
        "supabase-auth-token",
      ]
      
      authCookies.forEach((cookieName) => {
        response.cookies.delete(cookieName)
        // Also try with the project ref prefix
        response.cookies.delete(`${request.nextUrl.hostname}-${cookieName}`)
      })
      
      return response
    }
    
    // For other errors, continue normally
    return NextResponse.next()
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}

