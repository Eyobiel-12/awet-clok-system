"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Clock, User, MapPin, Activity } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Shift, Profile } from "@/lib/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface ActiveShiftsProps {
  initialShifts: Shift[]
  profiles: Profile[]
}

export function ActiveShifts({ initialShifts, profiles }: ActiveShiftsProps) {
  const [activeShifts, setActiveShifts] = useState<Shift[]>(initialShifts)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const supabase = createClient()

    // Fetch profiles once for joining
    let allProfiles: Profile[] = [...profiles]

    // Function to fetch active shifts and join with profiles
    const fetchActiveShifts = async () => {
      // Fetch shifts
      const { data: shifts, error } = await supabase
        .from("shifts")
        .select("*")
        .is("clock_out", null)
        .order("clock_in", { ascending: false })

      if (error) {
        console.error("Error fetching active shifts:", error)
        return
      }

      // If profiles list is empty, fetch them
      if (allProfiles.length === 0) {
        const { data: fetchedProfiles } = await supabase.from("profiles").select("id, name, role")
        if (fetchedProfiles) {
          allProfiles = fetchedProfiles as Profile[]
        }
      }

      // Join shifts with profiles manually
      const shiftsWithProfiles = (shifts || []).map((shift) => {
        const profile = allProfiles.find((p) => p.id === shift.user_id)
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

      setActiveShifts(shiftsWithProfiles as Shift[])
    }

    // Initial fetch
    fetchActiveShifts()

    // Subscribe to real-time changes in shifts table
    const channel = supabase
      .channel("active-shifts")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "shifts",
        },
        async () => {
          setIsLoading(true)
          await fetchActiveShifts()
          setIsLoading(false)
        },
      )
      .subscribe()

    // Also poll for updates every 5 seconds as backup
    const interval = setInterval(fetchActiveShifts, 5000)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(interval)
    }
  }, [profiles])

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("nl-NL", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const calculateElapsed = (clockIn: string) => {
    const now = new Date()
    const start = new Date(clockIn)
    const diff = now.getTime() - start.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    return `${hours}u ${minutes}m`
  }

  const getEmployeeName = (shift: any) => {
    // Check if shift has nested profile data
    if (shift.profiles && shift.profiles.name) {
      return shift.profiles.name
    }
    // Fallback to profiles prop
    const profile = profiles.find((p) => p.id === shift.user_id)
    return profile?.name || "Onbekend"
  }

  if (activeShifts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Actieve Shifts
          </CardTitle>
          <CardDescription>Medewerkers die momenteel aan het werk zijn</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
              <Clock className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">Geen actieve shifts</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Actieve Shifts
          {isLoading && <span className="text-xs text-muted-foreground">(updating...)</span>}
        </CardTitle>
        <CardDescription>
          {activeShifts.length} medewerker{activeShifts.length !== 1 ? "s" : ""} aan het werk
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {activeShifts.map((shift) => (
            <div
              key={shift.id}
              className="flex items-center justify-between p-4 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-4 flex-1">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold">{getEmployeeName(shift)}</p>
                    <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                      Actief
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>Gestart: {formatTime(shift.clock_in)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span>{calculateElapsed(shift.clock_in)}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-primary tabular-nums">{calculateElapsed(shift.clock_in)}</p>
                <p className="text-xs text-muted-foreground">sinds start</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

