"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Download, Calendar, TrendingUp, Users, Clock, FileText, ChevronLeft, ChevronRight, Table as TableIcon, Search, ArrowUpDown, User } from "lucide-react"
import type { Shift, Profile } from "@/lib/types"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

interface ReportsPanelProps {
  shifts: Shift[]
  profiles: Profile[]
}

export function ReportsPanel({ shifts, profiles }: ReportsPanelProps) {
  const [dateRange, setDateRange] = useState("week")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [weekOffset, setWeekOffset] = useState(0) // 0 = current week, -1 = last week, etc.
  const [searchEmployee, setSearchEmployee] = useState("")
  const [sortBy, setSortBy] = useState<"name" | "total">("name")

  // Helper function to get week boundaries (Monday-Sunday)
  const getWeekBounds = (offset: number = 0) => {
    const now = new Date()
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - now.getDay() + 1 + (offset * 7))
    weekStart.setHours(0, 0, 0, 0)
    
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 6)
    weekEnd.setHours(23, 59, 59, 999)
    
    return { weekStart, weekEnd }
  }

  // Filter shifts based on date range
  const getFilteredShifts = () => {
    const now = new Date()
    let start: Date

    switch (dateRange) {
      case "today":
        start = new Date(now)
        start.setHours(0, 0, 0, 0)
        break
      case "week":
        start = new Date(now)
        start.setDate(now.getDate() - now.getDay() + 1)
        start.setHours(0, 0, 0, 0)
        break
      case "month":
        start = new Date(now.getFullYear(), now.getMonth(), 1)
        break
      case "custom":
        if (startDate && endDate) {
          return shifts.filter(
            (s) => new Date(s.clock_in) >= new Date(startDate) && new Date(s.clock_in) <= new Date(endDate),
          )
        }
        return shifts
      default:
        return shifts
    }

    return shifts.filter((s) => new Date(s.clock_in) >= start)
  }

  const filteredShifts = getFilteredShifts()
  const completedShifts = filteredShifts.filter((s) => s.clock_out && s.duration_minutes)

  // Calculate total hours
  const totalMinutes = completedShifts.reduce((acc, s) => acc + (s.duration_minutes || 0), 0)
  const totalHours = Math.floor(totalMinutes / 60)
  const totalMins = totalMinutes % 60

  // Employee hours chart data
  const employeeHours = profiles.map((profile) => {
    const employeeShifts = completedShifts.filter((s) => s.user_id === profile.id)
    const minutes = employeeShifts.reduce((acc, s) => acc + (s.duration_minutes || 0), 0)
    return {
      name: profile.name,
      hours: Math.round((minutes / 60) * 10) / 10,
      shifts: employeeShifts.length,
    }
  })

  // Daily hours chart data - selected week (Monday-Sunday)
  const selectedWeekBounds = getWeekBounds(weekOffset)
  const { weekStart: selectedWeekStart, weekEnd: selectedWeekEnd } = selectedWeekBounds

  const dailyData = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(selectedWeekStart)
    date.setDate(selectedWeekStart.getDate() + i)
    date.setHours(0, 0, 0, 0)

    const dayShifts = completedShifts.filter((shift) => {
      const shiftDate = new Date(shift.clock_in)
      shiftDate.setHours(0, 0, 0, 0)
      return shiftDate.getTime() === date.getTime()
    })

    const hours = dayShifts.reduce((acc, shift) => acc + (shift.duration_minutes || 0) / 60, 0)

    return {
      day: date.toLocaleDateString("nl-NL", { weekday: "short" }),
      date: date.toLocaleDateString("nl-NL", { day: "numeric", month: "short" }),
      hours: Math.round(hours * 10) / 10,
      shifts: dayShifts.length,
    }
  })

  // Daily breakdown per employee for selected week
  const dailyBreakdownRaw = profiles.map((profile) => {
    const employeeShifts = completedShifts.filter((s) => s.user_id === profile.id)
    
    const dailyHours = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(selectedWeekStart)
      date.setDate(selectedWeekStart.getDate() + i)
      date.setHours(0, 0, 0, 0)

      const dayShifts = employeeShifts.filter((shift) => {
        const shiftDate = new Date(shift.clock_in)
        shiftDate.setHours(0, 0, 0, 0)
        return shiftDate.getTime() === date.getTime()
      })

      return dayShifts.reduce((acc, shift) => acc + (shift.duration_minutes || 0) / 60, 0)
    })

    const weeklyTotal = dailyHours.reduce((acc, hours) => acc + hours, 0)
    const daysWorked = dailyHours.filter(h => h > 0).length

    return {
      employee: profile.name,
      employeeId: profile.id,
      monday: dailyHours[0],
      tuesday: dailyHours[1],
      wednesday: dailyHours[2],
      thursday: dailyHours[3],
      friday: dailyHours[4],
      saturday: dailyHours[5],
      sunday: dailyHours[6],
      weeklyTotal,
      daysWorked,
    }
  })

  // Filter and sort daily breakdown
  const dailyBreakdown = dailyBreakdownRaw
    .filter(emp => {
      if (searchEmployee && !emp.employee.toLowerCase().includes(searchEmployee.toLowerCase())) {
        return false
      }
      return emp.weeklyTotal > 0 // Only show employees who worked
    })
    .sort((a, b) => {
      if (sortBy === "total") {
        return b.weeklyTotal - a.weeklyTotal
      }
      return a.employee.localeCompare(b.employee)
    })

  // Calculate daily totals across all employees
  const dailyTotals = Array.from({ length: 7 }, (_, i) => {
    return dailyBreakdown.reduce((acc, emp) => {
      const dayKey = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"][i] as keyof typeof emp
      return acc + (typeof emp[dayKey] === 'number' ? emp[dayKey] : 0)
    }, 0)
  })

  // Helper function to get color based on hours worked
  const getHoursColor = (hours: number) => {
    if (hours === 0) return "text-muted-foreground"
    if (hours >= 8) return "text-green-600 dark:text-green-400 font-semibold"
    if (hours >= 6) return "text-blue-600 dark:text-blue-400 font-medium"
    if (hours >= 4) return "text-yellow-600 dark:text-yellow-400 font-medium"
    return "text-orange-600 dark:text-orange-400 font-medium"
  }

  const getHoursBg = (hours: number) => {
    if (hours === 0) return "bg-transparent"
    if (hours >= 8) return "bg-green-50 dark:bg-green-950/30"
    if (hours >= 6) return "bg-blue-50 dark:bg-blue-950/30"
    if (hours >= 4) return "bg-yellow-50 dark:bg-yellow-950/30"
    return "bg-orange-50 dark:bg-orange-950/30"
  }

  const COLORS = ["hsl(var(--primary))", "hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))"]

  const handleExport = () => {
    const csv = [
      ["Medewerker", "Datum", "Dag", "Clock In", "Clock Out", "Duur (minuten)", "Duur (uren)"].join(","),
      ...completedShifts.map((shift) => {
        const profile = profiles.find((p) => p.id === shift.user_id)
        const clockIn = new Date(shift.clock_in)
        const clockOut = shift.clock_out ? new Date(shift.clock_out) : null
        return [
          profile?.name || "Onbekend",
          clockIn.toLocaleDateString("nl-NL"),
          clockIn.toLocaleDateString("nl-NL", { weekday: "long" }),
          clockIn.toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" }),
          clockOut ? clockOut.toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" }) : "-",
          shift.duration_minutes || 0,
          shift.duration_minutes ? (shift.duration_minutes / 60).toFixed(2) : "0",
        ].join(",")
      }),
      ["", "", "", "", "", "", ""].join(","),
      ["Totaal Shifts", completedShifts.length, "", "", "", totalMinutes, (totalMinutes / 60).toFixed(2)].join(","),
    ].join("\n")

    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `uren-rapport-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
  }

  // Weekly report data
  const now = new Date()
  const currentWeekStart = new Date(now)
  currentWeekStart.setDate(now.getDate() - now.getDay() + 1)
  currentWeekStart.setHours(0, 0, 0, 0)
  const currentWeekEnd = new Date(currentWeekStart)
  currentWeekEnd.setDate(currentWeekEnd.getDate() + 6)
  currentWeekEnd.setHours(23, 59, 59, 999)

  const weeklyShifts = completedShifts.filter(
    (s) => new Date(s.clock_in) >= currentWeekStart && new Date(s.clock_in) <= currentWeekEnd,
  )

  const weeklyMinutes = weeklyShifts.reduce((acc, s) => acc + (s.duration_minutes || 0), 0)
  const weeklyHours = Math.floor(weeklyMinutes / 60)
  const weeklyMins = weeklyMinutes % 60

  // Weekly report per employee
  const weeklyEmployeeReport = profiles.map((profile) => {
    const employeeShifts = weeklyShifts.filter((s) => s.user_id === profile.id)
    const minutes = employeeShifts.reduce((acc, s) => acc + (s.duration_minutes || 0), 0)
    return {
      name: profile.name,
      hours: Math.round((minutes / 60) * 10) / 10,
      shifts: employeeShifts.length,
      minutes: minutes,
    }
  })

  const handleExportWeekly = () => {
    // Create daily breakdown for current week (used in weekly tab)
    const currentWeekDailyBreakdown = profiles.map((profile) => {
      const employeeShifts = weeklyShifts.filter((s) => s.user_id === profile.id)
      
      const dailyHours = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(currentWeekStart)
        date.setDate(currentWeekStart.getDate() + i)
        date.setHours(0, 0, 0, 0)

        const dayShifts = employeeShifts.filter((shift) => {
          const shiftDate = new Date(shift.clock_in)
          shiftDate.setHours(0, 0, 0, 0)
          return shiftDate.getTime() === date.getTime()
        })

        return dayShifts.reduce((acc, shift) => acc + (shift.duration_minutes || 0) / 60, 0)
      })

      const weeklyTotal = dailyHours.reduce((acc, hours) => acc + hours, 0)

      return {
        employee: profile.name,
        dailyHours,
        weeklyTotal,
      }
    }).filter(emp => emp.weeklyTotal > 0)

    // Calculate daily totals for current week
    const currentWeekDailyTotals = Array.from({ length: 7 }, (_, i) => {
      return currentWeekDailyBreakdown.reduce((acc, emp) => acc + emp.dailyHours[i], 0)
    })

    const dates = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(currentWeekStart)
      date.setDate(currentWeekStart.getDate() + i)
      return date.toLocaleDateString("nl-NL", { day: "numeric", month: "short" })
    })
    
    const csv = [
      // Header with week range
      [`Week Rapport: ${currentWeekStart.toLocaleDateString("nl-NL")} - ${currentWeekEnd.toLocaleDateString("nl-NL")}`].join(","),
      [""].join(","),
      // Column headers
      ["Medewerker", `Ma (${dates[0]})`, `Di (${dates[1]})`, `Wo (${dates[2]})`, `Do (${dates[3]})`, `Vr (${dates[4]})`, `Za (${dates[5]})`, `Zo (${dates[6]})`, "Totaal (uren)"].join(","),
      // Employee rows
      ...currentWeekDailyBreakdown.map((emp) => [
        emp.employee,
        emp.dailyHours[0].toFixed(2),
        emp.dailyHours[1].toFixed(2),
        emp.dailyHours[2].toFixed(2),
        emp.dailyHours[3].toFixed(2),
        emp.dailyHours[4].toFixed(2),
        emp.dailyHours[5].toFixed(2),
        emp.dailyHours[6].toFixed(2),
        emp.weeklyTotal.toFixed(2),
      ].join(",")),
      [""].join(","),
      // Daily totals
      [
        "Totaal per Dag",
        currentWeekDailyTotals[0].toFixed(2),
        currentWeekDailyTotals[1].toFixed(2),
        currentWeekDailyTotals[2].toFixed(2),
        currentWeekDailyTotals[3].toFixed(2),
        currentWeekDailyTotals[4].toFixed(2),
        currentWeekDailyTotals[5].toFixed(2),
        currentWeekDailyTotals[6].toFixed(2),
        currentWeekDailyTotals.reduce((a, b) => a + b, 0).toFixed(2),
      ].join(","),
      [""].join(","),
      // Summary
      ["Totaal Shifts", "", "", "", "", "", "", "", weeklyShifts.length].join(","),
      ["Totaal Minuten", "", "", "", "", "", "", "", weeklyMinutes].join(","),
      ["Totaal Uren", "", "", "", "", "", "", "", `${weeklyHours}u ${weeklyMins}m`].join(","),
    ].join("\n")

    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `weekrapport-${currentWeekStart.toISOString().split("T")[0]}.csv`
    a.click()
  }

  return (
    <div className="space-y-4 sm:space-y-6 w-full">
      <Tabs defaultValue="general" className="space-y-4 sm:space-y-6">
        <TabsList className="grid w-full grid-cols-2 h-auto p-1">
          <TabsTrigger value="general" className="text-xs sm:text-sm py-2 sm:py-2.5">
            Algemeen Rapport
          </TabsTrigger>
          <TabsTrigger value="weekly" className="text-xs sm:text-sm py-2 sm:py-2.5">
            Week Rapport
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4 sm:space-y-6">
          {/* Filters */}
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-3 sm:pb-4">
              <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                Rapport Filters
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">Selecteer een periode voor het rapport</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                <div className="sm:col-span-1">
                  <Label className="text-xs sm:text-sm mb-2 block">Periode</Label>
                  <Select value={dateRange} onValueChange={setDateRange}>
                    <SelectTrigger className="h-10 sm:h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="today">Vandaag</SelectItem>
                      <SelectItem value="week">Deze Week</SelectItem>
                      <SelectItem value="month">Deze Maand</SelectItem>
                      <SelectItem value="custom">Aangepast</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {dateRange === "custom" && (
                  <>
                    <div className="sm:col-span-1">
                      <Label className="text-xs sm:text-sm mb-2 block">Van</Label>
                      <Input 
                        type="date" 
                        value={startDate} 
                        onChange={(e) => setStartDate(e.target.value)}
                        className="h-10 sm:h-11"
                      />
                    </div>
                    <div className="sm:col-span-1">
                      <Label className="text-xs sm:text-sm mb-2 block">Tot</Label>
                      <Input 
                        type="date" 
                        value={endDate} 
                        onChange={(e) => setEndDate(e.target.value)}
                        className="h-10 sm:h-11"
                      />
                    </div>
                  </>
                )}
                <div className={`flex items-end ${dateRange === "custom" ? "sm:col-span-1" : "sm:col-span-2 lg:col-span-1"}`}>
                  <Button onClick={handleExport} className="w-full h-10 sm:h-11 gap-2">
                    <Download className="w-4 h-4" />
                    <span className="text-xs sm:text-sm">Export CSV</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-card dark:from-blue-950/20 dark:to-card border-blue-200 dark:border-blue-900/50 hover:shadow-lg transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 sm:pb-3">
            <CardTitle className="text-xs sm:text-sm font-medium">Totaal Uren</CardTitle>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600 dark:text-blue-400" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-xl sm:text-2xl font-bold tabular-nums mb-1 text-blue-700 dark:text-blue-300">
              {totalHours}u {totalMins}m
            </div>
            <p className="text-xs text-muted-foreground">{completedShifts.length} shifts • {dateRange === "week" ? "deze week" : dateRange === "today" ? "vandaag" : dateRange === "month" ? "deze maand" : "geselecteerd"}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-card dark:from-green-950/20 dark:to-card border-green-200 dark:border-green-900/50 hover:shadow-lg transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 sm:pb-3">
            <CardTitle className="text-xs sm:text-sm font-medium">Actieve Medewerkers</CardTitle>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-green-500/10 flex items-center justify-center">
              <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-600 dark:text-green-400" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-xl sm:text-2xl font-bold tabular-nums mb-1 text-green-700 dark:text-green-300">
              {dailyBreakdownRaw.filter(e => e.weeklyTotal > 0).length}/{profiles.length}
            </div>
            <p className="text-xs text-muted-foreground">hebben gewerkt</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-card dark:from-purple-950/20 dark:to-card border-purple-200 dark:border-purple-900/50 hover:shadow-lg transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 sm:pb-3">
            <CardTitle className="text-xs sm:text-sm font-medium">Gem. per Persoon</CardTitle>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-purple-600 dark:text-purple-400" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-xl sm:text-2xl font-bold tabular-nums mb-1 text-purple-700 dark:text-purple-300">
              {dailyBreakdownRaw.filter(e => e.weeklyTotal > 0).length > 0
                ? `${Math.round(totalMinutes / 60 / dailyBreakdownRaw.filter(e => e.weeklyTotal > 0).length * 10) / 10}u`
                : "0u"}
            </div>
            <p className="text-xs text-muted-foreground">gemiddeld per week</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-card dark:from-orange-950/20 dark:to-card border-orange-200 dark:border-orange-900/50 hover:shadow-lg transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 sm:pb-3">
            <CardTitle className="text-xs sm:text-sm font-medium">Totaal Dagen</CardTitle>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-orange-600 dark:text-orange-400" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-xl sm:text-2xl font-bold tabular-nums mb-1 text-orange-700 dark:text-orange-300">
              {dailyBreakdownRaw.reduce((acc, emp) => acc + emp.daysWorked, 0)}
            </div>
            <p className="text-xs text-muted-foreground">werkdagen totaal</p>
          </CardContent>
        </Card>
      </div>


      {/* Quick Employee Summary */}
      {dailyBreakdownRaw.filter(e => e.weeklyTotal > 0).length > 0 && (
        <Card className="border-border/50 shadow-sm bg-gradient-to-br from-card to-muted/20">
          <CardHeader className="pb-3 sm:pb-4">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <Users className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              Top Medewerkers - Deze Week
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Snelle overzicht van meest actieve medewerkers
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {dailyBreakdownRaw
                .filter(e => e.weeklyTotal > 0)
                .sort((a, b) => b.weeklyTotal - a.weeklyTotal)
                .slice(0, 6)
                .map((emp, idx) => (
                  <div
                    key={emp.employeeId}
                    className="flex items-center justify-between p-3 rounded-lg border border-border bg-card hover:bg-accent/50 transition-all duration-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        idx === 0 ? "bg-yellow-500/20 text-yellow-700 dark:text-yellow-300" :
                        idx === 1 ? "bg-gray-400/20 text-gray-700 dark:text-gray-300" :
                        idx === 2 ? "bg-amber-600/20 text-amber-700 dark:text-amber-300" :
                        "bg-primary/10 text-primary"
                      }`}>
                        {idx < 3 ? ["🥇", "🥈", "🥉"][idx] : emp.employee.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold text-sm truncate max-w-[120px]">{emp.employee}</span>
                        <span className="text-xs text-muted-foreground">{emp.daysWorked} dagen</span>
                      </div>
                    </div>
                    <Badge variant={emp.weeklyTotal >= 40 ? "default" : "secondary"} className="font-bold">
                      {emp.weeklyTotal.toFixed(1)}u
                    </Badge>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Week Navigation */}
      <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-3 sm:pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                Week Navigatie
            </CardTitle>
              <CardDescription className="text-xs sm:text-sm mt-1">
                {selectedWeekStart.toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" })} - {selectedWeekEnd.toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" })}
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
              <Button
                size="sm"
                onClick={() => {
                  const dates = Array.from({ length: 7 }, (_, i) => {
                    const date = new Date(selectedWeekStart)
                    date.setDate(selectedWeekStart.getDate() + i)
                    return date.toLocaleDateString("nl-NL", { day: "numeric", month: "short" })
                  })
                  
                  const csv = [
                    [`Week Rapport: ${selectedWeekStart.toLocaleDateString("nl-NL")} - ${selectedWeekEnd.toLocaleDateString("nl-NL")}`].join(","),
                    [""].join(","),
                    ["Medewerker", `Ma (${dates[0]})`, `Di (${dates[1]})`, `Wo (${dates[2]})`, `Do (${dates[3]})`, `Vr (${dates[4]})`, `Za (${dates[5]})`, `Zo (${dates[6]})`, "Totaal (uren)"].join(","),
                    ...dailyBreakdown.map((emp) => [
                      emp.employee,
                      emp.monday.toFixed(2),
                      emp.tuesday.toFixed(2),
                      emp.wednesday.toFixed(2),
                      emp.thursday.toFixed(2),
                      emp.friday.toFixed(2),
                      emp.saturday.toFixed(2),
                      emp.sunday.toFixed(2),
                      emp.weeklyTotal.toFixed(2),
                    ].join(",")),
                    [""].join(","),
                    [
                      "Totaal per Dag",
                      dailyTotals[0].toFixed(2),
                      dailyTotals[1].toFixed(2),
                      dailyTotals[2].toFixed(2),
                      dailyTotals[3].toFixed(2),
                      dailyTotals[4].toFixed(2),
                      dailyTotals[5].toFixed(2),
                      dailyTotals[6].toFixed(2),
                      dailyTotals.reduce((a, b) => a + b, 0).toFixed(2),
                    ].join(","),
                  ].join("\n")

                  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" })
                  const url = window.URL.createObjectURL(blob)
                  const a = document.createElement("a")
                  a.href = url
                  a.download = `weekrapport-${selectedWeekStart.toISOString().split("T")[0]}.csv`
                  a.click()
                }}
                className="h-9 gap-2"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export Week</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        </Card>

      {/* Daily Breakdown Table */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-3 sm:pb-4 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <TableIcon className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                Dagelijkse Urenspecificatie
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm mt-1">
                Uren per dag per medewerker • <span className="font-medium">{dailyBreakdown.length} medewerkers</span>
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Zoek medewerker..."
                  value={searchEmployee}
                  onChange={(e) => setSearchEmployee(e.target.value)}
                  className="pl-9 h-9 w-full sm:w-64"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortBy(sortBy === "name" ? "total" : "name")}
                className="h-9 gap-2"
              >
                <ArrowUpDown className="w-4 h-4" />
                <span className="hidden sm:inline">{sortBy === "name" ? "Naam" : "Uren"}</span>
              </Button>
            </div>
          </div>
          
          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <span className="text-muted-foreground font-medium">Kleurcode:</span>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-green-100 dark:bg-green-950/30 border border-green-300 dark:border-green-700"></div>
              <span className="text-muted-foreground">8+ uur</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-blue-100 dark:bg-blue-950/30 border border-blue-300 dark:border-blue-700"></div>
              <span className="text-muted-foreground">6-8 uur</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-yellow-100 dark:bg-yellow-950/30 border border-yellow-300 dark:border-yellow-700"></div>
              <span className="text-muted-foreground">4-6 uur</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-orange-100 dark:bg-orange-950/30 border border-orange-300 dark:border-orange-700"></div>
              <span className="text-muted-foreground">&lt;4 uur</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-semibold sticky left-0 bg-background z-10">
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5" />
                      Medewerker
                    </div>
                  </TableHead>
                  {Array.from({ length: 7 }, (_, i) => {
                    const date = new Date(selectedWeekStart)
                    date.setDate(selectedWeekStart.getDate() + i)
                    const dayName = ["Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"][i]
                    const isWeekend = i >= 5
                    return (
                      <TableHead key={i} className={`text-center font-semibold ${isWeekend ? "bg-muted/50" : ""}`}>
                        <div className="flex flex-col items-center">
                          <span>{dayName}</span>
                          <span className="text-[10px] font-normal text-muted-foreground">
                            {date.getDate()}/{date.getMonth() + 1}
                          </span>
                        </div>
                      </TableHead>
                    )
                  })}
                  <TableHead className="text-right font-semibold">
                    <div className="flex flex-col items-end">
                      <span>Totaal</span>
                      <span className="text-[10px] font-normal text-muted-foreground">Dagen</span>
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dailyBreakdown.length > 0 ? (
                  <>
                    {dailyBreakdown.map((emp, idx) => (
                      <TableRow key={emp.employeeId} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="font-medium sticky left-0 bg-background z-10">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                              {emp.employee.charAt(0).toUpperCase()}
                            </div>
                            <span className="truncate max-w-[150px]">{emp.employee}</span>
                          </div>
                        </TableCell>
                        {[emp.monday, emp.tuesday, emp.wednesday, emp.thursday, emp.friday, emp.saturday, emp.sunday].map((hours, dayIdx) => {
                          const isWeekend = dayIdx >= 5
                          return (
                            <TableCell 
                              key={dayIdx} 
                              className={`text-center tabular-nums ${getHoursBg(hours)} ${getHoursColor(hours)} ${isWeekend ? "bg-opacity-50" : ""}`}
                            >
                              {hours > 0 ? (
                                <div className="flex flex-col items-center py-1">
                                  <span className="text-sm font-semibold">{hours.toFixed(1)}</span>
                                  <span className="text-[10px] opacity-70">u</span>
                                </div>
                              ) : (
                                <span className="text-muted-foreground/50">-</span>
                              )}
                            </TableCell>
                          )
                        })}
                        <TableCell className="text-right">
                          <div className="flex flex-col items-end">
                            <Badge variant={emp.weeklyTotal >= 40 ? "default" : emp.weeklyTotal >= 30 ? "secondary" : "outline"} className="font-semibold">
                              {emp.weeklyTotal.toFixed(1)}u
                            </Badge>
                            <span className="text-xs text-muted-foreground mt-0.5">{emp.daysWorked} dagen</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="border-t-2 font-semibold bg-primary/5 hover:bg-primary/10 transition-colors">
                      <TableCell className="sticky left-0 bg-primary/5 z-10">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-primary" />
                          Totaal per Dag
                        </div>
                      </TableCell>
                      {dailyTotals.map((total, idx) => {
                        const isWeekend = idx >= 5
                        return (
                          <TableCell key={idx} className={`text-center tabular-nums ${isWeekend ? "bg-muted/50" : ""}`}>
                            <div className="flex flex-col items-center">
                              <span className="text-sm font-bold">{total > 0 ? total.toFixed(1) : "-"}</span>
                              {total > 0 && <span className="text-[10px] opacity-70">uur</span>}
                            </div>
                          </TableCell>
                        )
                      })}
                      <TableCell className="text-right">
                        <Badge className="font-bold text-sm">
                          {dailyTotals.reduce((a, b) => a + b, 0).toFixed(1)}u
                        </Badge>
                      </TableCell>
                    </TableRow>
                  </>
                ) : (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                      {searchEmployee ? `Geen resultaten voor "${searchEmployee}"` : "Geen data voor deze week"}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
        </TabsContent>

        <TabsContent value="weekly" className="space-y-4 sm:space-y-6">
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-3 sm:pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                <div>
                  <CardTitle className="text-lg sm:text-xl flex items-center gap-2 mb-1">
                    <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                    Week Rapport
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Week van {currentWeekStart.toLocaleDateString("nl-NL")} tot{" "}
                    {currentWeekEnd.toLocaleDateString("nl-NL")}
                  </CardDescription>
                </div>
                <Button onClick={handleExportWeekly} className="w-full sm:w-auto gap-2 h-10 sm:h-11">
                  <FileText className="w-4 h-4" />
                  <span className="text-xs sm:text-sm">Export Week Rapport</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6">
              <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
                <div className="rounded-xl border border-border/50 bg-gradient-to-br from-card to-card/50 p-4 sm:p-5 hover:shadow-md transition-all duration-200">
                  <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-muted-foreground mb-2 sm:mb-3">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                    </div>
                    Totaal Uren
                  </div>
                  <div className="text-xl sm:text-2xl font-bold tabular-nums mb-1">
                    {weeklyHours}u {weeklyMins}m
                  </div>
                  <p className="text-xs text-muted-foreground">{weeklyShifts.length} shifts</p>
                </div>

                <div className="rounded-xl border border-border/50 bg-gradient-to-br from-card to-card/50 p-4 sm:p-5 hover:shadow-md transition-all duration-200">
                  <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-muted-foreground mb-2 sm:mb-3">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                    </div>
                    Actieve Medewerkers
                  </div>
                  <div className="text-xl sm:text-2xl font-bold tabular-nums mb-1">
                    {weeklyEmployeeReport.filter((e) => e.hours > 0).length}
                  </div>
                  <p className="text-xs text-muted-foreground">hebben gewerkt</p>
                </div>

                <div className="rounded-xl border border-border/50 bg-gradient-to-br from-card to-card/50 p-4 sm:p-5 hover:shadow-md transition-all duration-200">
                  <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-muted-foreground mb-2 sm:mb-3">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                    </div>
                    Gem. per Medewerker
                  </div>
                  <div className="text-xl sm:text-2xl font-bold tabular-nums mb-1">
                    {weeklyEmployeeReport.filter((e) => e.hours > 0).length > 0
                      ? `${Math.round((weeklyMinutes / 60 / weeklyEmployeeReport.filter((e) => e.hours > 0).length) * 10) / 10}u`
                      : "0u"}
                  </div>
                  <p className="text-xs text-muted-foreground">gemiddeld</p>
                </div>
              </div>

              <Card className="border-border/50 shadow-sm">
                <CardHeader className="pb-3 sm:pb-4">
                  <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                    <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                    Week Overzicht per Medewerker
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2 sm:space-y-3">
                    {weeklyEmployeeReport
                      .sort((a, b) => b.hours - a.hours)
                      .map((emp) => (
                        <div
                          key={emp.name}
                          className="flex items-center justify-between p-3 sm:p-4 border border-border/50 rounded-xl hover:bg-muted/50 hover:border-border transition-all duration-200 active:scale-[0.98]"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm sm:text-base truncate">{emp.name}</p>
                            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                              {emp.shifts} shift{emp.shifts !== 1 ? "s" : ""}
                            </p>
                          </div>
                          <div className="text-right flex-shrink-0 ml-4">
                            <p className="text-xl sm:text-2xl font-bold tabular-nums">{emp.hours}u</p>
                            <p className="text-xs text-muted-foreground">{emp.minutes} minuten</p>
                          </div>
                        </div>
                      ))}
                    {weeklyEmployeeReport.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <p className="text-sm">Geen data voor deze week</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

