"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { createClient as createAdminClient } from "@supabase/supabase-js"

export async function getAllShifts(startDate?: string, endDate?: string) {
  const supabase = await createClient()

  // Verify admin role
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

  if (profile?.role !== "admin") return []

  // First get all shifts
  let query = supabase
    .from("shifts")
    .select("*")
    .order("clock_in", { ascending: false })

  if (startDate) {
    query = query.gte("clock_in", startDate)
  }
  if (endDate) {
    query = query.lte("clock_in", endDate)
  }

  const { data: shifts, error } = await query

  if (error) {
    console.error("Error fetching all shifts:", error)
    return []
  }

  if (!shifts || shifts.length === 0) {
    return []
  }

  // Get all profiles to join with shifts
  const { data: profiles } = await supabase.from("profiles").select("id, name, role")

  // Join shifts with profiles
  const shiftsWithProfiles = shifts.map((shift) => {
    const profile = profiles?.find((p) => p.id === shift.user_id)
    return {
      ...shift,
      profiles: profile
        ? {
            id: profile.id,
            name: profile.name,
            role: profile.role,
          }
        : null,
    }
  })

  return shiftsWithProfiles
}

export async function getActiveShifts() {
  const supabase = await createClient()

  // Verify admin role
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

  if (profile?.role !== "admin") return []

  const { data: shifts, error } = await supabase
    .from("shifts")
    .select("*")
    .is("clock_out", null)
    .order("clock_in", { ascending: false })

  if (error) {
    console.error("Error fetching active shifts:", error)
    return []
  }

  if (!shifts || shifts.length === 0) {
    return []
  }

  // Get all profiles to join with shifts
  const { data: profiles } = await supabase.from("profiles").select("id, name, role")

  // Join shifts with profiles
  const shiftsWithProfiles = shifts.map((shift) => {
    const profile = profiles?.find((p) => p.id === shift.user_id)
    return {
      ...shift,
      profiles: profile
        ? {
            id: profile.id,
            name: profile.name,
            role: profile.role,
          }
        : null,
    }
  })

  return shiftsWithProfiles
}

export async function getAllProfiles() {
  const supabase = await createClient()

  // Verify admin role
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

  if (profile?.role !== "admin") return []

  const { data: profiles } = await supabase.from("profiles").select("*").order("name", { ascending: true })

  return profiles || []
}

export async function updateUserRole(userId: string, role: "worker" | "admin") {
  const supabase = await createClient()

  // Verify admin role
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { error: "Not authenticated", success: false }
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

  if (profile?.role !== "admin") {
    return { error: "Unauthorized", success: false }
  }

  // Prevent removing the last admin
  if (role === "worker") {
    const { data: adminCount } = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "admin")

    if (adminCount === 1 && profile.id === userId) {
      return { error: "Cannot remove the last admin", success: false }
    }
  }

  const { error } = await supabase.from("profiles").update({ role }).eq("id", userId)

  if (error) {
    return { error: error.message, success: false }
  }

  revalidatePath("/admin/employees")
  return { error: null, success: true }
}

export async function updateRestaurantLocation(lat: number, lng: number, radiusM: number) {
  const supabase = await createClient()

  // Verify admin role
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { error: "Not authenticated", success: false }
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

  if (profile?.role !== "admin") {
    return { error: "Unauthorized", success: false }
  }

  // Get existing restaurant or create new one
  const { data: existing } = await supabase.from("restaurant").select("id").limit(1).maybeSingle()

  if (existing) {
    const { error } = await supabase
      .from("restaurant")
      .update({
        lat: lat,
        lng: lng,
        radius_m: radiusM,
      })
      .eq("id", existing.id)

    if (error) {
      return { error: error.message, success: false }
    }
  } else {
    const { error } = await supabase.from("restaurant").insert({
      name: "Massawa Restaurant",
      lat: lat,
      lng: lng,
      radius_m: radiusM,
    })

    if (error) {
      return { error: error.message, success: false }
    }
  }

  revalidatePath("/admin/settings")
  return { error: null, success: true }
}

