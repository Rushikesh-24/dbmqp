import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_API_KEY!, 
});

interface PopularDish {
  name: string;
  quantity: number;
  revenue: number;
}
interface RevenueByDay {
  date: string;
  revenue: number;
  orders: number;
}
interface OrderStatusCount {
  status: string;
  count: number;
}
export async function POST(req: Request) {
  try {
    const { analytics } = await req.json();

    const prompt = `
    You are an AI restaurant business analyst.
    Analyze the following restaurant performance data and provide a concise, engaging report.
    ${analytics.popularDishes.map(
      (d: PopularDish) => `• ${d.name} — ${d.quantity} sold, ₹${d.revenue} revenue`
    ).join("\n")}
    Average Order Value: ${analytics.averageOrderValue}

    Popular Dishes:
    ${analytics.popularDishes.map(
      (d: PopularDish) => `• ${d.name} — ${d.quantity} sold, ₹${d.revenue} revenue`
    ).join("\n")}

    Revenue by Day (last 30 days): ${analytics.revenueByDay.map(
      (r: RevenueByDay) => `${r.date}: ₹${r.revenue} (${r.orders} orders)`
    ).join(", ")}

    Orders by Status: ${analytics.ordersByStatus.map(
      (s: OrderStatusCount) => `${s.status}: ${s.count}`
    ).join(", ")}

    Generate a report highlighting:
    - Revenue trends (growth or decline)
    - Most popular dishes
    - Average order performance
    - Insights or recommendations to improve
    - Keep tone professional but conversational.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    return NextResponse.json({ report: response.text });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to generate AI report" }, { status: 500 });
  }
}