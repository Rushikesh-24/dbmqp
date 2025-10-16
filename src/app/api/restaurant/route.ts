import { turso } from "@/lib/tursoclient";
import jwt from "jsonwebtoken";

// Get restaurant details
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

    // Get restaurant details from database
    const { rows } = await turso.execute(
      "SELECT * FROM restaurants WHERE id = ?",
      [decoded.id]
    );

    if (rows.length === 0) {
      return Response.json(
        { message: "Restaurant not found" },
        { status: 404 }
      );
    }

    const restaurant = rows[0];

    // Return restaurant data (excluding password)
    const restaurantData = {
      id: restaurant.id,
      email: restaurant.email,
      name: restaurant.name,
      description: restaurant.description,
      address: restaurant.address,
      phone_number: restaurant.phone_number,
      cuisine_type: restaurant.cuisine_type,
      opening_hours: restaurant.opening_hours,
      image: restaurant.image,
    };

    return Response.json(restaurantData);
  } catch (error) {
    console.error("Error fetching restaurant data:", error);
    return Response.json({ message: "Internal server error" }, { status: 500 });
  }
}

// Update restaurant details
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
      name,
      description,
      address,
      phone_number,
      cuisine_type,
      opening_hours,
      image,
    } = body;

    // Update restaurant details
    const result = await turso.execute(
      `
            UPDATE restaurants 
            SET name = ?, description = ?, address = ?, phone_number = ?, 
                cuisine_type = ?, opening_hours = ?, image = ?
            WHERE id = ?
        `,
      [
        name,
        description,
        address,
        phone_number,
        cuisine_type,
        opening_hours,
        image,
        decoded.id,
      ]
    );

    if (result.rowsAffected === 0) {
      return Response.json(
        { message: "Restaurant not found" },
        { status: 404 }
      );
    }

    // Get updated restaurant data
    const { rows } = await turso.execute(
      "SELECT * FROM restaurants WHERE id = ?",
      [decoded.id]
    );
    const restaurant = rows[0];

    const restaurantData = {
      id: restaurant.id,
      email: restaurant.email,
      name: restaurant.name,
      description: restaurant.description,
      address: restaurant.address,
      phone_number: restaurant.phone_number,
      cuisine_type: restaurant.cuisine_type,
      opening_hours: restaurant.opening_hours,
      image: restaurant.image,
    };

    return Response.json(restaurantData);
  } catch (error) {
    console.error("Error updating restaurant data:", error);
    if (error instanceof SyntaxError) {
      return Response.json({ message: "Invalid JSON body" }, { status: 400 });
    }
    return Response.json({ message: "Internal server error" }, { status: 500 });
  }
}

// Delete restaurant account
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

    // First delete all related data
    await turso.execute("DELETE FROM tables WHERE restaurant_id = ?", [
      decoded.id,
    ]);

    await turso.execute("DELETE FROM menus WHERE restaurant_id = ?", [
      decoded.id,
    ]);

    // Then delete the restaurant
    const result = await turso.execute("DELETE FROM restaurants WHERE id = ?", [
      decoded.id,
    ]);

    if (result.rowsAffected === 0) {
      return Response.json(
        { message: "Restaurant not found" },
        { status: 404 }
      );
    }

    return Response.json({
      message: "Restaurant account deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting restaurant:", error);
    return Response.json({ message: "Internal server error" }, { status: 500 });
  }
}
