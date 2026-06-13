import { pgTable, serial, text, integer, numeric, date, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const workoutTypeEnum = ["strength", "cardio", "flexibility", "hiit", "sport", "other"] as const;

export const workoutsTable = pgTable("workouts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  date: date("date").notNull(),
  type: text("type").notNull().$type<typeof workoutTypeEnum[number]>(),
  durationMinutes: integer("duration_minutes"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertWorkoutSchema = createInsertSchema(workoutsTable).omit({ id: true, createdAt: true });
export type InsertWorkout = z.infer<typeof insertWorkoutSchema>;
export type Workout = typeof workoutsTable.$inferSelect;

export const exercisesTable = pgTable("exercises", {
  id: serial("id").primaryKey(),
  workoutId: integer("workout_id").notNull().references(() => workoutsTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  muscleGroup: text("muscle_group").notNull(),
  sets: integer("sets"),
  reps: integer("reps"),
  weightKg: numeric("weight_kg", { precision: 6, scale: 2 }),
  durationMinutes: integer("duration_minutes"),
  notes: text("notes"),
  order: integer("order").notNull().default(0),
});

export const insertExerciseSchema = createInsertSchema(exercisesTable).omit({ id: true });
export type InsertExercise = z.infer<typeof insertExerciseSchema>;
export type Exercise = typeof exercisesTable.$inferSelect;

export const exerciseTemplatesTable = pgTable("exercise_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  muscleGroup: text("muscle_group").notNull(),
  type: text("type").notNull().$type<typeof workoutTypeEnum[number]>(),
});

export const insertExerciseTemplateSchema = createInsertSchema(exerciseTemplatesTable).omit({ id: true });
export type InsertExerciseTemplate = z.infer<typeof insertExerciseTemplateSchema>;
export type ExerciseTemplate = typeof exerciseTemplatesTable.$inferSelect;
