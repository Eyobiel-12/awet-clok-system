"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { clockIn, clockOut } from "@/app/actions/shifts"
import { Play, Square, MapPin, AlertCircle, Loader2, RefreshCw, CheckCircle2, Clock, AlertTriangle } from "lucide-react"
import { toast } from "sonner"
import type { Shift, Restaurant } from "@/lib/types"
import { isWithinRadius, calculateDistance } from "@/lib/geolocation"
import { cn } from "@/lib/utils"

interface ClockButtonProps {
  activeShift: Shift | null
  restaurant: Restaurant | null
}

export function ClockButton({ activeShift: initialShift, restaurant }: ClockButtonProps) {
  const [activeShift, setActiveShift] = useState<Shift | null>(initialShift)
  const [isLoading, setIsLoading] = useState(false)
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [isWithinGeofence, setIsWithinGeofence] = useState<boolean | null>(null)
  const [distance, setDistance] = useState<number | null>(null)
  const [elapsedTime, setElapsedTime] = useState<number>(0)
  const [isRefreshingLocation, setIsRefreshingLocation] = useState(false)

  // Get user location
  const getLocation = useCallback(
    (showRefresh = false) => {
      if (!navigator.geolocation) {
        setLocationError("Locatie wordt niet ondersteund")
        return
      }

      if (showRefresh) setIsRefreshingLocation(true)

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          setLocation({ lat: latitude, lng: longitude })
          setLocationError(null)
          setIsRefreshingLocation(false)

          if (restaurant) {
            const dist = calculateDistance(latitude, longitude, restaurant.lat, restaurant.lng)
            const within = dist <= restaurant.radius_m
            setDistance(Math.round(dist))
            setIsWithinGeofence(within)
          }
        },
        (err) => {
          setIsRefreshingLocation(false)
          switch (err.code) {
            case err.PERMISSION_DENIED:
              setLocationError("Locatie toegang geweigerd")
              break
            case err.POSITION_UNAVAILABLE:
              setLocationError("Locatie niet beschikbaar")
              break
            case err.TIMEOUT:
              setLocationError("Locatie timeout")
              break
            default:
              setLocationError("Locatie fout")
          }
          setIsWithinGeofence(false)
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
      )
    },
    [restaurant],
  )

  useEffect(() => {
    getLocation()
    const interval = setInterval(() => getLocation(), 30000)
    return () => clearInterval(interval)
  }, [getLocation])

  // Live timer
  useEffect(() => {
    if (!activeShift) {
      setElapsedTime(0)
      return
    }

    const updateTimer = () => {
      const start = new Date(activeShift.clock_in).getTime()
      const now = Date.now()
      setElapsedTime(Math.floor((now - start) / 1000))
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)
    return () => clearInterval(interval)
  }, [activeShift])

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const handleClockIn = async () => {
    if (!location) {
      toast.error("Locatie is vereist om in te klokken")
      return
    }

    setIsLoading(true)
    const result = await clockIn(location.lat, location.lng)

    if (result.error) {
      toast.error(result.error)
    } else if (result.shift) {
      setActiveShift(result.shift)
      toast.success("Je bent ingeklokt!")
    }

    setIsLoading(false)
  }

  const handleClockOut = async () => {
    setIsLoading(true)
    const result = await clockOut()

    if (result.error) {
      toast.error(result.error)
    } else {
      setActiveShift(null)
      toast.success("Je bent uitgeklokt!")
    }

    setIsLoading(false)
  }

  const isClockedIn = !!activeShift

  return (
    <div className="relative animate-fade-in w-full">
      {/* Main Clock Card */}
      <div
        className={cn(
          "rounded-2xl border p-4 sm:p-6 md:p-8 transition-all duration-500 shadow-lg w-full",
          isClockedIn
            ? "bg-gradient-to-br from-success/10 via-success/5 to-card border-success/30 shadow-success/10"
            : "bg-gradient-to-br from-card via-card to-muted/30 border-border shadow-border/20",
        )}
      >
        {/* Status Badge */}
        <div className="flex items-center justify-center mb-4 sm:mb-6">
          <div
            className={cn(
              "inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold shadow-sm transition-all",
              isClockedIn
                ? "bg-success/20 text-success border border-success/30 backdrop-blur-sm"
                : "bg-muted/80 text-muted-foreground border border-border/50",
            )}
          >
            <span
              className={cn(
                "w-2.5 h-2.5 rounded-full transition-all",
                isClockedIn ? "bg-success animate-pulse shadow-sm shadow-success/50" : "bg-muted-foreground",
              )}
            />
            {isClockedIn ? "Actieve Shift" : "Niet Ingeklokt"}
          </div>
        </div>

        {/* Timer Display */}
        <div className="text-center mb-6 sm:mb-8">
          {isClockedIn ? (
            <>
              <div className="relative inline-block">
                <div className="text-4xl sm:text-6xl lg:text-7xl font-mono font-bold tabular-nums tracking-tight text-foreground mb-2 drop-shadow-sm">
                  {formatTime(elapsedTime)}
                </div>
                <div className="absolute inset-0 text-4xl sm:text-6xl lg:text-7xl font-mono font-bold tabular-nums tracking-tight text-success/20 blur-sm -z-10">
                  {formatTime(elapsedTime)}
                </div>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground flex items-center justify-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                Gestart om{" "}
                {new Date(activeShift.clock_in).toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" })}
              </p>
              {isLongShift && (
                <div className="mt-3 flex items-center justify-center gap-2 text-warning bg-warning/10 px-3 py-2 rounded-lg border border-warning/20">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-sm font-medium">Lang shift! Vergeet niet uit te klokken</span>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="text-4xl sm:text-6xl lg:text-7xl font-mono font-bold tabular-nums tracking-tight text-muted-foreground/20 mb-2">
                00:00:00
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground flex items-center justify-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                Klaar om te beginnen?
              </p>
            </>
          )}
        </div>

        {/* Clock Button */}
        <div className="flex justify-center mb-4 sm:mb-6">
          {isClockedIn ? (
            <Button
              size="lg"
              variant="destructive"
              className="h-14 sm:h-16 px-8 sm:px-12 text-base sm:text-lg font-semibold rounded-xl shadow-lg shadow-destructive/30 hover:shadow-destructive/40 hover:scale-105 active:scale-95 transition-all w-full sm:w-auto touch-manipulation relative overflow-hidden group"
              onClick={handleClockOut}
              disabled={isLoading}
            >
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></span>
              {isLoading ? (
                <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3 animate-spin" />
              ) : (
                <Square className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3 fill-current" />
              )}
              {isLoading ? "Bezig..." : "Klok Uit"}
            </Button>
          ) : (
            <Button
              size="lg"
              className={cn(
                "h-14 sm:h-16 px-8 sm:px-12 text-base sm:text-lg font-semibold rounded-xl transition-all w-full sm:w-auto hover:scale-105 active:scale-95 touch-manipulation relative overflow-hidden group",
                isWithinGeofence
                  ? "bg-success hover:bg-success/90 text-success-foreground shadow-lg shadow-success/30 hover:shadow-success/40"
                  : "bg-muted text-muted-foreground cursor-not-allowed shadow-sm",
              )}
              onClick={handleClockIn}
              disabled={isLoading || !isWithinGeofence || !!locationError || !restaurant}
            >
              {isWithinGeofence && (
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></span>
              )}
              {isLoading ? <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3 animate-spin" /> : <Play className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3" />}
              {isLoading ? "Bezig..." : "Klok In"}
            </Button>
          )}
        </div>

        {/* Location Status */}
        <div className="flex items-center justify-center gap-4 mt-4 sm:mt-6">
          <div
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium shadow-sm border transition-all",
              locationError
                ? "bg-destructive/10 text-destructive border-destructive/20"
                : isWithinGeofence
                  ? "bg-success/10 text-success border-success/20"
                  : "bg-muted/80 text-muted-foreground border-border/50",
            )}
          >
            {locationError ? (
              <AlertCircle className="w-4 h-4" />
            ) : isWithinGeofence ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <MapPin className="w-4 h-4" />
            )}
            <span>
              {!restaurant
                ? "Restaurant locatie niet geconfigureerd"
                : locationError
                  ? locationError
                  : isWithinGeofence === null
                    ? "Locatie controleren..."
                    : isWithinGeofence
                      ? `Op locatie (${distance}m van restaurant)`
                      : `Te ver weg (${distance}m, max ${restaurant.radius_m}m)`}
            </span>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={() => getLocation(true)}
            disabled={isRefreshingLocation}
          >
            <RefreshCw className={cn("w-4 h-4", isRefreshingLocation && "animate-spin")} />
            <span className="sr-only">Ververs locatie</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
