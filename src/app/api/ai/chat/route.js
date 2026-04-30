import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { cleanString } from "@/lib/utils";

const SYSTEM_PROMPT = `You are RoadGuardian's assistant for motorbike riders in Ireland.
Keep replies short, clear, and practical.
Help with maintenance questions, road safety, basic troubleshooting, and emergency guidance.
If something is a real emergency, tell the user to call 112 or 999.`;

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
    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing OPENROUTER_API_KEY" },
        { status: 500 }
      );
    }

    const model = process.env.OPENROUTER_MODEL || "openrouter/free";

    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.OPENROUTER_SITE_URL || "http://localhost:3000",
        "X-Title": process.env.OPENROUTER_APP_NAME || "RoadGuardian",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: message },
        ],
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("OpenRouter error:", res.status, data);
      const errMsg =
        data?.error?.message ||
        (typeof data?.error === "string" ? data.error : null) ||
        `AI request failed (${res.status})`;
      return NextResponse.json({ error: errMsg }, { status: 400 });
    }

    const text = data?.choices?.[0]?.message?.content || "";
    return NextResponse.json({ text });
  } catch (e) {
    console.error("AI chat route error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
