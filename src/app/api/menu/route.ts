import { turso } from "@/lib/tursoclient";
import jwt from "jsonwebtoken";

interface MenuData {
  name: string;
  description: string;
}

// Get all menu items for a restaurant or a specific menu item
export async function GET(request: Request) {
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
    const menuId = url.searchParams.get("id");

    if (menuId) {
      // Get specific menu item
      const { rows } = await turso.execute(
        "SELECT * FROM menus WHERE id = ? AND restaurant_id = ?",
        [menuId, decoded.id]
      );

      if (rows.length === 0) {
        return Response.json({ message: "Menu not found" }, { status: 404 });
      }

      return Response.json(rows[0]);
    } else {
      // Get all menu items for this restaurant
      const { rows } = await turso.execute(
        "SELECT * FROM menus WHERE restaurant_id = ? ORDER BY name",
        [decoded.id]
      );

      return Response.json(rows);
    }
  } catch (error) {
    console.error("Error fetching menu items:", error);
    return Response.json({ message: "Internal server error" }, { status: 500 });
  }
}

// Create a new menu item
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
    const { name, description }: MenuData = body;

    if (!name) {
      return Response.json(
        { message: "Menu item name is required" },
        { status: 400 }
      );
    }

    // Check if menu item name already exists for this restaurant
    const { rows: existingItems } = await turso.execute(
      "SELECT id FROM menus WHERE restaurant_id = ? AND name = ?",
      [decoded.id, name]
    );

    if (existingItems.length > 0) {
      return Response.json(
        { message: "Menu item with this name already exists" },
        { status: 409 }
      );
    }

    // Create new menu item
    const result = await turso.execute(
      `
            INSERT INTO menus (restaurant_id, name, description) 
            VALUES (?, ?, ?)
        `,
      [decoded.id, name, description || ""]
    );

    const menuId =
      typeof result.lastInsertRowid === "bigint"
        ? result.lastInsertRowid.toString()
        : result.lastInsertRowid;

    const newMenuItem = {
      id: menuId,
      restaurant_id: decoded.id,
      name,
      description: description || "",
    };

    return Response.json(newMenuItem, { status: 201 });
  } catch (error) {
    console.error("Error creating menu item:", error);
    if (error instanceof SyntaxError) {
      return Response.json({ message: "Invalid JSON body" }, { status: 400 });
    }
    return Response.json({ message: "Internal server error" }, { status: 500 });
  }
}

// Update a menu item
export async function PUT(request: Request) {
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
    const { id, name, description }: MenuData & { id: string } = body;

    if (!id || !name) {
      return Response.json(
        { message: "ID and menu item name are required" },
        { status: 400 }
      );
    }

    // Check if menu item name already exists for this restaurant (excluding current item)
    const { rows: existingItems } = await turso.execute(
      "SELECT id FROM menus WHERE restaurant_id = ? AND name = ? AND id != ?",
      [decoded.id, name, id]
    );

    if (existingItems.length > 0) {
      return Response.json(
        { message: "Menu item with this name already exists" },
        { status: 409 }
      );
    }

    // Update menu item
    const result = await turso.execute(
      `
            UPDATE menus 
            SET name = ?, description = ?
            WHERE id = ? AND restaurant_id = ?
        `,
      [name, description || "", id, decoded.id]
    );

    if (result.rowsAffected === 0) {
      return Response.json({ message: "Menu item not found" }, { status: 404 });
    }

    const updatedMenuItem = {
      id,
      restaurant_id: decoded.id,
      name,
      description: description || "",
    };

    return Response.json(updatedMenuItem);
  } catch (error) {
    console.error("Error updating menu item:", error);
    if (error instanceof SyntaxError) {
      return Response.json({ message: "Invalid JSON body" }, { status: 400 });
    }
    return Response.json({ message: "Internal server error" }, { status: 500 });
  }
}

// Delete a menu item
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
    const menuId = url.searchParams.get("id");

    if (!menuId) {
      return Response.json(
        { message: "Menu item ID is required" },
        { status: 400 }
      );
    }

    // Delete menu item
    const result = await turso.execute(
      `
            DELETE FROM menus 
            WHERE id = ? AND restaurant_id = ?
        `,
      [menuId, decoded.id]
    );

    if (result.rowsAffected === 0) {
      return Response.json({ message: "Menu item not found" }, { status: 404 });
    }

    return Response.json({ message: "Menu item deleted successfully" });
  } catch (error) {
    console.error("Error deleting menu item:", error);
    return Response.json({ message: "Internal server error" }, { status: 500 });
  }
}
