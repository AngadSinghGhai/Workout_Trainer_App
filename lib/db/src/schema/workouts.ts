import { pgTable, serial, text, integer, numeric, date, timestamp, json } from "drizzle-orm/pg-core";

export const splitEnum = ["Push", "Pull", "Legs", "Upper", "Arms", "Lower"] as const;
export type Split = typeof splitEnum[number];

export const workoutsTable = pgTable("workouts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  date: date("date").notNull(),
  split: text("split").notNull().$type<Split>(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type Workout = typeof workoutsTable.$inferSelect;

export const exercisesTable = pgTable("exercises", {
  id: serial("id").primaryKey(),
  workoutId: integer("workout_id").notNull().references(() => workoutsTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  muscleGroup: text("muscle_group").notNull(),
  notes: text("notes"),
  order: integer("order").notNull().default(0),
});
export type Exercise = typeof exercisesTable.$inferSelect;

export const workoutSetsTable = pgTable("workout_sets", {
  id: serial("id").primaryKey(),
  exerciseId: integer("exercise_id").notNull().references(() => exercisesTable.id, { onDelete: "cascade" }),
  setNumber: integer("set_number").notNull(),
  reps: integer("reps").notNull(),
  weightKg: numeric("weight_kg", { precision: 6, scale: 2 }),
  completedAt: timestamp("completed_at").defaultNow().notNull(),
});
export type WorkoutSet = typeof workoutSetsTable.$inferSelect;

export const exerciseTemplatesTable = pgTable("exercise_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  muscleGroup: text("muscle_group").notNull(),
  split: text("split").notNull().$type<Split>(),
  musclesWorked: text("muscles_worked").notNull(),
  formTip: text("form_tip").notNull(),
  alternatives: json("alternatives").$type<string[]>().notNull().default([]),
});
export type ExerciseTemplate = typeof exerciseTemplatesTable.$inferSelect;
