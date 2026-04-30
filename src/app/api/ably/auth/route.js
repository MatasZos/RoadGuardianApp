// ABLY Authentication Route 
import { NextResponse } from "next/server";
import Ably from "ably";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
 
// This route generates an Ably token request for authenticated users.
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // Initialize Ably client with API key from environment variables
    const client = new Ably.Rest(process.env.ABLY_API_KEY);

    const tokenRequest = await client.auth.createTokenRequest({
      clientId: session.user.email,
    });
    // Return the token request to the client
    return NextResponse.json(tokenRequest);
  } catch (err) {
    console.error("ABLY AUTH ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}