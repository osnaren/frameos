import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/react'

/**
 * Vercel Web Analytics (page views) and Speed Insights (real-user Core Web
 * Vitals). Production builds only: both are cookie-less and send nothing
 * until they're enabled for the project in the Vercel dashboard.
 */
export function VercelInsights() {
  if (!import.meta.env.PROD) {
    return null
  }

  return (
    <>
      <Analytics />
      <SpeedInsights />
    </>
  )
}
