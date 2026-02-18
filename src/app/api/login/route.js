import clientPromise from "../../../lib/mongodb";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function POST(req) {
  const { email, password } = await req.json();

  try {
    const client = await clientPromise;
    const db = client.db("login");
    const user = await db.collection("user").findOne({ email });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
    );
  }
    if (!user.passwordHash) {
      return NextResponse.json(
        { error: "Account needs password update. Please re-register." },
        { status: 403 }
      );
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);

    if (!isMatch) {
      return NextResponse.json(
        { error: "Invalid email or password!" },
        { status: 401 }
      );
    }

  return NextResponse.json({
    fullName: user.fullName,
    email: user.email,
    motorbike: user.motorbike || "",
  });

} catch (error) {
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
