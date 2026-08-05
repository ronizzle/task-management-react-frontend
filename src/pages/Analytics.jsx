import { useEffect, useState } from 'react';
import { node } from '@/api/client';
import { useAccessibleTeams } from '@/api/useAccessibleTeams';

export function Analytics() {
  const { teams, loading: teamsLoading } = useAccessibleTeams();
  const [teamId, setTeamId] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [summary, setSummary] = useState(null);
  const [productivity, setProductivity] = useState(null);
  const [deadlines, setDeadlines] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!teamsLoading && teams.length > 0 && !teamId) {
      setTeamId(String(teams[0].id));
    }
  }, [teams, teamsLoading, teamId]);

  useEffect(() => {
    if (!teamId) return;
    loadAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId, dateFrom, dateTo]);

  async function loadAnalytics() {
    setLoading(true);
    try {
      const [summaryRes, productivityRes, deadlinesRes] = await Promise.all([
        node.get('/analytics/task-summary', {
          params: { team_id: teamId, date_from: dateFrom || undefined, date_to: dateTo || undefined },
        }),
        node.get('/analytics/team-productivity', { params: { team_id: teamId } }),
        node.get('/analytics/upcoming-deadlines', { params: { team_id: teamId, within_hours: 168 } }),
      ]);
      setSummary(summaryRes.data);
      setProductivity(productivityRes.data);
      setDeadlines(deadlinesRes.data);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h1 className="text-2xl font-semibold text-gray-900">Analytics</h1>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-1 text-sm text-gray-600">
            From
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              max={dateTo || undefined}
              className="border border-gray-300 rounded-md px-2 py-2 text-sm"
            />
          </label>
          <label className="flex items-center gap-1 text-sm text-gray-600">
            To
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              min={dateFrom || undefined}
              className="border border-gray-300 rounded-md px-2 py-2 text-sm"
            />
          </label>
          {(dateFrom || dateTo) && (
            <button
              type="button"
              onClick={() => {
                setDateFrom('');
                setDateTo('');
              }}
              className="text-sm text-gray-500 hover:text-gray-700 underline"
            >
              Clear
            </button>
          )}
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
        </div>
      </div>

      {loading || !summary ? (
        <p className="text-gray-500">Loading…</p>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Stat label="Total tasks" value={summary.total_tasks} />
            <Stat label="Completed" value={summary.completed_tasks} />
            <Stat label="Pending" value={summary.pending_tasks} />
            <Stat label="Avg completion (hrs)" value={summary.avg_completion_time} />
          </div>

          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-3">Team productivity</h2>
            <table className="w-full bg-white border border-gray-200 rounded-lg overflow-hidden text-sm">
              <thead className="bg-gray-50 text-left text-gray-500">
                <tr>
                  <th className="px-4 py-2 font-medium">Member</th>
                  <th className="px-4 py-2 font-medium">Completed</th>
                  <th className="px-4 py-2 font-medium">In progress</th>
                  <th className="px-4 py-2 font-medium">Pending</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {productivity?.members.map((m) => (
                  <tr key={m.user_id}>
                    <td className="px-4 py-2 text-gray-900">{m.name}</td>
                    <td className="px-4 py-2">{m.completed_tasks}</td>
                    <td className="px-4 py-2">{m.in_progress_tasks}</td>
                    <td className="px-4 py-2">{m.pending_tasks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-3">Upcoming deadlines (next 7 days)</h2>
            {deadlines?.tasks.length === 0 ? (
              <p className="text-gray-500">Nothing due soon.</p>
            ) : (
              <ul className="divide-y divide-gray-200 bg-white border border-gray-200 rounded-lg">
                {deadlines?.tasks.map((task) => (
                  <li key={task.id} className="px-4 py-3 flex items-center justify-between text-sm">
                    <span className="text-gray-900">{task.title}</span>
                    <span className="text-gray-500">{task.due_date?.slice(0, 10)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-2xl font-semibold text-gray-900">{value}</p>
    </div>
  );
}
