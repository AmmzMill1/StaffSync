import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import api, { errorMessage } from '../api';
import { useFetch, fmtDate } from '../hooks';
import { Alert, Loading, PageHead, Pagination, useForm } from '../components/ui';

function NewTraining({ onDone, role }) {
  const [people, setPeople] = useState([]);
  const [form, bind, setForm] = useForm({ title: '', description: '', startDate: '', endDate: '', mode: 'online', assignees: [] });
  const [msg, setMsg] = useState({});
  useEffect(() => {
    // Managers can enroll their team. HR can enroll anyone.
    const url = role === 'manager' ? '/team' : '/employees?limit=100';
    api.get(url).then((r) => setPeople(role === 'manager' ? r.data : r.data.items)).catch(() => {});
  }, [role]);

  const toggle = (id) => setForm((f) => ({ ...f, assignees: f.assignees.includes(id) ? f.assignees.filter((x) => x !== id) : [...f.assignees, id] }));
  const submit = async (e) => {
    e.preventDefault();
    setMsg({});
    try {
      await api.post('/trainings', form);
      setForm({ title: '', description: '', startDate: '', endDate: '', mode: 'online', assignees: [] });
      setMsg({ ok: 'Training created.' });
      onDone();
    } catch (err) { setMsg({ error: errorMessage(err) }); }
  };

  return (
    <form className="panel mb-4" onSubmit={submit}>
      <h2>New training program</h2>
      <Alert {...msg} />
      <div className="row g-3">
        <div className="col-md-6"><label className="form-label" htmlFor="title">Title</label><input id="title" required className="form-control" {...bind('title')} /></div>
        <div className="col-md-2"><label className="form-label" htmlFor="mode">Mode</label><select id="mode" className="form-select" {...bind('mode')}><option value="online">Online</option><option value="in-person">In person</option></select></div>
        <div className="col-md-2"><label className="form-label" htmlFor="startDate">Starts</label><input id="startDate" type="date" required className="form-control" {...bind('startDate')} /></div>
        <div className="col-md-2"><label className="form-label" htmlFor="endDate">Ends</label><input id="endDate" type="date" required min={form.startDate} className="form-control" {...bind('endDate')} /></div>
        <div className="col-12"><label className="form-label" htmlFor="description">Description</label><textarea id="description" rows={2} className="form-control" {...bind('description')} /></div>
        <div className="col-12">
          <div className="form-label">Who should attend?</div>
          {people.length === 0 ? <div className="text-muted small">{role === 'manager' ? 'Add people to your team first.' : 'No employees found.'}</div> : (
            <div className="d-flex flex-wrap gap-3">
              {people.map((p) => (
                <div className="form-check" key={p.id}>
                  <input className="form-check-input" type="checkbox" id={`p-${p.id}`} checked={form.assignees.includes(p.id)} onChange={() => toggle(p.id)} />
                  <label className="form-check-label" htmlFor={`p-${p.id}`}>{p.name}</label>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <button className="btn btn-primary mt-3">Create training</button>
    </form>
  );
}

export default function Trainings() {
  const { user } = useSelector((s) => s.auth);
  const [page, setPage] = useState(1);
  const { data, loading, reload } = useFetch(`/trainings?page=${page}`);
  const [err, setErr] = useState(null);
  const canManage = user.role !== 'employee';

  const remove = async (id) => {
    if (!window.confirm('Delete this training?')) return;
    try { await api.delete(`/trainings/${id}`); reload(); } catch (e) { setErr(errorMessage(e)); }
  };

  return (
    <>
      <PageHead title="Training" sub={canManage ? 'Programs you run for your people.' : 'Programs you are enrolled in.'} />
      {canManage && <NewTraining role={user.role} onDone={reload} />}
      <Alert error={err} />
      {loading ? <Loading /> : !data.items.length ? <div className="panel empty">{canManage ? 'No training programs yet.' : 'You are not enrolled in any training yet.'}</div> : (
        <div className="row g-3">{data.items.map((t) => (
          <div className="col-md-6" key={t._id}><div className="panel h-100">
            <div className="d-flex justify-content-between"><h2 className="mb-1">{t.title}</h2>
              {canManage && (user.role === 'hr' || t.createdBy?._id === user.id) && <button className="btn btn-sm btn-outline-danger align-self-start" onClick={() => remove(t._id)}>Delete</button>}</div>
            <div className="text-muted small mb-2">{fmtDate(t.startDate)} to {fmtDate(t.endDate)} ({t.mode})</div>
            <p>{t.description}</p>
            <div className="small text-muted">Led by {t.createdBy?.name}{canManage && t.assignees?.length ? `. Attending: ${t.assignees.map((a) => a.name).join(', ')}` : ''}</div>
          </div></div>
        ))}</div>
      )}
      {data && <Pagination page={data.page} pages={data.pages} onChange={setPage} />}
    </>
  );
}
