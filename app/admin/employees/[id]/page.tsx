import { redirect, notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AdminLayout } from "@/components/admin/admin-layout"
import { EmployeeInsights } from "@/components/admin/employee-insights"
import { getAllShifts, getAllProfiles } from "@/app/actions/admin"

export default async function EmployeeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle()

  if (!profile || profile.role !== "admin") {
    redirect("/dashboard")
  }

  const [shiftsResult, profilesResult] = await Promise.allSettled([getAllShifts(), getAllProfiles()])

  const shifts = shiftsResult.status === "fulfilled" ? shiftsResult.value : []
  const profiles = profilesResult.status === "fulfilled" ? profilesResult.value : []

  const employeeProfile = profiles.find((p) => p.id === id)
  if (!employeeProfile) {
    notFound()
  }

  const employeeShifts = shifts.filter((s) => s.user_id === id)

  return (
    <AdminLayout profile={profile}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Medewerker Inzicht: {employeeProfile.name}</h1>
          <p className="text-muted-foreground">Gedetailleerde statistieken en rapporten voor deze medewerker</p>
        </div>
        <EmployeeInsights profile={employeeProfile} shifts={employeeShifts} />
      </div>
    </AdminLayout>
  )
}

