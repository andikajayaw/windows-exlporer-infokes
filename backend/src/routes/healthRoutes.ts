import { Elysia } from "elysia";

export const healthRoutes = new Elysia({ prefix: "/api/v1" })
  .get("/health", () => ({ ok: true }));
