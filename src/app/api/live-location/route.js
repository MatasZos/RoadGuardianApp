import clientPromise from "../../../lib/mongodb";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAblyRest } from "@/lib/ablyServer";

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("login");

    const riders = await db
      .collection("live_locations")
      .find({})
      .toArray();

    return NextResponse.json({
      riders: riders.map((r) => ({
        ...r,
        _id: String(r._id),
      })),
    });
  } catch (err) {
    console.error("LIVE LOCATION GET ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { lat, lng, enabled } = await req.json();

    const client = await clientPromise;
    const db = client.db("login");
    const collection = db.collection("live_locations");

    const now = new Date();

    await collection.updateOne(
      { userEmail: session.user.email },
      {
        $set: {
          userEmail: session.user.email,
          userName: session.user.name || "Rider",
          lat,
          lng,
          enabled: Boolean(enabled),
          updatedAt: now,
        },
      },
      { upsert: true }
    );

    try {
      const ably = getAblyRest();
      await ably.channels.get("riders:live").publish("live-location-updated", {
        userEmail: session.user.email,
      });
    } catch (err) {
      console.error("ABLY live location error:", err);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("LIVE LOCATION POST ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}