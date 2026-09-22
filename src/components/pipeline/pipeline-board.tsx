"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  pointerWithin,
  rectIntersection,
  useDroppable,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragStartEvent,
  type KeyboardCoordinateGetter,
} from "@dnd-kit/core";
import { toast } from "sonner";
import { PipelineCard, PipelineCardBody, type ApplicationWithEmployer } from "./pipeline-card";
import {
  PipelineFilters,
  defaultPipelineFilters,
  matchesPipelineFilters,
  type PipelineFilterState,
} from "./pipeline-filters";
import { updateApplicationStatus } from "@/lib/actions/applications";
import { applicationStatuses, applicationStatusLabels } from "@/lib/labels";
import { cn } from "@/lib/utils";

type Groups = Record<string, ApplicationWithEmployer[]>;

const columnDotColors: Record<string, string> = {
  INTERESTED: "bg-slate-400",
  NOT_STARTED: "bg-slate-300",
  PREPARING: "bg-amber-500",
  APPLIED: "bg-blue-500",
  ONLINE_ASSESSMENT: "bg-purple-500",
  VIDEO_INTERVIEW: "bg-sky-500",
  OFFER: "bg-emerald-500",
  REJECTED: "bg-red-500",
  WITHDRAWN: "bg-gray-400",
};

// Columns are large drop zones, so "where is the pointer" is the natural test; the rectangle test
// covers keyboard dragging, where there is no pointer.
const detectColumn: CollisionDetection = (args) => {
  const underPointer = pointerWithin(args);
  return underPointer.length > 0 ? underPointer : rectIntersection(args);
};

// Keyboard dragging: Left/Right jump the card to the neighbouring column (the default moves in tiny steps).
const columnKeyboardCoordinates: KeyboardCoordinateGetter = (event, { context, currentCoordinates }) => {
  const { active, droppableRects, droppableContainers, collisionRect } = context;
  if (event.code !== "ArrowRight" && event.code !== "ArrowLeft") return undefined;
  if (!active || !collisionRect) return undefined;
  event.preventDefault();

  const columns = droppableContainers
    .getEnabled()
    .map((container) => ({ id: container.id, rect: droppableRects.get(container.id) }))
    .filter((column): column is { id: typeof column.id; rect: NonNullable<typeof column.rect> } => Boolean(column.rect))
    .sort((a, b) => a.rect.left - b.rect.left);
  if (columns.length === 0) return undefined;

  const centre = collisionRect.left + collisionRect.width / 2;
  let current = columns.findIndex((c) => centre >= c.rect.left && centre <= c.rect.left + c.rect.width);
  if (current === -1) current = 0;
  const next = Math.min(columns.length - 1, Math.max(0, current + (event.code === "ArrowRight" ? 1 : -1)));
  const target = columns[next].rect;

  return {
    x: currentCoordinates.x + (target.left + 12 - collisionRect.left),
    y: currentCoordinates.y + (target.top + 56 - collisionRect.top),
  };
};

function Column({ status, items, activeId }: { status: string; items: ApplicationWithEmployer[]; activeId: string | null }) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      data-status={status}
      className={cn(
        "flex w-72 shrink-0 flex-col rounded-lg border bg-muted/30 p-3 transition-colors",
        isOver && activeId && "border-primary bg-accent"
      )}
    >
      <div className="mb-3 flex items-center gap-2 px-1">
        <span className={cn("h-2 w-2 rounded-full", columnDotColors[status])} />
        <h3 className="font-sans text-sm font-semibold [font-stretch:100%]">{applicationStatusLabels[status]}</h3>
        <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{items.length}</span>
      </div>

      <div className="flex min-h-24 flex-1 flex-col gap-2">
        {items.length === 0 ? (
          <div
            className={cn(
              "flex flex-1 items-center justify-center rounded-md border border-dashed py-6 text-xs text-muted-foreground",
              isOver && activeId && "border-primary text-foreground"
            )}
          >
            Drop here
          </div>
        ) : (
          items.map((application) => <PipelineCard key={application.id} application={application} />)
        )}
      </div>
    </div>
  );
}

