import { Router } from "express";
import { db } from "@workspace/db";
import { workoutsTable, exercisesTable } from "@workspace/db";
import { sql, gte, and } from "drizzle-orm";

const router = Router();

router.get("/stats/summary", async (req, res) => {
  try {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const weekStr = startOfWeek.toISOString().split("T")[0];
    const monthStr = startOfMonth.toISOString().split("T")[0];

    const [totals] = await db
      .select({
        totalWorkouts: sql<number>`cast(count(*) as int)`,
        totalDurationMinutes: sql<number>`cast(coalesce(sum(duration_minutes), 0) as int)`,
        avgDurationMinutes: sql<number>`cast(coalesce(avg(duration_minutes), 0) as int)`,
      })
      .from(workoutsTable);

    const [{ thisWeekWorkouts }] = await db
      .select({ thisWeekWorkouts: sql<number>`cast(count(*) as int)` })
      .from(workoutsTable)
      .where(gte(workoutsTable.date, weekStr));

    const [{ thisMonthWorkouts }] = await db
      .select({ thisMonthWorkouts: sql<number>`cast(count(*) as int)` })
      .from(workoutsTable)
      .where(gte(workoutsTable.date, monthStr));

    // Calculate streak: consecutive days with workouts going back from today
    const recentWorkouts = await db
      .select({ date: workoutsTable.date })
      .from(workoutsTable)
      .orderBy(sql`date desc`);

    let streak = 0;
    const uniqueDates = [...new Set(recentWorkouts.map((r) => r.date))].sort((a, b) => b.localeCompare(a));
    const todayStr = now.toISOString().split("T")[0];
    const yesterdayStr = new Date(now.getTime() - 86400000).toISOString().split("T")[0];

    if (uniqueDates.length > 0 && (uniqueDates[0] === todayStr || uniqueDates[0] === yesterdayStr)) {
      let current = new Date(uniqueDates[0]);
      for (const d of uniqueDates) {
        const dDate = new Date(d);
        const diffDays = Math.round((current.getTime() - dDate.getTime()) / 86400000);
        if (diffDays <= 1) {
          streak++;
          current = dDate;
        } else {
          break;
        }
      }
    }

    res.json({
      totalWorkouts: totals.totalWorkouts,
      totalDurationMinutes: totals.totalDurationMinutes,
      thisWeekWorkouts,
      thisMonthWorkouts,
      avgDurationMinutes: totals.avgDurationMinutes,
      currentStreak: streak,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get stats summary");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/stats/weekly", async (req, res) => {
  try {
    const weeks = Math.min(Number(req.query.weeks) || 8, 52);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - weeks * 7);
    const cutoffStr = cutoff.toISOString().split("T")[0];

    const rows = await db
      .select({
        week: sql<string>`to_char(date_trunc('week', date::date), 'YYYY-MM-DD')`,
        count: sql<number>`cast(count(*) as int)`,
        totalDurationMinutes: sql<number>`cast(coalesce(sum(duration_minutes), 0) as int)`,
      })
      .from(workoutsTable)
      .where(gte(workoutsTable.date, cutoffStr))
      .groupBy(sql`date_trunc('week', date::date)`)
      .orderBy(sql`date_trunc('week', date::date)`);

    res.json(rows);
  } catch (err) {
    req.log.error({ err }, "Failed to get weekly stats");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/stats/muscle-groups", async (req, res) => {
  try {
    const rows = await db
      .select({
        muscleGroup: exercisesTable.muscleGroup,
        count: sql<number>`cast(count(*) as int)`,
      })
      .from(exercisesTable)
      .groupBy(exercisesTable.muscleGroup)
      .orderBy(sql`count(*) desc`);

    res.json(rows);
  } catch (err) {
    req.log.error({ err }, "Failed to get muscle group stats");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
