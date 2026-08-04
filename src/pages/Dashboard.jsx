import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { laravel } from '@/api/client';
import { useAuth } from '@/context/AuthContext';
import { useAccessibleTeams } from '@/api/useAccessibleTeams';

export function Dashboard() {
  const { user } = useAuth();
  const { teams, loading: teamsLoading } = useAccessibleTeams();
  const [taskCounts, setTaskCounts] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (teamsLoading) return;

    let cancelled = false;

    async function loadCounts() {
      setLoading(true);
      const counts = {};
      await Promise.all(
        teams.map(async (team) => {
          const { data } = await laravel.get(`/teams/${team.id}/tasks`, { params: { per_page: 1 } });
          counts[team.id] = data.total ?? 0;
        })
      );
      if (!cancelled) setTaskCounts(counts);
      if (!cancelled) setLoading(false);
    }

    if (teams.length > 0) {
      loadCounts();
    } else {
      setLoading(false);
    }

    return () => {
      cancelled = true;
    };
  }, [teams, teamsLoading]);

  const totalTasks = Object.values(taskCounts).reduce((sum, n) => sum + n, 0);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-1">Welcome, {user?.name}</h1>
      <p className="text-gray-500 mb-6">
        You're signed in as <span className="font-medium">{user?.role}</span>.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-500">Accessible teams</p>
          <p className="text-2xl font-semibold text-gray-900">{teamsLoading ? '…' : teams.length}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-500">Tasks in view</p>
          <p className="text-2xl font-semibold text-gray-900">{loading ? '…' : totalTasks}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <Link to="/tasks" className="text-indigo-600 text-sm font-medium">
            Go to Tasks →
          </Link>
        </div>
      </div>

      <h2 className="text-lg font-medium text-gray-900 mb-3">Your teams</h2>
      {teamsLoading ? (
        <p className="text-gray-500">Loading…</p>
      ) : teams.length === 0 ? (
        <p className="text-gray-500">No teams yet.</p>
      ) : (
        <ul className="divide-y divide-gray-200 bg-white border border-gray-200 rounded-lg">
          {teams.map((team) => (
            <li key={team.id} className="px-4 py-3 flex items-center justify-between">
              <span className="text-gray-900">{team.name}</span>
              <span className="text-sm text-gray-500">{taskCounts[team.id] ?? '…'} task(s)</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
