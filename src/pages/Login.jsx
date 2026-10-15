import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthShell } from './AuthShell';
import { Button, Field } from '../components/ui';
import { useAuth } from '../hooks/useAuth';
import { useAutoFocus } from '../hooks/useAutoFocus';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export default function Login() {
  useDocumentTitle('Sign in');
  const focusRef = useAutoFocus();
  const { login, sessionNotice } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState(location.state?.email || '');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const notice = location.state?.registered ? 'Account created. Sign in to continue.' : sessionNotice;

  const submit = async (e) => {
    e.preventDefault();
    const fe = {};
    if (!email.trim()) fe.email = 'Enter your email address.';
    if (!password) fe.password = 'Enter your password.';
    setFieldErrors(fe);
    if (Object.keys(fe).length) return;
    setLoading(true);
    setError('');
    try {
      await login(email.trim(), password);
      navigate(location.state?.from?.pathname || '/', { replace: true });
    } catch (err) {
      // The backend throws a generic 500 for unknown users and wrong passwords.
      setError(err.status === 500 || err.status === 403 || err.status === 401
        ? 'Incorrect email or password.'
        : err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to your workspace"
      footer={<>New to TaskFlow? <Link to="/register">Create an account</Link></>}
    >
      {notice && <p className="alert alert-info" role="status">{notice}</p>}
      {error && <p className="alert alert-error" role="alert">{error}</p>}
      <form onSubmit={submit} noValidate className="stack">
        <Field label="Work email" error={fieldErrors.email}>
          {(p) => <input {...p} type="email" autoComplete="username" ref={focusRef} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" />}
        </Field>
        <Field label="Password" error={fieldErrors.password}>
          {(p) => (
            <div className="input-affix">
              <input {...p} type={show ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
              <button type="button" className="affix-btn" onClick={() => setShow((s) => !s)} aria-pressed={show}>{show ? 'Hide' : 'Show'}</button>
            </div>
          )}
        </Field>
        <div className="row-between">
          <span />
          <Link to="/forgot-password" className="link-sm">Forgot password?</Link>
        </div>
        <Button type="submit" loading={loading} className="btn-block">Sign in</Button>
      </form>
    </AuthShell>
  );
}
