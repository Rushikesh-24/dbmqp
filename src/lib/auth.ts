// Utility function to get token from localStorage or cookies
export function getToken(): string | null {
  if (typeof window === "undefined") return null;

  // Try localStorage first
  const localToken = localStorage.getItem("token");
  if (localToken) return localToken;

  // Fallback to cookies
  const cookies = document.cookie.split(";");
  const tokenCookie = cookies.find((cookie) =>
    cookie.trim().startsWith("token=")
  );

  return tokenCookie ? tokenCookie.split("=")[1] : null;
}

// Utility function to validate token format (basic JWT check)
export function isValidTokenFormat(token: string): boolean {
  if (!token) return false;

  // Basic JWT format check (3 parts separated by dots)
  const parts = token.split(".");
  if (parts.length !== 3) return false;

  try {
    // Check if payload is valid JSON
    const payload = JSON.parse(atob(parts[1]));

    // Check if token is not expired
    if (payload.exp && payload.exp < Date.now() / 1000) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

// Main function to check if user is authenticated
export function isAuthenticated(): boolean {
  const token = getToken();
  return token ? isValidTokenFormat(token) : false;
}
