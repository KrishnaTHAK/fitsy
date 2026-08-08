import logo from '../assets/fitsy-logo.svg';

export default function BrandLogo({ compact = false }) {
  return (
    <div className={`brand ${compact ? 'brand--compact' : ''}`}>
      <img src={logo} alt="Fitsy logo" className="brand__image" />
      <div>
        <strong>Fitsy</strong>
        <span>Fashion with spatial preview</span>
      </div>
    </div>
  );
}
