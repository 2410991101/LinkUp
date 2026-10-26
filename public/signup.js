
const form = document.getElementById("signupForm");
const message = document.getElementById("message");

form.addEventListener("submit", async event => {
  event.preventDefault();

  const name = form.elements.name.value.trim();
  const email = form.elements.email.value.trim();
  const password = form.elements.password.value;

  message.className = "";
  message.textContent = "Creating your account...";
  message.style.color = "#6d5bd0";

  try {
    const response = await fetch("/api/auth/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ name, email, password })
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      message.textContent = result.message || "Signup failed.";
      message.className = "error-message";
      return;
    }

    message.textContent = "Account created! Redirecting to login...";
    message.className = "success-message";

    setTimeout(() => {
      window.location.href = "/login.html";
    }, 1000);

  } catch (error) {
    console.error(error);
    message.textContent = "Server error. Please try again.";
    message.className = "error-message";
  }
});
