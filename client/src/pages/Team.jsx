import { useState } from 'react';
import api, { errorMessage } from '../api';
import { useFetch } from '../hooks';
import { Alert, Loading, PageHead } from '../components/ui';

export default function Team() {
  const team = useFetch('/team');
  const open = useFetch('/team/unassigned');
  const perf = useFetch('/reports/team');
  const [err, setErr] = useState(null);
  const [pick, setPick] = useState('');

  const refresh = () => { team.reload(); open.reload(); perf.reload(); };
  const add = async () => {
    if (!pick) return;
    setErr(null);
    try { await api.post('/team', { userId: pick }); setPick(''); refresh(); } catch (e) { setErr(errorMessage(e)); }
  };
  const remove = async (id, name) => {
    if (!window.confirm(`Remove ${name} from your team?`)) return;
    try { await api.delete(`/team/${id}`); refresh(); } catch (e) { setErr(errorMessage(e)); }
  };

  if (team.loading || perf.loading) return <Loading />;
  const stats = Object.fromEntries((perf.data?.members || []).map((m) => [m.id, m]));

  return (
    <>
      <PageHead title="My team" sub={`Attendance and leave figures are for ${perf.data?.month || 'this month'}.`} />
      <Alert error={err} />
      <div className="panel mb-4">
        <h2>Add someone to your team</h2>
        <div className="d-flex gap-2">
          <select className="form-select" value={pick} onChange={(e) => setPick(e.target.value)} aria-label="Employee to add">
            <option value="">{open.data?.length ? 'Choose an employee...' : 'No unassigned employees'}</option>
            {open.data?.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.department || 'No department'})</option>)}
          </select>
          <button className="btn btn-primary" onClick={add} disabled={!pick}>Add</button>
        </div>
      </div>
      <div className="panel">
        <h2>Team members</h2>
        {!team.data.length ? <div className="empty">Your team is empty.</div> : (
          <div className="table-responsive"><table className="table mb-0">
            <thead><tr><th>Name</th><th>Job title</th><th>Days present</th><th>Late</th><th>Leave days taken</th><th /></tr></thead>
            <tbody>{team.data.map((m) => (
              <tr key={m.id}><td>{m.name}<div className="text-muted small">{m.email}</div></td><td>{m.designation || '-'}</td>
                <td>{stats[m.id]?.daysPresent ?? 0}</td><td>{stats[m.id]?.daysLate ?? 0}</td><td>{stats[m.id]?.leaveDaysTaken ?? 0}</td>
                <td><button className="btn btn-sm btn-outline-secondary" onClick={() => remove(m.id, m.name)}>Remove</button></td></tr>
            ))}</tbody>
          </table></div>
        )}
      </div>
    </>
  );
}
