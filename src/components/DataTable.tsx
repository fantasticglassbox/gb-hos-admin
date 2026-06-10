import type { ReactNode } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import type { SortOrder } from '../hooks/useServerPagination';

// One column definition. `accessor` (a key on the row) drives the default cell
// render; supply `render` for custom cells (thumbnails, action buttons, etc.).
export interface Column<T> {
  key: string;
  header: ReactNode;
  // Column to sort by on the server. If omitted, header click does nothing.
  sortKey?: string;
  accessor?: keyof T;
  render?: (row: T) => ReactNode;
  className?: string; // applied to <td>
  headerClassName?: string; // applied to <th>
  // Tailwind width util e.g. "w-32" or inline style. Kept as a hint, not enforced.
  width?: string;
  align?: 'left' | 'center' | 'right';
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  loading?: boolean;
  emptyMessage?: ReactNode;
  rowKey: (row: T) => string | number;
  sort?: string;
  order?: SortOrder;
  onSortChange?: (column: string) => void;
  onRowClick?: (row: T) => void;
}

const alignClass = (a?: 'left' | 'center' | 'right') =>
  a === 'center' ? 'text-center' : a === 'right' ? 'text-right' : 'text-left';

function DataTable<T>({
  columns,
  rows,
  loading,
  emptyMessage = 'No data',
  rowKey,
  sort,
  order,
  onSortChange,
  onRowClick,
}: DataTableProps<T>) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {columns.map((col) => {
                const isSorted = sort && col.sortKey === sort;
                const sortable = !!col.sortKey && !!onSortChange;
                return (
                  <th
                    key={col.key}
                    className={`py-3 px-4 font-medium text-xs uppercase tracking-wide text-gray-500 ${alignClass(col.align)} ${col.width ?? ''} ${col.headerClassName ?? ''}`}
                  >
                    {sortable ? (
                      <button
                        type="button"
                        onClick={() => onSortChange!(col.sortKey!)}
                        className="inline-flex items-center gap-1 hover:text-gray-800 transition-colors"
                      >
                        {col.header}
                        {isSorted ? (
                          order === 'ASC' ? <ArrowUp size={12} /> : <ArrowDown size={12} />
                        ) : (
                          <ArrowUpDown size={12} className="opacity-40" />
                        )}
                      </button>
                    ) : (
                      col.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="py-12 text-center text-gray-400">
                  Loading...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-12 text-center text-gray-400">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={rowKey(row)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={`border-b border-gray-50 last:border-0 ${onRowClick ? 'cursor-pointer hover:bg-gray-50' : ''}`}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`py-3 px-4 ${alignClass(col.align)} ${col.className ?? ''}`}
                    >
                      {col.render
                        ? col.render(row)
                        : col.accessor
                        ? String((row as Record<string, unknown>)[col.accessor as string] ?? '')
                        : null}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default DataTable;
