import { Router } from "express";
import { destroyTransaction, indexTransactions, patchTransaction, showTransaction, storeTransaction, storeTransfer } from "../controllers/transactionController";
import { authenticate } from "../middlewares/authenticate";

export const transactionRouter = Router();

transactionRouter.use(authenticate);
transactionRouter.get("/", indexTransactions);
transactionRouter.post("/", storeTransaction);
transactionRouter.post("/transfer", storeTransfer);
transactionRouter.get("/:id", showTransaction);
transactionRouter.patch("/:id", patchTransaction);
transactionRouter.delete("/:id", destroyTransaction);
