import { prisma } from "../prisma";
import {
  buildPrismaPagination,
  type Pagination
} from "../utils/pagination";

type MatchMode = "prefix" | "contains";

const buildNameFilter = (query: string, match: MatchMode) =>
  match === "contains" ? { contains: query } : { startsWith: query };

export const fileRepository = {
  listAll: (pagination?: Pagination) =>
    prisma.file.findMany({
      orderBy: { name: "asc" },
      ...buildPrismaPagination(pagination)
    }),
  listByFolderId: (folderId: number, pagination?: Pagination) =>
    prisma.file.findMany({
      where: { folderId },
      orderBy: { name: "asc" },
      ...buildPrismaPagination(pagination)
    }),
  findById: (id: number) => prisma.file.findUnique({ where: { id } }),
  create: (data: { name: string; folderId: number }) =>
    prisma.file.create({ data }),
  update: (id: number, data: { name?: string; folderId?: number }) =>
    prisma.file.update({ where: { id }, data }),
  deleteByIds: (ids: number[]) =>
    prisma.file.deleteMany({ where: { id: { in: ids } } }),
  deleteByFolderIds: (folderIds: number[]) =>
    prisma.file.deleteMany({ where: { folderId: { in: folderIds } } }),
  countByFolderId: (folderId: number) =>
    prisma.file.count({ where: { folderId } }),
  searchByName: (query: string, match: MatchMode, pagination?: Pagination) =>
    prisma.file.findMany({
      where: { name: { ...buildNameFilter(query, match), mode: "insensitive" } },
      orderBy: { name: "asc" },
      ...buildPrismaPagination(pagination)
    }),
  countByName: (query: string, match: MatchMode) =>
    prisma.file.count({
      where: { name: { ...buildNameFilter(query, match), mode: "insensitive" } }
    })
};
