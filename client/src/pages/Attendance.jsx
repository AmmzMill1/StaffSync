import { useState } from 'react';
import { useSelector } from 'react-redux';
import { useFetch, fmtTime } from '../hooks';
import { Chip, Loading, PageHead, Pagination } from '../components/ui';

function Table({ url, showPerson }) {
  const [page, setPage] = useState(1);
  const [month, setMonth] = useState('');
  const q = `${url}?page=${page}${month ? `&month=${month}` : ''}`;
  const { data, loading } = useFetch(q);
  return (
    <div className="panel">
      <div className="d-flex justify-content-end mb-2">
        <input type="month" className="form-control form-control-sm w-auto" value={month} onChange={(e) => { setMonth(e.target.value); setPage(1); }} aria-label="Filter by month" />
      </div>
      {loading ? <Loading /> : !data.items.length ? <div className="empty">No attendance records for this period.</div> : (
        <div className="table-responsive"><table className="table mb-0">
          <thead><tr><th>Date</th>{showPerson && <th>Person</th>}<th>Check in</th><th>Check out</th><th>Status</th></tr></thead>
          <tbody>{data.items.map((r) => (
            <tr key={r._id}><td>{r.date}</td>{showPerson && <td>{r.user?.name}</td>}<td>{fmtTime(r.checkIn)}</td><td>{fmtTime(r.checkOut)}</td><td><Chip value={r.status} /></td></tr>
          ))}</tbody>
        </table></div>
      )}
      {data && <Pagination page={data.page} pages={data.pages} onChange={setPage} />}
    </div>
  );
}

export default function Attendance() {
  const { user } = useSelector((s) => s.auth);
  const [tab, setTab] = useState('mine');
  const canSeeOthers = user.role !== 'employee';
  return (
    <>
      <PageHead title="Attendance" sub="Check in and out from your dashboard." />
      {canSeeOthers && (
        <ul className="nav nav-tabs mb-3">
          <li className="nav-item"><button className={`nav-link ${tab === 'mine' ? 'active' : ''}`} onClick={() => setTab('mine')}>My attendance</button></li>
          <li className="nav-item"><button className={`nav-link ${tab === 'all' ? 'active' : ''}`} onClick={() => setTab('all')}>{user.role === 'hr' ? 'Everyone' : 'My team'}</button></li>
        </ul>
      )}
      {tab === 'mine' ? <Table url="/attendance/me" /> : <Table url="/attendance" showPerson />}
    </>
  );
}
