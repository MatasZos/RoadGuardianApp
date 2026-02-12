import clientPromise from "../../../lib/mongodb";
import { NextResponse } from "next/server";

export async function POST(req) {
  const { email, password } = await req.json();
  const client = await clientPromise;

  const db = client.db("login");
  const user = await db.collection("user").findOne({ email });

  if (!user || user.password !== password) {
    return NextResponse.json(
      { error: "Invalid email or password" },
      { status: 401 }
    );
  }

  return NextResponse.json({
    fullName: user.fullName,
    email: user.email,
    motorbike: user.motorbike || "", // ✅ added
  });
}
