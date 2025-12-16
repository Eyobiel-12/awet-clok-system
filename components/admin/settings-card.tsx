"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { updateRestaurantLocation } from "@/app/actions/admin"
import { MapPin, Loader2, Check, Navigation, AlertCircle, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import type { Restaurant } from "@/lib/types"

interface SettingsCardProps {
  restaurant: Restaurant | null
}

export function SettingsCard({ restaurant }: SettingsCardProps) {
  const [lat, setLat] = useState(restaurant?.lat?.toString() || "")
  const [lng, setLng] = useState(restaurant?.lng?.toString() || "")
  const [radius, setRadius] = useState(restaurant?.radius_m?.toString() || "100")
  const [isLoading, setIsLoading] = useState(false)
  const [isGettingLocation, setIsGettingLocation] = useState(false)
  const [success, setSuccess] = useState(false)
  const [errors, setErrors] = useState<{ lat?: string; lng?: string; radius?: string }>({})
  const [touched, setTouched] = useState<{ lat?: boolean; lng?: boolean; radius?: boolean }>({})

  const validateLat = (value: string): string | undefined => {
    if (!value) return "Latitude is verplicht"
    const num = Number.parseFloat(value)
    if (Number.isNaN(num)) return "Ongeldige latitude"
    if (num < -90 || num > 90) return "Latitude moet tussen -90 en 90 zijn"
    return undefined
  }

  const validateLng = (value: string): string | undefined => {
    if (!value) return "Longitude is verplicht"
    const num = Number.parseFloat(value)
    if (Number.isNaN(num)) return "Ongeldige longitude"
    if (num < -180 || num > 180) return "Longitude moet tussen -180 en 180 zijn"
    return undefined
  }

  const validateRadius = (value: string): string | undefined => {
    if (!value) return "Radius is verplicht"
    const num = Number.parseInt(value)
    if (Number.isNaN(num)) return "Ongeldige radius"
    if (num < 10) return "Radius moet minimaal 10 meter zijn"
    if (num > 10000) return "Radius mag maximaal 10000 meter zijn"
    return undefined
  }

  useEffect(() => {
    const newErrors: typeof errors = {}
    if (touched.lat) newErrors.lat = validateLat(lat)
    if (touched.lng) newErrors.lng = validateLng(lng)
    if (touched.radius) newErrors.radius = validateRadius(radius)
    setErrors(newErrors)
  }, [lat, lng, radius, touched])

  const isValid = !errors.lat && !errors.lng && !errors.radius && lat && lng && radius

  const handleSave = async () => {
    // Mark all fields as touched
    setTouched({ lat: true, lng: true, radius: true })

    // Validate all fields
    const latError = validateLat(lat)
    const lngError = validateLng(lng)
    const radiusError = validateRadius(radius)

    if (latError || lngError || radiusError) {
      setErrors({ lat: latError, lng: lngError, radius: radiusError })
      toast.error("Controleer de invoervelden")
      return
    }

    setIsLoading(true)
    setSuccess(false)

    const result = await updateRestaurantLocation(
      Number.parseFloat(lat),
      Number.parseFloat(lng),
      Number.parseInt(radius),
    )

    if (result.error) {
      toast.error(result.error)
    } else {
      setSuccess(true)
      toast.success("Locatie opgeslagen")
      setTimeout(() => setSuccess(false), 3000)
    }

    setIsLoading(false)
  }

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Locatie wordt niet ondersteund")
      return
    }

    setIsGettingLocation(true)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLat(position.coords.latitude.toFixed(6))
        setLng(position.coords.longitude.toFixed(6))
        setIsGettingLocation(false)
        toast.success("Locatie opgehaald")
      },
      () => {
        toast.error("Kon locatie niet ophalen")
        setIsGettingLocation(false)
      },
    )
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-3 sm:px-6 py-3 sm:py-4 border-b border-border">
        <h3 className="font-semibold flex items-center gap-2 text-sm sm:text-base">
          <MapPin className="w-4 h-4 text-primary" />
          Restaurant Locatie
        </h3>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">Configureer de locatie en geofence radius</p>
      </div>

      <div className="p-4 sm:p-6 space-y-4">
        {/* Map Preview */}
        {lat && lng && !errors.lat && !errors.lng && (
          <div className="rounded-lg border border-border bg-muted/30 p-4 card-lift">
            <div className="flex items-center justify-between mb-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                Locatie Preview
              </Label>
              <a
                href={`https://www.google.com/maps?q=${lat},${lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline flex items-center gap-1 transition-colors hover:text-primary/80"
              >
                <Navigation className="w-3 h-3" />
                Open in Maps
              </a>
            </div>
            <div className="aspect-video bg-gradient-to-br from-muted to-muted/50 rounded-md flex items-center justify-center relative overflow-hidden border border-border/50">
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                <MapPin className="w-8 h-8 text-primary/50" />
                <p className="text-xs font-medium">Locatie: {lat}, {lng}</p>
                {radius && !errors.radius && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div
                      className="rounded-full border-2 border-primary/30 border-dashed animate-pulse-slow"
                      style={{
                        width: `${Math.min(Number.parseInt(radius) / 10, 200)}px`,
                        height: `${Math.min(Number.parseInt(radius) / 10, 200)}px`,
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
            {radius && !errors.radius && (
              <div className="mt-2 p-2 rounded-md bg-primary/5 border border-primary/10">
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">Geofence radius:</span> {radius}m
                  {Number.parseInt(radius) >= 1000 && ` (${Math.round(Number.parseInt(radius) / 1000 * 10) / 10} km)`}
                </p>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="lat" className="text-sm flex items-center gap-2">
              Latitude
              {touched.lat && errors.lat && (
                <AlertCircle className="w-3.5 h-3.5 text-destructive" />
              )}
              {touched.lat && !errors.lat && lat && (
                <CheckCircle2 className="w-3.5 h-3.5 text-success" />
              )}
            </Label>
            <Input
              id="lat"
              type="number"
              step="any"
              placeholder="52.3676"
              value={lat}
              onChange={(e) => {
                setLat(e.target.value)
                setTouched((prev) => ({ ...prev, lat: true }))
              }}
              onBlur={() => setTouched((prev) => ({ ...prev, lat: true }))}
              className={cn(
                "h-11 transition-all duration-200",
                touched.lat && errors.lat && "border-destructive focus-visible:ring-destructive",
                touched.lat && !errors.lat && lat && "border-success focus-visible:ring-success"
              )}
            />
            {touched.lat && errors.lat && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.lat}
              </p>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="lng" className="text-sm flex items-center gap-2">
              Longitude
              {touched.lng && errors.lng && (
                <AlertCircle className="w-3.5 h-3.5 text-destructive" />
              )}
              {touched.lng && !errors.lng && lng && (
                <CheckCircle2 className="w-3.5 h-3.5 text-success" />
              )}
            </Label>
            <Input
              id="lng"
              type="number"
              step="any"
              placeholder="4.9041"
              value={lng}
              onChange={(e) => {
                setLng(e.target.value)
                setTouched((prev) => ({ ...prev, lng: true }))
              }}
              onBlur={() => setTouched((prev) => ({ ...prev, lng: true }))}
              className={cn(
                "h-11 transition-all duration-200",
                touched.lng && errors.lng && "border-destructive focus-visible:ring-destructive",
                touched.lng && !errors.lng && lng && "border-success focus-visible:ring-success"
              )}
            />
            {touched.lng && errors.lng && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.lng}
              </p>
            )}
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="radius" className="text-sm flex items-center gap-2">
            Radius (meters)
            {touched.radius && errors.radius && (
              <AlertCircle className="w-3.5 h-3.5 text-destructive" />
            )}
            {touched.radius && !errors.radius && radius && (
              <CheckCircle2 className="w-3.5 h-3.5 text-success" />
            )}
          </Label>
          <Input
            id="radius"
            type="number"
            placeholder="100"
            value={radius}
            onChange={(e) => {
              setRadius(e.target.value)
              setTouched((prev) => ({ ...prev, radius: true }))
            }}
            onBlur={() => setTouched((prev) => ({ ...prev, radius: true }))}
            className={cn(
              "h-11 transition-all duration-200",
              touched.radius && errors.radius && "border-destructive focus-visible:ring-destructive",
              touched.radius && !errors.radius && radius && "border-success focus-visible:ring-success"
            )}
          />
          {touched.radius && errors.radius && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {errors.radius}
            </p>
          )}
          <p className="text-xs text-muted-foreground">Medewerkers kunnen alleen inklokken binnen deze afstand</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:gap-2 pt-2">
          <Button 
            variant="outline" 
            onClick={getCurrentLocation} 
            disabled={isGettingLocation}
            className="w-full sm:w-auto h-11 ripple"
          >
            {isGettingLocation ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Navigation className="w-4 h-4 mr-2" />
            )}
            Gebruik Huidige Locatie
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isLoading || success || !isValid}
            className="w-full sm:w-auto h-11 ripple"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : success ? (
              <Check className="w-4 h-4 mr-2" />
            ) : (
              <MapPin className="w-4 h-4 mr-2" />
            )}
            {success ? "Opgeslagen!" : "Opslaan"}
          </Button>
        </div>
      </div>
    </div>
  )
}
