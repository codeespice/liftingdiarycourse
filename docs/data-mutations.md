# Data Mutations Standards

This document defines the CRITICAL standards for all data mutations (create, update, delete) in this project.

## Data Mutations - /data Directory Helpers

**CRITICAL RULE: ALL database mutations MUST be done via helper functions in the `/data` directory.**

### Why /data Helpers?

1. **Centralization**: All database logic in one place
2. **Reusability**: Same mutation can be used across multiple server actions
3. **Testability**: Easy to test database logic in isolation
4. **Security**: Enforce authorization rules in one place
5. **Type Safety**: Drizzle ORM provides TypeScript types for all operations

### Helper Function Pattern

```typescript
// data/workouts.ts
import { db } from "@/db";
import { workouts } from "@/db/schema";
import { eq, and } from "drizzle-orm";

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
  const updatedWorkouts = await db
    .update(workouts)
    .set(data)
    .where(
      and(
        eq(workouts.id, workoutId),
        eq(workouts.userId, userId) // CRITICAL: Verify ownership
      )
    )
    .returning();

  if (!updatedWorkouts[0]) {
    throw new Error("Workout not found or unauthorized");
  }

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
```

## Server Actions - Colocated actions.ts Files

**CRITICAL RULE: ALL data mutations MUST be triggered via Server Actions defined in colocated `actions.ts` files.**

### File Structure

```
app/
├── dashboard/
│   ├── page.tsx           # Server Component
│   ├── dashboard-client.tsx  # Client Component
│   └── actions.ts         # Server Actions for this route
├── workouts/
│   ├── [id]/
│   │   ├── page.tsx
│   │   ├── workout-client.tsx
│   │   └── actions.ts     # Actions for single workout
│   ├── page.tsx
│   └── actions.ts         # Actions for workout list
```

### Server Action Pattern

```typescript
// app/dashboard/actions.ts
"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { createWorkout, updateWorkout, deleteWorkout } from "@/data/workouts";

// ===========================
// VALIDATION SCHEMAS (Zod)
// ===========================

const createWorkoutSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  date: z.coerce.date(),
  notes: z.string().max(1000).optional(),
  durationMinutes: z.number().int().min(1).max(600).optional(),
});

const updateWorkoutSchema = z.object({
  workoutId: z.string().uuid("Invalid workout ID"),
  name: z.string().min(1).max(255).optional(),
  date: z.coerce.date().optional(),
  notes: z.string().max(1000).optional(),
  durationMinutes: z.number().int().min(1).max(600).optional(),
});

const deleteWorkoutSchema = z.object({
  workoutId: z.string().uuid("Invalid workout ID"),
});

// ===========================
// SERVER ACTIONS
// ===========================

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

export async function updateWorkoutAction(input: {
  workoutId: string;
  name?: string;
  date?: Date;
  notes?: string;
  durationMinutes?: number;
}) {
  // 1. Validate input with Zod
  const validated = updateWorkoutSchema.parse(input);

  // 2. Get authenticated user
  const user = await getCurrentUser();

  // 3. Call data helper to perform mutation
  const { workoutId, ...updateData } = validated;
  const workout = await updateWorkout(workoutId, user.id, updateData);

  // 4. Revalidate affected paths
  revalidatePath("/dashboard");
  revalidatePath(`/workouts/${workoutId}`);

  return workout;
}

export async function deleteWorkoutAction(input: { workoutId: string }) {
  // 1. Validate input with Zod
  const validated = deleteWorkoutSchema.parse(input);

  // 2. Get authenticated user
  const user = await getCurrentUser();

  // 3. Call data helper to perform mutation
  const workout = await deleteWorkout(validated.workoutId, user.id);

  // 4. Revalidate affected paths
  revalidatePath("/dashboard");

  return workout;
}
```

## Server Action Parameters - TYPED, NOT FormData

**CRITICAL RULE: Server action parameters MUST be typed objects. NEVER use `FormData` as a parameter type.**

