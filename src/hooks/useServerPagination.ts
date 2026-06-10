import { useCallback, useEffect, useRef, useState } from 'react';
import api from '../services/api';
import type { PageMeta } from '../components/Pagination';

export type SortOrder = 'ASC' | 'DESC';

export interface ServerPaginationState<T> {
  data: T[];
  meta: PageMeta;
  loading: boolean;
  error: string | null;

  page: number;
  limit: number;
  search: string;
  sort: string;
  order: SortOrder;

  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  setSearch: (search: string) => void;
  setSort: (sort: string, order?: SortOrder) => void;
  toggleSort: (column: string) => void; // cycles ASC → DESC → ASC
  refresh: () => void;
}

interface Options {
  endpoint: string;
  initialLimit?: number;
  initialSort?: string;
  initialOrder?: SortOrder;
  // Extra params merged into the request (e.g. hotel_id, status filters).
  // Changing this object triggers a refetch; memoize if needed.
  extraParams?: Record<string, string | number | boolean | undefined>;
  // Debounce for search input (ms). Default 350.
  searchDebounceMs?: number;
}

interface PageResponse<T> {
  data: T[];
  meta: PageMeta;
}

// Hook that owns server-side pagination state for a list endpoint that returns
// the { data, meta } shape produced by the backend Paginate[T] helper.
export function useServerPagination<T>({
  endpoint,
  initialLimit = 20,
  initialSort = '',
  initialOrder = 'DESC',
  extraParams,
  searchDebounceMs = 350,
}: Options): ServerPaginationState<T> {
  const [data, setData] = useState<T[]>([]);
  const [meta, setMeta] = useState<PageMeta>({ page: 1, limit: initialLimit, total: 0, total_pages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [page, setPageState] = useState(1);
  const [limit, setLimitState] = useState(initialLimit);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearchState] = useState('');
  const [sort, setSortState] = useState(initialSort);
  const [order, setOrderState] = useState<SortOrder>(initialOrder);

  // Coalesce rapid keystrokes into a single fetch.
  useEffect(() => {
    const t = setTimeout(() => {
      setSearchState(searchInput);
      setPageState(1); // reset to first page on search change
    }, searchDebounceMs);
    return () => clearTimeout(t);
  }, [searchInput, searchDebounceMs]);

  // Track latest request to avoid races where stale responses overwrite fresh.
  const reqIdRef = useRef(0);

  const fetchPage = useCallback(async () => {
    const myReq = ++reqIdRef.current;
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string | number | boolean> = {
        page,
        limit,
      };
      if (search) params.search = search;
      if (sort) {
        params.sort = sort;
        params.order = order;
      }
      if (extraParams) {
        for (const [k, v] of Object.entries(extraParams)) {
          if (v !== undefined && v !== '') params[k] = v;
        }
      }
      const res = await api.get<PageResponse<T>>(endpoint, { params });
      if (reqIdRef.current !== myReq) return; // stale
      setData(res.data?.data ?? []);
      setMeta(res.data?.meta ?? { page: 1, limit, total: 0, total_pages: 0 });
    } catch (err: unknown) {
      if (reqIdRef.current !== myReq) return;
      const msg = err instanceof Error ? err.message : 'Failed to load';
      setError(msg);
    } finally {
      if (reqIdRef.current === myReq) setLoading(false);
    }
    // extraParams comes from the caller; we depend on its identity to refetch.
  }, [endpoint, page, limit, search, sort, order, extraParams]);

  useEffect(() => {
    fetchPage();
  }, [fetchPage]);

  const setPage = useCallback((p: number) => setPageState(p), []);
  const setLimit = useCallback((l: number) => {
    setLimitState(l);
    setPageState(1);
  }, []);
  const setSearch = useCallback((s: string) => setSearchInput(s), []);
  const setSort = useCallback((s: string, o: SortOrder = 'ASC') => {
    setSortState(s);
    setOrderState(o);
    setPageState(1);
  }, []);
  const toggleSort = useCallback((column: string) => {
    setSortState((prev) => {
      if (prev === column) {
        setOrderState((o) => (o === 'ASC' ? 'DESC' : 'ASC'));
        return prev;
      }
      setOrderState('ASC');
      return column;
    });
    setPageState(1);
  }, []);

  return {
    data,
    meta,
    loading,
    error,
    page,
    limit,
    search: searchInput,
    sort,
    order,
    setPage,
    setLimit,
    setSearch,
    setSort,
    toggleSort,
    refresh: fetchPage,
  };
}
