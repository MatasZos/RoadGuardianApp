import clientPromise from "@/lib/mongodb";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getAblyRest } from "@/lib/ablyServer";
import { cleanString, cleanEmail } from "@/lib/utils";

function serializeMessage(doc) {
  return { ...doc, _id: String(doc._id) };
}

export async function GET(req) {
  try {
    const email = cleanEmail(req.headers.get("x-user-email"));
    const { searchParams } = new URL(req.url);
    const conversationId = cleanString(searchParams.get("conversationId"));

    if (!email || !conversationId) {
      return NextResponse.json({ error: "Missing email or conversationId" }, { status: 400 });
    }
    if (!ObjectId.isValid(conversationId)) {
      return NextResponse.json({ error: "Invalid conversationId" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("login");

    const conversation = await db.collection("conversations").findOne({
      _id: new ObjectId(conversationId),
      participants: email,
    });
    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    const items = await db
      .collection("messages")
      .find({ conversationId })
      .sort({ createdAt: 1, _id: 1 })
      .toArray();

    return NextResponse.json(items.map(serializeMessage));
  } catch (err) {
    console.error("MESSAGES GET ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();

    const senderEmail = cleanEmail(body.senderEmail);
    const receiverEmail = cleanEmail(body.receiverEmail);
    const conversationId = cleanString(body.conversationId);
    const text = cleanString(body.text);

    if (!senderEmail || !receiverEmail || !conversationId || !text) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }
    if (!ObjectId.isValid(conversationId)) {
      return NextResponse.json({ error: "Invalid conversationId" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("login");

    const conversation = await db.collection("conversations").findOne({
      _id: new ObjectId(conversationId),
      participants: { $all: [senderEmail, receiverEmail] },
    });
    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    const now = new Date();
    const messageDoc = {
      conversationId,
      senderEmail,
      receiverEmail,
      text,
      read: false,
      createdAt: now,
    };

    const result = await db.collection("messages").insertOne(messageDoc);

    await db.collection("conversations").updateOne(
      { _id: new ObjectId(conversationId) },
      { $set: { lastMessage: text, updatedAt: now } }
    );

    const preview = text.length > 60 ? `${text.slice(0, 60)}...` : text;
    const notificationDoc = {
      userEmail: receiverEmail,
      title: "New message",
      text: `${senderEmail} sent you a message: "${preview}"`,
      type: "message",
      read: false,
      sourceType: "message",
      sourceId: String(result.insertedId),
      conversationId,
      createdAt: now,
    };

    const notificationResult = await db.collection("notifications").insertOne(notificationDoc);

    try {
      const ably = getAblyRest();
      await ably.channels.get(`user:${receiverEmail}`).publish("notification-created", {
        ...notificationDoc,
        _id: String(notificationResult.insertedId),
      });
    } catch (err) {
      console.error("ABLY notification publish error:", err);
    }

    return NextResponse.json({
      success: true,
      message: { ...messageDoc, _id: String(result.insertedId) },
    });
  } catch (err) {
    console.error("MESSAGES POST ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
