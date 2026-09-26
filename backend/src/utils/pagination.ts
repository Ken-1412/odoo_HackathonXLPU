// ─── Pagination Utilities ───────────────────────────────────────────────────

export interface PaginationParams {
  page: number;
  limit: number;
  take: number;
  skip: number;
  orderBy: Record<string, 'asc' | 'desc'>;
}

export function parsePagination(query: Record<string, any>): PaginationParams {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
  const skip = (page - 1) * limit;

  const sortField = query.sortBy || 'createdAt';
  const sortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc';

  return {
    page,
    limit,
    take: limit,
    skip,
    orderBy: { [sortField]: sortOrder },
  };
}
