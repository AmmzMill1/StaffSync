import { useEffect, useRef, useState } from 'react';
import api from '../api';
import { fmtDate } from '../hooks';

export default function Notifications() {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState({ items: [], unread: 0 });
  const ref = useRef(null);

  const load = () => api.get('/notifications').then((r) => setData(r.data)).catch(() => {});
  useEffect(() => {
    load();
    const t = setInterval(load, 60000); // refresh every minute
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    const close = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const readAll = async () => { await api.patch('/notifications/read-all'); load(); };

  return (
    <div className="position-relative" ref={ref}>
      <button className="btn btn-sm btn-outline-secondary" onClick={() => setOpen(!open)} aria-expanded={open}>
        Notifications{data.unread > 0 && <span className="badge text-bg-primary ms-1">{data.unread}</span>}
      </button>
      {open && (
        <div className="notif-panel">
          <div className="d-flex justify-content-between align-items-center p-2 border-bottom">
            <strong className="small ms-1">Notifications</strong>
            <button className="btn btn-link btn-sm" onClick={readAll} disabled={!data.unread}>Mark all read</button>
          </div>
          <div style={{ maxHeight: 340, overflowY: 'auto' }}>
            {data.items.length === 0 && <div className="empty">Nothing yet.</div>}
            {data.items.map((n) => (
              <div key={n._id} className={`notif-item ${n.read ? '' : 'unread'}`}>
                {n.message}
                <div className="text-muted small">{fmtDate(n.createdAt)}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
