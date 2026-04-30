import clientPromise from "@/lib/mongodb";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { cleanStringOrEmpty } from "@/lib/utils";

const ALLOWED_TYPES = [
  "Account Issue",
  "Maintenance Records",
  "Document Reminders",
  "Emergency Feature",
  "Bug Report",
  "Other",
];

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const issueType = cleanStringOrEmpty(body.issueType);
    const message = cleanStringOrEmpty(body.message);

    if (!issueType || !ALLOWED_TYPES.includes(issueType)) {
      return NextResponse.json({ error: "Invalid issue type" }, { status: 400 });
    }
    if (!message || message.length < 10) {
      return NextResponse.json(
        { error: "Message must be at least 10 characters" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    await client.db("login").collection("supportTickets").insertOne({
      name: session.user.name || "",
      email: session.user.email.toLowerCase(),
      issueType,
      message,
      createdAt: new Date(),
      status: "open",
    });

    return NextResponse.json({ message: "Support ticket submitted" }, { status: 201 });
  } catch (err) {
    console.error("Support POST error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
