import { useEffect, useState } from 'react';
import { Ban, BadgeCheck, CalendarCheck, Check, Eye, IndianRupee, LayoutDashboard, Palette, Settings, Stethoscope, Users, X } from 'lucide-react';
import api, { API_ORIGIN, errMsg } from '../api.js';
import { useBrand } from '../context.jsx';
import DashboardLayout from '../components/DashboardLayout.jsx';
import { Alert, Badge, Empty, Spinner, Stat, fmtDT, money } from '../components/ui.jsx';

const tabs = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'doctors', label: 'Doctors', icon: Stethoscope },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'appointments', label: 'Appointments', icon: CalendarCheck },
  { id: 'settings', label: 'App settings', icon: Settings },
];

export default function AdminDashboard() {
  const [tab, setTab] = useState('overview');
  return (
    <DashboardLayout tabs={tabs} active={tab} onTab={setTab}>
      {tab === 'overview' && <Overview />}
      {tab === 'doctors' && <Doctors />}
      {tab === 'users' && <UsersTab />}
      {tab === 'appointments' && <AllAppointments />}
      {tab === 'settings' && <AppSettings />}
    </DashboardLayout>
  );
}

function Overview() {
  const [s, setS] = useState(null);
  useEffect(() => { api.get('/admin/stats').then((r) => setS(r.data)); }, []);
  if (!s) return <Spinner />;
  return (
    <div className="stats">
      <Stat icon={Users} label="Patients" value={s.users} />
      <Stat icon={Stethoscope} label="Approved doctors" value={s.doctors} />
      <Stat icon={BadgeCheck} label="Waiting for approval" value={s.pendingDoctors} />
      <Stat icon={CalendarCheck} label="All appointments" value={s.appointments} />
      <Stat icon={CalendarCheck} label="Booked" value={s.booked} />
      <Stat icon={Check} label="Completed" value={s.completed} />
      <Stat icon={X} label="Cancelled" value={s.cancelled} />
      <Stat icon={IndianRupee} label="Commission earned" value={money(s.commissionEarned)} />
    </div>
  );
}

