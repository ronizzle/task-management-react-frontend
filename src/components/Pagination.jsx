export function Pagination({ page, lastPage, onChange }) {
  if (!lastPage || lastPage <= 1) return null;

  return (
    <div className="flex items-center justify-between mt-4 text-sm">
      <button
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
        className="border border-gray-300 rounded-md px-3 py-1.5 hover:bg-gray-50 disabled:opacity-50"
      >
        Prev
      </button>
      <span className="text-gray-500">
        Page {page} of {lastPage}
      </span>
      <button
        disabled={page >= lastPage}
        onClick={() => onChange(page + 1)}
        className="border border-gray-300 rounded-md px-3 py-1.5 hover:bg-gray-50 disabled:opacity-50"
      >
        Next
      </button>
    </div>
  );
}