export async function clockOutEmployee(shiftId: string, clockOutTime?: string) {
  const supabase = await createClient()

  // Verify admin role
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { error: "Not authenticated", success: false }
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

  if (profile?.role !== "admin") {
    return { error: "Unauthorized", success: false }
  }

  // Get the shift
  const { data: shift, error: shiftError } = await supabase
    .from("shifts")
    .select("*")
    .eq("id", shiftId)
    .single()

  if (shiftError || !shift) {
    return { error: "Shift not found", success: false }
  }

  if (shift.clock_out) {
    return { error: "Shift already clocked out", success: false }
  }

  // Calculate duration
  const clockIn = new Date(shift.clock_in)
  const clockOut = clockOutTime ? new Date(clockOutTime) : new Date()
  const durationMinutes = Math.round((clockOut.getTime() - clockIn.getTime()) / 60000)

  // Update shift
  const { error: updateError } = await supabase
    .from("shifts")
    .update({
      clock_out: clockOut.toISOString(),
      duration_minutes: durationMinutes,
    })
    .eq("id", shiftId)

  if (updateError) {
    return { error: updateError.message, success: false }
  }

  revalidatePath("/admin")
  return { error: null, success: true }
}

export async function updateShift(shiftId: string, clockIn: string, clockOut: string | null) {
  const supabase = await createClient()

  // Verify admin role
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { error: "Not authenticated", success: false }
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

  if (profile?.role !== "admin") {
    return { error: "Unauthorized", success: false }
  }

  // Calculate duration if clock_out is provided
  let durationMinutes = null
  if (clockOut) {
    const start = new Date(clockIn)
    const end = new Date(clockOut)
    const diff = end.getTime() - start.getTime()
    durationMinutes = Math.floor(diff / (1000 * 60))
  }

  const { error } = await supabase
    .from("shifts")
    .update({
      clock_in: clockIn,
      clock_out: clockOut,
      duration_minutes: durationMinutes,
    })
    .eq("id", shiftId)

  if (error) {
    return { error: error.message, success: false }
  }

  revalidatePath("/admin")
  revalidatePath("/admin/shifts")
  return { error: null, success: true }
}

export async function deleteShift(shiftId: string) {
  const supabase = await createClient()

  // Verify admin role
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { error: "Not authenticated", success: false }
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

  if (profile?.role !== "admin") {
    return { error: "Unauthorized", success: false }
  }

  const { error } = await supabase.from("shifts").delete().eq("id", shiftId)

  if (error) {
    return { error: error.message, success: false }
  }

  revalidatePath("/admin")
  revalidatePath("/admin/shifts")
  return { error: null, success: true }
}

// Helper function to get admin Supabase client
async function getAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

  if (!serviceRoleKey || !supabaseUrl) {
    throw new Error("Service role key or Supabase URL not configured")
  }

  return createAdminClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

export async function deleteUser(userId: string) {
  // First verify admin role using regular client
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { error: "Not authenticated", success: false }
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

  if (profile?.role !== "admin") {
    return { error: "Unauthorized", success: false }
  }

  // Prevent deleting yourself
  if (user.id === userId) {
    return { error: "Cannot delete your own account", success: false }
  }

  // Prevent deleting the last admin
  const { data: targetProfile } = await supabase.from("profiles").select("role").eq("id", userId).single()
  if (targetProfile?.role === "admin") {
    const { data: adminCount } = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "admin")

    if (adminCount === 1) {
      return { error: "Cannot delete the last admin", success: false }
    }
  }

  try {
    // Use admin client to delete user
    const adminClient = await getAdminClient()
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId)

    if (deleteError) {
      return { error: deleteError.message, success: false }
    }

    // Profile will be deleted automatically via CASCADE, but we can also delete shifts
    const { error: shiftsError } = await supabase.from("shifts").delete().eq("user_id", userId)

    if (shiftsError) {
      console.error("Error deleting user shifts:", shiftsError)
      // Don't fail if shifts deletion fails, user is already deleted
    }

    revalidatePath("/admin/employees")
    return { error: null, success: true }
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to delete user", success: false }
  }
}

