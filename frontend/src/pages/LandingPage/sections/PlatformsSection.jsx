/**
 * PlatformsSection.jsx — Section 2
 * Platform icons presented as fluffy floating clouds.
 * Plane is upper-right during this section.
 */

import {
  FaInstagram, FaFacebookF, FaLinkedinIn, FaPinterestP, FaYoutube,
} from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';

const PLATFORMS = [
  { icon: <FaInstagram />,  name: 'Instagram', color: '#e1306c' },
  { icon: <FaFacebookF />,  name: 'Facebook',  color: '#1877f2' },
  { icon: <FaLinkedinIn />, name: 'LinkedIn',  color: '#0a66c2' },
  { icon: <FaXTwitter />,   name: 'Twitter',   color: '#14171a' },
  { icon: <FaPinterestP />, name: 'Pinterest', color: '#e60023' },
  { icon: <FaYoutube />,    name: 'YouTube',   color: '#ff0000' },
];

export default function PlatformsSection() {
  return (
    <section className="sp-section sp-platforms">
      <div className="sp-platforms__content">
        <p className="sp-eyebrow">INTEGRATIONS</p>
        <h2 className="sp-section-title">Every destination,<br />connected</h2>
        <p className="sp-section-sub">
          Publish and manage content across all major social platforms
          from a single queue.
        </p>

        <div className="sp-platforms__grid">
          {PLATFORMS.map((p, i) => (
            <div
              key={p.name}
              className="sp-platform-cloud"
              style={{ animationDelay: `${i * 0.4}s` }}
            >
              <div className="sp-platform-cloud__bubble">
                <span
                  className="sp-platform-cloud__icon"
                  style={{ color: p.color }}
                >
                  {p.icon}
                </span>
              </div>
              <span className="sp-platform-cloud__label">{p.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
