"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Edit2, Trash2, AlertCircle, ChevronDown } from "lucide-react";

interface OpeningHours {
  [key: string]: {
    open: string;
    close: string;
    isOpen: boolean;
  };
}

interface RestaurantData {
  id: string;
  email: string;
  name: string;
  description?: string;
  address?: string;
  phone_number?: string;
  cuisine_type?: string;
  opening_hours?: string;
  image?: string;
}

export default function RestaurantInfo() {
  const [restaurantData, setRestaurantData] = useState<RestaurantData | null>(
    null
  );
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [expandedDays, setExpandedDays] = useState<string[]>([]);

  const [openingHours, setOpeningHours] = useState<OpeningHours>({
    monday: { open: "09:00", close: "22:00", isOpen: true },
    tuesday: { open: "09:00", close: "22:00", isOpen: true },
    wednesday: { open: "09:00", close: "22:00", isOpen: true },
    thursday: { open: "09:00", close: "22:00", isOpen: true },
    friday: { open: "09:00", close: "22:00", isOpen: true },
    saturday: { open: "10:00", close: "23:00", isOpen: true },
    sunday: { open: "10:00", close: "23:00", isOpen: true },
  });

  const router = useRouter();

  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    address: "",
    phone_number: "",
    cuisine_type: "",
    opening_hours: "",
    image: "",
  });

  const cuisineTypes = [
    "Italian",
    "Chinese",
    "Indian",
    "Mexican",
    "Japanese",
    "Thai",
    "French",
    "Mediterranean",
    "American",
    "Korean",
    "Vietnamese",
    "Greek",
    "Turkish",
    "Lebanese",
    "Spanish",
    "German",
    "British",
    "Brazilian",
    "Peruvian",
    "Ethiopian",
    "Moroccan",
    "Russian",
    "Argentine",
  ];

  const dayLabels = {
    monday: "Monday",
    tuesday: "Tuesday",
    wednesday: "Wednesday",
    thursday: "Thursday",
    friday: "Friday",
    saturday: "Saturday",
    sunday: "Sunday",
  };

  const dayOrder = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ];

  const dayShort = {
    monday: "Mon",
    tuesday: "Tue",
    wednesday: "Wed",
    thursday: "Thu",
    friday: "Fri",
    saturday: "Sat",
    sunday: "Sun",
  };

  /**
   * Parse the stored opening_hours string and compress consecutive days with identical hours.
   * Expected input examples:
   *  - "monday: 09:00 - 22:00; tuesday: 09:00 - 22:00; ..."
   *  - "monday: Closed; tuesday: 09:00 - 22:00; ..."
   * Output example: "Mon–Fri: 09:00–22:00; Sat–Sun: 10:00–23:00"
   */
  const formatOpeningHours = (openingHoursStr?: string | null) => {
    if (!openingHoursStr) return "";

    // Build map day -> value
    const entries = openingHoursStr
      .split(";")
      .map((s) => s.trim())
      .filter(Boolean);

    const map: Record<string, string> = {};
    entries.forEach((entry) => {
      const idx = entry.indexOf(":");
      if (idx === -1) return;
      const key = entry.slice(0, idx).trim().toLowerCase();
      const val = entry.slice(idx + 1).trim();
      map[key] = val;
    });

    // Ensure we have a value for each day; if missing, mark as "Not specified"
    const values = dayOrder.map((d) => map[d] ?? "Not specified");

    // Group consecutive days with same value
    const groups: { start: number; end: number; val: string }[] = [];
    let i = 0;
    while (i < values.length) {
      const val = values[i];
      let j = i;
      while (j + 1 < values.length && values[j + 1] === val) j++;
      groups.push({ start: i, end: j, val });
      i = j + 1;
    }

    // Build compact strings
    const parts: string[] = groups.map((g) => {
      const label =
        g.start === g.end
          ? dayShort[dayOrder[g.start] as keyof typeof dayShort]
          : `${dayShort[dayOrder[g.start] as keyof typeof dayShort]}–${
              dayShort[dayOrder[g.end] as keyof typeof dayShort]
            }`;
      // Normalize separators for compactness
      const v = g.val.replace(/\s*-\s*/g, "–");
      return `${label}: ${v}`;
    });

    return parts.join("; ");
  };

  const getToken = () => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("token") || getCookie("token");
    }
    return null;
  };

  const getCookie = (name: string) => {
    if (typeof document !== "undefined") {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(";").shift();
    }
    return null;
  };

  const decodeJWT = (token: string) => {
    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error("Error decoding JWT:", error);
      return null;
    }
  };

  const fetchRestaurantData = useCallback(async () => {
    try {
      const token = getToken();
      if (!token) {
        router.push("/signin");
        return;
      }

      const decoded = decodeJWT(token);
      if (!decoded) {
        router.push("/signin");
        return;
      }

      const response = await fetch("/api/restaurant", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setRestaurantData(data);
        setEditForm({
          name: data.name || "",
          description: data.description || "",
          address: data.address || "",
          phone_number: data.phone_number || "",
          cuisine_type: data.cuisine_type || "",
          opening_hours: data.opening_hours || "",
          image: data.image || "",
        });
      } else if (response.status === 401) {
        router.push("/signin");
      } else {
        setError("Failed to fetch restaurant data");
      }
    } catch {
      setError("Network error occurred");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const updateRestaurantData = async () => {
    try {
      setSaving(true);
      const token = getToken();

      const openingHoursString = Object.entries(openingHours)
        .map(([day, hours]) => {
          if (!hours.isOpen) return `${day}: Closed`;
          return `${day}: ${hours.open} - ${hours.close}`;
        })
        .join("; ");

      const response = await fetch("/api/restaurant", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...editForm,
          opening_hours: formatOpeningHours(openingHoursString),
        }),
      });

      if (response.ok) {
        const updatedData = await response.json();
        setRestaurantData(updatedData);
        setIsEditDialogOpen(false);
        setError("");
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Failed to update restaurant");
      }
    } catch {
      setError("Network error occurred");
    } finally {
      setSaving(false);
    }
  };

  const deleteRestaurant = async () => {
    if (deleteConfirmation !== restaurantData?.name) {
      setError(
        "Please type the restaurant name exactly as shown to confirm deletion."
      );
      return;
    }

    try {
      setDeleting(true);
      const token = getToken();

      const response = await fetch("/api/restaurant", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        localStorage.removeItem("token");
        document.cookie =
          "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        router.push("/signup?message=account-deleted");
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Failed to delete restaurant account");
      }
    } catch {
      setError("Network error occurred");
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    fetchRestaurantData();
  }, [fetchRestaurantData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-neutral-600">
          Loading restaurant information...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {restaurantData && (
        <>
          <div className="bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200 rounded-xl p-8">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="text-3xl font-bold text-neutral-900">
                    {restaurantData.name || "Unnamed Restaurant"}
                  </h2>
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                    Active
                  </span>
                </div>
                <p className="text-neutral-600 mb-2">{restaurantData.email}</p>
                {restaurantData.description && (
                  <p className="text-neutral-700 max-w-2xl leading-relaxed">
                    {restaurantData.description}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsEditDialogOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition-colors font-medium"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() => setIsDeleteDialogOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors font-medium"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white border border-neutral-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                  <span className="text-lg">📍</span>
                </div>
                <h4 className="font-semibold text-neutral-900">Address</h4>
              </div>
              <p className="text-neutral-600">
                {restaurantData.address || "No address provided"}
              </p>
            </div>

            <div className="bg-white border border-neutral-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                  <span className="text-lg">📞</span>
                </div>
                <h4 className="font-semibold text-neutral-900">Phone</h4>
              </div>
              <p className="text-neutral-600">
                {restaurantData.phone_number || "No phone provided"}
              </p>
            </div>

            <div className="bg-white border border-neutral-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                  <span className="text-lg">🍽️</span>
                </div>
                <h4 className="font-semibold text-neutral-900">Cuisine</h4>
              </div>
              <p className="text-neutral-600">
                {restaurantData.cuisine_type || "Not specified"}
              </p>
            </div>

            <div className="md:col-span-2 lg:col-span-1 bg-white border border-neutral-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                  <span className="text-lg">🕒</span>
                </div>
                <h4 className="font-semibold text-neutral-900">Hours</h4>
              </div>
              <p className="text-neutral-600 text-sm">
                {(formatOpeningHours(restaurantData.opening_hours)) ||
                  "Not specified"}
              </p>
            </div>

            {restaurantData.image && (
              <div className="md:col-span-2 lg:col-span-1 bg-white border border-neutral-200 rounded-lg p-6">
                <h4 className="font-semibold text-neutral-900 mb-3">
                  Restaurant Image
                </h4>
                <div className="relative w-full h-40 rounded-lg overflow-hidden border border-neutral-200">
                  <Image
                    src={restaurantData.image || "/placeholder.svg"}
                    alt="Restaurant"
                    fill
                    className="object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = "none";
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {isEditDialogOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold text-neutral-900 mb-6">
              Edit Restaurant Details
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-2">
                  Restaurant Name *
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm({ ...editForm, name: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-2">
                  Description
                </label>
                <textarea
                  value={editForm.description}
                  onChange={(e) =>
                    setEditForm({ ...editForm, description: e.target.value })
                  }
                  rows={3}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-2">
                  Address
                </label>
                <input
                  type="text"
                  value={editForm.address}
                  onChange={(e) =>
                    setEditForm({ ...editForm, address: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={editForm.phone_number}
                  onChange={(e) =>
                    setEditForm({ ...editForm, phone_number: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-2">
                  Cuisine Type
                </label>
                <select
                  value={editForm.cuisine_type}
                  onChange={(e) =>
                    setEditForm({ ...editForm, cuisine_type: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="">Select cuisine type</option>
                  {cuisineTypes.map((cuisine) => (
                    <option key={cuisine} value={cuisine}>
                      {cuisine}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-2">
                  Image URL
                </label>
                <input
                  type="text"
                  value={editForm.image}
                  onChange={(e) =>
                    setEditForm({ ...editForm, image: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div className="border-t pt-6">
                <h4 className="text-lg font-semibold text-neutral-900 mb-4">
                  Opening Hours
                </h4>
                <div className="space-y-3">
                  {Object.entries(openingHours).map(([day, hours]) => (
                    <div
                      key={day}
                      className="border border-neutral-200 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <label className="flex items-center gap-3 cursor-pointer flex-1">
                          <input
                            type="checkbox"
                            checked={hours.isOpen}
                            onChange={(e) =>
                              setOpeningHours({
                                ...openingHours,
                                [day]: { ...hours, isOpen: e.target.checked },
                              })
                            }
                            className="w-4 h-4 rounded border-neutral-300 text-orange-500 focus:ring-orange-500"
                          />
                          <span className="font-medium text-neutral-900">
                            {dayLabels[day as keyof typeof dayLabels]}
                          </span>
                        </label>
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedDays(
                              expandedDays.includes(day)
                                ? expandedDays.filter((d) => d !== day)
                                : [...expandedDays, day]
                            )
                          }
                          className="p-1 hover:bg-neutral-100 rounded"
                        >
                          <ChevronDown
                            className={`w-4 h-4 transition-transform ${
                              expandedDays.includes(day) ? "rotate-180" : ""
                            }`}
                          />
                        </button>
                      </div>

                      {expandedDays.includes(day) && hours.isOpen && (
                        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-neutral-200">
                          <div>
                            <label className="block text-xs font-medium text-neutral-600 mb-1">
                              Opening Time
                            </label>
                            <input
                              type="time"
                              value={hours.open}
                              onChange={(e) =>
                                setOpeningHours({
                                  ...openingHours,
                                  [day]: { ...hours, open: e.target.value },
                                })
                              }
                              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-neutral-600 mb-1">
                              Closing Time
                            </label>
                            <input
                              type="time"
                              value={hours.close}
                              onChange={(e) =>
                                setOpeningHours({
                                  ...openingHours,
                                  [day]: { ...hours, close: e.target.value },
                                })
                              }
                              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            />
                          </div>
                        </div>
                      )}

                      {!hours.isOpen && (
                        <p className="text-sm text-neutral-500 italic">
                          Closed
                        </p>
                      )}
                    </div>
                  ))}
                </div>
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
                onClick={updateRestaurantData}
                disabled={saving || !editForm.name.trim()}
                className="flex-1 px-4 py-2 rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition-colors font-medium disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {isDeleteDialogOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-md">
            <h3 className="text-2xl font-bold text-red-600 mb-4">
              Delete Restaurant Account
            </h3>
            <p className="text-neutral-700 mb-4">
              This action cannot be undone. All your data will be permanently
              deleted.
            </p>
            <p className="text-sm text-neutral-600 mb-4">
              Type &quot;<strong>{restaurantData?.name}</strong>&quot; to
              confirm:
            </p>
            <input
              type="text"
              value={deleteConfirmation}
              onChange={(e) => setDeleteConfirmation(e.target.value)}
              className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent mb-6"
              placeholder="Restaurant name"
            />

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setIsDeleteDialogOpen(false);
                  setDeleteConfirmation("");
                  setError("");
                }}
                className="flex-1 px-4 py-2 rounded-lg bg-neutral-100 text-neutral-700 hover:bg-neutral-200 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={deleteRestaurant}
                disabled={
                  deleting || deleteConfirmation !== restaurantData?.name
                }
                className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors font-medium disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete Forever"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
