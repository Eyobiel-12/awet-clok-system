"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { updateRestaurantLocation } from "@/app/actions/admin"
import { MapPin, Loader2, Check, Navigation } from "lucide-react"
import { toast } from "sonner"
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

  const handleSave = async () => {
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="lat" className="text-sm">Latitude</Label>
            <Input
              id="lat"
              type="number"
              step="any"
              placeholder="52.3676"
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              className="h-11"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="lng" className="text-sm">Longitude</Label>
            <Input
              id="lng"
              type="number"
              step="any"
              placeholder="4.9041"
              value={lng}
              onChange={(e) => setLng(e.target.value)}
              className="h-11"
            />
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="radius" className="text-sm">Radius (meters)</Label>
          <Input
            id="radius"
            type="number"
            placeholder="100"
            value={radius}
            onChange={(e) => setRadius(e.target.value)}
            className="h-11"
          />
          <p className="text-xs text-muted-foreground">Medewerkers kunnen alleen inklokken binnen deze afstand</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:gap-2 pt-2">
          <Button 
            variant="outline" 
            onClick={getCurrentLocation} 
            disabled={isGettingLocation}
            className="w-full sm:w-auto h-11"
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
            disabled={isLoading || success}
            className="w-full sm:w-auto h-11"
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
