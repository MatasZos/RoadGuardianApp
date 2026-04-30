import clientPromise from "../../../lib/mongodb";
import { NextResponse } from "next/server";
// This route gets the GET and POST handlers for managing conversations between users.
function cleanString(value) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

// This function converts a MongoDB conversation document into a format suitable for API responses, ensuring the _id field is a string for easier handling on the client side.
function serializeConversation(doc) {
  return {
    ...doc,
    _id: String(doc._id),
  };
}

// The GET handler retrieves all conversations for a given user email, 
export async function GET(req) {
  try {
    const email = cleanString(req.headers.get("x-user-email"))?.toLowerCase();

    if (!email) {
      return NextResponse.json({ error: "Missing email" }, { status: 400 });
    }
    // Connect to MongoDB, access the conversations collection, and query for conversations where the user is a participant.
    const client = await clientPromise;
    const db = client.db("login");
    const conversations = db.collection("conversations");
    // Find conversations where the user is a participant, sorted by most recently updated. The results are then serialized and returned as JSON.
    const items = await conversations
      .find({ participants: email })
      .sort({ updatedAt: -1, _id: -1 })
      .toArray();

    return NextResponse.json(items.map(serializeConversation));
  } catch (err) {
    console.error("CONVERSATIONS GET ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
//Creates a conversation between two users if it doesnt exist. 
export async function POST(req) {
  try {
    const body = await req.json();
    // Validate the userEmail and otherUserEmail fields from the request body. Both emails are required, must be valid strings, and cannot be the same
    const userEmail = cleanString(body.userEmail)?.toLowerCase();
    const otherUserEmail = cleanString(body.otherUserEmail)?.toLowerCase();

    // If any validation fails, return an appropriate error message to the client.
    if (!userEmail) {
      return NextResponse.json(
        { error: "Missing logged-in user email" },
        { status: 400 }
      );
    }
    // If the other user's email is missing or invalid, return an error message to the client.
    if (!otherUserEmail) {
      return NextResponse.json(
        { error: "Missing target email" },
        { status: 400 }
      );
    }
    // If the user tries to create a conversation with themselves, return an error message to the client.
    if (userEmail === otherUserEmail) {
      return NextResponse.json(
        { error: "Cannot create a conversation with yourself" },
        { status: 400 }
      );
    }
    // Create a sorted array of participants to ensure consistent ordering, which helps in querying the database for existing conversations between the same users.
    const participants = [userEmail, otherUserEmail].sort();

    // Connect to MongoDB, access the conversations collection, and check if a conversation already exists between the two participants. If it does not exist, create a new conversation document with the participants and insert into database.
    const client = await clientPromise;
    const db = client.db("login");
    const conversations = db.collection("conversations");

    let conversation = await conversations.findOne({ participants });

    // If no existing conversation is found, create a new one with the participants and timestamps, then insert it into the database. 
    if (!conversation) {
      const doc = {
        participants,
        lastMessage: "",
        updatedAt: new Date(),
        createdAt: new Date(),
      };
      // Insert the new conversation document into the conversations collection and store the resulting conversation with its new _id.
      const result = await conversations.insertOne(doc);
      conversation = { ...doc, _id: result.insertedId };
    }
    // Serialize the conversation document and return it as a JSON response to the client.
    return NextResponse.json(serializeConversation(conversation));
  } catch (err) {
    console.error("CONVERSATIONS POST ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}