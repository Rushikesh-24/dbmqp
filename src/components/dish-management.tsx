"use client";

import type React from "react";

import { appCache, getRestaurantInfo } from "@/lib/utils";
import { useState, useEffect } from "react";

interface RestaurantInfo {
  name: string;
  currency: string;
}

interface IngredientData {
  id: string;
  name: string;
  allergen: string;
  calories: number;
  protein_grams: number;
  fats_grams: number;
  carbs_grams: number;
  quantity?: number;
  unit?: string;
}

interface DishData {
  id: string;
  name: string;
  description: string;
  price: number;
  course: string;
  availability: boolean;
  image_url?: string;
  menu_id?: string;
  menu_name?: string;
  prep_time_minutes?: number;
  cook_time_minutes?: number;
  dietary_restrictions?: string;
  spiciness_level?: number;
  ingredients?: IngredientData[];
}

interface DishFormData {
  name: string;
  description: string;
  price: string;
  course: string;
  availability: boolean;
  image_url?: string;
  menu_id: string;
  prep_time_minutes?: string;
  cook_time_minutes?: string;
  dietary_restrictions?: string;
  spiciness_level?: string;
  ingredients?: {
    ingredient_id: string;
    quantity: string;
    unit: string;
  }[];
}

interface DishManagementProps {
  menuFilter?: { menuId: string; menuName: string } | null;
}

// Helper to read a cookie (safe when running in the browser)
const getCookie = (name: string) => {
  if (typeof document !== "undefined") {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(";").shift() || null;
  }
  return null;
};

// Helper to read token from localStorage or cookie
const getToken = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("token") || getCookie("token");
  }
  return null;
};