export async function banUser(userId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { error: "Not authenticated", success: false }
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

  if (profile?.role !== "admin") {
    return { error: "Unauthorized", success: false }
  }

  // Prevent banning yourself
  if (user.id === userId) {
    return { error: "Cannot ban your own account", success: false }
  }

  // Prevent banning the last admin
  const { data: targetProfile } = await supabase.from("profiles").select("role").eq("id", userId).single()
  if (targetProfile?.role === "admin") {
    const { data: adminCount } = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "admin")

    if (adminCount === 1) {
      return { error: "Cannot ban the last admin", success: false }
    }
  }

  try {
    // Use admin client to ban user
    const adminClient = await getAdminClient()
    const { error: banError } = await adminClient.auth.admin.updateUserById(userId, {
      ban_duration: "876000h", // ~100 years (effectively permanent)
    })

    if (banError) {
      return { error: banError.message, success: false }
    }

    // Also add banned flag to profile for easier querying
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ banned: true })
      .eq("id", userId)

    if (profileError) {
      console.error("Error updating profile banned status:", profileError)
      // Don't fail if profile update fails, user is already banned
    }

    revalidatePath("/admin/employees")
    return { error: null, success: true }
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to ban user", success: false }
  }
}

export async function unbanUser(userId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { error: "Not authenticated", success: false }
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

  if (profile?.role !== "admin") {
    return { error: "Unauthorized", success: false }
  }

  try {
    // Use admin client to unban user
    const adminClient = await getAdminClient()
    const { error: unbanError } = await adminClient.auth.admin.updateUserById(userId, {
      ban_duration: "0s", // Remove ban
    })

    if (unbanError) {
      return { error: unbanError.message, success: false }
    }

    // Remove banned flag from profile
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ banned: false })
      .eq("id", userId)

    if (profileError) {
      console.error("Error updating profile banned status:", profileError)
      // Don't fail if profile update fails, user is already unbanned
    }

    revalidatePath("/admin/employees")
    return { error: null, success: true }
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to unban user", success: false }
  }
}

export async function resetUserPassword(userId: string, newPassword: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { error: "Not authenticated", success: false }
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

  if (profile?.role !== "admin") {
    return { error: "Unauthorized", success: false }
  }

  if (newPassword.length < 6) {
    return { error: "Password must be at least 6 characters", success: false }
  }

  try {
    // Use admin client to reset password
    const adminClient = await getAdminClient()
    const { error: resetError } = await adminClient.auth.admin.updateUserById(userId, {
      password: newPassword,
    })

    if (resetError) {
      return { error: resetError.message, success: false }
    }

    revalidatePath("/admin/employees")
    return { error: null, success: true }
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to reset password", success: false }
  }
}

export async function updateUserName(userId: string, newName: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { error: "Not authenticated", success: false }
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

  if (profile?.role !== "admin") {
    return { error: "Unauthorized", success: false }
  }

  // Validate name
  if (!newName || newName.trim().length === 0) {
    return { error: "Naam is verplicht", success: false }
  }

  if (newName.length > 100) {
    return { error: "Naam is te lang (max 100 karakters)", success: false }
  }

  const trimmedName = newName.trim()

  // Update profile name
  const { error } = await supabase.from("profiles").update({ name: trimmedName }).eq("id", userId)

  if (error) {
    return { error: error.message, success: false }
  }

  // Also update user metadata in auth.users
  try {
    const adminClient = await getAdminClient()
    await adminClient.auth.admin.updateUserById(userId, {
      user_metadata: {
        name: trimmedName,
      },
    })
  } catch (error) {
    console.error("Error updating user metadata:", error)
    // Don't fail if metadata update fails, profile is already updated
  }

  revalidatePath("/admin/employees")
  return { error: null, success: true }
}
