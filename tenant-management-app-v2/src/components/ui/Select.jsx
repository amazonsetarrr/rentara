export default function Select({
  label,
  error,
  options = [],
  placeholder = "Select an option",
  className = '',
  ...props
}) {
  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      <select
        className={`
          w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm
          bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 
          focus:border-primary-500 disabled:bg-gray-50 disabled:text-gray-500
          ${error ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}
          ${className}
        `}
        {...props}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}