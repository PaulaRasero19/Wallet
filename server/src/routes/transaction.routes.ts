import { Router } from "express";
import { destroyTransaction, indexTransactions, patchTransaction, showTransaction, storeTransaction } from "../controllers/transactionController";
import { authenticate } from "../middlewares/authenticate";

export const transactionRouter = Router();

transactionRouter.use(authenticate);
transactionRouter.get("/", indexTransactions);
transactionRouter.post("/", storeTransaction);
transactionRouter.get("/:id", showTransaction);
transactionRouter.patch("/:id", patchTransaction);
transactionRouter.delete("/:id", destroyTransaction);
