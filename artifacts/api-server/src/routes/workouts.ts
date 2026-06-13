import { Router } from "express";
import { db } from "@workspace/db";
import { workoutsTable, exercisesTable, workoutSetsTable } from "@workspace/db";
import { eq, sql, desc, asc } from "drizzle-orm";

const router = Router();

router.get("/workouts", async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 100, 200);
    const offset = Number(req.query.offset) || 0;

    const rows = await db
      .select({
        id: workoutsTable.id,
        name: workoutsTable.name,
        date: workoutsTable.date,
        split: workoutsTable.split,
        notes: workoutsTable.notes,
        createdAt: workoutsTable.createdAt,
        exerciseCount: sql<number>`cast(count(distinct ${exercisesTable.id}) as int)`,
        totalSets: sql<number>`cast(count(${workoutSetsTable.id}) as int)`,
      })
      .from(workoutsTable)
      .leftJoin(exercisesTable, eq(exercisesTable.workoutId, workoutsTable.id))
      .leftJoin(workoutSetsTable, eq(workoutSetsTable.exerciseId, exercisesTable.id))
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
    const { name, date, split, notes } = req.body;
    const [workout] = await db
      .insert(workoutsTable)
      .values({ name, date, split, notes: notes ?? null })
      .returning();
    res.status(201).json({ ...workout, exerciseCount: 0, totalSets: 0 });
  } catch (err) {
    req.log.error({ err }, "Failed to create workout");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/workouts/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [workout] = await db.select().from(workoutsTable).where(eq(workoutsTable.id, id));
    if (!workout) return res.status(404).json({ error: "Workout not found" });

    const exercises = await db
      .select()
      .from(exercisesTable)
      .where(eq(exercisesTable.workoutId, id))
      .orderBy(asc(exercisesTable.order), asc(exercisesTable.id));

    const exercisesWithSets = await Promise.all(
      exercises.map(async (ex) => {
        const sets = await db
          .select()
          .from(workoutSetsTable)
          .where(eq(workoutSetsTable.exerciseId, ex.id))
          .orderBy(asc(workoutSetsTable.setNumber));
        return { ...ex, sets };
      })
    );

    res.json({ ...workout, exercises: exercisesWithSets });
  } catch (err) {
    req.log.error({ err }, "Failed to get workout");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/workouts/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { name, notes } = req.body;
    const updates: Record<string, unknown> = {};
    if (name !== undefined) updates.name = name;
    if (notes !== undefined) updates.notes = notes;

    const [updated] = await db.update(workoutsTable).set(updates).where(eq(workoutsTable.id, id)).returning();
    if (!updated) return res.status(404).json({ error: "Workout not found" });

    const [counts] = await db
      .select({
        exerciseCount: sql<number>`cast(count(distinct ${exercisesTable.id}) as int)`,
        totalSets: sql<number>`cast(count(${workoutSetsTable.id}) as int)`,
      })
      .from(exercisesTable)
      .leftJoin(workoutSetsTable, eq(workoutSetsTable.exerciseId, exercisesTable.id))
      .where(eq(exercisesTable.workoutId, id));

    res.json({ ...updated, ...counts });
  } catch (err) {
    req.log.error({ err }, "Failed to update workout");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/workouts/:id", async (req, res) => {
  try {
    await db.delete(workoutsTable).where(eq(workoutsTable.id, Number(req.params.id)));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete workout");
    res.status(500).json({ error: "Internal server error" });
  }
});

// Exercises
router.post("/workouts/:id/exercises", async (req, res) => {
  try {
    const workoutId = Number(req.params.id);
    const { name, muscleGroup, notes } = req.body;

    const [{ maxOrder }] = await db
      .select({ maxOrder: sql<number>`coalesce(max(${exercisesTable.order}), -1)` })
      .from(exercisesTable)
      .where(eq(exercisesTable.workoutId, workoutId));

    const [exercise] = await db
      .insert(exercisesTable)
      .values({ workoutId, name, muscleGroup, notes: notes ?? null, order: (maxOrder ?? -1) + 1 })
      .returning();

    res.status(201).json({ ...exercise, sets: [] });
  } catch (err) {
    req.log.error({ err }, "Failed to add exercise");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/workouts/:id/exercises/:exerciseId", async (req, res) => {
  try {
    const exerciseId = Number(req.params.exerciseId);
    const { name, muscleGroup, notes } = req.body;
    const updates: Record<string, unknown> = {};
    if (name !== undefined) updates.name = name;
    if (muscleGroup !== undefined) updates.muscleGroup = muscleGroup;
    if (notes !== undefined) updates.notes = notes;

    const [updated] = await db
      .update(exercisesTable)
      .set(updates)
      .where(eq(exercisesTable.id, exerciseId))
      .returning();

    if (!updated) return res.status(404).json({ error: "Exercise not found" });

    const sets = await db
      .select()
      .from(workoutSetsTable)
      .where(eq(workoutSetsTable.exerciseId, exerciseId))
      .orderBy(asc(workoutSetsTable.setNumber));

    res.json({ ...updated, sets });
  } catch (err) {
    req.log.error({ err }, "Failed to update exercise");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/workouts/:id/exercises/:exerciseId", async (req, res) => {
  try {
    await db.delete(exercisesTable).where(eq(exercisesTable.id, Number(req.params.exerciseId)));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete exercise");
    res.status(500).json({ error: "Internal server error" });
  }
});

// Sets
router.post("/workouts/:id/exercises/:exerciseId/sets", async (req, res) => {
  try {
    const exerciseId = Number(req.params.exerciseId);
    const { reps, weightKg } = req.body;

    const [{ nextSet }] = await db
      .select({ nextSet: sql<number>`coalesce(max(${workoutSetsTable.setNumber}), 0) + 1` })
      .from(workoutSetsTable)
      .where(eq(workoutSetsTable.exerciseId, exerciseId));

    const [set] = await db
      .insert(workoutSetsTable)
      .values({
        exerciseId,
        setNumber: nextSet,
        reps,
        weightKg: weightKg != null ? String(weightKg) : null,
      })
      .returning();

    res.status(201).json(set);
  } catch (err) {
    req.log.error({ err }, "Failed to log set");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/workouts/:id/exercises/:exerciseId/sets/:setId", async (req, res) => {
  try {
    await db.delete(workoutSetsTable).where(eq(workoutSetsTable.id, Number(req.params.setId)));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete set");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
