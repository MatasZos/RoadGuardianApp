import clientPromise from "../../../lib/mongodb";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req) {
  try {
    // get logged-in user from session
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { lat, lng } = await req.json();

    if (typeof lat !== "number" || typeof lng !== "number") {
      return NextResponse.json(
        { error: "Missing or invalid coordinates" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("login");
    const emergencies = db.collection("emergencies");

    await emergencies.insertOne({
      userEmail: session.user.email, 
      name: session.user.name,
      lat,
      lng,
      status: "DISPATCHED",
      createdAt: new Date(),
    });

    return NextResponse.json(
      { message: "Emergency saved" },
      { status: 200 }
    );
  } catch (e) {
    console.error(e);

    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
