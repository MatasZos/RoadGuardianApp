import clientPromise from "../../../lib/mongodb";


export async function POST(req) {
  const { email, password } = await req.json();

  if (!email || !password) {
    return new Response(JSON.stringify({ error: "Missing email or password" }), { status: 400 });
  }

  try {
    const client = await clientPromise;
    const db = client.db("login");
    const userCollection = db.collection("user");

    const user = await userCollection.findOne({ email, password });
    if (!user) {
      return new Response(JSON.stringify({ error: "Invalid credentials" }), { status: 401 });
    }

    return new Response(JSON.stringify({ message: `Welcome ${user.fullName}` }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
