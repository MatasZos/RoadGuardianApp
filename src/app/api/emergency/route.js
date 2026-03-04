import clientPromise from "../../../lib/mongodb";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { userEmail, lat, lng } = await req.json();

    if (!userEmail || typeof lat !== "number" || typeof lng !== "number") {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("login");
    const emergencies = db.collection("emergencies");

    await emergencies.insertOne({
      userEmail,
      lat,
      lng,
      status: "DISPATCHED",
      createdAt: new Date(),
    });

    return NextResponse.json({ message: "Emergency saved" }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
