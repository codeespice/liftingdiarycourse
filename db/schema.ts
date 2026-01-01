import { pgTable, uuid, varchar, text, timestamp, integer, decimal, boolean, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Users table - authentication and profile data
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  username: varchar('username', { length: 100 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => ({
  emailIdx: index('users_email_idx').on(table.email),
  usernameIdx: index('users_username_idx').on(table.username),
}));

// Workouts table - workout sessions owned by users
export const workouts = pgTable('workouts', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  date: timestamp('date', { withTimezone: true }).notNull().defaultNow(),
  notes: text('notes'),
  durationMinutes: integer('duration_minutes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => ({
  userIdIdx: index('workouts_user_id_idx').on(table.userId),
  userDateIdx: index('workouts_user_date_idx').on(table.userId, table.date),
  createdAtIdx: index('workouts_created_at_idx').on(table.createdAt),
}));

// Exercise templates table - normalized reference data for exercises
export const exerciseTemplates = pgTable('exercise_templates', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull().unique(),
  category: varchar('category', { length: 100 }),
  equipmentRequired: varchar('equipment_required', { length: 255 }),
  description: text('description'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => ({
  nameIdx: index('exercise_templates_name_idx').on(table.name),
  categoryIdx: index('exercise_templates_category_idx').on(table.category),
}));

// Exercises table - exercise instances within a workout
export const exercises = pgTable('exercises', {
  id: uuid('id').defaultRandom().primaryKey(),
  workoutId: uuid('workout_id').notNull().references(() => workouts.id, { onDelete: 'cascade' }),
  templateId: uuid('template_id').references(() => exerciseTemplates.id, { onDelete: 'set null' }),
  exerciseName: varchar('exercise_name', { length: 255 }).notNull(),
  exerciseType: varchar('exercise_type', { length: 100 }),
  orderInWorkout: integer('order_in_workout').notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => ({
  workoutIdIdx: index('exercises_workout_id_idx').on(table.workoutId),
  workoutOrderIdx: index('exercises_workout_order_idx').on(table.workoutId, table.orderInWorkout),
  exerciseNameIdx: index('exercises_name_idx').on(table.exerciseName),
  templateIdIdx: index('exercises_template_id_idx').on(table.templateId),
}));

// Sets table - individual sets for each exercise
export const sets = pgTable('sets', {
  id: uuid('id').defaultRandom().primaryKey(),
  exerciseId: uuid('exercise_id').notNull().references(() => exercises.id, { onDelete: 'cascade' }),
  setNumber: integer('set_number').notNull(),
  reps: integer('reps').notNull(),
  weightKg: decimal('weight_kg', { precision: 6, scale: 2 }),
  rpe: decimal('rpe', { precision: 3, scale: 1 }),
  restSeconds: integer('rest_seconds'),
  isWarmup: boolean('is_warmup').notNull().default(false),
  isFailure: boolean('is_failure').notNull().default(false),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => ({
  exerciseIdIdx: index('sets_exercise_id_idx').on(table.exerciseId),
  exerciseSetIdx: index('sets_exercise_set_idx').on(table.exerciseId, table.setNumber),
}));

// Relations for Drizzle's relational query API

export const usersRelations = relations(users, ({ many }) => ({
  workouts: many(workouts),
}));

export const workoutsRelations = relations(workouts, ({ one, many }) => ({
  user: one(users, {
    fields: [workouts.userId],
    references: [users.id],
  }),
  exercises: many(exercises),
}));

export const exerciseTemplatesRelations = relations(exerciseTemplates, ({ many }) => ({
  exercises: many(exercises),
}));

export const exercisesRelations = relations(exercises, ({ one, many }) => ({
  workout: one(workouts, {
    fields: [exercises.workoutId],
    references: [workouts.id],
  }),
  template: one(exerciseTemplates, {
    fields: [exercises.templateId],
    references: [exerciseTemplates.id],
  }),
  sets: many(sets),
}));

export const setsRelations = relations(sets, ({ one }) => ({
  exercise: one(exercises, {
    fields: [sets.exerciseId],
    references: [exercises.id],
  }),
}));
