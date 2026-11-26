
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import "./Dashboard.css";
import "./Contacts.css";

const API_URL = "/api/contacts";

function Contacts() {
  const navigate = useNavigate();

  const [contacts, setContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [search, setSearch] = useState("");
  const [companyFilter, setCompanyFilter] = useState("All");
  const [loading, setLoading] = useState(true);

  const token = sessionStorage.getItem("connectlyToken");

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    fetchContacts();
  }, []);

  async function fetchContacts() {
    try {
      const response = await fetch(API_URL, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.status === 401) {
        sessionStorage.removeItem("connectlyToken");
        sessionStorage.removeItem("connectlyUser");
        navigate("/login");
        return;
      }

      if (!response.ok) throw new Error("Unable to load contacts");

      const data = await response.json();
      const list = Array.isArray(data) ? data : data.contacts || [];

      setContacts(list);

      setSelectedContact((current) => {
        if (current) {
          return list.find((c) => c._id === current._id) || list[0] || null;
        }
        return list[0] || null;
      });
    } catch (error) {
      console.error("Contacts error:", error);
    } finally {
      setLoading(false);
    }
  }

  const companies = useMemo(() => {
    return [
      "All",
      ...new Set(
        contacts.map((contact) => contact.company).filter(Boolean)
      )
    ];
  }, [contacts]);

  const filteredContacts = contacts.filter((contact) => {
    const query = search.toLowerCase();

    const matchesSearch =
      contact.name?.toLowerCase().includes(query) ||
      contact.email?.toLowerCase().includes(query) ||
      contact.company?.toLowerCase().includes(query) ||
      contact.role?.toLowerCase().includes(query);

    const matchesCompany =
      companyFilter === "All" || contact.company === companyFilter;

    return matchesSearch && matchesCompany;
  });

  const totalCompanies = new Set(
    contacts.map((contact) => contact.company).filter(Boolean)
  ).size;

  const initials = (name = "") =>
    name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  function selectContact(contact) {
    setSelectedContact(contact);
  }

  return (
    <div className="app">
      <Sidebar />

      <main className="main-content">
        <div className="contacts-page">

          <div className="contacts-heading">
            <div>
              <p className="contacts-eyebrow">YOUR NETWORK</p>
              <h1>Contacts</h1>
              <p className="contacts-subtitle">
                Manage and organise all your professional relationships.
              </p>
            </div>

            <button
              className="contacts-add-btn"
              onClick={() => navigate("/dashboard")}
            >
              + Add Contact
            </button>
          </div>

          <div className="contacts-stats">
            <div className="contact-stat-card">
              <span className="stat-icon purple">♧</span>
              <div>
                <p>Total Contacts</p>
                <h2>{contacts.length}</h2>
              </div>
            </div>

            <div className="contact-stat-card">
              <span className="stat-icon pink">▤</span>
              <div>
                <p>Companies</p>
                <h2>{totalCompanies}</h2>
              </div>
            </div>

            <div className="contact-stat-card">
              <span className="stat-icon green">✦</span>
              <div>
                <p>Showing</p>
                <h2>{filteredContacts.length}</h2>
              </div>
            </div>
          </div>

          <div className="contacts-workspace">
            <section className="contacts-list-panel">
              <div className="contacts-panel-header">
                <div>
                  <h2>All Contacts</h2>
                  <p>Your complete professional network</p>
                </div>
                <span className="contacts-count">
                  {filteredContacts.length} contacts
                </span>
              </div>

              <div className="contacts-toolbar">
                <input
                  type="text"
                  placeholder="Search name, email or company..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />

                <select
                  value={companyFilter}
                  onChange={(e) => setCompanyFilter(e.target.value)}
                >
                  {companies.map((company) => (
                    <option key={company} value={company}>
                      {company === "All" ? "All Companies" : company}
                    </option>
                  ))}
                </select>
              </div>

              <div className="contacts-table-wrap">
                <table className="contacts-table">
                  <thead>
                    <tr>
                      <th>CONTACT</th>
                      <th>COMPANY</th>
                      <th>ROLE</th>
                      <th></th>
                    </tr>
                  </thead>

                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan="4" className="contacts-empty">
                          Loading contacts...
                        </td>
                      </tr>
                    ) : filteredContacts.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="contacts-empty">
                          No contacts found.
                        </td>
                      </tr>
                    ) : (
                      filteredContacts.map((contact) => (
                        <tr
                          key={contact._id}
                          className={
                            selectedContact?._id === contact._id
                              ? "selected-contact-row"
                              : ""
                          }
                          onClick={() => selectContact(contact)}
                        >
                          <td>
                            <div className="contact-person">
                              <div className="contact-initials">
                                {initials(contact.name)}
                              </div>
                              <div>
                                <strong>{contact.name}</strong>
                                <span>
                                  {contact.email || "No email added"}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td>{contact.company || "—"}</td>
                          <td>{contact.role || "—"}</td>

                          <td>
                            <button
                              className="contact-view-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                selectContact(contact);
                              }}
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <aside className="contact-details-panel">
              {selectedContact ? (
                <>
                  <div className="details-top">
                    <span>CONTACT PROFILE</span>
                    <span className="details-dot">●</span>
                  </div>

                  <div className="details-profile">
                    <div className="details-avatar">
                      {initials(selectedContact.name)}
                    </div>
                    <h2>{selectedContact.name}</h2>
                    <p>
                      {selectedContact.role || "Professional Contact"}
                    </p>
                    <span className="details-company">
                      {selectedContact.company || "No company"}
                    </span>
                  </div>

                  <div className="details-divider"></div>

                  <h3>Contact Information</h3>

                  <div className="detail-field">
                    <span>✉</span>
                    <div>
                      <label>Email Address</label>
                      <p>{selectedContact.email || "Not provided"}</p>
                    </div>
                  </div>

                  <div className="detail-field">
                    <span>▤</span>
                    <div>
                      <label>Company</label>
                      <p>{selectedContact.company || "Not provided"}</p>
                    </div>
                  </div>

                  <div className="detail-field">
                    <span>♙</span>
                    <div>
                      <label>Designation</label>
                      <p>{selectedContact.role || "Not provided"}</p>
                    </div>
                  </div>

                  <div className="details-note">
                    <span>✦</span>
                    <p>
                      Stay connected! Build meaningful professional
                      relationships with your network.
                    </p>
                  </div>
                </>
              ) : (
                <div className="no-contact-selected">
                  <span>♡</span>
                  <h3>Select a Contact</h3>
                  <p>
                    Choose someone from the list to see their details here.
                  </p>
                </div>
              )}
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Contacts;
