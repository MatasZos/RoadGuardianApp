import clientPromise from "@/lib/mongodb";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getAblyRest } from "@/lib/ablyServer";
import { cleanStringOrEmpty } from "@/lib/utils";

function daysUntil(expiryDateStr) {
  if (!expiryDateStr) return null;
  const d = new Date(`${expiryDateStr}T00:00:00`);
  if (Number.isNaN(d.getTime())) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

// Push a "document expiring" notification into the user's feed, or remove it
// if the document is no longer within the 30-day reminder window. Called after
// every document create / update / delete so the bell icon stays in sync.
async function upsertExpiryNotification(db, docId, userEmail, title, expiryDate) {
  const notifications = db.collection("notifications");
  const daysLeft = daysUntil(expiryDate);
  const ably = getAblyRest();

  if (daysLeft === null || daysLeft > 30) {
    await notifications.deleteMany({
      userEmail,
      sourceType: "documentExpiry",
      sourceId: String(docId),
    });

    try {
      await ably.channels.get(`user:${userEmail}`).publish("notification-refresh", {
        sourceType: "documentExpiry",
        sourceId: String(docId),
      });
    } catch (err) {
      console.error("ABLY document delete publish error:", err);
    }
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
    { userEmail, sourceType: "documentExpiry", sourceId: String(docId) },
    { $set: notificationDoc },
    { upsert: true }
  );

  try {
    await ably.channels.get(`user:${userEmail}`).publish("notification-refresh", {
      sourceType: "documentExpiry",
      sourceId: String(docId),
    });
  } catch (err) {
    console.error("ABLY document notification publish error:", err);
  }
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

    return NextResponse.json(docs);
  } catch (err) {
    console.error("DOCUMENTS GET ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();

    const doc = {
      userEmail: cleanStringOrEmpty(body.userEmail).toLowerCase(),
      title: cleanStringOrEmpty(body.title),
      expiryDate: cleanStringOrEmpty(body.expiryDate),
      notes: cleanStringOrEmpty(body.notes),
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

    await db.collection("documents").updateOne(
      { _id: id },
      {
        $set: {
          title: cleanStringOrEmpty(body.title),
          expiryDate: cleanStringOrEmpty(body.expiryDate),
          notes: cleanStringOrEmpty(body.notes),
        },
      }
    );

    const updated = await db.collection("documents").findOne({ _id: id });
    if (updated) {
      await upsertExpiryNotification(
        db,
        updated._id,
        updated.userEmail,
        updated.title,
        updated.expiryDate
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

    const existing = await db.collection("documents").findOne({ _id: id });
    await db.collection("documents").deleteOne({ _id: id });

    if (existing) {
      await db.collection("notifications").deleteMany({
        userEmail: existing.userEmail,
        sourceType: "documentExpiry",
        sourceId: String(existing._id),
      });

      try {
        const ably = getAblyRest();
        await ably.channels.get(`user:${existing.userEmail}`).publish("notification-refresh", {
          sourceType: "documentExpiry",
          sourceId: String(existing._id),
        });
      } catch (err) {
        console.error("ABLY document delete publish error:", err);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DOCUMENTS DELETE ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
