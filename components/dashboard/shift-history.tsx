"use client"

import { useState, useMemo, memo } from "react"
import { Clock, Calendar, TrendingUp, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Shift } from "@/lib/types"

interface ShiftHistoryProps {
  shifts: Shift[]
}

export const ShiftHistory = memo(function ShiftHistory({ shifts }: ShiftHistoryProps) {
  const [showAll, setShowAll] = useState(false)
  
  // Ensure shifts is an array
  const safeShifts = Array.isArray(shifts) ? shifts : []

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("nl-NL", {
      weekday: "short",
      day: "numeric",
      month: "short",
    })
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("nl-NL", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return "-"
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours === 0) return `${mins}m`
    return `${hours}u ${mins}m`
  }

  // Memoize weekly stats calculation
  const weeklyStats = useMemo(() => {
    const now = new Date()
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay() + 1)
    startOfWeek.setHours(0, 0, 0, 0)

    const weeklyShifts = safeShifts.filter((shift) => new Date(shift.clock_in) >= startOfWeek)
    const weeklyMinutes = weeklyShifts.reduce((acc, shift) => acc + (shift.duration_minutes || 0), 0)
    const weeklyHours = Math.floor(weeklyMinutes / 60)
    const weeklyMins = weeklyMinutes % 60

    return { weeklyHours, weeklyMins }
  }, [safeShifts])

  // Memoize today's hours
  const todayStats = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayMinutes = safeShifts
      .filter((shift) => new Date(shift.clock_in) >= today)
      .reduce((acc, shift) => acc + (shift.duration_minutes || 0), 0)
    const todayHours = Math.floor(todayMinutes / 60)
    const todayMins = todayMinutes % 60
    return { todayHours, todayMins }
  }, [safeShifts])

  // Memoize sorted shifts
  const displayedShifts = useMemo(() => {
    const sortedShifts = [...safeShifts].sort((a, b) => new Date(b.clock_in).getTime() - new Date(a.clock_in).getTime())
    return showAll ? sortedShifts : sortedShifts.slice(0, 5)
  }, [safeShifts, showAll])

  if (safeShifts.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-12 text-center">
        <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
          <Clock className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Nog geen shifts</h3>
        <p className="text-muted-foreground">Je hebt nog geen shifts geregistreerd. Klok in om te beginnen!</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <div className="rounded-xl border border-border bg-gradient-to-br from-card to-card/50 p-4 sm:p-5 hover:shadow-md active:scale-[0.98] transition-all duration-200 touch-manipulation group">
          <div className="flex items-center gap-2 text-muted-foreground mb-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 group-hover:bg-primary/20 flex items-center justify-center transition-colors">
              <Calendar className="w-4 h-4 text-primary" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wide">Vandaag</span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold tabular-nums">
            {todayStats.todayHours}u {todayStats.todayMins}m
          </p>
        </div>
        <div className="rounded-xl border border-border bg-gradient-to-br from-card to-card/50 p-4 sm:p-5 hover:shadow-md active:scale-[0.98] transition-all duration-200 touch-manipulation group">
          <div className="flex items-center gap-2 text-muted-foreground mb-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 group-hover:bg-primary/20 flex items-center justify-center transition-colors">
              <TrendingUp className="w-4 h-4 text-primary" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wide">Deze Week</span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold tabular-nums">
            {weeklyStats.weeklyHours}u {weeklyStats.weeklyMins}m
          </p>
        </div>
      </div>

      {/* Shift History List */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm w-full">
        <div className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 border-b border-border flex items-center justify-between bg-gradient-to-r from-card to-muted/20">
          <h3 className="font-semibold flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Clock className="w-4 h-4 text-primary" />
            </div>
            Recente Shifts
          </h3>
          <span className="text-xs font-medium text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-full">
            {safeShifts.length} totaal
          </span>
        </div>

        <div className="divide-y divide-border">
          {displayedShifts.map((shift, index) => (
                <div
                  key={shift.id}
                  className={cn(
                    "flex items-center justify-between p-4 sm:p-5 hover:bg-muted/50 active:bg-muted/70 transition-all duration-200 border-l-2",
                    index === 0 ? "bg-primary/5 border-l-primary" : "border-l-transparent",
                  )}
                >
                  <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-all",
                        index === 0 ? "bg-primary/10 shadow-sm shadow-primary/20" : "bg-muted",
                      )}
                    >
                      <Clock className={cn("w-5 h-5", index === 0 ? "text-primary" : "text-muted-foreground")} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm sm:text-base truncate">{formatDate(shift.clock_in)}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
                        <Clock className="w-3 h-3" />
                        {formatTime(shift.clock_in)} - {shift.clock_out ? formatTime(shift.clock_out) : "Actief"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p
                      className={cn(
                        "font-bold tabular-nums text-base sm:text-lg",
                        index === 0 ? "text-primary" : "text-foreground",
                      )}
                    >
                      {formatDuration(shift.duration_minutes)}
                    </p>
                  </div>
            </div>
          ))}
        </div>

            {safeShifts.length > 5 && (
              <button
                onClick={() => setShowAll(!showAll)}
                className="w-full p-4 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 active:bg-muted/70 transition-all flex items-center justify-center gap-2 border-t border-border"
              >
                {showAll ? "Toon minder" : `Toon alle ${safeShifts.length} shifts`}
                <ChevronRight
                  className={cn("w-4 h-4 transition-transform duration-200", showAll && "rotate-90")}
                />
              </button>
            )}
      </div>
    </div>
  )
})
