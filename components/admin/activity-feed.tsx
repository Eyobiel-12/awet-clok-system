"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, User, LogOut, LogIn, Calendar } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { nl } from "date-fns/locale"
import type { Shift, Profile } from "@/lib/types"

interface ActivityFeedProps {
  shifts: Shift[]
  profiles: Profile[]
}

export function ActivityFeed({ shifts, profiles }: ActivityFeedProps) {
  // Get recent activities (last 10 shifts)
  const recentShifts = shifts
    .sort((a, b) => new Date(b.clock_in).getTime() - new Date(a.clock_in).getTime())
    .slice(0, 10)

  const getActivityIcon = (shift: Shift) => {
    if (!shift.clock_out) {
      return <LogIn className="w-4 h-4 text-success" />
    }
    return <LogOut className="w-4 h-4 text-muted-foreground" />
  }

  const getActivityText = (shift: Shift) => {
    const profile = profiles.find((p) => p.id === shift.user_id)
    const name = profile?.name || "Onbekend"
    
    if (!shift.clock_out) {
      return `${name} is ingelogd`
    }
    return `${name} is uitgelogd`
  }

  const getActivityTime = (shift: Shift) => {
    const time = shift.clock_out ? new Date(shift.clock_out) : new Date(shift.clock_in)
    return formatDistanceToNow(time, { addSuffix: true, locale: nl })
  }

  if (recentShifts.length === 0) {
    return (
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-3 sm:pb-4">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            Recente Activiteit
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">Laatste activiteiten van medewerkers</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-center py-6 sm:py-8">
            <p className="text-sm sm:text-base text-muted-foreground">Geen recente activiteit</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="pb-3 sm:pb-4">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
          Recente Activiteit
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">Laatste activiteiten van medewerkers</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {recentShifts.map((shift, index) => (
            <div
              key={shift.id}
              className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-muted/50 hover:shadow-sm transition-all duration-200 animate-slide-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                {getActivityIcon(shift)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{getActivityText(shift)}</p>
                <p className="text-xs text-muted-foreground">{getActivityTime(shift)}</p>
              </div>
              {!shift.clock_out && (
                <Badge variant="outline" className="bg-success/10 text-success border-success/20 text-xs">
                  Actief
                </Badge>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}



