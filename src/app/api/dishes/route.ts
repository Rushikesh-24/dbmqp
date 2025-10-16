import { turso } from "@/lib/tursoclient";
import jwt from "jsonwebtoken";

// Get all dishes for a specific menu
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
    const menuId = url.searchParams.get("menu_id");

    if (!menuId) {
      // Return all dishes for the authenticated restaurant
      const { rows: dishRows } = await turso.execute(
      `
        SELECT DISTINCT d.*
        FROM dishes d
        JOIN menu_dishes md ON d.id = md.dish_id
        JOIN menus m ON md.menu_id = m.id
        WHERE m.restaurant_id = ?
        ORDER BY d.course, d.name
      `,
      [decoded.id]
      );

      // Get ingredients for each dish
      const dishesWithIngredients = await Promise.all(
      dishRows.map(async (dish) => {
        const { rows: ingredientRows } = await turso.execute(
        `
          SELECT 
          i.id,
          i.name,
          i.allergen,
          i.calories,
          i.protein_grams,
          i.fats_grams,
          i.carbs_grams,
          di.quantity,
          di.unit
          FROM dish_ingredients di
          JOIN ingredients i ON di.ingredient_id = i.id
          WHERE di.dish_id = ?
        `,
        [dish.id]
        );

        return {
        ...dish,
        ingredients: ingredientRows || [],
        };
      })
      );

      return Response.json(dishesWithIngredients);
    }

    // Verify the menu belongs to the authenticated restaurant
    const { rows: menuRows } = await turso.execute(
      "SELECT id FROM menus WHERE id = ? AND restaurant_id = ?",
      [menuId, decoded.id]
    );

    if (menuRows.length === 0) {
      return Response.json({ message: "Menu not found" }, { status: 404 });
    }

    // Get all dishes for this menu
    const { rows: dishRows } = await turso.execute(
      `
            SELECT DISTINCT d.*
            FROM dishes d
            JOIN menu_dishes md ON d.id = md.dish_id
            WHERE md.menu_id = ?
            ORDER BY d.course, d.name
        `,
      [menuId]
    );

    // Get ingredients for each dish
    const dishesWithIngredients = await Promise.all(
      dishRows.map(async (dish) => {
        const { rows: ingredientRows } = await turso.execute(
          `
                    SELECT 
                        i.id,
                        i.name,
                        i.allergen,
                        i.calories,
                        i.protein_grams,
                        i.fats_grams,
                        i.carbs_grams,
                        di.quantity,
                        di.unit
                    FROM dish_ingredients di
                    JOIN ingredients i ON di.ingredient_id = i.id
                    WHERE di.dish_id = ?
                `,
          [dish.id]
        );

        console.log(`Ingredients for dish ${dish.name}:`, ingredientRows);

        return {
          ...dish,
          ingredients: ingredientRows || [],
        };
      })
    );

    return Response.json(dishesWithIngredients);
  } catch (error) {
    console.error("Error fetching dishes:", error);
    return Response.json({ message: "Internal server error" }, { status: 500 });
  }
}

