// Pure, client-safe helpers that turn a saved CV-builder row into a form's starting values.
// Kept out of lib/actions/cv-builder.ts (a "use server" file) because every export of a "use
// server" module must be an async function — these are plain synchronous value transforms.

function toMonthInputValue(date: Date | null): string {
  return date ? date.toISOString().slice(0, 7) : "";
}

export function experienceFormDefaults(exp?: {
  title: string;
  employer: string;
  location: string | null;
  startDate: Date | null;
  endDate: Date | null;
  current: boolean;
  bullets: string;
}) {
  return {
    title: exp?.title ?? "",
    employer: exp?.employer ?? "",
    location: exp?.location ?? "",
    startDate: toMonthInputValue(exp?.startDate ?? null),
    endDate: toMonthInputValue(exp?.endDate ?? null),
    current: exp?.current ?? false,
    bullets: exp?.bullets ?? "",
  };
}

export function educationFormDefaults(edu?: {
  institution: string;
  qualification: string;
  field: string | null;
  startDate: Date | null;
  endDate: Date | null;
  grade: string | null;
}) {
  return {
    institution: edu?.institution ?? "",
    qualification: edu?.qualification ?? "",
    field: edu?.field ?? "",
    startDate: toMonthInputValue(edu?.startDate ?? null),
    endDate: toMonthInputValue(edu?.endDate ?? null),
    grade: edu?.grade ?? "",
  };
}

export function projectFormDefaults(project?: { name: string; description: string | null; link: string | null }) {
  return {
    name: project?.name ?? "",
    description: project?.description ?? "",
    link: project?.link ?? "",
  };
}
