import { Router, type IRouter } from "express";
import healthRouter from "./health";
import workoutsRouter from "./workouts";
import progressRouter from "./progress";
import templatesRouter from "./templates";

const router: IRouter = Router();

router.use(healthRouter);
router.use(workoutsRouter);
router.use(progressRouter);
router.use(templatesRouter);

export default router;
