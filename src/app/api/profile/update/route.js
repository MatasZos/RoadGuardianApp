import clientPromise from "../../../../lib/mongodb";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const body = await req.json();
    const { email, fullName, password, motorbike } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Missing email" }, { status: 400 });
    }

    const updateDoc = {};

    // Update name if provided
    if (typeof fullName === "string" && fullName.trim()) {
      updateDoc.fullName = fullName.trim();
    }

    // Update motorbike if provided
    if (typeof motorbike === "string" && motorbike.trim()) {
      updateDoc.motorbike = motorbike.trim();
    }

    if (typeof password === "string" && password.trim().length >= 6) {
      updateDoc.password = password; 
    }

    if (Object.keys(updateDoc).length === 0) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("login");
    const userCollection = db.collection("user");

    const result = await userCollection.updateOne(
      { email: email.trim() },
      { $set: updateDoc }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Profile updated", updated: updateDoc });
  } catch (err) {
    console.error("Profile update error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
