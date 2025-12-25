"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Sparkles, ChevronRight, ChevronLeft, PartyPopper, Gift, Star, Heart, Calendar } from "lucide-react"
import { cn } from "@/lib/utils"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"

export function HolidayGreeting() {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(0)
  const [confetti, setConfetti] = useState<Array<{ id: number; left: number; delay: number }>>([])

  useEffect(() => {
    // Check if user has already seen the greeting today
    const lastSeen = localStorage.getItem("holiday-greeting-seen-2025")
    const today = new Date().toDateString()
    
    console.log("Holiday Greeting Check:", { lastSeen, today, shouldShow: lastSeen !== today })
    
    if (lastSeen !== today) {
      // Generate confetti
      const confettiArray = Array.from({ length: 30 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 2,
      }))
      setConfetti(confettiArray)
      
      // Show after a short delay
      setTimeout(() => {
        console.log("Opening holiday greeting popup")
        setOpen(true)
      }, 500)
    }
  }, [])

  const handleClose = () => {
    console.log("Closing holiday greeting, saving to localStorage")
    setOpen(false)
    setStep(0)
    localStorage.setItem("holiday-greeting-seen-2025", new Date().toDateString())
  }

  const nextStep = () => {
    if (step < 3) {
      setStep(step + 1)
    }
  }

  const prevStep = () => {
    if (step > 0) {
      setStep(step - 1)
    }
  }

  const steps = [
    // Step 1: Welcome
    {
      icon: <PartyPopper className="w-20 h-20 text-primary animate-bounce" />,
      title: "🎉 Happy New Year 2025! 🎊",
      titleClass: "text-3xl sm:text-4xl font-bold text-primary",
      content: (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg border-2 border-primary/30">
            <p className="text-xl font-semibold text-foreground mb-3">
              ✨ Wishing you a prosperous and joyful New Year! ✨
            </p>
            <p className="text-base text-muted-foreground">
              May 2025 bring you success, happiness, peace, and endless opportunities!
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 text-sm text-muted-foreground">
            <Star className="w-4 h-4 text-yellow-500" />
            <span>Click next to continue</span>
            <Star className="w-4 h-4 text-yellow-500" />
          </div>
        </div>
      ),
      bgClass: "bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-950 dark:to-purple-950"
    },
    // Step 2: Tigrinya Christmas
    {
      icon: <Gift className="w-20 h-20 text-red-600 animate-pulse" />,
      title: "🎄 ምልካም ልደት! 🎄",
      titleClass: "text-3xl sm:text-4xl font-bold text-red-600",
      content: (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg border-2 border-red-300 dark:border-red-900">
            <p className="text-2xl font-bold text-foreground mb-2" style={{ fontFamily: 'serif' }}>
              ምልካም ልደት!
            </p>
            <p className="text-xl font-semibold text-foreground mb-3">
              Melkam Ledet!
            </p>
            <p className="text-base text-muted-foreground">
              🎅 Merry Christmas & Happy Holidays! 🎁
            </p>
            <p className="text-sm text-muted-foreground mt-3 italic">
              Celebrating the joy and spirit of Christmas with you
            </p>
          </div>
        </div>
      ),
      bgClass: "bg-gradient-to-br from-red-100 to-orange-100 dark:from-red-950 dark:to-orange-950"
    },
    // Step 3: Tigrinya New Year
    {
      icon: <Calendar className="w-20 h-20 text-green-600 animate-spin" style={{ animationDuration: '3s' }} />,
      title: "🌟 እንቋዕ ሓድሽ ዓመት ኣብጻሕካ! 🌟",
      titleClass: "text-3xl sm:text-4xl font-bold text-green-600",
      content: (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg border-2 border-green-300 dark:border-green-900">
            <p className="text-2xl font-bold text-foreground mb-2" style={{ fontFamily: 'serif' }}>
              እንቋዕ ሓድሽ ዓመት ኣብጻሕካ!
            </p>
            <p className="text-xl font-semibold text-foreground mb-3">
              Enkuae Hadish Amet Abtsahka!
            </p>
            <p className="text-base text-muted-foreground">
              🎊 Happy New Year in Tigrinya! 🎉
            </p>
            <p className="text-sm text-muted-foreground mt-3 italic">
              Wishing you a blessed and successful year ahead
            </p>
          </div>
        </div>
      ),
      bgClass: "bg-gradient-to-br from-green-100 to-yellow-100 dark:from-green-950 dark:to-yellow-950"
    },
    // Step 4: Final Message
    {
      icon: <Heart className="w-20 h-20 text-pink-600 animate-pulse" />,
      title: "💙 Thank You! 💙",
      titleClass: "text-3xl sm:text-4xl font-bold text-pink-600",
      content: (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg border-2 border-pink-300 dark:border-pink-900">
            <p className="text-xl font-semibold text-foreground mb-3">
              From all of us at
            </p>
            <p className="text-2xl font-bold text-primary mb-4">
              Massawa Time Tracking 💙
            </p>
            <div className="flex items-center justify-center gap-2 text-base text-muted-foreground">
              <Star className="w-5 h-5 text-yellow-500" />
              <span>We appreciate you!</span>
              <Star className="w-5 h-5 text-yellow-500" />
            </div>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Click "Close" to continue to the app
            </p>
          </div>
        </div>
      ),
      bgClass: "bg-gradient-to-br from-pink-100 to-purple-100 dark:from-pink-950 dark:to-purple-950"
    }
  ]

  const currentStep = steps[step]

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent 
        className={cn(
          "sm:max-w-lg p-0 overflow-hidden rounded-2xl border-4 shadow-2xl transition-all duration-500",
          currentStep.bgClass
        )}
        onInteractOutside={(e) => e.preventDefault()}
      >
        {/* Animated Confetti */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {confetti.map((item) => (
            <div
              key={item.id}
              className="absolute w-3 h-3 rounded-full animate-fall"
              style={{
                left: `${item.left}%`,
                top: '-20px',
                animationDelay: `${item.delay}s`,
                animationDuration: '4s',
                backgroundColor: ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'][item.id % 5],
              }}
            />
          ))}
        </div>

        {/* Accessibility Title */}
        <VisuallyHidden>
          <DialogTitle>Holiday Greeting - {currentStep.title}</DialogTitle>
        </VisuallyHidden>

        {/* Content */}
        <div className="relative z-10 p-8">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            {currentStep.icon}
          </div>

          {/* Title */}
          <h2 className={cn("text-center mb-6 transition-all duration-500", currentStep.titleClass)}>
            {currentStep.title}
          </h2>

          {/* Step Content */}
          <div className="mb-6 transition-all duration-500">
            {currentStep.content}
          </div>

          {/* Progress Dots */}
          <div className="flex justify-center gap-2 mb-6">
            {steps.map((_, index) => (
              <div
                key={index}
                className={cn(
                  "w-3 h-3 rounded-full transition-all duration-300",
                  index === step 
                    ? "bg-primary scale-125" 
                    : "bg-primary/30 hover:bg-primary/50"
                )}
              />
            ))}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center gap-4">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={step === 0}
              className="bg-white dark:bg-slate-800"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>

            {step < steps.length - 1 ? (
              <Button
                onClick={nextStep}
                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button
                onClick={handleClose}
                className="bg-gradient-to-r from-primary to-pink-600 hover:from-primary/90 hover:to-pink-600/90 text-white shadow-lg"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Close
              </Button>
            )}
          </div>
        </div>
      </DialogContent>

      <style jsx global>{`
        @keyframes fall {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(360deg);
            opacity: 0;
          }
        }
        .animate-fall {
          animation: fall linear infinite;
        }
      `}</style>
    </Dialog>
  )
}

