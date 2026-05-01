import clientPromise from "../../../lib/mongodb";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAblyRest } from "@/lib/ablyServer";
import { ObjectId } from "mongodb";

// Keep the public status list small and consistent. Older values still show up
// in the database from earlier iterations of the project, so we normalise them
// on read/update instead of breaking old records.
const EMERGENCY_STATUS = {
  REPORTED: "reported",
  HELPER_ASSIGNED: "helper_assigned",
  ON_THE_WAY: "on_the_way",
  ARRIVED: "arrived",
  RESOLVED: "resolved",
  CANCELLED: "cancelled",
};

const LEGACY_STATUS_NORMALISATION = {
  dispatching: EMERGENCY_STATUS.REPORTED,
  rider_responding: EMERGENCY_STATUS.HELPER_ASSIGNED,
  help_on_the_way: EMERGENCY_STATUS.ON_THE_WAY,
  assistance_received: EMERGENCY_STATUS.ARRIVED,
};

const ACTIVE_STATUSES = [
  // Current statuses
  EMERGENCY_STATUS.REPORTED,
  EMERGENCY_STATUS.HELPER_ASSIGNED,
  EMERGENCY_STATUS.ON_THE_WAY,
  EMERGENCY_STATUS.ARRIVED,
  // Legacy statuses (kept for duplicate-emergency checks)
  "dispatching",
  "rider_responding",
  "help_on_the_way",
  "assistance_received",
];

function isClosedStatus(status) {
  return status === EMERGENCY_STATUS.RESOLVED || status === EMERGENCY_STATUS.CANCELLED;
}

function normaliseStatus(status) {
  if (!status) return EMERGENCY_STATUS.REPORTED;
  return LEGACY_STATUS_NORMALISATION[status] ?? status;
}

function toClientEmergency(doc) {
  return {
    ...doc,
    _id: String(doc._id),
    status: normaliseStatus(doc.status),
  };
}

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
      emergencies: items.map(toClientEmergency),
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

      reportMode, 
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

      helperAssignedAt: null,
      onTheWayAt: null,
      // Kept for older UI code that still reads this field.
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
      _id: new ObjectId(emergencyId),
    });

    if (!emergency) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const now = new Date();
    const viewerEmail = session.user.email;
    const viewerName = session.user.name || "Rider";

    const isReporter = emergency.userEmail === viewerEmail;
    const isHelper = emergency.helperUserEmail === viewerEmail;
    const isClosed = isClosedStatus(normaliseStatus(emergency.status));

    if (isClosed && action !== "update-location") {
      return NextResponse.json(
        { error: "This emergency is already closed." },
        { status: 400 }
      );
    }

    let update = {};

    switch (action) {
      case "claim-help":
      case "assign-helper": {
        if (isReporter) {
          return NextResponse.json(
            { error: "You can't assign yourself as the helper." },
            { status: 400 }
          );
        }
        if (emergency.helperUserEmail && !isHelper) {
          return NextResponse.json(
            { error: "A helper is already assigned to this emergency." },
            { status: 400 }
          );
        }
        update = {
          status: EMERGENCY_STATUS.HELPER_ASSIGNED,
          helperUserEmail: viewerEmail,
          helperUserName: viewerName,
          helperAssignedAt: now,
          latestUpdate: `${viewerName} offered to help`,
          updatedAt: now,
        };
        break;
      }

      case "route-started":
      case "on-the-way": {
        if (!isHelper) {
          return NextResponse.json(
            { error: "Only the assigned helper can mark 'On The Way'." },
            { status: 403 }
          );
        }
        update = {
          status: EMERGENCY_STATUS.ON_THE_WAY,
          onTheWayAt: now,
          routeStartedAt: now,
          latestUpdate: "Helper is on the way",
          updatedAt: now,
        };
        break;
      }

      case "arrived":
      case "mark-arrived": {
        if (!isHelper) {
          return NextResponse.json(
            { error: "Only the assigned helper can mark 'Arrived'." },
            { status: 403 }
          );
        }
        update = {
          status: EMERGENCY_STATUS.ARRIVED,
          arrivedAt: now,
          latestUpdate: "Helper has arrived",
          updatedAt: now,
        };
        break;
      }

      case "resolve":
      case "mark-resolved": {
        if (!isHelper && !isReporter) {
          return NextResponse.json(
            { error: "Only the reporter or helper can resolve this emergency." },
            { status: 403 }
          );
        }
        update = {
          status: EMERGENCY_STATUS.RESOLVED,
          resolvedAt: now,
          latestUpdate: "Emergency resolved",
          shareLiveLocation: false,
          updatedAt: now,
        };
        break;
      }

      case "cancel":
      case "cancel-request": {
        if (!isReporter) {
          return NextResponse.json(
            { error: "Only the reporter can cancel this request." },
            { status: 403 }
          );
        }
        update = {
          status: EMERGENCY_STATUS.CANCELLED,
          cancelledAt: now,
          latestUpdate: "Request cancelled",
          shareLiveLocation: false,
          updatedAt: now,
        };
        break;
      }

      case "update-location":
        if (!isReporter) {
          return NextResponse.json(
            { error: "Only the reporter can update the emergency location." },
            { status: 403 }
          );
        }
        if (!emergency.shareLiveLocation) break;
        if (typeof lat !== "number" || typeof lng !== "number") break;
        update = { lat, lng, updatedAt: now };
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
        emergency: toClientEmergency(updated),
      });
    } catch (err) {
      console.error("ABLY PATCH publish error:", err);
    }

    return NextResponse.json({ success: true, emergency: toClientEmergency(updated) });
  } catch (e) {
    console.error("EMERGENCY PATCH ERROR:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
