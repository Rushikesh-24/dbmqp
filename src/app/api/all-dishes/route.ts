import { turso } from "@/lib/tursoclient";
import jwt from "jsonwebtoken";

// Get all existing dishes (for selection when adding to menus)
export async function GET(request: Request) {
  try {
    const authorization = request.headers.get("authorization");
    if (!authorization || !authorization.startsWith("Bearer ")) {
      return Response.json({ message: "Unauthorized" }, { status: 401 });
    }

    const token = authorization.substring(7);

    try {
      jwt.verify(token, process.env.JWT_SECRET as string) as {
        id: string;
        email: string;
      };
    } catch {
      return Response.json({ message: "Invalid token" }, { status: 401 });
    }

    // Get all dishes with their ingredients (global list for selection)
    const { rows } = await turso.execute(`
      SELECT 
        d.*,
        GROUP_CONCAT(
          CASE WHEN i.name IS NOT NULL THEN 
            json_object(
              'id', i.id,
              'name', i.name,
              'allergen', i.allergen,
              'calories', i.calories,
              'protein_grams', i.protein_grams,
              'fats_grams', i.fats_grams,
              'carbs_grams', i.carbs_grams,
              'quantity', di.quantity,
              'unit', di.unit
            )
          END
        ) as ingredients_json
      FROM dishes d
      LEFT JOIN dish_ingredients di ON d.id = di.dish_id
      LEFT JOIN ingredients i ON di.ingredient_id = i.id
      GROUP BY d.id
      ORDER BY d.course, d.name
    `);

    // Parse ingredients JSON for each dish
    const dishesWithIngredients = rows.map((row) => ({
      ...row,
      ingredients:
        row.ingredients_json && typeof row.ingredients_json === "string"
          ? row.ingredients_json
              .split(",")
              .map((ingredientStr: string) => {
                try {
                  return JSON.parse(ingredientStr);
                } catch {
                  return null;
                }
              })
              .filter(Boolean)
          : [],
    }));

    return Response.json(dishesWithIngredients);
  } catch (error) {
    console.error("Error fetching all dishes:", error);
    return Response.json({ message: "Internal server error" }, { status: 500 });
  }
}
