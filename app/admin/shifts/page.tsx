import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AdminLayout } from "@/components/admin/admin-layout"
import { ShiftsTable } from "@/components/admin/shifts-table"
import { getAllShifts } from "@/app/actions/admin"

export default async function AdminShiftsPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (!profile || profile.role !== "admin") {
    redirect("/dashboard")
  }

  const shifts = await getAllShifts()

  return (
    <AdminLayout profile={profile}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Alle Shifts</h1>
          <p className="text-muted-foreground">Beheer en bekijk alle shifts van medewerkers</p>
        </div>
        <ShiftsTable shifts={shifts} />
      </div>
    </AdminLayout>
  )
}

