import clientPromise from "../../../lib/mongodb";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

function cleanString(value) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function daysUntil(expiryDateStr) {
  if (!expiryDateStr) return null;

  const d = new Date(`${expiryDateStr}T00:00:00`);
  if (Number.isNaN(d.getTime())) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffMs = d.getTime() - today.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

async function upsertExpiryNotification(db, docId, userEmail, title, expiryDate) {
  const notifications = db.collection("notifications");
  const daysLeft = daysUntil(expiryDate);

  // Remove old notification if no expiry or no longer close enough
  if (daysLeft === null || daysLeft > 30) {
    await notifications.deleteMany({
      userEmail,
      sourceType: "documentExpiry",
      sourceId: String(docId),
    });
    return;
  }

  const notificationDoc = {
    userEmail,
    title: "Document reminder",
    text:
      daysLeft < 0
        ? `${title} expired ${Math.abs(daysLeft)} day(s) ago.`
        : `${title} expires in ${daysLeft} day(s).`,
    type: "document",
    read: false,
    sourceType: "documentExpiry",
    sourceId: String(docId),
    createdAt: new Date(),
  };

  await notifications.updateOne(
    {
      userEmail,
      sourceType: "documentExpiry",
      sourceId: String(docId),
    },
    {
      $set: notificationDoc,
    },
    { upsert: true }
  );
}

export async function GET(req) {
  try {
    const email = req.headers.get("x-user-email");
    if (!email) return NextResponse.json([], { status: 200 });

    const client = await clientPromise;
    const db = client.db("login");

    const docs = await db
      .collection("documents")
      .find({ userEmail: email })
      .sort({ expiryDate: 1, createdAt: -1, _id: -1 })
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
      userEmail: cleanString(body.userEmail).toLowerCase(),
      title: cleanString(body.title),
      expiryDate: cleanString(body.expiryDate),
      notes: cleanString(body.notes),
      createdAt: new Date(),
    };

    const client = await clientPromise;
    const db = client.db("login");

    const result = await db.collection("documents").insertOne(doc);

    await upsertExpiryNotification(
      db,
      result.insertedId,
      doc.userEmail,
      doc.title,
      doc.expiryDate
    );

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

    const id = new ObjectId(body._id);

    const updatedFields = {
      title: cleanString(body.title),
      expiryDate: cleanString(body.expiryDate),
      notes: cleanString(body.notes),
    };

    await db.collection("documents").updateOne(
      { _id: id },
      {
        $set: updatedFields,
      }
    );

    const updatedDoc = await db.collection("documents").findOne({ _id: id });

    if (updatedDoc) {
      await upsertExpiryNotification(
        db,
        updatedDoc._id,
        updatedDoc.userEmail,
        updatedDoc.title,
        updatedDoc.expiryDate
      );
    }

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

    const id = new ObjectId(body._id);

    const existingDoc = await db.collection("documents").findOne({ _id: id });

    await db.collection("documents").deleteOne({
      _id: id,
    });

    if (existingDoc) {
      await db.collection("notifications").deleteMany({
        userEmail: existingDoc.userEmail,
        sourceType: "documentExpiry",
        sourceId: String(existingDoc._id),
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DOCUMENTS DELETE ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}