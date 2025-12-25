"use client"

import { useEffect, useRef, useState } from "react"
import { Html5Qrcode } from "html5-qrcode"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  QrCode, 
  CheckCircle2, 
  XCircle, 
  Camera, 
  CameraOff,
  LogIn,
  LogOut,
  ArrowLeft,
  Loader2
} from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

interface Profile {
  id: string
  full_name: string | null
  role: string | null
}

interface QRScannerProps {
  userId: string
  profile: Profile | null
  hasActiveShift: boolean
}

export function QRScanner({ userId, profile, hasActiveShift }: QRScannerProps) {
  const router = useRouter()
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const [scanning, setScanning] = useState(false)
  const [scanResult, setScanResult] = useState<{
    success: boolean
    message: string
    action?: "clock_in" | "clock_out"
  } | null>(null)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    return () => {
      // Cleanup scanner on unmount
      if (scannerRef.current) {
        scannerRef.current.stop().catch(console.error)
      }
    }
  }, [])

  const startScanner = async () => {
    try {
      setScanning(true)
      setScanResult(null)

      // Wait for DOM to be ready
      await new Promise(resolve => setTimeout(resolve, 100))

      const element = document.getElementById("qr-reader")
      if (!element) {
        throw new Error("Scanner element not found")
      }

      const html5QrCode = new Html5Qrcode("qr-reader")
      scannerRef.current = html5QrCode

      await html5QrCode.start(
        { facingMode: "environment" }, // Use back camera
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        onScanSuccess,
        onScanFailure
      )
    } catch (error) {
      console.error("Error starting scanner:", error)
      toast.error("Failed to start camera. Please check permissions.")
      setScanning(false)
    }
  }

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop()
        scannerRef.current = null
        setScanning(false)
      } catch (error) {
        console.error("Error stopping scanner:", error)
      }
    }
  }

  const onScanSuccess = async (decodedText: string) => {
    try {
      setProcessing(true)
      
      // Stop scanner first
      await stopScanner()

      // Parse QR code data
      const qrData = JSON.parse(decodedText)

      // Validate QR code
      if (qrData.type !== "massawa-clock") {
        setScanResult({
          success: false,
          message: "Invalid QR code. Please scan the Massawa clock-in QR code.",
        })
        setProcessing(false)
        return
      }

      // Call API to clock in/out
      const response = await fetch("/api/clock-qr", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          qrData,
          hasActiveShift,
        }),
      })

      const result = await response.json()

      if (result.success) {
        setScanResult({
          success: true,
          message: result.message,
          action: result.action,
        })
        
        // Show success toast
        toast.success(result.message)
        
        // Redirect after delay
        setTimeout(() => {
          router.push("/dashboard")
        }, 2000)
      } else {
        setScanResult({
          success: false,
          message: result.error || "Failed to process clock action",
        })
        toast.error(result.error || "Failed to process clock action")
      }

      setProcessing(false)
    } catch (error) {
      console.error("Error processing QR code:", error)
      setScanResult({
        success: false,
        message: "Invalid QR code format. Please try again.",
      })
      toast.error("Invalid QR code format")
      setProcessing(false)
    }
  }

  const onScanFailure = (error: string) => {
    // Ignore continuous scan failures (normal when no QR code in view)
    // console.log("Scan error:", error)
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push("/dashboard")}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-3 mb-2">
            <QrCode className="w-10 h-10 text-primary" />
            <h1 className="text-3xl font-bold">Scan QR Code</h1>
          </div>
          <p className="text-muted-foreground">
            Point your camera at the location QR code to clock {hasActiveShift ? "out" : "in"}
          </p>
        </div>
      </div>

      {/* User Info */}
      <Card className="p-4 mb-6 bg-muted/50">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Logged in as</p>
            <p className="font-semibold">{profile?.full_name || "User"}</p>
          </div>
          <div className={cn(
            "px-4 py-2 rounded-full font-semibold flex items-center gap-2",
            hasActiveShift 
              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
              : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
          )}>
            {hasActiveShift ? (
              <>
                <LogOut className="w-4 h-4" />
                Will Clock Out
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                Will Clock In
              </>
            )}
          </div>
        </div>
      </Card>

      {/* Scanner Area */}
      <Card className="overflow-hidden">
        {!scanning && !scanResult && (
          <div className="p-12 text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-32 h-32 rounded-full bg-primary/10 flex items-center justify-center">
                <Camera className="w-16 h-16 text-primary" />
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-semibold">Ready to Scan</h2>
              <p className="text-muted-foreground">
                Click the button below to activate your camera
              </p>
            </div>
            <Button
              onClick={startScanner}
              size="lg"
              className="gap-2"
            >
              <Camera className="w-5 h-5" />
              Start Camera
            </Button>
          </div>
        )}

        {scanning && !processing && (
          <div className="space-y-4 p-6">
            <div id="qr-reader" className="rounded-lg overflow-hidden min-h-[300px] bg-muted/50"></div>
            <div className="text-center space-y-4">
              <p className="text-sm text-muted-foreground animate-pulse">
                📷 Point your camera at the QR code...
              </p>
              <Button
                onClick={stopScanner}
                variant="outline"
                className="gap-2"
              >
                <CameraOff className="w-4 h-4" />
                Stop Camera
              </Button>
            </div>
          </div>
        )}

        {processing && (
          <div className="p-12 text-center space-y-6">
            <div className="flex justify-center">
              <Loader2 className="w-16 h-16 text-primary animate-spin" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-semibold">Processing...</h2>
              <p className="text-muted-foreground">
                Please wait while we process your clock action
              </p>
            </div>
          </div>
        )}

        {scanResult && (
          <div className="p-12 text-center space-y-6">
            <div className="flex justify-center">
              {scanResult.success ? (
                <div className="w-32 h-32 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <CheckCircle2 className="w-16 h-16 text-green-600 dark:text-green-400" />
                </div>
              ) : (
                <div className="w-32 h-32 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <XCircle className="w-16 h-16 text-red-600 dark:text-red-400" />
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <h2 className={cn(
                "text-2xl font-bold",
                scanResult.success ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
              )}>
                {scanResult.success ? "Success!" : "Error"}
              </h2>
              <p className="text-lg">{scanResult.message}</p>
            </div>

            {scanResult.success ? (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Redirecting to dashboard...
                </p>
                <Button
                  onClick={() => router.push("/dashboard")}
                  className="gap-2"
                >
                  Go to Dashboard Now
                </Button>
              </div>
            ) : (
              <div className="flex gap-3 justify-center">
                <Button
                  onClick={() => {
                    setScanResult(null)
                    startScanner()
                  }}
                  className="gap-2"
                >
                  <Camera className="w-4 h-4" />
                  Try Again
                </Button>
                <Button
                  onClick={() => router.push("/dashboard")}
                  variant="outline"
                >
                  Back to Dashboard
                </Button>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Instructions */}
      <Card className="mt-6 p-6 bg-blue-50 dark:bg-blue-950/20 border-2 border-blue-200 dark:border-blue-900">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          💡 Tips for Best Results
        </h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="text-primary">•</span>
            <span>Hold your phone steady and ensure good lighting</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary">•</span>
            <span>Keep the QR code within the scanning frame</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary">•</span>
            <span>Allow camera permissions when prompted</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary">•</span>
            <span>Make sure the QR code is not damaged or blurry</span>
          </li>
        </ul>
      </Card>
    </div>
  )
}

