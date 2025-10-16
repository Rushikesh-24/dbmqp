"use client"

import { useState, useEffect, useCallback } from "react"
import { Plus, Edit2, Trash2, AlertCircle } from "lucide-react"

interface TableData {
  id: string
  table_number: string
  capacity: number
  status: string
}

export default function TablesManagement() {
  const [tables, setTables] = useState<TableData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedTable, setSelectedTable] = useState<TableData | null>(null)

  const [tableForm, setTableForm] = useState({
    table_number: "",
    capacity: "",
    status: "Available",
  })

  const statusOptions = ["Available", "Occupied", "Reserved", "Out of Order"]

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

  const fetchTables = useCallback(async () => {
    try {
      setLoading(true)
      const token = getToken()
      if (!token) return

      const response = await fetch("/api/tables", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setTables(data)
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
  }, [])

  const createTable = async () => {
    try {
      const token = getToken()
      if (!token) return

      const response = await fetch("/api/tables", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          table_number: tableForm.table_number,
          capacity: Number.parseInt(tableForm.capacity),
          status: tableForm.status,
        }),
      })

      if (response.ok) {
        const newTable = await response.json()
        setTables([...tables, newTable])
        setIsCreateDialogOpen(false)
        setTableForm({ table_number: "", capacity: "", status: "Available" })
        setError("")
      } else {
        const errorData = await response.json()
        setError(errorData.message || "Failed to create table")
      }
    } catch {
      setError("Network error occurred")
    }
  }

  const updateTable = async () => {
    try {
      const token = getToken()
      if (!token || !selectedTable) return

      const response = await fetch("/api/tables", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: selectedTable.id,
          table_number: tableForm.table_number,
          capacity: Number.parseInt(tableForm.capacity),
          status: tableForm.status,
        }),
      })

      if (response.ok) {
        const updatedTable = await response.json()
        setTables(tables.map((t) => (t.id === updatedTable.id ? updatedTable : t)))
        setIsEditDialogOpen(false)
        setSelectedTable(null)
        setTableForm({ table_number: "", capacity: "", status: "Available" })
        setError("")
      } else {
        const errorData = await response.json()
        setError(errorData.message || "Failed to update table")
      }
    } catch {
      setError("Network error occurred")
    }
  }

  const deleteTable = async (tableId: string) => {
    if (!confirm("Are you sure you want to delete this table?")) return

    try {
      const token = getToken()
      if (!token) return

      const response = await fetch(`/api/tables?id=${tableId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        setTables(tables.filter((t) => t.id !== tableId))
        setError("")
      } else {
        const errorData = await response.json()
        setError(errorData.message || "Failed to delete table")
      }
    } catch {
      setError("Network error occurred")
    }
  }

  const openEditDialog = (table: TableData) => {
    setSelectedTable(table)
    setTableForm({
      table_number: table.table_number,
      capacity: table.capacity.toString(),
      status: table.status,
    })
    setIsEditDialogOpen(true)
  }

  const openCreateDialog = () => {
    setTableForm({ table_number: "", capacity: "", status: "Available" })
    setIsCreateDialogOpen(true)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Available":
        return "bg-green-100 text-green-700 border-green-200"
      case "Occupied":
        return "bg-orange-100 text-orange-700 border-orange-200"
      case "Reserved":
        return "bg-blue-100 text-blue-700 border-blue-200"
      case "Out of Order":
        return "bg-neutral-100 text-neutral-700 border-neutral-200"
      default:
        return "bg-neutral-100 text-neutral-700 border-neutral-200"
    }
  }

  useEffect(() => {
    fetchTables()
  }, [fetchTables])

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold text-neutral-900">Tables Management</h2>
          <p className="text-neutral-600 mt-2">Manage your restaurant tables and their availability</p>
        </div>
        <button
          onClick={openCreateDialog}
          className="flex items-center gap-2 px-6 py-2 rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition-colors font-medium"
        >
          <Plus className="w-4 h-4" />
          Add Table
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="text-neutral-600">Loading tables...</div>
        </div>
      ) : tables.length === 0 ? (
        <div className="text-center py-12 bg-white border border-neutral-200 rounded-lg">
          <div className="text-6xl mb-4">🪑</div>
          <h3 className="text-xl font-semibold text-neutral-900 mb-2">No Tables Added Yet</h3>
          <p className="text-neutral-600 mb-6">Start by adding your first table to manage reservations and seating.</p>
          <button
            onClick={openCreateDialog}
            className="px-6 py-3 rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition-colors font-medium"
          >
            Add Your First Table
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {tables.map((table) => (
            <div
              key={table.id}
              className="bg-white border border-neutral-200 rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-neutral-900">Table {table.table_number}</h3>
                  <p className="text-neutral-600 text-sm">Capacity: {table.capacity} people</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(table.status)}`}>
                  {table.status}
                </span>
              </div>

              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => openEditDialog(table)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-orange-100 text-orange-700 hover:bg-orange-200 transition-colors text-sm font-medium"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() => deleteTable(table.id)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors text-sm font-medium"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Table Dialog */}
      {isCreateDialogOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-md">
            <h3 className="text-2xl font-bold text-neutral-900 mb-6">Add New Table</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-2">Table Number *</label>
                <input
                  type="text"
                  value={tableForm.table_number}
                  onChange={(e) => setTableForm({ ...tableForm, table_number: e.target.value })}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="e.g., 1, A1, VIP-1"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-2">Capacity *</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={tableForm.capacity}
                  onChange={(e) => setTableForm({ ...tableForm, capacity: e.target.value })}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Number of seats"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-2">Status</label>
                <select
                  value={tableForm.status}
                  onChange={(e) => setTableForm({ ...tableForm, status: e.target.value })}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setIsCreateDialogOpen(false)}
                className="flex-1 px-4 py-2 rounded-lg bg-neutral-100 text-neutral-700 hover:bg-neutral-200 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={createTable}
                disabled={!tableForm.table_number || !tableForm.capacity}
                className="flex-1 px-4 py-2 rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition-colors font-medium disabled:opacity-50"
              >
                Create Table
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Table Dialog */}
      {isEditDialogOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-md">
            <h3 className="text-2xl font-bold text-neutral-900 mb-6">Edit Table</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-2">Table Number *</label>
                <input
                  type="text"
                  value={tableForm.table_number}
                  onChange={(e) => setTableForm({ ...tableForm, table_number: e.target.value })}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="e.g., 1, A1, VIP-1"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-2">Capacity *</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={tableForm.capacity}
                  onChange={(e) => setTableForm({ ...tableForm, capacity: e.target.value })}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Number of seats"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-2">Status</label>
                <select
                  value={tableForm.status}
                  onChange={(e) => setTableForm({ ...tableForm, status: e.target.value })}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setIsEditDialogOpen(false)}
                className="flex-1 px-4 py-2 rounded-lg bg-neutral-100 text-neutral-700 hover:bg-neutral-200 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={updateTable}
                disabled={!tableForm.table_number || !tableForm.capacity}
                className="flex-1 px-4 py-2 rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition-colors font-medium disabled:opacity-50"
              >
                Update Table
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
