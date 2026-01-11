import { describe, expect, it } from "bun:test";
import { SimpleCache } from "../cache";
import { ApiError } from "../errors";
import { createFolderService } from "./folderService";

const buildService = () => {
  const folders = [
    { id: 1, name: "Root", parentId: null },
    { id: 2, name: "Child", parentId: 1 },
    { id: 3, name: "Grandchild", parentId: 2 }
  ];

  let deletedFolderIds: number[] = [];
  let deletedFileFolderIds: number[] = [];

  const folderRepository = {
    listAll: async () => folders,
    listNodes: async () =>
      folders.map((folder) => ({ id: folder.id, parentId: folder.parentId })),
    listChildren: async (parentId: number) =>
      folders.filter((folder) => folder.parentId === parentId),
    findById: async (id: number) =>
      folders.find((folder) => folder.id === id) ?? null,
    getParentId: async (id: number) => {
      const found = folders.find((folder) => folder.id === id);
      return found ? { parentId: found.parentId } : null;
    },
    create: async (data: { name: string; parentId?: number | null }) => {
      const id = folders.length + 1;
      const folder = {
        id,
        name: data.name,
        parentId: data.parentId ?? null
      };
      folders.push(folder);
      return folder;
    },
    update: async (id: number, data: { name?: string; parentId?: number | null }) => {
      const folder = folders.find((item) => item.id === id);
      if (!folder) {
        throw new Error("Missing folder");
      }
      if (data.name !== undefined) {
        folder.name = data.name;
      }
      if (data.parentId !== undefined) {
        folder.parentId = data.parentId ?? null;
      }
      return folder;
    },
    deleteByIds: async (ids: number[]) => {
      deletedFolderIds = ids.slice();
      return { count: ids.length };
    },
    countByParent: async () => 0,
    searchByName: async () => [],
    countByName: async () => 0
  };

  const fileRepository = {
    listAll: async () => [],
    listByFolderId: async () => [],
    findById: async () => null,
    create: async () => ({ id: 1, name: "file.txt", folderId: 1 }),
    update: async () => ({ id: 1, name: "file.txt", folderId: 1 }),
    deleteByIds: async () => ({ count: 0 }),
    deleteByFolderIds: async (ids: number[]) => {
      deletedFileFolderIds = ids.slice();
      return { count: ids.length };
    },
    countByFolderId: async () => 0,
    searchByName: async () => [],
    countByName: async () => 0
  };

  const cache = new SimpleCache({ ttlMs: 1000, maxEntries: 10 });

  const service = createFolderService({
    folderRepository: folderRepository as any,
    fileRepository: fileRepository as any,
    cache,
    transaction: async (actions) => Promise.all(actions)
  });

  return {
    service,
    getDeletedIds: () => ({
      folderIds: deletedFolderIds,
      fileFolderIds: deletedFileFolderIds
    })
  };
};

describe("folderService", () => {
  it("rejects updates that create cycles", async () => {
    const { service } = buildService();
    try {
      await service.update(1, { parentId: 3 });
      throw new Error("Expected update to fail");
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      const apiError = error as ApiError;
      expect(apiError.status).toBe(400);
    }
  });

  it("deletes a folder and its descendants", async () => {
    const { service, getDeletedIds } = buildService();
    await service.remove(2);
    const { folderIds, fileFolderIds } = getDeletedIds();
    expect(folderIds.sort()).toEqual([2, 3]);
    expect(fileFolderIds.sort()).toEqual([2, 3]);
  });
});
