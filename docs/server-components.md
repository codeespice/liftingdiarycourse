# Server Components Standards

This document outlines coding standards for React Server Components in this Next.js 15 project.

## Async Params and SearchParams

**CRITICAL: In Next.js 15, `params` and `searchParams` are Promises and MUST be awaited.**

This is a breaking change from Next.js 14. Accessing params without awaiting will cause runtime errors.

### Page Components

```typescript
// ✅ CORRECT - Await params
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  // Use id...
}

// ❌ WRONG - Will cause errors
export default function Page({
  params,
}: {
  params: { id: string }
}) {
  const { id } = params // ERROR: params is a Promise
}
```

### With SearchParams

```typescript
// ✅ CORRECT
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ query?: string; page?: string }>
}) {
  const { slug } = await params
  const { query, page } = await searchParams
  // Use values...
}
```

### Layout Components

```typescript
// ✅ CORRECT
export default async function Layout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ teamId: string }>
}) {
  const { teamId } = await params
  // Use teamId...
  return <div>{children}</div>
}
```

### generateMetadata

```typescript
// ✅ CORRECT
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  return {
    title: `Item ${id}`,
  }
}
```

### generateStaticParams

Note: `generateStaticParams` does NOT receive params as a Promise - it returns the params to be generated.

```typescript
// ✅ CORRECT - Returns params, doesn't receive Promise
export async function generateStaticParams() {
  const items = await fetchItems()
  return items.map((item) => ({
    id: item.id,
  }))
}
```

## Server Component Best Practices

### Data Fetching

Server Components should fetch data directly without useEffect or client-side fetching:

```typescript
// ✅ CORRECT - Direct data fetching in Server Component
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const data = await fetchData(id) // Direct async call

  return <div>{data.title}</div>
}
```

### No Client Hooks

Server Components cannot use React hooks like `useState`, `useEffect`, etc.:

```typescript
// ❌ WRONG - Cannot use hooks in Server Components
export default async function Page() {
  const [state, setState] = useState() // ERROR
  useEffect(() => {}, []) // ERROR
}
```

### Passing Data to Client Components

Pass serializable data as props to Client Components:

```typescript
// Server Component
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const data = await fetchData(id)

  return <ClientComponent initialData={data} />
}

// Client Component
"use client"
export function ClientComponent({ initialData }: { initialData: Data }) {
  const [data, setData] = useState(initialData)
  // Client-side interactivity...
}
```

## Error Handling

Handle errors gracefully in async Server Components:

```typescript
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  try {
    const data = await fetchData(id)
    return <div>{data.title}</div>
  } catch (error) {
    notFound() // or redirect, or show error UI
  }
}
```

## Summary

1. **Always await `params` and `searchParams`** - They are Promises in Next.js 15
2. **Use `async` function syntax** for pages and layouts that access params
3. **Type params as `Promise<T>`** for proper TypeScript support
4. **Fetch data directly** in Server Components
5. **Pass data as props** to Client Components for interactivity
