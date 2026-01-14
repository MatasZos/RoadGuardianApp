import clientPromise from "../../../lib/mongodb";

export async function POST(req) {
  const { email, password } = await req.json();
  const client = await clientPromise;

  const db = client.db("login");
  const user = await db.collection("user").findOne({ email });

  if (!user || user.password !== password) {
    return Response.json(
      { error: "Invalid email or password" },
      { status: 401 }
    );
  }

  return Response.json({
    fullName: user.fullName, 
    email: user.email,
  });
}
