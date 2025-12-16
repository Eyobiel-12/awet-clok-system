import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AdminLayout } from "@/components/admin/admin-layout"
import { EmployeesTable } from "@/components/admin/employees-table"
import { getAllShifts, getAllProfiles } from "@/app/actions/admin"

export default async function AdminEmployeesPage() {
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

  const [shifts, profiles] = await Promise.all([getAllShifts(), getAllProfiles()])

  return (
    <AdminLayout profile={profile}>
      <div className="space-y-4 sm:space-y-6 w-full max-w-full">
        <div className="px-1">
          <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Medewerkers
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">Beheer medewerkers en hun rollen</p>
        </div>
        <EmployeesTable profiles={profiles} shifts={shifts} />
      </div>
    </AdminLayout>
  )
}

