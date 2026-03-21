import clientPromise from "../../../lib/mongodb";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAblyRest } from "@/lib/ablyServer";

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("login");
    const emergencies = db.collection("emergencies");

    const items = await emergencies
      .find({})
      .sort({ createdAt: -1, _id: -1 })
      .toArray();

    return NextResponse.json({
      emergencies: items.map((item) => ({
        ...item,
        _id: String(item._id),
      })),
    });
  } catch (e) {
    console.error("EMERGENCY GET ERROR:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { lat, lng } = await req.json();

    if (typeof lat !== "number" || typeof lng !== "number") {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("login");
    const emergencies = db.collection("emergencies");
    const notifications = db.collection("notifications");

    const emergencyDoc = {
      userEmail: session.user.email,
      userName: session.user.name || "Rider",
      lat,
      lng,
      status: "DISPATCHED",
      createdAt: new Date(),
    };

    const result = await emergencies.insertOne(emergencyDoc);

    const insertedEmergency = {
      ...emergencyDoc,
      _id: String(result.insertedId),
    };

    const otherUsers = await db
      .collection("user")
      .find({ email: { $ne: session.user.email } })
      .project({ email: 1 })
      .toArray();

    if (otherUsers.length > 0) {
      const notificationDocs = otherUsers
        .filter((u) => u.email)
        .map((u) => ({
          userEmail: String(u.email).toLowerCase(),
          title: "Emergency alert",
          text: `${session.user.name || "A rider"} has triggered an emergency alert nearby.`,
          type: "emergency",
          read: false,
          sourceType: "emergency",
          sourceId: String(result.insertedId),
          createdAt: new Date(),
        }));

      if (notificationDocs.length > 0) {
        const notifResult = await notifications.insertMany(notificationDocs);

        try {
          const ably = getAblyRest();

          const notificationIds = Object.values(notifResult.insertedIds);

          for (let i = 0; i < notificationDocs.length; i++) {
            const notif = {
              ...notificationDocs[i],
              _id: String(notificationIds[i]),
            };

            await ably
              .channels.get(`user:${notif.userEmail}`)
              .publish("notification-created", notif);
          }
        } catch (ablyErr) {
          console.error("ABLY emergency notification publish error:", ablyErr);
        }
      }
    }

    try {
      const ably = getAblyRest();
      await ably
        .channels.get("emergencies:live")
        .publish("emergency-updated", {
          action: "upsert",
          emergency: insertedEmergency,
        });
    } catch (ablyErr) {
      console.error("ABLY emergency publish error:", ablyErr);
    }

    return NextResponse.json({ message: "Emergency saved" }, { status: 200 });
  } catch (e) {
    console.error("EMERGENCY POST ERROR:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}