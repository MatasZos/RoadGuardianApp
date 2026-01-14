import clientPromise from "../../../lib/mongodb";

export async function GET(req) {
  const email = req.headers.get("x-user-email");
  if (!email) return new Response(JSON.stringify({ error: "Email missing" }), { status: 400 });

  try {
    const client = await clientPromise;
    const db = client.db("login");

    const user = await db.collection("user").findOne({ email });
    if (!user) return new Response(JSON.stringify({ error: "User not found" }), { status: 404 });

    return new Response(JSON.stringify({
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      password: user.password,
    }));
  } catch (err) {
    return new Response(JSON.stringify({ error: "Server error" }), { status: 500 });
  }
}
