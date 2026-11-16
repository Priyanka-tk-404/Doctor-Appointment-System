import { Link } from 'react-router-dom';
import {
  ArrowRight, BadgeCheck, Bell, CalendarCheck, FileText, HeartPulse, Search, ShieldCheck, Stethoscope, Wallet, Clock, Sparkles,
} from 'lucide-react';
import Logo from '../components/Logo.jsx';
import { DoctorArt, HeroArt } from '../components/Art.jsx';
import { useAuth, useBrand } from '../context.jsx';

const features = [
  { icon: CalendarCheck, title: 'Slot-based booking', text: 'Pick a real free slot. Two people can never book the same time.' },
  { icon: Wallet, title: 'Clear fees', text: 'See the doctor fee, the platform fee and your total before you pay.' },
  { icon: Bell, title: 'Smart reminders', text: 'Alerts 1 day, 1 hour and 15 minutes before your visit.' },
  { icon: FileText, title: 'Digital prescriptions', text: 'Your doctor adds the prescription and you can read it any time.' },
  { icon: ShieldCheck, title: 'Verified doctors', text: 'Every doctor uploads a certificate and is approved by an admin.' },
  { icon: Clock, title: 'Easy rescheduling', text: 'Move to the next free slot in one tap, up to 24 hours before.' },
];

export default function Landing() {
  const { user } = useAuth();
  const { brand } = useBrand();
  return (
    <>
      <header className="hero">
        <nav className="pubnav">
          <Logo light />
          <div className="links">
            {user ? (
              <Link className="btn btn-white" to={`/${user.role}`}>Open dashboard</Link>
            ) : (
              <>
                <Link className="btn btn-ghost-w" to="/login">Log in</Link>
                <Link className="btn btn-white" to="/register">Sign up</Link>
              </>
            )}
          </div>
        </nav>
        <div className="hero-in">
          <div>
            <span className="pill"><Sparkles size={16} /> Care that fits your schedule</span>
            <h1>Book trusted doctors in a few taps.</h1>
            <p>{brand.appName} connects patients with verified doctors. Choose a slot, get reminders, and keep your prescriptions in one safe place.</p>
            <div className="cta-row">
              <Link className="btn btn-white" to="/register">Book an appointment <ArrowRight size={18} /></Link>
              <Link className="btn btn-ghost-w" to="/register-doctor"><Stethoscope size={18} /> I am a doctor</Link>
            </div>
            <div className="trust">
              <span><BadgeCheck size={18} /> Verified doctors</span>
              <span><HeartPulse size={18} /> Easy follow-ups</span>
              <span><ShieldCheck size={18} /> Private by design</span>
            </div>
          </div>
          <HeroArt />
        </div>
      </header>

      <section className="sec">
        <div className="sec-h"><h2>Everything you need for a visit</h2><p>From finding a doctor to reading your prescription afterwards.</p></div>
        <div className="grid3">
          {features.map((f) => (
            <div className="feat" key={f.title}>
              <span className="ic"><f.icon size={22} /></span>
              <h3>{f.title}</h3><p>{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="sec">
        <div className="sec-h"><h2>How it works</h2></div>
        <div className="grid3 steps">
          {[[Search, 'Find a doctor', 'Search by name or speciality and compare fees.'],
            [CalendarCheck, 'Pick a slot', 'Choose a free time that suits you and confirm.'],
            [FileText, 'Get care', 'Attend, then read your prescription online.']].map(([Icon, t, d], i) => (
            <div className="feat" key={t}>
              <div className="num">0{i + 1}</div>
              <span className="ic" style={{ margin: '0 auto 12px' }}><Icon size={22} /></span>
              <h3>{t}</h3><p>{d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="split">
        <div className="split-in">
          <div>
            <h2>Are you a doctor?</h2>
            <p>Join the platform, set your own availability and manage patients and prescriptions from one dashboard.</p>
            <ul>
              <li><BadgeCheck size={18} /> Upload your certificate and get approved</li>
              <li><Clock size={18} /> Create slots that match your clinic hours</li>
              <li><FileText size={18} /> Write prescriptions in seconds</li>
            </ul>
            <Link className="btn btn-primary" to="/register-doctor">Register as a doctor <ArrowRight size={18} /></Link>
          </div>
          <DoctorArt />
        </div>
      </section>

      <footer className="foot">© {new Date().getFullYear()} {brand.appName}. All rights reserved.</footer>
    </>
  );
}
