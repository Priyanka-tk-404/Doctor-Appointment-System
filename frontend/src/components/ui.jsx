import { Loader2, X } from 'lucide-react';

export const money = (n) => '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });
export const fmtDT = (d) => new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
export const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
export const fmtTime = (d) => new Date(d).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
export const dayKey = (d) => new Date(d).toDateString();

export const Badge = ({ status }) => <span className={`badge b-${status}`}>{status}</span>;
export const Spinner = () => <div className="center"><Loader2 className="spin" size={28} /></div>;
export const Empty = ({ icon: Icon, children }) => (
  <div className="empty">{Icon && <Icon size={36} />}<p>{children}</p></div>
);
export const Alert = ({ type = 'error', children }) => (children ? <div className={`alert a-${type}`}>{children}</div> : null);
export const Stat = ({ icon: Icon, label, value }) => (
  <div className="stat">
    <span className="stat-i"><Icon size={20} /></span>
    <div><b>{value}</b><small>{label}</small></div>
  </div>
);

export function Modal({ title, onClose, children }) {
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-h">
          <h3>{title}</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

// Group items by calendar day: returns [[dayLabelDate, items[]], ...]
export function groupByDay(items, field = 'startAt') {
  const map = new Map();
  items.forEach((i) => {
    const k = dayKey(i[field]);
    if (!map.has(k)) map.set(k, []);
    map.get(k).push(i);
  });
  return [...map.entries()];
}
