import { z } from "zod";

export const employerSchema = z.object({
  name: z.string().trim().min(1, "Employer name is required"),
  website: z.string().trim().optional().or(z.literal("")),
  industry: z.string().trim().optional().or(z.literal("")),
  notes: z.string().trim().optional().or(z.literal("")),
});

export type EmployerInput = z.infer<typeof employerSchema>;

const applicationStatusEnum = z.enum([
  "INTERESTED",
  "NOT_STARTED",
  "PREPARING",
  "APPLIED",
  "ONLINE_ASSESSMENT",
  "VIDEO_INTERVIEW",
  "OFFER",
  "REJECTED",
  "WITHDRAWN",
]);

const priorityEnum = z.enum(["LOW", "MEDIUM", "HIGH"]);

export const applicationSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  company: z.string().trim().min(1, "Company is required"),
  location: z.string().trim().optional().or(z.literal("")),
  jobUrl: z.string().trim().optional().or(z.literal("")),
  description: z.string().trim().optional().or(z.literal("")),
  source: z.string().trim().optional().or(z.literal("")),
  salary: z.string().trim().optional().or(z.literal("")),
  deadline: z.string().trim().optional().or(z.literal("")),
  status: applicationStatusEnum,
  priority: priorityEnum,
  notes: z.string().trim().optional().or(z.literal("")),
});

export type ApplicationInput = z.infer<typeof applicationSchema>;

export const activitySchema = z.object({
  type: z.enum(["INTERVIEW", "TASK", "NOTE", "FOLLOW_UP", "STATUS_CHANGE"]),
  subject: z.string().trim().min(1, "Subject is required"),
  notes: z.string().trim().optional().or(z.literal("")),
  dueDate: z.string().trim().optional().or(z.literal("")),
  applicationId: z.string().trim().min(1),
});

export type ActivityInput = z.infer<typeof activitySchema>;

export const documentSchema = z.object({
  content: z.string(),
});

export type DocumentInput = z.infer<typeof documentSchema>;

export const signupSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.string().trim().email("Enter a valid email"),
  plan: z.enum(["FREE", "PRO"]),
  utmSource: z.string().trim().optional().or(z.literal("")),
  utmMedium: z.string().trim().optional().or(z.literal("")),
  utmCampaign: z.string().trim().optional().or(z.literal("")),
});

export type SignupInput = z.infer<typeof signupSchema>;

export const profileSchema = z.object({
  name: z.string().trim().optional().or(z.literal("")),
});

export type ProfileInput = z.infer<typeof profileSchema>;
