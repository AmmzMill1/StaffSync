import { useState } from 'react';

export const Chip = ({ value }) => <span className={`chip ${value}`}>{value}</span>;

export const Stat = ({ label, value, icon }) => (
  <div className="stat">
    {icon && <i className={`bi bi-${icon} stat-icon`} />}
    <div className="num">{value ?? '-'}</div>
    <div className="label">{label}</div>
  </div>
);

export const PageHead = ({ title, children, sub }) => (
  <div className="page-head">
    <div>
      <h1>{title}</h1>
      {sub && <p>{sub}</p>}
    </div>
    <div>{children}</div>
  </div>
);

export const Alert = ({ error, ok }) => {
  if (!error && !ok) return null;
  return <div className={`alert ${error ? 'alert-danger' : 'alert-success'} py-2`} role="alert">{error || ok}</div>;
};

export const Loading = () => <div className="empty">Loading...</div>;

export const Pagination = ({ page, pages, onChange }) => {
  if (!pages || pages <= 1) return null;
  return (
    <div className="d-flex justify-content-between align-items-center mt-3">
      <button className="btn btn-sm btn-outline-secondary" disabled={page <= 1} onClick={() => onChange(page - 1)}>Previous</button>
      <span className="text-muted small">Page {page} of {pages}</span>
      <button className="btn btn-sm btn-outline-secondary" disabled={page >= pages} onClick={() => onChange(page + 1)}>Next</button>
    </div>
  );
};

// Small hook for forms: const [form, bind, setForm] = useForm({ name: '' }); <input {...bind('name')} />
export function useForm(initial) {
  const [form, setForm] = useState(initial);
  const bind = (name) => ({
    name,
    value: form[name] ?? '',
    onChange: (e) => setForm((f) => ({ ...f, [name]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })),
  });
  return [form, bind, setForm];
}
