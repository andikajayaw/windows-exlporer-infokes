import { Elysia, t } from "elysia";
import { ApiError } from "../errors";
import { fileService } from "../services/fileService";

const parseId = (id: string): number | null => {
  const num = Number(id);
  return Number.isFinite(num) && num > 0 ? Math.floor(num) : null;
};

export const fileRoutes = new Elysia({ prefix: "/api" })
  // GET /api/files - List all files
  .get("/files", async ({ query, set }) => {
    const limit = query.limit ? Number(query.limit) : undefined;
    const offset = query.offset ? Number(query.offset) : 0;

    if (limit !== undefined && (!Number.isFinite(limit) || limit < 1)) {
      set.status = 400;
      return { error: "Invalid limit." };
    }

    const pagination = limit ? { limit, offset } : undefined;
    const files = await fileService.listAll(pagination);
    
    return {
      files,
      ...(pagination && { meta: { limit: pagination.limit, offset: pagination.offset } })
    };
  })

  // GET /api/files/:id - Get single file
  .get("/files/:id", async ({ params, set }) => {
    const fileId = parseId(params.id);
    if (fileId === null) {
      set.status = 400;
      return { error: "Invalid file id." };
    }

    const file = await fileService.getById(fileId);
    if (!file) {
      set.status = 404;
      return { error: "File not found." };
    }
    return { file };
  })

  // POST /api/files - Create file
  .post("/files", async ({ body, set }) => {
    if (!body.name || typeof body.name !== "string" || !body.name.trim()) {
      set.status = 400;
      return { error: "File name is required." };
    }

    if (!body.folderId || !Number.isFinite(body.folderId)) {
      set.status = 400;
      return { error: "Invalid folder id." };
    }

    try {
      const file = await fileService.create({
        name: body.name.trim(),
        folderId: body.folderId
      });
      set.status = 201;
      return { file };
    } catch (err) {
      if (err instanceof ApiError) {
        set.status = err.status;
        return { error: err.message };
      }
      set.status = 500;
      return { error: "Failed to create file." };
    }
  }, {
    body: t.Object({
      name: t.String(),
      folderId: t.Number()
    })
  })

  // PUT /api/files/:id - Update file
  .put("/files/:id", async ({ params, body, set }) => {
    const fileId = parseId(params.id);
    if (fileId === null) {
      set.status = 400;
      return { error: "Invalid file id." };
    }

    if (!body.name && body.folderId === undefined) {
      set.status = 400;
      return { error: "No updates provided." };
    }

    try {
      const file = await fileService.update(fileId, {
        name: body.name?.trim(),
        folderId: body.folderId
      });
      return { file };
    } catch (err) {
      if (err instanceof ApiError) {
        set.status = err.status;
        return { error: err.message };
      }
      set.status = 500;
      return { error: "Failed to update file." };
    }
  }, {
    body: t.Object({
      name: t.Optional(t.String()),
      folderId: t.Optional(t.Number())
    })
  })

  // DELETE /api/files/:id - Delete file
  .delete("/files/:id", async ({ params, set }) => {
    const fileId = parseId(params.id);
    if (fileId === null) {
      set.status = 400;
      return { error: "Invalid file id." };
    }

    try {
      await fileService.remove(fileId);
      set.status = 204;
      return;
    } catch (err) {
      if (err instanceof ApiError) {
        set.status = err.status;
        return { error: err.message };
      }
      set.status = 500;
      return { error: "Failed to delete file." };
    }
  });
