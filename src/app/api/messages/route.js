import clientPromise from "../../../lib/mongodb";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

function cleanString(value) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function serializeMessage(doc) {
  return {
    ...doc,
    _id: String(doc._id),
  };
}

export async function GET(req) {
  try {
    const email = cleanString(req.headers.get("x-user-email"))?.toLowerCase();
    const { searchParams } = new URL(req.url);
    const conversationId = cleanString(searchParams.get("conversationId"));

    if (!email || !conversationId) {
      return NextResponse.json(
        { error: "Missing email or conversationId" },
        { status: 400 }
      );
    }

    if (!ObjectId.isValid(conversationId)) {
      return NextResponse.json(
        { error: "Invalid conversationId" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("login");
    const conversations = db.collection("conversations");
    const messages = db.collection("messages");

    const conversation = await conversations.findOne({
      _id: new ObjectId(conversationId),
      participants: email,
    });

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    const items = await messages
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

    const senderEmail = cleanString(body.senderEmail)?.toLowerCase();
    const receiverEmail = cleanString(body.receiverEmail)?.toLowerCase();
    const conversationId = cleanString(body.conversationId);
    const text = cleanString(body.text);

    if (!senderEmail || !receiverEmail || !conversationId || !text) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    if (!ObjectId.isValid(conversationId)) {
      return NextResponse.json(
        { error: "Invalid conversationId" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("login");
    const conversations = db.collection("conversations");
    const messages = db.collection("messages");

    const conversation = await conversations.findOne({
      _id: new ObjectId(conversationId),
      participants: { $all: [senderEmail, receiverEmail] },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    const messageDoc = {
      conversationId,
      senderEmail,
      receiverEmail,
      text,
      read: false,
      createdAt: new Date(),
    };

    const result = await messages.insertOne(messageDoc);

    await conversations.updateOne(
      { _id: new ObjectId(conversationId) },
      {
        $set: {
          lastMessage: text,
          updatedAt: new Date(),
        },
      }
    );

    return NextResponse.json({
      success: true,
      message: {
        ...messageDoc,
        _id: String(result.insertedId),
      },
    });
  } catch (err) {
    console.error("MESSAGES POST ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}