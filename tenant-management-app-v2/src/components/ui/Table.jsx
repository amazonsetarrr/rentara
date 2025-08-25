export default function Table({ children, data, columns, emptyMessage, className = '' }) {
  // If data and columns are provided, render as a data table
  if (data && columns) {
    return <DataTable data={data} columns={columns} emptyMessage={emptyMessage} className={className} />
  }
  
  // Otherwise, render as a basic table wrapper
  return (
    <div className="overflow-x-auto">
      <table className={`min-w-full divide-y divide-gray-200 ${className}`}>
        {children}
      </table>
    </div>
  )
}

// Data table component for handling structured data
function DataTable({ data, columns, emptyMessage = 'No data found', className = '' }) {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        {emptyMessage}
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className={`min-w-full divide-y divide-gray-200 ${className}`}>
        <thead className="bg-gray-50">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((item, index) => (
            <tr key={item.id || index}>
              {columns.map((column) => (
                <td key={column.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {column.render ? column.render(item) : item[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function TableHeader({ children }) {
  return (
    <thead className="bg-gray-50">
      {children}
    </thead>
  )
}

export function TableBody({ children }) {
  return (
    <tbody className="bg-white divide-y divide-gray-200">
      {children}
    </tbody>
  )
}

export function TableRow({ children, className = '' }) {
  return (
    <tr className={className}>
      {children}
    </tr>
  )
}

export function TableHead({ children, className = '' }) {
  return (
    <th className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${className}`}>
      {children}
    </th>
  )
}

export function TableCell({ children, className = '' }) {
  return (
    <td className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 ${className}`}>
      {children}
    </td>
  )
}