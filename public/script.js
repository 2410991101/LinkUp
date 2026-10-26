
const API_URL = "/api/contacts";

// Get authentication token from sessionStorage
function authHeaders() {
  const token = sessionStorage.getItem("connectlyToken");

  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

let contacts = [];
let editingId = null;

const contactsBody = document.getElementById("contactsBody");
const searchInput = document.getElementById("searchInput");
const companyFilter = document.getElementById("companyFilter");
const modal = document.getElementById("contactModal");
const form = document.getElementById("contactForm");
const toast = document.getElementById("toast");

const colors = [
  ["#eee7ff", "#7653d9"],
  ["#dff5ed", "#258f70"],
  ["#ffe9df", "#ce7953"],
  ["#e3f0ff", "#4d87cc"]
];

// Show notification
function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 2600);
}

// Generate initials for avatar
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
function updateGreeting() {
  const hour = new Date().getHours();
  const greeting = document.getElementById("greeting");

  if (hour >= 5 && hour < 12) {
    greeting.innerHTML = 'Good morning <span class="wave">👋</span>';
  } else if (hour >= 12 && hour < 17) {
    greeting.innerHTML = 'Good afternoon <span class="wave">👋</span>';
  } else if (hour >= 17 && hour < 21) {
    greeting.innerHTML = 'Good evening <span class="wave">👋</span>';
  } else {
    greeting.innerHTML = 'Good night <span class="wave">👋</span>';
  }
}

updateGreeting();
// Handle expired or missing login token
function handleAuthError() {
  sessionStorage.removeItem("connectlyToken");
  sessionStorage.removeItem("connectlyUser");
  window.location.href = "/login.html";
}

// Load contacts from backend
async function loadContacts() {
  const token = sessionStorage.getItem("connectlyToken");

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

    contacts = data.contacts || [];
    renderContacts();

  } catch (error) {
    console.error("Error loading contacts:", error);
    showToast("Could not load contacts. Check the server.");
  }
}

// Render contacts in the table
function renderContacts() {
  const query = searchInput.value.trim().toLowerCase();
  const company = companyFilter.value;

  const filtered = contacts.filter(contact => {
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

  contactsBody.replaceChildren();

  if (filtered.length === 0) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");

    cell.colSpan = 4;
    cell.className = "empty-state";

    cell.textContent = contacts.length
      ? "No matching contacts found."
      : "No contacts yet. Add your first contact!";

    row.appendChild(cell);
    contactsBody.appendChild(row);
  }

  filtered.forEach(contact => {
    const row = document.createElement("tr");

    // Name and avatar
    const nameCell = document.createElement("td");
    const person = document.createElement("div");
    person.className = "person";

    const avatar = document.createElement("span");
    avatar.className = "person-avatar";

    const contactIndex = contacts.indexOf(contact);
    const colorPair = colors[
      Math.max(0, contactIndex) % colors.length
    ];

    avatar.style.background = colorPair[0];
    avatar.style.color = colorPair[1];
    avatar.textContent = initials(contact.name);

    const details = document.createElement("div");

    const name = document.createElement("strong");
    name.textContent = contact.name || "Unnamed contact";

    const email = document.createElement("small");
    email.textContent = contact.email || "No email added";

    details.append(name, email);
    person.append(avatar, details);
    nameCell.appendChild(person);

    // Company
    const companyCell = document.createElement("td");
    companyCell.className = "company";
    companyCell.textContent = contact.company || "—";

    // Status
    const statusCell = document.createElement("td");
    const status = document.createElement("span");

    status.className = "pill active-status";
    status.textContent = "Saved";

    statusCell.appendChild(status);

    // Edit and delete buttons
    const actionCell = document.createElement("td");

    const editButton = document.createElement("button");
    editButton.className = "text-btn";
    editButton.textContent = "Edit";
    editButton.addEventListener("click", () => {
      openEditModal(contact);
    });

    const deleteButton = document.createElement("button");
    deleteButton.className = "text-btn";
    deleteButton.textContent = "Delete";
    deleteButton.style.color = "#d95768";

    deleteButton.addEventListener("click", () => {
      deleteContact(contact._id);
    });

    actionCell.append(editButton, deleteButton);

    row.append(
      nameCell,
      companyCell,
      statusCell,
      actionCell
    );

    contactsBody.appendChild(row);
  });

  // Update dashboard counters
  document.getElementById("contactCount").textContent =
    `Showing ${filtered.length} of ${contacts.length} contacts`;

  document.getElementById("totalContacts").textContent =
    contacts.length;
}

// Open form for a new contact
document.getElementById("addContactBtn").addEventListener("click", () => {
  editingId = null;
  form.reset();

  form.querySelector(".submit-btn").textContent = "Save contact";
  modal.classList.remove("hidden");
});

// Open form for editing
function openEditModal(contact) {
  editingId = contact._id;

  form.elements.name.value = contact.name || "";
  form.elements.email.value = contact.email || "";
  form.elements.company.value = contact.company || "";
  form.elements.role.value = contact.role || "";

  form.querySelector(".submit-btn").textContent = "Update contact";
  modal.classList.remove("hidden");
}

// Close modal
document.getElementById("closeModal").addEventListener("click", () => {
  modal.classList.add("hidden");
});

// Close modal when clicking outside the form
modal.addEventListener("click", event => {
  if (event.target === modal) {
    modal.classList.add("hidden");
  }
});

// Add or update a contact
form.addEventListener("submit", async event => {
  event.preventDefault();

  const formData = new FormData(form);

  const payload = {
    name: (formData.get("name") || "").trim(),
    email: (formData.get("email") || "").trim(),
    company: (formData.get("company") || "").trim(),
    role: (formData.get("role") || "").trim()
  };

  if (!payload.name) {
    showToast("Please enter a contact name.");
    return;
  }

  const isEditing = editingId !== null;

  const url = isEditing
    ? `${API_URL}/${editingId}`
    : API_URL;

  const method = isEditing ? "PUT" : "POST";

  try {
    const response = await fetch(url, {
      method,
      headers: authHeaders(),
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (response.status === 401) {
      handleAuthError();
      return;
    }

    if (!response.ok || !result.success) {
      showToast(result.message || "Could not save contact.");
      return;
    }

    modal.classList.add("hidden");
    form.reset();
    editingId = null;

    showToast(
      isEditing
        ? "Contact updated successfully!"
        : "Contact added successfully!"
    );

    await loadContacts();

  } catch (error) {
    console.error("Error saving contact:", error);
    showToast("Server connection failed. Please try again.");
  }
});

// Delete a contact
async function deleteContact(id) {
  const contact = contacts.find(item => item._id === id);

  if (!contact) {
    showToast("Contact not found. Refresh and try again.");
    return;
  }

  if (!confirm(`Delete ${contact.name}?`)) {
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
      showToast(result.message || "Could not delete contact.");
      return;
    }

    showToast("Contact deleted successfully!");
    await loadContacts();

  } catch (error) {
    console.error("Error deleting contact:", error);
    showToast("Server connection failed. Please try again.");
  }
}

// Search and company filter
searchInput.addEventListener("input", renderContacts);
companyFilter.addEventListener("change", renderContacts);

// Reset filters
document.getElementById("viewAllBtn").addEventListener("click", () => {
  searchInput.value = "";
  companyFilter.value = "";
  renderContacts();
});

// Follow-up feature placeholder
document.getElementById("followupBtn").addEventListener("click", () => {
  showToast("We'll build the reminders feature next!");
});

// Load contacts when dashboard opens
loadContacts();

