"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts"
import type { Shift } from "@/lib/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface StatsChartProps {
  shifts: Shift[]
}

export function StatsChart({ shifts }: StatsChartProps) {
  if (!shifts || shifts.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-12 text-center">
        <p className="text-muted-foreground">Nog geen data beschikbaar voor grafieken</p>
      </div>
    )
  }

  // Group shifts by week
  const weeklyData = shifts.reduce((acc, shift) => {
    const date = new Date(shift.clock_in)
    const weekStart = new Date(date)
    weekStart.setDate(date.getDate() - date.getDay() + 1)
    weekStart.setHours(0, 0, 0, 0)
    
    const weekKey = weekStart.toISOString().split("T")[0]
    const hours = (shift.duration_minutes || 0) / 60
    
    if (!acc[weekKey]) {
      acc[weekKey] = { week: weekKey, hours: 0, shifts: 0 }
    }
    acc[weekKey].hours += hours
    acc[weekKey].shifts += 1
    
    return acc
  }, {} as Record<string, { week: string; hours: number; shifts: number }>)

  const weeklyChartData = Object.values(weeklyData)
    .sort((a, b) => a.week.localeCompare(b.week))
    .slice(-8)
    .map((item) => ({
      week: new Date(item.week).toLocaleDateString("nl-NL", { month: "short", day: "numeric" }),
      hours: Math.round(item.hours * 10) / 10,
      shifts: item.shifts,
    }))

  // Daily data for last 7 days
  const dailyData = Array.from({ length: 7 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (6 - i))
    date.setHours(0, 0, 0, 0)
    
    const dayShifts = shifts.filter((shift) => {
      const shiftDate = new Date(shift.clock_in)
      shiftDate.setHours(0, 0, 0, 0)
      return shiftDate.getTime() === date.getTime()
    })
    
    const hours = dayShifts.reduce((acc, shift) => acc + (shift.duration_minutes || 0) / 60, 0)
    
    return {
      day: date.toLocaleDateString("nl-NL", { weekday: "short" }),
      hours: Math.round(hours * 10) / 10,
    }
  })

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Uren per Week</CardTitle>
          <CardDescription>Gewerkte uren over de laatste 8 weken</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={weeklyChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="hours" fill="hsl(var(--primary))" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Uren per Dag</CardTitle>
          <CardDescription>Gewerkte uren over de laatste 7 dagen</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="hours" stroke="hsl(var(--primary))" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}

