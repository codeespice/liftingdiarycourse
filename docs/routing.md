# Routing Standards

This document defines the coding standards for routing in this Next.js 15 App Router project.

## App Router File Conventions

**CRITICAL: Follow Next.js App Router conventions exactly.**

### Reserved File Names

| File | Purpose |
|------|---------|
| `page.tsx` | Route UI - makes the route publicly accessible |
| `layout.tsx` | Shared UI wrapper for segment and children |
| `loading.tsx` | Loading UI (Suspense fallback) |
| `error.tsx` | Error boundary UI |
| `not-found.tsx` | 404 UI for segment |
| `route.ts` | API endpoint (DO NOT use for data fetching - see docs/data-fetching.md) |

### File Naming

```
app/
├── page.tsx                    # / (home route)
├── layout.tsx                  # Root layout
├── login/
│   └── page.tsx               # /login
├── signup/
│   └── page.tsx               # /signup
├── dashboard/
│   ├── page.tsx               # /dashboard
│   ├── layout.tsx             # Dashboard layout wrapper
│   ├── loading.tsx            # Dashboard loading state
│   └── workout/
│       ├── new/
│       │   └── page.tsx       # /dashboard/workout/new
│       └── [workoutId]/
│           └── page.tsx       # /dashboard/workout/:workoutId
```

## Dynamic Routes

### Dynamic Segments

Use brackets `[]` for dynamic route parameters:

```
app/dashboard/workout/[workoutId]/page.tsx  →  /dashboard/workout/:workoutId
app/user/[userId]/settings/page.tsx         →  /user/:userId/settings
```

### Accessing Params (Next.js 15 - CRITICAL)

**CRITICAL: In Next.js 15, `params` is a Promise and MUST be awaited.**

```typescript
// ✅ CORRECT - Params as Promise
type Params = Promise<{ workoutId: string }>;

export default async function WorkoutPage(props: { params: Params }) {
  const params = await props.params;
  const { workoutId } = params;

  // Use workoutId...
}

// ❌ WRONG - Will cause runtime errors
export default function WorkoutPage({ params }: { params: { workoutId: string } }) {
  const { workoutId } = params; // ERROR: params is a Promise!
}
```

### Catch-All Segments

```
app/docs/[...slug]/page.tsx     →  /docs/a, /docs/a/b, /docs/a/b/c
app/shop/[[...slug]]/page.tsx   →  /shop, /shop/a, /shop/a/b (optional)
```

```typescript
type Params = Promise<{ slug: string[] }>;

export default async function DocsPage(props: { params: Params }) {
  const params = await props.params;
  const { slug } = params; // ['a', 'b', 'c'] for /docs/a/b/c
}
```

## SearchParams

**CRITICAL: `searchParams` is also a Promise in Next.js 15.**

```typescript
type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function Page(props: { searchParams: SearchParams }) {
  const searchParams = await props.searchParams;

  const page = searchParams.page;        // string | string[] | undefined
  const filter = searchParams.filter;    // string | string[] | undefined

  // Safely handle as string
  const pageNum = typeof page === "string" ? parseInt(page, 10) : 1;
}
```

## Route Groups

Use parentheses `()` to organize routes without affecting the URL:

```
app/
├── (auth)/
│   ├── layout.tsx        # Shared auth layout (no URL impact)
│   ├── login/
│   │   └── page.tsx      # /login
│   └── signup/
│       └── page.tsx      # /signup
├── (dashboard)/
│   ├── layout.tsx        # Dashboard layout with sidebar
│   └── dashboard/
│       └── page.tsx      # /dashboard
```

### When to Use Route Groups

1. **Shared layouts**: Group routes that share a common layout
2. **Organizational clarity**: Separate public vs authenticated routes
3. **Multiple root layouts**: Different layouts for marketing vs app

## Layouts

### Layout Best Practices

```typescript
// ✅ CORRECT - Layout with typed children
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1">{children}</main>
    </div>
  );
}

// ✅ CORRECT - Layout with params (Next.js 15)
type Params = Promise<{ teamId: string }>;

export default async function TeamLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Params;
}) {
  const { teamId } = await params;
  const team = await getTeam(teamId);

  return (
    <div>
      <TeamHeader team={team} />
      {children}
    </div>
  );
}
```

### Layout Rules

1. **Layouts don't re-render**: Parent layouts persist across child navigations
2. **No access to pathname**: Use `usePathname()` in a Client Component if needed
3. **Layouts wrap pages**: Children render inside the layout

## Navigation

### Link Component (Preferred)

