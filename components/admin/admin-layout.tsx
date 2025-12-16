"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Clock, LogOut, Settings, LayoutDashboard, Shield, Users, ChevronDown, Moon, Sun } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import type { Profile } from "@/lib/types"
import Image from "next/image"

interface AdminLayoutProps {
  children: React.ReactNode
  profile: Profile
}

import { BarChart3 } from "lucide-react"

const menuItems = [
  {
    title: "Dashboard",
    url: "/admin",
    icon: Shield,
    shortcut: "D",
  },
  {
    title: "Shifts",
    url: "/admin/shifts",
    icon: Clock,
    shortcut: "S",
  },
  {
    title: "Medewerkers",
    url: "/admin/employees",
    icon: Users,
    shortcut: "M",
  },
  {
    title: "Rapporten",
    url: "/admin/reports",
    icon: BarChart3,
    shortcut: "R",
  },
  {
    title: "Instellingen",
    url: "/admin/settings",
    icon: Settings,
    shortcut: "I",
  },
]

export function AdminLayout({ children, profile }: AdminLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
  }

  const initials =
    profile.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "A"

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="border-b border-sidebar-border">
          <div className="flex items-center gap-2 px-2 py-2 group/header">
            <div className="w-8 h-8 rounded-lg overflow-hidden border border-border flex-shrink-0 transition-all duration-300 group-hover/header:scale-110 group-hover/header:shadow-md">
              <Image
                src="/massawa-logo.jpeg"
                alt="Massawa Logo"
                width={32}
                height={32}
                className="object-cover w-full h-full transition-transform duration-300"
              />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold truncate">Massawa</span>
              <span className="text-xs text-muted-foreground">Admin Panel</span>
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Admin Navigatie</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {menuItems.map((item, index) => {
                  const Icon = item.icon
                  const isActive = pathname === item.url || (item.url === "/admin" && pathname === "/admin")
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={`${item.title} (⌘${item.shortcut})`}
                        className="group/menu"
                      >
                        <Link
                          href={item.url}
                          className="relative animate-slide-in"
                          style={{ animationDelay: `${index * 50}ms` }}
                        >
                          <Icon className="w-4 h-4 transition-transform duration-300 group-hover/menu:scale-110 group-hover/menu:rotate-3" />
                          <span>{item.title}</span>
                          {isActive && (
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full animate-pulse-slow" />
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarSeparator />

          <SidebarGroup>
            <SidebarGroupLabel>Navigatie</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Worker Dashboard">
                    <Link href="/dashboard">
                      <LayoutDashboard className="w-4 h-4" />
                      <span>Worker Dashboard</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="border-t border-sidebar-border p-2">
          {mounted ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-start gap-2 h-auto py-2 hover:bg-sidebar-accent transition-all duration-200 group/user">
                  <Avatar className="w-8 h-8 transition-transform duration-300 group-hover/user:scale-110">
                    <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium transition-colors duration-300 group-hover/user:bg-primary/20">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start flex-1 min-w-0">
                    <span className="text-sm font-medium truncate w-full">{profile.name}</span>
                    <span className="text-xs text-muted-foreground capitalize">{profile.role}</span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-muted-foreground ml-auto transition-transform duration-300 group-hover/user:rotate-180" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56" side="right">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{profile.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{profile.role}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard" className="cursor-pointer">
                    <LayoutDashboard className="w-4 h-4 mr-2" />
                    Worker Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/admin/settings" className="cursor-pointer">
                    <Settings className="w-4 h-4 mr-2" />
                    Instellingen
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive cursor-pointer">
                  <LogOut className="w-4 h-4 mr-2" />
                  Uitloggen
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="ghost" className="w-full justify-start gap-2 h-auto py-2">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">{initials}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-start flex-1 min-w-0">
                <span className="text-sm font-medium truncate w-full">{profile.name}</span>
                <span className="text-xs text-muted-foreground capitalize">{profile.role}</span>
              </div>
            </Button>
          )}
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <header className="flex h-14 sm:h-16 shrink-0 items-center gap-2 border-b border-sidebar-border px-3 sm:px-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <SidebarTrigger className="-ml-1" />
          <div className="flex-1" />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="h-9 w-9 active:scale-95 transition-all duration-300 touch-manipulation hover:bg-accent hover:rotate-180"
            aria-label="Toggle theme"
          >
            {mounted ? (
              theme === "dark" ? (
                <Sun className="h-4 w-4 transition-transform duration-300" />
              ) : (
                <Moon className="h-4 w-4 transition-transform duration-300" />
              )
            ) : (
              <Sun className="h-4 w-4" />
            )}
          </Button>
        </header>
        <main className="flex flex-1 flex-col gap-4 sm:gap-6 p-3 sm:p-4 md:p-6 lg:p-8 overflow-auto min-w-0">
          <div className="animate-fade-in">{children}</div>
        </main>
      </SidebarInset>
      <SidebarRail />
    </SidebarProvider>
  )
}

