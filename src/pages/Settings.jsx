import { useAuth } from '../context/AuthContext';

export function Settings() {
  const { user } = useAuth();

  return (
    <div className="max-w-md">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Settings</h1>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Account</h2>
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-gray-500">Name</dt>
            <dd className="text-gray-900">{user?.name}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">Email</dt>
            <dd className="text-gray-900">{user?.email}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">Role</dt>
            <dd className="text-gray-900 capitalize">{user?.role?.replace('_', ' ')}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">Status</dt>
            <dd className="text-gray-900">{user?.is_active ? 'Active' : 'Inactive'}</dd>
          </div>
        </dl>
        <p className="text-xs text-gray-400 mt-4">
          Profile edits (name, email, role) are managed by an Admin via the Users page.
        </p>
      </div>
    </div>
  );
}
