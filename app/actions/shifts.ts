"use server"

import { createClient } from "@/lib/supabase/server"
import { isWithinRadius } from "@/lib/geolocation"
import { revalidatePath } from "next/cache"

export async function clockIn(lat: number, lng: number) {
  const supabase = await createClient()

  // Get authenticated user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) {
    return { error: "Je moet ingelogd zijn" }
  }

  // Get restaurant location
  const { data: restaurant, error: restaurantError } = await supabase.from("restaurant").select("*").maybeSingle()

  if (restaurantError || !restaurant) {
    return { error: "Restaurant locatie niet gevonden" }
  }

  // Validate geofence server-side
  const withinRadius = isWithinRadius(lat, lng, restaurant.lat, restaurant.lng, restaurant.radius_m)

  if (!withinRadius) {
    return { error: "Je moet bij het restaurant zijn om in te klokken" }
  }

  // Check for existing active shift
  const { data: activeShift } = await supabase
    .from("shifts")
    .select("id")
    .eq("user_id", user.id)
    .is("clock_out", null)
    .single()

  if (activeShift) {
    return { error: "Je hebt al een actieve shift" }
  }

  // Insert new shift with server timestamp
  const { data: newShift, error: shiftError } = await supabase
    .from("shifts")
    .insert({
      user_id: user.id,
      lat,
      lng,
    })
    .select()
    .single()

  if (shiftError) {
    return { error: "Kon niet inklokken: " + shiftError.message }
  }

  revalidatePath("/dashboard")
  return { success: true, shift: newShift }
}

export async function clockOut() {
  const supabase = await createClient()

  // Get authenticated user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) {
    return { error: "Je moet ingelogd zijn" }
  }

  // Find active shift
  const { data: activeShift, error: findError } = await supabase
    .from("shifts")
    .select("*")
    .eq("user_id", user.id)
    .is("clock_out", null)
    .single()

  if (findError || !activeShift) {
    return { error: "Geen actieve shift gevonden" }
  }

  // Calculate duration
  const clockIn = new Date(activeShift.clock_in)
  const clockOut = new Date()
  const durationMinutes = Math.round((clockOut.getTime() - clockIn.getTime()) / 60000)

  // Update shift with clock_out and duration
  const { data: updatedShift, error: updateError } = await supabase
    .from("shifts")
    .update({
      clock_out: clockOut.toISOString(),
      duration_minutes: durationMinutes,
    })
    .eq("id", activeShift.id)
    .select()
    .single()

  if (updateError) {
    return { error: "Kon niet uitklokken: " + updateError.message }
  }

  revalidatePath("/dashboard")
  return { success: true, shift: updatedShift }
}

export async function getActiveShift() {
  const supabase = await createClient()

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return null

    const { data: shift, error } = await supabase
      .from("shifts")
      .select("*")
      .eq("user_id", user.id)
      .is("clock_out", null)
      .maybeSingle()

    if (error && error.code !== "PGRST116") {
      // PGRST116 means no rows found, which is fine
      console.error("Error fetching active shift:", error)
      return null
    }

    return shift || null
  } catch (error) {
    console.error("Error in getActiveShift:", error)
    return null
  }
}

export async function getShiftHistory(limit = 10) {
  const supabase = await createClient()

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return []

    const { data: shifts, error } = await supabase
      .from("shifts")
      .select("*")
      .eq("user_id", user.id)
      .not("clock_out", "is", null)
      .order("clock_in", { ascending: false })
      .limit(limit)

    if (error) {
      console.error("Error fetching shift history:", error)
      return []
    }

    return shifts || []
  } catch (error) {
    console.error("Error in getShiftHistory:", error)
    return []
  }
}

export async function getRestaurantLocation() {
  const supabase = await createClient()

  // Get the first restaurant (there should only be one)
  const { data: restaurants, error } = await supabase.from("restaurant").select("*").limit(1)
  
  const restaurant = restaurants && restaurants.length > 0 ? restaurants[0] : null

  if (error) {
    console.error("Error fetching restaurant location:", JSON.stringify(error, null, 2))
    return null
  }

  // If no restaurant exists, return null (will be handled gracefully by UI)
  if (!restaurant) {
    console.warn("No restaurant location found in database")
    return null
  }

  return restaurant
}
