// AI Chat Route for RoadGuardian App
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
// This route handles POST requests to chat with the AI assistant. 
function cleanString(v) {
  if (typeof v !== "string") return null;
  const s = v.trim();
  return s ? s : null;
}

// This POST handler receives a user message, validates it, and forwards it to the OpenRouter API to get a response from the AI assistant. 
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const message = cleanString(body?.message);

    if (!message) {
      return NextResponse.json({ error: "Message required" }, { status: 400 });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    const model = process.env.OPENROUTER_MODEL || "openrouter/free";

    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing OPENROUTER_API_KEY" },
        { status: 500 }
      );
    }
    // Forward the message to OpenRouter API
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        // Use Bearer token authentication with the API key from environment variables
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        // Set HTTP-Referer and X-Title headers for better API usage tracking and debugging
        "HTTP-Referer": process.env.OPENROUTER_SITE_URL || "http://localhost:3000",
        "X-Title": process.env.OPENROUTER_APP_NAME || "RoadGuardian",
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            // The system prompt defines the assistant's role and behavior, guiding it to provide concise, clear, and practical responses for motorbike riders in Ireland. It emphasizes safety and directs users to call emergency services if needed.
            role: "system",
            content:
              "You are RoadGuardian's assistant for motorbike riders in Ireland. Keep replies short, clear, and practical.
              Help with maintenance questions, road safety, basic troubleshooting, and emergency guidance.
              If something is a real emergency, tell the user to call 112 or 999.",
          },
          { role: "user", content: message },
        ],
      }),
    });

    const data = await res.json();
    // If the OpenRouter API response is not successful, log the error and return an appropriate error message to the client.
    if (!res.ok) {
      console.error("OpenRouter error:", res.status, data);
      const errMsg =
        data?.error?.message ||
        (typeof data?.error === "string" ? data.error : null) ||
        `AI request failed (${res.status})`;
      return NextResponse.json({ error: errMsg }, { status: 400 });
    }
    //Get the AI assistant's reply from the OpenRouter API response and return it to the client. If the expected content is missing, return an empty string.
    const text = data?.choices?.[0]?.message?.content || "";
    return NextResponse.json({ text }, { status: 200 });
  } catch (e) {
    console.error("AI chat route error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