### Why Typed Parameters?

1. **Type Safety**: TypeScript catches errors at compile time
2. **Validation**: Zod can validate typed objects directly
3. **Developer Experience**: Better autocomplete and IntelliSense
4. **Clarity**: Clear contract between client and server

### Correct: Typed Parameters

```typescript
// ✅ CORRECT - Typed parameter object
export async function createWorkoutAction(input: {
  name: string;
  date: Date;
  notes?: string;
  durationMinutes?: number;
}) {
  const validated = createWorkoutSchema.parse(input);
  // ...
}

// Usage in client component
const workout = await createWorkoutAction({
  name: "Morning Workout",
  date: new Date(),
  notes: "Felt great today",
});
```

### Incorrect: FormData Parameter

```typescript
// ❌ WRONG - DO NOT USE FormData
export async function createWorkoutAction(formData: FormData) {
  // This loses type safety and makes validation harder
  const name = formData.get("name") as string;
  const date = new Date(formData.get("date") as string);
  // ...
}
```

## Zod Validation - MANDATORY

**CRITICAL RULE: ALL server actions MUST validate their arguments using Zod.**

### Why Zod Validation?

1. **Security**: Prevents malicious input from reaching the database
2. **Type Safety**: Runtime validation matches TypeScript types
3. **Error Messages**: Clear, user-friendly validation errors
4. **Schema Reuse**: Schemas can be shared between client and server

### Validation Pattern

```typescript
// 1. Define schema at the top of the file
const createExerciseSchema = z.object({
  workoutId: z.string().uuid("Invalid workout ID"),
  exerciseName: z.string().min(1, "Exercise name is required").max(255),
  exerciseType: z.enum(["compound", "isolation"]).optional(),
  orderInWorkout: z.number().int().min(1),
  notes: z.string().max(1000).optional(),
});

// 2. Use .parse() for validation (throws on invalid input)
export async function createExerciseAction(input: {
  workoutId: string;
  exerciseName: string;
  exerciseType?: "compound" | "isolation";
  orderInWorkout: number;
  notes?: string;
}) {
  // Throws ZodError if validation fails
  const validated = createExerciseSchema.parse(input);

  // validated is now fully typed and safe to use
  const exercise = await createExercise(userId, validated);
  return exercise;
}
```

### Handling Validation Errors

```typescript
import { z } from "zod";

export async function createWorkoutAction(input: {
  name: string;
  date: Date;
}) {
  try {
    const validated = createWorkoutSchema.parse(input);
    const workout = await createWorkout(userId, validated);
    return { success: true, data: workout };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.errors.map((e) => ({
          field: e.path.join("."),
          message: e.message,
        })),
      };
    }
    throw error;
  }
}
```

## Using Server Actions in Client Components

```typescript
// app/dashboard/dashboard-client.tsx
"use client";

import { useState } from "react";
import { createWorkoutAction, deleteWorkoutAction } from "./actions";

export function DashboardClient() {
  const [isLoading, setIsLoading] = useState(false);

  async function handleCreateWorkout() {
    setIsLoading(true);
    try {
      const workout = await createWorkoutAction({
        name: "New Workout",
        date: new Date(),
      });
      console.log("Created workout:", workout);
    } catch (error) {
      console.error("Failed to create workout:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDeleteWorkout(workoutId: string) {
    setIsLoading(true);
    try {
      await deleteWorkoutAction({ workoutId });
      console.log("Deleted workout");
    } catch (error) {
      console.error("Failed to delete workout:", error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div>
      <button onClick={handleCreateWorkout} disabled={isLoading}>
        Create Workout
      </button>
    </div>
  );
}
```

## Redirects - Client-Side Only

**CRITICAL RULE: NEVER use `redirect()` from `next/navigation` inside server actions. Redirects MUST be performed client-side after the server action resolves.**

### Why Client-Side Redirects?

1. **Control Flow**: Client maintains control over navigation timing
2. **Error Handling**: Client can handle errors before redirecting
3. **Loading States**: Client can manage loading UI properly
4. **Flexibility**: Different callers may need different redirect destinations

