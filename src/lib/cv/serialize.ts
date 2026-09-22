// Pure logic: turns a structured CV (the rows behind the CV builder) into the same kind of plain
// text every other Document already holds in `content`. This is the one thing that keeps the
// builder from causing rework everywhere else — Health Check, Job Match, ATS Keywords, PDF export,
// and AI tailoring all read `content` exactly as they always have, unaware a CV was authored
// section-by-section rather than pasted in as one block. Every builder save re-runs this and
// writes the result into `content` (see lib/actions/cv-builder.ts).
//
// No imports and no server code, so it can be unit-tested directly with `node --test`.

export interface StructuredExperience {
  title: string;
  employer: string;
  location?: string | null;
  startDate?: Date | null;
  endDate?: Date | null;
  current: boolean;
  bullets: string; // one per line
}

export interface StructuredEducation {
  institution: string;
  qualification: string;
  field?: string | null;
  startDate?: Date | null;
  endDate?: Date | null;
  grade?: string | null;
}

export interface StructuredSkill {
  name: string;
}

export interface StructuredProject {
  name: string;
  description?: string | null;
  link?: string | null;
}

export interface StructuredCv {
  headline?: string | null;
  summary?: string | null;
  experiences: StructuredExperience[];
  educations: StructuredEducation[];
  skills: StructuredSkill[];
  projects: StructuredProject[];
}

const MONTH_ABBREVIATIONS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/** "Sep 2024" — a fixed table rather than toLocaleDateString, so the output doesn't depend on
 * the runtime's ICU data (which can render September as "Sept", among other variations). */
function formatMonth(date: Date): string {
  return `${MONTH_ABBREVIATIONS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

/** "Sep 2024 – Present", "Sep 2023 – Jun 2024", "Sep 2023", or "" if there's nothing to show. */
function formatDateRange(start?: Date | null, end?: Date | null, current?: boolean): string {
  const startText = start ? formatMonth(start) : "";
  const endText = current ? "Present" : end ? formatMonth(end) : "";
  if (startText && endText) return `${startText} – ${endText}`;
  return startText || endText;
}

function bulletLines(bullets: string): string[] {
  return bullets
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export function serializeStructuredCv(cv: StructuredCv): string {
  const lines: string[] = [];
  const section = (heading: string) => {
    if (lines.length > 0) lines.push("");
    lines.push(heading);
  };

  if (cv.headline?.trim()) lines.push(cv.headline.trim());
  if (cv.summary?.trim()) {
    if (lines.length) lines.push("");
    lines.push(cv.summary.trim());
  }

  if (cv.experiences.length > 0) {
    section("EXPERIENCE");
    for (const exp of cv.experiences) {
      const place = [exp.title, exp.employer].filter(Boolean).join(", ");
      const withLocation = exp.location ? `${place} — ${exp.location}` : place;
      const range = formatDateRange(exp.startDate, exp.endDate, exp.current);
      lines.push(range ? `${withLocation} (${range})` : withLocation);
      for (const bullet of bulletLines(exp.bullets)) lines.push(`- ${bullet}`);
    }
  }

  if (cv.educations.length > 0) {
    section("EDUCATION");
    for (const edu of cv.educations) {
      const qualification = [edu.qualification, edu.field].filter(Boolean).join(" in ");
      const heading = [qualification, edu.institution].filter(Boolean).join(", ");
      const range = formatDateRange(edu.startDate, edu.endDate, false);
      const detail = [range, edu.grade].filter(Boolean).join(" · ");
      lines.push(detail ? `${heading} (${detail})` : heading);
    }
  }

  if (cv.skills.length > 0) {
    section("SKILLS");
    lines.push(cv.skills.map((skill) => skill.name).join(", "));
  }

  if (cv.projects.length > 0) {
    section("PROJECTS");
    for (const project of cv.projects) {
      lines.push(project.name);
      if (project.description?.trim()) lines.push(project.description.trim());
      if (project.link?.trim()) lines.push(project.link.trim());
    }
  }

  return lines.join("\n").trim();
}
