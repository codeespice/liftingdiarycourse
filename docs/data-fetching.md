# Data Fetching Standards

This document defines the CRITICAL standards for all data fetching and database operations in this project.

## Data Fetching - Server Components ONLY

**CRITICAL RULE: ALL data fetching in this application MUST be done via Next.js Server Components.**

### What This Means

- **ONLY fetch data in Server Components** (components without `"use client"` directive)
- **ABSOLUTELY NO data fetching in:**
  - Route handlers (`app/api/**/route.ts`)
  - Client components (`"use client"`)
  - Any other methods (middleware, edge functions, etc.)

### Why Server Components Only?

1. **Performance**: Data fetching happens on the server, closer to the database
2. **Security**: Database credentials and queries never exposed to the client
3. **SEO**: Content is server-rendered and immediately available
4. **Simplified Architecture**: No need for API routes that just proxy database queries

### Server Component Data Fetching Pattern

```typescript
// app/dashboard/page.tsx (Server Component - NO "use client")
import { getWorkoutsForUser } from "@/data/workouts";
import { getCurrentUser } from "@/data/users";

export default async function DashboardPage() {
  // Fetch data directly in the server component
  const user = await getCurrentUser();
  const workouts = await getWorkoutsForUser(user.id);

  return (
    <div>
      {/* Render data */}
      {workouts.map((workout) => (
        <WorkoutCard key={workout.id} workout={workout} />
      ))}
    </div>
  );
}
```

### When You Need Client Interactivity

If a component needs client-side interactivity (state, events, effects):

1. **Fetch data in the Server Component (parent)**
2. **Pass data as props to Client Components (children)**

```typescript
// app/dashboard/page.tsx (Server Component)
import { getWorkoutsForUser } from "@/data/workouts";
import { WorkoutList } from "@/components/workout-list";

export default async function DashboardPage() {
  const workouts = await getWorkoutsForUser(userId);

  // Pass data to client component
  return <WorkoutList workouts={workouts} />;
}

// components/workout-list.tsx (Client Component)
"use client";

export function WorkoutList({ workouts }) {
  const [selected, setSelected] = useState(null);
  // Client-side interactivity here
  return (/* ... */);
}
```

## Database Queries - /data Directory Helpers

**CRITICAL RULE: ALL database queries MUST be done via helper functions in the `/data` directory.**

### Directory Structure

```
/data
  ├── users.ts       # User-related queries
  ├── workouts.ts    # Workout-related queries
  ├── exercises.ts   # Exercise-related queries
  └── index.ts       # Optional: re-export all helpers
```

### Helper Function Pattern

```typescript
// data/workouts.ts
import { db } from "@/db";
import { workouts } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function getWorkoutsForUser(userId: string) {
  return await db
    .select()
    .from(workouts)
    .where(eq(workouts.userId, userId));
}

export async function getWorkoutById(workoutId: string, userId: string) {
  const results = await db
    .select()
    .from(workouts)
    .where(eq(workouts.id, workoutId))
    .limit(1);

  // Security check: ensure workout belongs to user
  if (results[0]?.userId !== userId) {
    throw new Error("Unauthorized");
  }

  return results[0];
}
```

### Why /data Helpers?

1. **Centralization**: All database queries in one place
2. **Reusability**: Same query can be used across multiple pages
3. **Testability**: Easy to test database logic in isolation
4. **Security**: Enforce authorization rules in one place
5. **Maintainability**: Schema changes only affect /data directory

## Drizzle ORM - MANDATORY

**CRITICAL RULE: ALL database queries MUST use Drizzle ORM. ABSOLUTELY NO raw SQL.**

### Why Drizzle ORM Only?

1. **Type Safety**: TypeScript types for all queries
2. **SQL Injection Prevention**: Parameterized queries by default
3. **Schema Validation**: Compile-time checks for schema changes
4. **Developer Experience**: Autocomplete and IntelliSense support

### Correct: Using Drizzle ORM

```typescript
// ✅ CORRECT
import { db } from "@/db";
import { workouts } from "@/db/schema";
import { eq, and, gte } from "drizzle-orm";

export async function getRecentWorkouts(userId: string, days: number) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  return await db
    .select()
    .from(workouts)
    .where(
      and(
        eq(workouts.userId, userId),
        gte(workouts.createdAt, cutoffDate)
      )
    )
    .orderBy(workouts.createdAt);
}
```

### Incorrect: Using Raw SQL

```typescript
// ❌ WRONG - DO NOT DO THIS
export async function getRecentWorkouts(userId: string, days: number) {
  // NEVER use raw SQL queries
  const result = await db.execute(`
    SELECT * FROM workouts
    WHERE user_id = ${userId}
    AND created_at >= NOW() - INTERVAL '${days} days'
  `);

  return result.rows;
}
```

### Common Drizzle Operations

