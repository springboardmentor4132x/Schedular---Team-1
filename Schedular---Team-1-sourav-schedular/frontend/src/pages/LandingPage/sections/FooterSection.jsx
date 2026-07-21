/**
 * FooterSection.jsx — Section 6
 * Plane receding upper-right. Simple footer links.
 */

import { useNavigate } from 'react-router-dom';

export default function FooterSection() {
  const navigate = useNavigate();

  return (
    <footer className="sp-footer">
      <div className="sp-footer__inner">
        <div className="sp-footer__brand">
          <span className="sp-footer__logo">SocialPilot</span>
          <p className="sp-footer__tagline">Social media, handled.</p>
        </div>

        <nav className="sp-footer__nav">
          <div className="sp-footer__col">
            <h4>Product</h4>
            <a href="#">Features</a>
            <a href="#">Pricing</a>
            <a href="#">Platforms</a>
          </div>
          <div className="sp-footer__col">
            <h4>Company</h4>
            <a href="#">About</a>
            <a href="#">Blog</a>
            <a href="#">Contact</a>
          </div>
          <div className="sp-footer__col">
            <h4>Account</h4>
            <a href="#" onClick={(e) => { e.preventDefault(); navigate('/login'); }}>Sign In</a>
            <a href="#" onClick={(e) => { e.preventDefault(); navigate('/register'); }}>Sign Up</a>
          </div>
        </nav>
      </div>

      <div className="sp-footer__bottom">
        <p>© 2026 SocialPilot. All rights reserved.</p>
      </div>
    </footer>
  );
}
