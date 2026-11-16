import { useCallback, useEffect, useState } from 'react';
import { BadgeCheck, CalendarCheck, CheckCircle2, Clock, FileText, Phone, Plus, RefreshCw, Trash2, UserCog, Users } from 'lucide-react';
import api, { errMsg } from '../api.js';
import { useAuth, useBrand } from '../context.jsx';
import DashboardLayout from '../components/DashboardLayout.jsx';
import { DoctorArt } from '../components/Art.jsx';
import { Alert, Badge, Empty, Modal, Spinner, Stat, fmtDT, fmtDate, fmtTime, groupByDay, money } from '../components/ui.jsx';

export default function DoctorDashboard() {
  const { user, refreshUser } = useAuth();
  const [tab, setTab] = useState('appointments');

  if (user.doctorStatus !== 'approved') {
    const rejected = user.doctorStatus === 'rejected';
    return (
      <DashboardLayout tabs={[{ id: 's', label: 'Approval status', icon: BadgeCheck }]} active="s" onTab={() => {}}>
        <div className="card status-panel">
          <DoctorArt />
          <Badge status={user.doctorStatus} />
          <h2 style={{ margin: '10px 0 6px' }}>{rejected ? 'Your application was not approved' : 'Waiting for admin approval'}</h2>
          <p className="hint">
            {rejected ? `Reason: ${user.rejectionReason || 'Not provided.'}` : 'We are checking your certificate. You will get a notification as soon as you are approved.'}
          </p>
          <button className="btn btn-ghost" onClick={refreshUser}><RefreshCw size={16} /> Check status</button>
        </div>
      </DashboardLayout>
    );
  }

  const tabs = [
    { id: 'appointments', label: 'Appointments', icon: CalendarCheck },
    { id: 'availability', label: 'Availability', icon: Clock },
    { id: 'profile', label: 'My profile', icon: UserCog },
  ];
  return (
    <DashboardLayout tabs={tabs} active={tab} onTab={setTab}>
      {tab === 'appointments' && <Appointments />}
      {tab === 'availability' && <Availability />}
      {tab === 'profile' && <Profile />}
    </DashboardLayout>
  );
}

