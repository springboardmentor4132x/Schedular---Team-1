import "../../App.css";
import logo from "../../assets/logo.jpeg";

import {
  FaInstagram,
  FaFacebookF,
  FaLinkedinIn,
  FaPinterestP,
  FaYoutube,
} from "react-icons/fa";

import { FaXTwitter } from "react-icons/fa6";
import { SiThreads } from "react-icons/si";

function LandingPage() {
  return (
    <>
      {/* Navbar */}
      <nav className="navbar">
        <div className="logo">
          <img
            src={logo}
            alt="SocialPilot Logo"
            className="logo-img"
          />
          <span>SocialPilot</span>
        </div>

        <ul className="nav-links">
          <li><a href="#">Home</a></li>
          <li><a href="#">Features</a></li>
          <li><a href="#">Platforms</a></li>
          <li><a href="#">About</a></li>
        </ul>

        <div className="nav-buttons">
          <button className="login-btn">Sign In</button>
          <button className="signup-btn">Sign Up</button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1>
            Manage All Your <span>Social Media</span> in One Place
          </h1>

          <p>
            Plan, schedule, publish, and analyze your content across
            multiple social media platforms with ease.
          </p>

          <div className="hero-buttons">
            <button className="primary-btn">Get Started</button>
            <button className="secondary-btn">Learn More</button>
          </div>
        </div>
      </section>


      {/* Platforms Section */}
      <section className="platforms">
        <h4>INTEGRATIONS</h4>

        <h2>Connect Every Platform</h2>

        <p>
          Publish and manage your content across all major social media
          platforms.
        </p>

        <div className="platform-grid">

          <div className="platform-card">
            <FaInstagram className="platform-icon instagram" />
            <span>Instagram</span>
          </div>

          <div className="platform-card">
            <FaFacebookF className="platform-icon facebook" />
            <span>Facebook</span>
          </div>

          <div className="platform-card">
            <FaLinkedinIn className="platform-icon linkedin" />
            <span>LinkedIn</span>
          </div>

          <div className="platform-card">
            <FaXTwitter className="platform-icon twitter" />
            <span>X</span>
          </div>

          <div className="platform-card">
            <SiThreads className="platform-icon threads" />
            <span>Threads</span>
          </div>

          <div className="platform-card">
            <FaPinterestP className="platform-icon pinterest" />
            <span>Pinterest</span>
          </div>

          <div className="platform-card">
            <FaYoutube className="platform-icon youtube" />
            <span>YouTube</span>
          </div>

        </div>
      </section>
      {/* Features Section */}
      <section className="features">

        <h4>FEATURES</h4>

        <h2>
          Everything You Need to Manage Social Media
        </h2>

        <p className="features-desc">
          Powerful tools to create, schedule, analyze and grow your
          social media presence.
        </p>


        <div className="features-grid">

          <div className="feature-card">
            <div className="feature-icon">📅</div>
            <h3>Schedule Posts</h3>
            <p>
              Plan and schedule your posts across multiple platforms easily.
            </p>
          </div>


          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>Analytics</h3>
            <p>
              Track performance and understand your audience insights.
            </p>
          </div>


          <div className="feature-card">
            <div className="feature-icon">🤖</div>
            <h3>AI Content Assistant</h3>
            <p>
              Generate creative captions and content ideas instantly.
            </p>
          </div>


          <div className="feature-card">
            <div className="feature-icon">👥</div>
            <h3>Team Collaboration</h3>
            <p>
              Work together with your team and manage content efficiently.
            </p>
          </div>


          <div className="feature-card">
            <div className="feature-icon">🔗</div>
            <h3>Multi Platform</h3>
            <p>
              Connect and manage all your social accounts in one place.
            </p>
          </div>


          <div className="feature-card">
            <div className="feature-icon">📈</div>
            <h3>Growth Reports</h3>
            <p>
              Get detailed reports to improve your social strategy.
            </p>
          </div>

        </div>

      </section>
      {/* CTA Section */}
<section className="cta">
  <h2>Ready to Grow Your Social Media?</h2>

  <p>
    Manage, schedule, and analyze all your social media content
    from one simple platform.
  </p>

  <button>Get Started</button>
</section>
{/* Footer Section */}
<footer className="footer">

  <div className="footer-content">

    <h2>SocialPilot</h2>

    <div className="footer-links">
      <a href="#">Home</a>
      <a href="#">Features</a>
      <a href="#">Platforms</a>
      <a href="#">Contact</a>
    </div>

  </div>

  <p>
    © 2026 SocialPilot. All rights reserved.
  </p>

</footer>
    </>
  );
}

export default LandingPage;
