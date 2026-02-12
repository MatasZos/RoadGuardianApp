import clientPromise from "../../../lib/mongodb";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

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

    const doc = {
      userEmail: body.userEmail,
      title: body.title,
      expiryDate: body.expiryDate || "",
      notes: body.notes || "",
      createdAt: new Date(),
    };

    const client = await clientPromise;
    const db = client.db("login");

    await db.collection("documents").insertOne(doc);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DOCUMENTS POST ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const body = await req.json();

    const client = await clientPromise;
    const db = client.db("login");

    await db.collection("documents").updateOne(
      { _id: new ObjectId(body._id) },
      {
        $set: {
          title: body.title,
          expiryDate: body.expiryDate || "",
          notes: body.notes || "",
        },
      }
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DOCUMENTS PUT ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const body = await req.json();

    const client = await clientPromise;
    const db = client.db("login");

    await db
      .collection("documents")
      .deleteOne({ _id: new ObjectId(body._id) });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DOCUMENTS DELETE ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}