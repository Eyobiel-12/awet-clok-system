"use client"

import dynamic from "next/dynamic"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"

// Lazy load the chart component
const StatsChart = dynamic(() => import("./stats-chart").then(mod => ({ default: mod.StatsChart })), {
  loading: () => (
    <Card>
      <CardContent className="p-6">
        <Skeleton className="h-64 w-full" />
      </CardContent>
    </Card>
  ),
  ssr: false, // Charts don't need SSR
})

export { StatsChart }



