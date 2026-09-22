export const applicationStatusLabels: Record<string, string> = {
  INTERESTED: "Interested",
  NOT_STARTED: "Not Started",
  PREPARING: "Preparing",
  APPLIED: "Applied",
  ONLINE_ASSESSMENT: "Online Assessment",
  VIDEO_INTERVIEW: "Video Interview",
  OFFER: "Offer",
  REJECTED: "Rejected",
  WITHDRAWN: "Withdrawn",
};

// Column order for the Pipeline kanban board.
export const applicationStatuses = [
  "INTERESTED",
  "NOT_STARTED",
  "PREPARING",
  "APPLIED",
  "ONLINE_ASSESSMENT",
  "VIDEO_INTERVIEW",
  "OFFER",
  "REJECTED",
  "WITHDRAWN",
] as const;

export const applicationStatusVariants: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  INTERESTED: "outline",
  NOT_STARTED: "outline",
  PREPARING: "secondary",
  APPLIED: "secondary",
  ONLINE_ASSESSMENT: "default",
  VIDEO_INTERVIEW: "default",
  OFFER: "default",
  REJECTED: "destructive",
  WITHDRAWN: "destructive",
};

// Tailwind classes for a stronger color cue than the plain Badge variants give,
// matching the reference design's colored status pills.
export const applicationStatusColors: Record<string, string> = {
  INTERESTED: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  NOT_STARTED: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  PREPARING: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  APPLIED: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  ONLINE_ASSESSMENT: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300",
  VIDEO_INTERVIEW: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
  OFFER: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  REJECTED: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
  WITHDRAWN: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
};

// Statuses that represent an application still actively in play.
export const openApplicationStatuses = [
  "INTERESTED",
  "NOT_STARTED",
  "PREPARING",
  "APPLIED",
  "ONLINE_ASSESSMENT",
  "VIDEO_INTERVIEW",
] as const;

export const priorityLabels: Record<string, string> = {
  LOW: "Low priority",
  MEDIUM: "Medium priority",
  HIGH: "High priority",
};

export const priorityColors: Record<string, string> = {
  LOW: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  MEDIUM: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  HIGH: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
};

export const priorityDotColors: Record<string, string> = {
  LOW: "bg-slate-400",
  MEDIUM: "bg-amber-500",
  HIGH: "bg-red-500",
};

export const activityTypeLabels: Record<string, string> = {
  INTERVIEW: "Interview",
  TASK: "Task",
  NOTE: "Note",
  FOLLOW_UP: "Follow-up",
  STATUS_CHANGE: "Status Change",
};

export const documentKindLabels: Record<string, string> = {
  CV: "CV",
  COVER_LETTER: "Cover Letter",
};

// The Application Reviewer's modes. "match" (job-specific) is the default, and the one that
// existed before the others — a search-param value that doesn't match one of these falls back to it.
export const reviewModes = ["match", "health", "ats", "cover"] as const;
export type ReviewMode = (typeof reviewModes)[number];

export const reviewModeLabels: Record<ReviewMode, string> = {
  match: "Job Match",
  health: "Health Check",
  ats: "ATS Keywords",
  cover: "Cover Letter",
};

// A small set of tone starting points for AI-generated cover letters. Kept here (plain data, no
// imports) rather than in lib/ai/tailor.ts so client components can show the picker/labels without
// pulling the AI provider code — and the @anthropic-ai/sdk it imports — into the browser bundle.
export interface CoverLetterTemplate {
  key: string;
  label: string;
  /** Appended to the tailoring prompt to steer tone and style. */
  instruction: string;
  /** A one-line example of the opening tone, shown as a preview in the picker. */
  example: string;
}

export const coverLetterTemplates: CoverLetterTemplate[] = [
  {
    key: "formal",
    label: "Formal",
    instruction: "Use a formal, traditional tone: measured language, no contractions, addressed respectfully throughout.",
    example: "I am writing to apply for the position of Graduate Analyst at Northwind Group.",
  },
  {
    key: "direct",
    label: "Direct & confident",
    instruction: "Use a direct, confident tone: short sentences, lead with your strongest qualification, no hedging language.",
    example: "I've spent the last two years building exactly the skills this role needs.",
  },
  {
    key: "story",
    label: "Story-led",
    instruction: "Open with a brief, specific anecdote or moment from the candidate's experience that connects naturally to the role, then build the case from there.",
    example: "The first time I untangled a messy spreadsheet into a working dashboard, I knew data was where I wanted to be.",
  },
  {
    key: "enthusiastic",
    label: "Enthusiastic graduate",
    instruction: "Use a warm, enthusiastic tone appropriate for a graduate just starting out: genuine excitement about the opportunity, without overselling experience the candidate doesn't have.",
    example: "I've been following your work for a while now, and this graduate role is exactly the next step I've been hoping for.",
  },
];

export function coverLetterTemplateLabel(key: string | null | undefined): string | null {
  if (!key) return null;
  return coverLetterTemplates.find((t) => t.key === key)?.label ?? null;
}

// The "needs attention" action prompt shown on the dashboard for a given status.
export const nextActionLabels: Record<string, string> = {
  INTERESTED: "Start application",
  NOT_STARTED: "Start application",
  PREPARING: "Finish application",
  ONLINE_ASSESSMENT: "Complete assessment",
  VIDEO_INTERVIEW: "Prepare for video interview",
  OFFER: "Respond to offer",
};
