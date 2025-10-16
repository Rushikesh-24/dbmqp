import { turso } from "@/lib/tursoclient";
import jwt from "jsonwebtoken";

interface TableData {
  table_number: string;
  capacity: number;
  status: string;
}

// Get all tables for a restaurant
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

    // Get all tables for this restaurant
    const { rows } = await turso.execute(
      "SELECT * FROM tables WHERE restaurant_id = ? ORDER BY table_number",
      [decoded.id]
    );

    return Response.json(rows);
  } catch (error) {
    console.error("Error fetching tables:", error);
    return Response.json({ message: "Internal server error" }, { status: 500 });
  }
}

// Create a new table
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
    const { table_number, capacity, status }: TableData = body;

    if (!table_number || !capacity || !status) {
      return Response.json(
        { message: "Table number, capacity, and status are required" },
        { status: 400 }
      );
    }

    // Check if table number already exists for this restaurant
    const { rows: existingTables } = await turso.execute(
      "SELECT id FROM tables WHERE restaurant_id = ? AND table_number = ?",
      [decoded.id, table_number]
    );

    if (existingTables.length > 0) {
      return Response.json(
        { message: "Table number already exists" },
        { status: 409 }
      );
    }

    // Create new table
    const result = await turso.execute(
      `
            INSERT INTO tables (restaurant_id, table_number, capacity, status) 
            VALUES (?, ?, ?, ?)
        `,
      [decoded.id, table_number, capacity, status]
    );

    const tableId =
      typeof result.lastInsertRowid === "bigint"
        ? result.lastInsertRowid.toString()
        : result.lastInsertRowid;

    const newTable = {
      id: tableId,
      restaurant_id: decoded.id,
      table_number,
      capacity,
      status,
    };

    return Response.json(newTable, { status: 201 });
  } catch (error) {
    console.error("Error creating table:", error);
    if (error instanceof SyntaxError) {
      return Response.json({ message: "Invalid JSON body" }, { status: 400 });
    }
    return Response.json({ message: "Internal server error" }, { status: 500 });
  }
}

// Update a table
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
    const { id, table_number, capacity, status }: TableData & { id: string } =
      body;

    if (!id || !table_number || !capacity || !status) {
      return Response.json(
        { message: "ID, table number, capacity, and status are required" },
        { status: 400 }
      );
    }

    // Check if table number already exists for this restaurant (excluding current table)
    const { rows: existingTables } = await turso.execute(
      "SELECT id FROM tables WHERE restaurant_id = ? AND table_number = ? AND id != ?",
      [decoded.id, table_number, id]
    );

    if (existingTables.length > 0) {
      return Response.json(
        { message: "Table number already exists" },
        { status: 409 }
      );
    }

    // Update table
    const result = await turso.execute(
      `
            UPDATE tables 
            SET table_number = ?, capacity = ?, status = ?
            WHERE id = ? AND restaurant_id = ?
        `,
      [table_number, capacity, status, id, decoded.id]
    );

    if (result.rowsAffected === 0) {
      return Response.json({ message: "Table not found" }, { status: 404 });
    }

    const updatedTable = {
      id,
      restaurant_id: decoded.id,
      table_number,
      capacity,
      status,
    };

    return Response.json(updatedTable);
  } catch (error) {
    console.error("Error updating table:", error);
    if (error instanceof SyntaxError) {
      return Response.json({ message: "Invalid JSON body" }, { status: 400 });
    }
    return Response.json({ message: "Internal server error" }, { status: 500 });
  }
}

// Delete a table
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
    const tableId = url.searchParams.get("id");

    if (!tableId) {
      return Response.json(
        { message: "Table ID is required" },
        { status: 400 }
      );
    }

    // Delete table
    const result = await turso.execute(
      `
            DELETE FROM tables 
            WHERE id = ? AND restaurant_id = ?
        `,
      [tableId, decoded.id]
    );

    if (result.rowsAffected === 0) {
      return Response.json({ message: "Table not found" }, { status: 404 });
    }

    return Response.json({ message: "Table deleted successfully" });
  } catch (error) {
    console.error("Error deleting table:", error);
    return Response.json({ message: "Internal server error" }, { status: 500 });
  }
}
