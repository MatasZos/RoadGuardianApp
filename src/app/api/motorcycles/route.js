import { NextResponse } from "next/server";

export async function GET(req) {
  const { searchParams } = new URL(req.url);

  const make = searchParams.get("make") || "";
  const model = searchParams.get("model") || "";
  const year = searchParams.get("year") || "";

  // API Ninjas requires either make or model
  if (!make && !model) {
    return NextResponse.json(
      { error: "Either make or model is required" },
      { status: 400 }
    );
  }

  const url = new URL("https://api-ninjas.com/api/motorcycles#v1-motorcycles");
  if (make) url.searchParams.set("make", make);
  if (model) url.searchParams.set("model", model);
  if (year) url.searchParams.set("year", year);

  try {
    const apiRes = await fetch(url.toString(), {
      headers: {
        "X-Api-Key": process.env.API_NINJAS_KEY,
      },
      // optional: avoid caching while developing
      cache: "no-store",
    });

    const data = await apiRes.json();

    if (!apiRes.ok) {
      return NextResponse.json(
        { error: data?.error || "Motorcycles API error" },
        { status: apiRes.status }
      );
    }

    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
