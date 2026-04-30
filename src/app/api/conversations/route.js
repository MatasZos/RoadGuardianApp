import clientPromise from "@/lib/mongodb";
import { NextResponse } from "next/server";
import { cleanEmail } from "@/lib/utils";

function serializeConversation(doc) {
  return { ...doc, _id: String(doc._id) };
}

export async function GET(req) {
  try {
    const email = cleanEmail(req.headers.get("x-user-email"));
    if (!email) {
      return NextResponse.json({ error: "Missing email" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("login");

    const items = await db
      .collection("conversations")
      .find({ participants: email })
      .sort({ updatedAt: -1, _id: -1 })
      .toArray();

    return NextResponse.json(items.map(serializeConversation));
  } catch (err) {
    console.error("CONVERSATIONS GET ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const userEmail = cleanEmail(body.userEmail);
    const otherUserEmail = cleanEmail(body.otherUserEmail);

    if (!userEmail) {
      return NextResponse.json({ error: "Missing logged-in user email" }, { status: 400 });
    }
    if (!otherUserEmail) {
      return NextResponse.json({ error: "Missing target email" }, { status: 400 });
    }
    if (userEmail === otherUserEmail) {
      return NextResponse.json(
        { error: "Cannot create a conversation with yourself" },
        { status: 400 }
      );
    }

    // Sort the participant pair so {a,b} and {b,a} hit the same document.
    const participants = [userEmail, otherUserEmail].sort();

    const client = await clientPromise;
    const db = client.db("login");
    const conversations = db.collection("conversations");

    let conversation = await conversations.findOne({ participants });
    if (!conversation) {
      const now = new Date();
      const doc = { participants, lastMessage: "", updatedAt: now, createdAt: now };
      const result = await conversations.insertOne(doc);
      conversation = { ...doc, _id: result.insertedId };
    }

    return NextResponse.json(serializeConversation(conversation));
  } catch (err) {
    console.error("CONVERSATIONS POST ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
