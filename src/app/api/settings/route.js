import clientPromise from "../../../lib/mongodb";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";

const DEFAULT_SETTINGS = {
  emailReminders: true,
  documentReminders: true,
  maintenanceReminders: true,
  emergencyLocation: true,
  compactMode: false,
};

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const email = session.user.email.toLowerCase();

    const client = await clientPromise;
    const db = client.db("login");
    const users = db.collection("user");

    const user = await users.findOne({ email });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const settings = { ...DEFAULT_SETTINGS, ...(user.settings || {}) };

    return NextResponse.json({ settings });
  } catch (err) {
    console.error("Settings GET error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const email = session.user.email.toLowerCase();
    const body = await req.json();

    const safe = {
      emailReminders: !!body.emailReminders,
      documentReminders: !!body.documentReminders,
      maintenanceReminders: !!body.maintenanceReminders,
      emergencyLocation: !!body.emergencyLocation,
      compactMode: !!body.compactMode,
    };

    const client = await clientPromise;
    const db = client.db("login");
    const users = db.collection("user");

    const result = await users.updateOne(
      { email },
      { $set: { settings: safe } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Settings updated successfully" });
  } catch (err) {
    console.error("Settings PUT error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
