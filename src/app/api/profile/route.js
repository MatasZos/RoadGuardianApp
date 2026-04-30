import clientPromise from "@/lib/mongodb";
import { NextResponse } from "next/server";
import { cleanEmail } from "@/lib/utils";

export async function GET(req) {
  const email = cleanEmail(req.headers.get("x-user-email"));

  if (!email) {
    return NextResponse.json({ error: "Email missing" }, { status: 400 });
  }

  try {
    const client = await clientPromise;
    const user = await client.db("login").collection("user").findOne({ email });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      fullName: user.fullName || "",
      email: user.email || "",
      phone: user.phone || "",
      motorbike: user.motorbike || "",
    });
  } catch (err) {
    console.error("Profile GET error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}