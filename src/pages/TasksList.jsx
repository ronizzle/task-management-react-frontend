import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { laravel, node } from '@/api/client';
import { useAuth } from '@/context/AuthContext';
import { useAccessibleTeams } from '@/api/useAccessibleTeams';

const STATUS_COLORS = {
  pending: 'bg-gray-100 text-gray-700',
  in_progress: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

export function TasksList() {
  const { isTeamMember, isAdmin, isManager } = useAuth();
  const { teams, loading: teamsLoading } = useAccessibleTeams();
  const [teamId, setTeamId] = useState('');
  const [tasks, setTasks] = useState([]);
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [loading, setLoading] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'medium', due_date: '' });

  useEffect(() => {
    if (!teamsLoading && teams.length > 0 && !teamId) {
      setTeamId(String(teams[0].id));
    }
  }, [teams, teamsLoading, teamId]);

  useEffect(() => {
    if (!teamId) return;
    loadTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId, status, priority]);

  async function loadTasks() {
    setLoading(true);
    try {
      const { data } = await laravel.get(`/teams/${teamId}/tasks`, {
        params: { status: status || undefined, priority: priority || undefined },
      });
      setTasks(data.data ?? []);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    try {
      await laravel.post(`/teams/${teamId}/tasks`, newTask);
      toast.success('Task created.');
      setShowNewForm(false);
      setNewTask({ title: '', description: '', priority: 'medium', due_date: '' });
      loadTasks();
    } catch {
      // toast already shown by interceptor
    }
  }

  const canCreate = isAdmin || isManager;

  async function handleExport(format) {
    try {
      const response = await node.post(
        '/export/tasks',
        { team_id: teamId, format, filters: { status: status || undefined, priority: priority || undefined } },
        { responseType: 'blob' }
      );
      const blob = new Blob([response.data]);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tasks-team-${teamId}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // toast already shown by interceptor
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold text-gray-900">Tasks</h1>
        <div className="flex gap-2">
          {teamId && (
            <div className="flex gap-1">
              {['csv', 'json', 'xlsx'].map((format) => (
                <button
                  key={format}
                  onClick={() => handleExport(format)}
                  className="text-sm border border-gray-300 rounded-md px-3 py-2 hover:bg-gray-50"
                >
                  Export {format.toUpperCase()}
                </button>
              ))}
            </div>
          )}
          {canCreate && teamId && (
            <button
              onClick={() => setShowNewForm((v) => !v)}
              className="bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-indigo-700"
            >
              {showNewForm ? 'Cancel' : 'New Task'}
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <select
          value={teamId}
          onChange={(e) => setTeamId(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm"
        >
          {teams.map((team) => (
            <option key={team.id} value={team.id}>
              {team.name}
            </option>
          ))}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="border border-gray-300 rounded-md px-3 py-2 text-sm">
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In progress</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select value={priority} onChange={(e) => setPriority(e.target.value)} className="border border-gray-300 rounded-md px-3 py-2 text-sm">
          <option value="">All priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </div>

      {showNewForm && (
        <form onSubmit={handleCreate} className="bg-white border border-gray-200 rounded-lg p-4 mb-6 space-y-3">
          <input
            required
            placeholder="Title"
            value={newTask.title}
            onChange={(e) => setNewTask((t) => ({ ...t, title: e.target.value }))}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
          <textarea
            placeholder="Description"
            value={newTask.description}
            onChange={(e) => setNewTask((t) => ({ ...t, description: e.target.value }))}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
          <div className="flex gap-3">
            <select
              value={newTask.priority}
              onChange={(e) => setNewTask((t) => ({ ...t, priority: e.target.value }))}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
            <input
              type="date"
              value={newTask.due_date}
              onChange={(e) => setNewTask((t) => ({ ...t, due_date: e.target.value }))}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
          </div>
          <button type="submit" className="bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-indigo-700">
            Create
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-gray-500">Loading…</p>
      ) : tasks.length === 0 ? (
        <p className="text-gray-500">No tasks found.</p>
      ) : (
        <ul className="divide-y divide-gray-200 bg-white border border-gray-200 rounded-lg">
          {tasks.map((task) => (
            <li key={task.id} className="px-4 py-3 flex items-center justify-between">
              <div>
                <Link to={`/tasks/${task.id}`} className="text-gray-900 font-medium hover:text-indigo-600">
                  {task.title}
                </Link>
                <p className="text-sm text-gray-500">
                  {task.priority} priority{task.due_date ? ` · due ${task.due_date.slice(0, 10)}` : ''}
                </p>
              </div>
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${STATUS_COLORS[task.status]}`}>
                {task.status.replace('_', ' ')}
              </span>
            </li>
          ))}
        </ul>
      )}

      {isTeamMember && <p className="text-sm text-gray-400 mt-4">You're only seeing tasks assigned to you.</p>}
    </div>
  );
}
