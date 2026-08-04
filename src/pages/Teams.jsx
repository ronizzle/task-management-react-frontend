import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { laravel } from '../api/client';

export function Teams() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTeamName, setNewTeamName] = useState('');
  const [expanded, setExpanded] = useState(null);
  const [teamDetail, setTeamDetail] = useState(null);
  const [newMemberId, setNewMemberId] = useState('');

  useEffect(() => {
    loadTeams();
  }, []);

  async function loadTeams() {
    setLoading(true);
    try {
      const { data } = await laravel.get('/teams', { params: { per_page: 100 } });
      setTeams(data.data ?? []);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateTeam(e) {
    e.preventDefault();
    try {
      await laravel.post('/teams', { name: newTeamName });
      toast.success('Team created.');
      setNewTeamName('');
      loadTeams();
    } catch {
      // toast already shown by interceptor
    }
  }

  async function toggleExpand(team) {
    if (expanded === team.id) {
      setExpanded(null);
      setTeamDetail(null);
      return;
    }
    setExpanded(team.id);
    const { data } = await laravel.get(`/teams/${team.id}`);
    setTeamDetail(data);
  }

  async function handleAddMember(teamId) {
    if (!newMemberId) return;
    try {
      const { data } = await laravel.post(`/teams/${teamId}/members`, { user_id: Number(newMemberId) });
      setTeamDetail(data);
      setNewMemberId('');
      toast.success('Member added.');
    } catch {
      // toast already shown by interceptor
    }
  }

  async function handleRemoveMember(teamId, userId) {
    try {
      await laravel.delete(`/teams/${teamId}/members/${userId}`);
      setTeamDetail((d) => ({ ...d, members: d.members.filter((m) => m.id !== userId) }));
      toast.success('Member removed.');
    } catch {
      // toast already shown by interceptor
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-4">Teams</h1>

      <form onSubmit={handleCreateTeam} className="flex gap-2 mb-6">
        <input
          required
          placeholder="New team name"
          value={newTeamName}
          onChange={(e) => setNewTeamName(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm flex-1 max-w-xs"
        />
        <button type="submit" className="bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-indigo-700">
          Create team
        </button>
      </form>

      {loading ? (
        <p className="text-gray-500">Loading…</p>
      ) : (
        <ul className="space-y-3">
          {teams.map((team) => (
            <li key={team.id} className="bg-white border border-gray-200 rounded-lg">
              <button
                onClick={() => toggleExpand(team)}
                className="w-full text-left px-4 py-3 flex items-center justify-between"
              >
                <span className="text-gray-900 font-medium">{team.name}</span>
                <span className="text-sm text-gray-400">{expanded === team.id ? 'Hide' : 'View members'}</span>
              </button>

              {expanded === team.id && teamDetail && (
                <div className="border-t border-gray-100 px-4 py-3">
                  <ul className="divide-y divide-gray-100 mb-3">
                    {teamDetail.members.map((member) => (
                      <li key={member.id} className="py-2 flex items-center justify-between text-sm">
                        <span>
                          {member.name} <span className="text-gray-400">({member.pivot?.role})</span>
                        </span>
                        <button
                          onClick={() => handleRemoveMember(team.id, member.id)}
                          className="text-red-600 hover:underline"
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                  <div className="flex gap-2">
                    <input
                      placeholder="User ID to add"
                      value={newMemberId}
                      onChange={(e) => setNewMemberId(e.target.value)}
                      className="border border-gray-300 rounded-md px-3 py-1.5 text-sm w-40"
                    />
                    <button
                      onClick={() => handleAddMember(team.id)}
                      className="text-sm border border-gray-300 rounded-md px-3 py-1.5 hover:bg-gray-50"
                    >
                      Add member
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
