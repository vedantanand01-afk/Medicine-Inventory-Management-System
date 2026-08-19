import React from 'react';
import Loader from './Loader';
import { Inbox } from 'lucide-react';

const DataTable = ({
  columns = [],
  data = [],
  isLoading = false,
  emptyMessage = 'No data records found',
  emptySubMessage = 'Try adjusting your search or filters',
  onRowClick,
}) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 p-8 shadow-sm">
        <Loader message="Loading records from database..." />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200/80">
              {columns.map((col, idx) => (
                <th
                  key={col.key || idx}
                  className={`px-4 py-3.5 text-xs font-bold text-slate-600 uppercase tracking-wider ${
                    col.className || ''
                  }`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm text-slate-700 font-normal">
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-12 text-center">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="p-3 bg-slate-50 rounded-2xl text-slate-400">
                      <Inbox className="w-8 h-8 stroke-1" />
                    </div>
                    <p className="text-sm font-semibold text-slate-700">
                      {emptyMessage}
                    </p>
                    <p className="text-xs text-slate-400 max-w-xs">
                      {emptySubMessage}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((row, rowIdx) => (
                <tr
                  key={row._id || row.id || rowIdx}
                  onClick={() => onRowClick && onRowClick(row)}
                  className={`transition-colors ${
                    onRowClick
                      ? 'cursor-pointer hover:bg-slate-50/80'
                      : 'hover:bg-slate-50/40'
                  }`}
                >
                  {columns.map((col, colIdx) => (
                    <td
                      key={col.key || colIdx}
                      className={`px-4 py-3.5 align-middle ${
                        col.cellClassName || ''
                      }`}
                    >
                      {col.render ? col.render(row, rowIdx) : row[col.key]}
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
};

export default DataTable;
