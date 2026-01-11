import { SimpleCache, cache } from "../cache";
import { fileRepository } from "../repositories/fileRepository";
import { folderRepository } from "../repositories/folderRepository";
import type { Pagination } from "../utils/pagination";

export type SearchScope = "folders" | "files" | "all";
export type MatchMode = "prefix" | "contains";

type SearchServiceDeps = {
  folderRepository?: typeof folderRepository;
  fileRepository?: typeof fileRepository;
  cache?: SimpleCache;
};

type CursorPagination = {
  limit?: number;
  cursor?: number | null;
};

type CursorCapableRepo = {
  searchByNameCursor?: (
    query: string,
    match: MatchMode,
    pagination?: CursorPagination
  ) => Promise<unknown[]>;
};

/**
 * Search Service - handles search across folders and files
 */
export const createSearchService = (deps: SearchServiceDeps = {}) => {
  const folderRepo = deps.folderRepository ?? folderRepository;
  const fileRepo = deps.fileRepository ?? fileRepository;
  const cacheStore = deps.cache ?? cache;
  const folderCursorRepo = folderRepo as typeof folderRepository & CursorCapableRepo;
  const fileCursorRepo = fileRepo as typeof fileRepository & CursorCapableRepo;

  return {
    /** Search folders and/or files by name */
    search: async (params: {
      query: string;
      scope: SearchScope;
      match: MatchMode;
      pagination?: Pagination;
    }) => {
      const { query, scope, match, pagination } = params;
      const cacheKey = `search:${scope}:${match}:${query}:${pagination?.limit}:${pagination?.offset}`;

      return cacheStore.getOrSet(cacheKey, async () => {
        const searchFolders = scope !== "files";
        const searchFiles = scope !== "folders";

        const [folders, files, folderCount, fileCount] = await Promise.all([
          searchFolders ? folderRepo.searchByName(query, match, pagination) : [],
          searchFiles ? fileRepo.searchByName(query, match, pagination) : [],
          searchFolders ? folderRepo.countByName(query, match) : 0,
          searchFiles ? fileRepo.countByName(query, match) : 0
        ]);

        return {
          folders,
          files,
          totals: { folders: folderCount, files: fileCount }
        };
      });
    },

    /** Cursor-based search for single scope (optional) */
    searchCursor: async (params: {
      query: string;
      scope: SearchScope;
      match: MatchMode;
      pagination?: CursorPagination;
    }) => {
      const { query, scope, match, pagination } = params;
      const cacheKey = `search:cursor:${scope}:${match}:${query}:${pagination?.limit}:${pagination?.cursor}`;

      return cacheStore.getOrSet(cacheKey, async () => {
        const searchFolders = scope !== "files";
        const searchFiles = scope !== "folders";

        const [folders, files, folderCount, fileCount] = await Promise.all([
          searchFolders
            ? folderCursorRepo.searchByNameCursor
              ? folderCursorRepo.searchByNameCursor(query, match, pagination)
              : folderRepo.searchByName(query, match, pagination as Pagination)
            : [],
          searchFiles
            ? fileCursorRepo.searchByNameCursor
              ? fileCursorRepo.searchByNameCursor(query, match, pagination)
              : fileRepo.searchByName(query, match, pagination as Pagination)
            : [],
          searchFolders ? folderRepo.countByName(query, match) : 0,
          searchFiles ? fileRepo.countByName(query, match) : 0
        ]);

        return {
          folders,
          files,
          totals: { folders: folderCount, files: fileCount }
        };
      });
    }
  };
};

export const searchService = createSearchService();
