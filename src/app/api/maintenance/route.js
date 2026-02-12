import clientPromise from "../../../lib/mongodb";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

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

    const doc = {
      userEmail: body.userEmail,
      type: body.type, 
      date: body.date,
      km: Number(body.km),
      notes: body.notes || "",
      createdAt: new Date(),
    };

    const client = await clientPromise;
    const db = client.db("login");

    await db.collection("maintenance").insertOne(doc);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("MAINTENANCE POST ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const body = await req.json();

    const client = await clientPromise;
    const db = client.db("login");

    await db.collection("maintenance").updateOne(
      { _id: new ObjectId(body._id) },
      {
        $set: {
          type: body.type,
          date: body.date,
          km: Number(body.km),
          notes: body.notes || "",
        },
      }
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("MAINTENANCE PUT ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const body = await req.json();

    const client = await clientPromise;
    const db = client.db("login");

    await db
      .collection("maintenance")
      .deleteOne({ _id: new ObjectId(body._id) });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("MAINTENANCE DELETE ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}