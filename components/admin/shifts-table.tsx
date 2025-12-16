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
import { Pencil, Trash2, Clock, Loader2, Search, Filter, ArrowUpDown, ArrowUp, ArrowDown, FileDown } from "lucide-react"
import { Checkbox as CheckboxComponent } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ExportButton } from "./export-button"
import { toast } from "sonner"
import type { Shift } from "@/lib/types"
import { cn } from "@/lib/utils"

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

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return "-"
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours === 0) return `${mins}m`
    return `${hours}u ${mins}m`
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
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-3 sm:px-6 py-3 sm:py-4 border-b border-border">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-2">
            <h3 className="font-semibold flex items-center gap-2 text-sm sm:text-base">
              <Clock className="w-4 h-4 text-primary" />
              Alle Shifts
            </h3>
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

        {/* Desktop Table View */}
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
                sortedShifts.map((shift, index) => (
                  <TableRow
                    key={shift.id}
                    className={cn(
                      "transition-colors hover:bg-muted/50",
                      index === 0 && !shift.clock_out && "bg-success/5",
                      selectedShifts.has(shift.id) && "bg-primary/5"
                    )}
                  >
                    <TableCell>
                      <CheckboxComponent
                        checked={selectedShifts.has(shift.id)}
                        onCheckedChange={() => toggleSelectShift(shift.id)}
                        className="ripple"
                      />
                    </TableCell>
                    <TableCell className="font-medium">{shift.profiles?.name || "Onbekend"}</TableCell>
                    <TableCell>
                      {new Date(shift.clock_in).toLocaleDateString("nl-NL", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {new Date(shift.clock_in).toLocaleTimeString("nl-NL", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {shift.clock_out ? (
                        new Date(shift.clock_out).toLocaleTimeString("nl-NL", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      ) : (
                        <Badge className="bg-success/10 text-success hover:bg-success/20">Actief</Badge>
                      )}
                    </TableCell>
                    <TableCell className="tabular-nums font-medium">{formatDuration(shift.duration_minutes)}</TableCell>
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
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden p-3 sm:p-4 space-y-3">
          {filteredShifts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Geen shifts gevonden
            </div>
          ) : (
            filteredShifts.map((shift, index) => (
              <div
                key={shift.id}
                className={cn(
                  "rounded-lg border border-border bg-card p-4 space-y-3",
                  index === 0 && !shift.clock_out && "bg-success/5 border-success/20"
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm truncate">{shift.profiles?.name || "Onbekend"}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(shift.clock_in).toLocaleDateString("nl-NL", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  {!shift.clock_out && (
                    <Badge className="bg-success/10 text-success hover:bg-success/20 text-xs">Actief</Badge>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Start</p>
                    <p className="font-medium tabular-nums">
                      {new Date(shift.clock_in).toLocaleTimeString("nl-NL", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Eind</p>
                    <p className="font-medium tabular-nums">
                      {shift.clock_out ? (
                        new Date(shift.clock_out).toLocaleTimeString("nl-NL", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Duur</p>
                    <p className="font-semibold tabular-nums">{formatDuration(shift.duration_minutes)}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => handleEdit(shift)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleDelete(shift.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
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
