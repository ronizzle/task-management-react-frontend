import { useEffect, useState } from 'react';
import { laravel } from './client';
import { useAuth } from '@/context/AuthContext';

/**
 * Admin/Manager can list all teams via GET /api/teams. Team Members can't
 * (that route is role-gated), so for them we read team memberships off
 * their own user record instead (GET /api/users/{id} eager-loads teams
 * when viewing yourself — see UserController::show).
 */
export function useAccessibleTeams() {
  const { user, isTeamMember } = useAuth();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        if (isTeamMember) {
          const { data } = await laravel.get(`/users/${user.id}`);
          if (!cancelled) setTeams(data.teams ?? []);
        } else {
          const { data } = await laravel.get('/teams', { params: { per_page: 100 } });
          if (!cancelled) setTeams(data.data ?? []);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [user?.id, isTeamMember]);

  return { teams, loading };
}