```typescript
import { db } from "@/db";
import { workouts, exercises } from "@/db/schema";
import { eq, and, or, desc, asc, count } from "drizzle-orm";

// SELECT with WHERE
const userWorkouts = await db
  .select()
  .from(workouts)
  .where(eq(workouts.userId, userId));

// INSERT
const newWorkout = await db
  .insert(workouts)
  .values({
    userId,
    name: "Morning Workout",
    date: new Date(),
  })
  .returning();

// UPDATE
await db
  .update(workouts)
  .set({ name: "Updated Name" })
  .where(eq(workouts.id, workoutId));

// DELETE
await db
  .delete(workouts)
  .where(eq(workouts.id, workoutId));

// JOIN
const workoutsWithExercises = await db
  .select()
  .from(workouts)
  .leftJoin(exercises, eq(exercises.workoutId, workouts.id))
  .where(eq(workouts.userId, userId));

// AGGREGATION
const workoutCount = await db
  .select({ count: count() })
  .from(workouts)
  .where(eq(workouts.userId, userId));
```

## Data Isolation Security - CRITICAL

**CRITICAL RULE: A logged-in user can ONLY access their own data. They MUST NOT be able to access any other user's data.**

### Security Principles

1. **Always filter by userId**: Every query MUST include `userId` filter
2. **Verify ownership**: When accessing specific records, verify they belong to the user
3. **No trust in client data**: Never trust IDs or data from the client
4. **Server-side validation**: All authorization checks happen on the server

### Security Pattern: Always Include userId

```typescript
// ✅ CORRECT - Always filter by userId
export async function getWorkoutsForUser(userId: string) {
  return await db
    .select()
    .from(workouts)
    .where(eq(workouts.userId, userId)); // CRITICAL: Filter by userId
}

export async function getWorkoutById(workoutId: string, userId: string) {
  const results = await db
    .select()
    .from(workouts)
    .where(
      and(
        eq(workouts.id, workoutId),
        eq(workouts.userId, userId) // CRITICAL: Verify ownership
      )
    )
    .limit(1);

  if (!results[0]) {
    throw new Error("Workout not found or unauthorized");
  }

  return results[0];
}

// ❌ WRONG - Missing userId filter (SECURITY VULNERABILITY!)
export async function getWorkoutById(workoutId: string) {
  // This allows ANY user to access ANY workout by ID
  return await db
    .select()
    .from(workouts)
    .where(eq(workouts.id, workoutId))
    .limit(1);
}
```

### Security Pattern: Create/Update/Delete

```typescript
// CREATE: Always set userId from authenticated user
export async function createWorkout(userId: string, data: NewWorkout) {
  return await db
    .insert(workouts)
    .values({
      ...data,
      userId, // CRITICAL: Set userId from authenticated user, not from client
    })
    .returning();
}

// UPDATE: Verify ownership before updating
export async function updateWorkout(
  workoutId: string,
  userId: string,
  data: Partial<Workout>
) {
  // First, verify the workout belongs to the user
  const existing = await getWorkoutById(workoutId, userId);

  if (!existing) {
    throw new Error("Unauthorized");
  }

  // Now safe to update
  return await db
    .update(workouts)
    .set(data)
    .where(
      and(
        eq(workouts.id, workoutId),
        eq(workouts.userId, userId) // CRITICAL: Double-check userId
      )
    )
    .returning();
}

// DELETE: Verify ownership before deleting
export async function deleteWorkout(workoutId: string, userId: string) {
  const result = await db
    .delete(workouts)
    .where(
      and(
        eq(workouts.id, workoutId),
        eq(workouts.userId, userId) // CRITICAL: Only delete if owned by user
      )
    )
    .returning();

  if (!result[0]) {
    throw new Error("Workout not found or unauthorized");
  }

  return result[0];
}
```

### Getting the Current User

```typescript
// data/users.ts
import { auth } from "@/lib/auth"; // Your auth solution

export async function getCurrentUser() {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  return session.user;
}

// Usage in Server Component
import { getCurrentUser } from "@/data/users";
import { getWorkoutsForUser } from "@/data/workouts";

export default async function DashboardPage() {
  const user = await getCurrentUser(); // Get authenticated user
  const workouts = await getWorkoutsForUser(user.id); // Use their ID

  return (/* ... */);
}
```

## Summary - Non-Negotiable Rules

1. **Data Fetching**: ONLY in Server Components - NO route handlers, NO client components
2. **Database Queries**: ONLY via helper functions in `/data` directory
3. **Query Method**: ONLY Drizzle ORM - ABSOLUTELY NO raw SQL
4. **Data Security**: Users can ONLY access their own data - ALWAYS filter by userId

These standards are **CRITICAL** for security, performance, and maintainability. They are non-negotiable and must be followed throughout the entire project.

## Violations

If you see any of the following, it is a **CRITICAL VIOLATION**:
- ❌ Data fetching in route handlers (`app/api/**/route.ts`)
- ❌ Data fetching in client components (`"use client"`)
- ❌ Database queries outside `/data` directory
- ❌ Raw SQL queries instead of Drizzle ORM
- ❌ Missing `userId` filter in queries
- ❌ Trusting client-provided IDs without ownership verification

**All violations must be corrected immediately.**
