import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthShell } from './AuthShell';
import { Button, Field } from '../components/ui';
import { authApi } from '../api/endpoints';
import { useAutoFocus } from '../hooks/useAutoFocus';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { ROLES } from '../utils/constants';
import { titleCase } from '../utils/format';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function strength(pw) {
  let score = 0;
  if (pw.length >= 8) score += 1;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score += 1;
  if (/\d/.test(pw)) score += 1;
  if (/[^A-Za-z0-9]/.test(pw)) score += 1;
  return score;
}
const LABELS = ['Too weak', 'Weak', 'Fair', 'Good', 'Strong'];

export default function Register() {
  useDocumentTitle('Create account');
  const focusRef = useAutoFocus();
  const navigate = useNavigate();
  const [form, setForm] = useState({ userName: '', userOfficialEmail: '', password: '', confirm: '', role: 'DEVELOPER' });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const score = strength(form.password);

  const set = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setErrors((er) => ({ ...er, [k]: undefined }));
  };

  const submit = async (e) => {
    e.preventDefault();
    const er = {};
    if (form.userName.trim().length < 2) er.userName = 'Enter your full name.';
    if (!EMAIL_RE.test(form.userOfficialEmail)) er.userOfficialEmail = 'Enter a valid email address.';
    if (form.password.length < 8) er.password = 'Use at least 8 characters.';
    if (form.confirm !== form.password) er.confirm = 'Passwords do not match.';
    setErrors(er);
    if (Object.keys(er).length) return;
    setLoading(true);
    setError('');
    try {
      await authApi.register({
        userName: form.userName.trim(),
        userOfficialEmail: form.userOfficialEmail.trim(),
        password: form.password,
        role: form.role,
      });
      navigate('/login', { replace: true, state: { registered: true, email: form.userOfficialEmail.trim() } });
    } catch (err) {
      setError(err.status === 500
        ? 'We could not create that account. The email may already be registered.'
        : err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Create your account"
      subtitle="Start organising work in minutes"
      footer={<>Already have an account? <Link to="/login">Sign in</Link></>}
    >
      {error && <p className="alert alert-error" role="alert">{error}</p>}
      <form onSubmit={submit} noValidate className="stack">
        <Field label="Full name" required error={errors.userName}>
          {(p) => <input {...p} autoComplete="name" ref={focusRef} value={form.userName} onChange={set('userName')} />}
        </Field>
        <Field label="Work email" required error={errors.userOfficialEmail}>
          {(p) => <input {...p} type="email" autoComplete="email" value={form.userOfficialEmail} onChange={set('userOfficialEmail')} placeholder="you@company.com" />}
        </Field>
        <Field label="Role">
          {(p) => <select {...p} value={form.role} onChange={set('role')}>{ROLES.map((r) => <option key={r} value={r}>{titleCase(r.toLowerCase())}</option>)}</select>}
        </Field>
        <Field label="Password" required error={errors.password}>
          {(p) => <input {...p} type="password" autoComplete="new-password" value={form.password} onChange={set('password')} />}
        </Field>
        {form.password && (
          <div className="strength" aria-live="polite">
            <div className="strength-bars">{[1, 2, 3, 4].map((n) => <span key={n} className={n <= score ? `on s${score}` : ''} />)}</div>
            <span className="muted">{LABELS[score]}</span>
          </div>
        )}
        <Field label="Confirm password" required error={errors.confirm}>
          {(p) => <input {...p} type="password" autoComplete="new-password" value={form.confirm} onChange={set('confirm')} />}
        </Field>
        <Button type="submit" loading={loading} className="btn-block">Create account</Button>
      </form>
    </AuthShell>
  );
}
