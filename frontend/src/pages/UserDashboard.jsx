import { useCallback, useEffect, useState } from 'react';
import { Award, CalendarCheck, CalendarClock, FileText, Lock, Pill, RefreshCw, Search, Stethoscope, X } from 'lucide-react';
import api, { errMsg } from '../api.js';
import DashboardLayout from '../components/DashboardLayout.jsx';
import { Alert, Badge, Empty, Modal, Spinner, Stat, fmtDT, fmtDate, fmtTime, groupByDay, money } from '../components/ui.jsx';

const tabs = [
  { id: 'doctors', label: 'Find doctors', icon: Search },
  { id: 'appointments', label: 'My appointments', icon: CalendarCheck },
  { id: 'prescriptions', label: 'Prescriptions', icon: FileText },
];

export default function UserDashboard() {
  const [tab, setTab] = useState('doctors');
  return (
    <DashboardLayout tabs={tabs} active={tab} onTab={setTab}>
      {tab === 'doctors' && <Doctors onBooked={() => setTab('appointments')} />}
      {tab === 'appointments' && <Appointments />}
      {tab === 'prescriptions' && <Prescriptions />}
    </DashboardLayout>
  );
}

function Doctors({ onBooked }) {
  const [q, setQ] = useState('');
  const [list, setList] = useState(null);
  const [sel, setSel] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    api.get('/doctors', { params: { q } }).then((r) => setList(r.data)).catch((e) => setError(errMsg(e)));
  }, [q]);
  useEffect(() => {
    const id = setTimeout(load, 300);
    return () => clearTimeout(id);
  }, [load]);

  return (
    <>
      <div className="toolbar">
        <div className="input-wrap"><Search size={18} /><input placeholder="Search by doctor name or speciality" value={q} onChange={(e) => setQ(e.target.value)} /></div>
      </div>
      <Alert>{error}</Alert>
      {!list ? <Spinner /> : list.length === 0 ? (
        <Empty icon={Stethoscope}>No approved doctors match your search yet.</Empty>
      ) : (
        <div className="cards">
          {list.map((d) => (
            <div className="card doc" key={d.id}>
              <div className="doc-h">
                <span className="avatar"><Stethoscope size={24} /></span>
                <div><h3>Dr. {d.name}</h3><small>{d.specialization}</small></div>
              </div>
              <div className="meta"><span><Award size={15} /> {d.experienceYears} yrs experience</span></div>
              {d.bio && <p className="hint" style={{ margin: 0 }}>{d.bio}</p>}
              <div className="fee">
                <div><span>Doctor fee</span><span>{money(d.doctorFee)}</span></div>
                <div><span>Platform fee ({d.commissionPercent}%)</span><span>{money(d.commissionAmount)}</span></div>
                <div className="tot"><span>Total</span><span>{money(d.totalFee)}</span></div>
              </div>
              <button className="btn btn-primary" onClick={() => setSel(d)}><CalendarClock size={18} /> View slots and book</button>
            </div>
          ))}
        </div>
      )}
      {sel && <BookModal doctor={sel} onClose={() => setSel(null)} onBooked={() => { setSel(null); onBooked(); }} />}
    </>
  );
}

function BookModal({ doctor, onClose, onBooked }) {
  const [data, setData] = useState(null);
  const [slotId, setSlotId] = useState(null);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => api.get(`/doctors/${doctor.id}`).then((r) => setData(r.data)), [doctor.id]);
  useEffect(() => { load().catch((e) => setError(errMsg(e))); }, [load]);

  const book = async () => {
    setError('');
    setBusy(true);
    try {
      await api.post('/appointments', { slotId, reason });
      onBooked();
    } catch (e) {
      setError(errMsg(e));
      setSlotId(null);
      load(); // refresh: the slot may have just been taken
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title={`Book Dr. ${doctor.name}`} onClose={onClose}>
      <Alert>{error}</Alert>
      {!data ? <Spinner /> : data.slots.length === 0 ? (
        <Empty icon={CalendarClock}>This doctor has no free slots right now. Please check again later.</Empty>
      ) : (
        <>
          {groupByDay(data.slots).map(([day, slots]) => (
            <div className="day" key={day}>
              <h4>{fmtDate(slots[0].startAt)}</h4>
              <div className="chips">
                {slots.map((s) => (
                  <button key={s.id} className={`chip ${slotId === s.id ? 'on' : ''}`} onClick={() => setSlotId(s.id)}>{fmtTime(s.startAt)}</button>
                ))}
              </div>
            </div>
          ))}
          <div className="field"><label>Reason for visit (optional)</label><textarea rows={2} maxLength={250} value={reason} onChange={(e) => setReason(e.target.value)} /></div>
          <div className="fee" style={{ marginBottom: 14 }}>
            <div><span>Doctor fee</span><span>{money(data.doctorFee)}</span></div>
            <div><span>Platform fee ({data.commissionPercent}%)</span><span>{money(data.commissionAmount)}</span></div>
            <div className="tot"><span>Total to pay</span><span>{money(data.totalFee)}</span></div>
          </div>
          <button className="btn btn-primary" style={{ width: '100%' }} disabled={!slotId || busy} onClick={book}>
            {busy ? 'Booking...' : 'Confirm booking'}
          </button>
        </>
      )}
    </Modal>
  );
}

