import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AdminLayout } from "@/components/admin/admin-layout"
import { StatsCards } from "@/components/admin/stats-cards"
import { ActiveShifts } from "@/components/admin/active-shifts"
import { ShiftsTable } from "@/components/admin/shifts-table"
import { EmployeesTable } from "@/components/admin/employees-table"
import { SettingsCard } from "@/components/admin/settings-card"
import { getAllShifts, getAllProfiles, getActiveShifts } from "@/app/actions/admin"
import { getRestaurantLocation } from "@/app/actions/shifts"

export default async function AdminPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle()

  if (profileError) {
    console.error("Profile error in admin page:", profileError)
  }

  if (!profile) {
    console.error("No profile found for user:", user.id)
    redirect("/dashboard")
  }

  if (profile.role !== "admin") {
    console.error("User is not admin. Role:", profile.role)
    redirect("/dashboard")
  }

  const [shiftsResult, profilesResult, restaurantResult, activeShiftsResult] = await Promise.allSettled([
    getAllShifts(),
    getAllProfiles(),
    getRestaurantLocation(),
    getActiveShifts(),
  ])

  const shifts = shiftsResult.status === "fulfilled" ? shiftsResult.value : []
  const profiles = profilesResult.status === "fulfilled" ? profilesResult.value : []
  const restaurant = restaurantResult.status === "fulfilled" ? restaurantResult.value : null
  const activeShifts = activeShiftsResult.status === "fulfilled" ? activeShiftsResult.value : []

  // Log for debugging
  if (shiftsResult.status === "rejected") {
    console.error("Error fetching shifts:", shiftsResult.reason)
  }
  if (profilesResult.status === "rejected") {
    console.error("Error fetching profiles:", profilesResult.reason)
  }

  return (
    <AdminLayout profile={profile}>
      <div className="space-y-4 sm:space-y-6 w-full max-w-full">
        {/* Page Header */}
        <div className="px-1">
          <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Admin Dashboard
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">Beheer medewerkers, shifts en instellingen</p>
        </div>

        {/* Stats Overview */}
        <StatsCards shifts={shifts} profiles={profiles} />

        {/* Active Shifts - Real-time */}
        <ActiveShifts initialShifts={activeShifts} profiles={profiles} />

        {/* Quick Access */}
        <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
          <div>
            <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Recente Shifts</h2>
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <ShiftsTable shifts={shifts.slice(0, 10)} />
            </div>
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Medewerkers Overzicht</h2>
            <EmployeesTable profiles={profiles} shifts={shifts} />
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
