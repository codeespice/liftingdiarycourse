// Dashboard page - Server Component for data fetching
// Following docs/data-fetching.md standards

import { getCurrentUser } from "@/lib/auth";
import { getWorkoutsForUserByDate } from "@/data/workouts";
import { DashboardClient } from "./dashboard-client";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function DashboardPage(props: {
  searchParams: SearchParams;
}) {
  const searchParams = await props.searchParams;

  // Get the current authenticated user
  const user = await getCurrentUser();

  // Get date from query params or use today
  const dateParam = searchParams.date;
  const selectedDate = dateParam && typeof dateParam === "string"
    ? new Date(dateParam)
    : new Date();

  // Fetch workouts for the user on the selected date
  // Using helper function from /data directory with Drizzle ORM
  const workouts = await getWorkoutsForUserByDate(user.id, selectedDate);

  // Pass data to client component for interactivity
  return <DashboardClient initialDate={selectedDate} workouts={workouts} />;
}
