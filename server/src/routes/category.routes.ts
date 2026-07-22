import { Router } from "express";
import { destroyCategory, indexCategories, patchCategory, storeCategory } from "../controllers/categoryController";
import { authenticate } from "../middlewares/authenticate";

export const categoryRouter = Router();

categoryRouter.use(authenticate);
categoryRouter.get("/", indexCategories);
categoryRouter.post("/", storeCategory);
categoryRouter.patch("/:id", patchCategory);
categoryRouter.delete("/:id", destroyCategory);
