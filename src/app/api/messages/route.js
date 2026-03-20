import clientPromise from "../../../lib/mongodb";
import { NextResponse } from "next/server";

function cleanString(value) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export async function GET(req) {
  try {
    const email = cleanString(req.headers.get("x-user-email"))?.toLowerCase();

    if (!email) {
      return NextResponse.json({ error: "Missing email" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("login");
    const conversations = db.collection("conversations");

    const items = await conversations
      .find({ participants: email })
      .sort({ updatedAt: -1, _id: -1 })
      .toArray();

    return NextResponse.json(items);
  } catch (err) {
    console.error("CONVERSATIONS GET ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();

    const userEmail = cleanString(body.userEmail)?.toLowerCase();
    const otherUserEmail = cleanString(body.otherUserEmail)?.toLowerCase();

    if (!userEmail || !otherUserEmail) {
      return NextResponse.json(
        { error: "Missing users" },
        { status: 400 }
      );
    }

    if (userEmail === otherUserEmail) {
      return NextResponse.json(
        { error: "Cannot create a conversation with yourself" },
        { status: 400 }
      );
    }

    const participants = [userEmail, otherUserEmail].sort();

    const client = await clientPromise;
    const db = client.db("login");
    const conversations = db.collection("conversations");

    let conversation = await conversations.findOne({ participants });

    if (!conversation) {
      const doc = {
        participants,
        lastMessage: "",
        updatedAt: new Date(),
        createdAt: new Date(),
      };

      const result = await conversations.insertOne(doc);
      conversation = { ...doc, _id: result.insertedId };
    }

    return NextResponse.json(conversation);
  } catch (err) {
    console.error("CONVERSATIONS POST ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}