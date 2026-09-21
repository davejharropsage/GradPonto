"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { userDb } from "@/lib/auth/user";

const goalSchema = z.object({
  target: z.coerce.number().int().min(1, "Target must be at least 1"),
  startDate: z.string().trim().min(1),
  endDate: z.string().trim().min(1),
});

export async function createGoal(formData: FormData) {
  const db = await userDb();
  const parsed = goalSchema.parse(Object.fromEntries(formData));

  await db.goal.create({
    data: {
      target: parsed.target,
      startDate: new Date(parsed.startDate),
      endDate: new Date(parsed.endDate),
    },
  });

  revalidatePath("/goals");
}

export async function deleteGoal(id: string) {
  const db = await userDb();
  await db.goal.delete({ where: { id } });
  revalidatePath("/goals");
}
