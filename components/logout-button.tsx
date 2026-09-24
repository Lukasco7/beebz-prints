"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function LogoutButton() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const logout = async () => {
    if (isLoading) return;

    setIsLoading(true);

    try {
      const supabase = createClient();

      const { error } = await supabase.auth.signOut();

      if (error) {
        throw error;
      }

      router.push("/auth/login");
      router.refresh();
    } catch (error) {
      console.error("Logout failed:", error);
      setIsLoading(false);
    }
  };

  return (
    <Button
      type="button"
      onClick={logout}
      disabled={isLoading}
      variant="outline"
      className="w-full border-white/15 bg-white/[0.06] text-white hover:border-white/30 hover:bg-white/[0.10] hover:text-white"
    >
      {isLoading ? "Signing Out..." : "Sign Out"}
    </Button>
  );
}