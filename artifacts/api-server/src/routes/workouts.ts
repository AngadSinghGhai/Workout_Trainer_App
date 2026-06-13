import { Router } from "express";
import { db } from "@workspace/db";
import { workoutsTable, exercisesTable } from "@workspace/db";
import { eq, sql, desc } from "drizzle-orm";
import { logger } from "../lib/logger";

const router = Router();

router.get("/workouts", async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 50;
    const offset = Number(req.query.offset) || 0;

    const rows = await db
      .select({
        id: workoutsTable.id,
        name: workoutsTable.name,
        date: workoutsTable.date,
        type: workoutsTable.type,
        durationMinutes: workoutsTable.durationMinutes,
        notes: workoutsTable.notes,
        createdAt: workoutsTable.createdAt,
        exerciseCount: sql<number>`cast(count(${exercisesTable.id}) as int)`,
      })
      .from(workoutsTable)
      .leftJoin(exercisesTable, eq(exercisesTable.workoutId, workoutsTable.id))
      .groupBy(workoutsTable.id)
      .orderBy(desc(workoutsTable.date), desc(workoutsTable.createdAt))
      .limit(limit)
      .offset(offset);

    res.json(rows);
  } catch (err) {
    req.log.error({ err }, "Failed to list workouts");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/workouts", async (req, res) => {
  try {
    const { name, date, type, durationMinutes, notes } = req.body;
    const [workout] = await db
      .insert(workoutsTable)
      .values({ name, date, type, durationMinutes: durationMinutes ?? null, notes: notes ?? null })
      .returning();
    res.status(201).json({ ...workout, exerciseCount: 0 });
  } catch (err) {
    req.log.error({ err }, "Failed to create workout");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/workouts/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [workout] = await db
      .select()
      .from(workoutsTable)
      .where(eq(workoutsTable.id, id));

    if (!workout) {
      return res.status(404).json({ error: "Workout not found" });
    }

    const exercises = await db
      .select()
      .from(exercisesTable)
      .where(eq(exercisesTable.workoutId, id))
      .orderBy(exercisesTable.order, exercisesTable.id);

    res.json({ ...workout, exercises });
  } catch (err) {
    req.log.error({ err }, "Failed to get workout");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/workouts/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { name, date, type, durationMinutes, notes } = req.body;

    const updates: Record<string, unknown> = {};
    if (name !== undefined) updates.name = name;
    if (date !== undefined) updates.date = date;
    if (type !== undefined) updates.type = type;
    if (durationMinutes !== undefined) updates.durationMinutes = durationMinutes;
    if (notes !== undefined) updates.notes = notes;

    const [updated] = await db
      .update(workoutsTable)
      .set(updates)
      .where(eq(workoutsTable.id, id))
      .returning();

    if (!updated) return res.status(404).json({ error: "Workout not found" });

    const [{ exerciseCount }] = await db
      .select({ exerciseCount: sql<number>`cast(count(*) as int)` })
      .from(exercisesTable)
      .where(eq(exercisesTable.workoutId, id));

    res.json({ ...updated, exerciseCount });
  } catch (err) {
    req.log.error({ err }, "Failed to update workout");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/workouts/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    await db.delete(workoutsTable).where(eq(workoutsTable.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete workout");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/workouts/:id/exercises", async (req, res) => {
  try {
    const workoutId = Number(req.params.id);
    const { name, muscleGroup, sets, reps, weightKg, durationMinutes, notes } = req.body;

    const [{ maxOrder }] = await db
      .select({ maxOrder: sql<number>`coalesce(max(${exercisesTable.order}), -1)` })
      .from(exercisesTable)
      .where(eq(exercisesTable.workoutId, workoutId));

    const [exercise] = await db
      .insert(exercisesTable)
      .values({
        workoutId,
        name,
        muscleGroup,
        sets: sets ?? null,
        reps: reps ?? null,
        weightKg: weightKg != null ? String(weightKg) : null,
        durationMinutes: durationMinutes ?? null,
        notes: notes ?? null,
        order: (maxOrder ?? -1) + 1,
      })
      .returning();

    res.status(201).json(exercise);
  } catch (err) {
    req.log.error({ err }, "Failed to add exercise");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/workouts/:id/exercises/:exerciseId", async (req, res) => {
  try {
    const exerciseId = Number(req.params.exerciseId);
    const { name, muscleGroup, sets, reps, weightKg, durationMinutes, notes } = req.body;

    const updates: Record<string, unknown> = {};
    if (name !== undefined) updates.name = name;
    if (muscleGroup !== undefined) updates.muscleGroup = muscleGroup;
    if (sets !== undefined) updates.sets = sets;
    if (reps !== undefined) updates.reps = reps;
    if (weightKg !== undefined) updates.weightKg = weightKg != null ? String(weightKg) : null;
    if (durationMinutes !== undefined) updates.durationMinutes = durationMinutes;
    if (notes !== undefined) updates.notes = notes;

    const [updated] = await db
      .update(exercisesTable)
      .set(updates)
      .where(eq(exercisesTable.id, exerciseId))
      .returning();

    if (!updated) return res.status(404).json({ error: "Exercise not found" });
    res.json(updated);
  } catch (err) {
    req.log.error({ err }, "Failed to update exercise");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/workouts/:id/exercises/:exerciseId", async (req, res) => {
  try {
    const exerciseId = Number(req.params.exerciseId);
    await db.delete(exercisesTable).where(eq(exercisesTable.id, exerciseId));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete exercise");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
