"use client"

import type React from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useState } from "react"
import Image from "next/image"
import { Mail } from "lucide-react"
import { toast } from "sonner"

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password/confirm`,
      })
      if (error) throw error
      setSuccess(true)
      toast.success("Reset link verzonden naar je email")
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Er is een fout opgetreden"
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6 bg-background">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Image
              src="/massawa-logo.jpeg"
              alt="Massawa Logo"
              width={48}
              height={48}
              className="rounded-lg object-contain"
              priority
            />
            <span className="text-2xl font-bold">Massawa</span>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Wachtwoord Resetten</CardTitle>
              <CardDescription>
                {success
                  ? "Check je email voor de reset link"
                  : "Voer je email in om een wachtwoord reset link te ontvangen"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {success ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-center p-6 bg-primary/10 rounded-lg">
                    <Mail className="w-12 h-12 text-primary" />
                  </div>
                  <p className="text-sm text-center text-muted-foreground">
                    We hebben een wachtwoord reset link verzonden naar <strong>{email}</strong>. Check je inbox en klik
                    op de link om je wachtwoord te resetten.
                  </p>
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/auth/login">Terug naar inloggen</Link>
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleReset}>
                  <div className="flex flex-col gap-6">
                    <div className="grid gap-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="naam@example.com"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                    {error && <p className="text-sm text-destructive">{error}</p>}
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? "Verzenden..." : "Verstuur Reset Link"}
                    </Button>
                  </div>
                  <div className="mt-4 text-center text-sm">
                    <Link href="/auth/login" className="underline underline-offset-4 text-primary">
                      Terug naar inloggen
                    </Link>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

