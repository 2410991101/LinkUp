
import { Link } from "react-router-dom";

function Landing() {
  return (
    <div className="landing">
      <nav className="landing-nav">
        <h2>LinkUp</h2>

        <div className="nav-links">
          <a href="#features">Features</a>
          <Link to="/login">Login</Link>
          <Link to="/signup" className="nav-button">
            Sign Up
          </Link>
        </div>
      </nav>

      <section className="hero">
        <div className="hero-content">
          <span className="hero-tag">
            ✨ Your connections, beautifully organised
          </span>

          <h1>
            Every Connection.
            <br />
            <span>One Beautiful Place.</span>
          </h1>

          <p>
            Manage your contacts, build meaningful relationships
            and never miss an important follow-up with LinkUp.
          </p>

          <div className="hero-buttons">
            <Link to="/signup" className="primary-button">
              Get Started →
            </Link>

            <a href="#features" className="secondary-button">
              Explore Features
            </a>
          </div>
        </div>

        <div className="hero-preview">
          <div className="preview-card">
            <h3>Good afternoon 👋</h3>
            <p>Your connections at a glance</p>

            <div className="preview-stats">
              <div>
                <strong>128</strong>
                <span>Contacts</span>
              </div>
              <div>
                <strong>12</strong>
                <span>Follow-ups</span>
              </div>
              <div>
                <strong>8</strong>
                <span>Companies</span>
              </div>
            </div>

            <div className="preview-contact">
              <span className="avatar">A</span>
              <div>
                <strong>Alex Morgan</strong>
                <p>Product Designer</p>
              </div>
              <span className="status">Active</span>
            </div>

            <div className="preview-contact">
              <span className="avatar pink">S</span>
              <div>
                <strong>Sarah Wilson</strong>
                <p>Software Engineer</p>
              </div>
              <span className="status">Active</span>
            </div>
          </div>
        </div>
      </section>

      <section className="features" id="features">
        <h2>Everything you need to stay connected</h2>
        <p>Simple tools to manage your professional and personal relationships.</p>

        <div className="feature-grid">
          <div className="feature-card">
            <span>👥</span>
            <h3>Contact Management</h3>
            <p>Keep all your important contacts organised in one place.</p>
          </div>

          <div className="feature-card">
            <span>🔔</span>
            <h3>Smart Follow-ups</h3>
            <p>Remember important conversations and upcoming follow-ups.</p>
          </div>

          <div className="feature-card">
            <span>📊</span>
            <h3>Analytics</h3>
            <p>Understand your connections through useful insights.</p>
          </div>
        </div>
      </section>

      <footer>
        Made with 💜 by LinkUp | Stay Connected, Stay Organised.
      </footer>
    </div>
  );
}

export default Landing;
