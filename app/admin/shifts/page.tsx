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
      <div className="space-y-4 sm:space-y-6 w-full max-w-full">
        <div className="px-1">
          <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Alle Shifts
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">Beheer en bekijk alle shifts van medewerkers</p>
        </div>
        <ShiftsTable shifts={shifts} />
      </div>
    </AdminLayout>
  )
}

