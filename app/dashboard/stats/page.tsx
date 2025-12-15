import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { QuickStats } from "@/components/dashboard/quick-stats"
import { StatsChart } from "@/components/dashboard/stats-chart-lazy"
import { getShiftHistory } from "@/app/actions/shifts"
import { getOrCreateProfile } from "@/app/actions/profile"
import { Button } from "@/components/ui/button"
import { TrendingUp } from "lucide-react"
import Link from "next/link"

export default async function StatsPage() {
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
    const result = await getShiftHistory(200)
    shiftHistory = Array.isArray(result) ? result : []
  } catch (error) {
    console.error("Error fetching shift history:", error)
    shiftHistory = []
  }

  return (
    <DashboardLayout profile={profile}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Statistieken</h1>
          <p className="text-muted-foreground">Overzicht van je gewerkte uren en prestaties</p>
        </div>
        {shiftHistory.length > 0 ? (
          <>
            <QuickStats shifts={shiftHistory} />
            <StatsChart shifts={shiftHistory} />
          </>
        ) : (
          <div className="rounded-xl border border-border bg-card p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
              <TrendingUp className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Nog geen statistieken</h3>
            <p className="text-muted-foreground mb-4">Start met werken om je statistieken te zien</p>
            <Button asChild>
              <Link href="/dashboard">Ga naar Dashboard</Link>
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

