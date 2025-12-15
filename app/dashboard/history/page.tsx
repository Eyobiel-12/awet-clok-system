import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { ShiftHistory } from "@/components/dashboard/shift-history"
import { getShiftHistory } from "@/app/actions/shifts"
import { getOrCreateProfile } from "@/app/actions/profile"

export default async function HistoryPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  const { profile, error: profileError } = await getOrCreateProfile()

  if (!profile || profileError) {
    redirect("/auth/login")
  }

  let shiftHistory: any[] = []
  try {
    const result = await getShiftHistory(100)
    shiftHistory = Array.isArray(result) ? result : []
  } catch (error) {
    console.error("Error fetching shift history:", error)
    shiftHistory = []
  }

  return (
    <DashboardLayout profile={profile}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Shift Geschiedenis</h1>
          <p className="text-muted-foreground">Bekijk al je vorige shifts en gewerkte uren</p>
        </div>
        <ShiftHistory shifts={shiftHistory} />
      </div>
    </DashboardLayout>
  )
}

