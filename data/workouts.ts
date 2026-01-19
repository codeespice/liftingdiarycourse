// Data access layer for workouts
// All database queries for workouts MUST go through these helper functions

import { db } from "@/db";
import { workouts } from "@/db/schema";
import { eq, and, gte, lte, desc } from "drizzle-orm";

/**
 * Get all workouts for a user on a specific date
 * SECURITY: Always filters by userId to ensure data isolation
 */
export async function getWorkoutsForUserByDate(userId: string, date: Date) {
  // Create date range for the entire day
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  // Fetch workouts with their exercises and sets using Drizzle relations
  const workoutsWithData = await db.query.workouts.findMany({
    where: and(
      eq(workouts.userId, userId),
      gte(workouts.date, startOfDay),
      lte(workouts.date, endOfDay)
    ),
    with: {
      exercises: {
        orderBy: (exercises, { asc }) => [asc(exercises.orderInWorkout)],
        with: {
          sets: {
            orderBy: (sets, { asc }) => [asc(sets.setNumber)],
          },
        },
      },
    },
    orderBy: [desc(workouts.createdAt)],
  });

  return workoutsWithData;
}

/**
 * Get a specific workout by ID
 * SECURITY: Verifies workout belongs to the user
 */
export async function getWorkoutById(workoutId: string, userId: string) {
  const workout = await db.query.workouts.findFirst({
    where: and(
      eq(workouts.id, workoutId),
      eq(workouts.userId, userId) // CRITICAL: Verify ownership
    ),
    with: {
      exercises: {
        orderBy: (exercises, { asc }) => [asc(exercises.orderInWorkout)],
        with: {
          sets: {
            orderBy: (sets, { asc }) => [asc(sets.setNumber)],
          },
        },
      },
    },
  });

  if (!workout) {
    throw new Error("Workout not found or unauthorized");
  }

  return workout;
}

/**
 * Get all workouts for a user
 * SECURITY: Always filters by userId
 */
export async function getAllWorkoutsForUser(userId: string) {
  const userWorkouts = await db.query.workouts.findMany({
    where: eq(workouts.userId, userId),
    with: {
      exercises: {
        orderBy: (exercises, { asc }) => [asc(exercises.orderInWorkout)],
        with: {
          sets: {
            orderBy: (sets, { asc }) => [asc(sets.setNumber)],
          },
        },
      },
    },
    orderBy: [desc(workouts.date)],
  });

  return userWorkouts;
}

/**
 * Create a new workout for a user
 * SECURITY: userId is set from authenticated user, not from client input
 */
export async function createWorkout(
  userId: string,
  data: {
    name: string;
    date: Date;
    notes?: string;
    durationMinutes?: number;
  }
) {
  const newWorkouts = await db
    .insert(workouts)
    .values({
      userId, // CRITICAL: Set from authenticated user
      name: data.name,
      date: data.date,
      notes: data.notes,
      durationMinutes: data.durationMinutes,
    })
    .returning();

  return newWorkouts[0];
}

/**
 * Update a workout
 * SECURITY: Verifies ownership before updating
 */
export async function updateWorkout(
  workoutId: string,
  userId: string,
  data: {
    name?: string;
    date?: Date;
    notes?: string;
    durationMinutes?: number;
  }
) {
  // First verify the workout belongs to the user
  await getWorkoutById(workoutId, userId);

  const updatedWorkouts = await db
    .update(workouts)
    .set(data)
    .where(
      and(
        eq(workouts.id, workoutId),
        eq(workouts.userId, userId) // CRITICAL: Double-check ownership
      )
    )
    .returning();

  return updatedWorkouts[0];
}

/**
 * Delete a workout
 * SECURITY: Verifies ownership before deleting
 */
export async function deleteWorkout(workoutId: string, userId: string) {
  const deletedWorkouts = await db
    .delete(workouts)
    .where(
      and(
        eq(workouts.id, workoutId),
        eq(workouts.userId, userId) // CRITICAL: Only delete if owned by user
      )
    )
    .returning();

  if (!deletedWorkouts[0]) {
    throw new Error("Workout not found or unauthorized");
  }

  return deletedWorkouts[0];
}