**Use `<Link>` for all internal navigation:**

```typescript
import Link from "next/link";

// ✅ CORRECT - Basic link
<Link href="/dashboard">Dashboard</Link>

// ✅ CORRECT - Dynamic route
<Link href={`/dashboard/workout/${workoutId}`}>View Workout</Link>

// ✅ CORRECT - With query params
<Link href={{ pathname: "/dashboard", query: { date: "2024-01-15" } }}>
  View Date
</Link>

// ❌ WRONG - Using <a> tag for internal routes
<a href="/dashboard">Dashboard</a>
```

### Programmatic Navigation (Client Components)

```typescript
"use client";

import { useRouter } from "next/navigation";

export function NavigationButton() {
  const router = useRouter();

  const handleClick = () => {
    router.push("/dashboard");          // Navigate
    router.replace("/login");           // Replace current history entry
    router.back();                      // Go back
    router.refresh();                   // Refresh current route
  };

  return <button onClick={handleClick}>Navigate</button>;
}
```

### Server-Side Redirects

```typescript
import { redirect, notFound } from "next/navigation";

export default async function Page(props: { params: Params }) {
  const params = await props.params;
  const user = await getCurrentUser();

  // Redirect if not authenticated
  if (!user) {
    redirect("/login");
  }

  const workout = await getWorkout(params.workoutId, user.id);

  // Show 404 if not found
  if (!workout) {
    notFound();
  }

  return <WorkoutDetails workout={workout} />;
}
```

## Protected Routes

### Authentication Pattern

**CRITICAL: Always verify authentication in Server Components before rendering protected content.**

```typescript
// app/dashboard/page.tsx
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  // User is authenticated, proceed with data fetching
  const workouts = await getWorkoutsForUser(user.id);

  return <DashboardContent workouts={workouts} />;
}
```

### Protected Layout Pattern

For multiple protected routes, use a layout:

```typescript
// app/(protected)/layout.tsx
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return <>{children}</>;
}
```

## Loading States

### Loading UI

Create `loading.tsx` for automatic Suspense boundaries:

```typescript
// app/dashboard/loading.tsx
export default function DashboardLoading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );
}
```

### Streaming with Suspense

```typescript
import { Suspense } from "react";

export default async function Page() {
  return (
    <div>
      <h1>Dashboard</h1>
      <Suspense fallback={<WorkoutsSkeleton />}>
        <WorkoutsList />
      </Suspense>
    </div>
  );
}

async function WorkoutsList() {
  const workouts = await getWorkouts(); // Slow query
  return <WorkoutsGrid workouts={workouts} />;
}
```

## Error Handling

### Error Boundaries

```typescript
// app/dashboard/error.tsx
"use client";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h2>Something went wrong!</h2>
      <button onClick={() => reset()}>Try again</button>
    </div>
  );
}
```

### Not Found Pages

```typescript
// app/dashboard/workout/[workoutId]/not-found.tsx
export default function WorkoutNotFound() {
  return (
    <div className="text-center py-12">
      <h2>Workout Not Found</h2>
      <p>The workout you're looking for doesn't exist.</p>
    </div>
  );
}
```

## Route Metadata

### Static Metadata

```typescript
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard | Lifting Diary",
  description: "View and track your workouts",
};

export default function DashboardPage() {
  // ...
}
```

### Dynamic Metadata

```typescript
import type { Metadata } from "next";

type Params = Promise<{ workoutId: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { workoutId } = await params;
  const workout = await getWorkout(workoutId);

  return {
    title: `${workout.name} | Lifting Diary`,
    description: `View details for ${workout.name}`,
  };
}
```

## Summary - Non-Negotiable Rules

1. **File conventions**: Use `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx` correctly
2. **Params as Promises**: ALWAYS await `params` and `searchParams` in Next.js 15
3. **Use Link component**: Prefer `<Link>` over `<a>` or manual navigation
4. **Protect routes**: Verify authentication in Server Components before rendering
5. **Type everything**: Use proper TypeScript types for params and searchParams
6. **Handle errors**: Implement `error.tsx` and `not-found.tsx` for graceful error handling

## Violations

If you see any of the following, it is a **CRITICAL VIOLATION**:

- ❌ Accessing `params` or `searchParams` without awaiting
- ❌ Using `<a>` tags for internal navigation
- ❌ Missing authentication checks on protected routes
- ❌ Using route handlers (`route.ts`) for data fetching (see docs/data-fetching.md)
- ❌ Untyped params or searchParams

**All violations must be corrected immediately.**
