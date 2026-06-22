import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchStaffNotes,
  createStaffNote,
  updateStaffNote,
  deleteStaffNote,
  type StaffNote,
} from "@/lib/notes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Plus, Trash2, StickyNote, ListTodo, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/notes")({
  component: NotesPage,
});

function NotesPage() {
  const qc = useQueryClient();
  const { data: items = [], isLoading } = useQuery({
    queryKey: ["staff-notes"],
    queryFn: fetchStaffNotes,
  });

  const [todoTitle, setTodoTitle] = useState("");
  const [todoDue, setTodoDue] = useState("");
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");

  const createMut = useMutation({
    mutationFn: createStaffNote,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["staff-notes"] }),
    onError: () => toast.error("Couldn't save — try again"),
  });
  const updateMut = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<StaffNote> }) =>
      updateStaffNote(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["staff-notes"] }),
  });
  const deleteMut = useMutation({
    mutationFn: deleteStaffNote,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["staff-notes"] }),
  });

  const todos = items.filter((i) => i.kind === "TODO");
  const notes = items.filter((i) => i.kind === "NOTE");
  const openTodos = todos.filter((t) => !t.is_done);
  const doneTodos = todos.filter((t) => t.is_done);

  function handleAddTodo(e: React.FormEvent) {
    e.preventDefault();
    if (!todoTitle.trim()) return;
    createMut.mutate({ kind: "TODO", title: todoTitle.trim(), due_date: todoDue || null });
    setTodoTitle("");
    setTodoDue("");
  }

  function handleAddNote(e: React.FormEvent) {
    e.preventDefault();
    if (!noteTitle.trim()) return;
    createMut.mutate({ kind: "NOTE", title: noteTitle.trim(), content: noteContent || null });
    setNoteTitle("");
    setNoteContent("");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Notes & Tasks</h1>
        <p className="text-sm text-muted-foreground">
          Your personal space — only you can see this.
        </p>
      </div>

      <Tabs defaultValue="todo">
        <TabsList>
          <TabsTrigger value="todo" className="gap-1.5">
            <ListTodo className="h-3.5 w-3.5" /> To-Do
          </TabsTrigger>
          <TabsTrigger value="notes" className="gap-1.5">
            <StickyNote className="h-3.5 w-3.5" /> Notes
          </TabsTrigger>
        </TabsList>

        {/* To-Do */}
        <TabsContent value="todo" className="space-y-4">
          <form
            onSubmit={handleAddTodo}
            className="flex flex-wrap items-end gap-2 rounded-2xl border border-border bg-card p-4"
          >
            <div className="min-w-[200px] flex-1 space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">New task</label>
              <Input
                value={todoTitle}
                onChange={(e) => setTodoTitle(e.target.value)}
                placeholder="Follow up with Assiut Real Estate…"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Due date</label>
              <Input
                type="date"
                value={todoDue}
                onChange={(e) => setTodoDue(e.target.value)}
                className="w-36"
              />
            </div>
            <Button type="submit" disabled={createMut.isPending} className="gap-1.5">
              <Plus className="h-4 w-4" /> Add
            </Button>
          </form>

          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-12 animate-pulse rounded-xl bg-secondary" />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {openTodos.length === 0 && doneTodos.length === 0 && (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Nothing on your list — add your first task above.
                </p>
              )}
              {openTodos.map((t) => (
                <TodoRow
                  key={t.id}
                  todo={t}
                  onToggle={updateMut.mutate}
                  onDelete={deleteMut.mutate}
                />
              ))}
              {doneTodos.length > 0 && (
                <>
                  <p className="pt-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground/60">
                    Completed
                  </p>
                  {doneTodos.map((t) => (
                    <TodoRow
                      key={t.id}
                      todo={t}
                      onToggle={updateMut.mutate}
                      onDelete={deleteMut.mutate}
                    />
                  ))}
                </>
              )}
            </div>
          )}
        </TabsContent>

        {/* Notes */}
        <TabsContent value="notes" className="space-y-4">
          <form
            onSubmit={handleAddNote}
            className="space-y-3 rounded-2xl border border-border bg-card p-4"
          >
            <Input
              value={noteTitle}
              onChange={(e) => setNoteTitle(e.target.value)}
              placeholder="Note title…"
            />
            <Textarea
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              placeholder="Write something…"
              rows={3}
            />
            <Button type="submit" disabled={createMut.isPending} className="gap-1.5">
              <Plus className="h-4 w-4" /> Add note
            </Button>
          </form>

          {isLoading ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="h-28 animate-pulse rounded-2xl bg-secondary" />
              ))}
            </div>
          ) : notes.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No notes yet.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {notes.map((n) => (
                <div
                  key={n.id}
                  className="group relative rounded-2xl border border-border bg-card p-4"
                >
                  <p className="font-medium">{n.title}</p>
                  {n.content && (
                    <p className="mt-1.5 whitespace-pre-line text-sm text-muted-foreground">
                      {n.content}
                    </p>
                  )}
                  <button
                    onClick={() => deleteMut.mutate(n.id)}
                    className="absolute right-3 top-3 text-muted-foreground/50 opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function TodoRow({
  todo,
  onToggle,
  onDelete,
}: {
  todo: StaffNote;
  onToggle: (v: { id: string; patch: Partial<StaffNote> }) => void;
  onDelete: (id: string) => void;
}) {
  const overdue =
    todo.due_date && !todo.is_done && new Date(todo.due_date) < new Date(new Date().toDateString());
  return (
    <div className="group flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
      <Checkbox
        checked={todo.is_done}
        onCheckedChange={(v) => onToggle({ id: todo.id, patch: { is_done: !!v } })}
      />
      <span className={cn("flex-1 text-sm", todo.is_done && "text-muted-foreground line-through")}>
        {todo.title}
      </span>
      {todo.due_date && (
        <span
          className={cn(
            "flex items-center gap-1 text-xs",
            overdue ? "text-destructive" : "text-muted-foreground",
          )}
        >
          <Calendar className="h-3 w-3" /> {todo.due_date}
        </span>
      )}
      <button
        onClick={() => onDelete(todo.id)}
        className="text-muted-foreground/50 opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
