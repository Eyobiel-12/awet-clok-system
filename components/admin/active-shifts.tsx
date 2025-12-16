"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Clock, User, MapPin, Activity, LogOut, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Shift, Profile } from "@/lib/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { clockOutEmployee } from "@/app/actions/admin"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

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

  const getShiftDuration = (clockIn: string) => {
    const now = new Date()
    const start = new Date(clockIn)
    const diff = now.getTime() - start.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    return hours
  }

  const isLongShift = (clockIn: string) => {
    return getShiftDuration(clockIn) >= 12 // 12 hours or more
  }

  const handleClockOut = async (shiftId: string, employeeName: string) => {
    setIsLoading(true)
    const result = await clockOutEmployee(shiftId)
    
    if (result.error) {
      toast.error(`Kon ${employeeName} niet uitklokken: ${result.error}`)
    } else {
      toast.success(`${employeeName} is uitgelogd`)
      // Remove from active shifts
      setActiveShifts((prev) => prev.filter((s) => s.id !== shiftId))
    }
    setIsLoading(false)
  }

  if (activeShifts.length === 0) {
    return (
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-3 sm:pb-4">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            Actieve Shifts
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">Medewerkers die momenteel aan het werk zijn</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-center py-6 sm:py-8">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-muted mx-auto mb-3 sm:mb-4 flex items-center justify-center">
              <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-muted-foreground" />
            </div>
            <p className="text-sm sm:text-base text-muted-foreground">Geen actieve shifts</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="pb-3 sm:pb-4">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
          Actieve Shifts
          {isLoading && <span className="text-xs text-muted-foreground">(updating...)</span>}
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          {activeShifts.length} medewerker{activeShifts.length !== 1 ? "s" : ""} aan het werk
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {activeShifts.map((shift) => (
            <div
              key={shift.id}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg border border-border bg-card hover:bg-muted/50 hover:shadow-md hover:border-primary/20 transition-all duration-300 card-lift"
            >
              <div className="flex items-start sm:items-center gap-3 sm:gap-4 flex-1 min-w-0">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 animate-pulse-glow">
                  <User className="w-5 h-5 sm:w-6 sm:h-6 text-primary transition-transform duration-300 group-hover:scale-110" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1 sm:mb-0">
                    <p className="font-semibold text-sm sm:text-base truncate">{getEmployeeName(shift)}</p>
                    <Badge variant="outline" className="bg-success/10 text-success border-success/20 text-xs w-fit animate-pulse-slow">
                      Actief
                    </Badge>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground mt-1 sm:mt-0">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span>Gestart: {formatTime(shift.clock_in)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span>{calculateElapsed(shift.clock_in)}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-border">
                <div className="text-left sm:text-right">
                  <p className="text-xl sm:text-2xl font-bold text-primary tabular-nums">{calculateElapsed(shift.clock_in)}</p>
                  <p className="text-xs text-muted-foreground">sinds start</p>
                  {isLongShift(shift.clock_in) && (
                    <div className="flex items-center gap-1 mt-1 text-warning text-xs">
                      <AlertTriangle className="w-3 h-3" />
                      <span>Lang shift!</span>
                    </div>
                  )}
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2 h-9 sm:h-10 text-xs sm:text-sm">
                      <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline">Uitklokken</span>
                      <span className="sm:hidden">Uit</span>
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="max-w-[95vw] sm:max-w-md">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-lg sm:text-xl">Medewerker uitklokken?</AlertDialogTitle>
                      <AlertDialogDescription className="text-sm">
                        Weet je zeker dat je {getEmployeeName(shift)} wilt uitklokken? 
                        Deze actie kan niet ongedaan worden gemaakt.
                        <br />
                        <br />
                        <strong>Shift duur:</strong> {calculateElapsed(shift.clock_in)}
                        <br />
                        <strong>Gestart om:</strong> {formatTime(shift.clock_in)}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
                      <AlertDialogCancel className="w-full sm:w-auto h-11">Annuleren</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleClockOut(shift.id, getEmployeeName(shift))}
                        className="w-full sm:w-auto h-11 bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Uitklokken
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

