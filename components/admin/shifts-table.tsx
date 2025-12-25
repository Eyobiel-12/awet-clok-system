"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { updateShift, deleteShift } from "@/app/actions/admin"
import { Pencil, Trash2, Clock, Loader2, Search, Filter, ArrowUpDown, ArrowUp, ArrowDown, FileDown, Users, Calendar, TrendingUp, CheckCircle2, XCircle, Activity, CalendarDays, List, ChevronLeft, ChevronRight } from "lucide-react"
import { Checkbox as CheckboxComponent } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ExportButton } from "./export-button"
import { toast } from "sonner"
import type { Shift } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface ShiftWithProfile extends Shift {
  profiles: {
    id: string
    name: string
    role: string
  } | null
}

interface ShiftsTableProps {
  shifts: ShiftWithProfile[]
}

type SortField = "employee" | "date" | "start" | "end" | "duration" | null
type SortDirection = "asc" | "desc" | null

export function ShiftsTable({ shifts }: ShiftsTableProps) {
  const [viewMode, setViewMode] = useState<"list" | "calendar">("calendar")
  const [editingShift, setEditingShift] = useState<ShiftWithProfile | null>(null)
  const [editClockIn, setEditClockIn] = useState("")
  const [editClockOut, setEditClockOut] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [filterEmployee, setFilterEmployee] = useState("")
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "completed">("all")
  const [dateFilter, setDateFilter] = useState("all")
  const [selectedShifts, setSelectedShifts] = useState<Set<string>>(new Set())
  const [sortField, setSortField] = useState<SortField>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>(null)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  const filteredShifts = shifts.filter((shift) => {
    // Employee filter
    if (filterEmployee && !shift.profiles?.name?.toLowerCase().includes(filterEmployee.toLowerCase())) {
      return false
    }

    // Status filter
    if (filterStatus === "active" && shift.clock_out) return false
    if (filterStatus === "completed" && !shift.clock_out) return false

    // Date filter
    if (dateFilter !== "all") {
      const now = new Date()
      const shiftDate = new Date(shift.clock_in)
      let startDate: Date

      switch (dateFilter) {
        case "today":
          startDate = new Date(now)
          startDate.setHours(0, 0, 0, 0)
          if (shiftDate < startDate) return false
          break
        case "week":
          startDate = new Date(now)
          startDate.setDate(now.getDate() - now.getDay() + 1)
          startDate.setHours(0, 0, 0, 0)
          if (shiftDate < startDate) return false
          break
        case "month":
          startDate = new Date(now.getFullYear(), now.getMonth(), 1)
          if (shiftDate < startDate) return false
          break
      }
    }

    return true
  })

  // Sort shifts
  const sortedShifts = [...filteredShifts].sort((a, b) => {
    if (!sortField || !sortDirection) return 0

    let comparison = 0
    switch (sortField) {
      case "employee":
        comparison = (a.profiles?.name || "").localeCompare(b.profiles?.name || "")
        break
      case "date":
        comparison = new Date(a.clock_in).getTime() - new Date(b.clock_in).getTime()
        break
      case "start":
        comparison = new Date(a.clock_in).getTime() - new Date(b.clock_in).getTime()
        break
      case "end":
        const aEnd = a.clock_out ? new Date(a.clock_out).getTime() : 0
        const bEnd = b.clock_out ? new Date(b.clock_out).getTime() : 0
        comparison = aEnd - bEnd
        break
      case "duration":
        comparison = (a.duration_minutes || 0) - (b.duration_minutes || 0)
        break
    }

    return sortDirection === "asc" ? comparison : -comparison
  })

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortDirection === "asc") {
        setSortDirection("desc")
      } else if (sortDirection === "desc") {
        setSortField(null)
        setSortDirection(null)
      } else {
        setSortDirection("asc")
      }
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3.5 h-3.5 ml-1 text-muted-foreground" />
    }
    if (sortDirection === "asc") {
      return <ArrowUp className="w-3.5 h-3.5 ml-1 text-primary" />
    }
    return <ArrowDown className="w-3.5 h-3.5 ml-1 text-primary" />
  }

  const toggleSelectShift = (shiftId: string) => {
    setSelectedShifts((prev) => {
      const next = new Set(prev)
      if (next.has(shiftId)) {
        next.delete(shiftId)
      } else {
        next.add(shiftId)
      }
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedShifts.size === sortedShifts.length) {
      setSelectedShifts(new Set())
    } else {
      setSelectedShifts(new Set(sortedShifts.map((s) => s.id)))
    }
  }

  const handleBulkDelete = async () => {
    if (selectedShifts.size === 0) return
    if (!confirm(`Weet je zeker dat je ${selectedShifts.size} shift(s) wilt verwijderen?`)) return

    setIsLoading(true)
    const deletePromises = Array.from(selectedShifts).map((id) => deleteShift(id))
    const results = await Promise.allSettled(deletePromises)

    const errors = results.filter((r) => r.status === "rejected")
    if (errors.length > 0) {
      toast.error(`${errors.length} shift(s) konden niet worden verwijderd`)
    } else {
      toast.success(`${selectedShifts.size} shift(s) verwijderd`)
      setSelectedShifts(new Set())
    }

    setIsLoading(false)
  }

  const handleBulkExport = () => {
    const selected = sortedShifts.filter((s) => selectedShifts.has(s.id))
    // Use ExportButton logic here
    const csv = [
      ["Employee", "Clock In", "Clock Out", "Duration (minutes)", "Date"].join(","),
      ...selected.map((shift) => {
        return [
          shift.profiles?.name || "Unknown",
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
    a.download = `selected-shifts-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    toast.success(`${selected.length} shift(s) geëxporteerd`)
  }

  // Calendar helpers
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = (firstDay.getDay() + 6) % 7 // Monday = 0
    
    const days: (Date | null)[] = []
    
    // Add empty slots for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }
    
    // Add all days in month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day))
    }
    
    return days
  }

  const getShiftsForDate = (date: Date) => {
    return filteredShifts.filter(shift => {
      const shiftDate = new Date(shift.clock_in)
      return shiftDate.getDate() === date.getDate() &&
             shiftDate.getMonth() === date.getMonth() &&
             shiftDate.getFullYear() === date.getFullYear()
    })
  }

  const getDayColor = (dayShifts: ShiftWithProfile[]) => {
    if (dayShifts.length === 0) return ""
    const totalHours = dayShifts.reduce((acc, s) => acc + ((s.duration_minutes || 0) / 60), 0)
    const hasActive = dayShifts.some(s => !s.clock_out)
    
    if (hasActive) return "bg-green-100 dark:bg-green-950/40 border-green-500"
    if (totalHours >= 16) return "bg-green-100 dark:bg-green-950/30"
    if (totalHours >= 12) return "bg-blue-100 dark:bg-blue-950/30"
    if (totalHours >= 8) return "bg-yellow-100 dark:bg-yellow-950/30"
    return "bg-orange-100 dark:bg-orange-950/30"
  }

  const calendarDays = getDaysInMonth(currentMonth)

  // Calculate statistics
  const completedShifts = filteredShifts.filter(s => s.clock_out && s.duration_minutes)
  const activeShifts = filteredShifts.filter(s => !s.clock_out)
  const totalMinutes = completedShifts.reduce((acc, s) => acc + (s.duration_minutes || 0), 0)
  const totalHours = Math.floor(totalMinutes / 60)
  const totalMins = totalMinutes % 60
  
  const uniqueEmployees = new Set(filteredShifts.map(s => s.profiles?.id).filter(Boolean))
  
  const avgShiftMinutes = completedShifts.length > 0 ? totalMinutes / completedShifts.length : 0
  const avgHours = Math.floor(avgShiftMinutes / 60)
  const avgMins = Math.round(avgShiftMinutes % 60)

  // Group shifts by day for daily view
  const shiftsByDay = filteredShifts.reduce((acc, shift) => {
    const date = new Date(shift.clock_in).toLocaleDateString("nl-NL")
    if (!acc[date]) acc[date] = []
    acc[date].push(shift)
    return acc
  }, {} as Record<string, ShiftWithProfile[]>)

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return "-"
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours === 0) return `${mins}m`
    return `${hours}u ${mins}m`
  }

  const getHoursColor = (hours: number) => {
    if (hours >= 8) return "text-green-600 dark:text-green-400"
    if (hours >= 6) return "text-blue-600 dark:text-blue-400"
    if (hours >= 4) return "text-yellow-600 dark:text-yellow-400"
    return "text-orange-600 dark:text-orange-400"
  }

  const getHoursBg = (hours: number) => {
    if (hours >= 8) return "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900/50"
    if (hours >= 6) return "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900/50"
    if (hours >= 4) return "bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-900/50"
    return "bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-900/50"
  }

  const toDateTimeLocal = (dateString: string) => {
    const date = new Date(dateString)
    return date.toISOString().slice(0, 16)
  }

  const handleEdit = (shift: ShiftWithProfile) => {
    setEditingShift(shift)
    setEditClockIn(toDateTimeLocal(shift.clock_in))
    setEditClockOut(shift.clock_out ? toDateTimeLocal(shift.clock_out) : "")
  }

  const handleSave = async () => {
    if (!editingShift) return

    setIsLoading(true)
    const result = await updateShift(
      editingShift.id,
      new Date(editClockIn).toISOString(),
      editClockOut ? new Date(editClockOut).toISOString() : null,
    )

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success("Shift bijgewerkt")
      setEditingShift(null)
    }

    setIsLoading(false)
  }

  const handleDelete = async (shiftId: string) => {
    if (!confirm("Weet je zeker dat je deze shift wilt verwijderen?")) return

    setIsLoading(true)
    const result = await deleteShift(shiftId)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success("Shift verwijderd")
    }

    setIsLoading(false)
  }

  return (
    <>
      {/* Statistics Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card className="bg-gradient-to-br from-blue-50 to-card dark:from-blue-950/20 dark:to-card border-blue-200 dark:border-blue-900/50 hover:shadow-lg transition-all duration-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Totaal Uren
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
              {totalHours}u {totalMins}m
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {completedShifts.length} voltooide shifts
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-card dark:from-green-950/20 dark:to-card border-green-200 dark:border-green-900/50 hover:shadow-lg transition-all duration-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="w-4 h-4 text-green-600 dark:text-green-400" />
              Actieve Shifts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700 dark:text-green-300">
              {activeShifts.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {activeShifts.length > 0 ? "Nu aan het werk" : "Geen actieve shifts"}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-card dark:from-purple-950/20 dark:to-card border-purple-200 dark:border-purple-900/50 hover:shadow-lg transition-all duration-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              Medewerkers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
              {uniqueEmployees.size}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Unieke medewerkers
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-card dark:from-orange-950/20 dark:to-card border-orange-200 dark:border-orange-900/50 hover:shadow-lg transition-all duration-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-orange-600 dark:text-orange-400" />
              Gem. Shift
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-700 dark:text-orange-300">
              {avgHours}u {avgMins}m
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Gemiddelde duur
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
        <div className="px-3 sm:px-6 py-3 sm:py-4 border-b border-border bg-gradient-to-r from-card to-muted/20">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-2">
            <div>
              <h3 className="font-semibold flex items-center gap-2 text-sm sm:text-base">
                <Clock className="w-4 h-4 text-primary" />
                Alle Shifts
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {sortedShifts.length} shift{sortedShifts.length !== 1 ? "s" : ""} • 
                {activeShifts.length > 0 && <span className="ml-1 text-green-600 dark:text-green-400 font-medium">{activeShifts.length} actief</span>}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === "calendar" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("calendar")}
                className="h-9 gap-2"
              >
                <CalendarDays className="w-4 h-4" />
                <span className="hidden sm:inline">Kalender</span>
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("list")}
                className="h-9 gap-2"
              >
                <List className="w-4 h-4" />
                <span className="hidden sm:inline">Lijst</span>
              </Button>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Zoek medewerker..."
                  value={filterEmployee}
                  onChange={(e) => setFilterEmployee(e.target.value)}
                  className="pl-9 w-full sm:w-48 h-10"
                />
              </div>
              <Select value={filterStatus} onValueChange={(v: "all" | "active" | "completed") => setFilterStatus(v)}>
                <SelectTrigger className="w-full sm:w-40 h-10">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Shifts</SelectItem>
                  <SelectItem value="active">Actief</SelectItem>
                  <SelectItem value="completed">Voltooid</SelectItem>
                </SelectContent>
              </Select>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-full sm:w-40 h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Datums</SelectItem>
                  <SelectItem value="today">Vandaag</SelectItem>
                  <SelectItem value="week">Deze Week</SelectItem>
                  <SelectItem value="month">Deze Maand</SelectItem>
                </SelectContent>
              </Select>
              <div className="hidden sm:block">
                <ExportButton shifts={filteredShifts} />
              </div>
            </div>
          </div>
          <div className="mt-2 sm:hidden">
            <ExportButton shifts={filteredShifts} />
          </div>
          {selectedShifts.size > 0 && (
            <div className="mt-3 flex items-center justify-between p-3 bg-primary/5 border border-primary/20 rounded-lg">
              <span className="text-sm font-medium">
                {selectedShifts.size} shift{selectedShifts.size !== 1 ? "s" : ""} geselecteerd
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleBulkExport} className="h-8 gap-2">
                  <FileDown className="w-3.5 h-3.5" />
                  Export
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkDelete}
                  disabled={isLoading}
                  className="h-8 gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  {isLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                  Verwijder
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setSelectedShifts(new Set())} className="h-8">
                  Deselecteer
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Calendar View */}
        {viewMode === "calendar" && (
          <div className="p-4 sm:p-6">
            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">
                {currentMonth.toLocaleDateString("nl-NL", { month: "long", year: "numeric" })}
              </h3>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                  className="h-9"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentMonth(new Date())}
                  className="h-9"
                >
                  Vandaag
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                  className="h-9"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="border border-border rounded-lg overflow-hidden">
              {/* Day Headers */}
              <div className="grid grid-cols-7 bg-muted/50 border-b border-border">
                {["Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"].map((day, idx) => (
                  <div
                    key={day}
                    className={cn(
                      "p-2 text-center text-sm font-semibold",
                      idx >= 5 && "bg-muted/80"
                    )}
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Days */}
              <div className="grid grid-cols-7">
                {calendarDays.map((day, index) => {
                  const dayShifts = day ? getShiftsForDate(day) : []
                  const isToday = day && day.toDateString() === new Date().toDateString()
                  const isWeekend = index % 7 >= 5
                  const isSelected = selectedDate && day && day.toDateString() === selectedDate.toDateString()
                  
                  return (
                    <div
                      key={index}
                      className={cn(
                        "min-h-[100px] p-2 border-r border-b border-border transition-all duration-200",
                        !day && "bg-muted/20",
                        day && "hover:bg-accent/50 cursor-pointer",
                        isWeekend && "bg-muted/10",
                        isToday && "ring-2 ring-primary ring-inset",
                        isSelected && "bg-primary/10",
                        dayShifts.length > 0 && getDayColor(dayShifts)
                      )}
                      onClick={() => day && setSelectedDate(day)}
                    >
                      {day && (
                        <>
                          <div className={cn(
                            "text-sm font-medium mb-2",
                            isToday && "text-primary font-bold"
                          )}>
                            {day.getDate()}
                          </div>
                          {dayShifts.length > 0 && (
                            <div className="space-y-1">
                              <div className="text-xs font-semibold text-muted-foreground mb-1">
                                {dayShifts.length} shift{dayShifts.length !== 1 ? "s" : ""}
                              </div>
                              {dayShifts.slice(0, 3).map((shift, idx) => (
                                <div
                                  key={shift.id}
                                  className="text-xs truncate bg-background/60 rounded px-1.5 py-0.5 border border-border/50"
                                >
                                  <span className="font-medium">{shift.profiles?.name}</span>
                                  {shift.clock_out ? (
                                    <span className="ml-1 text-muted-foreground">
                                      {((shift.duration_minutes || 0) / 60).toFixed(1)}u
                                    </span>
                                  ) : (
                                    <span className="ml-1 text-green-600 dark:text-green-400">●</span>
                                  )}
                                </div>
                              ))}
                              {dayShifts.length > 3 && (
                                <div className="text-xs text-muted-foreground">
                                  +{dayShifts.length - 3} meer
                                </div>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Selected Day Details */}
            {selectedDate && (
              <Card className="mt-6 border-primary/50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      {selectedDate.toLocaleDateString("nl-NL", { 
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        year: "numeric"
                      })}
                    </CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedDate(null)}>
                      Sluit
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const dayShifts = getShiftsForDate(selectedDate)
                    if (dayShifts.length === 0) {
                      return <p className="text-muted-foreground text-center py-4">Geen shifts op deze dag</p>
                    }
                    return (
                      <div className="space-y-3">
                        {dayShifts.map(shift => {
                          const hours = shift.duration_minutes ? shift.duration_minutes / 60 : 0
                          return (
                            <div
                              key={shift.id}
                              className={cn(
                                "p-4 rounded-lg border-2 transition-all",
                                !shift.clock_out && "bg-green-50/50 dark:bg-green-950/20 border-green-500/50",
                                shift.clock_out && hours >= 8 && "bg-green-50/30 dark:bg-green-950/10 border-green-200",
                                shift.clock_out && hours >= 6 && hours < 8 && "bg-blue-50/30 dark:bg-blue-950/10 border-blue-200",
                                shift.clock_out && hours >= 4 && hours < 6 && "bg-yellow-50/30 dark:bg-yellow-950/10 border-yellow-200",
                                shift.clock_out && hours < 4 && hours > 0 && "bg-orange-50/30 dark:bg-orange-950/10 border-orange-200"
                              )}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                                    {shift.profiles?.name?.charAt(0).toUpperCase()}
                                  </div>
                                  <span className="font-semibold">{shift.profiles?.name}</span>
                                </div>
                                {!shift.clock_out && (
                                  <Badge className="bg-green-500/10 text-green-700 dark:text-green-400">
                                    <Activity className="w-3 h-3 mr-1 animate-pulse" />
                                    Actief
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-4 text-sm">
                                <div>
                                  <span className="text-muted-foreground">Start:</span>
                                  <Badge variant="outline" className="ml-2 font-mono">
                                    {new Date(shift.clock_in).toLocaleTimeString("nl-NL", {
                                      hour: "2-digit",
                                      minute: "2-digit"
                                    })}
                                  </Badge>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Eind:</span>
                                  {shift.clock_out ? (
                                    <Badge variant="outline" className="ml-2 font-mono">
                                      {new Date(shift.clock_out).toLocaleTimeString("nl-NL", {
                                        hour: "2-digit",
                                        minute: "2-digit"
                                      })}
                                    </Badge>
                                  ) : (
                                    <span className="ml-2 text-muted-foreground">-</span>
                                  )}
                                </div>
                                {shift.duration_minutes && (
                                  <div>
                                    <span className="text-muted-foreground">Duur:</span>
                                    <Badge 
                                      className={cn(
                                        "ml-2 font-semibold",
                                        hours >= 8 && "bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400",
                                        hours >= 6 && hours < 8 && "bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400",
                                        hours >= 4 && hours < 6 && "bg-yellow-100 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-400",
                                        hours < 4 && "bg-orange-100 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400"
                                      )}
                                    >
                                      {formatDuration(shift.duration_minutes)}
                                    </Badge>
                                  </div>
                                )}
                              </div>
                              <div className="flex gap-2 mt-3 pt-3 border-t border-current/10">
                                <Button variant="outline" size="sm" onClick={() => handleEdit(shift)}>
                                  <Pencil className="w-3.5 h-3.5 mr-2" />
                                  Bewerken
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-destructive hover:text-destructive"
                                  onClick={() => handleDelete(shift.id)}
                                >
                                  <Trash2 className="w-3.5 h-3.5 mr-2" />
                                  Verwijderen
                                </Button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )
                  })()}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Desktop Table View */}
        {viewMode === "list" && (
          <div className="hidden md:block overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-12">
                  <CheckboxComponent
                    checked={selectedShifts.size === sortedShifts.length && sortedShifts.length > 0}
                    onCheckedChange={toggleSelectAll}
                    className="ripple"
                  />
                </TableHead>
                <TableHead>
                  <button
                    onClick={() => handleSort("employee")}
                    className="flex items-center hover:text-primary transition-colors"
                  >
                    Medewerker
                    {getSortIcon("employee")}
                  </button>
                </TableHead>
                <TableHead>
                  <button
                    onClick={() => handleSort("date")}
                    className="flex items-center hover:text-primary transition-colors"
                  >
                    Datum
                    {getSortIcon("date")}
                  </button>
                </TableHead>
                <TableHead>
                  <button
                    onClick={() => handleSort("start")}
                    className="flex items-center hover:text-primary transition-colors"
                  >
                    Start
                    {getSortIcon("start")}
                  </button>
                </TableHead>
                <TableHead>
                  <button
                    onClick={() => handleSort("end")}
                    className="flex items-center hover:text-primary transition-colors"
                  >
                    Eind
                    {getSortIcon("end")}
                  </button>
                </TableHead>
                <TableHead>
                  <button
                    onClick={() => handleSort("duration")}
                    className="flex items-center hover:text-primary transition-colors"
                  >
                    Duur
                    {getSortIcon("duration")}
                  </button>
                </TableHead>
                <TableHead className="text-right">Acties</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedShifts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    Geen shifts gevonden
                  </TableCell>
                </TableRow>
              ) : (
                sortedShifts.map((shift, index) => {
                  const hours = shift.duration_minutes ? shift.duration_minutes / 60 : 0
                  const isActive = !shift.clock_out
                  return (
                    <TableRow
                      key={shift.id}
                      className={cn(
                        "transition-all duration-200",
                        isActive && "bg-green-50/50 dark:bg-green-950/20 border-l-2 border-l-green-500",
                        !isActive && hours >= 8 && "hover:bg-green-50/50 dark:hover:bg-green-950/20",
                        !isActive && hours >= 6 && hours < 8 && "hover:bg-blue-50/50 dark:hover:bg-blue-950/20",
                        !isActive && hours >= 4 && hours < 6 && "hover:bg-yellow-50/50 dark:hover:bg-yellow-950/20",
                        !isActive && hours < 4 && hours > 0 && "hover:bg-orange-50/50 dark:hover:bg-orange-950/20",
                        selectedShifts.has(shift.id) && "bg-primary/5 border-l-2 border-l-primary"
                      )}
                    >
                      <TableCell>
                        <CheckboxComponent
                          checked={selectedShifts.has(shift.id)}
                          onCheckedChange={() => toggleSelectShift(shift.id)}
                          className="ripple"
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                            {shift.profiles?.name?.charAt(0).toUpperCase() || "?"}
                          </div>
                          <span className="font-medium">{shift.profiles?.name || "Onbekend"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {new Date(shift.clock_in).toLocaleDateString("nl-NL", {
                              day: "2-digit",
                              month: "short",
                            })}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(shift.clock_in).toLocaleDateString("nl-NL", { weekday: "short" })}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="tabular-nums">
                        <Badge variant="outline" className="font-mono">
                          {new Date(shift.clock_in).toLocaleTimeString("nl-NL", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </Badge>
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {shift.clock_out ? (
                          <Badge variant="outline" className="font-mono">
                            {new Date(shift.clock_out).toLocaleTimeString("nl-NL", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </Badge>
                        ) : (
                          <Badge className="bg-green-500/10 text-green-700 dark:text-green-400 hover:bg-green-500/20 border-green-500/20">
                            <Activity className="w-3 h-3 mr-1 animate-pulse" />
                            Actief
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {shift.duration_minutes ? (
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant="secondary" 
                              className={cn(
                                "font-semibold tabular-nums",
                                hours >= 8 && "bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400 border-green-300 dark:border-green-800",
                                hours >= 6 && hours < 8 && "bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-800",
                                hours >= 4 && hours < 6 && "bg-yellow-100 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-400 border-yellow-300 dark:border-yellow-800",
                                hours < 4 && "bg-orange-100 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400 border-orange-300 dark:border-orange-800"
                              )}
                            >
                              {formatDuration(shift.duration_minutes)}
                            </Badge>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 ripple hover:bg-primary/10"
                            onClick={() => handleEdit(shift)}
                          >
                            <Pencil className="w-4 h-4 transition-transform duration-200 hover:scale-110" />
                            <span className="sr-only">Bewerk shift</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 ripple"
                            onClick={() => handleDelete(shift.id)}
                          >
                            <Trash2 className="w-4 h-4 transition-transform duration-200 hover:scale-110" />
                            <span className="sr-only">Verwijder shift</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
          </div>
        )}

        {/* Mobile Card View */}
        {viewMode === "list" && (
          <div className="md:hidden p-3 sm:p-4 space-y-3">
          {filteredShifts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Geen shifts gevonden
            </div>
          ) : (
            sortedShifts.map((shift) => {
              const hours = shift.duration_minutes ? shift.duration_minutes / 60 : 0
              const isActive = !shift.clock_out
              return (
                <div
                  key={shift.id}
                  className={cn(
                    "rounded-xl border p-4 space-y-3 transition-all duration-200",
                    isActive && "bg-green-50/50 dark:bg-green-950/20 border-green-500/50 shadow-sm",
                    !isActive && hours >= 8 && "bg-green-50/30 dark:bg-green-950/10 border-green-200 dark:border-green-900/50",
                    !isActive && hours >= 6 && hours < 8 && "bg-blue-50/30 dark:bg-blue-950/10 border-blue-200 dark:border-blue-900/50",
                    !isActive && hours >= 4 && hours < 6 && "bg-yellow-50/30 dark:bg-yellow-950/10 border-yellow-200 dark:border-yellow-900/50",
                    !isActive && hours < 4 && hours > 0 && "bg-orange-50/30 dark:bg-orange-950/10 border-orange-200 dark:border-orange-900/50",
                    !isActive && hours === 0 && "bg-card border-border"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                        {shift.profiles?.name?.charAt(0).toUpperCase() || "?"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm truncate">{shift.profiles?.name || "Onbekend"}</h4>
                        <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                          {new Date(shift.clock_in).toLocaleDateString("nl-NL", {
                            day: "2-digit",
                            month: "short",
                          })} • {new Date(shift.clock_in).toLocaleDateString("nl-NL", { weekday: "short" })}
                        </p>
                      </div>
                    </div>
                    {isActive && (
                      <Badge className="bg-green-500/10 text-green-700 dark:text-green-400 hover:bg-green-500/20 border-green-500/20">
                        <Activity className="w-3 h-3 mr-1 animate-pulse" />
                        Actief
                      </Badge>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div className="text-center p-2 rounded-lg bg-background/50">
                      <p className="text-xs text-muted-foreground mb-1">Start</p>
                      <Badge variant="outline" className="font-mono text-xs">
                        {new Date(shift.clock_in).toLocaleTimeString("nl-NL", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </Badge>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-background/50">
                      <p className="text-xs text-muted-foreground mb-1">Eind</p>
                      {shift.clock_out ? (
                        <Badge variant="outline" className="font-mono text-xs">
                          {new Date(shift.clock_out).toLocaleTimeString("nl-NL", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">-</span>
                      )}
                    </div>
                    <div className="text-center p-2 rounded-lg bg-background/50">
                      <p className="text-xs text-muted-foreground mb-1">Duur</p>
                      {shift.duration_minutes ? (
                        <Badge 
                          className={cn(
                            "font-semibold text-xs",
                            hours >= 8 && "bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400",
                            hours >= 6 && hours < 8 && "bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400",
                            hours >= 4 && hours < 6 && "bg-yellow-100 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-400",
                            hours < 4 && "bg-orange-100 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400"
                          )}
                        >
                          {formatDuration(shift.duration_minutes)}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">-</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2 pt-2 border-t border-current/10">
                    <Button variant="outline" size="sm" className="flex-1 h-9" onClick={() => handleEdit(shift)}>
                      <Pencil className="w-3.5 h-3.5 mr-2" />
                      Bewerken
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 h-9 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleDelete(shift.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-2" />
                      Verwijderen
                    </Button>
                  </div>
                </div>
              )
            })
          )}
          </div>
        )}
      </div>

      <Dialog open={!!editingShift} onOpenChange={() => setEditingShift(null)}>
        <DialogContent className="max-w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Shift Bewerken</DialogTitle>
            <DialogDescription className="text-sm">
              Pas de start- en eindtijd van de shift aan voor {editingShift?.profiles?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="clock-in" className="text-sm">Start Tijd</Label>
              <Input
                id="clock-in"
                type="datetime-local"
                value={editClockIn}
                onChange={(e) => setEditClockIn(e.target.value)}
                className="h-11"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="clock-out" className="text-sm">Eind Tijd</Label>
              <Input
                id="clock-out"
                type="datetime-local"
                value={editClockOut}
                onChange={(e) => setEditClockOut(e.target.value)}
                className="h-11"
              />
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setEditingShift(null)} className="w-full sm:w-auto h-11">
              Annuleren
            </Button>
            <Button onClick={handleSave} disabled={isLoading} className="w-full sm:w-auto h-11">
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Opslaan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
