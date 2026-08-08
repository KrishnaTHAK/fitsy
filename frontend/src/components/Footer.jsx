import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container site-footer__inner">
        <p>Copyright 2026 Fitsy. All rights reserved.</p>
        <div className="site-footer__links">
          <Link to="/privacy">Privacy Policy</Link>
          <Link to="/policy">Policy</Link>
        </div>
      </div>
    </footer>
  );
}
