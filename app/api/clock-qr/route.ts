import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { userId, qrData, hasActiveShift } = await request.json()

    // Validate required fields
    if (!userId || !qrData) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Validate QR code type
    if (qrData.type !== "massawa-clock") {
      return NextResponse.json(
        { success: false, error: "Invalid QR code type" },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Verify user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user || user.id !== userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("full_name, role")
      .eq("id", userId)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { success: false, error: "User profile not found" },
        { status: 404 }
      )
    }

    const now = new Date().toISOString()

    if (hasActiveShift) {
      // Clock Out
      const { data: activeShift, error: shiftError } = await supabase
        .from("shifts")
        .select("*")
        .eq("user_id", userId)
        .is("end_time", null)
        .order("start_time", { ascending: false })
        .limit(1)
        .single()

      if (shiftError || !activeShift) {
        return NextResponse.json(
          { success: false, error: "No active shift found" },
          { status: 404 }
        )
      }

      // Update shift with end time
      const { error: updateError } = await supabase
        .from("shifts")
        .update({ end_time: now })
        .eq("id", activeShift.id)

      if (updateError) {
        console.error("Error clocking out:", updateError)
        return NextResponse.json(
          { success: false, error: "Failed to clock out" },
          { status: 500 }
        )
      }

      // Calculate duration
      const startTime = new Date(activeShift.start_time)
      const endTime = new Date(now)
      const durationMs = endTime.getTime() - startTime.getTime()
      const hours = Math.floor(durationMs / (1000 * 60 * 60))
      const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60))

      return NextResponse.json({
        success: true,
        action: "clock_out",
        message: `✅ Clocked out successfully! You worked ${hours}h ${minutes}m today.`,
        shift: {
          id: activeShift.id,
          start_time: activeShift.start_time,
          end_time: now,
          duration: { hours, minutes },
        },
      })
    } else {
      // Clock In
      // Check if there's already an active shift (double check)
      const { data: existingShift } = await supabase
        .from("shifts")
        .select("*")
        .eq("user_id", userId)
        .is("end_time", null)
        .single()

      if (existingShift) {
        return NextResponse.json(
          { success: false, error: "You already have an active shift. Please clock out first." },
          { status: 400 }
        )
      }

      // Create new shift
      const { data: newShift, error: insertError } = await supabase
        .from("shifts")
        .insert({
          user_id: userId,
          start_time: now,
          end_time: null,
        })
        .select()
        .single()

      if (insertError || !newShift) {
        console.error("Error clocking in:", insertError)
        return NextResponse.json(
          { success: false, error: "Failed to clock in" },
          { status: 500 }
        )
      }

      const startTime = new Date(now).toLocaleTimeString("nl-NL", {
        hour: "2-digit",
        minute: "2-digit",
      })

      return NextResponse.json({
        success: true,
        action: "clock_in",
        message: `✅ Clocked in successfully at ${startTime}! Have a great shift!`,
        shift: {
          id: newShift.id,
          start_time: newShift.start_time,
        },
      })
    }
  } catch (error) {
    console.error("Error in clock-qr API:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}

