
import { NavLink } from "react-router-dom";

function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="brand-icon">L</span>
        <span>LinkUp</span>
      </div>

      <div className="sidebar-label">WORKSPACE</div>

      <nav className="sidebar-nav">
        <NavLink to="/dashboard" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
          <span>⌂</span> Overview
        </NavLink>

        <NavLink to="/contacts" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
          <span>♧</span> Contacts
        </NavLink>

        <NavLink to="/followups" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
          <span>◷</span> Follow-ups
          <span className="nav-badge">4</span>
        </NavLink>

        <NavLink to="/analytics" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
          <span>▥</span> Analytics
        </NavLink>

        <NavLink to="/settings" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
          <span>⚙</span> Preferences
        </NavLink>
      </nav>

      <div className="sidebar-bottom">
        <div className="sidebar-user-avatar">JK</div>
        <div>
          <strong>My Workspace</strong>
          <small>Personal account</small>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
