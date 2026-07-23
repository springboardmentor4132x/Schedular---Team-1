import { useEffect, useState } from 'react';
import { MdGroupAdd } from 'react-icons/md';
import { createTeam, inviteMember, listTeams, removeMember } from '../../services/teamService';
import { useApp } from '../../context/AppContext';
import '../Content/ContentPage.css';

export default function TeamsPage() {
  const { user } = useApp();
  const allowed = ['Administrator', 'Marketing Team'].includes(user?.role);
  const [teams, setTeams] = useState([]); const [name, setName] = useState(''); const [error, setError] = useState('');
  const [invite, setInvite] = useState({});
  const load = async () => { try { setTeams(await listTeams()); } catch { setError('Could not load teams.'); } };
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, []);
  const addTeam = async (event) => { event.preventDefault(); try { await createTeam(name); setName(''); await load(); } catch (err) { setError(err.response?.data?.detail || 'Could not create team.'); } };
  const addMember = async (teamId) => { const data = invite[teamId]; if (!data?.email) return; try { await inviteMember(teamId, { email: data.email, role: data.role || 'Content Creator' }); setInvite((current) => ({ ...current, [teamId]: {} })); await load(); } catch (err) { setError(err.response?.data?.detail || 'Could not add this member.'); } };
  if (!allowed) return <div className="sp-content"><div className="sp-content__empty">Team management is available to marketing teams and administrators.</div></div>;
  return <div className="sp-content"><header className="sp-content__header"><div><h1>Team Management</h1><p>Create teams and add registered members to your workspace.</p></div></header>{error && <div className="sp-content__error">{error}</div>}<form className="sp-content__composer" onSubmit={addTeam}><div className="sp-content__composer-title"><MdGroupAdd /> Create team</div><div className="sp-campaign-form"><input required value={name} onChange={(event) => setName(event.target.value)} placeholder="Team name" /><button>Create team</button></div></form><section className="sp-content__section"><h2>Your teams</h2>{teams.length === 0 ? <div className="sp-content__empty">No teams yet.</div> : <div className="sp-content__grid">{teams.map((team) => <article className="sp-post-card" key={team.id}><strong>{team.name}</strong>{team.members.map((member) => <small key={member.id}>{member.name} · {member.role}{member.id !== team.ownerId && <button className="sp-inline-button" type="button" onClick={async () => { await removeMember(team.id, member.id); await load(); }}>Remove</button>}</small>)}<input type="email" placeholder="Member email" value={invite[team.id]?.email || ''} onChange={(event) => setInvite((current) => ({ ...current, [team.id]: { ...current[team.id], email: event.target.value } }))}/><button type="button" onClick={() => addMember(team.id)}>Add member</button></article>)}</div>}</section></div>;
}
