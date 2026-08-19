// Helper to download data array as CSV file
export const exportToCSV = (filename, headers, rows) => {
  const csvRows = [];

  // Add header line
  csvRows.push(headers.map((h) => `"${h.replace(/"/g, '""')}"`).join(','));

  // Add data rows
  rows.forEach((row) => {
    const values = headers.map((headerKey, idx) => {
      const val = Array.isArray(row) ? row[idx] : row[headerKey];
      const stringVal = val === undefined || val === null ? '' : String(val);
      return `"${stringVal.replace(/"/g, '""')}"`;
    });
    csvRows.push(values.join(','));
  });

  const csvString = csvRows.join('\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Helper to trigger browser print
export const triggerPrint = () => {
  window.print();
};
