import type { Request } from "express";
import type { Types } from "mongoose";

export type RequestContext = {
  requestId?: string;
};

export type AuthenticatedUser = {
  id: string;
  mongoId: Types.ObjectId;
  email: string;
  isDemo: boolean;
};

export type FinFlowRequest = Request & {
  user?: AuthenticatedUser;
  context?: RequestContext;
};
