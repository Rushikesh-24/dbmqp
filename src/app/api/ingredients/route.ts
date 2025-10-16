import { turso } from "@/lib/tursoclient";
import jwt from "jsonwebtoken";

interface IngredientData {
  name: string;
  allergen: string;
  calories: number;
  protein_grams: number;
  fats_grams: number;
  carbs_grams: number;
}

// Get all ingredients
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

    // Get all ingredients (global list)
    const { rows } = await turso.execute(
      "SELECT * FROM ingredients ORDER BY name"
    );

    return Response.json(rows);
  } catch (error) {
    console.error("Error fetching ingredients:", error);
    return Response.json({ message: "Internal server error" }, { status: 500 });
  }
}

// Create a new ingredient
export async function POST(request: Request) {
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

    const body = await request.json();
    const {
      name,
      allergen,
      calories,
      protein_grams,
      fats_grams,
      carbs_grams,
    }: IngredientData = body;

    if (!name) {
      return Response.json(
        { message: "Ingredient name is required" },
        { status: 400 }
      );
    }

    // Check if ingredient already exists
    const { rows: existingIngredients } = await turso.execute(
      "SELECT id FROM ingredients WHERE name = ?",
      [name]
    );

    if (existingIngredients.length > 0) {
      return Response.json(
        { message: "Ingredient with this name already exists" },
        { status: 409 }
      );
    }

    // Create new ingredient
    const result = await turso.execute(
      `
            INSERT INTO ingredients (name, allergen, calories, protein_grams, fats_grams, carbs_grams) 
            VALUES (?, ?, ?, ?, ?, ?)
        `,
      [
        name,
        allergen || "",
        calories || 0,
        protein_grams || 0,
        fats_grams || 0,
        carbs_grams || 0,
      ]
    );

    const ingredientId =
      typeof result.lastInsertRowid === "bigint"
        ? result.lastInsertRowid.toString()
        : result.lastInsertRowid;

    const newIngredient = {
      id: ingredientId,
      name,
      allergen: allergen || "",
      calories: calories || 0,
      protein_grams: protein_grams || 0,
      fats_grams: fats_grams || 0,
      carbs_grams: carbs_grams || 0,
    };

    return Response.json(newIngredient, { status: 201 });
  } catch (error) {
    console.error("Error creating ingredient:", error);
    if (error instanceof SyntaxError) {
      return Response.json({ message: "Invalid JSON body" }, { status: 400 });
    }
    return Response.json({ message: "Internal server error" }, { status: 500 });
  }
}

// Update an ingredient
export async function PUT(request: Request) {
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

    const body = await request.json();
    const {
      id,
      name,
      allergen,
      calories,
      protein_grams,
      fats_grams,
      carbs_grams,
    }: IngredientData & { id: string } = body;

    if (!id || !name) {
      return Response.json(
        { message: "ID and ingredient name are required" },
        { status: 400 }
      );
    }

    // Check if ingredient name already exists (excluding current ingredient)
    const { rows: existingIngredients } = await turso.execute(
      "SELECT id FROM ingredients WHERE name = ? AND id != ?",
      [name, id]
    );

    if (existingIngredients.length > 0) {
      return Response.json(
        { message: "Ingredient with this name already exists" },
        { status: 409 }
      );
    }

    // Update ingredient
    const result = await turso.execute(
      `
            UPDATE ingredients 
            SET name = ?, allergen = ?, calories = ?, protein_grams = ?, fats_grams = ?, carbs_grams = ?
            WHERE id = ?
        `,
      [
        name,
        allergen || "",
        calories || 0,
        protein_grams || 0,
        fats_grams || 0,
        carbs_grams || 0,
        id,
      ]
    );

    if (result.rowsAffected === 0) {
      return Response.json(
        { message: "Ingredient not found" },
        { status: 404 }
      );
    }

    const updatedIngredient = {
      id,
      name,
      allergen: allergen || "",
      calories: calories || 0,
      protein_grams: protein_grams || 0,
      fats_grams: fats_grams || 0,
      carbs_grams: carbs_grams || 0,
    };

    return Response.json(updatedIngredient);
  } catch (error) {
    console.error("Error updating ingredient:", error);
    if (error instanceof SyntaxError) {
      return Response.json({ message: "Invalid JSON body" }, { status: 400 });
    }
    return Response.json({ message: "Internal server error" }, { status: 500 });
  }
}

// Delete an ingredient
export async function DELETE(request: Request) {
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

    const url = new URL(request.url);
    const ingredientId = url.searchParams.get("id");

    if (!ingredientId) {
      return Response.json(
        { message: "Ingredient ID is required" },
        { status: 400 }
      );
    }

    // Check if ingredient is being used in any dishes
    const { rows: usageRows } = await turso.execute(
      "SELECT COUNT(*) as count FROM dish_ingredients WHERE ingredient_id = ?",
      [ingredientId]
    );

    if (usageRows[0] && Number(usageRows[0].count) > 0) {
      return Response.json(
        {
          message: "Cannot delete ingredient as it is being used in dishes",
        },
        { status: 409 }
      );
    }

    // Delete ingredient
    const result = await turso.execute("DELETE FROM ingredients WHERE id = ?", [
      ingredientId,
    ]);

    if (result.rowsAffected === 0) {
      return Response.json(
        { message: "Ingredient not found" },
        { status: 404 }
      );
    }

    return Response.json({ message: "Ingredient deleted successfully" });
  } catch (error) {
    console.error("Error deleting ingredient:", error);
    return Response.json({ message: "Internal server error" }, { status: 500 });
  }
}
