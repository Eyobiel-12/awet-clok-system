"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { updateUserRole, deleteUser, banUser, unbanUser } from "@/app/actions/admin"
import { Users, Loader2, Shield, User, TrendingUp, Trash2, Ban, Unlock, MoreVertical } from "lucide-react"
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
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)

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

  const handleDelete = async (userId: string, userName: string) => {
    setActionLoadingId(userId)
    const result = await deleteUser(userId)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(`${userName} is verwijderd`)
      window.location.reload()
    }

    setActionLoadingId(null)
  }

  const handleBan = async (userId: string, userName: string) => {
    setActionLoadingId(userId)
    const result = await banUser(userId)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(`${userName} is geblokkeerd`)
      window.location.reload()
    }

    setActionLoadingId(null)
  }

  const handleUnban = async (userId: string, userName: string) => {
    setActionLoadingId(userId)
    const result = await unbanUser(userId)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(`${userName} is gedeblokkeerd`)
      window.location.reload()
    }

    setActionLoadingId(null)
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
      <div className="px-3 sm:px-6 py-3 sm:py-4 border-b border-border">
        <h3 className="font-semibold flex items-center gap-2 text-sm sm:text-base">
          <Users className="w-4 h-4 text-primary" />
          Medewerkers
        </h3>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
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
                    <div className="flex items-center gap-2">
                      {isActive(profile.id) ? (
                        <Badge className="bg-success/10 text-success hover:bg-success/20">Actief</Badge>
                      ) : (
                        <Badge variant="secondary">Inactief</Badge>
                      )}
                      {profile.banned && (
                        <Badge variant="destructive" className="bg-destructive/10 text-destructive hover:bg-destructive/20">
                          Geblokkeerd
                        </Badge>
                      )}
                    </div>
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
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" disabled={actionLoadingId === profile.id}>
                            {actionLoadingId === profile.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <MoreVertical className="w-4 h-4" />
                            )}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {profile.banned ? (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem
                                  onSelect={(e) => e.preventDefault()}
                                  className="text-success cursor-pointer"
                                >
                                  <Unlock className="w-4 h-4 mr-2" />
                                  Deb lokkeer
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Gebruiker deb lokkeren?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Weet je zeker dat je {profile.name} wilt deb lokkeren? Ze kunnen dan weer inloggen.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Annuleren</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleUnban(profile.id, profile.name)}
                                    className="bg-success hover:bg-success/90"
                                  >
                                    Deb lokkeer
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          ) : (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem
                                  onSelect={(e) => e.preventDefault()}
                                  className="text-destructive cursor-pointer"
                                >
                                  <Ban className="w-4 h-4 mr-2" />
                                  Blokkeer
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Gebruiker blokkeren?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Weet je zeker dat je {profile.name} wilt blokkeren? Ze kunnen dan niet meer inloggen.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Annuleren</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleBan(profile.id, profile.name)}
                                    className="bg-destructive hover:bg-destructive/90"
                                  >
                                    Blokkeer
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                          <DropdownMenuSeparator />
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem
                                onSelect={(e) => e.preventDefault()}
                                className="text-destructive cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Verwijder
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Gebruiker verwijderen?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Weet je zeker dat je {profile.name} wilt verwijderen? Deze actie kan niet ongedaan
                                  worden gemaakt. Alle data van deze gebruiker wordt permanent verwijderd.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Annuleren</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(profile.id, profile.name)}
                                  className="bg-destructive hover:bg-destructive/90"
                                >
                                  Verwijder
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden p-3 sm:p-4 space-y-3">
        {profiles.map((profile) => {
          const initials =
            profile.name
              ?.split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2) || "?"

          return (
            <div key={profile.id} className="rounded-lg border border-border bg-card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Avatar className="w-10 h-10 flex-shrink-0">
                    <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm truncate">{profile.name}</h4>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {isActive(profile.id) ? (
                        <Badge className="bg-success/10 text-success hover:bg-success/20 text-xs">Actief</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">Inactief</Badge>
                      )}
                      {profile.banned && (
                        <Badge variant="destructive" className="bg-destructive/10 text-destructive hover:bg-destructive/20 text-xs">
                          Geblokkeerd
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Uren (Week)</p>
                  <p className="font-semibold tabular-nums text-sm">{getEmployeeHours(profile.id)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Rol</p>
                  <Select
                    value={profile.role}
                    onValueChange={(value: "worker" | "admin") => handleRoleChange(profile.id, value)}
                    disabled={loadingId === profile.id}
                  >
                    <SelectTrigger className="w-full h-9 text-xs">
                      {loadingId === profile.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <div className="flex items-center gap-1.5">
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
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <EmployeeDetails profile={profile} shifts={shifts} />
                <Button variant="outline" size="sm" className="flex-1 h-9" asChild>
                  <Link href={`/admin/employees/${profile.id}`}>
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Inzicht
                  </Link>
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" disabled={actionLoadingId === profile.id}>
                      {actionLoadingId === profile.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <MoreVertical className="w-4 h-4" />
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {profile.banned ? (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <DropdownMenuItem
                            onSelect={(e) => e.preventDefault()}
                            className="text-success cursor-pointer"
                          >
                            <Unlock className="w-4 h-4 mr-2" />
                            Deb lokkeer
                          </DropdownMenuItem>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Gebruiker deb lokkeren?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Weet je zeker dat je {profile.name} wilt deb lokkeren? Ze kunnen dan weer inloggen.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuleren</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleUnban(profile.id, profile.name)}
                              className="bg-success hover:bg-success/90"
                            >
                              Deb lokkeer
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    ) : (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <DropdownMenuItem
                            onSelect={(e) => e.preventDefault()}
                            className="text-destructive cursor-pointer"
                          >
                            <Ban className="w-4 h-4 mr-2" />
                            Blokkeer
                          </DropdownMenuItem>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Gebruiker blokkeren?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Weet je zeker dat je {profile.name} wilt blokkeren? Ze kunnen dan niet meer inloggen.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuleren</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleBan(profile.id, profile.name)}
                              className="bg-destructive hover:bg-destructive/90"
                            >
                              Blokkeer
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                    <DropdownMenuSeparator />
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <DropdownMenuItem
                          onSelect={(e) => e.preventDefault()}
                          className="text-destructive cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Verwijder
                        </DropdownMenuItem>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Gebruiker verwijderen?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Weet je zeker dat je {profile.name} wilt verwijderen? Deze actie kan niet ongedaan worden
                            gemaakt. Alle data van deze gebruiker wordt permanent verwijderd.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuleren</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(profile.id, profile.name)}
                            className="bg-destructive hover:bg-destructive/90"
                          >
                            Verwijder
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
