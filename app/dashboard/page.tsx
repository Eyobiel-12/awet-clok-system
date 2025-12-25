import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { ClockButton } from "@/components/dashboard/clock-button"
import { QRScanButton } from "@/components/dashboard/qr-scan-button"
import { ShiftHistory } from "@/components/dashboard/shift-history"
import { QuickStats } from "@/components/dashboard/quick-stats"
import { getActiveShift, getShiftHistory, getRestaurantLocation } from "@/app/actions/shifts"
import { getOrCreateProfile } from "@/app/actions/profile"
import { Calendar, User } from "lucide-react"

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  // Get or create profile using server action
  const { profile, error: profileError } = await getOrCreateProfile()

  if (!profile || profileError) {
    console.error("Profile error:", profileError)
    redirect("/auth/login")
  }

  // Use Promise.all for parallel fetching (faster than allSettled)
  const [activeShiftResult, shiftHistoryResult, restaurantResult] = await Promise.all([
    getActiveShift().catch(() => null),
    getShiftHistory(50).catch(() => []),
    getRestaurantLocation().catch(() => null),
  ])

  const activeShift = activeShiftResult
  const shiftHistory = Array.isArray(shiftHistoryResult) ? shiftHistoryResult : []
  const restaurant = restaurantResult

  return (
    <DashboardLayout profile={profile}>
      <div className="space-y-4 sm:space-y-6 animate-fade-in w-full max-w-full">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-card via-card to-muted/20 rounded-xl border border-border p-3 sm:p-4 md:p-6 shadow-sm w-full overflow-hidden">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Welkom terug, {profile.name?.split(" ")[0]}
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground flex items-center gap-2">
                <Calendar className="w-4 h-4 flex-shrink-0" />
                {new Date().toLocaleDateString("nl-NL", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center flex-shrink-0 border-2 border-primary/10">
              <User className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-primary" />
            </div>
          </div>
        </div>

        {/* Clock In/Out Card */}
        <ClockButton activeShift={activeShift} restaurant={restaurant} />

        {/* QR Scan Card */}
        <QRScanButton hasActiveShift={!!activeShift} />

        {/* Quick Stats */}
        <QuickStats shifts={shiftHistory} />

        {/* Shift History */}
        <ShiftHistory shifts={shiftHistory} />
      </div>
    </DashboardLayout>
  )
}
