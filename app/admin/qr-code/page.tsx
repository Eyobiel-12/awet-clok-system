import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { QRCodeDisplay } from "@/components/admin/qr-code-display"

export default async function QRCodePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (!profile || profile.role?.toLowerCase() !== "admin") {
    redirect("/dashboard")
  }

  // Get restaurant info
  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("*")
    .single()

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <QRCodeDisplay restaurant={restaurant} />
      </div>
    </div>
  )
}

