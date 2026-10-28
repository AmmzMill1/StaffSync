import { useEffect, useState } from 'react';
import api, { errorMessage } from '../api';
import { useFetch, fmtDate } from '../hooks';
import { Alert, Loading, PageHead, useForm } from '../components/ui';

export default function Profile() {
  const { data, loading, reload } = useFetch('/profile');
  const [form, bind, setForm] = useForm({ name: '', phone: '', address: '', emergencyContact: '' });
  const [pw, bindPw, setPw] = useForm({ currentPassword: '', newPassword: '' });
  const [msg, setMsg] = useState({});
  const [pwMsg, setPwMsg] = useState({});

  useEffect(() => {
    if (data) setForm({ name: data.name || '', phone: data.phone || '', address: data.address || '', emergencyContact: data.emergencyContact || '' });
  }, [data, setForm]);

  const save = async (e) => {
    e.preventDefault(); setMsg({});
    try { await api.put('/profile', form); setMsg({ ok: 'Profile saved.' }); reload(); } catch (err) { setMsg({ error: errorMessage(err) }); }
  };
  const changePw = async (e) => {
    e.preventDefault(); setPwMsg({});
    try { await api.put('/auth/password', pw); setPwMsg({ ok: 'Password updated.' }); setPw({ currentPassword: '', newPassword: '' }); }
    catch (err) { setPwMsg({ error: errorMessage(err) }); }
  };

  if (loading) return <Loading />;
  return (
    <>
      <PageHead title="My profile" />
      <div className="row g-4">
        <div className="col-lg-7">
          <form className="panel" onSubmit={save}>
            <h2>Personal information</h2>
            <Alert {...msg} />
            <label className="form-label" htmlFor="name">Full name</label><input id="name" required className="form-control mb-3" {...bind('name')} />
            <label className="form-label" htmlFor="phone">Phone</label><input id="phone" className="form-control mb-3" {...bind('phone')} />
            <label className="form-label" htmlFor="address">Address</label><textarea id="address" rows={2} className="form-control mb-3" {...bind('address')} />
            <label className="form-label" htmlFor="ec">Emergency contact</label><input id="ec" className="form-control mb-3" {...bind('emergencyContact')} />
            <button className="btn btn-primary">Save changes</button>
          </form>
        </div>
        <div className="col-lg-5">
          <div className="panel mb-4">
            <h2>Work details</h2>
            <dl className="row mb-0">
              <dt className="col-5">Employee ID</dt><dd className="col-7">{data.employeeId}</dd>
              <dt className="col-5">Email</dt><dd className="col-7">{data.email}</dd>
              <dt className="col-5">Role</dt><dd className="col-7 text-capitalize">{data.role}</dd>
              <dt className="col-5">Department</dt><dd className="col-7">{data.department || '-'}</dd>
              <dt className="col-5">Job title</dt><dd className="col-7">{data.designation || '-'}</dd>
              <dt className="col-5">Manager</dt><dd className="col-7">{data.manager?.name || '-'}</dd>
              <dt className="col-5">Joined</dt><dd className="col-7">{fmtDate(data.dateOfJoining)}</dd>
            </dl>
            <p className="text-muted small mt-3 mb-0">Ask HR to change these.</p>
          </div>
          <form className="panel" onSubmit={changePw}>
            <h2>Change password</h2>
            <Alert {...pwMsg} />
            <label className="form-label" htmlFor="cur">Current password</label><input id="cur" type="password" required className="form-control mb-3" {...bindPw('currentPassword')} />
            <label className="form-label" htmlFor="new">New password</label><input id="new" type="password" minLength={6} required className="form-control mb-3" {...bindPw('newPassword')} />
            <button className="btn btn-outline-primary">Update password</button>
          </form>
        </div>
      </div>
    </>
  );
}
