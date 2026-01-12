import { Elysia } from "elysia";
import { searchService, type MatchMode, type SearchScope } from "../services/searchService";

export const searchRoutes = new Elysia({ prefix: "/api/v1" })
  // GET /api/v1/search - Search folders and files
  .get("/search", async ({ query, set }) => {
    const q = query.q?.trim();
    if (!q) {
      set.status = 400;
      return { error: "Search query is required." };
    }

    const scope: SearchScope = 
      query.scope === "folders" || query.scope === "files" ? query.scope : "all";
    const match: MatchMode = query.match === "contains" ? "contains" : "prefix";
    const limit = query.limit ? Number(query.limit) : undefined;
    const offset = query.offset ? Number(query.offset) : 0;

    if (limit !== undefined && (!Number.isFinite(limit) || limit < 1)) {
      set.status = 400;
      return { error: "Invalid limit." };
    }

    const pagination = limit ? { limit, offset } : undefined;

    const results = await searchService.search({
      query: q,
      scope,
      match,
      pagination
    });

    return {
      folders: results.folders,
      files: results.files,
      meta: {
        query: q,
        scope,
        match,
        limit: pagination?.limit ?? null,
        offset: pagination?.offset ?? 0,
        total: results.totals
      }
    };
  });
