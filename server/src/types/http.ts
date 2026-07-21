import type { Request } from "express";

export type RequestContext = {
  requestId?: string;
};

export type FinFlowRequest = Request & {
  context?: RequestContext;
};
