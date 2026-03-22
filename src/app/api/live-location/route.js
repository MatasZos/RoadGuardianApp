import clientPromise from "../../../lib/mongodb";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAblyRest } from "@/lib/ablyServer";

function serialise(item) {
  return {
    ...item,
    _id: String(item._id),
  };
}

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("login");
    const locations = db.collection("live_locations");

    const items = await locations
      .find({ enabled: true })
      .sort({ updatedAt: -1, _id: -1 })
      .toArray();

    return NextResponse.json({
      riders: items.map(serialise),
    });
  } catch (e) {
    console.error("LIVE LOCATION GET ERROR:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { lat, lng, enabled } = body || {};

    const client = await clientPromise;
    const db = client.db("login");
    const locations = db.collection("live_locations");

    const doc = {
      userEmail: session.user.email,
      userName: session.user.name || "Rider",
      lat: typeof lat === "number" ? lat : null,
      lng: typeof lng === "number" ? lng : null,
      enabled: Boolean(enabled),
      updatedAt: new Date(),
    };

    await locations.updateOne(
      { userEmail: session.user.email },
      { $set: doc, $setOnInsert: { createdAt: new Date() } },
      { upsert: true }
    );

    const updated = await locations.findOne({ userEmail: session.user.email });

    try {
      const ably = getAblyRest();
      await ably.channels.get("riders:live").publish("live-location-updated", {
        rider: serialise(updated),
      });
    } catch (ablyErr) {
      console.error("ABLY live location publish error:", ablyErr);
    }

    return NextResponse.json({
      message: "Live location updated",
      rider: serialise(updated),
    });
  } catch (e) {
    console.error("LIVE LOCATION POST ERROR:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}