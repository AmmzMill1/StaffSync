import { useState } from 'react';
import { useSelector } from 'react-redux';
import api, { errorMessage } from '../api';
import { useFetch, fmtDate } from '../hooks';
import { Alert, Loading, PageHead, Pagination, useForm } from '../components/ui';

export default function Announcements() {
  const { user } = useSelector((s) => s.auth);
  const [page, setPage] = useState(1);
  const { data, loading, reload } = useFetch(`/announcements?page=${page}`);
  const [form, bind, setForm] = useForm({ title: '', body: '', pinned: false });
  const [msg, setMsg] = useState({});

  const post = async (e) => {
    e.preventDefault();
    setMsg({});
    try { await api.post('/announcements', form); setForm({ title: '', body: '', pinned: false }); setMsg({ ok: 'Announcement posted.' }); reload(); }
    catch (err) { setMsg({ error: errorMessage(err) }); }
  };
  const remove = async (id) => {
    if (!window.confirm('Delete this announcement?')) return;
    try { await api.delete(`/announcements/${id}`); reload(); } catch (err) { setMsg({ error: errorMessage(err) }); }
  };

  return (
    <>
      <PageHead title="Announcements" sub="News and updates from HR." />
      {user.role === 'hr' && (
        <form className="panel mb-4" onSubmit={post}>
          <h2>Post an announcement</h2>
          <Alert {...msg} />
          <input className="form-control mb-2" placeholder="Title" required aria-label="Title" {...bind('title')} />
          <textarea className="form-control mb-2" rows={3} placeholder="Message" required aria-label="Message" {...bind('body')} />
          <div className="form-check mb-3"><input id="pinned" type="checkbox" className="form-check-input" checked={form.pinned} {...{ name: 'pinned', onChange: bind('pinned').onChange }} /><label className="form-check-label" htmlFor="pinned">Pin to the top</label></div>
          <button className="btn btn-primary">Post announcement</button>
        </form>
      )}
      {loading ? <Loading /> : !data.items.length ? <div className="panel empty">No announcements yet.</div> : data.items.map((a) => (
        <article key={a._id} className="panel mb-3">
          <div className="d-flex justify-content-between align-items-start">
            <h2 className="mb-1">{a.pinned && <span className="chip me-2">Pinned</span>}{a.title}</h2>
            {user.role === 'hr' && <button className="btn btn-sm btn-outline-danger" onClick={() => remove(a._id)}>Delete</button>}
          </div>
          <div className="text-muted small mb-2">{a.postedBy?.name} on {fmtDate(a.createdAt)}</div>
          <div style={{ whiteSpace: 'pre-wrap' }}>{a.body}</div>
        </article>
      ))}
      {data && <Pagination page={data.page} pages={data.pages} onChange={setPage} />}
    </>
  );
}
