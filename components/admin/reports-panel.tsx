"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts"
import { Download, Calendar, TrendingUp, Users, Clock, FileText } from "lucide-react"
import type { Shift, Profile } from "@/lib/types"

interface ReportsPanelProps {
  shifts: Shift[]
  profiles: Profile[]
}

export function ReportsPanel({ shifts, profiles }: ReportsPanelProps) {
  const [dateRange, setDateRange] = useState("week")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

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

  // Daily hours chart data
  const dailyData = Array.from({ length: 7 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (6 - i))
    date.setHours(0, 0, 0, 0)

    const dayShifts = completedShifts.filter((shift) => {
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

  const COLORS = ["hsl(var(--primary))", "hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))"]

  const handleExport = () => {
    const csv = [
      ["Employee", "Clock In", "Clock Out", "Duration (minutes)", "Date"].join(","),
      ...completedShifts.map((shift) => {
        const profile = profiles.find((p) => p.id === shift.user_id)
        return [
          profile?.name || "Unknown",
          new Date(shift.clock_in).toISOString(),
          shift.clock_out ? new Date(shift.clock_out).toISOString() : "",
          shift.duration_minutes || 0,
          new Date(shift.clock_in).toLocaleDateString("nl-NL"),
        ].join(",")
      }),
    ].join("\n")

    const blob = new Blob([csv], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `shifts-report-${new Date().toISOString().split("T")[0]}.csv`
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
    const csv = [
      ["Medewerker", "Uren", "Shifts", "Minuten"].join(","),
      ...weeklyEmployeeReport.map((emp) => [emp.name, emp.hours, emp.shifts, emp.minutes].join(",")),
      ["", "", "", ""].join(","),
      ["Totaal", `${weeklyHours}u ${weeklyMins}m`, weeklyShifts.length, weeklyMinutes].join(","),
    ].join("\n")

    const blob = new Blob([csv], { type: "text/csv" })
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
        <Card className="bg-gradient-to-br from-card to-card/50 border-border/50 hover:shadow-md transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 sm:pb-3">
            <CardTitle className="text-xs sm:text-sm font-medium">Totaal Uren</CardTitle>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-xl sm:text-2xl font-bold tabular-nums mb-1">
              {totalHours}u {totalMins}m
            </div>
            <p className="text-xs text-muted-foreground">{completedShifts.length} shifts</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-card to-card/50 border-border/50 hover:shadow-md transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 sm:pb-3">
            <CardTitle className="text-xs sm:text-sm font-medium">Medewerkers</CardTitle>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-xl sm:text-2xl font-bold tabular-nums mb-1">{profiles.length}</div>
            <p className="text-xs text-muted-foreground">actieve medewerkers</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-card to-card/50 border-border/50 hover:shadow-md transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 sm:pb-3">
            <CardTitle className="text-xs sm:text-sm font-medium">Gem. Shift</CardTitle>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-xl sm:text-2xl font-bold tabular-nums mb-1">
              {completedShifts.length > 0
                ? `${Math.floor(totalMinutes / completedShifts.length / 60)}u ${Math.floor((totalMinutes / completedShifts.length) % 60)}m`
                : "0u 0m"}
            </div>
            <p className="text-xs text-muted-foreground">gemiddelde duur</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-card to-card/50 border-border/50 hover:shadow-md transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 sm:pb-3">
            <CardTitle className="text-xs sm:text-sm font-medium">Shifts</CardTitle>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-xl sm:text-2xl font-bold tabular-nums mb-1">{completedShifts.length}</div>
            <p className="text-xs text-muted-foreground">voltooide shifts</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
        <Card className="border-border/50 shadow-sm overflow-hidden">
          <CardHeader className="pb-3 sm:pb-4">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <Users className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              Uren per Medewerker
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">Gewerkte uren per medewerker</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="w-full animate-fade-in" style={{ height: '280px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={employeeHours.filter((e) => e.hours > 0)} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                    animationDuration={300}
                  />
                  <Bar 
                    dataKey="hours" 
                    fill="hsl(var(--primary))" 
                    radius={[4, 4, 0, 0]}
                    animationBegin={0}
                    animationDuration={800}
                    animationEasing="ease-out"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm overflow-hidden">
          <CardHeader className="pb-3 sm:pb-4">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              Uren per Dag
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">Laatste 7 dagen</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="w-full animate-fade-in" style={{ height: '280px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                    animationDuration={300}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="hours" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                    activeDot={{ r: 6 }}
                    animationBegin={0}
                    animationDuration={800}
                    animationEasing="ease-out"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
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

              <Card className="border-border/50 shadow-sm overflow-hidden">
                <CardHeader className="pb-3 sm:pb-4">
                  <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                    <Users className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                    Uren per Medewerker - Deze Week
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="w-full" style={{ height: '280px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={weeklyEmployeeReport.filter((e) => e.hours > 0)} 
                        margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                        <XAxis 
                          dataKey="name" 
                          tick={{ fontSize: 12 }}
                          angle={-45}
                          textAnchor="end"
                          height={60}
                        />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--popover))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                            fontSize: '12px'
                          }}
                        />
                        <Bar dataKey="hours" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

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

