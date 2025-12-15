"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { LayoutDashboard, History, BarChart3, User } from "lucide-react"
import { cn } from "@/lib/utils"

const mobileNavItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Geschiedenis",
    url: "/dashboard/history",
    icon: History,
  },
  {
    title: "Statistieken",
    url: "/dashboard/stats",
    icon: BarChart3,
  },
  {
    title: "Profiel",
    url: "/dashboard/profile",
    icon: User,
  },
]

export function MobileBottomNav() {
  const pathname = usePathname()

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:hidden shadow-lg shadow-black/5"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 0px)' }}
    >
      <div className="grid grid-cols-4 h-16">
        {mobileNavItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.url
          return (
            <Link
              key={item.url}
              href={item.url}
              className={cn(
                "flex flex-col items-center justify-center gap-1 transition-all active:scale-95 touch-manipulation",
                isActive ? "text-primary" : "text-muted-foreground",
              )}
            >
              <div
                className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center transition-all",
                  isActive ? "bg-primary/10" : "bg-transparent",
                )}
              >
                <Icon className={cn("w-5 h-5", isActive && "scale-110")} />
              </div>
              <span className={cn("text-[10px] font-medium", isActive && "font-semibold")}>{item.title}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

