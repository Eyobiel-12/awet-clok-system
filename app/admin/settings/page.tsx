import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AdminLayout } from "@/components/admin/admin-layout"
import { SettingsCard } from "@/components/admin/settings-card"
import { getRestaurantLocation } from "@/app/actions/shifts"

export default async function AdminSettingsPage() {
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

  const restaurant = await getRestaurantLocation()

  return (
    <AdminLayout profile={profile}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Instellingen</h1>
          <p className="text-muted-foreground">Configureer restaurant locatie en geofence instellingen</p>
        </div>
        <SettingsCard restaurant={restaurant} />
      </div>
    </AdminLayout>
  )
}

