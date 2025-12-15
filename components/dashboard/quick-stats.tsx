"use client"

import type React from "react"
import { useMemo, memo } from "react"

import { Clock, Calendar, TrendingUp, Award } from "lucide-react"
import type { Shift } from "@/lib/types"

interface QuickStatsProps {
  shifts: Shift[]
}

export const QuickStats = memo(function QuickStats({ shifts }: QuickStatsProps) {
  // Ensure shifts is an array
  const safeShifts = Array.isArray(shifts) ? shifts : []
  
  // Memoize expensive calculations
  const stats = useMemo(() => {
    const now = new Date()

    // This month
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthlyMinutes = safeShifts
      .filter((shift) => new Date(shift.clock_in) >= startOfMonth)
      .reduce((acc, shift) => acc + (shift.duration_minutes || 0), 0)
    const monthlyHours = Math.floor(monthlyMinutes / 60)

    // Total shifts this month
    const monthlyShifts = safeShifts.filter((shift) => new Date(shift.clock_in) >= startOfMonth).length

    // Average shift duration
    const completedShifts = safeShifts.filter((s) => s.duration_minutes)
    const avgMinutes =
      completedShifts.length > 0
        ? Math.round(completedShifts.reduce((acc, s) => acc + (s.duration_minutes || 0), 0) / completedShifts.length)
        : 0
    const avgHours = Math.floor(avgMinutes / 60)
    const avgMins = avgMinutes % 60

    // Longest shift
    const longestShift = safeShifts.length > 0 
      ? Math.max(...safeShifts.map((s) => s.duration_minutes || 0), 0)
      : 0
    const longestHours = Math.floor(longestShift / 60)
    const longestMins = longestShift % 60

    return {
      monthlyHours,
      monthlyMinutes,
      monthlyShifts,
      avgHours,
      avgMins,
      longestHours,
      longestMins,
    }
  }, [safeShifts])

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 w-full">
      <StatCard icon={Clock} label="Uren deze maand" value={`${stats.monthlyHours}u`} subValue={`${stats.monthlyMinutes % 60}m`} />
      <StatCard icon={Calendar} label="Shifts deze maand" value={stats.monthlyShifts.toString()} subValue="shifts" />
      <StatCard icon={TrendingUp} label="Gem. shift duur" value={`${stats.avgHours}u`} subValue={`${stats.avgMins}m`} />
      <StatCard icon={Award} label="Langste shift" value={`${stats.longestHours}u`} subValue={`${stats.longestMins}m`} />
    </div>
  )
})

const StatCard = memo(function StatCard({
  icon: Icon,
  label,
  value,
  subValue,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  subValue: string
}) {
  return (
    <div className="rounded-xl border border-border bg-gradient-to-br from-card to-card/50 p-4 sm:p-5 hover:bg-card hover:border-border/80 hover:shadow-md active:scale-[0.98] transition-all duration-200 touch-manipulation group">
      <div className="flex items-center gap-2 text-muted-foreground mb-3">
        <div className="w-8 h-8 rounded-lg bg-primary/10 group-hover:bg-primary/20 flex items-center justify-center transition-colors">
          <Icon className="w-4 h-4 text-primary" />
        </div>
        <span className="text-xs font-semibold uppercase tracking-wide truncate">{label}</span>
      </div>
      <p className="text-2xl sm:text-3xl font-bold tabular-nums mb-1">
        {value}
        <span className="text-base font-normal text-muted-foreground ml-1.5">{subValue}</span>
      </p>
    </div>
  )
})
