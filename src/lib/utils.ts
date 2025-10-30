import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Cache utility for managing application data cache
interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiresIn: number;
}

class AppCache {
  private cache = new Map<string, CacheItem<unknown>>();

  set<T>(key: string, data: T, expiresInMs: number = 5 * 60 * 1000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiresIn: expiresInMs,
    });
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() - item.timestamp > item.expiresIn) {
      this.cache.delete(key);
      return null;
    }

    return item.data as T;
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }

  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }
}

export const appCache = new AppCache();

// Restaurant context utility
export interface RestaurantInfo {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  currency: string;
}

export const getRestaurantInfo = async (): Promise<RestaurantInfo | null> => {
  try {
    // Check cache first
    const cached = appCache.get<RestaurantInfo>("restaurant-info");
    if (cached) return cached;

    const token = getToken();
    if (!token) return null;

    const response = await fetch("/api/restaurant", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      const restaurantInfo: RestaurantInfo = {
        id: data.id || "1",
        name: data.name || "Restaurant",
        address: data.address || "",
        phone: data.phone || "",
        email: data.email || "",
        currency: data.currency || "₹",
      };

      // Cache for 5 minutes
      appCache.set("restaurant-info", restaurantInfo, 5 * 60 * 1000);
      return restaurantInfo;
    }
  } catch (error) {
    console.error("Failed to fetch restaurant info:", error);
  }

  // Return default values if fetch fails
  return {
    id: "1",
    name: "Restaurant",
    address: "",
    phone: "",
    email: "",
    currency: "₹",
  };
};

const getToken = (): string | null => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("token") || getCookie("token");
  }
  return null;
};

const getCookie = (name: string): string | null => {
  if (typeof document !== "undefined") {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(";").shift() || null;
  }
  return null;
};

export function setCookie(name: string, value: string, days = 7) {
  console.log("Setting cookie:", { name, value, days });
  const expires = new Date()
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000)
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`
}
