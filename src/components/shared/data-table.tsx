import { ReactNode } from 'react';
import { ColorPalette } from '../../types';

interface Column<T> {
  key: keyof T | string;
  header: string;
  width?: string;
  render?: (item: T, index: number) => ReactNode;
  align?: 'left' | 'center' | 'right';
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  colors: ColorPalette;
  emptyMessage?: string;
}

export function DataTable<T>({ columns, data, colors, emptyMessage = 'No data available' }: DataTableProps<T>) {
  if (data.length === 0) {
    return (
      <div className="border-[3px] border-gray-900 rounded-[4px] p-8 text-center">
        <p className="text-gray-700 font-bold">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="border-[3px] border-gray-900 rounded-[4px] overflow-hidden">
      <table className="w-full border-collapse">
        <thead>
          <tr style={{ backgroundColor: colors.tableHeaderBg }}>
            {columns.map((column, idx) => (
              <th
                key={idx}
                className={`px-4 py-3 text-sm font-black border-b-[3px] border-gray-900 ${
                  column.align === 'center' ? 'text-center' :
                  column.align === 'right' ? 'text-right' : 'text-left'
                }`}
                style={{ color: colors.tableHeaderText, width: column.width }}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item, rowIdx) => (
            <tr
              key={rowIdx}
              className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
            >
              {columns.map((column, colIdx) => (
                <td
                  key={colIdx}
                  className={`px-4 py-3 text-sm font-bold ${
                    column.align === 'center' ? 'text-center' :
                    column.align === 'right' ? 'text-right' : 'text-left'
                  }`}
                >
                  {column.render
                    ? column.render(item, rowIdx)
                    : String((item as Record<string, unknown>)[column.key as string] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
