import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, Mail, LogIn } from 'lucide-react';
import api, { errMsg } from '../api.js';
import { useAuth } from '../context.jsx';
import Logo from '../components/Logo.jsx';
import { CareArt } from '../components/Art.jsx';
import { Alert } from '../components/ui.jsx';

export function AuthShell({ title, sub, children }) {
  return (
    <div className="auth">
      <div className="auth-side">
        <Logo light />
        <div>
          <CareArt />
          <h2>Your health, on your schedule.</h2>
          <p>Book verified doctors, get reminders and keep your prescriptions safe.</p>
        </div>
        <small>Secure login. Your data stays private.</small>
      </div>
      <div className="auth-main">
        <div className="auth-card">
          <h1>{title}</h1>
          <p className="sub">{sub}</p>
          {children}
        </div>
      </div>
    </div>
  );
}

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const { data } = await api.post('/auth/login', form);
      login(data.token, data.user);
      navigate(`/${data.user.role}`);
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell title="Welcome back" sub="Log in as a patient, doctor or admin.">
      <form onSubmit={submit}>
        <Alert>{error}</Alert>
        <div className="field">
          <label htmlFor="email">Email</label>
          <div className="input-wrap"><Mail size={18} /><input id="email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
        </div>
        <div className="field">
          <label htmlFor="pw">Password</label>
          <div className="input-wrap"><Lock size={18} /><input id="pw" type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
        </div>
        <button className="btn btn-primary" style={{ width: '100%' }} disabled={busy}><LogIn size={18} /> {busy ? 'Logging in...' : 'Log in'}</button>
      </form>
      <p className="switch">New here? <Link to="/register">Create a patient account</Link> or <Link to="/register-doctor">join as a doctor</Link></p>
    </AuthShell>
  );
}
