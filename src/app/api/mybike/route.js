import clientPromise from "../../../lib/mongodb";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const email = session.user.email.toLowerCase();

    const client = await clientPromise;
    const db = client.db("login");
    const userCollection = db.collection("user");

    const user = await userCollection.findOne({ email });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      bike: {
        motorbike: user.motorbike || "",
        bikeYear: user.bikeYear || "",
        bikeMileage: user.bikeMileage || "",
        bikeNotes: user.bikeNotes || "",
      },
    });
  } catch (err) {
    console.error("MyBike GET error:", err);
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
    const { motorbike, bikeYear, bikeMileage, bikeNotes } = body;

    const client = await clientPromise;
    const db = client.db("login");
    const userCollection = db.collection("user");

    const result = await userCollection.updateOne(
      { email },
      {
        $set: {
          motorbike: motorbike ?? "",
          bikeYear: bikeYear ?? "",
          bikeMileage: bikeMileage ?? "",
          bikeNotes: bikeNotes ?? "",
        },
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Bike updated successfully" });
  } catch (err) {
    console.error("MyBike PUT error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
