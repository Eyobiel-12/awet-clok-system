"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts"
import { Download, Calendar, Clock, TrendingUp, Award, Activity, User } from "lucide-react"
import type { Profile, Shift } from "@/lib/types"
import Link from "next/link"

interface EmployeeInsightsProps {
  profile: Profile
  shifts: Shift[]
}

export function EmployeeInsights({ profile, shifts }: EmployeeInsightsProps) {
  const [weekFilter, setWeekFilter] = useState("current")

  // Get current week and previous weeks
  const now = new Date()
  const currentWeekStart = new Date(now)
  currentWeekStart.setDate(now.getDate() - now.getDay() + 1)
  currentWeekStart.setHours(0, 0, 0, 0)

  const getWeekData = (weekOffset: number) => {
    const weekStart = new Date(currentWeekStart)
    weekStart.setDate(weekStart.getDate() + weekOffset * 7)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 6)
    weekEnd.setHours(23, 59, 59, 999)

    const weekShifts = shifts.filter(
      (s) => new Date(s.clock_in) >= weekStart && new Date(s.clock_in) <= weekEnd && s.duration_minutes,
    )

    const totalMinutes = weekShifts.reduce((acc, s) => acc + (s.duration_minutes || 0), 0)
    const totalHours = Math.floor(totalMinutes / 60)
    const totalMins = totalMinutes % 60

    // Daily breakdown
    const dailyData = Array.from({ length: 7 }, (_, i) => {
      const day = new Date(weekStart)
      day.setDate(day.getDate() + i)
      day.setHours(0, 0, 0, 0)

      const dayShifts = weekShifts.filter((shift) => {
        const shiftDate = new Date(shift.clock_in)
        shiftDate.setHours(0, 0, 0, 0)
        return shiftDate.getTime() === day.getTime()
      })

      const hours = dayShifts.reduce((acc, shift) => acc + (shift.duration_minutes || 0) / 60, 0)

      return {
        day: day.toLocaleDateString("nl-NL", { weekday: "short" }),
        date: day.toLocaleDateString("nl-NL", { day: "numeric", month: "short" }),
        hours: Math.round(hours * 10) / 10,
        shifts: dayShifts.length,
      }
    })

    return {
      weekStart,
      weekEnd,
      shifts: weekShifts,
      totalMinutes,
      totalHours,
      totalMins,
      dailyData,
    }
  }

  const selectedWeekData = getWeekData(weekFilter === "current" ? 0 : weekFilter === "last" ? -1 : -2)

  // Overall statistics
  const allCompletedShifts = shifts.filter((s) => s.clock_out && s.duration_minutes)
  const totalAllMinutes = allCompletedShifts.reduce((acc, s) => acc + (s.duration_minutes || 0), 0)
  const totalAllHours = Math.floor(totalAllMinutes / 60)

  const avgShiftMinutes =
    allCompletedShifts.length > 0
      ? Math.round(allCompletedShifts.reduce((acc, s) => acc + (s.duration_minutes || 0), 0) / allCompletedShifts.length)
      : 0
  const avgShiftHours = Math.floor(avgShiftMinutes / 60)
  const avgShiftMins = avgShiftMinutes % 60

  const longestShift = Math.max(...allCompletedShifts.map((s) => s.duration_minutes || 0), 0)
  const longestHours = Math.floor(longestShift / 60)
  const longestMins = longestShift % 60

  // Weekly comparison data
  const weeklyComparison = Array.from({ length: 4 }, (_, i) => {
    const weekData = getWeekData(-i)
    return {
      week: `Week ${-i === 0 ? "Huidige" : Math.abs(-i)}`,
      hours: Math.round((weekData.totalMinutes / 60) * 10) / 10,
      shifts: weekData.shifts.length,
    }
  }).reverse()

  const handleExportWeekly = () => {
    const csv = [
      ["Dag", "Datum", "Uren", "Shifts", "Clock In", "Clock Out", "Duur (minuten)"].join(","),
      ...selectedWeekData.shifts.map((shift) => {
        const shiftDate = new Date(shift.clock_in)
        return [
          shiftDate.toLocaleDateString("nl-NL", { weekday: "long" }),
          shiftDate.toLocaleDateString("nl-NL"),
          (shift.duration_minutes || 0) / 60,
          1,
          new Date(shift.clock_in).toLocaleTimeString("nl-NL"),
          shift.clock_out ? new Date(shift.clock_out).toLocaleTimeString("nl-NL") : "",
          shift.duration_minutes || 0,
        ].join(",")
      }),
    ].join("\n")

    const blob = new Blob([csv], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${profile.name}-week-${selectedWeekData.weekStart.toISOString().split("T")[0]}.csv`
    a.click()
  }

  return (
    <div className="space-y-6">
      {/* Week Selector */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Week Rapport</CardTitle>
              <CardDescription>
                Week van {selectedWeekData.weekStart.toLocaleDateString("nl-NL")} tot{" "}
                {selectedWeekData.weekEnd.toLocaleDateString("nl-NL")}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={weekFilter} onValueChange={setWeekFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current">Huidige Week</SelectItem>
                  <SelectItem value="last">Vorige Week</SelectItem>
                  <SelectItem value="2weeks">2 Weken Geleden</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleExportWeekly}>
                <Download className="w-4 h-4 mr-2" />
                Export Week
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
                <Clock className="w-4 h-4" />
                Totaal Uren
              </div>
              <div className="text-2xl font-bold">
                {selectedWeekData.totalHours}u {selectedWeekData.totalMins}m
              </div>
              <p className="text-xs text-muted-foreground mt-1">{selectedWeekData.shifts.length} shifts</p>
            </div>

            <div className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
                <Calendar className="w-4 h-4" />
                Werkdagen
              </div>
              <div className="text-2xl font-bold">
                {selectedWeekData.dailyData.filter((d) => d.hours > 0).length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">dagen gewerkt</p>
            </div>

            <div className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
                <TrendingUp className="w-4 h-4" />
                Gem. per Dag
              </div>
              <div className="text-2xl font-bold">
                {selectedWeekData.dailyData.filter((d) => d.hours > 0).length > 0
                  ? `${Math.round((selectedWeekData.totalMinutes / 60 / selectedWeekData.dailyData.filter((d) => d.hours > 0).length) * 10) / 10}u`
                  : "0u"}
              </div>
              <p className="text-xs text-muted-foreground mt-1">gemiddeld</p>
            </div>

            <div className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
                <Activity className="w-4 h-4" />
                Status
              </div>
              <div className="text-2xl font-bold">
                <Badge variant={profile.role === "admin" ? "default" : "secondary"}>{profile.role}</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-2">huidige rol</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="weekly" className="space-y-4">
        <TabsList>
          <TabsTrigger value="weekly">Week Overzicht</TabsTrigger>
          <TabsTrigger value="overall">Totaal Statistieken</TabsTrigger>
          <TabsTrigger value="comparison">Week Vergelijking</TabsTrigger>
        </TabsList>

        <TabsContent value="weekly" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Dagelijkse Uren - Deze Week</CardTitle>
              <CardDescription>Gewerkte uren per dag</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={selectedWeekData.dailyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="hours" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Dagelijkse Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {selectedWeekData.dailyData.map((day, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                  >
                    <div>
                      <p className="font-medium">{day.day}</p>
                      <p className="text-sm text-muted-foreground">{day.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{day.hours}u</p>
                      <p className="text-xs text-muted-foreground">{day.shifts} shift{day.shifts !== 1 ? "s" : ""}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="overall" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-border bg-card p-6">
              <div className="flex items-center gap-2 text-lg font-semibold mb-4">
                <Clock className="w-5 h-5" />
                Totaal Uren
              </div>
              <p className="text-3xl font-bold">{totalAllHours}u</p>
              <p className="text-sm text-muted-foreground mt-1">{allCompletedShifts.length} shifts totaal</p>
            </div>

            <div className="rounded-lg border border-border bg-card p-6">
              <div className="flex items-center gap-2 text-lg font-semibold mb-4">
                <TrendingUp className="w-5 h-5" />
                Gem. Shift
              </div>
              <p className="text-3xl font-bold">
                {avgShiftHours}u {avgShiftMins}m
              </p>
              <p className="text-sm text-muted-foreground mt-1">gemiddelde duur</p>
            </div>

            <div className="rounded-lg border border-border bg-card p-6">
              <div className="flex items-center gap-2 text-lg font-semibold mb-4">
                <Award className="w-5 h-5" />
                Langste Shift
              </div>
              <p className="text-3xl font-bold">
                {longestHours}u {longestMins}m
              </p>
              <p className="text-sm text-muted-foreground mt-1">beste prestatie</p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="comparison" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Week Vergelijking</CardTitle>
              <CardDescription>Vergelijk prestaties over de laatste 4 weken</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={weeklyComparison}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="hours" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button variant="outline" asChild>
          <Link href="/admin/employees">Terug naar Medewerkers</Link>
        </Button>
      </div>
    </div>
  )
}

