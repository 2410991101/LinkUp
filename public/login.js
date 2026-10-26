
const form = document.getElementById("loginForm");
const message = document.getElementById("message");

form.addEventListener("submit", async event => {
  event.preventDefault();

  const email = form.elements.email.value.trim();
  const password = form.elements.password.value;

  message.className = "";
  message.textContent = "Signing you in...";
  message.style.color = "#6d5bd0";

  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, password })
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      message.textContent = result.message || "Login failed.";
      message.className = "error-message";
      return;
    }

    sessionStorage.setItem("connectlyToken", result.token);
    sessionStorage.setItem(
      "connectlyUser",
      JSON.stringify(result.user)
    );

    window.location.href = "/dashboard";

  } catch (error) {
    console.error(error);
    message.textContent = "Server error. Please try again.";
    message.className = "error-message";
  }
});
