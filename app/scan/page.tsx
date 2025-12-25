import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { QRScanner } from "@/components/qr-scanner"

export default async function ScanPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  // Check for active shift
  const { data: activeShift } = await supabase
    .from("shifts")
    .select("*")
    .eq("user_id", user.id)
    .is("end_time", null)
    .order("start_time", { ascending: false })
    .limit(1)
    .single()

  return (
    <div className="min-h-screen bg-background">
      <QRScanner 
        userId={user.id} 
        profile={profile}
        hasActiveShift={!!activeShift}
      />
    </div>
  )
}

