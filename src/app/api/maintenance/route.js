import clientPromise from "../../../lib/mongodb";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getAblyRest } from "@/lib/ablyServer";

function cleanString(v) {
  if (typeof v !== "string") return "";
  return v.trim();
}

const serviceIntervals = {
  "Oil Change": 5000,
  "Oil Filter Replacement": 5000,
  "Air Filter Replacement": 12000,
  "Chain Clean & Lube": 800,
  "Chain Adjustment": 1500,
  "Chain & Sprocket Kit Replacement": 20000,
  "Brake Pads Replacement": 15000,
  "Brake Fluid Change": 20000,
  "Tire Replacement": 12000,
  "Tire Pressure Check": 500,
  "Spark Plug Replacement": 12000,
  "Battery Replacement": 30000,
  "Clutch Cable Adjustment": 8000,
  "Throttle Cable Adjustment": 8000,
  "Fuel Filter Replacement": 15000,
  "Suspension Service": 25000,
  "Wheel Bearings Check": 12000,
  "Headlight Bulb Replacement": 20000,
  "Indicator Bulb Replacement": 20000,
  "Brake Disc Replacement": 30000,
};

function buildBikeTaskSummary(records) {
  const bikes = {};

  for (const record of records) {
    const bike = record.motorbike || "Unknown bike";
    const km = Number(record.km);

    if (!bikes[bike]) {
      bikes[bike] = {
        bike,
        currentKm: Number.isFinite(km) ? km : 0,
        tasks: {},
      };
    }

    if (Number.isFinite(km) && km > bikes[bike].currentKm) {
      bikes[bike].currentKm = km;
    }

    const taskList = Array.isArray(record.type) ? record.type : [];
    for (const task of taskList) {
      const existing = bikes[bike].tasks[task];
      const recordDate = new Date(record.date || record.createdAt || 0);
      const existingDate = existing
        ? new Date(existing.date || existing.createdAt || 0)
        : null;

      const shouldReplace =
        !existing ||
        (Number.isFinite(km) && Number(record.km) > Number(existing.km)) ||
        (recordDate && existingDate && recordDate > existingDate);

      if (shouldReplace) {
        bikes[bike].tasks[task] = {
          type: task,
          motorbike: bike,
          km,
          date: record.date,
          notes: record.notes || "",
          advisories: record.advisories || "",
          createdAt: record.createdAt,
        };
      }
    }
  }

  return Object.values(bikes).map((bikeData) => {
    const taskItems = Object.values(bikeData.tasks).map((task) => {
      const intervalKm = serviceIntervals[task.type] || null;
      const nextDueKm =
        Number.isFinite(task.km) && Number.isFinite(intervalKm)
          ? task.km + intervalKm
          : null;

      const remainingKm =
        Number.isFinite(nextDueKm) && Number.isFinite(bikeData.currentKm)
          ? nextDueKm - bikeData.currentKm
          : null;

      return {
        ...task,
        intervalKm,
        nextDueKm,
        currentBikeKm: bikeData.currentKm,
        remainingKm,
      };
    });

    return {
      bike: bikeData.bike,
      currentKm: bikeData.currentKm,
      tasks: taskItems,
    };
  });
}

