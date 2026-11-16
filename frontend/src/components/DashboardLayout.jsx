import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, LogOut, UserRound } from 'lucide-react';
import api from '../api.js';
import { useAuth } from '../context.jsx';
import Logo from './Logo.jsx';
import { fmtDT } from './ui.jsx';

export default function DashboardLayout({ tabs, active, onTab, children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState({ items: [], unread: 0 });

  const load = () => api.get('/notifications').then((r) => setNotes(r.data)).catch(() => {});
  useEffect(() => {
    load();
    const id = setInterval(load, 30000); // pick up new reminders every 30 seconds
    return () => clearInterval(id);
  }, []);

  const markAll = async () => {
    await api.patch('/notifications/read-all');
    load();
  };
  const current = tabs.find((t) => t.id === active);

  return (
    <div className="dash">
      <aside className="side">
        <Logo light />
        <nav>
          {tabs.map((t) => (
            <button key={t.id} className={`nav-btn ${active === t.id ? 'on' : ''}`} onClick={() => onTab(t.id)}>
              <t.icon size={19} /> <span>{t.label}</span>
            </button>
          ))}
        </nav>
        <button className="nav-btn side-out" onClick={() => { logout(); navigate('/'); }}>
          <LogOut size={19} /> <span>Log out</span>
        </button>
      </aside>
      <div className="dash-main">
        <header className="top">
          <h1>{current ? current.label : ''}</h1>
          <div className="top-r">
            <div className="bell-wrap">
              <button className="icon-btn" aria-label="Notifications" onClick={() => { setOpen(!open); if (!open) load(); }}>
                <Bell size={19} />
                {notes.unread > 0 && <i className="dot">{notes.unread}</i>}
              </button>
              {open && (
                <div className="bell-pop">
                  <div className="bell-h">
                    Notifications
                    {notes.unread > 0 && <button className="btn btn-ghost btn-sm" onClick={markAll}>Mark all read</button>}
                  </div>
                  {notes.items.length === 0 && <div className="note hint">Nothing yet. Booking and reminder alerts appear here.</div>}
                  {notes.items.map((n) => (
                    <div key={n.id} className={`note ${n.isRead ? '' : 'unread'}`}>
                      <b>{n.title}</b>
                      {n.message}
                      <br /><small>{fmtDT(n.createdAt)}</small>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <span className="who"><UserRound size={19} /> <span>{user.name}</span></span>
          </div>
        </header>
        <main className="content">{children}</main>
      </div>
    </div>
  );
}
