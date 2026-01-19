"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { updateWorkout } from "@/data/workouts";

// Validation schema for updating a workout
const updateWorkoutSchema = z.object({
  workoutId: z.string().uuid("Invalid workout ID"),
  name: z.string().min(1, "Name is required").max(255).optional(),
  date: z.coerce.date().optional(),
  notes: z.string().max(1000).optional(),
  durationMinutes: z.number().int().min(1).max(600).optional().nullable(),
});

export async function updateWorkoutAction(input: {
  workoutId: string;
  name?: string;
  date?: Date;
  notes?: string;
  durationMinutes?: number | null;
}) {
  // 1. Validate input with Zod
  const validated = updateWorkoutSchema.parse(input);

  // 2. Get authenticated user
  const user = await getCurrentUser();

  // 3. Call data helper to perform mutation
  const { workoutId, ...updateData } = validated;

  // Convert null to undefined for the data helper
  const cleanedData = {
    ...updateData,
    durationMinutes: updateData.durationMinutes ?? undefined,
  };

  const workout = await updateWorkout(workoutId, user.id, cleanedData);

  // 4. Revalidate affected paths
  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/workout/${workoutId}`);

  return workout;
}
