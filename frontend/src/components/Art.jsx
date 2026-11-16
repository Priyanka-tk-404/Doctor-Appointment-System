// Original SVG illustrations (purple + white). Swap for photos any time by replacing these components.
export function HeroArt() {
  return (
    <svg viewBox="0 0 520 440" className="art" role="img" aria-label="Doctor with an appointment calendar">
      <defs>
        <linearGradient id="h1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#f5f3ff" /><stop offset="1" stopColor="#c4b5fd" /></linearGradient>
        <linearGradient id="h2" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#8b5cf6" /><stop offset="1" stopColor="#4c1d95" /></linearGradient>
      </defs>
      <circle cx="260" cy="225" r="195" fill="url(#h1)" />
      <circle cx="80" cy="95" r="22" fill="#fff" opacity=".6" />
      <circle cx="470" cy="360" r="14" fill="#fff" opacity=".7" />
      {/* doctor */}
      <path d="M140 430c0-85 55-140 120-140s120 55 120 140z" fill="#fff" />
      <path d="M232 292l28 62 28-62z" fill="#ede9fe" />
      <rect x="238" y="246" width="44" height="54" rx="20" fill="#f1c7a6" />
      <circle cx="260" cy="210" r="48" fill="#f6d2b4" />
      <path d="M210 206c-2-36 22-56 52-56s50 20 48 54c-12-20-30-28-50-28s-36 8-50 30z" fill="#3b1d6e" />
      <circle cx="244" cy="214" r="4" fill="#3b1d6e" /><circle cx="278" cy="214" r="4" fill="#3b1d6e" />
      <path d="M248 232q12 10 24 0" stroke="#b45f4a" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M218 300c-8 44 6 76 42 76s50-32 42-76" fill="none" stroke="url(#h2)" strokeWidth="6" strokeLinecap="round" />
      <circle cx="260" cy="378" r="12" fill="#7c3aed" /><circle cx="260" cy="378" r="5" fill="#fff" />
      <rect x="300" y="336" width="28" height="8" rx="2" fill="#7c3aed" /><rect x="310" y="326" width="8" height="28" rx="2" fill="#7c3aed" />
      {/* calendar card */}
      <g transform="translate(335 60)">
        <rect width="150" height="132" rx="18" fill="#fff" />
        <path d="M0 18a18 18 0 0 1 18-18h114a18 18 0 0 1 18 18v22H0z" fill="url(#h2)" />
        <circle cx="30" cy="20" r="5" fill="#fff" /><circle cx="120" cy="20" r="5" fill="#fff" />
        {Array.from({ length: 15 }).map((_, i) => (
          <circle key={i} cx={26 + (i % 5) * 25} cy={64 + Math.floor(i / 5) * 24} r="7" fill={i === 7 ? '#7c3aed' : '#ede9fe'} />
        ))}
        <path d="M70 64l5 5 9-10" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      {/* heart rate card */}
      <g transform="translate(26 300)">
        <rect width="150" height="84" rx="16" fill="#fff" />
        <polyline points="14,50 40,50 50,26 64,70 76,38 86,50 136,50" fill="none" stroke="#7c3aed" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="22" cy="20" r="6" fill="#c4b5fd" /><rect x="34" y="16" width="50" height="8" rx="4" fill="#ede9fe" />
      </g>
      {/* pill */}
      <g transform="translate(405 300) rotate(-35)">
        <rect width="86" height="34" rx="17" fill="#fff" />
        <path d="M43 0h26a17 17 0 0 1 0 34H43z" fill="#7c3aed" />
      </g>
      <g fill="#8b5cf6"><rect x="60" y="200" width="22" height="7" rx="2" /><rect x="67.5" y="192.5" width="7" height="22" rx="2" /></g>
    </svg>
  );
}

export function DoctorArt() {
  return (
    <svg viewBox="0 0 460 380" className="art" role="img" aria-label="Prescription and medicines">
      <defs>
        <linearGradient id="d1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#8b5cf6" /><stop offset="1" stopColor="#4c1d95" /></linearGradient>
      </defs>
      <circle cx="230" cy="190" r="165" fill="#ede9fe" />
      <g transform="translate(120 40) rotate(-6 110 140)">
        <rect width="220" height="290" rx="20" fill="#fff" />
        <rect x="70" y="-14" width="80" height="34" rx="12" fill="url(#d1)" />
        <rect x="24" y="52" width="110" height="10" rx="5" fill="#c4b5fd" />
        {[0, 1, 2, 3].map((i) => (
          <g key={i} transform={`translate(24 ${94 + i * 44})`}>
            <rect width="22" height="22" rx="6" fill={i < 3 ? '#7c3aed' : '#ede9fe'} />
            {i < 3 && <path d="M5 11l5 5 8-9" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />}
            <rect x="36" y="4" width={130 - i * 16} height="10" rx="5" fill="#ede9fe" />
          </g>
        ))}
        <text x="170" y="270" fontSize="34" fontWeight="800" fill="#7c3aed">Rx</text>
      </g>
      <g transform="translate(330 250) rotate(25)"><rect width="90" height="36" rx="18" fill="#fff" /><path d="M45 0h27a18 18 0 0 1 0 36H45z" fill="#7c3aed" /></g>
      <circle cx="80" cy="300" r="26" fill="#fff" /><circle cx="80" cy="300" r="14" fill="#c4b5fd" />
      <path d="M390 90l16 6v18c0 14-8 24-16 28-8-4-16-14-16-28V96z" fill="#7c3aed" />
      <path d="M382 116l6 6 10-12" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function CareArt() {
  return (
    <svg viewBox="0 0 420 340" className="art" role="img" aria-label="Care, security and reminders">
      <circle cx="210" cy="170" r="140" fill="#fff" opacity=".14" />
      <circle cx="210" cy="170" r="98" fill="#fff" opacity=".18" />
      <path d="M210 76l74 28v52c0 52-32 88-74 108-42-20-74-56-74-108v-52z" fill="#fff" />
      <path d="M210 190c-30-22-44-38-44-56a24 24 0 0 1 44-12 24 24 0 0 1 44 12c0 18-14 34-44 56z" fill="#7c3aed" />
      <g transform="translate(300 40)"><circle r="30" fill="#fff" /><path d="M-10 8h20l-3-4v-9a7 7 0 0 0-14 0v9z" fill="#7c3aed" /><circle cy="14" r="3.5" fill="#7c3aed" /></g>
      <g transform="translate(86 262)"><rect x="-40" y="-26" width="80" height="52" rx="14" fill="#fff" /><polyline points="-28,2 -14,2 -8,-14 2,16 10,-4 28,-4" fill="none" stroke="#7c3aed" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" /></g>
      <g transform="translate(340 270)"><rect x="-44" y="-24" width="88" height="48" rx="14" fill="#fff" /><circle cx="-22" cy="0" r="9" fill="#c4b5fd" /><rect x="-6" y="-8" width="38" height="8" rx="4" fill="#ede9fe" /><rect x="-6" y="5" width="26" height="6" rx="3" fill="#ede9fe" /></g>
    </svg>
  );
}