function Doctors() {
  const [filter, setFilter] = useState('pending');
  const [list, setList] = useState(null);
  const [msg, setMsg] = useState({ type: 'error', text: '' });
  const load = () => { setList(null); api.get('/admin/doctors', { params: { status: filter || undefined } }).then((r) => setList(r.data)); };
  useEffect(load, [filter]); // eslint-disable-line react-hooks/exhaustive-deps

  const act = async (id, action, body) => {
    try { await api.patch(`/admin/doctors/${id}/${action}`, body); setMsg({ type: 'ok', text: `Doctor ${action}d.` }); } catch (e) { setMsg({ type: 'error', text: errMsg(e) }); }
    load();
  };
  const reject = (id) => {
    const reason = window.prompt('Reason for rejection (the doctor will see this):', 'Certificate is not readable.');
    if (reason !== null) act(id, 'reject', { reason });
  };
  const viewCert = async (id) => {
    try {
      const r = await api.get(`/admin/doctors/${id}/certificate`, { responseType: 'blob' });
      window.open(URL.createObjectURL(r.data), '_blank');
    } catch { setMsg({ type: 'error', text: 'Certificate file not found.' }); }
  };

  return (
    <>
      <div className="toolbar">
        {['pending', 'approved', 'rejected', ''].map((s) => (
          <button key={s} className={`chip ${filter === s ? 'on' : ''}`} onClick={() => setFilter(s)}>{s || 'all'}</button>
        ))}
      </div>
      <Alert type={msg.type === 'ok' ? 'ok' : 'error'}>{msg.text}</Alert>
      {!list ? <Spinner /> : list.length === 0 ? <Empty icon={Stethoscope}>No doctors in this list.</Empty> : (
        <div className="cards">
          {list.map((d) => (
            <div className="card doc" key={d.id}>
              <div className="doc-h">
                <span className="avatar"><Stethoscope size={22} /></span>
                <div><h3>Dr. {d.name}</h3><small>{d.specialization}</small></div>
              </div>
              <div className="meta"><span>{d.email}</span><span>{d.experienceYears} yrs</span><span>Fee {money(d.doctorFee)}</span></div>
              <Badge status={d.status} />
              {d.rejectionReason && <span className="hint">Reason: {d.rejectionReason}</span>}
              <div className="actions">
                <button className="btn btn-ghost btn-sm" onClick={() => viewCert(d.id)}><Eye size={15} /> Certificate</button>
                {d.status !== 'approved' && <button className="btn btn-primary btn-sm" onClick={() => act(d.id, 'approve')}><Check size={15} /> Approve</button>}
                {d.status !== 'rejected' && <button className="btn btn-danger btn-sm" onClick={() => reject(d.id)}><X size={15} /> Reject</button>}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function UsersTab() {
  const [list, setList] = useState(null);
  const [error, setError] = useState('');
  const load = () => api.get('/admin/users').then((r) => setList(r.data));
  useEffect(() => { load(); }, []);
  const toggle = async (id) => {
    try { await api.patch(`/admin/users/${id}/toggle`); load(); } catch (e) { setError(errMsg(e)); }
  };
  if (!list) return <Spinner />;
  if (!list.length) return <Empty icon={Users}>No patients have registered yet.</Empty>;
  return (
    <>
      <Alert>{error}</Alert>
      <div className="tbl-wrap">
        <table>
          <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Joined</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {list.map((u) => (
              <tr key={u.id}>
                <td>{u.name}</td><td>{u.email}</td><td>{u.phone || '-'}</td><td>{fmtDT(u.createdAt)}</td>
                <td><Badge status={u.isActive ? 'approved' : 'inactive'} /></td>
                <td><button className="btn btn-ghost btn-sm" onClick={() => toggle(u.id)}><Ban size={14} /> {u.isActive ? 'Deactivate' : 'Activate'}</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function AllAppointments() {
  const [list, setList] = useState(null);
  useEffect(() => { api.get('/appointments').then((r) => setList(r.data)); }, []);
  if (!list) return <Spinner />;
  if (!list.length) return <Empty icon={CalendarCheck}>No appointments yet.</Empty>;
  return (
    <div className="tbl-wrap">
      <table>
        <thead><tr><th>When</th><th>Patient</th><th>Doctor</th><th>Status</th><th>Doctor fee</th><th>Commission</th><th>Total</th></tr></thead>
        <tbody>
          {list.map((a) => (
            <tr key={a.id}>
              <td>{fmtDT(a.startAt)}</td><td>{a.patient.name}</td><td>Dr. {a.doctor.user.name}</td>
              <td><Badge status={a.status} /></td><td>{money(a.doctorFee)}</td><td>{money(a.commissionAmount)}</td><td>{money(a.totalFee)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AppSettings() {
  const { brand, loadBrand } = useBrand();
  const [appName, setAppName] = useState(brand.appName);
  const [commission, setCommission] = useState(brand.commissionPercent);
  const [logo, setLogo] = useState(null);
  const [msg, setMsg] = useState({ type: 'error', text: '' });

  const save = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append('appName', appName);
    fd.append('commissionPercent', commission);
    if (logo) fd.append('logo', logo);
    try { await api.put('/settings', fd); await loadBrand(); setLogo(null); setMsg({ type: 'ok', text: 'Settings saved. A new commission applies to future bookings only.' }); }
    catch (err) { setMsg({ type: 'error', text: errMsg(err) }); }
  };

  return (
    <form className="card" style={{ maxWidth: 560 }} onSubmit={save}>
      <h3 style={{ marginBottom: 14 }}><Palette size={18} /> Branding and fees</h3>
      <Alert type={msg.type === 'ok' ? 'ok' : 'error'}>{msg.text}</Alert>
      <div className="field"><label>App name</label><input required maxLength={60} value={appName} onChange={(e) => setAppName(e.target.value)} /></div>
      <div className="field">
        <label>Admin commission (% added on top of the doctor fee)</label>
        <input type="number" min="0" max="90" step="0.5" required value={commission} onChange={(e) => setCommission(e.target.value)} />
      </div>
      <div className="field">
        <label>Logo (PNG, JPG or WebP, max 5 MB)</label>
        {brand.logoPath && <img className="logo-preview" src={`${API_ORIGIN}${brand.logoPath}`} alt="Current logo" />}
        <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => setLogo(e.target.files[0])} />
      </div>
      <button className="btn btn-primary">Save settings</button>
    </form>
  );
}
