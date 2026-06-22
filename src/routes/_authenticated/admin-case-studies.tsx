import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import {
  fetchCaseStudies,
  createCaseStudy,
  updateCaseStudy,
  deleteCaseStudy,
  uploadCaseStudyImage,
  deleteCaseStudyImage,
  slugify,
  type CaseStudy,
  type CaseStudyMetric,
} from "@/lib/case-studies";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Plus, Trash2, Pencil, ImagePlus, X, Loader2, ExternalLink } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin-case-studies")({
  component: AdminCaseStudiesPage,
});

interface FormState {
  company_name: string;
  slug: string;
  client_name: string;
  industry: string;
  summary: string;
  logo_url: string;
  gallery_urls: string[];
  challenge: string;
  solution: string;
  technologies: string;
  services: string;
  results: string;
  metrics: CaseStudyMetric[];
  timeline: string;
  published: boolean;
}

const EMPTY_FORM: FormState = {
  company_name: "",
  slug: "",
  client_name: "",
  industry: "",
  summary: "",
  logo_url: "",
  gallery_urls: [],
  challenge: "",
  solution: "",
  technologies: "",
  services: "",
  results: "",
  metrics: [],
  timeline: "",
  published: true,
};

function toFormState(cs: CaseStudy): FormState {
  return {
    company_name: cs.company_name,
    slug: cs.slug,
    client_name: cs.client_name ?? "",
    industry: cs.industry ?? "",
    summary: cs.summary,
    logo_url: cs.logo_url ?? "",
    gallery_urls: cs.gallery_urls,
    challenge: cs.challenge ?? "",
    solution: cs.solution ?? "",
    technologies: cs.technologies.join(", "),
    services: cs.services.join(", "),
    results: cs.results.join("\n"),
    metrics: cs.metrics,
    timeline: cs.timeline ?? "",
    published: cs.published,
  };
}

