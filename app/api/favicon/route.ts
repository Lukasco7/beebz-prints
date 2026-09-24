import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("site_settings")
    .select("favicon_url")
    .limit(1)
    .maybeSingle();

  if (error || !data?.favicon_url) {
    return new NextResponse(null, { status: 404 });
  }

  try {
    const response = await fetch(data.favicon_url, {
      cache: "no-store",
    });

    if (!response.ok || !response.body) {
      return new NextResponse(null, { status: 404 });
    }

    const contentType =
      response.headers.get("content-type") || "image/png";

    return new NextResponse(response.body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}