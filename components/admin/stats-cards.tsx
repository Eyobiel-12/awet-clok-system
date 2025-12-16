"use client"

import { useState, useEffect } from "react"
import { Users, Calendar, TrendingUp, Activity } from "lucide-react"
import type { Shift, Profile } from "@/lib/types"
import { cn } from "@/lib/utils"

interface StatsCardsProps {
  shifts: Shift[]
  profiles: Profile[]
}

export function StatsCards({ shifts, profiles }: StatsCardsProps) {
  const [mounted, setMounted] = useState(false)
  const [previousValues, setPreviousValues] = useState<Record<number, string>>({})

  useEffect(() => {
    setMounted(true)
  }, [])

  const now = new Date()

  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - now.getDay() + 1)
  startOfWeek.setHours(0, 0, 0, 0)

  const startOfDay = new Date(now)
  startOfDay.setHours(0, 0, 0, 0)

  const todayShifts = shifts.filter((s) => new Date(s.clock_in) >= startOfDay)
  const weekShifts = shifts.filter((s) => new Date(s.clock_in) >= startOfWeek)

  const todayMinutes = todayShifts.reduce((acc, s) => acc + (s.duration_minutes || 0), 0)
  const weekMinutes = weekShifts.reduce((acc, s) => acc + (s.duration_minutes || 0), 0)

  const activeShifts = shifts.filter((s) => !s.clock_out).length

  const formatHours = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    return hours.toString()
  }

  const formatMinutes = (minutes: number) => {
    return (minutes % 60).toString()
  }

  const stats = [
    {
      label: "Totaal Medewerkers",
      value: profiles.length.toString(),
      subValue: `${profiles.filter((p) => p.role === "admin").length} admin`,
      icon: Users,
      trend: null,
      color: "primary",
      hasPulse: false,
    },
    {
      label: "Actieve Shifts",
      value: activeShifts.toString(),
      subValue: "nu aan het werk",
      icon: Activity,
      trend: activeShifts > 0 ? "up" : null,
      color: "success",
      hasPulse: activeShifts > 0,
    },
    {
      label: "Uren Vandaag",
      value: formatHours(todayMinutes),
      subValue: `${formatMinutes(todayMinutes)}m • ${todayShifts.length} shifts`,
      icon: Calendar,
      trend: null,
      color: "chart-3",
      hasPulse: false,
    },
    {
      label: "Uren Deze Week",
      value: formatHours(weekMinutes),
      subValue: `${formatMinutes(weekMinutes)}m • ${weekShifts.length} shifts`,
      icon: TrendingUp,
      trend: "up",
      color: "chart-1",
      hasPulse: false,
    },
  ]

  // Track value changes for animation
  useEffect(() => {
    stats.forEach((stat, index) => {
      if (previousValues[index] !== stat.value) {
        setPreviousValues((prev) => ({ ...prev, [index]: stat.value }))
      }
    })
  }, [stats, previousValues])

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {stats.map((stat, index) => {
        const valueChanged = previousValues[index] !== stat.value && previousValues[index] !== undefined
        return (
          <div
            key={index}
            className={cn(
              "rounded-xl border border-border bg-card p-3 sm:p-4 md:p-6",
              "card-lift group touch-manipulation",
              "hover:border-primary/20 hover:shadow-lg",
              "transition-all duration-300",
              stat.hasPulse && "animate-pulse-glow"
            )}
          >
            <div className="flex items-start justify-between mb-3 sm:mb-4">
              <div
                className={cn(
                  "w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center",
                  "transition-all duration-300 flex-shrink-0",
                  "icon-rotate",
                  stat.color === "success"
                    ? "bg-success/10 group-hover:bg-success/20 group-hover:scale-110"
                    : "bg-primary/10 group-hover:bg-primary/20 group-hover:scale-110",
                )}
              >
                <stat.icon
                  className={cn(
                    "w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-300",
                    stat.color === "success" ? "text-success" : "text-primary"
                  )}
                />
              </div>
              {stat.trend && (
                <div className="flex items-center gap-1 text-xs font-medium text-success animate-pulse-slow">
                  <TrendingUp className="w-3 h-3" />
                </div>
              )}
            </div>
            <div className="space-y-0.5 sm:space-y-1">
              <p className="text-xs sm:text-sm font-medium text-muted-foreground line-clamp-2">{stat.label}</p>
              <p
                className={cn(
                  "text-xl sm:text-2xl md:text-3xl font-bold tabular-nums transition-all duration-300",
                  valueChanged && mounted && "animate-count-up"
                )}
              >
                {stat.value}
              </p>
              <p className="text-[10px] sm:text-xs text-muted-foreground line-clamp-2">{stat.subValue}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
