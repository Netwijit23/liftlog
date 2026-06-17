import type { Metadata, Viewport } from 'next'
import './globals.css'
import BottomNav from '@/components/BottomNav'
import PwaFix from '@/components/PwaFix'

export const metadata: Metadata = {
  title: 'MomoFit',
  description: 'Your personal fitness tracker',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'MomoFit',
  },
  formatDetection: { telephone: false },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#F472B6',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className="min-h-screen bg-blush-50 antialiased">
        <PwaFix />
        <main className="max-w-lg mx-auto pb-24 pt-safe">
          {children}
        </main>
        <BottomNav />
      </body>
    </html>
  )
}
