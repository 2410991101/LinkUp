
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";

const API_URL = "/api/contacts";
const FOLLOWUP_API = "/api/followups";

const colors = [
  ["#eee7ff", "#7653d9"],
  ["#dff5ed", "#258f70"],
  ["#ffe9df", "#ce7953"],
  ["#e3f0ff", "#4d87cc"]
];

function initials(name = "") {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(part => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function Dashboard() {
  const navigate = useNavigate();

  const [contacts, setContacts] = useState([]);
  const [followUps, setFollowUps] = useState([]);
  const [search, setSearch] = useState("");
  const [company, setCompany] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [toast, setToast] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    company: "",
    role: ""
  });

  const token = sessionStorage.getItem("connectlyToken");

  function authHeaders() {
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
  }

  function notify(message) {
    setToast(message);
    setTimeout(() => setToast(""), 2600);
  }

  function handleAuthError() {
    sessionStorage.removeItem("connectlyToken");
    sessionStorage.removeItem("connectlyUser");
    navigate("/login");
  }

  async function loadContacts() {
    if (!token) {
      handleAuthError();
      return;
    }

    try {
      const response = await fetch(API_URL, {
        headers: authHeaders()
      });

      const data = await response.json();

      if (response.status === 401) {
        handleAuthError();
        return;
      }

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Could not load contacts.");
      }

      setContacts(data.contacts || []);
    } catch (error) {
      console.error("Error loading contacts:", error);
      notify("Could not load contacts. Check the server.");
    }
  }

  async function loadFollowUps() {
    if (!token) return;

    try {
      const response = await fetch(FOLLOWUP_API, {
        headers: authHeaders()
      });

      if (response.status === 401) {
        handleAuthError();
        return;
      }

      if (!response.ok) {
        throw new Error("Could not load follow-ups.");
      }

      const data = await response.json();

      setFollowUps(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error loading follow-ups:", error);
    }
  }

  useEffect(() => {
    loadContacts();
    loadFollowUps();
  }, []);

  const filteredContacts = contacts.filter(contact => {
    const query = search.trim().toLowerCase();

    const matchesText = [
      contact.name,
      contact.email,
      contact.company,
      contact.role
    ].some(value =>
      (value || "").toLowerCase().includes(query)
    );

    return matchesText &&
      (!company || contact.company === company);
  });

  function openAddModal() {
    setEditingId(null);

    setForm({
      name: "",
      email: "",
      company: "",
      role: ""
    });

    setModalOpen(true);
  }

  function openEditModal(contact) {
    setEditingId(contact._id);

    setForm({
      name: contact.name || "",
      email: contact.email || "",
      company: contact.company || "",
      role: contact.role || ""
    });

    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingId(null);
  }

  function handleChange(event) {
    setForm({
      ...form,
      [event.target.name]: event.target.value
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      company: form.company.trim(),
      role: form.role.trim()
    };

    if (!payload.name) {
      notify("Please enter a contact name.");
      return;
    }

    const isEditing = editingId !== null;

    const url = isEditing
      ? `${API_URL}/${editingId}`
      : API_URL;

    try {
      const response = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: authHeaders(),
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (response.status === 401) {
        handleAuthError();
        return;
      }

      if (!response.ok || !result.success) {
        notify(result.message || "Could not save contact.");
        return;
      }

      closeModal();

      notify(
        isEditing
          ? "Contact updated successfully!"
          : "Contact added successfully!"
      );

      await loadContacts();
    } catch (error) {
      console.error("Error saving contact:", error);
      notify("Server connection failed. Please try again.");
    }
  }

  async function deleteContact(id) {
    const contact = contacts.find(item => item._id === id);

    if (!contact) {
      notify("Contact not found. Refresh and try again.");
      return;
    }

    if (!window.confirm(`Delete ${contact.name}?`)) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
        headers: authHeaders()
      });

      const result = await response.json();

      if (response.status === 401) {
        handleAuthError();
        return;
      }

      if (!response.ok || !result.success) {
        notify(result.message || "Could not delete contact.");
        return;
      }

      notify("Contact deleted successfully!");

      await loadContacts();
    } catch (error) {
      console.error("Error deleting contact:", error);
      notify("Server connection failed. Please try again.");
    }
  }

  function getFollowUpDate(date) {
    const dueDate = new Date(date);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);

    if (due.getTime() === today.getTime()) {
      return "Today";
    }

    if (due.getTime() === tomorrow.getTime()) {
      return "Tomorrow";
    }

    return dueDate.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short"
    });
  }

  const upcomingFollowUps = followUps
    .filter(item => item.status !== "Completed")
    .sort(
      (a, b) =>
        new Date(a.dueDate) - new Date(b.dueDate)
    )
    .slice(0, 4);

  const hour = new Date().getHours();

  const greeting =
    hour >= 5 && hour < 12 ? "Good morning" :
    hour >= 12 && hour < 17 ? "Good afternoon" :
    hour >= 17 && hour < 21 ? "Good evening" :
    "Good night";

  const companies = [
    ...new Set(
      contacts
        .map(contact => contact.company)
        .filter(Boolean)
    )
  ];

  return (
    <div className="app">
      <div className="ambient ambient-one"></div>
      <div className="ambient ambient-two"></div>
      <div className="ambient ambient-three"></div>

      <aside className="sidebar">
        <div className="brand">
          <span className="brand-icon">L</span>
          <span>LinkUp</span>
        </div>

        <div className="sidebar-label">WORKSPACE</div>

        <nav className="sidebar-nav">
          <a href="/dashboard" className="nav-item active">
            <span>⌂</span> Overview
          </a>

          <a href="/contacts" className="nav-item">
            <span>♧</span> Contacts
          </a>

          <a href="/followups" className="nav-item">
            <span>◷</span> Follow-ups
            <span className="nav-badge">
              {followUps.filter(item => item.status !== "Completed").length}
            </span>
          </a>

          <a href="/analytics" className="nav-item">
            <span>▥</span> Analytics
          </a>

          <a href="/settings" className="nav-item">
            <span>⚙</span> Preferences
          </a>
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-user-avatar">JK</div>
          <div>
            <strong>My Workspace</strong>
            <small>Personal account</small>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumb">
            Workspace <span>/</span> Overview
          </div>

          <div className="topbar-right">
            <span className="saved-label">● All changes saved</span>
            <button className="notification-btn" type="button">♧</button>
            <div className="top-avatar">JK</div>
          </div>
        </header>

        <section className="welcome-section">
          <div>
            <div className="eyebrow">YOUR RELATIONSHIP HUB</div>
            <h1 id="greeting">{greeting} 👋</h1>
            <p>Here's what's happening with your network today.</p>
          </div>

          <button
            className="primary-btn"
            onClick={openAddModal}
            type="button"
          >
            + Add contact
          </button>
        </section>

        <section className="stats-grid">
          <div className="stat-card">
            <span>Total contacts</span>
            <h2>{contacts.length}</h2>
            <small>Your entire network</small>
          </div>

          <div className="stat-card">
            <span>New this month</span>
            <h2>
              {contacts.filter(contact => {
                const date = new Date(contact.createdAt);
                const now = new Date();

                return date.getMonth() === now.getMonth() &&
                  date.getFullYear() === now.getFullYear();
              }).length}
            </h2>
            <small>Recently added contacts</small>
          </div>

          <div className="stat-card">
            <span>Follow-ups due</span>
            <h2>{followUps.length}</h2>
            <small>Stay connected</small>
          </div>

          <div className="stat-card">
            <span>Companies</span>
            <h2>{companies.length}</h2>
            <small>Across your network</small>
          </div>
        </section>

        <section className="content-grid">
          <div className="panel contacts-panel" id="contacts">
            <div className="panel-heading">
              <div>
                <h2>Your contacts</h2>
                <p>Manage and organize your connections.</p>
              </div>

              <button
                className="text-btn"
                type="button"
                onClick={() => {
                  setSearch("");
                  setCompany("");
                }}
              >
                View all
              </button>
            </div>

            <div className="filters">
              <input
                type="text"
                placeholder="Search contacts..."
                value={search}
                onChange={event => setSearch(event.target.value)}
              />

              <select
                value={company}
                onChange={event => setCompany(event.target.value)}
              >
                <option value="">All companies</option>

                {companies.map(item => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div className="table-wrapper">
              <table className="contacts-table">
                <thead>
                  <tr>
                    <th>CONTACT</th>
                    <th>COMPANY</th>
                    <th>STATUS</th>
                    <th>ACTIONS</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredContacts.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="empty-state">
                        {contacts.length
                          ? "No matching contacts found."
                          : "No contacts yet. Add your first contact!"}
                      </td>
                    </tr>
                  ) : (
                    filteredContacts.map(contact => {
                      const index = contacts.indexOf(contact);
                      const colorPair = colors[index % colors.length];

                      return (
                        <tr key={contact._id}>
                          <td>
                            <div className="person">
                              <span
                                className="person-avatar"
                                style={{
                                  background: colorPair[0],
                                  color: colorPair[1]
                                }}
                              >
                                {initials(contact.name)}
                              </span>

                              <div>
                                <strong>{contact.name}</strong>
                                <small>
                                  {contact.email || "No email added"}
                                </small>
                              </div>
                            </div>
                          </td>

                          <td className="company">
                            {contact.company || "—"}
                          </td>

                          <td>
                            <span className="pill active-status">
                              Saved
                            </span>
                          </td>

                          <td>
                            <button
                              className="text-btn"
                              type="button"
                              onClick={() => openEditModal(contact)}
                            >
                              Edit
                            </button>

                            <button
                              className="text-btn delete-btn"
                              type="button"
                              onClick={() => deleteContact(contact._id)}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="panel-footer">
              Showing {filteredContacts.length} of {contacts.length} contacts
            </div>
          </div>

          <div className="panel followups-panel" id="followups">
            <div className="panel-heading">
              <div>
                <h2>Upcoming follow-ups</h2>
                <p>People worth staying in touch with.</p>
              </div>
            </div>

            <div className="followup-list">
              {upcomingFollowUps.length === 0 ? (
                <div className="empty-state">
                  No follow-ups yet. Create your first one!
                </div>
              ) : (
                upcomingFollowUps.map((item, index) => {
                  const name = item.contact?.name || "Unknown contact";
                  const colorPair = colors[index % colors.length];

                  return (
                    <div className="followup-item" key={item._id}>
                      <span
                        className="person-avatar"
                        style={{
                          background: colorPair[0],
                          color: colorPair[1]
                        }}
                      >
                        {initials(name)}
                      </span>

                      <div className="followup-info">
                        <strong>{item.title}</strong>
                        <small>{name}</small>
                      </div>

                      <span className="followup-date">
                        {getFollowUpDate(item.dueDate)}
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            <button
              className="followup-btn"
              type="button"
              onClick={() => navigate("/followups")}
            >
              View all follow-ups →
            </button>
          </div>
        </section>

        <footer className="dashboard-footer">
          Made with care for your connections 💜
        </footer>
      </main>

      {modalOpen && (
        <div
          className="modal-overlay"
          onClick={event => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <div className="modal">
            <div className="modal-heading">
              <div>
                <h2>
                  {editingId ? "Edit contact" : "Add a new contact"}
                </h2>
                <p>Keep your important connections close.</p>
              </div>

              <button
                className="close-btn"
                type="button"
                onClick={closeModal}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <label>
                Full name *
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Enter full name"
                  required
                />
              </label>

              <label>
                Email address
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="Enter email address"
                />
              </label>

              <label>
                Company
                <input
                  name="company"
                  value={form.company}
                  onChange={handleChange}
                  placeholder="Enter company"
                />
              </label>

              <label>
                Job role
                <input
                  name="role"
                  value={form.role}
                  onChange={handleChange}
                  placeholder="Enter job role"
                />
              </label>

              <button className="submit-btn" type="submit">
                {editingId ? "Update contact" : "Save contact"}
              </button>
            </form>
          </div>
        </div>
      )}

      {toast && <div className="toast show">{toast}</div>}
    </div>
  );
}

export default Dashboard;
