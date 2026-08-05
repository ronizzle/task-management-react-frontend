import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { laravel } from '@/api/client';
import { PasswordInput } from '@/components/PasswordInput';

export function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewForm, setShowNewForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', passwordConfirmation: '', role: 'team_member' });
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', role: 'team_member' });
  const [saving, setSaving] = useState(false);

  const filteredUsers = users.filter((user) => {
    if (roleFilter !== 'all' && user.role !== roleFilter) return false;
    if (statusFilter === 'active' && !user.is_active) return false;
    if (statusFilter === 'inactive' && user.is_active) return false;
    return true;
  });

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    setLoading(true);
    try {
      const { data } = await laravel.get('/users', { params: { per_page: 100 } });
      setUsers(data.data ?? []);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (newUser.password !== newUser.passwordConfirmation) {
      toast.error('Passwords do not match.');
      return;
    }
    setCreating(true);
    try {
      const { passwordConfirmation, ...payload } = newUser;
      await laravel.post('/users', payload);
      toast.success('User created.');
      setShowNewForm(false);
      setNewUser({ name: '', email: '', password: '', passwordConfirmation: '', role: 'team_member' });
      loadUsers();
    } catch {
      // toast already shown by interceptor
    } finally {
      setCreating(false);
    }
  }

  async function handleToggleStatus(user) {
    try {
      await laravel.patch(`/users/${user.id}/status`, { is_active: !user.is_active });
      setUsers((list) => list.map((u) => (u.id === user.id ? { ...u, is_active: !u.is_active } : u)));
      toast.success(`User ${user.is_active ? 'deactivated' : 'activated'}.`);
    } catch {
      // toast already shown by interceptor
    }
  }

  function openEdit(user) {
    setEditingUser(user);
    setEditForm({ name: user.name, email: user.email, role: user.role });
  }

  async function handleEditSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await laravel.patch(`/users/${editingUser.id}`, editForm);
      setUsers((list) => list.map((u) => (u.id === editingUser.id ? { ...u, ...data } : u)));
      toast.success('User updated.');
      setEditingUser(null);
    } catch {
      // toast already shown by interceptor
    } finally {
      setSaving(false);
    }
  }

  async function handleRoleChange(user, role) {
    try {
      await laravel.patch(`/users/${user.id}`, { role });
      setUsers((list) => list.map((u) => (u.id === user.id ? { ...u, role } : u)));
      toast.success('Role updated.');
    } catch {
      // toast already shown by interceptor
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold text-gray-900">Users</h1>
        <button
          onClick={() => setShowNewForm(true)}
          className="bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-indigo-700"
        >
          New User
        </button>
      </div>

      {showNewForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">New User</h2>
            <form onSubmit={handleCreate} className="flex flex-col gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  required
                  value={newUser.name}
                  onChange={(e) => setNewUser((u) => ({ ...u, name: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  required
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser((u) => ({ ...u, email: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <PasswordInput
                  required
                  minLength={8}
                  value={newUser.password}
                  onChange={(e) => setNewUser((u) => ({ ...u, password: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                <PasswordInput
                  required
                  minLength={8}
                  value={newUser.passwordConfirmation}
                  onChange={(e) => setNewUser((u) => ({ ...u, passwordConfirmation: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser((u) => ({ ...u, role: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                >
                  <option value="team_member">Team Member</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 mt-2">
                <button
                  type="button"
                  disabled={creating}
                  onClick={() => {
                    setShowNewForm(false);
                    setNewUser({ name: '', email: '', password: '', passwordConfirmation: '', role: 'team_member' });
                  }}
                  className="text-sm font-medium px-4 py-2 rounded-md text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50"
                >
                  {creating ? 'Creating…' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingUser && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Edit User</h2>
            <form onSubmit={handleEditSave} className="flex flex-col gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  required
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm((f) => ({ ...f, role: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                >
                  <option value="team_member">Team Member</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 mt-2">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => setEditingUser(null)}
                  className="text-sm font-medium px-4 py-2 rounded-md text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50"
                >
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-3 items-center mb-4">
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm"
        >
          <option value="all">All Roles</option>
          <option value="team_member">Team Member</option>
          <option value="manager">Manager</option>
          <option value="admin">Admin</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading…</p>
      ) : (
        <table className="w-full bg-white border border-gray-200 rounded-lg overflow-hidden text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-2 font-medium">Name</th>
              <th className="px-4 py-2 font-medium">Email</th>
              <th className="px-4 py-2 font-medium">Role</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredUsers.map((user) => (
              <tr key={user.id}>
                <td className="px-4 py-2 text-gray-900">{user.name}</td>
                <td className="px-4 py-2 text-gray-600">{user.email}</td>
                <td className="px-4 py-2">
                  <select
                    value={user.role}
                    onChange={(e) => handleRoleChange(user, e.target.value)}
                    className="border border-gray-300 rounded-md px-2 py-1 text-sm"
                  >
                    <option value="team_member">Team Member</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
                <td className="px-4 py-2">
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded-full ${
                      user.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {user.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-2 text-right whitespace-nowrap">
                  <button onClick={() => openEdit(user)} className="text-indigo-600 hover:underline mr-3">
                    Edit
                  </button>
                  <button onClick={() => handleToggleStatus(user)} className="text-indigo-600 hover:underline">
                    {user.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
