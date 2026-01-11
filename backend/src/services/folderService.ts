import { SimpleCache, cache } from "../cache";
import { badRequest, notFound } from "../errors";
import { fileRepository as defaultFileRepository } from "../repositories/fileRepository";
import {
  folderRepository as defaultFolderRepository,
  type FolderNode
} from "../repositories/folderRepository";
import { prisma } from "../prisma";
import type { Pagination } from "../utils/pagination";

type TransactionRunner = <T>(actions: Promise<T>[]) => Promise<T[]>;

type FolderServiceDeps = {
  folderRepository?: typeof defaultFolderRepository;
  fileRepository?: typeof defaultFileRepository;
  cache?: SimpleCache;
  transaction?: TransactionRunner;
};

/** Collect all descendant folder IDs using iterative DFS */
const getDescendantIds = (rootId: number, nodes: FolderNode[]): number[] => {
  const childMap = new Map<number, number[]>();
  for (const { id, parentId } of nodes) {
    if (parentId !== null) {
      const siblings = childMap.get(parentId) ?? [];
      siblings.push(id);
      childMap.set(parentId, siblings);
    }
  }

  const result: number[] = [];
  const stack = [rootId];
  while (stack.length) {
    const id = stack.pop()!;
    result.push(id);
    const children = childMap.get(id);
    if (children) stack.push(...children);
  }
  return result;
};

/**
 * Folder Service - handles business logic for folder operations
 */
export const createFolderService = (deps: FolderServiceDeps = {}) => {
  const folderRepo = deps.folderRepository ?? defaultFolderRepository;
  const fileRepo = deps.fileRepository ?? defaultFileRepository;
  const cacheStore = deps.cache ?? cache;
  const defaultTransaction: TransactionRunner = (actions) =>
    prisma.$transaction(actions);
  const runTransaction = deps.transaction ?? defaultTransaction;

  const wouldCreateCycle = async (
    folderId: number,
    newParentId: number
  ): Promise<boolean> => {
    let currentId: number | null = newParentId;
    while (currentId !== null) {
      if (currentId === folderId) return true;
      const parent = await folderRepo.getParentId(currentId);
      currentId = parent?.parentId ?? null;
    }
    return false;
  };

  const service = {
    /** List all folders with caching */
    listAll: (pagination?: Pagination) =>
      cacheStore.getOrSet(`folders:all:${pagination?.limit}:${pagination?.offset}`, () =>
        folderRepo.listAll(pagination)
      ),

    /** List root folders (parentId = null) */
    listRoots: (pagination?: Pagination) =>
      cacheStore.getOrSet(`folders:roots:${pagination?.limit}:${pagination?.offset}`, () =>
        folderRepo.listRoots(pagination)
      ),

    /** Count root folders */
    countRoots: () =>
      cacheStore.getOrSet("folders:roots:count", () =>
        folderRepo.countRoots()
      ),

    /** List direct children of a folder */
    listChildren: (parentId: number, pagination?: Pagination) =>
      cacheStore.getOrSet(
        `folders:children:${parentId}:${pagination?.limit}:${pagination?.offset}`,
        () => folderRepo.listChildren(parentId, pagination)
      ),

    /** Get a single folder by ID */
    getById: (id: number) => folderRepo.findById(id),

    /** List all folders and files together (for initial load) */
    listWithFiles: async (pagination?: Pagination) => {
      const [folders, files] = await Promise.all([
        service.listAll(pagination),
        cacheStore.getOrSet(`files:all:${pagination?.limit}:${pagination?.offset}`, () =>
          fileRepo.listAll(pagination)
        )
      ]);
      return { folders, files };
    },

    /** Create a new folder */
    create: async (input: { name: string; parentId?: number | null }) => {
      if (input.parentId !== undefined && input.parentId !== null) {
        const parent = await folderRepo.findById(input.parentId);
        if (!parent) throw notFound("Parent folder not found.");
      }

      const folder = await folderRepo.create(input);
      cacheStore.clear();
      return folder;
    },

    /** Update a folder (name or parent) */
    update: async (id: number, input: { name?: string; parentId?: number | null }) => {
      const existing = await folderRepo.findById(id);
      if (!existing) throw notFound("Folder not found.");

      if (input.parentId !== undefined && input.parentId !== null) {
        if (input.parentId === id) throw badRequest("Folder cannot be its own parent.");

        const parent = await folderRepo.findById(input.parentId);
        if (!parent) throw notFound("Parent folder not found.");

        if (await wouldCreateCycle(id, input.parentId)) {
          throw badRequest("This would create a circular reference.");
        }
      }

      const folder = await folderRepo.update(id, input);
      cacheStore.clear();
      return folder;
    },

    /** Delete a folder and all its contents (cascade) */
    remove: async (id: number) => {
      const existing = await folderRepo.findById(id);
      if (!existing) throw notFound("Folder not found.");

      const allNodes = await folderRepo.listNodes();
      const folderIds = getDescendantIds(id, allNodes);

      await runTransaction([
        fileRepo.deleteByFolderIds(folderIds),
        folderRepo.deleteByIds(folderIds)
      ]);
      cacheStore.clear();
    }
  };

  return service;
};

export const folderService = createFolderService();
