import { createClient } from "@/lib/supabase/server";
import { type EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { type NextRequest } from "next/server";

function getSafeRedirectPath(value: string | null) {
  if (!value) {
    return "/";
  }

  // Only allow internal paths.
  // Reject absolute URLs such as https://example.com
  // and protocol-relative URLs such as //example.com.
  if (!value.startsWith("/") || value.startsWith("//")) {
    return "/";
  }

  return value;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = getSafeRedirectPath(searchParams.get("next"));

  if (!tokenHash || !type) {
    redirect(
      `/auth/error?error=${encodeURIComponent(
        "No token hash or type",
      )}`,
    );
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.verifyOtp({
    type,
    token_hash: tokenHash,
  });

  if (error) {
    redirect(
      `/auth/error?error=${encodeURIComponent(
        error.message,
      )}`,
    );
  }

  redirect(next);
}