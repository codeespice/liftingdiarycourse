"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";

type Exercise = {
  id: string;
  exerciseName: string;
  orderInWorkout: number;
  sets: {
    id: string;
    setNumber: number;
    reps: number;
    weightKg: string | null;
  }[];
};

type Workout = {
  id: string;
  name: string;
  durationMinutes: number | null;
  exercises: Exercise[];
};

type DashboardClientProps = {
  initialDate: Date;
  workouts: Workout[];
};

export function DashboardClient({ initialDate, workouts }: DashboardClientProps) {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<Date>(initialDate);

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      // Navigate to update the URL with the new date
      const dateString = format(date, "yyyy-MM-dd");
      router.push(`/dashboard?date=${dateString}`);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-[240px] justify-start text-left font-normal">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {format(selectedDate, "do MMM yyyy")}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateChange}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">
            Workouts for {format(selectedDate, "do MMM yyyy")}
          </h2>
          <Button>Add Workout</Button>
        </div>

        {workouts.length > 0 ? (
          <div className="grid gap-4">
            {workouts.map((workout) => (
              <Card key={workout.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{workout.name}</CardTitle>
                      {workout.durationMinutes && (
                        <CardDescription>{workout.durationMinutes} min</CardDescription>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">Edit</Button>
                      <Button variant="outline" size="sm">Delete</Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {workout.exercises.map((exercise) => {
                      // Calculate summary from sets
                      const totalSets = exercise.sets.length;
                      const avgReps = totalSets > 0
                        ? Math.round(exercise.sets.reduce((sum, set) => sum + set.reps, 0) / totalSets)
                        : 0;
                      const avgWeight = totalSets > 0
                        ? exercise.sets.reduce((sum, set) => sum + (parseFloat(set.weightKg || "0")), 0) / totalSets
                        : 0;

                      return (
                        <div key={exercise.id} className="flex items-center justify-between p-2 bg-muted rounded-md">
                          <span className="font-medium">{exercise.exerciseName}</span>
                          <span className="text-sm text-muted-foreground">
                            {totalSets} sets × {avgReps} reps
                            {avgWeight > 0 && ` @ ${avgWeight.toFixed(1)} kg`}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground mb-4">No workouts logged for this date</p>
              <Button>Log Your First Workout</Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