export function PipelineBoard({ initialGroups }: { initialGroups: Groups }) {
  const [groups, setGroups] = useState(initialGroups);
  const [active, setActive] = useState<ApplicationWithEmployer | null>(null);
  const [filters, setFilters] = useState<PipelineFilterState>(defaultPipelineFilters);
  const [, startTransition] = useTransition();
  const router = useRouter();

  const employers = useMemo(() => {
    const seen = new Map<string, string>();
    for (const application of Object.values(groups).flat()) {
      if (application.employer) seen.set(application.employer.id, application.employer.name);
    }
    return Array.from(seen, ([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
  }, [groups]);

  const sensors = useSensors(
    // A small movement threshold, so a plain click on the company name still opens the application.
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    // On touch screens: press and hold to pick a card up, so swiping still scrolls the board.
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: columnKeyboardCoordinates })
  );

  const statusOf = (id: string) => Object.keys(groups).find((key) => groups[key].some((app) => app.id === id));

  function onDragStart(event: DragStartEvent) {
    const application = event.active.data.current?.application as ApplicationWithEmployer | undefined;
    setActive(application ?? null);
  }

  function onDragEnd(event: DragEndEvent) {
    setActive(null);
    const id = String(event.active.id);
    const target = event.over ? String(event.over.id) : null;
    const from = statusOf(id);
    if (!target || !from || target === from || !applicationStatuses.includes(target as never)) return;

    // Move it on screen straight away; put it back if saving fails.
    const before = groups;
    setGroups((prev) => {
      const moved = prev[from].find((app) => app.id === id);
      if (!moved) return prev;
      return {
        ...prev,
        [from]: prev[from].filter((app) => app.id !== id),
        [target]: [{ ...moved, status: target as ApplicationWithEmployer["status"] }, ...(prev[target] ?? [])],
      };
    });

    startTransition(async () => {
      try {
        await updateApplicationStatus(id, target);
        router.refresh();
      } catch {
        setGroups(before);
        toast.error("Couldn't move that application. It's back where it was.");
      }
    });
  }

  const label = (id: string | number) => {
    const app = Object.values(groups).flat().find((a) => a.id === String(id));
    return app ? `${app.employer?.name ?? "Application"}, ${app.title}` : "application";
  };
  const columnName = (id: string | number) => applicationStatusLabels[String(id)] ?? String(id);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={detectColumn}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragCancel={() => setActive(null)}
      accessibility={{
        screenReaderInstructions: {
          draggable:
            "To pick up an application, press Space. Use the left and right arrow keys to move it between stages, then press Space to drop it, or Escape to cancel.",
        },
        announcements: {
          onDragStart: ({ active }) => `Picked up ${label(active.id)}.`,
          onDragOver: ({ over }) => (over ? `Over the ${columnName(over.id)} stage.` : "Not over a stage."),
          onDragEnd: ({ over }) => (over ? `Dropped in the ${columnName(over.id)} stage.` : "Dropped. Nothing changed."),
          onDragCancel: () => "Cancelled. Nothing changed.",
        },
      }}
    >
      <PipelineFilters filters={filters} onChange={setFilters} employers={employers} />

      <div className="flex gap-4 overflow-x-auto pb-4" role="list" aria-label="Application stages">
        {applicationStatuses.map((status) => (
          <Column
            key={status}
            status={status}
            items={(groups[status] ?? []).filter((application) => matchesPipelineFilters(application, filters))}
            activeId={active?.id ?? null}
          />
        ))}
      </div>

      <DragOverlay dropAnimation={{ duration: 180, easing: "cubic-bezier(0.2, 0, 0, 1)" }}>
        {active ? (
          <div className="w-[15.5rem]">
            <PipelineCardBody application={active} lifted />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
