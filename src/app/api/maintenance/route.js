import clientPromise from "../../../lib/mongodb";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    const email = req.headers.get("x-user-email");
    if (!email) return NextResponse.json([]);

    const client = await clientPromise;
    const db = client.db("login");

    const records = await db
      .collection("maintenance")
      .find({ userEmail: email })
      .sort({ _id: -1 })
      .toArray();

    return NextResponse.json(records);
  } catch (err) {
    console.error("MAINTENANCE GET ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();

    if (!body?.userEmail) {
      return NextResponse.json({ error: "Missing userEmail" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("login");

    const doc = {
      userEmail: body.userEmail,
      type: body.type || "",
      date: body.date || "",
      km: Number(body.km || 0),
      notes: body.notes || "",
      createdAt: new Date(),
    };

    await db.collection("maintenance").insertOne(doc);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("MAINTENANCE POST ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
