import type React from "react"
import type { Metadata } from "next"
import { Fredoka } from "next/font/google"
import "./globals.css"
import Cursor from "@/components/Cursor"
import { Suspense } from "react"

const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
})

export const metadata: Metadata = {
  title: "Database Management and Query Processing Project",
  description:
    "A project on Database Management and Query Processing developed by our group: Rushikesh, Shrutvika, and Shikhaa.",
  keywords: [
    "Database Management",
    "Query Processing",
    "DBMS",
    "SQL",
    "Database Project",
    "Data Modeling",
    "Database Systems",
    "Rushikesh",
    "Shrutvika",
    "Shikhaa",
  ],
  authors: [{ name: "Rushikesh" }, { name: "Shrutvika" }, { name: "Shikhaa" }],
  creator: "Rushikesh, Shrutvika, Shikhaa",
  openGraph: {
    title: "Database Management and Query Processing Project",
    description:
      "A project on Database Management and Query Processing developed by our group: Rushikesh, Shrutvika, and Shikhaa.",
    url: "https://dbmqp.vercel.app/",
    siteName: "DBMQP Project",
    images: [
      {
        url: "https://dbmqp.vercel.app/vercel.svg",
        width: 1200,
        height: 630,
        alt: "Database Management and Query Processing Project",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Database Management and Query Processing Project",
    description:
      "A project on Database Management and Query Processing developed by our group: Rushikesh, Shrutvika, and Shikhaa.",
    images: ["https://dbmqp.vercel.app/vercel.svg"],
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
    },
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body
        className={`${fredoka.variable} antialiased`}
        style={{
          fontFamily: "var(--font-fredoka), sans-serif",
          backgroundColor: "var(--color-neutral-50)",
          color: "var(--color-neutral-900)",
        }}
      >
        <Cursor />
        <Suspense fallback={null}>{children}</Suspense>
      </body>
    </html>
  )
}
