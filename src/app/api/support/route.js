import clientPromise from "../../../lib/mongodb";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";

const ALLOWED_TYPES = [
  "Account Issue",
  "Maintenance Records",
  "Document Reminders",
  "Emergency Feature",
  "Bug Report",
  "Other",
];

function cleanString(v) {
  if (typeof v !== "string") return "";
  return v.trim();
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const issueType = cleanString(body.issueType);
    const message = cleanString(body.message);

    if (!issueType || !ALLOWED_TYPES.includes(issueType)) {
      return NextResponse.json({ error: "Invalid issue type" }, { status: 400 });
    }

    if (!message || message.length < 10) {
      return NextResponse.json(
        { error: "Message must be at least 10 characters" },
        { status: 400 }
      );
    }

    const ticket = {
      name: session.user.name || "",
      email: session.user.email.toLowerCase(),
      issueType,
      message,
      createdAt: new Date(),
      status: "open",
    };

    const client = await clientPromise;
    const db = client.db("login");
    const supportTickets = db.collection("supportTickets");

    await supportTickets.insertOne(ticket);

    return NextResponse.json({ message: "Support ticket submitted" }, { status: 201 });
  } catch (err) {
    console.error("Support POST error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
