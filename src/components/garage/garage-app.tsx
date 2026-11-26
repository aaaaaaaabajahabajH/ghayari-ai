"use client";

import { useEffect } from "react";
import useSWR from "swr";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { AuthPanel } from "@/components/garage/auth-panel";
import { GarageDashboard } from "@/components/garage/garage-dashboard";

let supabase: ReturnType<typeof createClient> | undefined;

function getSupabase() {
  supabase ??= createClient();
  return supabase;
}

export function GarageApp() {
  const { data: user, isLoading, mutate } = useSWR("garage-user", async () => {
    const { data, error } = await getSupabase().auth.getUser();
    if (error && error.name !== "AuthSessionMissingError") throw error;
    return data.user;
  });

  useEffect(() => {
    const { data: { subscription } } = getSupabase().auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      void mutate(session?.user ?? null, false);
    });
    return () => subscription.unsubscribe();
  }, [mutate]);

  if (isLoading) {
    return <div className="loading-screen"><div><div className="loading-mark">TG</div>جارٍ تجهيز مساحة الورشة…</div></div>;
  }

  if (!user) return <AuthPanel />;
  return <GarageDashboard user={user} />;
}
