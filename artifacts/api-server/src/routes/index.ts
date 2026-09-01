import { Router, type IRouter } from "express";
import healthRouter from "./health";
import amritaRouter from "./amrita";

const router: IRouter = Router();

router.use(healthRouter);
router.use(amritaRouter);

export default router;
