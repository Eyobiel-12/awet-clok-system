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
    <div className="space-y-6">
      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">Algemeen Rapport</TabsTrigger>
          <TabsTrigger value="weekly">Week Rapport</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          {/* Filters */}
          <Card>
        <CardHeader>
          <CardTitle>Rapport Filters</CardTitle>
          <CardDescription>Selecteer een periode voor het rapport</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <Label>Periode</Label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger>
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
                <div>
                  <Label>Van</Label>
                  <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>
                <div>
                  <Label>Tot</Label>
                  <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </div>
              </>
            )}
            <div className="flex items-end">
              <Button onClick={handleExport} className="w-full">
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totaal Uren</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalHours}u {totalMins}m
            </div>
            <p className="text-xs text-muted-foreground">{completedShifts.length} shifts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Medewerkers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profiles.length}</div>
            <p className="text-xs text-muted-foreground">actieve medewerkers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gem. Shift</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {completedShifts.length > 0
                ? `${Math.floor(totalMinutes / completedShifts.length / 60)}u ${Math.floor((totalMinutes / completedShifts.length) % 60)}m`
                : "0u 0m"}
            </div>
            <p className="text-xs text-muted-foreground">gemiddelde duur</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Shifts</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedShifts.length}</div>
            <p className="text-xs text-muted-foreground">voltooide shifts</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Uren per Medewerker</CardTitle>
            <CardDescription>Gewerkte uren per medewerker</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={employeeHours.filter((e) => e.hours > 0)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
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
            <CardDescription>Laatste 7 dagen</CardDescription>
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
        </TabsContent>

        <TabsContent value="weekly" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Week Rapport</CardTitle>
                  <CardDescription>
                    Week van {currentWeekStart.toLocaleDateString("nl-NL")} tot{" "}
                    {currentWeekEnd.toLocaleDateString("nl-NL")}
                  </CardDescription>
                </div>
                <Button onClick={handleExportWeekly}>
                  <FileText className="w-4 h-4 mr-2" />
                  Export Week Rapport
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3 mb-6">
                <div className="rounded-lg border border-border bg-card p-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
                    <Clock className="w-4 h-4" />
                    Totaal Uren
                  </div>
                  <div className="text-2xl font-bold">
                    {weeklyHours}u {weeklyMins}m
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{weeklyShifts.length} shifts</p>
                </div>

                <div className="rounded-lg border border-border bg-card p-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
                    <Users className="w-4 h-4" />
                    Actieve Medewerkers
                  </div>
                  <div className="text-2xl font-bold">
                    {weeklyEmployeeReport.filter((e) => e.hours > 0).length}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">hebben gewerkt</p>
                </div>

                <div className="rounded-lg border border-border bg-card p-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
                    <TrendingUp className="w-4 h-4" />
                    Gem. per Medewerker
                  </div>
                  <div className="text-2xl font-bold">
                    {weeklyEmployeeReport.filter((e) => e.hours > 0).length > 0
                      ? `${Math.round((weeklyMinutes / 60 / weeklyEmployeeReport.filter((e) => e.hours > 0).length) * 10) / 10}u`
                      : "0u"}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">gemiddeld</p>
                </div>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Uren per Medewerker - Deze Week</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={weeklyEmployeeReport.filter((e) => e.hours > 0)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="hours" fill="hsl(var(--primary))" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Week Overzicht per Medewerker</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {weeklyEmployeeReport
                      .sort((a, b) => b.hours - a.hours)
                      .map((emp) => (
                        <div
                          key={emp.name}
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                        >
                          <div>
                            <p className="font-semibold">{emp.name}</p>
                            <p className="text-sm text-muted-foreground">{emp.shifts} shift{emp.shifts !== 1 ? "s" : ""}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold">{emp.hours}u</p>
                            <p className="text-xs text-muted-foreground">{emp.minutes} minuten</p>
                          </div>
                        </div>
                      ))}
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

