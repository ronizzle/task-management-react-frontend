import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { laravel } from '../api/client';
import { useAuth } from '../context/AuthContext';

const TRANSITIONS = {
  pending: ['in_progress', 'cancelled'],
  in_progress: ['completed', 'pending'],
  completed: [],
  cancelled: [],
};

export function TaskDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', priority: 'medium', due_date: '' });

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function load() {
    setLoading(true);
    try {
      const { data } = await laravel.get(`/tasks/${id}`);
      setTask(data);
      setForm({
        title: data.title,
        description: data.description ?? '',
        priority: data.priority,
        due_date: data.due_date ? data.due_date.slice(0, 10) : '',
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(newStatus) {
    try {
      const { data } = await laravel.patch(`/tasks/${id}/status`, { status: newStatus });
      setTask(data);
      toast.success(`Status updated to ${newStatus.replace('_', ' ')}.`);
    } catch {
      // toast already shown by interceptor (includes 422 invalid-transition message)
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    try {
      const { data } = await laravel.patch(`/tasks/${id}`, form);
      setTask(data);
      setEditing(false);
      toast.success('Task updated.');
    } catch {
      // toast already shown by interceptor
    }
  }

  async function handleDelete() {
    if (!confirm('Delete this task? This cannot be undone.')) return;
    try {
      await laravel.delete(`/tasks/${id}`);
      toast.success('Task deleted.');
      navigate('/tasks');
    } catch {
      // toast already shown by interceptor
    }
  }

  if (loading) return <p className="text-gray-500">Loading…</p>;
  if (!task) return <p className="text-gray-500">Task not found.</p>;

  const canEdit = isAdmin || user.role === 'manager' || task.assigned_to === user.id;
  const canDelete = isAdmin || task.created_by === user.id;
  const availableTransitions = TRANSITIONS[task.status] ?? [];

  return (
    <div className="max-w-2xl">
      <button onClick={() => navigate('/tasks')} className="text-sm text-indigo-600 mb-4">
        ← Back to tasks
      </button>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        {editing ? (
          <form onSubmit={handleSave} className="space-y-3">
            <input
              required
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm font-medium"
            />
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
            <div className="flex gap-3">
              <select
                value={form.priority}
                onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
              <input
                type="date"
                value={form.due_date}
                onChange={(e) => setForm((f) => ({ ...f, due_date: e.target.value }))}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-indigo-700">
                Save
              </button>
              <button type="button" onClick={() => setEditing(false)} className="text-sm text-gray-600 px-4 py-2">
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <>
            <div className="flex items-start justify-between mb-2">
              <h1 className="text-xl font-semibold text-gray-900">{task.title}</h1>
              <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                {task.status.replace('_', ' ')}
              </span>
            </div>
            <p className="text-gray-600 mb-4">{task.description || 'No description.'}</p>
            <dl className="grid grid-cols-2 gap-3 text-sm mb-6">
              <div>
                <dt className="text-gray-500">Priority</dt>
                <dd className="text-gray-900">{task.priority}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Due date</dt>
                <dd className="text-gray-900">{task.due_date ? task.due_date.slice(0, 10) : 'None'}</dd>
              </div>
            </dl>

            {availableTransitions.length > 0 && canEdit && (
              <div className="flex gap-2 mb-4">
                {availableTransitions.map((next) => (
                  <button
                    key={next}
                    onClick={() => handleStatusChange(next)}
                    className="text-sm border border-gray-300 rounded-md px-3 py-1.5 hover:bg-gray-50"
                  >
                    Mark as {next.replace('_', ' ')}
                  </button>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              {canEdit && (
                <button onClick={() => setEditing(true)} className="text-sm border border-gray-300 rounded-md px-4 py-2 hover:bg-gray-50">
                  Edit
                </button>
              )}
              {canDelete && (
                <button onClick={handleDelete} className="text-sm border border-red-300 text-red-600 rounded-md px-4 py-2 hover:bg-red-50">
                  Delete
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
