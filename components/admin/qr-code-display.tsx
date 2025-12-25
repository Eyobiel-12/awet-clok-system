"use client"

import { useEffect, useRef, useState } from "react"
import QRCode from "qrcode"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, Printer, QrCode, RefreshCw } from "lucide-react"
import { toast } from "sonner"

interface Restaurant {
  id: string
  name: string
  address?: string
}

interface QRCodeDisplayProps {
  restaurant: Restaurant | null
}

export function QRCodeDisplay({ restaurant }: QRCodeDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [qrData, setQrData] = useState<string>("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    generateQRCode()
  }, [])

  const generateQRCode = async () => {
    if (!canvasRef.current) return

    try {
      setLoading(true)
      
      // Create QR data with restaurant ID and timestamp
      const qrPayload = {
        type: "massawa-clock",
        restaurantId: restaurant?.id || "default",
        name: restaurant?.name || "Massawa Restaurant",
        timestamp: Date.now(),
      }
      
      const qrDataString = JSON.stringify(qrPayload)
      setQrData(qrDataString)

      // Generate QR code on canvas
      await QRCode.toCanvas(canvasRef.current, qrDataString, {
        width: 400,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      })
      
      setLoading(false)
    } catch (error) {
      console.error("Error generating QR code:", error)
      toast.error("Failed to generate QR code")
      setLoading(false)
    }
  }

  const handleDownload = () => {
    if (!canvasRef.current) return

    try {
      // Create download link
      const url = canvasRef.current.toDataURL("image/png")
      const link = document.createElement("a")
      link.download = `${restaurant?.name || "Massawa"}-Clock-QR.png`
      link.href = url
      link.click()
      
      toast.success("QR code downloaded successfully!")
    } catch (error) {
      console.error("Error downloading QR code:", error)
      toast.error("Failed to download QR code")
    }
  }

  const handlePrint = () => {
    // Open print dialog with just the QR code
    const printWindow = window.open("", "_blank")
    if (!printWindow || !canvasRef.current) return

    const qrImageUrl = canvasRef.current.toDataURL("image/png")
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print QR Code - ${restaurant?.name || "Massawa"}</title>
          <style>
            @page {
              size: A4;
              margin: 2cm;
            }
            body {
              font-family: Arial, sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              padding: 20px;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            h1 {
              color: #333;
              margin: 0 0 10px 0;
              font-size: 32px;
            }
            .subtitle {
              color: #666;
              font-size: 18px;
              margin: 5px 0;
            }
            .qr-container {
              border: 3px solid #333;
              padding: 20px;
              border-radius: 10px;
              background: white;
              box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            }
            img {
              display: block;
              width: 400px;
              height: 400px;
            }
            .instructions {
              margin-top: 30px;
              text-align: center;
              max-width: 500px;
            }
            .instructions h2 {
              color: #333;
              font-size: 24px;
              margin-bottom: 15px;
            }
            .instructions ol {
              text-align: left;
              color: #666;
              font-size: 16px;
              line-height: 1.8;
            }
            .footer {
              margin-top: 30px;
              color: #999;
              font-size: 14px;
              text-align: center;
            }
            @media print {
              body {
                padding: 0;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${restaurant?.name || "Massawa Restaurant"}</h1>
            <p class="subtitle">⏰ Time Tracking System</p>
            ${restaurant?.address ? `<p class="subtitle">📍 ${restaurant.address}</p>` : ""}
          </div>
          
          <div class="qr-container">
            <img src="${qrImageUrl}" alt="Clock In/Out QR Code" />
          </div>
          
          <div class="instructions">
            <h2>📱 How to Clock In/Out</h2>
            <ol>
              <li>Open the Massawa app on your phone</li>
              <li>Tap the "Scan QR Code" button</li>
              <li>Point your camera at this QR code</li>
              <li>Wait for confirmation ✅</li>
            </ol>
          </div>
          
          <div class="footer">
            <p>Generated on ${new Date().toLocaleDateString("nl-NL", { 
              day: "2-digit", 
              month: "long", 
              year: "numeric" 
            })}</p>
            <p>Massawa Time Tracking © ${new Date().getFullYear()}</p>
          </div>
          
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 250);
            };
          </script>
        </body>
      </html>
    `)
    
    printWindow.document.close()
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-3 mb-2">
          <QrCode className="w-10 h-10 text-primary" />
          <h1 className="text-4xl font-bold">Location QR Code</h1>
        </div>
        <p className="text-lg text-muted-foreground">
          Display this QR code at your restaurant entrance for employees to clock in/out
        </p>
      </div>

      {/* QR Code Display Card */}
      <Card className="p-8">
        <div className="space-y-6">
          {/* Restaurant Info */}
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold">{restaurant?.name || "Massawa Restaurant"}</h2>
            {restaurant?.address && (
              <p className="text-muted-foreground">📍 {restaurant.address}</p>
            )}
          </div>

          {/* QR Code Canvas */}
          <div className="flex justify-center">
            <div className="bg-white p-6 rounded-xl border-4 border-primary shadow-lg">
              <canvas
                ref={canvasRef}
                className={loading ? "opacity-50" : "opacity-100"}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap justify-center gap-4">
            <Button
              onClick={handleDownload}
              size="lg"
              className="gap-2"
              disabled={loading}
            >
              <Download className="w-5 h-5" />
              Download QR Code
            </Button>
            
            <Button
              onClick={handlePrint}
              size="lg"
              variant="outline"
              className="gap-2"
              disabled={loading}
            >
              <Printer className="w-5 h-5" />
              Print QR Code
            </Button>
            
            <Button
              onClick={generateQRCode}
              size="lg"
              variant="outline"
              className="gap-2"
              disabled={loading}
            >
              <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
              Regenerate
            </Button>
          </div>

          {/* Instructions */}
          <Card className="p-6 bg-muted/50 border-2">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              📱 How Employees Use This QR Code
            </h3>
            <ol className="space-y-3 text-muted-foreground list-decimal list-inside">
              <li className="text-base">Employee opens the Massawa app on their phone</li>
              <li className="text-base">Taps the <strong>"Scan QR Code"</strong> button on their dashboard</li>
              <li className="text-base">Points their camera at this QR code</li>
              <li className="text-base">System automatically clocks them in or out ✅</li>
            </ol>
          </Card>

          {/* Recommendations */}
          <Card className="p-6 bg-blue-50 dark:bg-blue-950/20 border-2 border-blue-200 dark:border-blue-900">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              💡 Best Practices
            </h3>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Print and laminate the QR code for durability</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Place it at eye level near the entrance</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Ensure good lighting for easy scanning</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Keep the QR code away from moisture and direct sunlight</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Test scanning from different phone models</span>
              </li>
            </ul>
          </Card>
        </div>
      </Card>
    </div>
  )
}

