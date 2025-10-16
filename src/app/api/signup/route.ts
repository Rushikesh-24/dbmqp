import { turso } from "@/lib/tursoclient";
import { hash } from "bcryptjs";
import jwt from "jsonwebtoken";
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const email = body.email;
        const password = body.password;

        if (!email || !password) {
            return Response.json({ message: "Email and password are required" }, { status: 400 });
        }

        const { rows: existingUser } = await turso.execute("SELECT * FROM restaurants WHERE email = ?", [email]);
        if (existingUser.length > 0) {
            return Response.json({ message: "Restaurant already exists" }, { status: 409 });
        }

        const hashedPassword = await hash(password, 10);

        const createResto = await turso.execute("INSERT INTO restaurants (email,password) VALUES (?,?)", [email, hashedPassword]);

        const restaurantInfo = {
            id: typeof createResto.lastInsertRowid === "bigint" ? createResto.lastInsertRowid.toString() : createResto.lastInsertRowid,
            email: email
        };
        const token = jwt.sign(restaurantInfo, process.env.JWT_SECRET as string, { expiresIn: '1h' });

        return Response.json({ message: "Signup successful", token });
    } catch (error) {
        console.error("Unexpected error in signup route:", error);
        if (error instanceof SyntaxError) {
            return Response.json({ message: "Invalid or missing JSON body" }, { status: 400 });
        }
        return Response.json({ message: "Internal server error" }, { status: 500 });
    }
}
