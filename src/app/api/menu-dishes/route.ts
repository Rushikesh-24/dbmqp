import { turso } from "@/lib/tursoclient";
import jwt from "jsonwebtoken";

// Add existing dish to menu
export async function POST(request: Request) {
  try {
    const authorization = request.headers.get("authorization");
    if (!authorization || !authorization.startsWith("Bearer ")) {
      return Response.json({ message: "Unauthorized" }, { status: 401 });
    }

    const token = authorization.substring(7);
    let decoded;

    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
        id: string;
        email: string;
      };
    } catch {
      return Response.json({ message: "Invalid token" }, { status: 401 });
    }

    const body = await request.json();
    const { menu_id, dish_id } = body;

    if (!menu_id || !dish_id) {
      return Response.json(
        { message: "Menu ID and Dish ID are required" },
        { status: 400 }
      );
    }

    // Verify the menu belongs to the authenticated restaurant
    const { rows: menuRows } = await turso.execute(
      "SELECT id FROM menus WHERE id = ? AND restaurant_id = ?",
      [menu_id, decoded.id]
    );

    if (menuRows.length === 0) {
      return Response.json({ message: "Menu not found" }, { status: 404 });
    }

    // Check if dish exists
    const { rows: dishRows } = await turso.execute(
      "SELECT id FROM dishes WHERE id = ?",
      [dish_id]
    );

    if (dishRows.length === 0) {
      return Response.json({ message: "Dish not found" }, { status: 404 });
    }

    // Check if dish is already in the menu
    const { rows: existingRows } = await turso.execute(
      "SELECT menu_id, dish_id FROM menu_dishes WHERE menu_id = ? AND dish_id = ?",
      [menu_id, dish_id]
    );

    if (existingRows.length > 0) {
      return Response.json(
        { message: "Dish is already in this menu" },
        { status: 409 }
      );
    }

    // Add dish to menu
    await turso.execute(
      "INSERT INTO menu_dishes (menu_id, dish_id) VALUES (?, ?)",
      [menu_id, dish_id]
    );

    return Response.json({ message: "Dish added to menu successfully" });
  } catch (error) {
    console.error("Error adding dish to menu:", error);
    return Response.json({ message: "Internal server error" }, { status: 500 });
  }
}

// Remove dish from menu (but keep the dish in global dishes table)
export async function DELETE(request: Request) {
  try {
    const authorization = request.headers.get("authorization");
    if (!authorization || !authorization.startsWith("Bearer ")) {
      return Response.json({ message: "Unauthorized" }, { status: 401 });
    }

    const token = authorization.substring(7);
    let decoded;

    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
        id: string;
        email: string;
      };
    } catch {
      return Response.json({ message: "Invalid token" }, { status: 401 });
    }

    const url = new URL(request.url);
    const menu_id = url.searchParams.get("menu_id");
    const dish_id = url.searchParams.get("dish_id");

    if (!menu_id || !dish_id) {
      return Response.json(
        { message: "Menu ID and Dish ID are required" },
        { status: 400 }
      );
    }

    // Verify the menu belongs to the authenticated restaurant
    const { rows: menuRows } = await turso.execute(
      "SELECT id FROM menus WHERE id = ? AND restaurant_id = ?",
      [menu_id, decoded.id]
    );

    if (menuRows.length === 0) {
      return Response.json({ message: "Menu not found" }, { status: 404 });
    }

    // Remove dish from menu (but keep dish in global dishes table)
    const result = await turso.execute(
      "DELETE FROM menu_dishes WHERE menu_id = ? AND dish_id = ?",
      [menu_id, dish_id]
    );

    if (result.rowsAffected === 0) {
      return Response.json(
        { message: "Dish not found in this menu" },
        { status: 404 }
      );
    }

    return Response.json({ message: "Dish removed from menu successfully" });
  } catch (error) {
    console.error("Error removing dish from menu:", error);
    return Response.json({ message: "Internal server error" }, { status: 500 });
  }
}
