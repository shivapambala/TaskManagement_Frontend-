import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AuthShell } from './AuthShell';
import { Button, Field } from '../components/ui';
import { authApi } from '../api/endpoints';
import { useAutoFocus } from '../hooks/useAutoFocus';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export default function ResetPassword() {
  useDocumentTitle('Choose a new password');
  const focusRef = useAutoFocus();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [token, setToken] = useState(params.get('token') || '');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const er = {};
    if (!token.trim()) er.token = 'Paste the token from your reset email.';
    if (password.length < 8) er.password = 'Use at least 8 characters.';
    if (confirm !== password) er.confirm = 'Passwords do not match.';
    setErrors(er);
    if (Object.keys(er).length) return;
    setLoading(true);
    setError('');
    try {
      await authApi.resetPassword(token.trim(), password);
      navigate('/login', { replace: true, state: { registered: false } });
    } catch (err) {
      setError(err.status === 500 ? 'That reset link is invalid or has expired.' : err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Choose a new password" footer={<Link to="/login">Back to sign in</Link>}>
      {error && <p className="alert alert-error" role="alert">{error}</p>}
      <form onSubmit={submit} noValidate className="stack">
        {!params.get('token') && (
          <Field label="Reset token" error={errors.token}>
            {(p) => <input {...p} value={token} onChange={(e) => setToken(e.target.value)} />}
          </Field>
        )}
        <Field label="New password" error={errors.password}>
          {(p) => <input {...p} type="password" autoComplete="new-password" ref={focusRef} value={password} onChange={(e) => setPassword(e.target.value)} />}
        </Field>
        <Field label="Confirm new password" error={errors.confirm}>
          {(p) => <input {...p} type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />}
        </Field>
        <Button type="submit" loading={loading} className="btn-block">Update password</Button>
      </form>
    </AuthShell>
  );
}
