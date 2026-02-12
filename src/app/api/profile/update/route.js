import clientPromise from "../../../../lib/mongodb";
import { NextResponse } from "next/server";

export async function POST(req) {
  const { email, fullName, password, motorbike } = await req.json();

  if (!email) {
    return NextResponse.json({ error: "Missing email" }, { status: 400 });
  }

  try {
    const client = await clientPromise;
    const db = client.db("login");
    const userCollection = db.collection("user");

    const updateDoc = {};
    if (typeof fullName === "string" && fullName.trim()) updateDoc.fullName = fullName.trim();
    if (typeof motorbike === "string" && motorbike.trim()) updateDoc.motorbike = motorbike.trim();
    if (typeof password === "string" && password.trim()) updateDoc.password = password; // plain text for your project

    if (Object.keys(updateDoc).length === 0) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    await userCollection.updateOne({ email }, { $set: updateDoc });

    return NextResponse.json({ message: "Profile updated" });
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

