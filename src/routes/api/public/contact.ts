import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email().max(200),
  company: z.string().max(160).optional().nullable(),
  message: z.string().max(2000).optional().nullable(),
});

export const Route = createFileRoute("/api/public/contact")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return Response.json({ error: "Invalid JSON" }, { status: 400 });
        }
        const parsed = schema.safeParse(body);
        if (!parsed.success) {
          return Response.json({ error: "Invalid input" }, { status: 422 });
        }
        const { name, email, company, message } = parsed.data;
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { error } = await supabaseAdmin.from("leads").insert({
          name,
          email,
          company: company ?? null,
          notes: message ?? null,
          source: "WEBSITE",
          status: "NEW",
        });
        if (error) {
          console.error("[contact] insert failed", error.message);
          return Response.json({ error: "Could not submit" }, { status: 500 });
        }
        return Response.json({ ok: true });
      },
    },
  },
});
