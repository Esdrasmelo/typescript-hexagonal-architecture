import { Router } from "express";

export const makeHealthRouter = (): Router => {
  const router = Router();

  router.get("/health", (_request, response) => {
    response.status(200).json({ status: "ok", uptime: process.uptime() });
  });

  return router;
};
