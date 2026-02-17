import clientPromise from "../../../lib/mongodb";
import bcrypt from

export async function POST(req) {
  const { fullName, email, password, phone, motorbike, accountType } =
    await req.json();

  if (!fullName || !email || !password || !phone || !motorbike || !accountType) {
    return new Response(JSON.stringify({ error: "Missing fields" }), {
      status: 400,
    });
  }

  try {
    const client = await clientPromise;
    const db = client.db("login");
    const userCollection = db.collection("user");

    const existingUser = await userCollection.findOne({ email });
    if (existingUser) {
      return new Response(JSON.stringify({ error: "Email already exists" }), {
        status: 400,
      });
    }

    await userCollection.insertOne({
      fullName,
      email,
      password,
      phone,
      motorbike,
      accountType,
    });

    return new Response(
      JSON.stringify({ message: "User registered successfully" }),
      { status: 200 }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: "Server error" }), {
      status: 500,
    });
  }
}
