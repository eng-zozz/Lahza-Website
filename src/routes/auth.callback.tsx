import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/auth/callback")({
  head: () => ({ meta: [{ title: "Signing in… — Lahza" }] }),
  component: AuthCallbackPage,
});

function AuthCallbackPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Supabase's redirectTo flow lands here with either a `code` (PKCE) or
    // tokens in the URL hash (implicit grant) — supabase-js auto-detects
    // and parses both via detectSessionInUrl, so we just wait for the
    // resulting session.
    const params = new URLSearchParams(window.location.search);
    const errorDescription = params.get("error_description");
    if (errorDescription) {
      setError(errorDescription);
      return;
    }

    let settled = false;

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session && !settled) {
        settled = true;
        navigate({ to: "/dashboard", replace: true });
      }
    });

    // In case a session already exists by the time this mounts.
    supabase.auth.getSession().then(({ data }) => {
      if (data.session && !settled) {
        settled = true;
        navigate({ to: "/dashboard", replace: true });
      }
    });

    // Fail safe: if nothing resolves in a few seconds, send back to /auth.
    const timeout = setTimeout(() => {
      if (!settled) navigate({ to: "/auth", replace: true });
    }, 8000);

    return () => {
      sub.subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [navigate]);

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-center">
        <p className="text-sm text-destructive">Sign-in failed: {error}</p>
        <button
          onClick={() => navigate({ to: "/auth" })}
          className="text-sm text-primary underline-offset-4 hover:underline"
        >
          Back to sign in
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">Signing you in…</p>
    </div>
  );
}
