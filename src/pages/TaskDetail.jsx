import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { laravel } from '@/api/client';
import { useAuth } from '@/context/AuthContext';
import { getSocket } from '@/lib/socket';

const TRANSITIONS = {
  pending: ['in_progress', 'cancelled'],
  in_progress: ['completed', 'pending'],
  completed: [],
  cancelled: [],
};

export function TaskDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin, isManager } = useAuth();
  const canAssign = isAdmin || isManager;
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', priority: 'medium', due_date: '', assigned_to: '' });
  const [teamMembers, setTeamMembers] = useState([]);
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [postingComment, setPostingComment] = useState(false);

  useEffect(() => {
    load();
    loadComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Live updates via Socket.IO — see task-management-node-services'
  // realtime layer (src/realtime/socket.js) and Laravel's
  // App\Services\RealtimeBroadcaster, which fires these events after each
  // relevant task/comment write.
  useEffect(() => {
    const socket = getSocket();
    socket.emit('join:task', id);

    const onTaskUpdated = (updated) => {
      if (String(updated.id) === id) setTask(updated);
    };
    const onStatusChanged = (payload) => {
      if (String(payload.id) === id) {
        setTask((prev) => (prev ? { ...prev, status: payload.status } : prev));
      }
    };
    const onCommentCreated = (comment) => {
      setComments((prev) => (prev.some((c) => c.id === comment.id) ? prev : [...prev, comment]));
    };
    const onCommentDeleted = ({ id: commentId }) => {
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    };

    socket.on('task_updated', onTaskUpdated);
    socket.on('task_status_changed', onStatusChanged);
    socket.on('comment_created', onCommentCreated);
    socket.on('comment_deleted', onCommentDeleted);

    return () => {
      socket.emit('leave:task', id);
      socket.off('task_updated', onTaskUpdated);
      socket.off('task_status_changed', onStatusChanged);
      socket.off('comment_created', onCommentCreated);
      socket.off('comment_deleted', onCommentDeleted);
    };
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
        assigned_to: data.assigned_to ?? '',
      });
      if (isAdmin || isManager) {
        laravel.get(`/teams/${data.team_id}`).then(({ data: team }) => setTeamMembers(team.members ?? []));
      }
    } finally {
      setLoading(false);
    }
  }

  async function loadComments() {
    setCommentsLoading(true);
    try {
      const { data } = await laravel.get(`/tasks/${id}/comments`);
      setComments(data);
    } catch {
      // toast already shown by interceptor
    } finally {
      setCommentsLoading(false);
    }
  }

  async function handlePostComment(e) {
    e.preventDefault();
    if (!newComment.trim()) return;
    setPostingComment(true);
    try {
      const { data } = await laravel.post(`/tasks/${id}/comments`, { body: newComment.trim() });
      // The Socket.IO 'comment_created' broadcast (fired by Laravel before
      // it even returns this HTTP response) can beat this response back to
      // the client, so it may have already appended the same comment —
      // dedupe by id here the same way the socket handler does.
      setComments((prev) => (prev.some((c) => c.id === data.id) ? prev : [...prev, data]));
      setNewComment('');
    } catch {
      // toast already shown by interceptor
    } finally {
      setPostingComment(false);
    }
  }

  async function handleDeleteComment(commentId) {
    if (!confirm('Delete this comment?')) return;
    try {
      await laravel.delete(`/comments/${commentId}`);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch {
      // toast already shown by interceptor
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
      const payload = canAssign
        ? { ...form, assigned_to: form.assigned_to ? Number(form.assigned_to) : null }
        : { title: form.title, description: form.description, priority: form.priority, due_date: form.due_date };
      const { data } = await laravel.patch(`/tasks/${id}`, payload);
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
              {canAssign && (
                <select
                  value={form.assigned_to}
                  onChange={(e) => setForm((f) => ({ ...f, assigned_to: e.target.value }))}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                >
                  <option value="">Unassigned</option>
                  {teamMembers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              )}
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
              <div>
                <dt className="text-gray-500">Assignee</dt>
                <dd className="text-gray-900">
                  {teamMembers.find((m) => m.id === task.assigned_to)?.name ?? (task.assigned_to ? `User #${task.assigned_to}` : 'Unassigned')}
                </dd>
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

      <div className="bg-white border border-gray-200 rounded-lg p-6 mt-4">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Comments</h2>

        {commentsLoading ? (
          <p className="text-sm text-gray-500">Loading comments…</p>
        ) : comments.length === 0 ? (
          <p className="text-sm text-gray-500 mb-4">No comments yet.</p>
        ) : (
          <ul className="space-y-3 mb-4">
            {comments.map((comment) => (
              <li key={comment.id} className="border-b border-gray-100 pb-3 last:border-b-0">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-sm font-medium text-gray-900">{comment.user?.name ?? 'Unknown user'}</span>
                    <span className="text-xs text-gray-400 ml-2">
                      {new Date(comment.created_at).toLocaleString()}
                    </span>
                  </div>
                  {(isAdmin || comment.user_id === user.id) && (
                    <button
                      onClick={() => handleDeleteComment(comment.id)}
                      className="text-xs text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  )}
                </div>
                <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{comment.body}</p>
              </li>
            ))}
          </ul>
        )}

        <form onSubmit={handlePostComment} className="flex gap-2">
          <input
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment…"
            className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={postingComment || !newComment.trim()}
            className="bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50"
          >
            Post
          </button>
        </form>
      </div>
    </div>
  );
}
