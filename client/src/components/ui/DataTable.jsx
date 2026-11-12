import "./ui.css";

export default function DataTable({
  columns = [],
  data = [],
  loading = false,
  emptyMessage = "No records found.",
  rowKey = "id",
  className = "",
}) {
  if (loading) {
    return (
      <div className="dn-table-state" role="status" aria-live="polite">
        <span className="dn-table-state__spinner" aria-hidden="true" />
        <span>Loading...</span>
      </div>
    );
  }

  if (!data.length) {
    return <div className="dn-table-state">{emptyMessage}</div>;
  }

  return (
    <div className={`dn-table-wrap ${className}`.trim()}>
      <table className="dn-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key} scope="col" className={column.className || ""}>
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr key={row[rowKey] ?? index}>
              {columns.map((column) => (
                <td key={column.key} className={column.cellClassName || ""}>
                  {column.render ? column.render(row, index) : row[column.key] ?? "—"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
