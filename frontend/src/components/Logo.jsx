import { Link } from 'react-router-dom';
import { Stethoscope } from 'lucide-react';
import { useBrand } from '../context.jsx';
import { API_ORIGIN } from '../api.js';

export default function Logo({ light }) {
  const { brand } = useBrand();
  return (
    <Link to="/" className={`logo ${light ? 'logo-light' : ''}`}>
      {brand.logoPath ? (
        <img src={`${API_ORIGIN}${brand.logoPath}`} alt="" />
      ) : (
        <span className="logo-mark"><Stethoscope size={20} /></span>
      )}
      <span>{brand.appName}</span>
    </Link>
  );
}
