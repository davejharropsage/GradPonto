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

// Each status and priority is shown as a neutral pill with a small coloured dot (see
// components/shared/status-badge.tsx): calm enough for long lists, with the colour still clear.
export const applicationStatusDotColors: Record<string, string> = {
  INTERESTED: "bg-gray-400",
  NOT_STARTED: "bg-gray-400",
  PREPARING: "bg-amber-500",
  APPLIED: "bg-blue-500",
  ONLINE_ASSESSMENT: "bg-indigo-500",
  VIDEO_INTERVIEW: "bg-indigo-500",
  OFFER: "bg-green-500",
  REJECTED: "bg-red-500",
  WITHDRAWN: "bg-gray-500",
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

export const priorityDotColors: Record<string, string> = {
  LOW: "bg-blue-500",
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
