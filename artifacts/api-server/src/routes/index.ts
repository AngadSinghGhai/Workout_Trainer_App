import { Router, type IRouter } from "express";
import healthRouter from "./health";
import workoutsRouter from "./workouts";
import statsRouter from "./stats";
import templatesRouter from "./templates";

const router: IRouter = Router();

router.use(healthRouter);
router.use(workoutsRouter);
router.use(statsRouter);
router.use(templatesRouter);

export default router;
