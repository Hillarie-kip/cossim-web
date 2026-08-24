import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function GET() {
  const apiKey = String(process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "").trim();
  if (!apiKey) return NextResponse.json({ configured: false }, { status: 503 });
  return NextResponse.json({ configured: true, apiKey }, {
    headers: { "Cache-Control": "private, max-age=300" },
  });
}
