"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { updateUserRole } from "@/app/actions/admin"
import { User, Clock, TrendingUp, Calendar, Edit, Loader2 } from "lucide-react"
import { toast } from "sonner"
import type { Profile, Shift } from "@/lib/types"

interface EmployeeDetailsProps {
  profile: Profile
  shifts: Shift[]
  onUpdate?: () => void
}

export function EmployeeDetails({ profile, shifts, onUpdate }: EmployeeDetailsProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [newRole, setNewRole] = useState<"worker" | "admin">(profile.role)

  const employeeShifts = shifts.filter((s) => s.user_id === profile.id)

  const handleRoleUpdate = async () => {
    setIsLoading(true)
    const result = await updateUserRole(profile.id, newRole)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success("Rol bijgewerkt")
      onUpdate?.()
    }
    setIsLoading(false)
  }

  // Calculate statistics
  const now = new Date()
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - now.getDay() + 1)
  startOfWeek.setHours(0, 0, 0, 0)

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const weeklyShifts = employeeShifts.filter((s) => new Date(s.clock_in) >= startOfWeek && s.duration_minutes)
  const monthlyShifts = employeeShifts.filter((s) => new Date(s.clock_in) >= startOfMonth && s.duration_minutes)

  const weeklyMinutes = weeklyShifts.reduce((acc, s) => acc + (s.duration_minutes || 0), 0)
  const monthlyMinutes = monthlyShifts.reduce((acc, s) => acc + (s.duration_minutes || 0), 0)

  const totalShifts = employeeShifts.length
  const completedShifts = employeeShifts.filter((s) => s.clock_out).length
  const activeShifts = employeeShifts.filter((s) => !s.clock_out).length

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}u ${mins}m`
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Edit className="w-4 h-4 mr-2" />
          Details
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            {profile.name}
          </DialogTitle>
          <DialogDescription>Medewerker details en statistieken</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overzicht</TabsTrigger>
            <TabsTrigger value="statistics">Statistieken</TabsTrigger>
            <TabsTrigger value="shifts">Shifts</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Basis Informatie</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Naam</Label>
                    <p className="text-sm font-medium">{profile.name}</p>
                  </div>
                  <div>
                    <Label>Email</Label>
                    <p className="text-sm text-muted-foreground">{profile.id}</p>
                  </div>
                  <div>
                    <Label>Rol</Label>
                    <div className="flex items-center gap-2 mt-2">
                      <Select value={newRole} onValueChange={(v: "worker" | "admin") => setNewRole(v)}>
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="worker">Worker</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                      {newRole !== profile.role && (
                        <Button size="sm" onClick={handleRoleUpdate} disabled={isLoading}>
                          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Opslaan"}
                        </Button>
                      )}
                    </div>
                  </div>
                  <div>
                    <Label>Account Aangemaakt</Label>
                    <p className="text-sm text-muted-foreground">
                      {new Date(profile.created_at).toLocaleDateString("nl-NL", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Actieve Shifts</span>
                    <Badge variant={activeShifts > 0 ? "default" : "secondary"}>{activeShifts}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Totaal Shifts</span>
                    <Badge variant="outline">{totalShifts}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Voltooide Shifts</span>
                    <Badge variant="outline">{completedShifts}</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="statistics" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Deze Week
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{formatTime(weeklyMinutes)}</p>
                  <p className="text-sm text-muted-foreground mt-1">{weeklyShifts.length} shifts</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Deze Maand
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{formatTime(monthlyMinutes)}</p>
                  <p className="text-sm text-muted-foreground mt-1">{monthlyShifts.length} shifts</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Totaal
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{totalShifts}</p>
                  <p className="text-sm text-muted-foreground mt-1">shifts totaal</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="shifts" className="space-y-4">
            <div className="space-y-2">
              {employeeShifts.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Geen shifts gevonden</p>
              ) : (
                employeeShifts.slice(0, 20).map((shift) => (
                  <div key={shift.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">
                        {new Date(shift.clock_in).toLocaleDateString("nl-NL", {
                          weekday: "long",
                          day: "numeric",
                          month: "long",
                        })}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(shift.clock_in).toLocaleTimeString("nl-NL")} -{" "}
                        {shift.clock_out ? new Date(shift.clock_out).toLocaleTimeString("nl-NL") : "Actief"}
                      </p>
                    </div>
                    <Badge variant={shift.clock_out ? "outline" : "default"}>
                      {shift.duration_minutes ? formatTime(shift.duration_minutes) : "Actief"}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

