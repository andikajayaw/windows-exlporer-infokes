import { Elysia, t } from "elysia";
import { ApiError } from "../errors";
import { fileService } from "../services/fileService";
import { folderService } from "../services/folderService";

const parseId = (id: string): number | null => {
  const num = Number(id);
  return Number.isFinite(num) && num > 0 ? Math.floor(num) : null;
};

export const folderRoutes = new Elysia({ prefix: "/api" })
  // GET /api/folders/roots - List root folders only (for lazy loading) - MUST come before :id
  .get("/folders/roots", async ({ query, set }) => {
    const limit = query.limit ? Number(query.limit) : undefined;
    const offset = query.offset ? Number(query.offset) : 0;

    if (limit !== undefined && (!Number.isFinite(limit) || limit < 1)) {
      set.status = 400;
      return { error: "Invalid limit." };
    }

    const pagination = limit ? { limit, offset } : undefined;
    const [folders, total] = await Promise.all([
      folderService.listRoots(pagination),
      folderService.countRoots()
    ]);
    
    return {
      folders,
      meta: { total, limit: pagination?.limit ?? null, offset }
    };
  })

  // GET /api/folders - List all folders with files
  .get("/folders", async ({ query, set }) => {
    const limit = query.limit ? Number(query.limit) : undefined;
    const offset = query.offset ? Number(query.offset) : 0;

    if (limit !== undefined && (!Number.isFinite(limit) || limit < 1)) {
      set.status = 400;
      return { error: "Invalid limit." };
    }

    const pagination = limit ? { limit, offset } : undefined;
    const { folders, files } = await folderService.listWithFiles(pagination);
    
    return {
      folders,
      files,
      ...(pagination && { meta: { limit: pagination.limit, offset: pagination.offset } })
    };
  })

  // GET /api/folders/:id - Get single folder
  .get("/folders/:id", async ({ params, set }) => {
    const folderId = parseId(params.id);
    if (folderId === null) {
      set.status = 400;
      return { error: "Invalid folder id." };
    }

    const folder = await folderService.getById(folderId);
    if (!folder) {
      set.status = 404;
      return { error: "Folder not found." };
    }
    return { folder };
  })

  // GET /api/folders/:id/children - Get folder children
  .get("/folders/:id/children", async ({ params, query, set }) => {
    const folderId = parseId(params.id);
    if (folderId === null) {
      set.status = 400;
      return { error: "Invalid folder id." };
    }

    const type = query.type === "folders" || query.type === "files" ? query.type : "all";
    const limit = query.limit ? Number(query.limit) : undefined;
    const offset = query.offset ? Number(query.offset) : 0;

    if (limit !== undefined && (!Number.isFinite(limit) || limit < 1)) {
      set.status = 400;
      return { error: "Invalid limit." };
    }

    const pagination = limit ? { limit, offset } : undefined;

    const [folders, files] = await Promise.all([
      type === "files" ? [] : folderService.listChildren(folderId, pagination),
      type === "folders" ? [] : fileService.listByFolderId(folderId, pagination)
    ]);

    return {
      folders,
      files,
      ...(pagination && { meta: { limit: pagination.limit, offset: pagination.offset } })
    };
  })

  // POST /api/folders - Create folder
  .post("/folders", async ({ body, set }) => {
    if (!body.name || typeof body.name !== "string" || !body.name.trim()) {
      set.status = 400;
      return { error: "Folder name is required." };
    }

    try {
      const folder = await folderService.create({
        name: body.name.trim(),
        parentId: body.parentId ?? null
      });
      set.status = 201;
      return { folder };
    } catch (err) {
      if (err instanceof ApiError) {
        set.status = err.status;
        return { error: err.message };
      }
      set.status = 500;
      return { error: "Failed to create folder." };
    }
  }, {
    body: t.Object({
      name: t.String(),
      parentId: t.Optional(t.Nullable(t.Number()))
    })
  })

  // PUT /api/folders/:id - Update folder
  .put("/folders/:id", async ({ params, body, set }) => {
    const folderId = parseId(params.id);
    if (folderId === null) {
      set.status = 400;
      return { error: "Invalid folder id." };
    }

    if (!body.name && body.parentId === undefined) {
      set.status = 400;
      return { error: "No updates provided." };
    }

    try {
      const folder = await folderService.update(folderId, {
        name: body.name?.trim(),
        parentId: body.parentId
      });
      return { folder };
    } catch (err) {
      if (err instanceof ApiError) {
        set.status = err.status;
        return { error: err.message };
      }
      set.status = 500;
      return { error: "Failed to update folder." };
    }
  }, {
    body: t.Object({
      name: t.Optional(t.String()),
      parentId: t.Optional(t.Nullable(t.Number()))
    })
  })

  // DELETE /api/folders/:id - Delete folder
  .delete("/folders/:id", async ({ params, set }) => {
    const folderId = parseId(params.id);
    if (folderId === null) {
      set.status = 400;
      return { error: "Invalid folder id." };
    }

    try {
      await folderService.remove(folderId);
      set.status = 204;
      return;
    } catch (err) {
      if (err instanceof ApiError) {
        set.status = err.status;
        return { error: err.message };
      }
      set.status = 500;
      return { error: "Failed to delete folder." };
    }
  });
