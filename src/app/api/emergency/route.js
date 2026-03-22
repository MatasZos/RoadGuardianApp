import clientPromise from "../../../lib/mongodb";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { ObjectId } from "mongodb";
import { authOptions } from "@/lib/auth";
import { getAblyRest } from "@/lib/ablyServer";

const ACTIVE_STATUSES = [
  "reported",
  "dispatching",
  "rider_responding",
  "help_on_the_way",
  "assistance_received",
];

function isClosedStatus(status) {
  return status === "resolved" || status === "cancelled";
}

function serialiseIncident(item) {
  return {
    ...item,
    _id: String(item._id),
    helperUserId: item.helperUserId ? String(item.helperUserId) : null,
  };
}

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("login");
    const emergencies = db.collection("emergencies");

    const items = await emergencies.find({}).sort({ createdAt: -1, _id: -1 }).toArray();

    return NextResponse.json({
      emergencies: items.map(serialiseIncident),
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
      type,
      severity,
      description,
      injured,
      bikeRideable,
      phone,
      shareLiveLocation,
    } = body || {};

    if (
      typeof lat !== "number" ||
      typeof lng !== "number" ||
      !type ||
      !severity
    ) {
      return NextResponse.json(
        { error: "Missing required emergency fields." },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("login");
    const emergencies = db.collection("emergencies");
    const notifications = db.collection("notifications");

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

    const now = new Date();

    const emergencyDoc = {
      userEmail: session.user.email,
      userName: session.user.name || "Rider",
      lat,
      lng,
      type,
      severity,
      description: typeof description === "string" ? description.trim() : "",
      injured: Boolean(injured),
      bikeRideable: typeof bikeRideable === "boolean" ? bikeRideable : null,
      phone: typeof phone === "string" ? phone.trim() : "",
      status: "reported",
      latestUpdate: "Emergency reported",
      shareLiveLocation: Boolean(shareLiveLocation),
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

    const insertedEmergency = serialiseIncident({
      ...emergencyDoc,
      _id: result.insertedId,
    });

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
          text: `${session.user.name || "A rider"} reported a ${severity} ${type.replaceAll("_", " ")} incident.`,
          type: "emergency",
          read: false,
          sourceType: "emergency",
          sourceId: String(result.insertedId),
          createdAt: now,
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
      await ably.channels.get("emergencies:live").publish("emergency-updated", {
        action: "created",
        emergency: insertedEmergency,
      });
    } catch (ablyErr) {
      console.error("ABLY emergency publish error:", ablyErr);
    }

    return NextResponse.json(
      { message: "Emergency saved", emergency: insertedEmergency },
      { status: 200 }
    );
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

    const body = await req.json();
    const { emergencyId, action, lat, lng } = body || {};

    if (!emergencyId || !action) {
      return NextResponse.json(
        { error: "Missing emergencyId or action." },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("login");
    const emergencies = db.collection("emergencies");

    const incident = await emergencies.findOne({
      _id: new ObjectId(emergencyId),
    });

    if (!incident) {
      return NextResponse.json({ error: "Incident not found." }, { status: 404 });
    }

    const email = String(session.user.email).toLowerCase();
    const name = session.user.name || "Rider";
    const isOwner = String(incident.userEmail).toLowerCase() === email;
    const isHelper =
      incident.helperUserEmail &&
      String(incident.helperUserEmail).toLowerCase() === email;

    const now = new Date();
    const update = { $set: { updatedAt: now } };

    if (action === "update-location") {
      if (!isOwner) {
        return NextResponse.json({ error: "Only owner can update location." }, { status: 403 });
      }

      if (typeof lat !== "number" || typeof lng !== "number") {
        return NextResponse.json({ error: "Missing lat/lng." }, { status: 400 });
      }

      update.$set.lat = lat;
      update.$set.lng = lng;
      update.$set.latestUpdate = "Location updated";
    } else if (action === "claim-help") {
      if (isOwner) {
        return NextResponse.json({ error: "You cannot claim your own incident." }, { status: 400 });
      }

      if (isClosedStatus(incident.status)) {
        return NextResponse.json({ error: "Incident is already closed." }, { status: 400 });
      }

      if (
        incident.helperUserEmail &&
        String(incident.helperUserEmail).toLowerCase() !== email
      ) {
        return NextResponse.json({ error: "This incident already has a helper." }, { status: 400 });
      }

      update.$set.status = "rider_responding";
      update.$set.helperUserEmail = email;
      update.$set.helperUserName = name;
      update.$set.latestUpdate = `${name} offered help`;
    } else if (action === "route-started") {
      if (!isHelper && !(!incident.helperUserEmail && !isOwner)) {
        return NextResponse.json({ error: "Only assigned helper can start route." }, { status: 403 });
      }

      if (!incident.helperUserEmail) {
        update.$set.helperUserEmail = email;
        update.$set.helperUserName = name;
      }

      update.$set.status = "help_on_the_way";
      update.$set.routeStartedAt = now;
      update.$set.latestUpdate = `${name} is on the way`;
    } else if (action === "arrived") {
      if (!isHelper) {
        return NextResponse.json({ error: "Only helper can mark arrived." }, { status: 403 });
      }

      update.$set.status = "assistance_received";
      update.$set.arrivedAt = now;
      update.$set.latestUpdate = `${name} arrived`;
    } else if (action === "resolve") {
      if (!isOwner && !isHelper) {
        return NextResponse.json({ error: "Only rider or helper can resolve." }, { status: 403 });
      }

      update.$set.status = "resolved";
      update.$set.resolvedAt = now;
      update.$set.latestUpdate = "Incident resolved";
    } else if (action === "cancel") {
      if (!isOwner) {
        return NextResponse.json({ error: "Only rider can cancel." }, { status: 403 });
      }

      update.$set.status = "cancelled";
      update.$set.cancelledAt = now;
      update.$set.latestUpdate = "Incident cancelled";
    } else {
      return NextResponse.json({ error: "Unknown action." }, { status: 400 });
    }

    await emergencies.updateOne({ _id: incident._id }, update);

    const updatedIncident = await emergencies.findOne({ _id: incident._id });

    try {
      const ably = getAblyRest();
      await ably.channels.get("emergencies:live").publish("emergency-updated", {
        action,
        emergency: serialiseIncident(updatedIncident),
      });
    } catch (ablyErr) {
      console.error("ABLY emergency patch publish error:", ablyErr);
    }

    return NextResponse.json({
      message: "Emergency updated",
      emergency: serialiseIncident(updatedIncident),
    });
  } catch (e) {
    console.error("EMERGENCY PATCH ERROR:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}