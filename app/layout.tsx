import type React from "react"
import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Toaster } from "@/components/ui/sonner"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthErrorHandler } from "@/components/auth-error-handler"
import { HolidayGreeting } from "@/components/holiday-greeting"
import "./globals.css"

const geist = Geist({ 
  subsets: ["latin"],
  display: "swap",
  preload: true,
  variable: "--font-geist",
})

const geistMono = Geist_Mono({ 
  subsets: ["latin"],
  display: "swap",
  preload: true,
  variable: "--font-geist-mono",
})

export const metadata: Metadata = {
  title: "Massawa | Urenregistratie",
  description: "Slim urenregistratie systeem voor Massawa Restaurant medewerkers",
  generator: "v0.app",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Massawa",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      {
        url: "/icon-32x32.png",
        sizes: "32x32",
        type: "image/png",
      },
      {
        url: "/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        url: "/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
    apple: [
      {
        url: "/apple-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#1a1a1f" },
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="nl" suppressHydrationWarning className={`h-full dark ${geist.variable} ${geistMono.variable}`}>
      <body className={`font-sans antialiased h-full overflow-x-hidden ${geist.className}`} suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <AuthErrorHandler />
          <HolidayGreeting />
          {children}
          <Toaster richColors position="top-center" />
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}

