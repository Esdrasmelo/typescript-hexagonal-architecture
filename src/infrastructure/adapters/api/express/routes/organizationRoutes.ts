import { RequestHandler, Router } from "express";
import {
  ActivityController,
  MembershipController,
  OrganizationController,
} from "../controllers";
import { asyncHandler } from "../middlewares";
import { readActor } from "../protocols";

export const makeOrganizationRouter = (
  organizations: OrganizationController,
  memberships: MembershipController,
  activity: ActivityController,
  authMiddleware: RequestHandler
): Router => {
  const router = Router();

  router.use("/organizations", authMiddleware);

  router.post(
    "/organizations",
    asyncHandler(async (request, response) => {
      const { statusCode, body } = await organizations.Create(
        request.body,
        readActor(request)
      );

      response.status(statusCode).json(body);
    })
  );

  router.get(
    "/organizations",
    asyncHandler(async (request, response) => {
      const { statusCode, body } = await organizations.List(
        readActor(request)
      );

      response.status(statusCode).json(body);
    })
  );

  router.get(
    "/organizations/:slug",
    asyncHandler(async (request, response) => {
      const { statusCode, body } = await organizations.Get(
        request.params,
        readActor(request)
      );

      response.status(statusCode).json(body);
    })
  );

  router.patch(
    "/organizations/:slug",
    asyncHandler(async (request, response) => {
      const { statusCode, body } = await organizations.Rename(
        request.params,
        request.body,
        readActor(request)
      );

      response.status(statusCode).json(body);
    })
  );

  router.post(
    "/organizations/:slug/members",
    asyncHandler(async (request, response) => {
      const { statusCode, body } = await memberships.Add(
        request.params,
        request.body,
        readActor(request)
      );

      response.status(statusCode).json(body);
    })
  );

  router.get(
    "/organizations/:slug/members",
    asyncHandler(async (request, response) => {
      const { statusCode, body } = await memberships.List(
        request.params,
        readActor(request)
      );

      response.status(statusCode).json(body);
    })
  );

  router.patch(
    "/organizations/:slug/members/:userId",
    asyncHandler(async (request, response) => {
      const { statusCode, body } = await memberships.ChangeRole(
        request.params,
        request.body,
        readActor(request)
      );

      response.status(statusCode).json(body);
    })
  );

  router.delete(
    "/organizations/:slug/members/:userId",
    asyncHandler(async (request, response) => {
      const { statusCode } = await memberships.Remove(
        request.params,
        readActor(request)
      );

      response.status(statusCode).end();
    })
  );

  router.get(
    "/organizations/:slug/audit-events",
    asyncHandler(async (request, response) => {
      const { statusCode, body } = await activity.ListAuditEvents(
        request.params,
        request.query,
        readActor(request)
      );

      response.status(statusCode).json(body);
    })
  );

  return router;
};
