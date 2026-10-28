import { useState } from 'react';
import { useSelector } from 'react-redux';
import api, { errorMessage } from '../api';
import { useFetch, fmtDate } from '../hooks';
import { Alert, Chip, Loading, PageHead, Pagination, useForm } from '../components/ui';

function ApplyForm({ onDone }) {
  const [form, bind, setForm] = useForm({ type: 'casual', from: '', to: '', reason: '' });
  const [msg, setMsg] = useState({});
  const submit = async (e) => {
    e.preventDefault();
    setMsg({});
    try {
      await api.post('/leaves', form);
      setMsg({ ok: 'Leave request sent.' });
      setForm({ type: 'casual', from: '', to: '', reason: '' });
      onDone();
    } catch (err) { setMsg({ error: errorMessage(err) }); }
  };
  return (
    <form className="panel mb-4" onSubmit={submit}>
      <h2>Apply for leave</h2>
      <Alert {...msg} />
      <div className="row g-3">
        <div className="col-md-3"><label className="form-label" htmlFor="type">Type</label>
          <select id="type" className="form-select" {...bind('type')}>
            <option value="casual">Casual</option><option value="sick">Sick</option><option value="earned">Earned</option><option value="unpaid">Unpaid</option>
          </select></div>
        <div className="col-md-3"><label className="form-label" htmlFor="from">From</label><input id="from" type="date" required className="form-control" {...bind('from')} /></div>
        <div className="col-md-3"><label className="form-label" htmlFor="to">To</label><input id="to" type="date" required min={form.from} className="form-control" {...bind('to')} /></div>
        <div className="col-md-12"><label className="form-label" htmlFor="reason">Reason</label><textarea id="reason" rows={2} required className="form-control" {...bind('reason')} /></div>
      </div>
      <button className="btn btn-primary mt-3">Send request</button>
    </form>
  );
}

function MyLeaves({ refreshKey, onChanged }) {
  const [page, setPage] = useState(1);
  const { data, loading, reload } = useFetch(`/leaves/me?page=${page}&k=${refreshKey}`);
  const [err, setErr] = useState(null);
  const cancel = async (id) => {
    setErr(null);
    try { await api.patch(`/leaves/${id}/cancel`); reload(); onChanged(); } catch (e) { setErr(errorMessage(e)); }
  };
  return (
    <div className="panel">
      <h2>Your requests</h2>
      <Alert error={err} />
      {loading ? <Loading /> : !data.items.length ? <div className="empty">You haven't requested any leave yet.</div> : (
        <div className="table-responsive"><table className="table mb-0">
          <thead><tr><th>Type</th><th>Dates</th><th>Days</th><th>Status</th><th>Reviewer note</th><th /></tr></thead>
          <tbody>{data.items.map((l) => (
            <tr key={l._id}>
              <td className="text-capitalize">{l.type}</td><td>{fmtDate(l.from)} to {fmtDate(l.to)}</td><td>{l.days}</td>
              <td><Chip value={l.status} /></td><td>{l.reviewNote || (l.reviewedBy ? `By ${l.reviewedBy.name}` : '-')}</td>
              <td>{l.status === 'pending' && <button className="btn btn-sm btn-outline-secondary" onClick={() => cancel(l._id)}>Cancel</button>}</td>
            </tr>
          ))}</tbody>
        </table></div>
      )}
      {data && <Pagination page={data.page} pages={data.pages} onChange={setPage} />}
    </div>
  );
}

function Review() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('pending');
  const { data, loading, reload } = useFetch(`/leaves?page=${page}&status=${status}`);
  const [err, setErr] = useState(null);
  const decide = async (id, decision) => {
    setErr(null);
    const reviewNote = decision === 'rejected' ? window.prompt('Reason for rejecting (shown to the employee):') || '' : '';
    try { await api.patch(`/leaves/${id}/review`, { status: decision, reviewNote }); reload(); } catch (e) { setErr(errorMessage(e)); }
  };
  return (
    <div className="panel">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h2 className="mb-0">Requests to review</h2>
        <select className="form-select form-select-sm w-auto" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} aria-label="Filter by status">
          <option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option><option value="">All</option>
        </select>
      </div>
      <Alert error={err} />
      {loading ? <Loading /> : !data.items.length ? <div className="empty">No requests here.</div> : (
        <div className="table-responsive"><table className="table mb-0">
          <thead><tr><th>Person</th><th>Type</th><th>Dates</th><th>Days</th><th>Reason</th><th>Status</th><th /></tr></thead>
          <tbody>{data.items.map((l) => (
            <tr key={l._id}>
              <td>{l.user?.name}</td><td className="text-capitalize">{l.type}</td><td>{fmtDate(l.from)} to {fmtDate(l.to)}</td><td>{l.days}</td><td>{l.reason}</td><td><Chip value={l.status} /></td>
              <td className="text-nowrap">{l.status === 'pending' && (<>
                <button className="btn btn-sm btn-primary me-1" onClick={() => decide(l._id, 'approved')}>Approve</button>
                <button className="btn btn-sm btn-outline-danger" onClick={() => decide(l._id, 'rejected')}>Reject</button></>)}</td>
            </tr>
          ))}</tbody>
        </table></div>
      )}
      {data && <Pagination page={data.page} pages={data.pages} onChange={setPage} />}
    </div>
  );
}

export default function Leaves() {
  const { user } = useSelector((s) => s.auth);
  const [tab, setTab] = useState('mine');
  const [key, setKey] = useState(0);
  const canReview = user.role !== 'employee';
  return (
    <>
      <PageHead title="Leaves" />
      {canReview && (
        <ul className="nav nav-tabs mb-3">
          <li className="nav-item"><button className={`nav-link ${tab === 'mine' ? 'active' : ''}`} onClick={() => setTab('mine')}>My leave</button></li>
          <li className="nav-item"><button className={`nav-link ${tab === 'review' ? 'active' : ''}`} onClick={() => setTab('review')}>Review requests</button></li>
        </ul>
      )}
      {tab === 'mine' ? (<><ApplyForm onDone={() => setKey((k) => k + 1)} /><MyLeaves refreshKey={key} onChanged={() => setKey((k) => k + 1)} /></>) : <Review />}
    </>
  );
}
