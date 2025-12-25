"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Download, Calendar, TrendingUp, Users, Clock, FileText, Table as TableIcon, Search, ArrowUpDown, User } from "lucide-react"
import type { Shift, Profile } from "@/lib/types"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ExportDialog, type ExportOptions } from "@/components/admin/export-dialog"
import { toast } from "sonner"

interface ReportsPanelProps {
  shifts: Shift[]
  profiles: Profile[]
}

export function ReportsPanel({ shifts, profiles }: ReportsPanelProps) {
  // General filter state
  const [dateRange, setDateRange] = useState("all")
  const [generalStartDate, setGeneralStartDate] = useState("")
  const [generalEndDate, setGeneralEndDate] = useState("")
  
  // Daily breakdown filter state (separate from general)
  const [breakdownStartDate, setBreakdownStartDate] = useState(() => {
    const date = new Date()
    date.setDate(date.getDate() - date.getDay() + 1) // Monday of this week
    return date.toISOString().split('T')[0]
  })
  const [breakdownEndDate, setBreakdownEndDate] = useState(() => {
    const date = new Date()
    date.setDate(date.getDate() - date.getDay() + 7) // Sunday of this week
    return date.toISOString().split('T')[0]
  })
  
  const [searchEmployee, setSearchEmployee] = useState("")
  const [sortBy, setSortBy] = useState<"name" | "total">("name")
  const [exportDialogOpen, setExportDialogOpen] = useState(false)

  // Get filtered shifts for general reports
  const getFilteredShifts = useMemo(() => {
    const now = new Date()
    let start: Date | null = null
    let end: Date | null = null

    switch (dateRange) {
      case "today":
        start = new Date(now)
        start.setHours(0, 0, 0, 0)
        end = new Date(now)
        end.setHours(23, 59, 59, 999)
        break
      case "week":
        start = new Date(now)
        start.setDate(now.getDate() - now.getDay() + 1) // Monday
        start.setHours(0, 0, 0, 0)
        end = new Date(start)
        end.setDate(end.getDate() + 6) // Sunday
        end.setHours(23, 59, 59, 999)
        break
      case "month":
        start = new Date(now.getFullYear(), now.getMonth(), 1)
        start.setHours(0, 0, 0, 0)
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        end.setHours(23, 59, 59, 999)
        break
      case "custom":
        if (generalStartDate && generalEndDate) {
          start = new Date(generalStartDate)
          start.setHours(0, 0, 0, 0)
          end = new Date(generalEndDate)
          end.setHours(23, 59, 59, 999)
        }
        break
      case "all":
      default:
        // No filtering - show all data
        break
    }

    if (start && end) {
      return shifts.filter(
        (s) => {
          const shiftDate = new Date(s.clock_in)
          return shiftDate >= start! && shiftDate <= end!
        }
      )
    }
    
    return shifts // Return all shifts if no filter
  }, [shifts, dateRange, generalStartDate, generalEndDate])

  const completedShifts = getFilteredShifts.filter((s) => s.clock_out && s.duration_minutes)

  // Calculate totals
  const totalMinutes = completedShifts.reduce((acc, s) => acc + (s.duration_minutes || 0), 0)
  const totalHours = Math.floor(totalMinutes / 60)
  const totalMins = totalMinutes % 60

  // Get date range for daily breakdown
  const breakdownStart = useMemo(() => {
    const date = new Date(breakdownStartDate)
    date.setHours(0, 0, 0, 0)
    return date
  }, [breakdownStartDate])
  
  const breakdownEnd = useMemo(() => {
    const date = new Date(breakdownEndDate)
    date.setHours(23, 59, 59, 999)
    return date
  }, [breakdownEndDate])

  // Get all days in breakdown date range
  const breakdownDays = useMemo(() => {
    const days: Date[] = []
    const current = new Date(breakdownStart)
    
    while (current <= breakdownEnd) {
      days.push(new Date(current))
      current.setDate(current.getDate() + 1)
    }
    
    return days
  }, [breakdownStart, breakdownEnd])

  // Filter shifts for breakdown period
  const breakdownShifts = useMemo(() => {
    return completedShifts.filter((s) => {
      const shiftDate = new Date(s.clock_in)
      return shiftDate >= breakdownStart && shiftDate <= breakdownEnd
    })
  }, [completedShifts, breakdownStart, breakdownEnd])

  // Daily breakdown per employee
  const dailyBreakdown = useMemo(() => {
    return profiles.map((profile) => {
      const employeeShifts = breakdownShifts.filter((s) => s.user_id === profile.id)
      
      // Calculate hours per day
      const dailyHours = breakdownDays.map((day) => {
        const dayStart = new Date(day)
        dayStart.setHours(0, 0, 0, 0)
        const dayEnd = new Date(day)
        dayEnd.setHours(23, 59, 59, 999)
        
        const dayShifts = employeeShifts.filter((shift) => {
          const shiftDate = new Date(shift.clock_in)
          return shiftDate >= dayStart && shiftDate <= dayEnd
        })

        return dayShifts.reduce((acc, shift) => acc + (shift.duration_minutes || 0) / 60, 0)
      })

      const totalHours = dailyHours.reduce((acc, hours) => acc + hours, 0)
      const daysWorked = dailyHours.filter(h => h > 0).length

    return {
        employee: profile.name,
        employeeId: profile.id,
        dailyHours,
        totalHours,
        daysWorked,
      }
    })
  }, [profiles, breakdownShifts, breakdownDays])

  // Filter and sort daily breakdown
  const filteredDailyBreakdown = useMemo(() => {
    return dailyBreakdown
      .filter(emp => {
        if (searchEmployee && !emp.employee.toLowerCase().includes(searchEmployee.toLowerCase())) {
          return false
        }
        return emp.totalHours > 0 // Only show employees who worked
      })
      .sort((a, b) => {
        if (sortBy === "total") {
          return b.totalHours - a.totalHours
        }
        return a.employee.localeCompare(b.employee)
      })
  }, [dailyBreakdown, searchEmployee, sortBy])

  // Calculate daily totals
  const dailyTotals = useMemo(() => {
    return breakdownDays.map((_, dayIdx) => {
      return filteredDailyBreakdown.reduce((acc, emp) => acc + emp.dailyHours[dayIdx], 0)
    })
  }, [filteredDailyBreakdown, breakdownDays])

  // Helper functions for colors
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

  // Export functions
  const handleExport = (options: ExportOptions) => {
    const lines: string[] = []
    
    // BOM for Excel UTF-8 support
    lines.push("\ufeff")
    
    // Header section
    lines.push("Massawa Time Tracking - Rapport")
    lines.push(`Periode: ${options.dateRange.start.toLocaleDateString("nl-NL")} - ${options.dateRange.end.toLocaleDateString("nl-NL")}`)
    lines.push(`Geëxporteerd op: ${new Date().toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}`)
    lines.push("")

    if (options.includeDetails) {
      // Detailed shift list
      lines.push("=== GEDETAILLEERDE SHIFT LIJST ===")
      lines.push("")
      lines.push(["Medewerker", "Datum", "Dag", "Start Tijd", "Eind Tijd", "Duur (uren)", "Duur (minuten)"].join(";"))
      
      const exportStart = new Date(options.dateRange.start)
      exportStart.setHours(0, 0, 0, 0)
      const exportEnd = new Date(options.dateRange.end)
      exportEnd.setHours(23, 59, 59, 999)
      
      const exportShifts = completedShifts.filter((s) => {
        const shiftDate = new Date(s.clock_in)
        return shiftDate >= exportStart && shiftDate <= exportEnd
      })
      
      exportShifts.forEach((shift) => {
        const profile = profiles.find((p) => p.id === shift.user_id)
        const clockIn = new Date(shift.clock_in)
        const clockOut = shift.clock_out ? new Date(shift.clock_out) : null
        
        lines.push([
          `"${profile?.name || "Onbekend"}"`,
          clockIn.toLocaleDateString("nl-NL"),
          clockIn.toLocaleDateString("nl-NL", { weekday: "long" }),
          clockIn.toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" }),
          clockOut ? clockOut.toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" }) : "-",
          shift.duration_minutes ? (shift.duration_minutes / 60).toFixed(2) : "0",
          shift.duration_minutes?.toString() || "0",
        ].join(";"))
      })
      
      lines.push("")
      lines.push("")
    }

    if (options.includeSummary) {
      // Summary section
      lines.push("=== SAMENVATTING ===")
      lines.push("")
      
      const exportStart = new Date(options.dateRange.start)
      exportStart.setHours(0, 0, 0, 0)
      const exportEnd = new Date(options.dateRange.end)
      exportEnd.setHours(23, 59, 59, 999)
      
      const summaryShifts = completedShifts.filter((s) => {
        const shiftDate = new Date(s.clock_in)
        return shiftDate >= exportStart && shiftDate <= exportEnd
      })
      
      const summaryMinutes = summaryShifts.reduce((acc, s) => acc + (s.duration_minutes || 0), 0)
      const summaryHours = Math.floor(summaryMinutes / 60)
      const summaryMins = summaryMinutes % 60
      
      lines.push(`Totaal Shifts: ${summaryShifts.length}`)
      lines.push(`Totaal Minuten: ${summaryMinutes}`)
      lines.push(`Totaal Uren: ${summaryHours}u ${summaryMins}m`)
      lines.push(`Gemiddelde per Shift: ${summaryShifts.length > 0 ? (summaryMinutes / summaryShifts.length / 60).toFixed(2) : "0"} uur`)
      lines.push("")
      
      // Per employee summary
      lines.push("=== PER MEDEWERKER ===")
      lines.push(["Medewerker", "Shifts", "Totaal Uren", "Totaal Minuten", "Gem. per Shift (uren)"].join(";"))
      
      profiles.forEach((profile) => {
        const empShifts = summaryShifts.filter((s) => s.user_id === profile.id)
        if (empShifts.length === 0) return
        
        const empMinutes = empShifts.reduce((acc, s) => acc + (s.duration_minutes || 0), 0)
        const empHours = Math.floor(empMinutes / 60)
        const empMins = empMinutes % 60
        
        lines.push([
          `"${profile.name}"`,
          empShifts.length.toString(),
          `${empHours}u ${empMins}m`,
          empMinutes.toString(),
          (empMinutes / empShifts.length / 60).toFixed(2),
        ].join(";"))
      })
      
      lines.push("")
      lines.push("")
    }

    if (options.includeDailyBreakdown) {
      // Daily breakdown section
      lines.push("=== DAGELIJKSE BREAKDOWN ===")
      lines.push("")
      
      const breakdownDaysExport = breakdownDays
      const headerRow = [
        "Medewerker",
        ...breakdownDaysExport.map((day) => day.toLocaleDateString("nl-NL", { weekday: "short", day: "numeric", month: "short" })),
        "Totaal (uren)",
        "Werkdagen"
      ]
      lines.push(headerRow.join(";"))
      
      // Use all employees for export, not just filtered ones
      const exportBreakdown = dailyBreakdown.filter(emp => emp.totalHours > 0)
      
      exportBreakdown.forEach((emp) => {
        const row = [
          `"${emp.employee}"`,
          ...emp.dailyHours.map((hours) => hours.toFixed(2)),
          emp.totalHours.toFixed(2),
          emp.daysWorked.toString(),
        ]
        lines.push(row.join(";"))
      })
      
      // Recalculate totals for export (all employees, not just filtered)
      const exportDailyTotals = breakdownDays.map((_, dayIdx) => {
        return exportBreakdown.reduce((acc, emp) => acc + emp.dailyHours[dayIdx], 0)
      })
      
      // Daily totals row (using export totals)
      lines.push([
        "Totaal per Dag",
        ...exportDailyTotals.map((total) => total.toFixed(2)),
        exportDailyTotals.reduce((a, b) => a + b, 0).toFixed(2),
        "",
      ].join(";"))
      
      lines.push("")
    }

    // Create and download file
    const csvContent = lines.join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    
    const filename = `massawa-rapport-${options.dateRange.start.toISOString().split("T")[0]}-${options.dateRange.end.toISOString().split("T")[0]}.csv`
    a.href = url
    a.download = filename
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const handleExportClick = () => {
    // Determine export date range based on current filter
    let exportStart: Date
    let exportEnd: Date
    
    if (dateRange === "all") {
      // Use breakdown date range for export
      exportStart = breakdownStart
      exportEnd = breakdownEnd
    } else {
      // Use general filter date range
      const now = new Date()
      switch (dateRange) {
        case "today":
          exportStart = new Date(now)
          exportStart.setHours(0, 0, 0, 0)
          exportEnd = new Date(now)
          exportEnd.setHours(23, 59, 59, 999)
          break
        case "week":
          exportStart = new Date(now)
          exportStart.setDate(now.getDate() - now.getDay() + 1)
          exportStart.setHours(0, 0, 0, 0)
          exportEnd = new Date(exportStart)
          exportEnd.setDate(exportEnd.getDate() + 6)
          exportEnd.setHours(23, 59, 59, 999)
          break
        case "month":
          exportStart = new Date(now.getFullYear(), now.getMonth(), 1)
          exportStart.setHours(0, 0, 0, 0)
          exportEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
          exportEnd.setHours(23, 59, 59, 999)
          break
        case "custom":
          if (generalStartDate && generalEndDate) {
            exportStart = new Date(generalStartDate)
            exportStart.setHours(0, 0, 0, 0)
            exportEnd = new Date(generalEndDate)
            exportEnd.setHours(23, 59, 59, 999)
          } else {
            exportStart = breakdownStart
            exportEnd = breakdownEnd
          }
          break
        default:
          exportStart = breakdownStart
          exportEnd = breakdownEnd
      }
    }
    
    setExportDialogOpen(true)
  }

  // Get export date range for dialog
  const getExportDateRange = () => {
    if (dateRange === "all") {
      return { start: breakdownStart, end: breakdownEnd }
    }
    
    const now = new Date()
    switch (dateRange) {
      case "today": {
        const start = new Date(now)
        start.setHours(0, 0, 0, 0)
        const end = new Date(now)
        end.setHours(23, 59, 59, 999)
        return { start, end }
      }
      case "week": {
        const start = new Date(now)
        start.setDate(now.getDate() - now.getDay() + 1)
        start.setHours(0, 0, 0, 0)
        const end = new Date(start)
        end.setDate(end.getDate() + 6)
        end.setHours(23, 59, 59, 999)
        return { start, end }
      }
      case "month": {
        const start = new Date(now.getFullYear(), now.getMonth(), 1)
        start.setHours(0, 0, 0, 0)
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        end.setHours(23, 59, 59, 999)
        return { start, end }
      }
      case "custom":
        if (generalStartDate && generalEndDate) {
          const start = new Date(generalStartDate)
          start.setHours(0, 0, 0, 0)
          const end = new Date(generalEndDate)
          end.setHours(23, 59, 59, 999)
          return { start, end }
        }
        return { start: breakdownStart, end: breakdownEnd }
      default:
        return { start: breakdownStart, end: breakdownEnd }
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6 w-full">
      <Tabs defaultValue="general" className="space-y-4 sm:space-y-6">
        <TabsList className="grid w-full grid-cols-2 h-auto p-1">
          <TabsTrigger value="general" className="text-xs sm:text-sm py-2 sm:py-2.5">
            Algemeen Rapport
          </TabsTrigger>
          <TabsTrigger value="daily" className="text-xs sm:text-sm py-2 sm:py-2.5">
            Dagelijkse Breakdown
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
                      <SelectItem value="all">Alle Data</SelectItem>
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
                        value={generalStartDate} 
                        onChange={(e) => setGeneralStartDate(e.target.value)}
                        className="h-10 sm:h-11"
                      />
                    </div>
                    <div className="sm:col-span-1">
                      <Label className="text-xs sm:text-sm mb-2 block">Tot</Label>
                      <Input 
                        type="date" 
                        value={generalEndDate} 
                        onChange={(e) => setGeneralEndDate(e.target.value)}
                        className="h-10 sm:h-11"
                      />
                    </div>
                  </>
                )}
                <div className={`flex items-end ${dateRange === "custom" ? "sm:col-span-1" : "sm:col-span-2 lg:col-span-1"}`}>
                  <Button onClick={handleExportClick} className="w-full h-10 sm:h-11 gap-2">
                    <Download className="w-4 h-4" />
                    <span className="text-xs sm:text-sm">Export</span>
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
                <p className="text-xs text-muted-foreground">
                  {completedShifts.length} shifts • {dateRange === "all" ? "alle data" : dateRange === "week" ? "deze week" : dateRange === "today" ? "vandaag" : dateRange === "month" ? "deze maand" : "geselecteerd"}
                </p>
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
                  {dailyBreakdown.filter(e => e.totalHours > 0).length}/{profiles.length}
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
                  {dailyBreakdown.filter(e => e.totalHours > 0).length > 0
                    ? `${Math.round(totalMinutes / 60 / dailyBreakdown.filter(e => e.totalHours > 0).length * 10) / 10}u`
                    : "0u"}
            </div>
                <p className="text-xs text-muted-foreground">gemiddeld</p>
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
                  {dailyBreakdown.reduce((acc, emp) => acc + emp.daysWorked, 0)}
                </div>
                <p className="text-xs text-muted-foreground">werkdagen totaal</p>
          </CardContent>
        </Card>
      </div>

          {/* Top Performers */}
          {dailyBreakdown.filter(e => e.totalHours > 0).length > 0 && (
            <Card className="border-border/50 shadow-sm bg-gradient-to-br from-card to-muted/20">
          <CardHeader className="pb-3 sm:pb-4">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <Users className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                  Top Medewerkers
            </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Snelle overzicht van meest actieve medewerkers
                </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
                <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                  {dailyBreakdown
                    .filter(e => e.totalHours > 0)
                    .sort((a, b) => b.totalHours - a.totalHours)
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
                        <Badge variant={emp.totalHours >= 40 ? "default" : "secondary"} className="font-bold">
                          {emp.totalHours.toFixed(1)}u
                        </Badge>
            </div>
                    ))}
            </div>
          </CardContent>
        </Card>
          )}
        </TabsContent>

        <TabsContent value="daily" className="space-y-4 sm:space-y-6">
          {/* Date Range Filter for Daily Breakdown */}
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-3 sm:pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                    <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                    Datum Bereik voor Dagelijkse Breakdown
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm mt-1">
                    Selecteer het datumbereik om alle data te bekijken
                  </CardDescription>
                </div>
                <Button onClick={handleExportClick} className="w-full sm:w-auto gap-2 h-10 sm:h-11">
                  <Download className="w-4 h-4" />
                  <span className="text-xs sm:text-sm">Export</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                <div>
                  <Label className="text-xs sm:text-sm mb-2 block">Van Datum</Label>
                  <Input 
                    type="date" 
                    value={breakdownStartDate} 
                    onChange={(e) => setBreakdownStartDate(e.target.value)}
                    className="h-10 sm:h-11"
                  />
                </div>
                <div>
                  <Label className="text-xs sm:text-sm mb-2 block">Tot Datum</Label>
                  <Input 
                    type="date" 
                    value={breakdownEndDate} 
                    onChange={(e) => setBreakdownEndDate(e.target.value)}
                    className="h-10 sm:h-11"
                  />
                </div>
              </div>
              <div className="mt-4 p-3 rounded-lg bg-muted/50 border border-border">
                <p className="text-xs sm:text-sm text-muted-foreground">
                  <strong>Periode:</strong> {breakdownStart.toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" })} - {breakdownEnd.toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" })} 
                  <span className="ml-2">({breakdownDays.length} dagen)</span>
                </p>
                  </div>
                </CardContent>
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
                    Uren per dag per medewerker • <span className="font-medium">{filteredDailyBreakdown.length} medewerkers</span>
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
                      <TableHead className="font-semibold sticky left-0 bg-background z-10 min-w-[150px]">
                        <div className="flex items-center gap-2">
                          <User className="w-3.5 h-3.5" />
                          Medewerker
                          </div>
                      </TableHead>
                      {breakdownDays.map((day, idx) => {
                        const isWeekend = day.getDay() === 0 || day.getDay() === 6
                        return (
                          <TableHead key={idx} className={`text-center font-semibold min-w-[80px] ${isWeekend ? "bg-muted/50" : ""}`}>
                            <div className="flex flex-col items-center">
                              <span className="text-xs">{day.toLocaleDateString("nl-NL", { weekday: "short" })}</span>
                              <span className="text-[10px] font-normal text-muted-foreground">
                                {day.getDate()}/{day.getMonth() + 1}
                              </span>
                          </div>
                          </TableHead>
                        )
                      })}
                      <TableHead className="text-right font-semibold sticky right-0 bg-background z-10">
                        <div className="flex flex-col items-end">
                          <span>Totaal</span>
                          <span className="text-[10px] font-normal text-muted-foreground">Dagen</span>
                        </div>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDailyBreakdown.length > 0 ? (
                      <>
                        {filteredDailyBreakdown.map((emp) => (
                          <TableRow key={emp.employeeId} className="hover:bg-muted/30 transition-colors">
                            <TableCell className="font-medium sticky left-0 bg-background z-10">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                                  {emp.employee.charAt(0).toUpperCase()}
                                </div>
                                <span className="truncate max-w-[150px]">{emp.employee}</span>
                              </div>
                            </TableCell>
                            {emp.dailyHours.map((hours, dayIdx) => {
                              const day = breakdownDays[dayIdx]
                              const isWeekend = day && (day.getDay() === 0 || day.getDay() === 6)
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
                            <TableCell className="text-right sticky right-0 bg-background z-10">
                              <div className="flex flex-col items-end">
                                <Badge variant={emp.totalHours >= 40 ? "default" : emp.totalHours >= 30 ? "secondary" : "outline"} className="font-semibold">
                                  {emp.totalHours.toFixed(1)}u
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
                            const day = breakdownDays[idx]
                            const isWeekend = day && (day.getDay() === 0 || day.getDay() === 6)
                            return (
                              <TableCell key={idx} className={`text-center tabular-nums ${isWeekend ? "bg-muted/50" : ""}`}>
                                <div className="flex flex-col items-center">
                                  <span className="text-sm font-bold">{total > 0 ? total.toFixed(1) : "-"}</span>
                                  {total > 0 && <span className="text-[10px] opacity-70">uur</span>}
                      </div>
                              </TableCell>
                            )
                          })}
                          <TableCell className="text-right sticky right-0 bg-primary/5 z-10">
                            <Badge className="font-bold text-sm">
                              {dailyTotals.reduce((a, b) => a + b, 0).toFixed(1)}u
                            </Badge>
                          </TableCell>
                        </TableRow>
                      </>
                    ) : (
                      <TableRow>
                        <TableCell colSpan={breakdownDays.length + 2} className="text-center text-muted-foreground py-8">
                          {searchEmployee ? `Geen resultaten voor "${searchEmployee}"` : "Geen data voor geselecteerde periode"}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
                  </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Export Dialog */}
      <ExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        onExport={handleExport}
        dateRange={getExportDateRange()}
        employeeCount={filteredDailyBreakdown.length}
        shiftCount={completedShifts.length}
      />
    </div>
  )
}

