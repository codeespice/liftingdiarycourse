"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { createWorkout } from "@/data/workouts";

// Validation schema for creating a workout
const createWorkoutSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  date: z.coerce.date(),
  notes: z.string().max(1000).optional(),
  durationMinutes: z.number().int().min(1).max(600).optional(),
});

export async function createWorkoutAction(input: {
  name: string;
  date: Date;
  notes?: string;
  durationMinutes?: number;
}) {
  // 1. Validate input with Zod
  const validated = createWorkoutSchema.parse(input);

  // 2. Get authenticated user
  const user = await getCurrentUser();

  // 3. Call data helper to perform mutation
  const workout = await createWorkout(user.id, validated);

  // 4. Revalidate affected paths
  revalidatePath("/dashboard");

  return workout;
}
