import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

interface PaginationProps {
  meta: PageMeta;
  onPageChange: (page: number) => void;
  onLimitChange?: (limit: number) => void;
  pageSizeOptions?: number[];
  className?: string;
}

// Builds a windowed list of page numbers around `current`. Returns a sparse
// array where `null` represents an ellipsis gap.
const buildPageWindow = (current: number, total: number): (number | null)[] => {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | null)[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) pages.push(null);
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < total - 1) pages.push(null);
  pages.push(total);
  return pages;
};

const Pagination = ({
  meta,
  onPageChange,
  onLimitChange,
  pageSizeOptions = [10, 20, 50, 100],
  className,
}: PaginationProps) => {
  const { page, limit, total, total_pages } = meta;
  const isEmpty = total === 0;
  const start = isEmpty ? 0 : (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  const goTo = (p: number) => {
    if (p < 1 || p > total_pages || p === page) return;
    onPageChange(p);
  };

  const pages = buildPageWindow(page, total_pages || 1);

  return (
    <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 py-3 px-1 text-sm text-gray-600 ${className ?? ''}`}>
      <div className="flex items-center gap-3">
        <span>
          {isEmpty
            ? 'No results'
            : <>Showing <b className="text-gray-900">{start}–{end}</b> of <b className="text-gray-900">{total}</b></>}
        </span>
        {onLimitChange && (
          <label className="flex items-center gap-2 text-xs text-gray-500">
            Rows
            <select
              value={limit}
              onChange={(e) => onLimitChange(Number(e.target.value))}
              className="border border-gray-200 rounded-md px-2 py-1 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#008491]"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </label>
        )}
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => goTo(1)}
          disabled={page <= 1}
          className="p-1.5 rounded-md hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
          title="First page"
        >
          <ChevronsLeft size={16} />
        </button>
        <button
          onClick={() => goTo(page - 1)}
          disabled={page <= 1}
          className="p-1.5 rounded-md hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
          title="Previous page"
        >
          <ChevronLeft size={16} />
        </button>

        {pages.map((p, idx) =>
          p === null ? (
            <span key={`gap-${idx}`} className="px-2 text-gray-400">…</span>
          ) : (
            <button
              key={p}
              onClick={() => goTo(p)}
              className={`min-w-[2rem] px-2 py-1 rounded-md text-sm font-medium transition-colors ${
                p === page
                  ? 'bg-[#008491] text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {p}
            </button>
          )
        )}

        <button
          onClick={() => goTo(page + 1)}
          disabled={page >= total_pages}
          className="p-1.5 rounded-md hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
          title="Next page"
        >
          <ChevronRight size={16} />
        </button>
        <button
          onClick={() => goTo(total_pages)}
          disabled={page >= total_pages}
          className="p-1.5 rounded-md hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
          title="Last page"
        >
          <ChevronsRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
