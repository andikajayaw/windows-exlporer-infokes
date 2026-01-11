import { cache } from "../cache";
import { notFound } from "../errors";
import { fileRepository } from "../repositories/fileRepository";
import { folderRepository } from "../repositories/folderRepository";
import type { Pagination } from "../utils/pagination";

/**
 * File Service - handles business logic for file operations
 */
export const fileService = {
  /** List all files with optional pagination */
  listAll: (pagination?: Pagination) =>
    cache.getOrSet(`files:all:${pagination?.limit}:${pagination?.offset}`, () =>
      fileRepository.listAll(pagination)
    ),

  /** List files in a specific folder */
  listByFolderId: (folderId: number, pagination?: Pagination) =>
    cache.getOrSet(`files:folder:${folderId}:${pagination?.limit}:${pagination?.offset}`, () =>
      fileRepository.listByFolderId(folderId, pagination)
    ),

  /** Get a single file by ID */
  getById: (id: number) => fileRepository.findById(id),

  /** Create a new file */
  create: async (input: { name: string; folderId: number }) => {
    // Validate folder exists
    const folder = await folderRepository.findById(input.folderId);
    if (!folder) throw notFound("Folder not found.");

    const file = await fileRepository.create(input);
    cache.clear();
    return file;
  },

  /** Update an existing file */
  update: async (id: number, input: { name?: string; folderId?: number }) => {
    // Validate file exists
    const existing = await fileRepository.findById(id);
    if (!existing) throw notFound("File not found.");

    // Validate new folder if changing
    if (input.folderId !== undefined) {
      const folder = await folderRepository.findById(input.folderId);
      if (!folder) throw notFound("Folder not found.");
    }

    const file = await fileRepository.update(id, input);
    cache.clear();
    return file;
  },

  /** Delete a file */
  remove: async (id: number) => {
    const existing = await fileRepository.findById(id);
    if (!existing) throw notFound("File not found.");

    await fileRepository.deleteByIds([id]);
    cache.clear();
  }
};
