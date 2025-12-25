"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Download, FileText, Calendar, Users, Sparkles } from "lucide-react"

interface ExportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onExport: (options: ExportOptions) => void
  dateRange: { start: Date; end: Date }
  employeeCount: number
  shiftCount: number
}

export interface ExportOptions {
  format: "csv" | "detailed"
  includeDetails: boolean
  includeSummary: boolean
  includeDailyBreakdown: boolean
  dateRange: { start: Date; end: Date }
}

export function ExportDialog({ open, onOpenChange, onExport, dateRange, employeeCount, shiftCount }: ExportDialogProps) {
  const [format, setFormat] = useState<"csv" | "detailed">("detailed")
  const [includeDetails, setIncludeDetails] = useState(true)
  const [includeSummary, setIncludeSummary] = useState(true)
  const [includeDailyBreakdown, setIncludeDailyBreakdown] = useState(true)

  const handleExport = () => {
    onExport({
      format,
      includeDetails,
      includeSummary,
      includeDailyBreakdown,
      dateRange,
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Download className="w-5 h-5 text-primary" />
            Data Exporteren
          </DialogTitle>
          <DialogDescription className="pt-2">
            Kies exportopties en format voor uw rapport. Selecteer welke secties u wilt opnemen.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Date Range Info */}
          <div className="rounded-lg bg-muted/50 p-4 border border-border">
            <div className="flex items-center gap-2 text-sm font-medium mb-2">
              <Calendar className="w-4 h-4 text-primary" />
              Periode
            </div>
            <div className="text-sm text-muted-foreground">
              {dateRange.start.toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" })} - {" "}
              {dateRange.end.toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" })}
            </div>
            <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                <span>{employeeCount} medewerkers</span>
              </div>
              <div className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                <span>{shiftCount} shifts</span>
              </div>
            </div>
          </div>

          {/* Export Format */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Export Format</Label>
            <Select value={format} onValueChange={(val) => setFormat(val as "csv" | "detailed")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    <span>CSV Standaard</span>
                  </div>
                </SelectItem>
                <SelectItem value="detailed">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    <span>CSV Gedetailleerd</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {format === "csv" 
                ? "Basis export met alle shifts en totals"
                : "Uitgebreide export met dagelijkse breakdowns en extra statistieken"}
            </p>
          </div>

          {/* Include Options */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Op te nemen secties</Label>
            
            <div className="space-y-3">
              <div className="flex items-start space-x-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                <Checkbox
                  id="details"
                  checked={includeDetails}
                  onCheckedChange={(checked) => setIncludeDetails(checked as boolean)}
                  className="mt-0.5"
                />
                <div className="flex-1 space-y-1">
                  <Label htmlFor="details" className="text-sm font-medium cursor-pointer">
                    Gedetailleerde Shift Lijst
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Alle individuele shifts met start/eind tijden en duur
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                <Checkbox
                  id="summary"
                  checked={includeSummary}
                  onCheckedChange={(checked) => setIncludeSummary(checked as boolean)}
                  className="mt-0.5"
                />
                <div className="flex-1 space-y-1">
                  <Label htmlFor="summary" className="text-sm font-medium cursor-pointer">
                    Samenvatting & Totals
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Totaal uren, shifts, gemiddelden per medewerker
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                <Checkbox
                  id="breakdown"
                  checked={includeDailyBreakdown}
                  onCheckedChange={(checked) => setIncludeDailyBreakdown(checked as boolean)}
                  className="mt-0.5"
                />
                <div className="flex-1 space-y-1">
                  <Label htmlFor="breakdown" className="text-sm font-medium cursor-pointer">
                    Dagelijkse Breakdown
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Uren per dag per medewerker in tabelformaat
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuleren
          </Button>
          <Button onClick={handleExport} className="gap-2">
            <Download className="w-4 h-4" />
            Exporteren
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

