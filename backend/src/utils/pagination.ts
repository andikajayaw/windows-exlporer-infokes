import { getSingleQueryValue } from "./validation";

export type Pagination = {
  limit?: number;
  offset?: number;
};

const MAX_LIMIT = 1000;

const parseOptionalInt = (value: unknown): number | null | undefined => {
  const raw = getSingleQueryValue(value);
  if (raw === undefined || raw === null || raw === "") {
    return undefined;
  }
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) {
    return null;
  }
  return Math.trunc(parsed);
};

export const parsePagination = (query: Record<string, unknown>): {
  pagination?: Pagination;
  error?: string;
} => {
  const limitValue = parseOptionalInt(query.limit);
  const offsetValue = parseOptionalInt(query.offset);

  if (limitValue === undefined && offsetValue === undefined) {
    return {};
  }

  if (limitValue === null) {
    return { error: "limit must be a number." };
  }

  if (offsetValue === null) {
    return { error: "offset must be a number." };
  }

  if (limitValue !== undefined && limitValue !== null && limitValue <= 0) {
    return { error: "limit must be a positive number." };
  }

  if (limitValue !== undefined && limitValue !== null && limitValue > MAX_LIMIT) {
    return { error: `limit must be <= ${MAX_LIMIT}.` };
  }

  if (offsetValue !== undefined && offsetValue !== null && offsetValue < 0) {
    return { error: "offset must be 0 or greater." };
  }

  return {
    pagination: {
      limit: limitValue ?? undefined,
      offset: offsetValue ?? undefined
    }
  };
};

export const buildPrismaPagination = (pagination?: Pagination) => {
  if (!pagination) {
    return {};
  }
  const take = pagination.limit;
  const skip = pagination.offset;
  return {
    ...(take !== undefined ? { take } : {}),
    ...(skip !== undefined ? { skip } : {})
  };
};