async function syncMaintenanceNotifications(db, userEmail) {
  const maintenance = db.collection("maintenance");
  const notifications = db.collection("notifications");

  const records = await maintenance
    .find({ userEmail })
    .sort({ createdAt: -1, _id: -1 })
    .toArray();

  const summaries = buildBikeTaskSummary(records);

  const desired = [];

  for (const bike of summaries) {
    for (const task of bike.tasks) {
      if (!Number.isFinite(task.remainingKm)) continue;

      let title = "";
      let text = "";

      if (task.remainingKm < 0) {
        title = "Maintenance overdue";
        text = `${task.type} on ${bike.bike} is overdue. Get checked immediately.`;
      } else if (task.remainingKm <= 1500) {
        title = "Maintenance due soon";
        text = `${task.type} on ${bike.bike} is due in ${task.remainingKm.toLocaleString()} km.`;
      } else {
        continue;
      }

      desired.push({
        userEmail,
        title,
        text,
        type: "maintenance",
        read: false,
        sourceType: "maintenanceDue",
        sourceId: `${bike.bike}::${task.type}`,
        motorbike: bike.bike,
        taskType: task.type,
        nextDueKm: task.nextDueKm,
        currentBikeKm: bike.currentKm,
        createdAt: new Date(),
      });
    }
  }

  const desiredIds = desired.map((n) => n.sourceId);

  await notifications.deleteMany({
    userEmail,
    sourceType: "maintenanceDue",
    ...(desiredIds.length > 0
      ? { sourceId: { $nin: desiredIds } }
      : {}),
  });

  const ably = getAblyRest();

  for (const notif of desired) {
    const existing = await notifications.findOne({
      userEmail,
      sourceType: "maintenanceDue",
      sourceId: notif.sourceId,
    });

    if (!existing) {
      const result = await notifications.insertOne(notif);

      try {
        await ably.channels
          .get(`user:${userEmail}`)
          .publish("notification-created", {
            ...notif,
            _id: String(result.insertedId),
          });
      } catch (ablyErr) {
        console.error("ABLY maintenance notification publish error:", ablyErr);
      }
      continue;
    }

    const changed =
      existing.title !== notif.title ||
      existing.text !== notif.text ||
      existing.nextDueKm !== notif.nextDueKm ||
      existing.currentBikeKm !== notif.currentBikeKm;

    if (changed) {
      await notifications.updateOne(
        { _id: existing._id },
        {
          $set: {
            title: notif.title,
            text: notif.text,
            type: notif.type,
            motorbike: notif.motorbike,
            taskType: notif.taskType,
            nextDueKm: notif.nextDueKm,
            currentBikeKm: notif.currentBikeKm,
            createdAt: new Date(),
            read: false,
          },
        }
      );

      try {
        await ably.channels
          .get(`user:${userEmail}`)
          .publish("notification-refresh", {
            sourceType: "maintenanceDue",
            sourceId: notif.sourceId,
          });
      } catch (ablyErr) {
        console.error("ABLY maintenance refresh publish error:", ablyErr);
      }
    }
  }
}

export async function GET(req) {
  try {
    const email = req.headers.get("x-user-email");
    if (!email) return NextResponse.json([]);

    const normalizedEmail = cleanString(email).toLowerCase();

    const client = await clientPromise;
    const db = client.db("login");

    await syncMaintenanceNotifications(db, normalizedEmail);

    const records = await db
      .collection("maintenance")
      .find({ userEmail: normalizedEmail })
      .sort({ createdAt: -1, _id: -1 })
      .toArray();

    return NextResponse.json(records);
  } catch (err) {
    console.error("MAINTENANCE GET ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();

    const userEmail = cleanString(body.userEmail).toLowerCase();

    const doc = {
      userEmail,
      motorbike: cleanString(body.motorbike),
      type: Array.isArray(body.type)
        ? body.type.map((t) => cleanString(t)).filter(Boolean)
        : [],
      date: cleanString(body.date),
      km: Number(body.km),
      notes: cleanString(body.notes || ""),
      advisories: cleanString(body.advisories || ""),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const client = await clientPromise;
    const db = client.db("login");

    await db.collection("maintenance").insertOne(doc);
    await syncMaintenanceNotifications(db, userEmail);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("MAINTENANCE POST ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const body = await req.json();
    const userEmail = cleanString(body.userEmail).toLowerCase();

    const client = await clientPromise;
    const db = client.db("login");

    await db.collection("maintenance").updateOne(
      { _id: new ObjectId(body._id) },
      {
        $set: {
          motorbike: cleanString(body.motorbike),
          type: Array.isArray(body.type)
            ? body.type.map((t) => cleanString(t)).filter(Boolean)
            : [],
          date: cleanString(body.date),
          km: Number(body.km),
          notes: cleanString(body.notes || ""),
          advisories: cleanString(body.advisories || ""),
          updatedAt: new Date(),
        },
      }
    );

    await syncMaintenanceNotifications(db, userEmail);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("MAINTENANCE PUT ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const body = await req.json();

    const client = await clientPromise;
    const db = client.db("login");

    const existing = await db.collection("maintenance").findOne({
      _id: new ObjectId(body._id),
    });

    await db.collection("maintenance").deleteOne({
      _id: new ObjectId(body._id),
    });

    if (existing?.userEmail) {
      await syncMaintenanceNotifications(db, cleanString(existing.userEmail).toLowerCase());
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("MAINTENANCE DELETE ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}