import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AdminLayout } from "@/components/admin/admin-layout"
import { ReportsPanel } from "@/components/admin/reports-panel"
import { getAllShifts, getAllProfiles } from "@/app/actions/admin"

export default async function AdminReportsPage() {
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

  return (
    <AdminLayout profile={profile}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Rapporten & Analytics</h1>
          <p className="text-muted-foreground">Gedetailleerde rapporten en statistieken</p>
        </div>
        <ReportsPanel shifts={shifts} profiles={profiles} />
      </div>
    </AdminLayout>
  )
}

