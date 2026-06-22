import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { fetchMyProfile, upsertMyProfile } from "@/lib/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Phone } from "lucide-react";

/**
 * Forces the signed-in user to provide a contact phone number before
 * they can use the app. Renders a blocking overlay until saved.
 */
export function ProfileGate() {
  const { user } = useAuth();
  const [needsPhone, setNeedsPhone] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    if (!user) return;
    fetchMyProfile(user.id)
      .then(async (p) => {
        if (!active) return;
        setName(p?.name ?? (user.user_metadata?.name as string) ?? "");
        const metaPhone = (user.user_metadata?.phone as string) ?? "";
        const existingPhone = p?.phone ?? metaPhone ?? "";
        setPhone(existingPhone);
        if (!p?.phone && metaPhone.trim()) {
          // Persist phone captured at signup into the profile (silent).
          await upsertMyProfile(user.id, {
            phone: metaPhone.trim(),
            email: user.email ?? null,
          }).catch(() => {});
        } else if (!existingPhone.trim()) {
          setNeedsPhone(true);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [user]);

  if (!user || !needsPhone) return null;

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (phone.trim().length < 6) {
      toast.error("Please enter a valid phone number");
      return;
    }
    setBusy(true);
    try {
      await upsertMyProfile(user!.id, {
        name: name.trim() || null,
        phone: phone.trim(),
        email: user!.email ?? null,
      });
      toast.success("Thanks! Your contact details are saved.");
      setNeedsPhone(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-background/90 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
        <div className="mb-4 flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/15 text-primary">
            <Phone className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-lg font-semibold">Complete your profile</h2>
            <p className="text-sm text-muted-foreground">
              We need a phone number to reach you.
            </p>
          </div>
        </div>
        <form onSubmit={save} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="gate-name">Full name</Label>
            <Input
              id="gate-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="gate-phone">Phone number</Label>
            <Input
              id="gate-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+20 1xx xxx xxxx"
              inputMode="tel"
            />
          </div>
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? "Saving…" : "Save & continue"}
          </Button>
        </form>
      </div>
    </div>
  );
}
