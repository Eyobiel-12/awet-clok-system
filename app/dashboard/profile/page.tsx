import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { ProfileForm } from "@/components/dashboard/profile-form"
import { getOrCreateProfile } from "@/app/actions/profile"

export default async function ProfilePage() {
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

  return (
    <DashboardLayout profile={profile}>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Mijn Profiel</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Beheer je persoonlijke informatie en profielfoto
          </p>
        </div>

        <ProfileForm profile={profile} />
      </div>
    </DashboardLayout>
  )
}



