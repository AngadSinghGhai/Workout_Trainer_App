import { Router } from "express";
import { db } from "@workspace/db";
import { workoutsTable, exercisesTable, workoutSetsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";

const router = Router();

router.get("/progress", async (req, res) => {
  try {
    const rows = await db
      .select({
        exerciseName: exercisesTable.name,
        muscleGroup: exercisesTable.muscleGroup,
        date: workoutsTable.date,
        maxWeightKg: sql<number | null>`max(${workoutSetsTable.weightKg}::numeric)`,
        totalVolume: sql<number>`coalesce(sum(${workoutSetsTable.reps} * coalesce(${workoutSetsTable.weightKg}::numeric, 0)), 0)`,
        totalReps: sql<number>`cast(coalesce(sum(${workoutSetsTable.reps}), 0) as int)`,
      })
      .from(exercisesTable)
      .innerJoin(workoutsTable, eq(workoutsTable.id, exercisesTable.workoutId))
      .innerJoin(workoutSetsTable, eq(workoutSetsTable.exerciseId, exercisesTable.id))
      .groupBy(exercisesTable.name, exercisesTable.muscleGroup, workoutsTable.date)
      .orderBy(exercisesTable.name, workoutsTable.date);

    // Group by exercise name
    const grouped: Record<string, { exerciseName: string; muscleGroup: string; dataPoints: unknown[] }> = {};
    for (const row of rows) {
      if (!grouped[row.exerciseName]) {
        grouped[row.exerciseName] = {
          exerciseName: row.exerciseName,
          muscleGroup: row.muscleGroup,
          dataPoints: [],
        };
      }
      grouped[row.exerciseName].dataPoints.push({
        date: row.date,
        maxWeightKg: row.maxWeightKg != null ? Number(row.maxWeightKg) : null,
        totalVolume: Number(row.totalVolume),
        totalReps: row.totalReps,
      });
    }

    res.json(Object.values(grouped));
  } catch (err) {
    req.log.error({ err }, "Failed to get progress");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/personal-records", async (req, res) => {
  try {
    const rows = await db
      .select({
        exerciseName: exercisesTable.name,
        muscleGroup: exercisesTable.muscleGroup,
        maxWeightKg: sql<number | null>`max(${workoutSetsTable.weightKg}::numeric)`,
        maxReps: sql<number>`cast(max(${workoutSetsTable.reps}) as int)`,
        achievedDate: sql<string>`(
          select w2.date from workouts w2
          inner join exercises e2 on e2.workout_id = w2.id
          inner join workout_sets ws2 on ws2.exercise_id = e2.id
          where e2.name = ${exercisesTable.name}
          order by ws2.weight_kg::numeric desc nulls last, ws2.reps desc
          limit 1
        )`,
        workoutName: sql<string>`(
          select w2.name from workouts w2
          inner join exercises e2 on e2.workout_id = w2.id
          inner join workout_sets ws2 on ws2.exercise_id = e2.id
          where e2.name = ${exercisesTable.name}
          order by ws2.weight_kg::numeric desc nulls last, ws2.reps desc
          limit 1
        )`,
      })
      .from(exercisesTable)
      .innerJoin(workoutSetsTable, eq(workoutSetsTable.exerciseId, exercisesTable.id))
      .groupBy(exercisesTable.name, exercisesTable.muscleGroup)
      .orderBy(exercisesTable.muscleGroup, exercisesTable.name);

    res.json(
      rows.map((r) => ({
        ...r,
        maxWeightKg: r.maxWeightKg != null ? Number(r.maxWeightKg) : null,
      }))
    );
  } catch (err) {
    req.log.error({ err }, "Failed to get personal records");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
