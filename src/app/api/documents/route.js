import clientPromise from "../../../lib/mongodb";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    const email = req.headers.get("x-user-email");
    if (!email) return NextResponse.json([], { status: 200 });

    const client = await clientPromise;
    const db = client.db("login");

    const docs = await db
      .collection("documents")
      .find({ userEmail: email })
      .sort({ _id: -1 })
      .toArray();

    return NextResponse.json(docs, { status: 200 });
  } catch (err) {
    console.error("DOCUMENTS GET ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();

    if (!body?.userEmail) {
      return NextResponse.json({ error: "Missing userEmail" }, { status: 400 });
    }

    const doc = {
      userEmail: body.userEmail,
      title: body.title || "",
      expiryDate: body.expiryDate || "",
      notes: body.notes || "",
      createdAt: new Date(),
    };

    const client = await clientPromise;
    const db = client.db("login");

    const result = await db.collection("documents").insertOne(doc);

    return NextResponse.json(
      { success: true, insertedId: result.insertedId },
      { status: 200 }
    );
  } catch (err) {
    console.error("DOCUMENTS POST ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