function Appointments() {
  const [list, setList] = useState(null);
  const [msg, setMsg] = useState({ type: 'error', text: '' });
  const [resched, setResched] = useState(null); // { appt, nextSlot }
  const load = () => api.get('/appointments').then((r) => setList(r.data)).catch((e) => setMsg({ type: 'error', text: errMsg(e) }));
  useEffect(() => { load(); }, []);

  const cancel = async (a) => {
    if (!window.confirm('Cancel this appointment?')) return;
    try { await api.post(`/appointments/${a.id}/cancel`); setMsg({ type: 'ok', text: 'Appointment cancelled.' }); } catch (e) { setMsg({ type: 'error', text: errMsg(e) }); }
    load();
  };
  const startResched = async (a) => {
    try {
      const { data } = await api.get(`/appointments/${a.id}/reschedule-preview`);
      setResched({ appt: a, nextSlot: data.nextSlot });
    } catch (e) { setMsg({ type: 'error', text: errMsg(e) }); load(); }
  };
  const confirmResched = async () => {
    try {
      await api.post(`/appointments/${resched.appt.id}/reschedule`);
      setMsg({ type: 'ok', text: 'Your appointment was moved to the next available slot.' });
    } catch (e) { setMsg({ type: 'error', text: errMsg(e) }); }
    setResched(null);
    load();
  };

  if (!list) return <Spinner />;
  const upcoming = list.filter((a) => a.status === 'booked').length;
  return (
    <>
      <div className="stats">
        <Stat icon={CalendarCheck} label="Upcoming" value={upcoming} />
        <Stat icon={FileText} label="Completed" value={list.filter((a) => a.status === 'completed').length} />
        <Stat icon={X} label="Cancelled" value={list.filter((a) => a.status === 'cancelled').length} />
      </div>
      <Alert type={msg.type === 'ok' ? 'ok' : 'error'}>{msg.text}</Alert>
      {list.length === 0 ? <Empty icon={CalendarCheck}>No appointments yet. Find a doctor to book your first visit.</Empty> : (
        <div className="list">
          {list.map((a) => (
            <div className="card appt" key={a.id}>
              <div className="appt-top">
                <div><h3>Dr. {a.doctor.user.name}</h3><span className="hint">{a.doctor.specialization}</span></div>
                <Badge status={a.status} />
              </div>
              <div className="meta">
                <span><CalendarClock size={15} /> {fmtDT(a.startAt)}</span>
                <span>Total {money(a.totalFee)}</span>
                {a.rescheduleCount > 0 && <span><RefreshCw size={15} /> Rescheduled {a.rescheduleCount}x</span>}
              </div>
              {a.reason && <span className="hint">Reason: {a.reason}</span>}
              {a.prescription && <span className="hint"><Pill size={14} /> Prescription available in the Prescriptions tab</span>}
              {a.status === 'booked' && (
                a.canChange ? (
                  <div className="actions">
                    <button className="btn btn-ghost btn-sm" onClick={() => startResched(a)}><RefreshCw size={15} /> Reschedule</button>
                    <button className="btn btn-danger btn-sm" onClick={() => cancel(a)}><X size={15} /> Cancel</button>
                  </div>
                ) : <span className="lock"><Lock size={14} /> Cancel and reschedule are closed within 24 hours of the visit.</span>
              )}
            </div>
          ))}
        </div>
      )}
      {resched && (
        <Modal title="Reschedule appointment" onClose={() => setResched(null)}>
          {resched.nextSlot ? (
            <>
              <p>Current time: <b>{fmtDT(resched.appt.startAt)}</b></p>
              <p>If you confirm, we will move you to the next available slot: <b>{fmtDT(resched.nextSlot.startAt)}</b>.</p>
              <div className="actions">
                <button className="btn btn-primary" onClick={confirmResched}>Confirm move</button>
                <button className="btn btn-ghost" onClick={() => setResched(null)}>Keep current time</button>
              </div>
            </>
          ) : (
            <>
              <Alert type="info">No later slot is free for this doctor right now. Your appointment stays as it is.</Alert>
              <button className="btn btn-ghost" onClick={() => setResched(null)}>Close</button>
            </>
          )}
        </Modal>
      )}
    </>
  );
}

function Prescriptions() {
  const [list, setList] = useState(null);
  useEffect(() => { api.get('/prescriptions').then((r) => setList(r.data)).catch(() => setList([])); }, []);
  if (!list) return <Spinner />;
  if (!list.length) return <Empty icon={FileText}>No prescriptions yet. They appear here after your doctor adds one.</Empty>;
  return (
    <div className="list">
      {list.map((p) => (
        <div className="card rx" key={p.id}>
          <div className="appt-top"><h3>Dr. {p.doctor.user.name}</h3><span className="hint">{fmtDT(p.appointment.startAt)}</span></div>
          <h4>Diagnosis</h4><pre>{p.diagnosis}</pre>
          <h4>Medicines</h4><pre>{p.medicines}</pre>
          {p.notes && (<><h4>Notes</h4><pre>{p.notes}</pre></>)}
        </div>
      ))}
    </div>
  );
}
