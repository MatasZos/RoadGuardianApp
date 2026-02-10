
import clientPromise from "../../../lib/mongodb";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    console.log("TEST ROUTE HIT");

    const uri = process.env.MONGODB_URI;
    console.log("ENV:", uri ? "LOADED" : "NOT LOADED");

    const client = await clientPromise;
    console.log("CONNECTED TO MONGODB");

    const db = client.db("login");

    const count = await db.collection("maintenance").countDocuments();
    console.log("COUNT:", count);

    return NextResponse.json({
      ok: true,
      envLoaded: !!uri,
      count,
    });
  } catch (err) {
    console.error("TEST ERROR:", err);
    return NextResponse.json({
      ok: false,
      error: err.message,
    });
  }
}
