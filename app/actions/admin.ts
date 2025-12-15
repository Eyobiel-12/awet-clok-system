"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

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
        latitude: lat,
        longitude: lng,
        radius_meters: radiusM,
      })
      .eq("id", existing.id)

    if (error) {
      return { error: error.message, success: false }
    }
  } else {
    const { error } = await supabase.from("restaurant").insert({
      latitude: lat,
      longitude: lng,
      radius_meters: radiusM,
    })

    if (error) {
      return { error: error.message, success: false }
    }
  }

  revalidatePath("/admin/settings")
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
