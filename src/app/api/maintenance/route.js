import clientPromise from "../../../lib/mongodb";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

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

function getNextServiceData(types, km) {
  const validTypes = Array.isArray(types) ? types : [];
  const intervals = validTypes
    .map((type) => ({
      type,
      intervalKm: serviceIntervals[type] || null,
    }))
    .filter((item) => typeof item.intervalKm === "number");

  if (intervals.length === 0 || !Number.isFinite(km)) {
    return {
      serviceIntervalKm: null,
      nextDueKm: null,
      nextServiceType: "",
    };
  }

  const soonest = intervals.reduce((lowest, current) =>
    current.intervalKm < lowest.intervalKm ? current : lowest
  );

  return {
    serviceIntervalKm: soonest.intervalKm,
    nextDueKm: km + soonest.intervalKm,
    nextServiceType: soonest.type,
  };
}

export async function GET(req) {
  try {
    const email = req.headers.get("x-user-email");
    if (!email) return NextResponse.json([]);

    const client = await clientPromise;
    const db = client.db("login");

    const records = await db
      .collection("maintenance")
      .find({ userEmail: email })
      .sort({ createdAt: -1, _id: -1 })
      .toArray();

    return NextResponse.json(records);
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();

    const km = Number(body.km);
    const type = Array.isArray(body.type) ? body.type : [];
    const advisories = cleanString(body.advisories || "");
    const nextService = getNextServiceData(type, km);

    const doc = {
      userEmail: cleanString(body.userEmail),
      motorbike: cleanString(body.motorbike),
      type,
      date: cleanString(body.date),
      km,
      notes: cleanString(body.notes || ""),
      advisories,
      serviceIntervalKm: nextService.serviceIntervalKm,
      nextDueKm: nextService.nextDueKm,
      nextServiceType: nextService.nextServiceType,
      createdAt: new Date(),
    };

    const client = await clientPromise;
    const db = client.db("login");

    await db.collection("maintenance").insertOne(doc);

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const body = await req.json();
    const km = Number(body.km);
    const type = Array.isArray(body.type) ? body.type : [];
    const advisories = cleanString(body.advisories || "");
    const nextService = getNextServiceData(type, km);

    const client = await clientPromise;
    const db = client.db("login");

    await db.collection("maintenance").updateOne(
      { _id: new ObjectId(body._id) },
      {
        $set: {
          motorbike: cleanString(body.motorbike),
          type,
          date: cleanString(body.date),
          km,
          notes: cleanString(body.notes || ""),
          advisories,
          serviceIntervalKm: nextService.serviceIntervalKm,
          nextDueKm: nextService.nextDueKm,
          nextServiceType: nextService.nextServiceType,
        },
      }
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const body = await req.json();

    const client = await clientPromise;
    const db = client.db("login");

    await db.collection("maintenance").deleteOne({
      _id: new ObjectId(body._id),
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}