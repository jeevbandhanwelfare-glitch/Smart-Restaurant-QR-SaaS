import { Router, type IRouter } from "express";
import healthRouter from "./health";
import restaurantRouter from "./restaurant";

const router: IRouter = Router();

router.use(healthRouter);
router.use(restaurantRouter);

export default router;
