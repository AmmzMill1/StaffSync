import { useEffect, useState } from 'react';
import api, { errorMessage } from '../api';
import { useFetch } from '../hooks';
import { Alert, Chip, Loading, PageHead, Pagination, useForm } from '../components/ui';

const EMPTY = { name: '', email: '', password: '', role: 'employee', department: '', designation: '', manager: '' };

export default function Employees() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [q, setQ] = useState('');
  const url = `/employees?page=${page}${q ? `&search=${encodeURIComponent(q)}` : ''}${role ? `&role=${role}` : ''}`;
  const { data, loading, reload } = useFetch(url);
  const [managers, setManagers] = useState([]);
  const [form, bind, setForm] = useForm(EMPTY);
  const [showForm, setShowForm] = useState(false);
  const [msg, setMsg] = useState({});

  const loadManagers = () => api.get('/employees/managers').then((r) => setManagers(r.data)).catch(() => {});
  useEffect(() => { loadManagers(); }, []);
  useEffect(() => { const t = setTimeout(() => { setQ(search); setPage(1); }, 300); return () => clearTimeout(t); }, [search]);

  const create = async (e) => {
    e.preventDefault(); setMsg({});
    try { await api.post('/employees', form); setForm(EMPTY); setMsg({ ok: 'Person added.' }); setShowForm(false); reload(); loadManagers(); }
    catch (err) { setMsg({ error: errorMessage(err) }); }
  };
  const patch = async (id, body) => {
    setMsg({});
    try { await api.put(`/employees/${id}`, body); reload(); loadManagers(); } catch (err) { setMsg({ error: errorMessage(err) }); }
  };
  const deactivate = async (p) => {
    if (!window.confirm(`Deactivate ${p.name}? They will no longer be able to log in.`)) return;
    try { await api.delete(`/employees/${p.id}`); reload(); } catch (err) { setMsg({ error: errorMessage(err) }); }
  };

  return (
    <>
      <PageHead title="Employees" sub="Everyone in the company.">
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>{showForm ? 'Close' : 'Add person'}</button>
      </PageHead>
      <Alert {...msg} />
      {showForm && (
        <form className="panel mb-4" onSubmit={create}>
          <h2>Add a person</h2>
          <div className="row g-3">
            <div className="col-md-4"><label className="form-label" htmlFor="n">Full name</label><input id="n" required className="form-control" {...bind('name')} /></div>
            <div className="col-md-4"><label className="form-label" htmlFor="e">Email</label><input id="e" type="email" required className="form-control" {...bind('email')} /></div>
            <div className="col-md-4"><label className="form-label" htmlFor="p">Temporary password</label><input id="p" type="password" minLength={6} required className="form-control" {...bind('password')} /></div>
            <div className="col-md-3"><label className="form-label" htmlFor="r">Role</label><select id="r" className="form-select" {...bind('role')}><option value="employee">Employee</option><option value="manager">Manager</option><option value="hr">HR</option></select></div>
            <div className="col-md-3"><label className="form-label" htmlFor="d">Department</label><input id="d" className="form-control" {...bind('department')} /></div>
            <div className="col-md-3"><label className="form-label" htmlFor="t">Job title</label><input id="t" className="form-control" {...bind('designation')} /></div>
            <div className="col-md-3"><label className="form-label" htmlFor="m">Manager</label><select id="m" className="form-select" {...bind('manager')}><option value="">None</option>{managers.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</select></div>
          </div>
          <button className="btn btn-primary mt-3">Add person</button>
        </form>
      )}
      <div className="panel">
        <div className="d-flex gap-2 mb-3 flex-wrap">
          <input className="form-control w-auto flex-grow-1" placeholder="Search by name or email" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search" />
          <select className="form-select w-auto" value={role} onChange={(e) => { setRole(e.target.value); setPage(1); }} aria-label="Filter by role">
            <option value="">All roles</option><option value="employee">Employees</option><option value="manager">Managers</option><option value="hr">HR</option>
          </select>
        </div>
        {loading ? <Loading /> : !data.items.length ? <div className="empty">No one matches that search.</div> : (
          <div className="table-responsive"><table className="table align-middle mb-0">
            <thead><tr><th>Name</th><th>ID</th><th>Department</th><th>Role</th><th>Manager</th><th>Status</th><th /></tr></thead>
            <tbody>{data.items.map((p) => (
              <tr key={p.id}>
                <td>{p.name}<div className="text-muted small">{p.email}</div></td><td>{p.employeeId}</td><td>{p.department || '-'}</td>
                <td><select className="form-select form-select-sm" value={p.role} onChange={(e) => patch(p.id, { role: e.target.value })} aria-label={`Role for ${p.name}`}>
                  <option value="employee">Employee</option><option value="manager">Manager</option><option value="hr">HR</option></select></td>
                <td><select className="form-select form-select-sm" value={p.manager?._id || p.manager || ''} onChange={(e) => patch(p.id, { manager: e.target.value })} aria-label={`Manager for ${p.name}`}>
                  <option value="">None</option>{managers.filter((m) => m.id !== p.id).map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</select></td>
                <td>{p.isActive ? <Chip value="present" /> : <Chip value="absent" />}</td>
                <td className="text-nowrap">{p.isActive
                  ? <button className="btn btn-sm btn-outline-danger" onClick={() => deactivate(p)}>Deactivate</button>
                  : <button className="btn btn-sm btn-outline-primary" onClick={() => patch(p.id, { isActive: true })}>Reactivate</button>}</td>
              </tr>
            ))}</tbody>
          </table></div>
        )}
        {data && <Pagination page={data.page} pages={data.pages} onChange={setPage} />}
      </div>
    </>
  );
}
