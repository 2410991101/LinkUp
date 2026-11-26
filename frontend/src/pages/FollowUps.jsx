
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import "./Dashboard.css";
import "./FollowUps.css";

const API_URL = "/api/followups";
const CONTACT_API = "/api/contacts";

function FollowUps() {
  const navigate = useNavigate();
  const token = sessionStorage.getItem("connectlyToken");

  const [followUps, setFollowUps] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [filter, setFilter] = useState("All");

  const [form, setForm] = useState({
    title: "",
    note: "",
    contact: "",
    dueDate: ""
  });

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    loadData();
  }, []);

  async function loadData() {
    try {
      const headers = {
        Authorization: `Bearer ${token}`
      };

      const [followResponse, contactResponse] = await Promise.all([
        fetch(API_URL, { headers }),
        fetch(CONTACT_API, { headers })
      ]);

      if (
        followResponse.status === 401 ||
        contactResponse.status === 401
      ) {
        sessionStorage.removeItem("connectlyToken");
        sessionStorage.removeItem("connectlyUser");
        navigate("/login");
        return;
      }

      if (!followResponse.ok || !contactResponse.ok) {
        throw new Error("Failed to load data");
      }

      const followData = await followResponse.json();
      const contactData = await contactResponse.json();

      setFollowUps(followData);

      setContacts(
        Array.isArray(contactData)
          ? contactData
          : contactData.contacts || []
      );
    } catch (error) {
      console.error("Follow-up loading error:", error);
    } finally {
      setLoading(false);
    }
  }

  function getStatus(item) {
    if (item.status === "Completed") return "Completed";

    const due = new Date(item.dueDate);
    const today = new Date();

    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);

    return due < today ? "Overdue" : "Pending";
  }

  const pending = followUps.filter(
    (item) => getStatus(item) === "Pending"
  ).length;

  const completed = followUps.filter(
    (item) => getStatus(item) === "Completed"
  ).length;

  const overdue = followUps.filter(
    (item) => getStatus(item) === "Overdue"
  ).length;

  const filteredFollowUps = followUps.filter(
    (item) => filter === "All" || getStatus(item) === filter
  );

  function openAddModal() {
    setEditingId(null);

    setForm({
      title: "",
      note: "",
      contact: contacts[0]?._id || "",
      dueDate: ""
    });

    setShowModal(true);
  }

  function openEditModal(item) {
    setEditingId(item._id);

    setForm({
      title: item.title,
      note: item.note || "",
      contact: item.contact?._id || "",
      dueDate: item.dueDate
        ? new Date(item.dueDate).toISOString().slice(0, 10)
        : ""
    });

    setShowModal(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!form.contact) {
      alert("Please add a contact first.");
      return;
    }

    try {
      const response = await fetch(
        editingId
          ? `${API_URL}/${editingId}`
          : API_URL,
        {
          method: editingId ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(form)
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Something went wrong");
      }

      await loadData();
      setShowModal(false);
    } catch (error) {
      alert(error.message);
    }
  }

  async function toggleComplete(item) {
    const newStatus =
      item.status === "Completed" ? "Pending" : "Completed";

    try {
      const response = await fetch(`${API_URL}/${item._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        throw new Error("Unable to update status");
      }

      await loadData();
    } catch (error) {
      alert(error.message);
    }
  }

  async function deleteFollowUp(id) {
    if (
      !window.confirm(
        "Are you sure you want to delete this follow-up?"
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error("Unable to delete follow-up");
      }

      await loadData();
    } catch (error) {
      alert(error.message);
    }
  }

  function formatDate(date) {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  }

  return (
    <div className="app">
      <Sidebar />

      <main className="main-content">
        <div className="followups-page">

          <div className="followups-heading">
            <div>
              <p className="followups-eyebrow">STAY CONNECTED</p>
              <h1>Follow-ups</h1>
              <p>
                Never miss an opportunity to connect with your network.
              </p>
            </div>

            <button
              className="followup-add-btn"
              onClick={openAddModal}
            >
              + New Follow-up
            </button>
          </div>

          <div className="followup-stats">
            <div className="followup-stat-card">
              <span className="followup-stat-icon purple">◷</span>
              <div>
                <p>Total Follow-ups</p>
                <h2>{followUps.length}</h2>
              </div>
            </div>

            <div className="followup-stat-card">
              <span className="followup-stat-icon orange">◉</span>
              <div>
                <p>Pending</p>
                <h2>{pending}</h2>
              </div>
            </div>

            <div className="followup-stat-card">
              <span className="followup-stat-icon green">✓</span>
              <div>
                <p>Completed</p>
                <h2>{completed}</h2>
              </div>
            </div>

            <div className="followup-stat-card">
              <span className="followup-stat-icon red">!</span>
              <div>
                <p>Overdue</p>
                <h2>{overdue}</h2>
              </div>
            </div>
          </div>

          <section className="followups-panel">
            <div className="followups-panel-header">
              <div>
                <h2>Your Follow-up Schedule</h2>
                <p>
                  Keep track of your important conversations.
                </p>
              </div>

              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option>All</option>
                <option>Pending</option>
                <option>Completed</option>
                <option>Overdue</option>
              </select>
            </div>

            {loading ? (
              <div className="followups-empty">
                Loading follow-ups...
              </div>
            ) : filteredFollowUps.length === 0 ? (
              <div className="followups-empty">
                <span>♡</span>
                <h3>No follow-ups found</h3>
                <p>
                  Create your first follow-up to stay organised.
                </p>
                <button onClick={openAddModal}>
                  Create Follow-up
                </button>
              </div>
            ) : (
              <div className="followup-list">
                {filteredFollowUps.map((item) => (
                  <div className="followup-card" key={item._id}>
                    <div className="followup-date-box">
                      <strong>
                        {new Date(item.dueDate).toLocaleDateString(
                          "en-IN",
                          { day: "2-digit" }
                        )}
                      </strong>

                      <span>
                        {new Date(item.dueDate).toLocaleDateString(
                          "en-IN",
                          { month: "short" }
                        )}
                      </span>
                    </div>

                    <div className="followup-main-info">
                      <h3>{item.title}</h3>

                      <p>
                        {item.contact?.name || "Unknown contact"}
                        {item.contact?.company
                          ? ` · ${item.contact.company}`
                          : ""}
                      </p>

                      {item.note && <span>{item.note}</span>}
                    </div>

                    <div className="followup-actions">
                      <span
                        className={`followup-status ${getStatus(
                          item
                        ).toLowerCase()}`}
                      >
                        {getStatus(item)}
                      </span>

                      <button
                        title="Edit"
                        onClick={() => openEditModal(item)}
                      >
                        ✎
                      </button>

                      <button
                        title="Delete"
                        onClick={() => deleteFollowUp(item._id)}
                      >
                        ×
                      </button>

                      <button
                        className="complete-followup-btn"
                        onClick={() => toggleComplete(item)}
                      >
                        {item.status === "Completed"
                          ? "Undo"
                          : "✓ Done"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {showModal && (
            <div
              className="followup-modal-overlay"
              onClick={() => setShowModal(false)}
            >
              <div
                className="followup-modal"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="followup-modal-heading">
                  <div>
                    <h2>
                      {editingId
                        ? "Edit Follow-up"
                        : "New Follow-up"}
                    </h2>

                    <p>
                      Schedule your next important conversation.
                    </p>
                  </div>

                  <button onClick={() => setShowModal(false)}>
                    ×
                  </button>
                </div>

                <form onSubmit={handleSubmit}>
                  <label>Follow-up Title</label>

                  <input
                    type="text"
                    placeholder="e.g. Discuss project opportunity"
                    value={form.title}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        title: e.target.value
                      })
                    }
                    required
                  />

                  <label>Select Contact</label>

                  <select
                    value={form.contact}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        contact: e.target.value
                      })
                    }
                    required
                  >
                    <option value="">Choose a contact</option>

                    {contacts.map((contact) => (
                      <option
                        key={contact._id}
                        value={contact._id}
                      >
                        {contact.name}
                      </option>
                    ))}
                  </select>

                  <label>Due Date</label>

                  <input
                    type="date"
                    value={form.dueDate}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        dueDate: e.target.value
                      })
                    }
                    required
                  />

                  <label>Notes</label>

                  <textarea
                    placeholder="Add some details..."
                    value={form.note}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        note: e.target.value
                      })
                    }
                  />

                  <button
                    className="followup-save-btn"
                    type="submit"
                  >
                    {editingId
                      ? "Save Changes"
                      : "Create Follow-up"}
                  </button>
                </form>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

export default FollowUps;
