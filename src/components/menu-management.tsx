"use client"

import { useState, useEffect, useCallback } from "react"
import { Plus, Edit2, Trash2, Search } from "lucide-react"

interface MenuData {
  id: string
  name: string
  description: string
}

export default function MenuManagement() {
  const [menuItems, setMenuItems] = useState<MenuData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuData | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  const [menuForm, setMenuForm] = useState({
    name: "",
    description: "",
  })

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

  const fetchMenuItems = useCallback(async () => {
    try {
      setLoading(true)
      const token = getToken()
      if (!token) return

      const response = await fetch("/api/menu", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setMenuItems(data)
        setError("")
      } else {
        const errorData = await response.json()
        setError(errorData.message || "Failed to fetch menu items")
      }
    } catch {
      setError("Network error occurred")
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const createMenuItem = async () => {
    try {
      const token = getToken()
      if (!token) return

      const response = await fetch("/api/menu", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: menuForm.name,
          description: menuForm.description,
        }),
      })

      if (response.ok) {
        const newMenuItem = await response.json()
        setMenuItems([...menuItems, newMenuItem])
        setIsCreateDialogOpen(false)
        setMenuForm({ name: "", description: "" })
        setError("")
      } else {
        const errorData = await response.json()
        setError(errorData.message || "Failed to create menu item")
      }
    } catch {
      setError("Network error occurred")
    }
  }

  const updateMenuItem = async () => {
    try {
      const token = getToken()
      if (!token || !selectedMenuItem) return

      const response = await fetch("/api/menu", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: selectedMenuItem.id,
          name: menuForm.name,
          description: menuForm.description,
        }),
      })

      if (response.ok) {
        const updatedMenuItem = await response.json()
        setMenuItems(menuItems.map((item) => (item.id === updatedMenuItem.id ? updatedMenuItem : item)))
        setIsEditDialogOpen(false)
        setSelectedMenuItem(null)
        setMenuForm({ name: "", description: "" })
        setError("")
      } else {
        const errorData = await response.json()
        setError(errorData.message || "Failed to update menu item")
      }
    } catch {
      setError("Network error occurred")
    }
  }

  const deleteMenuItem = async (menuId: string) => {
    if (!confirm("Are you sure you want to delete this menu item?")) return

    try {
      const token = getToken()
      if (!token) return

      const response = await fetch(`/api/menu?id=${menuId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        setMenuItems(menuItems.filter((item) => item.id !== menuId))
        setError("")
      } else {
        const errorData = await response.json()
        setError(errorData.message || "Failed to delete menu item")
      }
    } catch {
      setError("Network error occurred")
    }
  }

  const openEditDialog = (menuItem: MenuData) => {
    setSelectedMenuItem(menuItem)
    setMenuForm({
      name: menuItem.name,
      description: menuItem.description,
    })
    setIsEditDialogOpen(true)
  }

  const openCreateDialog = () => {
    setMenuForm({ name: "", description: "" })
    setIsCreateDialogOpen(true)
  }

  const filteredMenuItems = menuItems.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  useEffect(() => {
    fetchMenuItems()
  }, [fetchMenuItems])

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200 rounded-xl p-6">
        <h2 className="text-3xl font-bold text-neutral-900">Menu Categories</h2>
        <p className="text-neutral-600 mt-2">
          Organize your menu with categories like Appetizers, Main Course, Drinks, etc.
        </p>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>}

      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="relative flex-1 w-full md:w-auto">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
          <input
            type="text"
            placeholder="Search categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>
        <button
          onClick={openCreateDialog}
          className="w-full md:w-auto bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors font-medium flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Category
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="text-neutral-600">Loading menu items...</div>
        </div>
      ) : filteredMenuItems.length === 0 ? (
        <div className="text-center py-12 bg-white border border-neutral-200 rounded-xl">
          <div className="text-6xl mb-4">🍽️</div>
          <h3 className="text-xl font-semibold text-neutral-900 mb-2">
            {searchQuery ? "No Categories Found" : "No Menu Categories Added Yet"}
          </h3>
          <p className="text-neutral-600 mb-6">
            {searchQuery
              ? "Try adjusting your search query."
              : "Start organizing your restaurant by creating menu categories like Appetizers, Main Course, Drinks, etc."}
          </p>
          {!searchQuery && (
            <button
              onClick={openCreateDialog}
              className="bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors font-medium inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Your First Menu Category
            </button>
          )}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMenuItems.map((item) => (
            <div
              key={item.id}
              className="bg-white border border-neutral-200 rounded-xl p-6 hover:shadow-lg hover:border-orange-300 transition-all duration-200"
            >
              <div className="mb-4">
                <h3 className="text-lg font-bold text-neutral-900 mb-2">{item.name}</h3>
                <p className="text-neutral-600 text-sm leading-relaxed line-clamp-2">
                  {item.description || "No description provided"}
                </p>
              </div>

              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => openEditDialog(item)}
                  className="flex-1 bg-neutral-100 text-neutral-700 px-3 py-2 rounded-lg hover:bg-neutral-200 transition-colors text-sm font-medium flex items-center justify-center gap-1"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() => deleteMenuItem(item.id)}
                  className="flex-1 bg-red-100 text-red-700 px-3 py-2 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium flex items-center justify-center gap-1"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isCreateDialogOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-lg">
            <h3 className="text-2xl font-bold text-neutral-900 mb-6">Create Menu Category</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-2">Menu Category Name *</label>
                <input
                  type="text"
                  value={menuForm.name}
                  onChange={(e) => setMenuForm({ ...menuForm, name: e.target.value })}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="e.g., Appetizers, Main Course, Desserts, Beverages"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-2">Description</label>
                <textarea
                  value={menuForm.description}
                  onChange={(e) => setMenuForm({ ...menuForm, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                  placeholder="Describe this menu category - what types of dishes it contains..."
                />
                <div className="text-xs text-neutral-500 mt-1">{menuForm.description.length}/500 characters</div>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setIsCreateDialogOpen(false)}
                className="flex-1 bg-neutral-100 text-neutral-700 px-4 py-2 rounded-lg hover:bg-neutral-200 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={createMenuItem}
                disabled={!menuForm.name.trim()}
                className="flex-1 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors font-medium disabled:opacity-50"
              >
                Create Menu Category
              </button>
            </div>
          </div>
        </div>
      )}

      {isEditDialogOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-lg">
            <h3 className="text-2xl font-bold text-neutral-900 mb-6">Edit Menu Category</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-2">Menu Category Name *</label>
                <input
                  type="text"
                  value={menuForm.name}
                  onChange={(e) => setMenuForm({ ...menuForm, name: e.target.value })}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="e.g., Appetizers, Main Course, Desserts, Beverages"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-2">Description</label>
                <textarea
                  value={menuForm.description}
                  onChange={(e) => setMenuForm({ ...menuForm, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                  placeholder="Describe this menu category - what types of dishes it contains..."
                />
                <div className="text-xs text-neutral-500 mt-1">{menuForm.description.length}/500 characters</div>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setIsEditDialogOpen(false)}
                className="flex-1 bg-neutral-100 text-neutral-700 px-4 py-2 rounded-lg hover:bg-neutral-200 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={updateMenuItem}
                disabled={!menuForm.name.trim()}
                className="flex-1 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors font-medium disabled:opacity-50"
              >
                Update Menu Category
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
