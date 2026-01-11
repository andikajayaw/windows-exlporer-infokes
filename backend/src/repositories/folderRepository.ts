import { prisma } from "../prisma";
import {
  buildPrismaPagination,
  type Pagination
} from "../utils/pagination";

export type FolderNode = {
  id: number;
  parentId: number | null;
};

type MatchMode = "prefix" | "contains";

const buildNameFilter = (query: string, match: MatchMode) =>
  match === "contains" ? { contains: query } : { startsWith: query };

export const folderRepository = {
  listAll: (pagination?: Pagination) =>
    prisma.folder.findMany({
      orderBy: { name: "asc" },
      ...buildPrismaPagination(pagination)
    }),
  listRoots: (pagination?: Pagination) =>
    prisma.folder.findMany({
      where: { parentId: null },
      orderBy: { name: "asc" },
      ...buildPrismaPagination(pagination)
    }),
  countRoots: () =>
    prisma.folder.count({ where: { parentId: null } }),
  listNodes: () =>
    prisma.folder.findMany({ select: { id: true, parentId: true } }),
  listChildren: (parentId: number, pagination?: Pagination) =>
    prisma.folder.findMany({
      where: { parentId },
      orderBy: { name: "asc" },
      ...buildPrismaPagination(pagination)
    }),
  findById: (id: number) => prisma.folder.findUnique({ where: { id } }),
  getParentId: (id: number) =>
    prisma.folder.findUnique({
      where: { id },
      select: { parentId: true }
    }),
  create: (data: { name: string; parentId?: number | null }) =>
    prisma.folder.create({ data }),
  update: (id: number, data: { name?: string; parentId?: number | null }) =>
    prisma.folder.update({ where: { id }, data }),
  deleteByIds: (ids: number[]) =>
    prisma.folder.deleteMany({ where: { id: { in: ids } } }),
  countByParent: (parentId: number) =>
    prisma.folder.count({ where: { parentId } }),
  searchByName: (query: string, match: MatchMode, pagination?: Pagination) =>
    prisma.folder.findMany({
      where: { name: { ...buildNameFilter(query, match), mode: "insensitive" } },
      orderBy: { name: "asc" },
      ...buildPrismaPagination(pagination)
    }),
  countByName: (query: string, match: MatchMode) =>
    prisma.folder.count({
      where: { name: { ...buildNameFilter(query, match), mode: "insensitive" } }
    })
};
