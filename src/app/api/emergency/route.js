import clientPromise from "../../../lib/mongodb";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAblyRest } from "@/lib/ablyServer";

const ACTIVE_STATUSES = [
  "reported",
  "dispatching",
  "rider_responding",
  "help_on_the_way",
  "assistance_received",
];

function isClosed(status) {
  return status === "resolved" || status === "cancelled";
}

// ================= GET =================
export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("login");

    const items = await db
      .collection("emergencies")
      .find({})
      .sort({ createdAt: -1 })
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

// ================= POST (CREATE) =================
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    const {
      lat,
      lng,
      reportMode,
      reportedForName,
      type,
      severity,
      description,
      injured,
      bikeRideable,
      phone,
      shareLiveLocation,
    } = body || {};

    // 🔒 REQUIRE live location
    if (!shareLiveLocation) {
      return NextResponse.json(
        { error: "Live location must be enabled." },
        { status: 400 }
      );
    }

    if (
      typeof lat !== "number" ||
      typeof lng !== "number" ||
      !type ||
      !severity ||
      !reportMode
    ) {
      return NextResponse.json(
        { error: "Missing required emergency fields." },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("login");
    const emergencies = db.collection("emergencies");

    const now = new Date();

    // 🔒 Only restrict SELF reports (allow multiple third_party)
    if (reportMode === "self") {
      const existingActive = await emergencies.findOne({
        userEmail: session.user.email,
        status: { $in: ACTIVE_STATUSES },
      });

      if (existingActive) {
        return NextResponse.json(
          { error: "You already have an active emergency." },
          { status: 400 }
        );
      }
    }

    const emergencyDoc = {
      userEmail: session.user.email,
      userName: session.user.name || "Rider",

      lat,
      lng,

      reportMode, // "self" | "third_party"
      reportedForName:
        reportMode === "third_party" && typeof reportedForName === "string"
          ? reportedForName.trim()
          : "",

      type,
      severity,

      description: typeof description === "string" ? description.trim() : "",
      injured: Boolean(injured),
      bikeRideable:
        typeof bikeRideable === "boolean" ? bikeRideable : null,
      phone: typeof phone === "string" ? phone.trim() : "",

      status: "reported",
      latestUpdate:
        reportMode === "self"
          ? "Rider reported their own emergency"
          : "Emergency reported by another rider",

      shareLiveLocation: true,

      helperUserEmail: null,
      helperUserName: null,
      helperUserId: null,

      routeStartedAt: null,
      arrivedAt: null,
      resolvedAt: null,
      cancelledAt: null,

      createdAt: now,
      updatedAt: now,
    };

    const result = await emergencies.insertOne(emergencyDoc);

    const inserted = {
      ...emergencyDoc,
      _id: String(result.insertedId),
    };

    // 🔔 Realtime update
    try {
      const ably = getAblyRest();
      await ably.channels.get("emergencies:live").publish("emergency-updated", {
        action: "created",
        emergency: inserted,
      });
    } catch (err) {
      console.error("ABLY publish error:", err);
    }

    return NextResponse.json(inserted, { status: 200 });
  } catch (e) {
    console.error("EMERGENCY POST ERROR:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// ================= PATCH (UPDATE) =================
export async function PATCH(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { emergencyId, action, lat, lng } = await req.json();

    if (!emergencyId || !action) {
      return NextResponse.json(
        { error: "Missing emergencyId or action" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("login");
    const emergencies = db.collection("emergencies");

    const emergency = await emergencies.findOne({
      _id: new (await import("mongodb")).ObjectId(emergencyId),
    });

    if (!emergency) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const now = new Date();
    let update = {};

    switch (action) {
      case "claim-help":
        update = {
          status: "rider_responding",
          helperUserEmail: session.user.email,
          helperUserName: session.user.name,
          latestUpdate: "Helper assigned",
          updatedAt: now,
        };
        break;

      case "route-started":
        update = {
          status: "help_on_the_way",
          routeStartedAt: now,
          latestUpdate: "Helper is on the way",
          updatedAt: now,
        };
        break;

      case "arrived":
        update = {
          status: "assistance_received",
          arrivedAt: now,
          latestUpdate: "Helper has arrived",
          updatedAt: now,
        };
        break;

      case "resolve":
        update = {
          status: "resolved",
          resolvedAt: now,
          latestUpdate: "Incident resolved",
          updatedAt: now,
        };
        break;

      case "cancel":
        update = {
          status: "cancelled",
          cancelledAt: now,
          latestUpdate: "Request cancelled",
          updatedAt: now,
        };
        break;

      case "update-location":
        if (typeof lat === "number" && typeof lng === "number") {
          update = {
            lat,
            lng,
            updatedAt: now,
          };
        }
        break;

      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        );
    }

    await emergencies.updateOne(
      { _id: emergency._id },
      { $set: update }
    );

    const updated = await emergencies.findOne({ _id: emergency._id });

    try {
      const ably = getAblyRest();
      await ably.channels.get("emergencies:live").publish("emergency-updated", {
        action,
        emergency: {
          ...updated,
          _id: String(updated._id),
        },
      });
    } catch (err) {
      console.error("ABLY PATCH publish error:", err);
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("EMERGENCY PATCH ERROR:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}