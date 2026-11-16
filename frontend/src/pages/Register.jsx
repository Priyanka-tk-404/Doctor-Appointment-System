import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Award, IndianRupee, Lock, Mail, Phone, Stethoscope, Upload, UserRound, UserPlus } from 'lucide-react';
import api, { errMsg } from '../api.js';
import { useAuth, useBrand } from '../context.jsx';
import { AuthShell } from './Login.jsx';
import { Alert, money } from '../components/ui.jsx';

export default function Register({ doctor = false }) {
  const { login } = useAuth();
  const { brand } = useBrand();
  const navigate = useNavigate();
  const [f, setF] = useState({ name: '', email: '', password: '', phone: '', specialization: '', experienceYears: '', fee: '', bio: '' });
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (doctor && !file) return setError('Please upload your medical certificate.');
    setBusy(true);
    try {
      let res;
      if (doctor) {
        const fd = new FormData();
        Object.entries(f).forEach(([k, v]) => fd.append(k, v));
        fd.append('certificate', file);
        res = await api.post('/auth/register-doctor', fd);
      } else {
        res = await api.post('/auth/register', { name: f.name, email: f.email, password: f.password, phone: f.phone });
      }
      login(res.data.token, res.data.user);
      navigate(`/${res.data.user.role}`);
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  const fee = Number(f.fee) || 0;
  const total = fee + (fee * brand.commissionPercent) / 100;

  return (
    <AuthShell title={doctor ? 'Join as a doctor' : 'Create your account'} sub={doctor ? 'An admin will review your certificate before you go live.' : 'Book appointments in minutes.'}>
      <form onSubmit={submit}>
        <Alert>{error}</Alert>
        <div className="field"><label>Full name</label><div className="input-wrap"><UserRound size={18} /><input required value={f.name} onChange={set('name')} /></div></div>
        <div className="field"><label>Email</label><div className="input-wrap"><Mail size={18} /><input type="email" required value={f.email} onChange={set('email')} /></div></div>
        <div className="row2">
          <div className="field"><label>Password</label><div className="input-wrap"><Lock size={18} /><input type="password" minLength={6} required value={f.password} onChange={set('password')} /></div></div>
          <div className="field"><label>Phone</label><div className="input-wrap"><Phone size={18} /><input value={f.phone} onChange={set('phone')} /></div></div>
        </div>
        {doctor && (
          <>
            <div className="row2">
              <div className="field"><label>Speciality</label><div className="input-wrap"><Stethoscope size={18} /><input required placeholder="e.g. Cardiologist" value={f.specialization} onChange={set('specialization')} /></div></div>
              <div className="field"><label>Experience (years)</label><div className="input-wrap"><Award size={18} /><input type="number" min="0" max="70" value={f.experienceYears} onChange={set('experienceYears')} /></div></div>
            </div>
            <div className="field">
              <label>Consultation fee</label>
              <div className="input-wrap"><IndianRupee size={18} /><input type="number" min="1" required value={f.fee} onChange={set('fee')} /></div>
              {fee > 0 && <span className="hint">Patients will pay {money(total)} ({brand.commissionPercent}% platform fee included). You receive {money(fee)}.</span>}
            </div>
            <div className="field"><label>Short bio</label><textarea rows={2} value={f.bio} onChange={set('bio')} /></div>
            <div className="field">
              <label><Upload size={14} /> Medical certificate (PDF, JPG or PNG, max 5 MB)</label>
              <input type="file" accept=".pdf,image/png,image/jpeg,image/webp" onChange={(e) => setFile(e.target.files[0])} />
            </div>
          </>
        )}
        <button className="btn btn-primary" style={{ width: '100%' }} disabled={busy}><UserPlus size={18} /> {busy ? 'Creating...' : 'Create account'}</button>
      </form>
      <p className="switch">
        Already registered? <Link to="/login">Log in</Link> · {doctor ? <Link to="/register">Patient sign up</Link> : <Link to="/register-doctor">Doctor sign up</Link>}
      </p>
    </AuthShell>
  );
}
