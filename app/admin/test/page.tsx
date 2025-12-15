import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AdminLayout } from "@/components/admin/admin-layout"
import { getAllShifts, getAllProfiles, getActiveShifts } from "@/app/actions/admin"

export default async function AdminTestPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect("/auth/login")
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle()

  if (!profile || profile.role !== "admin") {
    redirect("/dashboard")
  }

  // Test direct query (without join first)
  const { data: directShifts, error: directError } = await supabase
    .from("shifts")
    .select("*")
    .order("clock_in", { ascending: false })
    .limit(10)

  // Get profiles and join manually
  let directShiftsWithProfiles = directShifts || []
  if (directShifts && directShifts.length > 0) {
    const { data: allProfilesForJoin } = await supabase.from("profiles").select("id, name, role")
    directShiftsWithProfiles = directShifts.map((shift: any) => {
      const profile = allProfilesForJoin?.find((p: any) => p.id === shift.user_id)
      return {
        ...shift,
        profiles: profile ? { id: profile.id, name: profile.name, role: profile.role } : null,
      }
    })
  }

  // Test raw query (same client, just different query)
  const { data: allShiftsRaw, error: allShiftsError } = await supabase
    .from("shifts")
    .select("*")
    .order("clock_in", { ascending: false })
    .limit(10)

  // Test profiles
  const { data: allProfiles, error: profilesError } = await supabase
    .from("profiles")
    .select("*")

  // Test is_admin function
  const { data: isAdminResult, error: isAdminError } = await supabase.rpc("is_admin")

  // Get shifts via action
  const actionShifts = await getAllShifts()
  const actionProfiles = await getAllProfiles()
  const actionActiveShifts = await getActiveShifts()

  return (
    <AdminLayout profile={profile}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Admin Test Page</h1>
          <p className="text-muted-foreground">Debugging data access issues</p>
        </div>

        {/* User Info */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-xl font-semibold mb-4">User Info</h2>
          <div className="space-y-2 font-mono text-sm">
            <p>User ID: {user.id}</p>
            <p>Email: {user.email}</p>
            <p>Profile Role: {profile.role}</p>
            <p>Profile Name: {profile.name}</p>
          </div>
        </div>

        {/* is_admin() Function Test */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-xl font-semibold mb-4">is_admin() Function Test</h2>
          {isAdminError ? (
            <div className="text-destructive">
              <p>Error: {JSON.stringify(isAdminError, null, 2)}</p>
            </div>
          ) : (
            <div className="space-y-2 font-mono text-sm">
              <p>is_admin() result: {isAdminResult ? "true" : "false"}</p>
            </div>
          )}
        </div>

        {/* Direct Query Test */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-xl font-semibold mb-4">Direct Query (with RLS)</h2>
          {directError ? (
            <div className="text-destructive">
              <p>Error: {JSON.stringify(directError, null, 2)}</p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="font-semibold">Shifts found: {directShiftsWithProfiles?.length || 0}</p>
              {directShiftsWithProfiles && directShiftsWithProfiles.length > 0 && (
                <div className="mt-4 space-y-2">
                  {directShiftsWithProfiles.map((shift: any) => (
                    <div key={shift.id} className="p-3 bg-muted rounded text-sm">
                      <p>ID: {shift.id}</p>
                      <p>User: {shift.profiles?.name || shift.user_id}</p>
                      <p>Clock In: {new Date(shift.clock_in).toLocaleString()}</p>
                      <p>Clock Out: {shift.clock_out ? new Date(shift.clock_out).toLocaleString() : "Active"}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* All Shifts (Raw) */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-xl font-semibold mb-4">All Shifts (Raw - should show all)</h2>
          {allShiftsError ? (
            <div className="text-destructive">
              <p>Error: {JSON.stringify(allShiftsError, null, 2)}</p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="font-semibold">Total shifts in DB: {allShiftsRaw?.length || 0}</p>
              {allShiftsRaw && allShiftsRaw.length > 0 && (
                <div className="mt-4 space-y-2">
                  {allShiftsRaw.map((shift: any) => (
                    <div key={shift.id} className="p-3 bg-muted rounded text-sm">
                      <p>ID: {shift.id}</p>
                      <p>User ID: {shift.user_id}</p>
                      <p>Clock In: {new Date(shift.clock_in).toLocaleString()}</p>
                      <p>Clock Out: {shift.clock_out ? new Date(shift.clock_out).toLocaleString() : "Active"}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Results */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-xl font-semibold mb-4">Action Results</h2>
          <div className="space-y-4">
            <div>
              <p className="font-semibold">getAllShifts(): {actionShifts.length} shifts</p>
            </div>
            <div>
              <p className="font-semibold">getAllProfiles(): {actionProfiles.length} profiles</p>
            </div>
            <div>
              <p className="font-semibold">getActiveShifts(): {actionActiveShifts.length} active</p>
            </div>
          </div>
        </div>

        {/* All Profiles */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-xl font-semibold mb-4">All Profiles</h2>
          {profilesError ? (
            <div className="text-destructive">
              <p>Error: {JSON.stringify(profilesError, null, 2)}</p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="font-semibold">Profiles found: {allProfiles?.length || 0}</p>
              {allProfiles && allProfiles.length > 0 && (
                <div className="mt-4 space-y-2">
                  {allProfiles.map((p: any) => (
                    <div key={p.id} className="p-3 bg-muted rounded text-sm">
                      <p>ID: {p.id}</p>
                      <p>Name: {p.name}</p>
                      <p>Role: {p.role}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}

