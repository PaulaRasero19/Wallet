import { Router } from "express";
import { destroyAccount, indexAccounts, patchAccount, showAccount, storeAccount } from "../controllers/accountController";
import { authenticate } from "../middlewares/authenticate";

export const accountRouter = Router();

accountRouter.use(authenticate);
accountRouter.get("/", indexAccounts);
accountRouter.post("/", storeAccount);
accountRouter.get("/:id", showAccount);
accountRouter.patch("/:id", patchAccount);
accountRouter.delete("/:id", destroyAccount);