// Create a new dish and add it to a menu
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
    const {
      menu_id,
      name,
      description,
      price,
      prep_time_minutes,
      cook_time_minutes,
      course,
      dietary_restrictions,
      spiciness_level,
      image,
      ingredients,
    } = body;

    if (!menu_id || !name || price === undefined) {
      return Response.json(
        { message: "Menu ID, name, and price are required" },
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

    // Create new dish
    const result = await turso.execute(
      `
            INSERT INTO dishes (name, description, price, prep_time_minutes, cook_time_minutes, course, dietary_restrictions, spiciness_level) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
      [
        name,
        description || "",
        price,
        prep_time_minutes || 0,
        cook_time_minutes || 0,
        course || "",
        dietary_restrictions || "",
        spiciness_level || 0,
      ]
    );

    const dishId =
      typeof result.lastInsertRowid === "bigint"
        ? result.lastInsertRowid.toString()
        : result.lastInsertRowid;

    // Link dish to menu
    await turso.execute(
      `
            INSERT INTO menu_dishes (menu_id, dish_id) 
            VALUES (?, ?)
        `,
      [menu_id, dishId]
    );

    // Add ingredients if provided
    if (ingredients && Array.isArray(ingredients)) {
      for (const ingredient of ingredients) {
        if (ingredient.ingredient_id && ingredient.quantity) {
          await turso.execute(
            `
                        INSERT INTO dish_ingredients (dish_id, ingredient_id, quantity, unit) 
                        VALUES (?, ?, ?, ?)
                    `,
            [
              dishId,
              ingredient.ingredient_id,
              ingredient.quantity,
              ingredient.unit || "",
            ]
          );
        }
      }
    }

    const newDish = {
      id: dishId,
      name,
      description: description || "",
      price,
      prep_time_minutes: prep_time_minutes || 0,
      cook_time_minutes: cook_time_minutes || 0,
      course: course || "",
      dietary_restrictions: dietary_restrictions || "",
      spiciness_level: spiciness_level || 0,
      image: image || "",
      ingredients: ingredients || [],
    };

    return Response.json(newDish, { status: 201 });
  } catch (error) {
    console.error("Error creating dish:", error);
    if (error instanceof SyntaxError) {
      return Response.json({ message: "Invalid JSON body" }, { status: 400 });
    }
    return Response.json({ message: "Internal server error" }, { status: 500 });
  }
}

// Update a dish
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
    const {
      id,
      menu_id,
      name,
      description,
      price,
      prep_time_minutes,
      cook_time_minutes,
      course,
      dietary_restrictions,
      spiciness_level,
      ingredients,
    } = body;

    if (!id || !menu_id || !name || price === undefined) {
      return Response.json(
        { message: "ID, menu ID, name, and price are required" },
        { status: 400 }
      );
    }

    // Verify the menu belongs to the authenticated restaurant and dish exists in the menu
    const { rows: dishRows } = await turso.execute(
      `
            SELECT d.id 
            FROM dishes d
            JOIN menu_dishes md ON d.id = md.dish_id
            JOIN menus m ON md.menu_id = m.id
            WHERE d.id = ? AND m.id = ? AND m.restaurant_id = ?
        `,
      [id, menu_id, decoded.id]
    );

    if (dishRows.length === 0) {
      return Response.json(
        { message: "Dish not found in your menu" },
        { status: 404 }
      );
    }

    // Update dish
    const result = await turso.execute(
      `
            UPDATE dishes 
            SET name = ?, description = ?, price = ?, prep_time_minutes = ?, cook_time_minutes = ?, course = ?, dietary_restrictions = ?, spiciness_level = ?
            WHERE id = ?
        `,
      [
        name,
        description || "",
        price,
        prep_time_minutes || 0,
        cook_time_minutes || 0,
        course || "",
        dietary_restrictions || "",
        spiciness_level || 0,
        id,
      ]
    );

    if (result.rowsAffected === 0) {
      return Response.json({ message: "Dish not found" }, { status: 404 });
    }

    // Update ingredients - remove old ones and add new ones
    await turso.execute("DELETE FROM dish_ingredients WHERE dish_id = ?", [id]);

    if (ingredients && Array.isArray(ingredients)) {
      for (const ingredient of ingredients) {
        if (ingredient.ingredient_id && ingredient.quantity) {
          await turso.execute(
            `
                        INSERT INTO dish_ingredients (dish_id, ingredient_id, quantity, unit) 
                        VALUES (?, ?, ?, ?)
                    `,
            [
              id,
              ingredient.ingredient_id,
              ingredient.quantity,
              ingredient.unit || "",
            ]
          );
        }
      }
    }

    const updatedDish = {
      id,
      name,
      description: description || "",
      price,
      prep_time_minutes: prep_time_minutes || 0,
      cook_time_minutes: cook_time_minutes || 0,
      course: course || "",
      dietary_restrictions: dietary_restrictions || "",
      spiciness_level: spiciness_level || 0,
      ingredients: ingredients || [],
    };

    return Response.json(updatedDish);
  } catch (error) {
    console.error("Error updating dish:", error);
    if (error instanceof SyntaxError) {
      return Response.json({ message: "Invalid JSON body" }, { status: 400 });
    }
    return Response.json({ message: "Internal server error" }, { status: 500 });
  }
}

// Delete a dish
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
    const dishId = url.searchParams.get("id");
    const menuId = url.searchParams.get("menu_id");

    if (!dishId || !menuId) {
      return Response.json(
        { message: "Dish ID and Menu ID are required" },
        { status: 400 }
      );
    }

    // Verify the menu belongs to the authenticated restaurant and dish exists in the menu
    const { rows: dishRows } = await turso.execute(
      `
            SELECT d.id 
            FROM dishes d
            JOIN menu_dishes md ON d.id = md.dish_id
            JOIN menus m ON md.menu_id = m.id
            WHERE d.id = ? AND m.id = ? AND m.restaurant_id = ?
        `,
      [dishId, menuId, decoded.id]
    );

    if (dishRows.length === 0) {
      return Response.json(
        { message: "Dish not found in your menu" },
        { status: 404 }
      );
    }

    // Remove dish from restaurant's menu only (never delete from database)
    try {
      // Remove the dish from this specific restaurant's menu
      const result = await turso.execute(
        "DELETE FROM menu_dishes WHERE dish_id = ? AND menu_id = ?",
        [dishId, menuId]
      );

      if (result.rowsAffected === 0) {
        return Response.json(
          {
            message: "Dish was not found in this menu",
          },
          { status: 404 }
        );
      }

      // Always preserve the dish in the global dishes table for other restaurants
      return Response.json({
        message:
          "Dish removed from your menu successfully. The dish remains available for other restaurants.",
      });
    } catch (dbError) {
      console.error("Database error during menu removal:", dbError);
      return Response.json(
        {
          message: "Failed to remove dish from menu",
          error:
            dbError instanceof Error
              ? dbError.message
              : "Unknown database error",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error deleting dish:", error);
    return Response.json(
      {
        message: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
