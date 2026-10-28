import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api, { errorMessage } from '../api';
import { useFetch, fmtDate, fmtTime } from '../hooks';
import { Alert, Chip, Loading, PageHead, Stat } from '../components/ui';

// The check-in panel is the main thing on every dashboard: it's the action people take daily.
function ClockPanel() {
  const { data: today, reload, loading } = useFetch('/attendance/today');
  const [now, setNow] = useState(new Date());
  const [err, setErr] = useState(null);
  useEffect(() => { 
    const t = setInterval(() => setNow(new Date()), 1000); 
    return () => clearInterval(t); 
  }, []);

  const act = async (path) => {
    setErr(null);
    try { 
      await api.post(`/attendance/${path}`); 
      reload(); 
    } catch (e) { 
      setErr(errorMessage(e)); 
    }
  };

  let sub = 'You have not checked in today.';
  if (today?.checkIn && !today.checkOut) sub = `Checked in at ${fmtTime(today.checkIn)}.`;
  if (today?.checkOut) sub = `Checked in ${fmtTime(today.checkIn)}, checked out ${fmtTime(today.checkOut)}. See you tomorrow.`;

  return (
    <div className="mb-4">
      <div className="clock">
        <div>
          <div className="time">{now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
          <div className="sub">{loading ? 'Loading...' : sub}</div>
        </div>
        {!loading && !today && <button className="btn btn-primary" onClick={() => act('check-in')}>Check in</button>}
        {today && !today.checkOut && <button className="btn btn-light" onClick={() => act('check-out')}>Check out</button>}
      </div>
      <Alert error={err} />
    </div>
  );
}

function EmployeeStats() {
  const { data } = useFetch('/reports/me');
  return (
    <div className="row g-3 mb-4">
      <div className="col-6 col-md-3">
        <Stat label="Days present this month" value={data?.daysPresent} icon="calendar-check" />
      </div>
      <div className="col-6 col-md-3">
        <Stat label="Late arrivals" value={data?.daysLate} icon="clock-history" />
      </div>
      <div className="col-6 col-md-3">
        <Stat label="Leave days taken" value={data?.leaveDaysTaken} icon="calendar-x" />
      </div>
      <div className="col-6 col-md-3">
        <Stat label="Pending leave requests" value={data?.pendingLeaves} icon="hourglass-split" />
      </div>
    </div>
  );
}

function ManagerView() {
  const { data, loading } = useFetch('/reports/team');
  if (loading) return <Loading />;
  return (
    <>
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-4">
          <Stat label="Team members" value={data?.members.length} icon="people" />
        </div>
        <div className="col-6 col-md-4">
          <Stat label="Present today" value={data?.presentToday} icon="person-check" />
        </div>
        <div className="col-12 col-md-4">
          <Stat label="Leave requests to review" value={data?.pendingLeaves} icon="inbox" />
        </div>
      </div>
      <div className="panel mb-4">
        <div className="d-flex justify-content-between">
          <h2>Team this month</h2>
          <Link to="/team">Open team</Link>
        </div>
        {data.members.length === 0 ? (
          <div className="empty">No one reports to you yet. Add people from My team.</div>
        ) : (
          <div className="table-responsive">
            <table className="table mb-0">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Days present</th>
                  <th>Late</th>
                  <th>Leave days taken</th>
                </tr>
              </thead>
              <tbody>
                {data.members.map((m) => (
                  <tr key={m.id}>
                    <td>{m.name}</td>
                    <td>{m.daysPresent}</td>
                    <td>{m.daysLate}</td>
                    <td>{m.leaveDaysTaken}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

function HrView() {
  const { data, loading } = useFetch('/reports/summary');
  if (loading) return <Loading />;
  const max = Math.max(1, ...data.byDepartment.map((d) => d.count));
  const roleCount = (r) => data.byRole.find((x) => x._id === r)?.count || 0;
  return (
    <>
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-3">
          <Stat label="Active people" value={data.headcount} icon="people" />
        </div>
        <div className="col-6 col-md-3">
          <Stat label="Present today" value={data.presentToday} icon="person-check" />
        </div>
        <div className="col-6 col-md-3">
          <Stat label="Pending leave requests" value={data.pendingLeaves} icon="hourglass-split" />
        </div>
        <div className="col-6 col-md-3">
          <Stat label="Managers" value={roleCount('manager')} icon="person-badge" />
        </div>
      </div>
      <div className="row g-3 mb-4">
        <div className="col-md-6">
          <div className="panel h-100">
            <h2>People by department</h2>
            {data.byDepartment.map((d) => (
              <div className="bar-row" key={d._id}>
                <span>{d._id}</span>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${(d.count / max) * 100}%` }} />
                </div>
                <span>{d.count}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="col-md-6">
          <div className="panel h-100">
            <h2>This month</h2>
            <table className="table mb-3">
              <thead>
                <tr>
                  <th>Attendance</th>
                  <th>Records</th>
                </tr>
              </thead>
              <tbody>
                {data.monthAttendance.length === 0 && (
                  <tr>
                    <td colSpan={2} className="text-muted">No attendance yet this month.</td>
                  </tr>
                )}
                {data.monthAttendance.map((a) => (
                  <tr key={a._id}>
                    <td><Chip value={a._id} /></td>
                    <td>{a.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <table className="table mb-0">
              <thead>
                <tr>
                  <th>Approved leave</th>
                  <th>Days</th>
                </tr>
              </thead>
              <tbody>
                {data.leavesByType.length === 0 && (
                  <tr>
                    <td colSpan={2} className="text-muted">No approved leave yet.</td>
                  </tr>
                )}
                {data.leavesByType.map((l) => (
                  <tr key={l._id}>
                    <td className="text-capitalize">{l._id}</td>
                    <td>{l.days}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}

function LatestNews() {
  const { data } = useFetch('/announcements?limit=3');
  return (
    <div className="panel">
      <div className="d-flex justify-content-between">
        <h2>Latest announcements</h2>
        <Link to="/announcements">See all</Link>
      </div>
      {!data?.items.length ? (
        <div className="empty">No announcements yet.</div>
      ) : (
        data.items.map((a) => (
          <div key={a._id} className="mb-3">
            <strong>{a.title}</strong> <span className="text-muted small">{fmtDate(a.createdAt)}</span>
            <div>{a.body}</div>
          </div>
        ))
      )}
    </div>
  );
}

export default function Dashboard() {
  const { user } = useSelector((s) => s.auth);
  const titles = { hr: 'HR dashboard', manager: 'Manager dashboard', employee: 'Your dashboard' };
  return (
    <>
      <PageHead title={titles[user.role]} sub={`Hello, ${user.name.split(' ')[0]}.`} />
      <ClockPanel />
      {user.role === 'employee' && <EmployeeStats />}
      {user.role === 'manager' && <ManagerView />}
      {user.role === 'hr' && <HrView />}
      <LatestNews />
    </>
  );
}