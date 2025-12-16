import type React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { MapPin, Shield, Users, ChevronRight, Zap } from "lucide-react"

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background relative overflow-hidden">
      {/* Background gradient effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[40%] -left-[20%] w-[70%] h-[70%] rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-[30%] -right-[20%] w-[60%] h-[60%] rounded-full bg-chart-2/5 blur-3xl" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-border/50 backdrop-blur-sm bg-background/80 sticky top-0 z-20 animate-fade-in">
          <div className="container mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <Image
                src="/massawa-logo.jpeg"
                alt="Massawa Logo"
                width={36}
                height={36}
                className="rounded-lg object-contain"
                priority
              />
              <span className="text-base sm:text-lg font-semibold">Massawa</span>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <Button variant="ghost" size="sm" className="hidden sm:flex" asChild>
                <Link href="/auth/login">Inloggen</Link>
              </Button>
              <Button size="sm" className="text-xs sm:text-sm px-3 sm:px-4" asChild>
                <Link href="/auth/sign-up">
                  <span className="hidden sm:inline">Registreren</span>
                  <span className="sm:hidden">Registreren</span>
                  <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 ml-1" />
                </Link>
              </Button>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="container mx-auto px-4 sm:px-6 pt-12 sm:pt-20 pb-16 sm:pb-32">
          <div className="max-w-3xl mx-auto text-center space-y-6 sm:space-y-8 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs sm:text-sm font-medium">
              <Zap className="w-3.5 h-3.5" />
              Slim & Snel Urenregistratie
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-balance leading-tight">
              Uren bijhouden was nog nooit zo <span className="gradient-text">eenvoudig</span>
            </h1>

            <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto text-pretty px-4 sm:px-0">
              Klok in en uit met een druk op de knop. Automatische locatieverificatie zorgt voor accurate registratie.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center pt-2 sm:pt-4 px-4 sm:px-0">
              <Button size="lg" className="h-12 sm:h-14 px-6 sm:px-8 text-base sm:text-lg active:scale-95 transition-transform touch-manipulation" asChild>
                <Link href="/auth/sign-up">
                  Start nu gratis
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="h-12 sm:h-14 px-6 sm:px-8 bg-transparent text-base sm:text-lg active:scale-95 transition-transform touch-manipulation" asChild>
                <Link href="/auth/login">Ik heb al een account</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="container mx-auto px-4 sm:px-6 pb-16 sm:pb-32">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 max-w-6xl mx-auto">
            <FeatureCard
              icon={Clock}
              title="Live Timer"
              description="Zie real-time hoelang je al werkt met een nauwkeurige timer"
            />
            <FeatureCard
              icon={MapPin}
              title="GPS Verificatie"
              description="Alleen inklokken wanneer je op locatie bent bij het restaurant"
            />
            <FeatureCard
              icon={Shield}
              title="Veilig & Betrouwbaar"
              description="Alle data wordt veilig opgeslagen met encryptie"
            />
            <FeatureCard
              icon={Users}
              title="Team Overzicht"
              description="Beheerders zien alle shifts en kunnen uren aanpassen"
            />
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border/50 py-6 sm:py-8">
          <div className="container mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="w-6 h-6 bg-primary/10 rounded flex items-center justify-center">
                <Clock className="w-3.5 h-3.5 text-primary" />
              </div>
              <span className="text-sm">Massawa Urenregistratie</span>
            </div>
            <p className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} Massawa Restaurant</p>
          </div>
        </footer>
      </div>
    </main>
  )
}

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
}) {
  return (
    <div className="group p-5 sm:p-6 rounded-xl border border-border bg-card/50 hover:bg-card hover:border-border/80 active:scale-[0.98] transition-all duration-300 touch-manipulation">
      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <h3 className="font-semibold mb-2 text-base sm:text-lg">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
    </div>
  )
}
