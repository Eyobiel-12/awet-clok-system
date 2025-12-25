"use client"

import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import type { Shift } from "@/lib/types"

interface ShiftWithProfile extends Shift {
  profiles: {
    id: string
    name: string
    role: string
  } | null
}

interface ExportButtonProps {
  shifts: ShiftWithProfile[]
}

export function ExportButton({ shifts }: ExportButtonProps) {
  const exportToCSV = () => {
    // Define CSV headers
    const headers = ["Medewerker", "Datum", "Dag", "Start Tijd", "Eind Tijd", "Duur (minuten)", "Duur (uren)"]

    // Convert shifts to CSV rows
    const completedShifts = shifts.filter((shift) => shift.clock_out) // Only completed shifts
    const rows = completedShifts.map((shift) => {
        const clockIn = new Date(shift.clock_in)
        const clockOut = shift.clock_out ? new Date(shift.clock_out) : null

        return [
          shift.profiles?.name || "Onbekend",
          clockIn.toLocaleDateString("nl-NL"),
        clockIn.toLocaleDateString("nl-NL", { weekday: "long" }),
          clockIn.toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" }),
          clockOut ? clockOut.toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" }) : "-",
          shift.duration_minutes?.toString() || "0",
          shift.duration_minutes ? (shift.duration_minutes / 60).toFixed(2) : "0",
        ]
      })

    // Calculate totals
    const totalMinutes = completedShifts.reduce((acc, shift) => acc + (shift.duration_minutes || 0), 0)
    const totalHours = (totalMinutes / 60).toFixed(2)

    // Create CSV content with totals
    const csvContent = [
      headers.join(";"),
      ...rows.map((row) => row.join(";")),
      ["", "", "", "", "", "", ""].join(";"),
      ["Totaal", completedShifts.length + " shifts", "", "", "", totalMinutes, totalHours].join(";"),
    ].join("\n")

    // Create and download file
    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)

    const now = new Date()
    const filename = `uren-export-${now.toISOString().split("T")[0]}.csv`

    link.setAttribute("href", url)
    link.setAttribute("download", filename)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <Button variant="outline" onClick={exportToCSV}>
      <Download className="w-4 h-4 mr-2" />
      Export CSV
    </Button>
  )
}
