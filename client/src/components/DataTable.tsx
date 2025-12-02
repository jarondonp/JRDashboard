import type { ReactNode } from 'react';

export interface DataTableColumn<T> {
  title: string;
  render: (item: T) => ReactNode;
  className?: string;
  headerClassName?: string;
}

interface DataTableProps<T> {
  items: T[];
  columns: Array<DataTableColumn<T>>;
  emptyMessage?: string;
}

export function DataTable<T>({ items, columns, emptyMessage = 'Sin registros' }: DataTableProps<T>) {
  if (items.length === 0) {
    return (
      <div className="py-12 text-center text-gray-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-indigo-100 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-indigo-100">
        <thead className="bg-indigo-50/60">
          <tr className="text-left text-xs font-semibold uppercase tracking-wide text-indigo-600">
            {columns.map((column) => (
              <th key={column.title} className={`px-4 py-3 ${column.headerClassName ?? ''}`}>
                {column.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-indigo-50 text-sm text-gray-700">
          {items.map((item, index) => (
            <tr key={index} className="hover:bg-indigo-50/40 transition">
              {columns.map((column) => (
                <td key={column.title} className={`px-4 py-3 align-top ${column.className ?? ''}`}>
                  {column.render(item)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}