function Appointments() {
  const [list, setList] = useState(null);
  const [msg, setMsg] = useState({ type: 'error', text: '' });
  const [rx, setRx] = useState(null);
  const load = () => api.get('/appointments').then((r) => setList(r.data)).catch((e) => setMsg({ type: 'error', text: errMsg(e) }));
  useEffect(() => { load(); }, []);

  const complete = async (a) => {
    try { await api.patch(`/appointments/${a.id}/complete`); setMsg({ type: 'ok', text: 'Marked as completed. The patient was notified.' }); }
    catch (e) { setMsg({ type: 'error', text: errMsg(e) }); }
    load();
  };

  if (!list) return <Spinner />;
  const started = (a) => new Date(a.startAt) <= new Date();
  const earned = list.filter((a) => a.status === 'completed').reduce((s, a) => s + Number(a.doctorFee), 0);
  return (
    <>
      <div className="stats">
        <Stat icon={CalendarCheck} label="Upcoming" value={list.filter((a) => a.status === 'booked').length} />
        <Stat icon={CheckCircle2} label="Completed" value={list.filter((a) => a.status === 'completed').length} />
        <Stat icon={Users} label="Patients seen" value={new Set(list.filter((a) => a.status === 'completed').map((a) => a.userId)).size} />
        <Stat icon={FileText} label="Earnings (completed)" value={money(earned)} />
      </div>
      <Alert type={msg.type === 'ok' ? 'ok' : 'error'}>{msg.text}</Alert>
      {list.length === 0 ? <Empty icon={CalendarCheck}>No appointments yet. Add availability slots so patients can book you.</Empty> : (
        <div className="list">
          {list.map((a) => (
            <div className="card appt" key={a.id}>
              <div className="appt-top">
                <div><h3>{a.patient.name}</h3><span className="hint">{fmtDT(a.startAt)}</span></div>
                <Badge status={a.status} />
              </div>
              <div className="meta">
                <span><Phone size={15} /> {a.patient.phone || 'No phone'}</span>
                <span>You earn {money(a.doctorFee)}</span>
              </div>
              {a.reason && <span className="hint">Reason: {a.reason}</span>}
              {a.status !== 'cancelled' && (
                <div className="actions">
                  {a.status === 'booked' && started(a) && <button className="btn btn-primary btn-sm" onClick={() => complete(a)}><CheckCircle2 size={15} /> Mark completed</button>}
                  {started(a) && <button className="btn btn-ghost btn-sm" onClick={() => setRx(a)}><FileText size={15} /> {a.prescription ? 'Edit prescription' : 'Add prescription'}</button>}
                  {!started(a) && <span className="hint">Actions unlock when the appointment starts.</span>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {rx && <RxModal appt={rx} onClose={() => setRx(null)} onSaved={() => { setRx(null); setMsg({ type: 'ok', text: 'Prescription saved. The patient was notified.' }); load(); }} />}
    </>
  );
}

function RxModal({ appt, onClose, onSaved }) {
  const p = appt.prescription;
  const [f, setF] = useState({ diagnosis: p?.diagnosis || '', medicines: p?.medicines || '', notes: p?.notes || '' });
  const [error, setError] = useState('');
  const save = async (e) => {
    e.preventDefault();
    try { await api.post('/prescriptions', { appointmentId: appt.id, ...f }); onSaved(); } catch (err) { setError(errMsg(err)); }
  };
  return (
    <Modal title={`Prescription for ${appt.patient.name}`} onClose={onClose}>
      <form onSubmit={save}>
        <Alert>{error}</Alert>
        <div className="field"><label>Diagnosis</label><textarea rows={2} required value={f.diagnosis} onChange={(e) => setF({ ...f, diagnosis: e.target.value })} /></div>
        <div className="field"><label>Medicines (one per line, with dose)</label><textarea rows={5} required placeholder={'Paracetamol 500 mg - 1 tablet, twice a day, 3 days'} value={f.medicines} onChange={(e) => setF({ ...f, medicines: e.target.value })} /></div>
        <div className="field"><label>Notes (optional)</label><textarea rows={2} value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} /></div>
        <button className="btn btn-primary" style={{ width: '100%' }}>Save prescription</button>
      </form>
    </Modal>
  );
}

function Availability() {
  const [slots, setSlots] = useState(null);
  const [f, setF] = useState({ date: '', from: '10:00', to: '13:00', dur: 30 });
  const [msg, setMsg] = useState({ type: 'error', text: '' });
  const today = new Date().toISOString().slice(0, 10);

  const load = useCallback(() => api.get('/slots/mine').then((r) => setSlots(r.data)).catch((e) => setMsg({ type: 'error', text: errMsg(e) })), []);
  useEffect(() => { load(); }, [load]);

  const add = async (e) => {
    e.preventDefault();
    setMsg({ type: 'error', text: '' });
    try {
      const { data } = await api.post('/slots', {
        startAt: new Date(`${f.date}T${f.from}`).toISOString(),
        endAt: new Date(`${f.date}T${f.to}`).toISOString(),
        durationMin: Number(f.dur),
      });
      setMsg({ type: 'ok', text: `${data.created} slot(s) added${data.skipped ? `, ${data.skipped} skipped because they overlap existing slots` : ''}.` });
      load();
    } catch (err) { setMsg({ type: 'error', text: errMsg(err) }); }
  };
  const remove = async (id) => {
    try { await api.delete(`/slots/${id}`); load(); } catch (err) { setMsg({ type: 'error', text: errMsg(err) }); }
  };

  return (
    <div className="two">
      <form className="card" onSubmit={add} style={{ alignSelf: 'start' }}>
        <h3 style={{ marginBottom: 14 }}>Add availability</h3>
        <Alert type={msg.type === 'ok' ? 'ok' : 'error'}>{msg.text}</Alert>
        <div className="field"><label>Date</label><input type="date" min={today} required value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></div>
        <div className="row2">
          <div className="field"><label>From</label><input type="time" required value={f.from} onChange={(e) => setF({ ...f, from: e.target.value })} /></div>
          <div className="field"><label>To</label><input type="time" required value={f.to} onChange={(e) => setF({ ...f, to: e.target.value })} /></div>
        </div>
        <div className="field">
          <label>Length of each slot</label>
          <select value={f.dur} onChange={(e) => setF({ ...f, dur: e.target.value })}>
            {[15, 20, 30, 45, 60].map((m) => <option key={m} value={m}>{m} minutes</option>)}
          </select>
          <span className="hint">The range is split into equal slots. Overlapping slots are skipped.</span>
        </div>
        <button className="btn btn-primary" style={{ width: '100%' }}><Plus size={18} /> Create slots</button>
      </form>
      <div>
        <h3 style={{ marginBottom: 12 }}>Your upcoming slots</h3>
        {!slots ? <Spinner /> : slots.length === 0 ? <Empty icon={Clock}>No upcoming slots. Create some on the left.</Empty> : groupByDay(slots, 'startAt').map(([day, items]) => (
          <div className="day" key={day}>
            <h4>{fmtDate(items[0].startAt)}</h4>
            <div className="chips">
              {items.map((s) => (
                <span key={s.id} className={`chip static ${s.isBooked ? 'booked' : ''}`}>
                  {fmtTime(s.startAt)} {s.isBooked ? '(booked)' : <button aria-label="Remove slot" onClick={() => remove(s.id)}><Trash2 size={14} /></button>}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Profile() {
  const { brand } = useBrand();
  const { refreshUser } = useAuth();
  const [f, setF] = useState(null);
  const [msg, setMsg] = useState({ type: 'error', text: '' });
  useEffect(() => {
    api.get('/doctors/me/profile').then((r) => setF({ name: r.data.name, phone: r.data.phone || '', specialization: r.data.specialization, experienceYears: r.data.experienceYears, fee: r.data.doctorFee, bio: r.data.bio || '' }));
  }, []);
  if (!f) return <Spinner />;
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const save = async (e) => {
    e.preventDefault();
    try { await api.put('/doctors/me/profile', f); await refreshUser(); setMsg({ type: 'ok', text: 'Profile saved. A new fee applies to future bookings only.' }); }
    catch (err) { setMsg({ type: 'error', text: errMsg(err) }); }
  };
  const fee = Number(f.fee) || 0;
  return (
    <form className="card" style={{ maxWidth: 640 }} onSubmit={save}>
      <Alert type={msg.type === 'ok' ? 'ok' : 'error'}>{msg.text}</Alert>
      <div className="row2">
        <div className="field"><label>Name</label><input required value={f.name} onChange={set('name')} /></div>
        <div className="field"><label>Phone</label><input value={f.phone} onChange={set('phone')} /></div>
      </div>
      <div className="row2">
        <div className="field"><label>Speciality</label><input required value={f.specialization} onChange={set('specialization')} /></div>
        <div className="field"><label>Experience (years)</label><input type="number" min="0" value={f.experienceYears} onChange={set('experienceYears')} /></div>
      </div>
      <div className="field">
        <label>Your consultation fee</label>
        <input type="number" min="1" required value={f.fee} onChange={set('fee')} />
        <span className="hint">Patients pay {money(fee + (fee * brand.commissionPercent) / 100)} (includes {brand.commissionPercent}% platform fee).</span>
      </div>
      <div className="field"><label>Bio</label><textarea rows={3} value={f.bio} onChange={set('bio')} /></div>
      <button className="btn btn-primary">Save profile</button>
    </form>
  );
}
