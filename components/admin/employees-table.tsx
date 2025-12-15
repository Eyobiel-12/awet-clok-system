"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { updateUserRole } from "@/app/actions/admin"
import { Users, Loader2, Shield, User, TrendingUp } from "lucide-react"
import { toast } from "sonner"
import { EmployeeDetails } from "./employee-details"
import Link from "next/link"
import type { Profile, Shift } from "@/lib/types"

interface EmployeesTableProps {
  profiles: Profile[]
  shifts: Shift[]
}

export function EmployeesTable({ profiles, shifts }: EmployeesTableProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const handleRoleChange = async (userId: string, newRole: "worker" | "admin") => {
    setLoadingId(userId)
    const result = await updateUserRole(userId, newRole)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success("Rol bijgewerkt")
    }

    setLoadingId(null)
  }

  const now = new Date()
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - now.getDay() + 1)
  startOfWeek.setHours(0, 0, 0, 0)

  const getEmployeeHours = (userId: string) => {
    const employeeShifts = shifts.filter(
      (s) => s.user_id === userId && new Date(s.clock_in) >= startOfWeek && s.duration_minutes,
    )
    const totalMinutes = employeeShifts.reduce((acc, s) => acc + (s.duration_minutes || 0), 0)
    const hours = Math.floor(totalMinutes / 60)
    const mins = totalMinutes % 60
    if (hours === 0) return `${mins}m`
    return `${hours}u ${mins}m`
  }

  const isActive = (userId: string) => {
    return shifts.some((s) => s.user_id === userId && !s.clock_out)
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-6 py-4 border-b border-border">
        <h3 className="font-semibold flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" />
          Medewerkers
        </h3>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Medewerker</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Uren (Week)</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Acties</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {profiles.map((profile) => {
              const initials =
                profile.name
                  ?.split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2) || "?"

              return (
                <TableRow key={profile.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{profile.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {isActive(profile.id) ? (
                      <Badge className="bg-success/10 text-success hover:bg-success/20">Actief</Badge>
                    ) : (
                      <Badge variant="secondary">Inactief</Badge>
                    )}
                  </TableCell>
                  <TableCell className="tabular-nums font-medium">{getEmployeeHours(profile.id)}</TableCell>
                  <TableCell>
                    <Select
                      value={profile.role}
                      onValueChange={(value: "worker" | "admin") => handleRoleChange(profile.id, value)}
                      disabled={loadingId === profile.id}
                    >
                      <SelectTrigger className="w-32">
                        {loadingId === profile.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <div className="flex items-center gap-2">
                            {profile.role === "admin" ? (
                              <Shield className="w-3.5 h-3.5" />
                            ) : (
                              <User className="w-3.5 h-3.5" />
                            )}
                            <SelectValue />
                          </div>
                        )}
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="worker">
                          <div className="flex items-center gap-2">
                            <User className="w-3.5 h-3.5" />
                            Worker
                          </div>
                        </SelectItem>
                        <SelectItem value="admin">
                          <div className="flex items-center gap-2">
                            <Shield className="w-3.5 h-3.5" />
                            Admin
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <EmployeeDetails profile={profile} shifts={shifts} />
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/admin/employees/${profile.id}`}>
                          <TrendingUp className="w-4 h-4 mr-2" />
                          Inzicht
                        </Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
