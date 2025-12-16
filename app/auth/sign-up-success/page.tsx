import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Image from "next/image"
import { Mail } from "lucide-react"

export default function SignUpSuccessPage() {
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
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-success/10 rounded-full flex items-center justify-center mb-4">
                <Mail className="w-6 h-6 text-success" />
              </div>
              <CardTitle className="text-2xl">Bedankt voor je registratie!</CardTitle>
              <CardDescription>Controleer je email om je account te bevestigen</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground text-center">
                We hebben een bevestigingsmail gestuurd. Klik op de link in de email om je account te activeren en in te
                kunnen loggen.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
