"use client";

import { useState } from "react";
import { ApplicationCard } from "./application-card";
import { BulkActionsBar } from "./bulk-actions-bar";
import type { Application, Employer } from "@/generated/prisma/client";

type ApplicationWithEmployer = Application & { employer: Employer | null };

export function ApplicationsGrid({ applications }: { applications: ApplicationWithEmployer[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  function toggleSelect(id: string, checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  return (
    <div>
      <BulkActionsBar selectedIds={[...selected]} onClear={() => setSelected(new Set())} />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {applications.map((application) => (
          <ApplicationCard
            key={application.id}
            application={application}
            selected={selected.has(application.id)}
            onToggleSelect={toggleSelect}
          />
        ))}
      </div>
    </div>
  );
}
