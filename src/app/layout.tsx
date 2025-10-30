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

export const metadata = {
  title: "nomnom",
  description:
    "NomNom is a comprehensive digital solution for restaurants, offering QR-based table ordering, real-time menu browsing (with allergy filtering), and integrated UPI payment processing. Developed by Rushikesh, Shrutvika, and Shikhaa for the Database Management and Query Processing Project.",
  keywords: [
    "nomnom",
    "NomNom",
    "DBMS Project",
    "GEC",
    "Database Management",
    "Query Processing",
    "Rushikesh",
    "Shrutvika",
    "Shikhaa",
    "QR Code Ordering",
    "Digital Menu",
    "Restaurant App",
    "Table Service",
    "Contactless Ordering",
    "UPI Payment Integration",
    "Food Ordering System",
    "Menu Filtering",
    "Allergy Filter",
    "Restaurant Technology",
  ],
  authors: [{ name: "Rushikesh" }, { name: "Shrutvika" }, { name: "Shikhaa" }],
  creator: "Rushikesh, Shrutvika, Shikhaa",

  // --- OpenGraph (Social Media Preview) ---
  openGraph: {
    title: "NomNom: Digital Menu, Order & Payment Solution",
    description:
      "Seamless QR-based table ordering and payment integration. Perfecting the dining experience through smart technology. A project on Database Management and Query Processing.",
    url: "https://dbmqp.vercel.app/",
    siteName: "NomNom DBMQP Project",
    images: [
      {
        url: "https://dbmqp.vercel.app/shrut.png",
        width: 1200,
        height: 1200,
        alt: "NomNom App Screenshot - Digital Menu and Ordering System",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  
  // --- Twitter Card (Social Media Preview) ---
  twitter: {
    card: "summary_large_image",
    title: "NomNom: QR-Based Restaurant Ordering & Payment",
    description:
      "Contactless digital menu and order management developed as a Database Management project.",
    images: ["https://dbmqp.vercel.app/shrut.png"],
  },
  
  // --- Robots (Crawlability) ---
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
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
