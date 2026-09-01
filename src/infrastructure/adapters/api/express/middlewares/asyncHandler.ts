import { NextFunction, Request, RequestHandler, Response } from "express";

export const asyncHandler =
  (handler: RequestHandler): RequestHandler =>
  (request: Request, response: Response, next: NextFunction) => {
    Promise.resolve(handler(request, response, next)).catch(next);
  };