### Correct: Client-Side Redirect

```typescript
// ✅ CORRECT - Redirect on client after action completes
"use client";

import { useRouter } from "next/navigation";
import { createWorkoutAction } from "./actions";

function CreateWorkoutForm() {
  const router = useRouter();

  async function handleSubmit(data: FormData) {
    try {
      await createWorkoutAction({
        name: data.get("name") as string,
        date: new Date(),
      });
      // Redirect AFTER action succeeds
      router.push("/dashboard");
    } catch (error) {
      // Handle error - no redirect on failure
      console.error("Failed to create workout:", error);
    }
  }
}
```

### Incorrect: Server-Side Redirect

```typescript
// ❌ WRONG - DO NOT use redirect() in server actions
"use server";

import { redirect } from "next/navigation";

export async function createWorkoutAction(input: { name: string; date: Date }) {
  const validated = createWorkoutSchema.parse(input);
  const user = await getCurrentUser();
  const workout = await createWorkout(user.id, validated);
  revalidatePath("/dashboard");

  // ❌ NEVER do this - redirect should be client-side
  redirect("/dashboard");
}
```

## Complete Example: Exercise CRUD

### Data Helper (data/exercises.ts)

```typescript
// data/exercises.ts
import { db } from "@/db";
import { exercises, workouts } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function createExercise(
  userId: string,
  data: {
    workoutId: string;
    exerciseName: string;
    exerciseType?: string;
    orderInWorkout: number;
    notes?: string;
  }
) {
  // Verify workout belongs to user before adding exercise
  const workout = await db.query.workouts.findFirst({
    where: and(
      eq(workouts.id, data.workoutId),
      eq(workouts.userId, userId)
    ),
  });

  if (!workout) {
    throw new Error("Workout not found or unauthorized");
  }

  const newExercises = await db
    .insert(exercises)
    .values({
      workoutId: data.workoutId,
      exerciseName: data.exerciseName,
      exerciseType: data.exerciseType,
      orderInWorkout: data.orderInWorkout,
      notes: data.notes,
    })
    .returning();

  return newExercises[0];
}
```

### Server Action (app/workouts/[id]/actions.ts)

```typescript
// app/workouts/[id]/actions.ts
"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { createExercise } from "@/data/exercises";

const addExerciseSchema = z.object({
  workoutId: z.string().uuid(),
  exerciseName: z.string().min(1).max(255),
  exerciseType: z.enum(["compound", "isolation"]).optional(),
  orderInWorkout: z.number().int().min(1),
  notes: z.string().max(1000).optional(),
});

export async function addExerciseAction(input: {
  workoutId: string;
  exerciseName: string;
  exerciseType?: "compound" | "isolation";
  orderInWorkout: number;
  notes?: string;
}) {
  const validated = addExerciseSchema.parse(input);
  const user = await getCurrentUser();
  const exercise = await createExercise(user.id, validated);
  revalidatePath(`/workouts/${validated.workoutId}`);
  return exercise;
}
```

## Summary - Non-Negotiable Rules

1. **Data Mutations**: ONLY via helper functions in `/data` directory
2. **Server Actions**: Colocated in `actions.ts` files next to the page
3. **Parameters**: MUST be typed objects - NEVER use `FormData`
4. **Validation**: ALL server actions MUST validate with Zod
5. **Security**: Always verify user ownership before mutations
6. **Redirects**: NEVER use `redirect()` in server actions - always redirect client-side

## Violations

If you see any of the following, it is a **CRITICAL VIOLATION**:

- ❌ Database mutations directly in server actions (not via /data helpers)
- ❌ Server actions in random files (not in colocated actions.ts)
- ❌ `FormData` as a server action parameter type
- ❌ Server actions without Zod validation
- ❌ Missing userId verification in mutations
- ❌ Using `redirect()` inside server actions

**All violations must be corrected immediately.**
