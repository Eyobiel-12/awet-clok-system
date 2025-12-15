"use client"

import { useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Clock } from "lucide-react"

export default function LogoutPage() {
  const router = useRouter()

  useEffect(() => {
    const clearSession = async () => {
      const supabase = createClient()
      
      // Sign out from Supabase (clears all session data)
      await supabase.auth.signOut()
      
      // Clear any local storage
      if (typeof window !== "undefined") {
        localStorage.clear()
        sessionStorage.clear()
      }
      
      // Redirect to login after a short delay
      setTimeout(() => {
        router.push("/auth/login")
      }, 500)
    }

    clearSession()
  }, [router])

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6 bg-background">
      <div className="text-center">
        <div className="w-16 h-16 bg-primary/10 rounded-full mx-auto mb-4 flex items-center justify-center">
          <Clock className="w-8 h-8 text-primary animate-spin" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Uitloggen...</h2>
        <p className="text-muted-foreground">Sessie wordt gewist</p>
      </div>
    </div>
  )
}

