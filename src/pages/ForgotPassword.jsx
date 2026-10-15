import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthShell } from './AuthShell';
import { Button, Field } from '../components/ui';
import { authApi } from '../api/endpoints';
import { useAutoFocus } from '../hooks/useAutoFocus';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export default function ForgotPassword() {
  useDocumentTitle('Forgot password');
  const focusRef = useAutoFocus();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Enter a valid email address.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await authApi.forgotPassword(email.trim());
      setSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Reset your password"
      subtitle="We will email you a link to choose a new one."
      footer={<Link to="/login">Back to sign in</Link>}
    >
      {sent ? (
        <p className="alert alert-success" role="status">
          If an account exists for <strong>{email}</strong>, a reset email is on its way. Check your inbox.
        </p>
      ) : (
        <form onSubmit={submit} noValidate className="stack">
          <Field label="Work email" error={error}>
            {(p) => <input {...p} type="email" ref={focusRef} autoComplete="email" value={email} onChange={(e) => { setEmail(e.target.value); setError(''); }} />}
          </Field>
          <Button type="submit" loading={loading} className="btn-block">Send reset link</Button>
        </form>
      )}
    </AuthShell>
  );
}
