"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { appCache, getRestaurantInfo, type RestaurantInfo } from "@/lib/utils"
import { Download, Eye, X } from "lucide-react"

interface TableData {
  id: string
  table_number: string
  capacity: number
  status: string
}

export default function QRCodesManagement() {
  const [tables, setTables] = useState<TableData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [selectedTable, setSelectedTable] = useState<TableData | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [qrCodeUrl, setQrCodeUrl] = useState("")
  const [restaurantInfo, setRestaurantInfo] = useState<RestaurantInfo | null>(null)

  const getToken = () => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("token") || getCookie("token")
    }
    return null
  }

  const getCookie = (name: string) => {
    if (typeof document !== "undefined") {
      const value = `; ${document.cookie}`
      const parts = value.split(`; ${name}=`)
      if (parts.length === 2) return parts.pop()?.split(";").shift()
    }
    return null
  }

  const generateQRCode = async (table: TableData) => {
    try {
      const QRCode = (await import("qrcode")).default
      const restaurant = restaurantInfo || (await getRestaurantInfo())

      const qrData = JSON.stringify({
        tableId: table.id,
        restaurantId: restaurant?.id || "1",
      })

      const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
        width: 300,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      })

      setQrCodeUrl(qrCodeDataUrl)
      setSelectedTable(table)
      setShowPreview(true)
    } catch {
      setError("Failed to generate QR code")
    }
  }

  const downloadQRCode = () => {
    if (qrCodeUrl && selectedTable) {
      const link = document.createElement("a")
      link.href = qrCodeUrl
      link.download = `table-${selectedTable.table_number}-qr.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  useEffect(() => {
    const initializeData = async () => {
      try {
        setLoading(true)

        // Initialize restaurant info
        const restaurant = await getRestaurantInfo()
        setRestaurantInfo(restaurant)

        // Check cache for tables first
        const cachedTables = appCache.get<TableData[]>("tables")
        if (cachedTables) {
          setTables(cachedTables)
          setLoading(false)
        }

        // Fetch fresh data
        const token = getToken()
        if (!token) return

        const response = await fetch("/api/tables", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const data = await response.json()

          // Only update if data has changed
          if (JSON.stringify(data) !== JSON.stringify(cachedTables)) {
            setTables(data)
            appCache.set("tables", data, 2 * 60 * 1000) // Cache for 2 minutes
          }
          setError("")
        } else {
          const errorData = await response.json()
          setError(errorData.message || "Failed to fetch tables")
        }
      } catch {
        setError("Network error occurred")
      } finally {
        setLoading(false)
      }
    }

    initializeData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200 rounded-xl p-6">
        <h2 className="text-3xl font-bold text-neutral-900">QR Codes Management</h2>
        <p className="text-neutral-600 mt-2">Generate and download QR codes for your tables</p>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>}

      {loading ? (
        <div className="text-center py-12">
          <div className="text-neutral-600">Loading tables...</div>
        </div>
      ) : tables.length === 0 ? (
        <div className="text-center py-12 bg-white border border-neutral-200 rounded-xl">
          <div className="text-6xl mb-4">🪑</div>
          <h3 className="text-xl font-semibold text-neutral-900 mb-2">No Tables Available</h3>
          <p className="text-neutral-600">Add tables first to generate QR codes.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {tables.map((table) => (
            <div
              key={table.id}
              className="bg-white border border-neutral-200 rounded-xl p-6 hover:shadow-lg transition-all duration-200 hover:border-orange-300"
            >
              <div className="text-center mb-4">
                <h3 className="text-2xl font-bold text-neutral-900 mb-2">Table {table.table_number}</h3>
                <p className="text-neutral-600 text-sm mb-3">Capacity: {table.capacity} people</p>
                <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                  {table.status}
                </span>
              </div>

              <div className="space-y-2">
                <button
                  onClick={() => generateQRCode(table)}
                  className="w-full bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  Preview QR Code
                </button>
                <button
                  onClick={() => {
                    generateQRCode(table)
                    setTimeout(() => {
                      if (qrCodeUrl) downloadQRCode()
                    }, 100)
                  }}
                  className="w-full bg-neutral-100 text-neutral-700 px-4 py-2 rounded-lg hover:bg-neutral-200 transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download QR Code
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showPreview && selectedTable && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-md border border-neutral-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-neutral-900">QR Code for Table {selectedTable.table_number}</h3>
              <button
                onClick={() => {
                  setShowPreview(false)
                  setSelectedTable(null)
                  setQrCodeUrl("")
                }}
                className="p-1 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-neutral-600" />
              </button>
            </div>

            {qrCodeUrl && (
              <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-6 mb-6 flex justify-center">
                <Image
                  src={qrCodeUrl || "/placeholder.svg"}
                  alt={`QR Code for Table ${selectedTable.table_number}`}
                  width={300}
                  height={300}
                  className="border-2 border-neutral-300 rounded-lg"
                />
              </div>
            )}

            <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4 mb-6">
              <p className="text-xs font-semibold text-neutral-600 mb-2 uppercase tracking-wide">QR Code Data:</p>
              <code className="text-xs bg-white p-3 rounded border border-neutral-200 block font-mono text-neutral-700 overflow-auto max-h-24">
                {JSON.stringify(
                  {
                    tableId: selectedTable.id,
                    restaurantId: restaurantInfo?.id || "1",
                  },
                  null,
                  2,
                )}
              </code>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowPreview(false)
                  setSelectedTable(null)
                  setQrCodeUrl("")
                }}
                className="flex-1 bg-neutral-100 text-neutral-700 px-4 py-2 rounded-lg hover:bg-neutral-200 transition-colors font-medium"
              >
                Close
              </button>
              <button
                onClick={downloadQRCode}
                className="flex-1 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors font-medium flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
