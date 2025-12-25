"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Download, Calendar, Clock, TrendingUp, Award, Activity, User, ChevronLeft, ChevronRight, ArrowLeft, CheckCircle2, XCircle } from "lucide-react"
import type { Profile, Shift } from "@/lib/types"
import Link from "next/link"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"

interface EmployeeInsightsProps {
  profile: Profile
  shifts: Shift[]
}

export function EmployeeInsights({ profile, shifts }: EmployeeInsightsProps) {
  const [weekOffset, setWeekOffset] = useState(0) // 0 = current week, -1 = last week, etc.

  // Get current week and previous weeks
  const now = new Date()
  const currentWeekStart = new Date(now)
  currentWeekStart.setDate(now.getDate() - now.getDay() + 1)
  currentWeekStart.setHours(0, 0, 0, 0)

  // Helper function to get week boundaries
  const getWeekBounds = (offset: number = 0) => {
    const weekStart = new Date(currentWeekStart)
    weekStart.setDate(currentWeekStart.getDate() + offset * 7)
    weekStart.setHours(0, 0, 0, 0)
    
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 6)
    weekEnd.setHours(23, 59, 59, 999)
    
    return { weekStart, weekEnd }
  }

  const getWeekData = (offset: number) => {
    const { weekStart, weekEnd } = getWeekBounds(offset)

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
        dayFull: day.toLocaleDateString("nl-NL", { weekday: "long" }),
        date: day.toLocaleDateString("nl-NL", { day: "numeric", month: "short" }),
        fullDate: day,
        hours: Math.round(hours * 10) / 10,
        shifts: dayShifts.length,
        shiftDetails: dayShifts,
      }
    })

    const daysWorked = dailyData.filter(d => d.hours > 0).length

    return {
      weekStart,
      weekEnd,
      shifts: weekShifts,
      totalMinutes,
      totalHours,
      totalMins,
      dailyData,
      daysWorked,
    }
  }

  const selectedWeekData = getWeekData(weekOffset)

  // Overall statistics
  const allCompletedShifts = shifts.filter((s) => s.clock_out && s.duration_minutes)
  const totalAllMinutes = allCompletedShifts.reduce((acc, s) => acc + (s.duration_minutes || 0), 0)
  const totalAllHours = Math.floor(totalAllMinutes / 60)
  const totalAllMins = totalAllMinutes % 60

  const avgShiftMinutes =
    allCompletedShifts.length > 0
      ? Math.round(allCompletedShifts.reduce((acc, s) => acc + (s.duration_minutes || 0), 0) / allCompletedShifts.length)
      : 0
  const avgShiftHours = Math.floor(avgShiftMinutes / 60)
  const avgShiftMins = avgShiftMinutes % 60

  const longestShift = Math.max(...allCompletedShifts.map((s) => s.duration_minutes || 0), 0)
  const longestHours = Math.floor(longestShift / 60)
  const longestMins = longestShift % 60

  // Weekly comparison data (last 8 weeks)
  const weeklyComparison = Array.from({ length: 8 }, (_, i) => {
    const weekData = getWeekData(-i)
    return {
      weekOffset: -i,
      weekStart: weekData.weekStart,
      hours: Math.round((weekData.totalMinutes / 60) * 10) / 10,
      shifts: weekData.shifts.length,
      daysWorked: weekData.daysWorked,
    }
  }).reverse()

  // Helper function to get color based on hours worked
  const getHoursColor = (hours: number) => {
    if (hours === 0) return "text-muted-foreground"
    if (hours >= 8) return "text-green-600 dark:text-green-400"
    if (hours >= 6) return "text-blue-600 dark:text-blue-400"
    if (hours >= 4) return "text-yellow-600 dark:text-yellow-400"
    return "text-orange-600 dark:text-orange-400"
  }

  const getHoursBg = (hours: number) => {
    if (hours === 0) return "bg-transparent"
    if (hours >= 8) return "bg-green-50 dark:bg-green-950/30"
    if (hours >= 6) return "bg-blue-50 dark:bg-blue-950/30"
    if (hours >= 4) return "bg-yellow-50 dark:bg-yellow-950/30"
    return "bg-orange-50 dark:bg-orange-950/30"
  }

  const handleExportWeekly = () => {
    // Header with employee and week info
    const csvRows = [
      [`Week Rapport voor ${profile.name}`],
      [`Week van ${selectedWeekData.weekStart.toLocaleDateString("nl-NL")} tot ${selectedWeekData.weekEnd.toLocaleDateString("nl-NL")}`],
      [""],
      // Daily summary
      ["Dag", "Datum", "Uren", "Aantal Shifts"],
      ...selectedWeekData.dailyData.map((day) => [
        day.day,
        day.date,
        day.hours.toFixed(2),
        day.shifts,
      ]),
      [""],
      [`Totaal`, "", selectedWeekData.totalHours + (selectedWeekData.totalMins / 60).toFixed(2), selectedWeekData.shifts.length],
      [""],
      [""],
      // Detailed shift information
      ["Gedetailleerde Shift Informatie"],
      ["Datum", "Dag", "Clock In", "Clock Out", "Duur (minuten)", "Duur (uren)"],
      ...selectedWeekData.shifts.map((shift) => {
        const shiftDate = new Date(shift.clock_in)
        return [
          shiftDate.toLocaleDateString("nl-NL"),
          shiftDate.toLocaleDateString("nl-NL", { weekday: "long" }),
          new Date(shift.clock_in).toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" }),
          shift.clock_out ? new Date(shift.clock_out).toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" }) : "-",
          shift.duration_minutes || 0,
          ((shift.duration_minutes || 0) / 60).toFixed(2),
        ]
      }),
    ]

    const csv = csvRows.map(row => row.join(",")).join("\n")

    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${profile.name}-week-${selectedWeekData.weekStart.toISOString().split("T")[0]}.csv`
    a.click()
  }

  return (
    <div className="space-y-6">
      {/* Back Button & Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/employees">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Terug
          </Link>
        </Button>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-xl font-bold text-primary-foreground">
            {profile.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-2xl font-bold">{profile.name}</h2>
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Badge variant={profile.role === "admin" ? "default" : "secondary"} className="text-xs">
                {profile.role}
              </Badge>
              <span>•</span>
              <span>{allCompletedShifts.length} totaal shifts</span>
            </p>
          </div>
        </div>
      </div>

      {/* Overall Statistics Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-blue-50 to-card dark:from-blue-950/20 dark:to-card border-blue-200 dark:border-blue-900/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Totaal Gewerkt
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
              {totalAllHours}u {totalAllMins}m
            </div>
            <p className="text-xs text-muted-foreground mt-1">Alle tijd • {allCompletedShifts.length} shifts</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-card dark:from-green-950/20 dark:to-card border-green-200 dark:border-green-900/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
              Gemiddelde Shift
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700 dark:text-green-300">
              {avgShiftHours}u {avgShiftMins}m
            </div>
            <p className="text-xs text-muted-foreground mt-1">Per shift gemiddeld</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-card dark:from-purple-950/20 dark:to-card border-purple-200 dark:border-purple-900/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Award className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              Langste Shift
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
              {longestHours}u {longestMins}m
            </div>
            <p className="text-xs text-muted-foreground mt-1">Record prestatie</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-card dark:from-orange-950/20 dark:to-card border-orange-200 dark:border-orange-900/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="w-4 h-4 text-orange-600 dark:text-orange-400" />
              Werkdagen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-700 dark:text-orange-300">
              {weeklyComparison.reduce((acc, w) => acc + w.daysWorked, 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Laatste 8 weken</p>
          </CardContent>
        </Card>
      </div>

      {/* Week Navigation & Stats */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Week Rapport
              </CardTitle>
              <CardDescription className="mt-1">
                {selectedWeekData.weekStart.toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" })} - {selectedWeekData.weekEnd.toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" })}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setWeekOffset(weekOffset - 1)}
                className="h-9"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline ml-1">Vorige</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setWeekOffset(0)}
                disabled={weekOffset === 0}
                className="h-9"
              >
                Huidige Week
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setWeekOffset(weekOffset + 1)}
                disabled={weekOffset >= 0}
                className="h-9"
              >
                <span className="hidden sm:inline mr-1">Volgende</span>
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Button size="sm" onClick={handleExportWeekly} className="h-9 gap-2">
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-4">
            <div className="rounded-xl border border-border bg-gradient-to-br from-card to-muted/20 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
                <Clock className="w-4 h-4" />
                Totaal Uren
              </div>
              <div className="text-2xl font-bold">
                {selectedWeekData.totalHours}u {selectedWeekData.totalMins}m
              </div>
              <Progress value={(selectedWeekData.totalMinutes / 60 / 40) * 100} className="mt-2 h-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {Math.round((selectedWeekData.totalMinutes / 60 / 40) * 100)}% van 40 uur
              </p>
            </div>

            <div className="rounded-xl border border-border bg-gradient-to-br from-card to-muted/20 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
                <Calendar className="w-4 h-4" />
                Werkdagen
              </div>
              <div className="text-2xl font-bold">
                {selectedWeekData.daysWorked}/7
              </div>
              <Progress value={(selectedWeekData.daysWorked / 7) * 100} className="mt-2 h-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {selectedWeekData.shifts.length} shifts deze week
              </p>
            </div>

            <div className="rounded-xl border border-border bg-gradient-to-br from-card to-muted/20 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
                <TrendingUp className="w-4 h-4" />
                Gem. per Dag
              </div>
              <div className="text-2xl font-bold">
                {selectedWeekData.daysWorked > 0
                  ? `${Math.round((selectedWeekData.totalMinutes / 60 / selectedWeekData.daysWorked) * 10) / 10}u`
                  : "0u"}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Op werkdagen
              </p>
            </div>

            <div className="rounded-xl border border-border bg-gradient-to-br from-card to-muted/20 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
                <Activity className="w-4 h-4" />
                Status
              </div>
              <div className="text-2xl font-bold flex items-center gap-2">
                {selectedWeekData.totalMinutes >= 40 * 60 ? (
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                ) : (
                  <XCircle className="w-6 h-6 text-orange-600" />
                )}
                <span className={selectedWeekData.totalMinutes >= 40 * 60 ? "text-green-600" : "text-orange-600"}>
                  {selectedWeekData.totalMinutes >= 40 * 60 ? "Volledig" : "Gedeeltelijk"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Week status
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Daily Breakdown Table */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Dagelijkse Urenspecificatie
          </CardTitle>
          <CardDescription>
            Gedetailleerd overzicht per dag met shift informatie
          </CardDescription>
          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 text-xs pt-2">
            <span className="text-muted-foreground font-medium">Kleurcode:</span>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-green-100 dark:bg-green-950/30 border border-green-300"></div>
              <span className="text-muted-foreground">8+ uur</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-blue-100 dark:bg-blue-950/30 border border-blue-300"></div>
              <span className="text-muted-foreground">6-8 uur</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-yellow-100 dark:bg-yellow-950/30 border border-yellow-300"></div>
              <span className="text-muted-foreground">4-6 uur</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-orange-100 dark:bg-orange-950/30 border border-orange-300"></div>
              <span className="text-muted-foreground">&lt;4 uur</span>
            </div>
          </div>
            </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            {selectedWeekData.dailyData.map((day, index) => {
              const isWeekend = index >= 5
              return (
                  <div
                    key={index}
                  className={`rounded-xl border transition-all duration-200 ${
                    day.hours > 0 
                      ? `${getHoursBg(day.hours)} border-current/20 hover:shadow-md` 
                      : "border-border bg-muted/20"
                  }`}
                >
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg ${isWeekend ? "bg-muted" : "bg-primary/10"} flex items-center justify-center`}>
                          <span className="text-xs font-bold">{day.day}</span>
                        </div>
                    <div>
                          <p className="font-semibold text-base">{day.dayFull}</p>
                          <p className="text-xs text-muted-foreground">{day.date}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        {day.hours > 0 ? (
                          <>
                            <p className={`text-2xl font-bold ${getHoursColor(day.hours)}`}>
                              {day.hours.toFixed(1)}u
                            </p>
                      <p className="text-xs text-muted-foreground">{day.shifts} shift{day.shifts !== 1 ? "s" : ""}</p>
                          </>
                        ) : (
                          <p className="text-lg text-muted-foreground">Geen shifts</p>
                        )}
                      </div>
                    </div>

                    {day.shiftDetails.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-current/10 space-y-2">
                        {day.shiftDetails.map((shift, idx) => (
                          <div key={idx} className="flex items-center justify-between text-sm bg-card/50 rounded-lg p-2">
                            <div className="flex items-center gap-2">
                              <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                              <span className="font-medium">
                                {new Date(shift.clock_in).toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" })}
                              </span>
                              <span className="text-muted-foreground">→</span>
                              <span className="font-medium">
                                {shift.clock_out ? new Date(shift.clock_out).toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" }) : "Actief"}
                              </span>
                            </div>
                            <Badge variant="outline" className="font-semibold">
                              {((shift.duration_minutes || 0) / 60).toFixed(1)}u
                            </Badge>
                  </div>
                ))}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
              </div>
            </CardContent>
          </Card>

      {/* Weekly Comparison */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Week Vergelijking
          </CardTitle>
          <CardDescription>
            Prestaties over de laatste 8 weken
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {weeklyComparison.map((week) => (
              <div
                key={week.weekOffset}
                className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-200 ${
                  week.weekOffset === weekOffset
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border hover:bg-muted/50"
                }`}
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="text-sm min-w-[120px]">
                    <p className="font-semibold">
                      {week.weekOffset === 0 ? "Huidige week" : `${Math.abs(week.weekOffset)} ${Math.abs(week.weekOffset) === 1 ? "week" : "weken"} geleden`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {week.weekStart.toLocaleDateString("nl-NL", { day: "numeric", month: "short" })}
                    </p>
                  </div>
                  <div className="flex-1">
                    <Progress value={(week.hours / 40) * 100} className="h-2" />
              </div>
            </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-lg font-bold">{week.hours.toFixed(1)}u</p>
                    <p className="text-xs text-muted-foreground">{week.shifts} shifts • {week.daysWorked} dagen</p>
              </div>
                  <Badge variant={week.hours >= 40 ? "default" : week.hours >= 30 ? "secondary" : "outline"}>
                    {week.hours >= 40 ? "Volledig" : week.hours >= 30 ? "Goed" : "Gedeeltelijk"}
                  </Badge>
            </div>
              </div>
            ))}
          </div>
            </CardContent>
          </Card>
    </div>
  )
}

