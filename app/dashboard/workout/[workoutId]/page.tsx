// Edit Workout page - Server Component for data fetching
// Following docs/data-fetching.md standards

import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getWorkoutById } from "@/data/workouts";
import { EditWorkoutForm } from "./edit-workout-form";

type Params = Promise<{ workoutId: string }>;

export default async function EditWorkoutPage(props: { params: Params }) {
  const params = await props.params;

  // Get the current authenticated user
  const user = await getCurrentUser();

  // Fetch the workout by ID with ownership verification
  // Using helper function from /data directory with Drizzle ORM
  let workout;
  try {
    workout = await getWorkoutById(params.workoutId, user.id);
  } catch {
    notFound();
  }

  // Pass data to client component for interactivity
  return (
    <div className="container mx-auto p-6">
      <EditWorkoutForm workout={workout} />
    </div>
  );
}
