import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";
import { Logo } from "@/components/brand/logo";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign in — Lahza" }] }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/dashboard" });
  }, [user, loading, navigate]);

  async function handleEmail(e: React.FormEvent<HTMLFormElement>, mode: "in" | "up") {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email"));
    const password = String(fd.get("password"));
    const name = String(fd.get("name") ?? "");
    const phone = String(fd.get("phone") ?? "");
    setBusy(true);
    try {
      if (mode === "up") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: { name, phone },
          },
        });
        if (error) throw error;
        toast.success("Account created! Redirecting…");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      navigate({ to: "/dashboard" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogle() {
    setBusy(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      toast.error("Google sign-in failed");
      setBusy(false);
    }
    // On success the browser redirects to Google, then to /auth/callback —
    // nothing else to do here.
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-grid px-4">
      <div className="pointer-events-none absolute left-1/2 top-0 h-[300px] w-[600px] -translate-x-1/2 rounded-full bg-primary/15 blur-[120px]" />
      <div className="relative w-full max-w-md">
        <Link to="/" className="mb-8 flex items-center justify-center">
          <Logo size={36} />
        </Link>
        <div className="rounded-2xl border border-border bg-card p-6 shadow-xl">
          <Tabs defaultValue="in">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="in">Sign in</TabsTrigger>
              <TabsTrigger value="up">Create account</TabsTrigger>
            </TabsList>

            <TabsContent value="in">
              <form onSubmit={(e) => handleEmail(e, "in")} className="mt-4 space-y-4">
                <Field id="email-in" name="email" type="email" label="Email" />
                <Field id="pw-in" name="password" type="password" label="Password" />
                <Button type="submit" className="w-full" disabled={busy}>
                  Sign in
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="up">
              <form onSubmit={(e) => handleEmail(e, "up")} className="mt-4 space-y-4">
                <Field id="name-up" name="name" type="text" label="Full name" />
                <Field id="email-up" name="email" type="email" label="Email" />
                <Field id="phone-up" name="phone" type="tel" label="Phone number" />
                <Field id="pw-up" name="password" type="password" label="Password" />
                <Button type="submit" className="w-full" disabled={busy}>
                  Create account
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
          </div>
          <Button variant="outline" className="w-full" onClick={handleGoogle} disabled={busy}>
            Continue with Google
          </Button>
        </div>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          By continuing you agree to Lahza's Terms & Privacy Policy.
        </p>
      </div>
    </div>
  );
}

function Field({
  id,
  name,
  type,
  label,
}: {
  id: string;
  name: string;
  type: string;
  label: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        name={name}
        type={type}
        required
        minLength={type === "password" ? 6 : undefined}
      />
    </div>
  );
}
