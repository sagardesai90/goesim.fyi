import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { Header } from "@/components/header"
import { DatabaseStatus } from "@/components/database-status"
import { ThemeProvider } from "@/components/theme-provider"
import "./globals.css"

export const metadata: Metadata = {
  title: "eSIM Rate Comparison - Find the Best Deals",
  description:
    "Compare eSIM rates across countries and providers. Find the best data plans for your travels with our comprehensive comparison tool.",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Header />
          {children}
          <DatabaseStatus />
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
