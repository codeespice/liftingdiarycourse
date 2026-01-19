// Temporary auth helper for UI-only authentication
// TODO: Replace with real authentication (NextAuth.js, Clerk, etc.)

import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

// Temporary hardcoded user ID for UI-only auth
// In production, this will be replaced with real session management
const TEMP_USER_EMAIL = "user@example.com";

export async function getCurrentUser() {
  // For now, return a hardcoded test user
  // This will be replaced with real session/auth logic
  const existingUsers = await db
    .select()
    .from(users)
    .where(eq(users.email, TEMP_USER_EMAIL))
    .limit(1);

  if (existingUsers.length > 0) {
    return existingUsers[0];
  }

  // If test user doesn't exist, create one
  const newUsers = await db
    .insert(users)
    .values({
      email: TEMP_USER_EMAIL,
      username: "testuser",
      passwordHash: "temporary_hash", // Not used in UI-only auth
    })
    .returning();

  return newUsers[0];
}

export async function getUserById(userId: string) {
  const results = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return results[0] || null;
}
