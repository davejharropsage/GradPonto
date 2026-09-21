"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { upsertEmployerId } from "@/lib/actions/applications";
import { isRateLimitedKey } from "@/lib/auth/rate-limit";
import { requireRegisteredUser, userDb } from "@/lib/auth/user";

// The listing comes back from the browser, so it is validated like any other form input.
// (It only ever creates a record in the user's OWN pipeline, so a forged listing can't hurt anyone else.)
const listingSchema = z.object({
  title: z.string().trim().min(1).max(200),
  employer: z.string().trim().min(1).max(120),
  location: z.string().trim().max(120).default(""),
  url: z
    .string()
    .trim()
    .max(2000)
    .refine((value) => {
      try {
        const protocol = new URL(value).protocol;
        return protocol === "https:" || protocol === "http:";
      } catch {
        return false;
      }
    }, "That link isn't a valid web address."),
  snippet: z.string().trim().max(2000).default(""),
  salary: z.string().trim().max(60).nullable().default(null),
  postedDate: z.string().trim().max(40).nullable().default(null),
});

export type AddListingInput = z.input<typeof listingSchema>;
export type AddListingResult = { ok: true; id: string; existed: boolean } | { ok: false; error: string };

/** Adds a search result to the signed-in user's pipeline (as an application in "Interested"). */
export async function addListingToPipeline(input: AddListingInput): Promise<AddListingResult> {
  const user = await requireRegisteredUser();

  if (isRateLimitedKey(`add-listing:${user.id}`, 100, 60 * 60 * 1000)) {
    return { ok: false, error: "You've added a lot of listings this hour. Please try again a little later." };
  }

  const parsed = listingSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "That listing couldn't be added." };
  const listing = parsed.data;

  const db = await userDb();

  // Adding the same listing twice would clutter the pipeline, so return the existing one.
  const existing = await db.application.findFirst({ where: { jobUrl: listing.url }, select: { id: true } });
  if (existing) return { ok: true, id: existing.id, existed: true };

  const employerId = await upsertEmployerId(listing.employer);
  const posted = listing.postedDate && !isNaN(new Date(listing.postedDate).getTime())
    ? ` Advertised on ${new Date(listing.postedDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}.`
    : "";

  const application = await db.application.create({
    data: {
      title: listing.title,
      location: listing.location || null,
      jobUrl: listing.url,
      description: listing.snippet || null,
      source: "Adzuna",
      salary: listing.salary,
      status: "INTERESTED",
      employerId,
      notes: `Added from job search.${posted} The description above is the short summary from the advert; open the listing for the full text.`,
    },
    select: { id: true },
  });

  revalidatePath("/applications");
  revalidatePath("/pipeline");
  revalidatePath("/");
  return { ok: true, id: application.id, existed: false };
}
