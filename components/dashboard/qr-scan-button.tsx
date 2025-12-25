"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { QrCode, Zap, LogIn, LogOut } from "lucide-react"
import { cn } from "@/lib/utils"

interface QRScanButtonProps {
  hasActiveShift: boolean
}

export function QRScanButton({ hasActiveShift }: QRScanButtonProps) {
  const router = useRouter()

  const handleScan = () => {
    router.push("/scan")
  }

  return (
    <Card className="relative overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-purple-500/10 to-primary/10" />
      
      <div className="relative p-4 sm:p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <QrCode className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold">QR Code Clock</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Scan the location QR code for quick clock in/out
            </p>
          </div>
          
          <div className={cn(
            "px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5",
            hasActiveShift
              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
              : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
          )}>
            {hasActiveShift ? (
              <>
                <LogOut className="w-3 h-3" />
                Clock Out
              </>
            ) : (
              <>
                <LogIn className="w-3 h-3" />
                Clock In
              </>
            )}
          </div>
        </div>

        {/* Main Scan Button */}
        <Button
          onClick={handleScan}
          size="lg"
          className="w-full gap-2 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white shadow-lg hover:shadow-xl transition-all"
        >
          <QrCode className="w-5 h-5" />
          <span className="font-semibold">Scan QR Code</span>
        </Button>

        {/* Benefits */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="flex items-start gap-2 text-sm">
            <Zap className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-foreground">Quick & Easy</p>
              <p className="text-xs text-muted-foreground">Just scan and go</p>
            </div>
          </div>
          <div className="flex items-start gap-2 text-sm">
            <QrCode className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-foreground">No Location</p>
              <p className="text-xs text-muted-foreground">Works anywhere</p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}

