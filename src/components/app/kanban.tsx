import { type ReactNode, useState } from "react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  DragOverlay,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";

export interface KanbanColumn {
  key: string;
  label: string;
}

interface KanbanProps<T> {
  columns: KanbanColumn[];
  items: T[];
  getId: (item: T) => string;
  getColumn: (item: T) => string;
  renderCard: (item: T) => ReactNode;
  onMove: (itemId: string, toColumn: string) => void;
  columnFooter?: (columnKey: string, items: T[]) => ReactNode;
}

function DraggableCard({ id, children }: { id: string; children: ReactNode }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id });
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`cursor-grab touch-none rounded-lg border border-border bg-background p-3 active:cursor-grabbing ${
        isDragging ? "opacity-40" : ""
      }`}
    >
      {children}
    </div>
  );
}

function DroppableColumn({
  column,
  count,
  children,
  footer,
}: {
  column: KanbanColumn;
  count: number;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.key });
  return (
    <div className="flex w-72 shrink-0 flex-col rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
        <span className="text-sm font-semibold">{column.label}</span>
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{count}</span>
      </div>
      <div
        ref={setNodeRef}
        className={`flex min-h-[120px] flex-1 flex-col gap-2 p-3 transition-colors ${
          isOver ? "bg-primary/5" : ""
        }`}
      >
        {children}
      </div>
      {footer && <div className="border-t border-border px-3 py-2">{footer}</div>}
    </div>
  );
}

export function KanbanBoard<T>({
  columns,
  items,
  getId,
  getColumn,
  renderCard,
  onMove,
  columnFooter,
}: KanbanProps<T>) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const activeItem = items.find((i) => getId(i) === activeId) ?? null;

  function onDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
  }
  function onDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;
    const item = items.find((i) => getId(i) === String(active.id));
    if (!item) return;
    const toColumn = String(over.id);
    if (getColumn(item) !== toColumn) onMove(String(active.id), toColumn);
  }

  return (
    <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((col) => {
          const colItems = items.filter((i) => getColumn(i) === col.key);
          return (
            <DroppableColumn
              key={col.key}
              column={col}
              count={colItems.length}
              footer={columnFooter?.(col.key, colItems)}
            >
              {colItems.map((item) => (
                <DraggableCard key={getId(item)} id={getId(item)}>
                  {renderCard(item)}
                </DraggableCard>
              ))}
            </DroppableColumn>
          );
        })}
      </div>
      <DragOverlay>
        {activeItem ? (
          <div className="w-64 rotate-2 rounded-lg border border-primary bg-background p-3 shadow-xl">
            {renderCard(activeItem)}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
