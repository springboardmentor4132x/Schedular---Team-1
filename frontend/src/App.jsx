import { useState } from "react";
import "./App.css";

function App() {
  const [darkMode, setDarkMode] = useState(false);

  return (
    <>
      {/* Body theme toggle */}
      <div className={darkMode ? "dark" : ""}>

        {/* Navbar */}
        <nav className="navbar">
          <h2 className="logo">SocialPilot</h2>

          <ul className="nav-links">
            <li>Home</li>
            <li>Features</li>
            <li>Pricing</li>
            <li>Contact</li>
          </ul>

          <div className="nav-actions">
            <button className="login-btn">Login</button>

            {/* Dark mode button */}
            <button
              className="theme-btn"
              onClick={() => setDarkMode(!darkMode)}
            >
              {darkMode ? "Light Mode" : "Dark Mode"}
            </button>
          </div>
        </nav>

        {/* Hero */}
        <section className="hero">
          <h1>Manage All Your Social Media in One Place</h1>

          <p>
            Schedule, manage and publish your content across multiple social
            media platforms with ease.
          </p>

          <div className="hero-buttons">
            <button className="primary-btn">Get Started</button>
            <button className="secondary-btn">Learn More</button>
          </div>
        </section>

        {/* Features */}
        <section className="features">
          <h2>Features</h2>

          <div className="feature-cards">
            <div className="card">
              <h3>Easy Scheduling</h3>
              <p>Schedule posts across all platforms in one click.</p>
            </div>

            <div className="card">
              <h3>Analytics</h3>
              <p>Track performance and grow your audience.</p>
            </div>

            <div className="card">
              <h3>Multi Platform</h3>
              <p>Manage Instagram, Facebook, Twitter easily.</p>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="pricing">
          <h2>Pricing Plans</h2>

          <div className="pricing-cards">
            <div className="price-card">
              <h3>Free</h3>
              <p>$0 / month</p>
              <ul>
                <li>Basic scheduling</li>
                <li>1 account</li>
                <li>Limited analytics</li>
              </ul>
              <button>Choose</button>
            </div>

            <div className="price-card highlight">
              <h3>Pro</h3>
              <p>$9 / month</p>
              <ul>
                <li>All features</li>
                <li>10 accounts</li>
                <li>Advanced analytics</li>
              </ul>
              <button>Choose</button>
            </div>

            <div className="price-card">
              <h3>Business</h3>
              <p>$29 / month</p>
              <ul>
                <li>Unlimited accounts</li>
                <li>Team access</li>
                <li>Priority support</li>
              </ul>
              <button>Choose</button>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="footer">
          <p>© 2026 SocialPilot. All rights reserved.</p>
        </footer>

      </div>
    </>
  );
}

export default App;