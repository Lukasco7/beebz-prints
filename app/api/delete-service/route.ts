import { connection } from "next/server";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const MAX_REQUEST_SIZE = 2 * 1024;

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  await connection();

  try {
    const contentLength = request.headers.get("content-length");

    if (contentLength) {
      const length = Number(contentLength);

      if (
        !Number.isFinite(length) ||
        length < 0 ||
        length > MAX_REQUEST_SIZE
      ) {
        return NextResponse.json(
          { error: "Request is too large." },
          { status: 413 },
        );
      }
    }

    const supabase = await createClient();

    // Verify authentication using server-verified claims.
    const { data: claimsData, error: claimsError } =
      await supabase.auth.getClaims();

    const userId = claimsData?.claims?.sub;

    if (claimsError || !userId) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 },
      );
    }

    // Verify that the authenticated user is an active admin.
    const { data: profile, error: profileError } =
      await supabase
        .from("profiles")
        .select("role, is_active")
        .eq("id", userId)
        .maybeSingle();

    if (
      profileError ||
      !profile ||
      profile.role !== "admin" ||
      profile.is_active !== true
    ) {
      return NextResponse.json(
        { error: "Forbidden." },
        { status: 403 },
      );
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 },
      );
    }

    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body)
    ) {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 },
      );
    }

    const rawId = (body as { id?: unknown }).id;

    const id =
      typeof rawId === "string"
        ? rawId.trim()
        : "";

    if (!id) {
      return NextResponse.json(
        { error: "Service ID is required." },
        { status: 400 },
      );
    }

    if (!UUID_REGEX.test(id)) {
      return NextResponse.json(
        { error: "Invalid service ID." },
        { status: 400 },
      );
    }

    // Confirm that the service exists before deleting it.
    const { data: service, error: serviceError } =
      await supabase
        .from("services")
        .select("id")
        .eq("id", id)
        .maybeSingle();

    if (serviceError) {
      console.error(
        "Delete service lookup error:",
        serviceError,
      );

      return NextResponse.json(
        { error: "Unable to load service." },
        { status: 500 },
      );
    }

    if (!service) {
      return NextResponse.json(
        { error: "Service not found." },
        { status: 404 },
      );
    }

    const { error: deleteError } = await supabase
      .from("services")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error(
        "Delete service database error:",
        deleteError,
      );

      return NextResponse.json(
        { error: "Unable to delete service." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Service deleted successfully.",
    });
  } catch (error) {
    console.error("Delete service error:", error);

    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 },
    );
  }
}