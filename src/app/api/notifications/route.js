import clientPromise from "../../../lib/mongodb";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

function cleanString(value) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export async function GET(req) {
  try {
    const email = cleanString(req.headers.get("x-user-email"))?.toLowerCase();

    if (!email) {
      return NextResponse.json([], { status: 200 });
    }

    const client = await clientPromise;
    const db = client.db("login");

    const notifications = await db
      .collection("notifications")
      .find({ userEmail: email })
      .sort({ createdAt: -1, _id: -1 })
      .toArray();

    return NextResponse.json(
      notifications.map((item) => ({
        ...item,
        _id: String(item._id),
      })),
      { status: 200 }
    );
  } catch (err) {
    console.error("NOTIFICATIONS GET ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    const body = await req.json();
    const action = cleanString(body.action);
    const id = cleanString(body.id);
    const email = cleanString(body.userEmail)?.toLowerCase();

    if (!email) {
      return NextResponse.json({ error: "Missing email" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("login");
    const notifications = db.collection("notifications");

    if (action === "markAllRead") {
      await notifications.updateMany(
        { userEmail: email, read: false },
        { $set: { read: true } }
      );

      return NextResponse.json({ success: true });
    }

    if (action === "markRead" && id && ObjectId.isValid(id)) {
      await notifications.updateOne(
        { _id: new ObjectId(id), userEmail: email },
        { $set: { read: true } }
      );

      return NextResponse.json({ success: true });
    }

    if (action === "clearAll") {
      await notifications.deleteMany({ userEmail: email });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    console.error("NOTIFICATIONS PATCH ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}