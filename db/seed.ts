import 'dotenv/config';
import { db } from './index';
import { users, workouts, exerciseTemplates, exercises, sets } from './schema';

async function seed() {
  console.log('🌱 Seeding database...');

  try {
    // Clear existing data (in reverse order of dependencies)
    console.log('Clearing existing data...');
    await db.delete(sets);
    await db.delete(exercises);
    await db.delete(workouts);
    await db.delete(exerciseTemplates);
    await db.delete(users);
    console.log('✓ Existing data cleared');

    // 1. Create Exercise Templates
    console.log('Creating exercise templates...');
    const templates = await db.insert(exerciseTemplates).values([
      {
        name: 'Bench Press',
        category: 'Chest',
        equipmentRequired: 'Barbell, Bench',
        description: 'Compound chest exercise performed lying on a bench',
      },
      {
        name: 'Squat',
        category: 'Legs',
        equipmentRequired: 'Barbell, Squat Rack',
        description: 'Compound leg exercise targeting quads, glutes, and hamstrings',
      },
      {
        name: 'Deadlift',
        category: 'Back',
        equipmentRequired: 'Barbell',
        description: 'Compound full-body exercise with emphasis on posterior chain',
      },
      {
        name: 'Overhead Press',
        category: 'Shoulders',
        equipmentRequired: 'Barbell',
        description: 'Compound shoulder exercise',
      },
      {
        name: 'Barbell Row',
        category: 'Back',
        equipmentRequired: 'Barbell',
        description: 'Compound back exercise targeting lats and rhomboids',
      },
      {
        name: 'Pull-ups',
        category: 'Back',
        equipmentRequired: 'Pull-up Bar',
        description: 'Bodyweight back exercise',
      },
      {
        name: 'Incline Dumbbell Press',
        category: 'Chest',
        equipmentRequired: 'Dumbbells, Incline Bench',
        description: 'Isolation exercise for upper chest',
      },
      {
        name: 'Leg Press',
        category: 'Legs',
        equipmentRequired: 'Leg Press Machine',
        description: 'Machine-based leg exercise',
      },
      {
        name: 'Romanian Deadlift',
        category: 'Legs',
        equipmentRequired: 'Barbell',
        description: 'Hamstring-focused variation of deadlift',
      },
      {
        name: 'Tricep Dips',
        category: 'Arms',
        equipmentRequired: 'Dip Station',
        description: 'Compound exercise for triceps and chest',
      },
      {
        name: 'Bicep Curls',
        category: 'Arms',
        equipmentRequired: 'Dumbbells or Barbell',
        description: 'Isolation exercise for biceps',
      },
      {
        name: 'Lateral Raises',
        category: 'Shoulders',
        equipmentRequired: 'Dumbbells',
        description: 'Isolation exercise for side delts',
      },
      {
        name: 'Leg Curls',
        category: 'Legs',
        equipmentRequired: 'Leg Curl Machine',
        description: 'Isolation exercise for hamstrings',
      },
      {
        name: 'Cable Flyes',
        category: 'Chest',
        equipmentRequired: 'Cable Machine',
        description: 'Isolation exercise for chest',
      },
      {
        name: 'Face Pulls',
        category: 'Shoulders',
        equipmentRequired: 'Cable Machine',
        description: 'Rear delt and upper back exercise',
      },
    ]).returning();
    console.log(`✓ Created ${templates.length} exercise templates`);

    // 2. Create Users
    console.log('Creating users...');
    const usersData = await db.insert(users).values([
      {
        email: 'user@example.com', // Test user for temporary auth
        username: 'testuser',
        passwordHash: '$2a$10$samplehashedpassword0',
      },
      {
        email: 'john@example.com',
        username: 'john_lifter',
        passwordHash: '$2a$10$samplehashedpassword1', // In real app, use bcrypt
      },
      {
        email: 'sarah@example.com',
        username: 'sarah_strong',
        passwordHash: '$2a$10$samplehashedpassword2',
      },
      {
        email: 'mike@example.com',
        username: 'mike_muscles',
        passwordHash: '$2a$10$samplehashedpassword3',
      },
    ]).returning();
    console.log(`✓ Created ${usersData.length} users`);

    const [testUser, user1, user2, user3] = usersData;

    // Today's date for test user workouts (so they appear on the dashboard)
    const today = new Date();
    today.setHours(10, 0, 0, 0);

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(9, 0, 0, 0);

    // 3. Create Workouts for User 1 (John)
    console.log('Creating workouts...');

    // John's Push Day
    const [pushDay] = await db.insert(workouts).values({
      userId: user1.id,
      name: 'Push Day - Chest & Triceps',
      date: new Date('2025-01-15T09:00:00'),
      notes: 'Felt strong today, increased weight on bench press',
      durationMinutes: 75,
    }).returning();

    // John's Push Day Exercises
    const pushExercises = await db.insert(exercises).values([
      {
        workoutId: pushDay.id,
        templateId: templates.find(t => t.name === 'Bench Press')?.id,
        exerciseName: 'Bench Press',
        exerciseType: 'compound',
        orderInWorkout: 1,
        notes: 'New PR on last set!',
      },
      {
        workoutId: pushDay.id,
        templateId: templates.find(t => t.name === 'Incline Dumbbell Press')?.id,
        exerciseName: 'Incline Dumbbell Press',
        exerciseType: 'compound',
        orderInWorkout: 2,
      },
      {
        workoutId: pushDay.id,
        templateId: templates.find(t => t.name === 'Cable Flyes')?.id,
        exerciseName: 'Cable Flyes',
        exerciseType: 'isolation',
        orderInWorkout: 3,
      },
      {
        workoutId: pushDay.id,
        templateId: templates.find(t => t.name === 'Tricep Dips')?.id,
        exerciseName: 'Tricep Dips',
        exerciseType: 'compound',
        orderInWorkout: 4,
      },
    ]).returning();

    // Sets for Bench Press
    await db.insert(sets).values([
      { exerciseId: pushExercises[0].id, setNumber: 1, reps: 10, weightKg: '60.00', isWarmup: true, restSeconds: 90 },
      { exerciseId: pushExercises[0].id, setNumber: 2, reps: 8, weightKg: '80.00', rpe: '7.0', restSeconds: 120 },
      { exerciseId: pushExercises[0].id, setNumber: 3, reps: 6, weightKg: '90.00', rpe: '8.5', restSeconds: 180 },
      { exerciseId: pushExercises[0].id, setNumber: 4, reps: 5, weightKg: '95.00', rpe: '9.0', isFailure: true, restSeconds: 180 },
    ]);

    // Sets for Incline Dumbbell Press
    await db.insert(sets).values([
      { exerciseId: pushExercises[1].id, setNumber: 1, reps: 10, weightKg: '30.00', rpe: '7.0', restSeconds: 90 },
      { exerciseId: pushExercises[1].id, setNumber: 2, reps: 9, weightKg: '30.00', rpe: '8.0', restSeconds: 90 },
      { exerciseId: pushExercises[1].id, setNumber: 3, reps: 8, weightKg: '30.00', rpe: '8.5', restSeconds: 90 },
    ]);

    // Sets for Cable Flyes
    await db.insert(sets).values([
      { exerciseId: pushExercises[2].id, setNumber: 1, reps: 12, weightKg: '20.00', rpe: '7.0', restSeconds: 60 },
      { exerciseId: pushExercises[2].id, setNumber: 2, reps: 12, weightKg: '20.00', rpe: '7.5', restSeconds: 60 },
      { exerciseId: pushExercises[2].id, setNumber: 3, reps: 10, weightKg: '20.00', rpe: '8.5', isFailure: true, restSeconds: 60 },
    ]);

    // Sets for Tricep Dips
    await db.insert(sets).values([
      { exerciseId: pushExercises[3].id, setNumber: 1, reps: 12, rpe: '6.5', restSeconds: 60, notes: 'Bodyweight' },
      { exerciseId: pushExercises[3].id, setNumber: 2, reps: 10, rpe: '7.5', restSeconds: 60, notes: 'Bodyweight' },
      { exerciseId: pushExercises[3].id, setNumber: 3, reps: 8, rpe: '8.5', isFailure: true, restSeconds: 60, notes: 'Bodyweight' },
    ]);

    // John's Leg Day
    const [legDay] = await db.insert(workouts).values({
      userId: user1.id,
      name: 'Leg Day',
      date: new Date('2025-01-17T10:00:00'),
      notes: 'Tough workout, legs are sore',
      durationMinutes: 90,
    }).returning();

    const legExercises = await db.insert(exercises).values([
      {
        workoutId: legDay.id,
        templateId: templates.find(t => t.name === 'Squat')?.id,
        exerciseName: 'Squat',
        exerciseType: 'compound',
        orderInWorkout: 1,
      },
      {
        workoutId: legDay.id,
        templateId: templates.find(t => t.name === 'Romanian Deadlift')?.id,
        exerciseName: 'Romanian Deadlift',
        exerciseType: 'compound',
        orderInWorkout: 2,
      },
      {
        workoutId: legDay.id,
        templateId: templates.find(t => t.name === 'Leg Press')?.id,
        exerciseName: 'Leg Press',
        exerciseType: 'compound',
        orderInWorkout: 3,
      },
      {
        workoutId: legDay.id,
        templateId: templates.find(t => t.name === 'Leg Curls')?.id,
        exerciseName: 'Leg Curls',
        exerciseType: 'isolation',
        orderInWorkout: 4,
      },
    ]).returning();

    // Sets for Squat
    await db.insert(sets).values([
      { exerciseId: legExercises[0].id, setNumber: 1, reps: 8, weightKg: '60.00', isWarmup: true, restSeconds: 120 },
      { exerciseId: legExercises[0].id, setNumber: 2, reps: 6, weightKg: '100.00', rpe: '7.5', restSeconds: 180 },
      { exerciseId: legExercises[0].id, setNumber: 3, reps: 5, weightKg: '120.00', rpe: '8.5', restSeconds: 180 },
      { exerciseId: legExercises[0].id, setNumber: 4, reps: 5, weightKg: '120.00', rpe: '9.0', restSeconds: 180 },
    ]);

    // Sets for Romanian Deadlift
    await db.insert(sets).values([
      { exerciseId: legExercises[1].id, setNumber: 1, reps: 10, weightKg: '80.00', rpe: '7.0', restSeconds: 90 },
      { exerciseId: legExercises[1].id, setNumber: 2, reps: 10, weightKg: '80.00', rpe: '7.5', restSeconds: 90 },
      { exerciseId: legExercises[1].id, setNumber: 3, reps: 8, weightKg: '85.00', rpe: '8.5', restSeconds: 90 },
    ]);

    // Sets for Leg Press
    await db.insert(sets).values([
      { exerciseId: legExercises[2].id, setNumber: 1, reps: 12, weightKg: '150.00', rpe: '7.0', restSeconds: 90 },
      { exerciseId: legExercises[2].id, setNumber: 2, reps: 10, weightKg: '170.00', rpe: '8.0', restSeconds: 90 },
      { exerciseId: legExercises[2].id, setNumber: 3, reps: 8, weightKg: '180.00', rpe: '9.0', isFailure: true, restSeconds: 90 },
    ]);

    // Sets for Leg Curls
    await db.insert(sets).values([
      { exerciseId: legExercises[3].id, setNumber: 1, reps: 12, weightKg: '40.00', rpe: '6.5', restSeconds: 60 },
      { exerciseId: legExercises[3].id, setNumber: 2, reps: 10, weightKg: '45.00', rpe: '7.5', restSeconds: 60 },
      { exerciseId: legExercises[3].id, setNumber: 3, reps: 10, weightKg: '45.00', rpe: '8.0', restSeconds: 60 },
    ]);

    // 4. Create Workouts for User 2 (Sarah)
    const [sarahPullDay] = await db.insert(workouts).values({
      userId: user2.id,
      name: 'Pull Day - Back & Biceps',
      date: new Date('2025-01-16T14:00:00'),
      notes: 'Great pump in the back today',
      durationMinutes: 80,
    }).returning();

    const pullExercises = await db.insert(exercises).values([
      {
        workoutId: sarahPullDay.id,
        templateId: templates.find(t => t.name === 'Deadlift')?.id,
        exerciseName: 'Deadlift',
        exerciseType: 'compound',
        orderInWorkout: 1,
      },
      {
        workoutId: sarahPullDay.id,
        templateId: templates.find(t => t.name === 'Pull-ups')?.id,
        exerciseName: 'Pull-ups',
        exerciseType: 'compound',
        orderInWorkout: 2,
      },
      {
        workoutId: sarahPullDay.id,
        templateId: templates.find(t => t.name === 'Barbell Row')?.id,
        exerciseName: 'Barbell Row',
        exerciseType: 'compound',
        orderInWorkout: 3,
      },
      {
        workoutId: sarahPullDay.id,
        templateId: templates.find(t => t.name === 'Bicep Curls')?.id,
        exerciseName: 'Bicep Curls',
        exerciseType: 'isolation',
        orderInWorkout: 4,
      },
      {
        workoutId: sarahPullDay.id,
        templateId: templates.find(t => t.name === 'Face Pulls')?.id,
        exerciseName: 'Face Pulls',
        exerciseType: 'isolation',
        orderInWorkout: 5,
      },
    ]).returning();

    // Sets for Deadlift
    await db.insert(sets).values([
      { exerciseId: pullExercises[0].id, setNumber: 1, reps: 8, weightKg: '60.00', isWarmup: true, restSeconds: 120 },
      { exerciseId: pullExercises[0].id, setNumber: 2, reps: 5, weightKg: '90.00', rpe: '7.5', restSeconds: 180 },
      { exerciseId: pullExercises[0].id, setNumber: 3, reps: 5, weightKg: '100.00', rpe: '8.5', restSeconds: 180 },
      { exerciseId: pullExercises[0].id, setNumber: 4, reps: 3, weightKg: '110.00', rpe: '9.5', restSeconds: 240 },
    ]);

    // Sets for Pull-ups
    await db.insert(sets).values([
      { exerciseId: pullExercises[1].id, setNumber: 1, reps: 8, rpe: '7.0', restSeconds: 90, notes: 'Bodyweight' },
      { exerciseId: pullExercises[1].id, setNumber: 2, reps: 7, rpe: '8.0', restSeconds: 90, notes: 'Bodyweight' },
      { exerciseId: pullExercises[1].id, setNumber: 3, reps: 6, rpe: '8.5', isFailure: true, restSeconds: 90, notes: 'Bodyweight' },
    ]);

    // Sets for Barbell Row
    await db.insert(sets).values([
      { exerciseId: pullExercises[2].id, setNumber: 1, reps: 10, weightKg: '60.00', rpe: '7.0', restSeconds: 90 },
      { exerciseId: pullExercises[2].id, setNumber: 2, reps: 8, weightKg: '70.00', rpe: '8.0', restSeconds: 90 },
      { exerciseId: pullExercises[2].id, setNumber: 3, reps: 8, weightKg: '70.00', rpe: '8.5', restSeconds: 90 },
    ]);

    // Sets for Bicep Curls
    await db.insert(sets).values([
      { exerciseId: pullExercises[3].id, setNumber: 1, reps: 12, weightKg: '12.50', rpe: '6.5', restSeconds: 60 },
      { exerciseId: pullExercises[3].id, setNumber: 2, reps: 10, weightKg: '15.00', rpe: '7.5', restSeconds: 60 },
      { exerciseId: pullExercises[3].id, setNumber: 3, reps: 8, weightKg: '15.00', rpe: '8.5', isFailure: true, restSeconds: 60 },
    ]);

    // Sets for Face Pulls
    await db.insert(sets).values([
      { exerciseId: pullExercises[4].id, setNumber: 1, reps: 15, weightKg: '25.00', rpe: '6.0', restSeconds: 45 },
      { exerciseId: pullExercises[4].id, setNumber: 2, reps: 15, weightKg: '25.00', rpe: '6.5', restSeconds: 45 },
      { exerciseId: pullExercises[4].id, setNumber: 3, reps: 12, weightKg: '30.00', rpe: '7.5', restSeconds: 45 },
    ]);

    // 5. Create Workouts for User 3 (Mike)
    const [mikeShoulderDay] = await db.insert(workouts).values({
      userId: user3.id,
      name: 'Shoulder Day',
      date: new Date('2025-01-18T11:00:00'),
      notes: 'Focus on shoulder health and mobility',
      durationMinutes: 60,
    }).returning();

    const shoulderExercises = await db.insert(exercises).values([
      {
        workoutId: mikeShoulderDay.id,
        templateId: templates.find(t => t.name === 'Overhead Press')?.id,
        exerciseName: 'Overhead Press',
        exerciseType: 'compound',
        orderInWorkout: 1,
      },
      {
        workoutId: mikeShoulderDay.id,
        templateId: templates.find(t => t.name === 'Lateral Raises')?.id,
        exerciseName: 'Lateral Raises',
        exerciseType: 'isolation',
        orderInWorkout: 2,
      },
      {
        workoutId: mikeShoulderDay.id,
        templateId: templates.find(t => t.name === 'Face Pulls')?.id,
        exerciseName: 'Face Pulls',
        exerciseType: 'isolation',
        orderInWorkout: 3,
      },
    ]).returning();

    // Sets for Overhead Press
    await db.insert(sets).values([
      { exerciseId: shoulderExercises[0].id, setNumber: 1, reps: 10, weightKg: '40.00', isWarmup: true, restSeconds: 90 },
      { exerciseId: shoulderExercises[0].id, setNumber: 2, reps: 8, weightKg: '50.00', rpe: '7.5', restSeconds: 120 },
      { exerciseId: shoulderExercises[0].id, setNumber: 3, reps: 6, weightKg: '60.00', rpe: '8.5', restSeconds: 120 },
      { exerciseId: shoulderExercises[0].id, setNumber: 4, reps: 6, weightKg: '60.00', rpe: '9.0', restSeconds: 120 },
    ]);

    // Sets for Lateral Raises
    await db.insert(sets).values([
      { exerciseId: shoulderExercises[1].id, setNumber: 1, reps: 15, weightKg: '7.50', rpe: '6.5', restSeconds: 60 },
      { exerciseId: shoulderExercises[1].id, setNumber: 2, reps: 12, weightKg: '10.00', rpe: '7.5', restSeconds: 60 },
      { exerciseId: shoulderExercises[1].id, setNumber: 3, reps: 10, weightKg: '10.00', rpe: '8.5', isFailure: true, restSeconds: 60 },
    ]);

    // Sets for Face Pulls
    await db.insert(sets).values([
      { exerciseId: shoulderExercises[2].id, setNumber: 1, reps: 20, weightKg: '20.00', rpe: '5.5', restSeconds: 45 },
      { exerciseId: shoulderExercises[2].id, setNumber: 2, reps: 20, weightKg: '20.00', rpe: '6.0', restSeconds: 45 },
      { exerciseId: shoulderExercises[2].id, setNumber: 3, reps: 18, weightKg: '22.50', rpe: '7.0', restSeconds: 45 },
    ]);

    // 6. Create Workouts for Test User (today's date so they appear on dashboard)
    console.log('Creating test user workouts for today...');

    // Test User's Full Body Workout - TODAY
    const [testUserWorkout1] = await db.insert(workouts).values({
      userId: testUser.id,
      name: 'Full Body Strength',
      date: today,
      notes: 'Morning session - feeling energized',
      durationMinutes: 65,
    }).returning();

    const testUserExercises1 = await db.insert(exercises).values([
      {
        workoutId: testUserWorkout1.id,
        templateId: templates.find(t => t.name === 'Squat')?.id,
        exerciseName: 'Squat',
        exerciseType: 'compound',
        orderInWorkout: 1,
      },
      {
        workoutId: testUserWorkout1.id,
        templateId: templates.find(t => t.name === 'Bench Press')?.id,
        exerciseName: 'Bench Press',
        exerciseType: 'compound',
        orderInWorkout: 2,
      },
      {
        workoutId: testUserWorkout1.id,
        templateId: templates.find(t => t.name === 'Barbell Row')?.id,
        exerciseName: 'Barbell Row',
        exerciseType: 'compound',
        orderInWorkout: 3,
      },
    ]).returning();

    // Sets for Test User Squat
    await db.insert(sets).values([
      { exerciseId: testUserExercises1[0].id, setNumber: 1, reps: 8, weightKg: '40.00', isWarmup: true, restSeconds: 90 },
      { exerciseId: testUserExercises1[0].id, setNumber: 2, reps: 5, weightKg: '80.00', rpe: '7.0', restSeconds: 120 },
      { exerciseId: testUserExercises1[0].id, setNumber: 3, reps: 5, weightKg: '90.00', rpe: '8.0', restSeconds: 150 },
      { exerciseId: testUserExercises1[0].id, setNumber: 4, reps: 5, weightKg: '95.00', rpe: '8.5', restSeconds: 180 },
    ]);

    // Sets for Test User Bench Press
    await db.insert(sets).values([
      { exerciseId: testUserExercises1[1].id, setNumber: 1, reps: 8, weightKg: '40.00', isWarmup: true, restSeconds: 60 },
      { exerciseId: testUserExercises1[1].id, setNumber: 2, reps: 5, weightKg: '60.00', rpe: '7.0', restSeconds: 90 },
      { exerciseId: testUserExercises1[1].id, setNumber: 3, reps: 5, weightKg: '70.00', rpe: '8.0', restSeconds: 120 },
      { exerciseId: testUserExercises1[1].id, setNumber: 4, reps: 4, weightKg: '75.00', rpe: '9.0', isFailure: true, restSeconds: 120 },
    ]);

    // Sets for Test User Barbell Row
    await db.insert(sets).values([
      { exerciseId: testUserExercises1[2].id, setNumber: 1, reps: 8, weightKg: '40.00', rpe: '6.5', restSeconds: 60 },
      { exerciseId: testUserExercises1[2].id, setNumber: 2, reps: 8, weightKg: '50.00', rpe: '7.5', restSeconds: 90 },
      { exerciseId: testUserExercises1[2].id, setNumber: 3, reps: 6, weightKg: '55.00', rpe: '8.5', restSeconds: 90 },
    ]);

    // Test User's Yesterday Workout
    const [testUserWorkout2] = await db.insert(workouts).values({
      userId: testUser.id,
      name: 'Upper Body Accessories',
      date: yesterday,
      notes: 'Light session focusing on pump work',
      durationMinutes: 45,
    }).returning();

    const testUserExercises2 = await db.insert(exercises).values([
      {
        workoutId: testUserWorkout2.id,
        templateId: templates.find(t => t.name === 'Overhead Press')?.id,
        exerciseName: 'Overhead Press',
        exerciseType: 'compound',
        orderInWorkout: 1,
      },
      {
        workoutId: testUserWorkout2.id,
        templateId: templates.find(t => t.name === 'Lateral Raises')?.id,
        exerciseName: 'Lateral Raises',
        exerciseType: 'isolation',
        orderInWorkout: 2,
      },
      {
        workoutId: testUserWorkout2.id,
        templateId: templates.find(t => t.name === 'Bicep Curls')?.id,
        exerciseName: 'Bicep Curls',
        exerciseType: 'isolation',
        orderInWorkout: 3,
      },
    ]).returning();

    // Sets for Test User Overhead Press
    await db.insert(sets).values([
      { exerciseId: testUserExercises2[0].id, setNumber: 1, reps: 8, weightKg: '30.00', isWarmup: true, restSeconds: 60 },
      { exerciseId: testUserExercises2[0].id, setNumber: 2, reps: 6, weightKg: '45.00', rpe: '7.5', restSeconds: 90 },
      { exerciseId: testUserExercises2[0].id, setNumber: 3, reps: 5, weightKg: '50.00', rpe: '8.5', restSeconds: 120 },
    ]);

    // Sets for Test User Lateral Raises
    await db.insert(sets).values([
      { exerciseId: testUserExercises2[1].id, setNumber: 1, reps: 15, weightKg: '8.00', rpe: '7.0', restSeconds: 45 },
      { exerciseId: testUserExercises2[1].id, setNumber: 2, reps: 12, weightKg: '10.00', rpe: '8.0', restSeconds: 45 },
      { exerciseId: testUserExercises2[1].id, setNumber: 3, reps: 10, weightKg: '10.00', rpe: '8.5', isFailure: true, restSeconds: 45 },
    ]);

    // Sets for Test User Bicep Curls
    await db.insert(sets).values([
      { exerciseId: testUserExercises2[2].id, setNumber: 1, reps: 12, weightKg: '10.00', rpe: '6.5', restSeconds: 45 },
      { exerciseId: testUserExercises2[2].id, setNumber: 2, reps: 10, weightKg: '12.50', rpe: '7.5', restSeconds: 45 },
      { exerciseId: testUserExercises2[2].id, setNumber: 3, reps: 8, weightKg: '12.50', rpe: '8.5', isFailure: true, restSeconds: 45 },
    ]);

    console.log('✓ Created test user workouts for today and yesterday');

    console.log('✓ Created workouts with exercises and sets');

    // Summary
    const totalWorkouts = await db.select().from(workouts);
    const totalExercises = await db.select().from(exercises);
    const totalSets = await db.select().from(sets);

    console.log('\n🎉 Seeding completed successfully!');
    console.log('═══════════════════════════════════════');
    console.log(`📊 Database Summary:`);
    console.log(`   Users: ${usersData.length}`);
    console.log(`   Exercise Templates: ${templates.length}`);
    console.log(`   Workouts: ${totalWorkouts.length}`);
    console.log(`   Exercises: ${totalExercises.length}`);
    console.log(`   Sets: ${totalSets.length}`);
    console.log('═══════════════════════════════════════');
    console.log('\n👥 Sample Users Created:');
    console.log('   - user@example.com (username: testuser) ← DEFAULT LOGIN USER');
    console.log('   - john@example.com (username: john_lifter)');
    console.log('   - sarah@example.com (username: sarah_strong)');
    console.log('   - mike@example.com (username: mike_muscles)');
    console.log('\n💪 Sample Workouts:');
    console.log('   - Test User: Full Body Strength (today), Upper Body Accessories (yesterday)');
    console.log('   - John: Push Day, Leg Day');
    console.log('   - Sarah: Pull Day');
    console.log('   - Mike: Shoulder Day');
    console.log('\n✨ You can now run `npm run db:studio` to view the data!');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

seed()
  .then(() => {
    console.log('\n✅ Seed process finished');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Seed process failed:', error);
    process.exit(1);
  });
