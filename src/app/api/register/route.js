import clientPromise from "../../../lib/mongodb";
import bcrypt from "bcryptjs";

function cleanString(value) {
  if (typeof value !== "string") return null;
  return value.trim();
}

function validEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
function strongPassword(password) {
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  );
}

function validPhone(phone) {
  return /^08[0-9]{8}$/.test(phone);
}


export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
    });
  }
  const fullName = cleanString(body.fullName);
  const email = cleanString(body.email)?.toLowerCase();
  const password = cleanString(body.password);
  const phone = cleanString(body.phone);
  const accountType = cleanString(body.accountType);

  if (!fullName || !email || !password || !phone || !accountType) {
    return new Response(JSON.stringify({ error: "Invalid input" }), {
      status: 400,
    });
  }

  if (!validEmail(email)) {
    return new Response(JSON.stringify({ error: "Invalid email" }), {
      status: 400,
    });
  }
  if (!strongPassword(password)) {
    return new Response(
      JSON.stringify({
        error:
          "Password must be 8+ chars with uppercase, lowercase, number, and symbol",
      }),
      { status: 400 }
    );
  }
  if (!validPhone(phone)) {
  return new Response(
    JSON.stringify({
      error: "Phone must start with 08 and be exactly 10 digits",
    }),
    { status: 400 }
  );
}


  try {
    const client = await clientPromise;
    const db = client.db("login");
    const users = db.collection("user");

    const existingUser = await users.findOne({ email });
    if (existingUser) {
      return new Response(JSON.stringify({ error: "Email already exists" }), {
        status: 400,
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await users.insertOne({
      fullName,
      email,
      passwordHash,
      phone,
      accountType,
      createdAt: new Date(),
    });

    return new Response(JSON.stringify({ message: "User registered" }), {
      status: 200,
    });
  } catch (err) {
    if (err?.code === 11000) {
      return new Response(JSON.stringify({ error: "Email already exists" }), {
        status: 400,
      });
    }

    return new Response(JSON.stringify({ error: "Server error" }), {
      status: 500,
    });
  }
}
