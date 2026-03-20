import clientPromise from "../../../lib/mongodb";
import { NextResponse } from "next/server";

export async function GET(req) {
  
  const email = req.headers.get("x-user-email");

  if (!email) {
    return NextResponse.json({ error: "Email missing" }, { status: 400 });
  }

  try {
    const client = await clientPromise;
    const db = client.db("login");
    const userCollection = db.collection("user");

    const user = await userCollection.findOne({ email });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    
    return NextResponse.json({
      fullName: user.fullName || "",
      email: user.email || "",
      phone: user.phone || "",
      password: user.password || "",
      motorbike: user.motorbike || "", 
    });
  } catch (err) {
    console.error("Profile GET error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
