import clientPromise from "../../../lib/mongodb";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getAblyRest } from "@/lib/ablyServer";
// This route handles GET, POST, PUT, and DELETE requests for managing user documents, including creating, updating, retrieving, and deleting documents. It also manages notifications related to document expirations using Ably for real-time updates.
function cleanString(value) {
  if (typeof value !== "string") return "";
  return value.trim();
}

// This function calculates the number of days until a given expiry date. It returns null if the input is invalid, a positive number if the date is in the future, or a negative number if the date has already passed.
function daysUntil(expiryDateStr) {
  if (!expiryDateStr) return null;

  // Parse the expiry date string into a Date object. If the string is not a valid date, return null.
  const d = new Date(`${expiryDateStr}T00:00:00`);
  if (Number.isNaN(d.getTime())) return null;

  // Get todays date with the time set to midnight 
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Calculate the difference in milliseconds between the expiry date and today's date, then convert it to days and round up to the nearest whole number.
  const diffMs = d.getTime() - today.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

async function upsertExpiryNotification(db, docId, userEmail, title, expiryDate) {
  const notifications = db.collection("notifications");
  const daysLeft = daysUntil(expiryDate);

  // If the document has no valid expiry date or expires in more than 30 days, delete any existing notifications for this document.
  if (daysLeft === null || daysLeft > 30) {
    await notifications.deleteMany({
      userEmail,
      sourceType: "documentExpiry",
      sourceId: String(docId),
    });

    // Publish a notification refresh event to Ably for the user to update their notifications in real-time.
    try {
      const ably = getAblyRest();
      await ably.channels
        .get(`user:${userEmail}`)
        .publish("notification-refresh", {
          sourceType: "documentExpiry",
          sourceId: String(docId),
        });
    } catch (ablyErr) {
      console.error("ABLY document delete publish error:", ablyErr);
    }

    return;
  }
  // Create a notification document with the appropriate title and text based on whether the document has expired or is expiring soon. 
  const notificationDoc = {
    userEmail,
    title: "Document reminder",
    text:
    // If the document has already expired, the text will indicate how many days ago it expired. If it is expiring in the future, the text will indicate how many days are left until it expires.
      daysLeft < 0
        ? `${title} expired ${Math.abs(daysLeft)} day(s) ago.`
        : `${title} expires in ${daysLeft} day(s).`,
    type: "document",
    read: false,
    sourceType: "documentExpiry",
    sourceId: String(docId),
    createdAt: new Date(),
  };

  //Add the notification document to the notifications collection in MongoDB. If a notification for this document already exists, it will be updated with the new information. 
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

  // Publish a notification refresh event to Ably for the user to update their notifications in real-time.
  try {
    const ably = getAblyRest();
    await ably.channels
      .get(`user:${userEmail}`)
      .publish("notification-refresh", {
        sourceType: "documentExpiry",
        sourceId: String(docId),
      });
  } catch (ablyErr) {
    console.error("ABLY document notification publish error:", ablyErr);
  }
}
// The GET handler retrieves all documents for a given user email, sorted by expiry date and creation date. 
export async function GET(req) {
  try {
    const email = req.headers.get("x-user-email");
    if (!email) return NextResponse.json([], { status: 200 });
    // Connect to MongoDB, access the documents collection, and query for documents that match the provided user email. 
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
// The POST handler creates a new document for a user with the provided title, expiry date, and notes. It also sets up a notification for the document's expiry and returns a success response.
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
    // Validate that the userEmail and title fields are present and valid. If validation fails, return an appropriate error message to the client.
    const client = await clientPromise;
    const db = client.db("login");

    const result = await db.collection("documents").insertOne(doc);
    // After successfully inserting the new document, set up an expiry notification for it based on the provided expiry date. 
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
// The PUT handler updates an existing document with new title, expiry date, and notes. It also updates the associated expiry notification based on the new expiry date.
export async function PUT(req) {
  try {
    const body = await req.json();

    const client = await clientPromise;
    const db = client.db("login");

    const id = new ObjectId(body._id);
    // Validate that the document exists before attempting to update it. If the document does not exist, return an error response to the client.
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
    // If the document was successfully updated and retrieved, upsert the expiry notification with the new information. 
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
// The DELETE handler removes a document from the database and also deletes any associated expiry notifications. It then publishes a notification refresh event to Ably to update the user's notifications in real-time.
export async function DELETE(req) {
  try {
    const body = await req.json();

    const client = await clientPromise;
    const db = client.db("login");

    const id = new ObjectId(body._id);
    // Validate that the document exists before attempting to delete it. If the document does not exist, return an error response to the client.
    const existingDoc = await db.collection("documents").findOne({ _id: id });

    await db.collection("documents").deleteOne({
      _id: id,
    });
    // If the document existed and was deleted, also delete any associated expiry notifications and publish a notification refresh event to Ably for the user.
    if (existingDoc) {
      await db.collection("notifications").deleteMany({
        userEmail: existingDoc.userEmail,
        sourceType: "documentExpiry",
        sourceId: String(existingDoc._id),
      });
      // Publish a notification refresh event to Ably for the user to update their notifications in realtime after the document and its notifications have been deleted.
      try {
        const ably = getAblyRest();
        await ably.channels
          .get(`user:${existingDoc.userEmail}`)
          .publish("notification-refresh", {
            sourceType: "documentExpiry",
            sourceId: String(existingDoc._id),
          });
      } catch (ablyErr) {
        console.error("ABLY document delete publish error:", ablyErr);
      }
    }
    // Return a success response to the client after the document and associated notifications have been deleted.
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DOCUMENTS DELETE ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}