export const applicationStatusLabels: Record<string, string> = {
  SAVED: "Saved",
  DRAFTING: "Drafting",
  APPLIED: "Applied",
  IN_REVIEW: "In Review",
  INTERVIEW: "Interview",
  OFFER: "Offer",
  REJECTED: "Rejected",
  WITHDRAWN: "Withdrawn",
};

export const applicationStatuses = Object.keys(applicationStatusLabels);

export const applicationStatusVariants: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  SAVED: "outline",
  DRAFTING: "outline",
  APPLIED: "secondary",
  IN_REVIEW: "secondary",
  INTERVIEW: "default",
  OFFER: "default",
  REJECTED: "destructive",
  WITHDRAWN: "destructive",
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
