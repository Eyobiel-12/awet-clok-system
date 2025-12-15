"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { updateProfile } from "@/app/actions/profile"
import { Camera, Loader2, User, Save } from "lucide-react"
import { toast } from "sonner"
import type { Profile } from "@/lib/types"

interface ProfileFormProps {
  profile: Profile
}

export function ProfileForm({ profile }: ProfileFormProps) {
  const [name, setName] = useState(profile.name || "")
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile.avatar_url || null)
  const [isLoading, setIsLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error("Alleen afbeeldingen zijn toegestaan")
        return
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Afbeelding is te groot (max 5MB)")
        return
      }

      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    const formData = new FormData()
    formData.append("name", name)

    const fileInput = fileInputRef.current
    if (fileInput?.files?.[0]) {
      formData.append("avatar", fileInput.files[0])
    }

    const result = await updateProfile(formData)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success("Profiel bijgewerkt!")
      // Use router.refresh() instead of reload to maintain state
      setTimeout(() => {
        window.location.reload()
      }, 500)
    }

    setIsLoading(false)
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "?"
  }

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="w-5 h-5" />
          Persoonlijke Informatie
        </CardTitle>
        <CardDescription>Update je naam en profielfoto</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar Section */}
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            <div className="relative">
              <Avatar className="w-24 h-24 sm:w-32 sm:h-32 border-4 border-border shadow-lg">
                <AvatarImage src={avatarPreview || profile.avatar_url || undefined} alt={name} />
                <AvatarFallback className="text-2xl sm:text-3xl font-bold bg-gradient-to-br from-primary/20 to-primary/10 text-primary">
                  {getInitials(name)}
                </AvatarFallback>
              </Avatar>
              <Button
                type="button"
                size="icon"
                variant="secondary"
                className="absolute bottom-0 right-0 rounded-full shadow-md hover:shadow-lg transition-shadow"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
              >
                <Camera className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex-1 space-y-2 text-center sm:text-left">
              <h3 className="font-semibold text-lg">{name}</h3>
              <p className="text-sm text-muted-foreground">Klik op het camera icoon om een foto te uploaden</p>
              <p className="text-xs text-muted-foreground">Maximaal 5MB, JPG, PNG of GIF</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              disabled={isLoading}
            />
          </div>

          {/* Name Input */}
          <div className="space-y-2">
            <Label htmlFor="name">Naam</Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Je volledige naam"
              required
              minLength={2}
              maxLength={100}
              disabled={isLoading}
              className="text-base"
            />
            <p className="text-xs text-muted-foreground">Dit is hoe je naam wordt weergegeven in het systeem</p>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="submit" disabled={isLoading || name.trim().length === 0} className="min-w-[120px]">
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Opslaan...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Opslaan
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

