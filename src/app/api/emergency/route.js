import clientPromise from "../../../lib/mongodb";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { lat, lng } = await req.json();

    if (typeof lat !== "number" || typeof lng !== "number") {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("login");
    const emergencies = db.collection("emergencies");

    await emergencies.insertOne({
      userId: session.user.id,
      userEmail: session.user.email,
      userName: session.user.name || "User",
      lat,
      lng,
      status: "DISPATCHED",
      createdAt: new Date(),
    });

    return NextResponse.json({ message: "Emergency saved" }, { status: 200 });
  } catch (e) {
    console.error("POST /api/emergency error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("login");
    const emergencies = db.collection("emergencies");

    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

    const active = await emergencies
      .find({ createdAt: { $gte: thirtyMinutesAgo } })
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({ emergencies: active }, { status: 200 });
  } catch (e) {
    console.error("GET /api/emergency error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