function AdminCaseStudiesPage() {
  const { hasAnyRole } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const isAdmin = hasAnyRole(["SUPER_ADMIN", "ADMIN"]);

  useEffect(() => {
    if (!isAdmin) navigate({ to: "/dashboard" });
  }, [isAdmin, navigate]);

  const [editing, setEditing] = useState<CaseStudy | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<CaseStudy | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);

  const { data: caseStudies = [], isLoading } = useQuery({
    queryKey: ["case-studies", "admin"],
    queryFn: fetchCaseStudies,
    enabled: isAdmin,
  });

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormOpen(true);
  }

  function openEdit(cs: CaseStudy) {
    setEditing(cs);
    setForm(toFormState(cs));
    setFormOpen(true);
  }

  const saveMut = useMutation({
    mutationFn: async () => {
      const payload = {
        company_name: form.company_name,
        slug: form.slug || slugify(form.company_name),
        client_name: form.client_name || null,
        industry: form.industry || null,
        summary: form.summary,
        logo_url: form.logo_url || null,
        gallery_urls: form.gallery_urls,
        challenge: form.challenge || null,
        solution: form.solution || null,
        technologies: form.technologies
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        services: form.services
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        results: form.results
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean),
        metrics: form.metrics.filter((m) => m.label.trim()),
        timeline: form.timeline || null,
        published: form.published,
        sort_order: editing?.sort_order ?? 0,
      };
      if (editing) {
        await updateCaseStudy(editing.id, payload);
      } else {
        await createCaseStudy(payload);
      }
    },
    onSuccess: () => {
      toast.success(editing ? "Case study updated" : "Case study created");
      qc.invalidateQueries({ queryKey: ["case-studies"] });
      setFormOpen(false);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to save"),
  });

  const deleteMut = useMutation({
    mutationFn: (cs: CaseStudy) => deleteCaseStudy(cs.id),
    onSuccess: () => {
      toast.success("Case study deleted");
      qc.invalidateQueries({ queryKey: ["case-studies"] });
      setDeleteTarget(null);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to delete"),
  });

  async function handleLogoSelect(file: File | undefined) {
    if (!file) return;
    setUploadingLogo(true);
    try {
      const url = await uploadCaseStudyImage(file);
      setForm((f) => ({ ...f, logo_url: url }));
    } catch (e) {
      toast.error("Logo upload failed");
    } finally {
      setUploadingLogo(false);
    }
  }

  async function handleGallerySelect(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploadingGallery(true);
    try {
      const urls = await Promise.all(Array.from(files).map(uploadCaseStudyImage));
      setForm((f) => ({ ...f, gallery_urls: [...f.gallery_urls, ...urls] }));
    } catch (e) {
      toast.error("One or more images failed to upload");
    } finally {
      setUploadingGallery(false);
    }
  }

  async function removeLogo() {
    if (form.logo_url) await deleteCaseStudyImage(form.logo_url).catch(() => {});
    setForm((f) => ({ ...f, logo_url: "" }));
  }

  async function removeGalleryImage(url: string) {
    await deleteCaseStudyImage(url).catch(() => {});
    setForm((f) => ({ ...f, gallery_urls: f.gallery_urls.filter((u) => u !== url) }));
  }

  function addMetricRow() {
    setForm((f) => ({ ...f, metrics: [...f.metrics, { label: "", before: "", after: "" }] }));
  }
  function updateMetricRow(i: number, patch: Partial<CaseStudyMetric>) {
    setForm((f) => ({
      ...f,
      metrics: f.metrics.map((m, idx) => (idx === i ? { ...m, ...patch } : m)),
    }));
  }
  function removeMetricRow(i: number) {
    setForm((f) => ({ ...f, metrics: f.metrics.filter((_, idx) => idx !== i) }));
  }

  const logoInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  if (!isAdmin) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Case Studies</h1>
          <p className="text-sm text-muted-foreground">
            Manage the client case studies shown on the public website.
          </p>
        </div>
        <Button className="gap-1.5" onClick={openCreate}>
          <Plus className="h-4 w-4" /> Case Study
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-48 animate-pulse rounded-2xl border border-border bg-card" />
          ))}
        </div>
      ) : caseStudies.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border py-16">
          <ImagePlus className="h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">No case studies yet.</p>
          <Button size="sm" variant="outline" onClick={openCreate}>
            <Plus className="me-1.5 h-3.5 w-3.5" /> Add your first case study
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {caseStudies.map((cs) => (
            <div
              key={cs.id}
              onClick={() => openEdit(cs)}
              className="flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-border bg-card transition-colors hover:border-primary/40"
            >
              <div className="flex h-32 items-center justify-center overflow-hidden bg-secondary/40">
                {cs.logo_url ? (
                  <img
                    src={cs.logo_url}
                    alt={cs.company_name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <ImagePlus className="h-8 w-8 text-muted-foreground/30" />
                )}
              </div>
              <div className="flex flex-1 flex-col gap-2 p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate font-semibold">{cs.company_name}</p>
                  <Badge variant={cs.published ? "secondary" : "outline"} className="shrink-0">
                    {cs.published ? "Published" : "Draft"}
                  </Badge>
                </div>
                {cs.industry && <p className="text-xs text-muted-foreground">{cs.industry}</p>}
                <p className="line-clamp-2 text-sm text-muted-foreground">{cs.summary}</p>
                <div
                  className="mt-auto flex items-center gap-2 pt-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 gap-1.5"
                    onClick={() => openEdit(cs)}
                  >
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </Button>
                  <Button size="sm" variant="ghost" asChild>
                    <a href={`/case-studies/${cs.slug}`} target="_blank" rel="noreferrer">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setDeleteTarget(cs)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit case study" : "New case study"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Logo */}
            <div className="space-y-1.5">
              <Label>Logo / cover image</Label>
              <div className="flex items-center gap-3">
                <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-xl border border-border bg-secondary/40">
                  {uploadingLogo ? (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  ) : form.logo_url ? (
                    <img src={form.logo_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <ImagePlus className="h-5 w-5 text-muted-foreground/40" />
                  )}
                </div>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleLogoSelect(e.target.files?.[0])}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => logoInputRef.current?.click()}
                >
                  Upload
                </Button>
                {form.logo_url && (
                  <Button type="button" variant="ghost" size="sm" onClick={removeLogo}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Company name</Label>
                <Input
                  value={form.company_name}
                  onChange={(e) => {
                    const v = e.target.value;
                    setForm((f) => ({
                      ...f,
                      company_name: v,
                      slug: editing ? f.slug : slugify(v),
                    }));
                  }}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Slug (URL)</Label>
                <Input
                  value={form.slug}
                  onChange={(e) => setForm((f) => ({ ...f, slug: slugify(e.target.value) }))}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Client name</Label>
                <Input
                  value={form.client_name}
                  onChange={(e) => setForm((f) => ({ ...f, client_name: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Industry</Label>
                <Input
                  value={form.industry}
                  onChange={(e) => setForm((f) => ({ ...f, industry: e.target.value }))}
                  placeholder="e.g. Real Estate"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Summary (shown on the case study card)</Label>
              <Textarea
                rows={2}
                value={form.summary}
                onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label>Challenge</Label>
              <Textarea
                rows={3}
                value={form.challenge}
                onChange={(e) => setForm((f) => ({ ...f, challenge: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Solution</Label>
              <Textarea
                rows={3}
                value={form.solution}
                onChange={(e) => setForm((f) => ({ ...f, solution: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Technologies (comma-separated)</Label>
                <Input
                  value={form.technologies}
                  onChange={(e) => setForm((f) => ({ ...f, technologies: e.target.value }))}
                  placeholder="Supabase, WhatsApp Cloud API"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Services delivered (comma-separated)</Label>
                <Input
                  value={form.services}
                  onChange={(e) => setForm((f) => ({ ...f, services: e.target.value }))}
                  placeholder="WhatsApp Chatbot, Lead Scoring"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Results (one per line)</Label>
              <Textarea
                rows={3}
                value={form.results}
                onChange={(e) => setForm((f) => ({ ...f, results: e.target.value }))}
              />
            </div>

            {/* Metrics */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Before / after metrics</Label>
                <Button type="button" size="sm" variant="outline" onClick={addMetricRow}>
                  <Plus className="me-1 h-3.5 w-3.5" /> Add metric
                </Button>
              </div>
              {form.metrics.map((m, i) => (
                <div key={i} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2">
                  <Input
                    placeholder="Label"
                    value={m.label}
                    onChange={(e) => updateMetricRow(i, { label: e.target.value })}
                  />
                  <Input
                    placeholder="Before"
                    value={m.before}
                    onChange={(e) => updateMetricRow(i, { before: e.target.value })}
                  />
                  <Input
                    placeholder="After"
                    value={m.after}
                    onChange={(e) => updateMetricRow(i, { after: e.target.value })}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeMetricRow(i)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="space-y-1.5">
              <Label>Timeline</Label>
              <Input
                value={form.timeline}
                onChange={(e) => setForm((f) => ({ ...f, timeline: e.target.value }))}
                placeholder="e.g. 6 weeks: Discovery, Design, Build, Launch"
              />
            </div>

            {/* Gallery */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Gallery / screenshots</Label>
                <input
                  ref={galleryInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => handleGallerySelect(e.target.files)}
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => galleryInputRef.current?.click()}
                  disabled={uploadingGallery}
                >
                  {uploadingGallery ? (
                    <Loader2 className="me-1 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <ImagePlus className="me-1 h-3.5 w-3.5" />
                  )}
                  Upload images
                </Button>
              </div>
              {form.gallery_urls.length > 0 && (
                <div className="grid grid-cols-4 gap-2">
                  {form.gallery_urls.map((url) => (
                    <div
                      key={url}
                      className="group relative aspect-square overflow-hidden rounded-lg border border-border"
                    >
                      <img src={url} alt="" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeGalleryImage(url)}
                        className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-background/80 text-foreground opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between rounded-xl border border-border p-3">
              <div>
                <p className="text-sm font-medium">Published</p>
                <p className="text-xs text-muted-foreground">
                  Visible on the public case studies page.
                </p>
              </div>
              <Switch
                checked={form.published}
                onCheckedChange={(v) => setForm((f) => ({ ...f, published: v }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={() => saveMut.mutate()}
              disabled={saveMut.isPending || !form.company_name || !form.summary}
            >
              {saveMut.isPending ? "Saving…" : editing ? "Save changes" : "Create case study"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{deleteTarget?.company_name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the case study from the public site immediately. This can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteTarget && deleteMut.mutate(deleteTarget)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