export default function DishManagement({
  menuFilter,
}: DishManagementProps = {}) {
  const [dishes, setDishes] = useState<DishData[]>([]);
  const [menus, setMenus] = useState<{ id: string; name: string }[]>([]);
  const [allDishes, setAllDishes] = useState<DishData[]>([]); // All dishes in the database
  const [allIngredients, setAllIngredients] = useState<IngredientData[]>([]); // All ingredients in the database
  const [selectedMenuId, setSelectedMenuId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingDish, setEditingDish] = useState<DishData | null>(null);
  const [restaurantInfo, setRestaurantInfo] = useState<RestaurantInfo | null>(
    null
  );
  const [isSelectDishDialogOpen, setIsSelectDishDialogOpen] = useState(false);
  const [isNewIngredientDialogOpen, setIsNewIngredientDialogOpen] =
    useState(false);

  // Main form data for dish creation/editing
  const [formData, setFormData] = useState<DishFormData>({
    name: "",
    description: "",
    price: "",
    course: "",
    availability: true,
    image_url: "",
    menu_id: "",
    prep_time_minutes: "",
    cook_time_minutes: "",
    dietary_restrictions: "",
    spiciness_level: "0",
    ingredients: [],
  });

  // Form data for creating a new ingredient
  const [newIngredientForm, setNewIngredientForm] = useState({
    name: "",
    allergen: "",
    calories: "",
    protein_grams: "",
    fats_grams: "",
    carbs_grams: "",
  });

  // Dialog state for delete confirmation
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [dishToDeleteId, setDishToDeleteId] = useState("");

  const courseOptions = [
    "Appetizer",
    "Main Course",
    "Dessert",
    "Beverage",
    "Side Dish",
  ];
  const dietaryOptions = [
    "None",
    "Vegetarian",
    "Vegan",
    "Gluten-Free",
    "Dairy-Free",
    "Nut-Free",
    "Keto",
    "Low-Carb",
  ];
  const unitOptions = [
    "g",
    "kg",
    "ml",
    "l",
    "cup",
    "tbsp",
    "tsp",
    "piece",
    "slice",
  ];

  // Note: getToken/getCookie are defined at module scope below for stable identity

  const refreshDishes = async () => {
    try {
      setLoading(true);
      const token = getToken();
      if (!token) return;

      // If a specific menu is selected, fetch dishes for that menu. If selectedMenuId is empty, fetch all dishes.
      const url = selectedMenuId
        ? `/api/dishes?menu_id=${selectedMenuId}`
        : `/api/dishes`;
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setDishes(data);
        setError("");
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Failed to fetch dishes");
      }
    } catch {
      setError("Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const token = getToken();
    if (!token) {
      setError("No authentication token found");
      return;
    }

    try {
      setLoading(true);

      const dishData = {
        ...formData,
        price: Number.parseFloat(formData.price),
        prep_time_minutes: Number.parseInt(formData.prep_time_minutes || "0"),
        cook_time_minutes: Number.parseInt(formData.cook_time_minutes || "0"),
        spiciness_level: Number.parseInt(formData.spiciness_level || "0"),
        ingredients: formData.ingredients
          ?.filter((ing) => ing.ingredient_id && ing.quantity)
          .map((ing) => ({
            ingredient_id: ing.ingredient_id,
            quantity: Number.parseFloat(ing.quantity),
            unit: ing.unit,
          })),
      };

      const url = editingDish ? `/api/dishes/${editingDish.id}` : "/api/dishes";
      const method = editingDish ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(dishData),
      });

      if (response.ok) {
        appCache.invalidate("dishes");
        await refreshDishes();
        setShowForm(false);
        setEditingDish(null);
        setFormData({
          name: "",
          description: "",
          price: "",
          course: "",
          availability: true,
          image_url: "",
          menu_id: "",
          prep_time_minutes: "",
          cook_time_minutes: "",
          dietary_restrictions: "",
          spiciness_level: "0",
          ingredients: [],
        });
        setError("");
      } else {
        const errorData = await response.json();
        setError(
          errorData.message ||
            `Failed to ${editingDish ? "update" : "create"} dish`
        );
      }
    } catch {
      setError("Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (dish: DishData) => {
    setEditingDish(dish);
    setFormData({
      name: dish.name,
      description: dish.description,
      price: dish.price.toString(),
      course: dish.course,
      availability: dish.availability,
      image_url: dish.image_url || "",
      menu_id: dish.menu_id || "",
      prep_time_minutes: dish.prep_time_minutes?.toString() || "",
      cook_time_minutes: dish.cook_time_minutes?.toString() || "",
      dietary_restrictions: dish.dietary_restrictions || "",
      spiciness_level: dish.spiciness_level?.toString() || "0",
      ingredients: dish.ingredients?.map((ing) => ({
        ingredient_id: ing.id,
        quantity: ing.quantity?.toString() || "",
        unit: ing.unit || "",
      })),
    });
    setShowForm(true);
  };

  const handleDelete = async (dishId: string) => {
    setDishToDeleteId(dishId);
    setConfirmDelete(true);
  };

  const handleConfirmDelete = async () => {
    const token = getToken();
    if (!token || !dishToDeleteId) return;

    // Find the menu_id for the dish to delete
    let menuId = selectedMenuId;
    // If not filtered by menu, try to get from the dish object
    if (!menuId) {
      const dish = dishes.find((d) => d.id === dishToDeleteId);
      menuId = dish?.menu_id || "";
    }
    if (!menuId) {
      setError("Menu ID is required to delete a dish from a menu.");
      setConfirmDelete(false);
      setDishToDeleteId("");
      return;
    }

    try {
      const response = await fetch(
        `/api/dishes?id=${dishToDeleteId}&menu_id=${menuId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        appCache.invalidate("dishes");
        await refreshDishes();
        setError("");
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Failed to delete dish");
      }
    } catch {
      setError("Network error occurred");
    } finally {
      setConfirmDelete(false);
      setDishToDeleteId("");
    }
  };

  const fetchMenus = async () => {
    const token = getToken();
    if (token) {
      try {
        const menuResponse = await fetch("/api/menu", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (menuResponse.ok) {
          const menuData = await menuResponse.json();
          setMenus(menuData);
          // Do not auto-select the first menu. Keep selectedMenuId as-is so "All Menus" (empty string) works.
          // If a menuFilter prop is passed in, we'll handle that in initializeData via selectedMenuId state.
        }
      } catch (error) {
        console.error("Failed to fetch menus:", error);
      }
    }
  };

  const fetchIngredients = async () => {
    try {
      const token = getToken();
      if (!token) return;

      const response = await fetch(`/api/ingredients`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAllIngredients(data);
      }
    } catch {
      console.error("Failed to fetch ingredients");
    }
  };

  const fetchAllDishes = async () => {
    try {
      const token = getToken();
      if (!token) return;

      const response = await fetch(`/api/all-dishes`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAllDishes(data);
      }
    } catch {
      console.error("Failed to fetch all dishes");
    }
  };

  const addExistingDishToMenu = async (dishId: string) => {
    try {
      const token = getToken();
      if (!token || !selectedMenuId) return;

      const response = await fetch("/api/menu-dishes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          menu_id: selectedMenuId,
          dish_id: dishId,
        }),
      });

      if (response.ok) {
        appCache.invalidate("dishes");
        await refreshDishes();
        setIsSelectDishDialogOpen(false);
        setError("");
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Failed to add dish to menu");
      }
    } catch {
      setError("Network error occurred");
    }
  };

  const createNewIngredient = async () => {
    try {
      const token = getToken();
      if (!token) return;

      const response = await fetch("/api/ingredients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newIngredientForm.name,
          allergen: newIngredientForm.allergen,
          calories: Number.parseFloat(newIngredientForm.calories) || 0,
          protein_grams:
            Number.parseFloat(newIngredientForm.protein_grams) || 0,
          fats_grams: Number.parseFloat(newIngredientForm.fats_grams) || 0,
          carbs_grams: Number.parseFloat(newIngredientForm.carbs_grams) || 0,
        }),
      });

      if (response.ok) {
        await fetchIngredients();
        setIsNewIngredientDialogOpen(false);
        setNewIngredientForm({
          name: "",
          allergen: "",
          calories: "",
          protein_grams: "",
          fats_grams: "",
          carbs_grams: "",
        });
        setError("");
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Failed to create ingredient");
      }
    } catch {
      setError("Network error occurred");
    }
  };

  const addIngredientToDish = () => {
    setFormData({
      ...formData,
      ingredients: [
        ...(formData.ingredients || []),
        { ingredient_id: "", quantity: "", unit: "" },
      ],
    });
  };

  const removeIngredientFromDish = (index: number) => {
    const newIngredients = (formData.ingredients || []).filter(
      (_, i) => i !== index
    );
    setFormData({ ...formData, ingredients: newIngredients });
  };

  const updateDishIngredient = (
    index: number,
    field: string,
    value: string
  ) => {
    const newIngredients = [...(formData.ingredients || [])];
    newIngredients[index] = { ...newIngredients[index], [field]: value };
    setFormData({ ...formData, ingredients: newIngredients });
  };

  useEffect(() => {
    const initializeData = async () => {
      try {
        setLoading(true);

        const restaurant = await getRestaurantInfo();
        setRestaurantInfo(restaurant);

        const token = getToken();
        if (!token) return;

        await fetchMenus();
        await fetchIngredients();
        await fetchAllDishes();

        const cachedDishes = appCache.get("dishes");
        if (Array.isArray(cachedDishes)) {
          setDishes(cachedDishes);
          setLoading(false);
        }

        // Use selectedMenuId directly. If it's an empty string, fetch all dishes.
        const response = await fetch(
          selectedMenuId
            ? `/api/dishes?menu_id=${selectedMenuId}`
            : `/api/dishes`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          if (JSON.stringify(data) !== JSON.stringify(cachedDishes)) {
            setDishes(data);
            appCache.set("dishes", data, 2 * 60 * 1000);
          }
          setError("");
        } else {
          const errorData = await response.json();
          setError(errorData.message || "Failed to fetch dishes");
        }
      } catch {
        setError("Network error occurred");
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, [selectedMenuId, menus.length]);

  return (
    <div className="space-y-6 p-4 md:p-8 rounded-xl bg-gray-50 min-h-screen">
      <div className="bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200 rounded-xl p-6">
        <h2 className="text-3xl font-bold text-neutral-900">Dish Management</h2>
        <p className="text-neutral-600 mt-2">
          Manage your restaurant dishes and menu items
        </p>
        {menuFilter && (
          <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
            Filtered by: {menuFilter.menuName}
          </span>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div>
          <label className="text-sm font-semibold text-neutral-700 block mb-2">
            Filter by Menu:
          </label>
          <select
            value={selectedMenuId}
            onChange={(e) => setSelectedMenuId(e.target.value)}
            className="px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          >
            <option value="">All Menus</option>
            {menus.map((menu) => (
              <option key={menu.id} value={menu.id}>
                {menu.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
          <button
            onClick={() => setIsSelectDishDialogOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
          >
            <span>📋</span>
            <span>Select Existing Dish</span>
          </button>
          <button
            onClick={() => {
              setShowForm(true);
              setEditingDish(null);
              setFormData({
                name: "",
                description: "",
                price: "",
                course: "",
                availability: true,
                image_url: "",
                menu_id: "",
                prep_time_minutes: "",
                cook_time_minutes: "",
                dietary_restrictions: "",
                spiciness_level: "0",
                ingredients: [],
              });
            }}
            className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors font-medium flex items-center justify-center gap-2"
          >
            <span>➕</span>
            <span>Add New Dish</span>
          </button>
        </div>
      </div>

      {/* Dish Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold text-neutral-900 mb-6">
              {editingDish ? "Edit Dish" : "Add New Dish"}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-2">
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-2">
                    Price ({restaurantInfo?.currency || "₹"}) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-2">
                    Menu *
                  </label>
                  <select
                    value={formData.menu_id}
                    onChange={(e) =>
                      setFormData({ ...formData, menu_id: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select Menu</option>
                    {menus.map((menu) => (
                      <option key={menu.id} value={menu.id}>
                        {menu.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-2">
                    Course *
                  </label>
                  <select
                    value={formData.course}
                    onChange={(e) =>
                      setFormData({ ...formData, course: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select Course</option>
                    {courseOptions.map((course) => (
                      <option key={course} value={course}>
                        {course}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-2">
                    Dietary Restrictions
                  </label>
                  <select
                    value={formData.dietary_restrictions}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        dietary_restrictions: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    {dietaryOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-2">
                    Prep Time (min)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.prep_time_minutes}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        prep_time_minutes: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-2">
                    Cook Time (min)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.cook_time_minutes}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        cook_time_minutes: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-2">
                    Spiciness Level
                  </label>
                  <select
                    value={formData.spiciness_level}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        spiciness_level: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="0">No Spice</option>
                    <option value="1">Mild</option>
                    <option value="2">Medium</option>
                    <option value="3">Hot</option>
                    <option value="4">Very Hot</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-2">
                  Image URL (Optional)
                </label>
                <input
                  type="url"
                  value={formData.image_url}
                  onChange={(e) =>
                    setFormData({ ...formData, image_url: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="availability"
                  checked={formData.availability}
                  onChange={(e) =>
                    setFormData({ ...formData, availability: e.target.checked })
                  }
                  className="w-4 h-4 rounded border-neutral-300 text-orange-500 focus:ring-orange-500"
                />
                <label
                  htmlFor="availability"
                  className="ml-2 text-sm font-medium text-neutral-700"
                >
                  Available for ordering
                </label>
              </div>

              <div className="space-y-4 border-t pt-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-semibold text-neutral-900">
                    Ingredients
                  </h4>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setIsNewIngredientDialogOpen(true)}
                      className="text-xs bg-purple-600 text-white px-3 py-1 rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      New Ingredient
                    </button>
                    <button
                      type="button"
                      onClick={addIngredientToDish}
                      className="text-sm bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Add to Dish
                    </button>
                  </div>
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {(formData.ingredients || []).map((ingredient, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-4 gap-2 items-end"
                    >
                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-neutral-600 mb-1">
                          Ingredient
                        </label>
                        <select
                          value={ingredient.ingredient_id}
                          onChange={(e) =>
                            updateDishIngredient(
                              index,
                              "ingredient_id",
                              e.target.value
                            )
                          }
                          className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        >
                          <option value="">Select ingredient</option>
                          {allIngredients.map((ing) => (
                            <option key={ing.id} value={ing.id}>
                              {ing.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-neutral-600 mb-1">
                          Quantity
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          value={ingredient.quantity}
                          onChange={(e) =>
                            updateDishIngredient(
                              index,
                              "quantity",
                              e.target.value
                            )
                          }
                          className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          placeholder="0"
                        />
                      </div>

                      <div className="flex items-end gap-1">
                        <div className="flex-1">
                          <label className="block text-xs font-medium text-neutral-600 mb-1">
                            Unit
                          </label>
                          <select
                            value={ingredient.unit}
                            onChange={(e) =>
                              updateDishIngredient(
                                index,
                                "unit",
                                e.target.value
                              )
                            }
                            className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          >
                            <option value="">Unit</option>
                            {unitOptions.map((unit) => (
                              <option key={unit} value={unit}>
                                {unit}
                              </option>
                            ))}
                          </select>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeIngredientFromDish(index)}
                          className="text-red-600 hover:text-red-800 p-2"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingDish(null);
                  }}
                  className="flex-1 bg-neutral-100 text-neutral-700 px-4 py-2 rounded-lg hover:bg-neutral-200 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors font-medium disabled:opacity-50"
                >
                  {loading ? "Saving..." : editingDish ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm text-center">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Confirm Delete
            </h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete this dish?
            </p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => setConfirmDelete(false)}
                className="bg-gray-200 text-gray-800 px-4 py-2 rounded-xl hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="bg-red-600 text-white px-4 py-2 rounded-xl hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dishes Grid */}
      {loading && !showForm ? (
        <div className="text-center py-12">
          <div className="text-neutral-600">Loading dishes...</div>
        </div>
      ) : dishes.length === 0 ? (
        <div className="text-center py-12 bg-white border border-neutral-200 rounded-xl">
          <div className="text-6xl mb-4">🍽️</div>
          <h3 className="text-xl font-semibold text-neutral-900 mb-2">
            No Dishes Available
          </h3>
          <p className="text-neutral-600">
            Add your first dish to get started.
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dishes.map((dish) => (
            <div
              key={dish.id}
              className="bg-white border border-neutral-200 rounded-xl overflow-hidden hover:shadow-lg hover:border-orange-300 transition-all duration-200"
            >
              {dish.image_url && (
                <div className="h-48 bg-neutral-200">
                  <div
                    className="h-full w-full bg-cover bg-center"
                    style={{ backgroundImage: `url(${dish.image_url})` }}
                  />
                </div>
              )}

              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-bold text-neutral-900">
                    {dish.name}
                  </h3>
                  <span className="text-lg font-bold text-orange-600">
                    {restaurantInfo?.currency || "₹"}
                    {dish.price.toFixed(2)}
                  </span>
                </div>

                <p className="text-neutral-600 text-sm mb-3 line-clamp-2">
                  {dish.description}
                </p>

                <div className="flex items-center justify-between mb-4">
                  <span className="inline-block bg-orange-100 text-orange-700 text-xs px-2 py-1 rounded-full font-medium">
                    {dish.course}
                  </span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(dish)}
                    className="flex-1 bg-neutral-100 text-neutral-700 px-3 py-2 rounded-lg text-sm hover:bg-neutral-200 transition-colors font-medium"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(dish.id)}
                    className="flex-1 bg-red-100 text-red-700 px-3 py-2 rounded-lg text-sm hover:bg-red-200 transition-colors font-medium"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Select Existing Dish Dialog */}
      {isSelectDishDialogOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center mb-6">
              <span className="text-3xl mr-3">📋</span>
              <h3 className="text-2xl font-bold text-gray-900">
                Select Existing Dish
              </h3>
            </div>

            {allDishes.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">🍽️</div>
                <p className="text-gray-600">No existing dishes found.</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {allDishes
                  .filter(
                    (dish) =>
                      !dishes.some((menuDish) => menuDish.id === dish.id)
                  )
                  .map((dish) => (
                    <div
                      key={dish.id}
                      className="bg-gradient-to-br from-blue-50 to-cyan-50 p-4 rounded-xl border border-blue-200 hover:shadow-lg transition-all duration-200 cursor-pointer"
                      onClick={() => addExistingDishToMenu(dish.id)}
                    >
                      <h4 className="font-bold text-gray-900 mb-2">
                        {dish.name}
                      </h4>
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                        {dish.description || "No description"}
                      </p>
                      <div className="flex justify-between items-center text-sm">
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                          {dish.course || "Unspecified"}
                        </span>
                        <span className="font-semibold text-gray-900">
                          ₹{Number(dish.price).toFixed(2)}
                        </span>
                      </div>
                      {dish.ingredients && dish.ingredients.length > 0 && (
                        <div className="mt-2 text-xs text-gray-500">
                          {dish.ingredients.length} ingredient
                          {dish.ingredients.length !== 1 ? "s" : ""}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            )}

            <div className="flex space-x-3">
              <button
                onClick={() => setIsSelectDishDialogOpen(false)}
                className="flex-1 bg-gray-200 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors duration-200 font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create New Ingredient Dialog */}
      {isNewIngredientDialogOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-lg">
            <div className="flex items-center mb-6">
              <span className="text-3xl mr-3">🆕</span>
              <h3 className="text-2xl font-bold text-gray-900">
                Create New Ingredient
              </h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ingredient Name *
                </label>
                <input
                  type="text"
                  value={newIngredientForm.name}
                  onChange={(e) =>
                    setNewIngredientForm({
                      ...newIngredientForm,
                      name: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="e.g., Organic Tomatoes"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Allergen Information
                </label>
                <input
                  type="text"
                  value={newIngredientForm.allergen}
                  onChange={(e) =>
                    setNewIngredientForm({
                      ...newIngredientForm,
                      allergen: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="e.g., Contains nuts, gluten-free"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Calories (per 100g)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={newIngredientForm.calories}
                    onChange={(e) =>
                      setNewIngredientForm({
                        ...newIngredientForm,
                        calories: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Protein (g)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={newIngredientForm.protein_grams}
                    onChange={(e) =>
                      setNewIngredientForm({
                        ...newIngredientForm,
                        protein_grams: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fats (g)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={newIngredientForm.fats_grams}
                    onChange={(e) =>
                      setNewIngredientForm({
                        ...newIngredientForm,
                        fats_grams: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Carbohydrates (g)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={newIngredientForm.carbs_grams}
                    onChange={(e) =>
                      setNewIngredientForm({
                        ...newIngredientForm,
                        carbs_grams: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            <div className="flex space-x-3 mt-8">
              <button
                onClick={() => {
                  setIsNewIngredientDialogOpen(false);
                  setNewIngredientForm({
                    name: "",
                    allergen: "",
                    calories: "",
                    protein_grams: "",
                    fats_grams: "",
                    carbs_grams: "",
                  });
                }}
                className="flex-1 bg-gray-200 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors duration-200 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={createNewIngredient}
                disabled={!newIngredientForm.name.trim()}
                className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create & Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
