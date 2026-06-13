import { Router } from "express";
import { db } from "@workspace/db";
import { exerciseTemplatesTable } from "@workspace/db";
import { asc } from "drizzle-orm";

const router = Router();

router.get("/exercise-templates", async (req, res) => {
  try {
    const templates = await db
      .select()
      .from(exerciseTemplatesTable)
      .orderBy(asc(exerciseTemplatesTable.split), asc(exerciseTemplatesTable.name));
    res.json(templates);
  } catch (err) {
    req.log.error({ err }, "Failed to list templates");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
