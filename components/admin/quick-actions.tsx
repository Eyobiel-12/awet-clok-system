"use client"

import { Button } from "@/components/ui/button"
import { Plus, Download, RefreshCw, Search, UserPlus, FileDown } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

export function QuickActions() {
  const router = useRouter()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const handleRefresh = () => {
    setIsRefreshing(true)
    router.refresh()
    setTimeout(() => setIsRefreshing(false), 1000)
    toast.success("Dashboard vernieuwd")
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      // Navigate to shifts page with search query
      router.push(`/admin/shifts?search=${encodeURIComponent(searchQuery)}`)
    }
  }

  return (
    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center">
      {/* Search Bar */}
      <form onSubmit={handleSearch} className="flex-1">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Zoek medewerkers, shifts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10 sm:h-11"
          />
        </div>
      </form>

      {/* Action Buttons */}
      <div className="flex gap-2 sm:gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="gap-2 h-10 sm:h-11 ripple"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
          <span className="hidden sm:inline">Vernieuwen</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/admin/employees")}
          className="gap-2 h-10 sm:h-11 ripple"
        >
          <UserPlus className="w-4 h-4" />
          <span className="hidden sm:inline">Medewerker</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/admin/reports")}
          className="gap-2 h-10 sm:h-11 ripple"
        >
          <FileDown className="w-4 h-4" />
          <span className="hidden sm:inline">Export</span>
        </Button>
      </div>
    </div>
  )
}



