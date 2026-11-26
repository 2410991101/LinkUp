
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

function Auth() {
  const location = useLocation();
  const navigate = useNavigate();

  const isSignup = location.pathname === "/signup";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [loading, setLoading] = useState(false);

  const switchMode = (signup) => {
    setMessage("");
    navigate(signup ? "/signup" : "/login");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (isSignup && !name.trim()) {
      setMessage("Please enter your full name.");
      setMessageType("error");
      return;
    }

    if (!email.trim() || !password) {
      setMessage("Please fill in all required fields.");
      setMessageType("error");
      return;
    }

    if (isSignup && password !== confirmPassword) {
      setMessage("Passwords do not match.");
      setMessageType("error");
      return;
    }

    if (password.length < 6) {
      setMessage("Password must contain at least 6 characters.");
      setMessageType("error");
      return;
    }

    setLoading(true);

    try {
      const endpoint = isSignup
        ? "/api/auth/signup"
        : "/api/auth/login";

      const payload = isSignup
        ? { name: name.trim(), email: email.trim(), password }
        : { email: email.trim(), password };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || "Something went wrong.");
      }

      if (isSignup) {
        if (data.token) {
          sessionStorage.setItem("connectlyToken", data.token);

          if (data.user) {
            sessionStorage.setItem("connectlyUser", JSON.stringify(data.user));
          }

          navigate("/dashboard");
        } else {
          setMessage(data.message || "Account created! Please log in.");
          setMessageType("success");
          setPassword("");
          setConfirmPassword("");
          navigate("/login");
        }
      } else {
        const token = data.token || data.accessToken;

        if (!token) {
          throw new Error("Login succeeded but the server did not return a token.");
        }

        sessionStorage.setItem("connectlyToken", token);

        const user = data.user || data.data?.user;
        if (user) {
          sessionStorage.setItem("connectlyUser", JSON.stringify(user));
        }

        navigate("/dashboard");
      }
    } catch (error) {
      setMessage(error.message || "Unable to connect to the server.");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <Link to="/" className="auth-close" aria-label="Back to home">
        ×
      </Link>

      <div className="auth-card">
        <section className="auth-brand">
          <Link to="/" className="auth-logo">
            <span className="logo-symbol">↗</span>
            <span>LinkUp</span>
            <span className="logo-heart">♥</span>
          </Link>

          <p className="auth-brand-subtitle">
            Smart Contact &amp;<br /> Relationship Manager
          </p>

          <div className="auth-brand-copy">
            <h1>
              Stay Connected,
              <br />
              <span>Stay Organised</span>
            </h1>

            <p>
              Manage your contacts, build meaningful relationships
              and never miss an important follow-up.
            </p>
          </div>

          <div className="auth-illustration">
            <div className="illustration-phone">
              <div className="phone-top"></div>
              <div className="phone-heading">My Connections</div>
              {["Alex Morgan", "Sarah Wilson", "David Lee"].map((person, i) => (
                <div className="illustration-person" key={person}>
                  <span className={`person-avatar person-${i}`}>
                    {person.charAt(0)}
                  </span>
                  <span>{person}</span>
                  <span className="person-dot"></span>
                </div>
              ))}
            </div>
            <div className="floating-heart">♥</div>
            <div className="floating-star">✦</div>
            <div className="floating-mail">✉</div>
          </div>

          <p className="auth-brand-footer">
            Your relationships deserve a little organisation. 💜
          </p>
        </section>

        <section className="auth-form-section">
          <div className="auth-form-wrapper">
            <div className="auth-tabs">
              <button
                type="button"
                className={!isSignup ? "active" : ""}
                onClick={() => switchMode(false)}
              >
                Login
              </button>

              <button
                type="button"
                className={isSignup ? "active" : ""}
                onClick={() => switchMode(true)}
              >
                Sign Up
              </button>
            </div>

            <div className="auth-heading">
              <h2>{isSignup ? "Create Account" : "Welcome Back!"} 👋</h2>
              <p>
                {isSignup
                  ? "Join LinkUp and organise your connections."
                  : "Sign in to your LinkUp account."}
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              {isSignup && (
                <div className="auth-input-group">
                  <label htmlFor="auth-name">Full Name</label>
                  <div className="auth-input">
                    <span>♙</span>
                    <input
                      id="auth-name"
                      type="text"
                      placeholder="Enter your full name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      autoComplete="name"
                    />
                  </div>
                </div>
              )}

              <div className="auth-input-group">
                <label htmlFor="auth-email">Email Address</label>
                <div className="auth-input">
                  <span>✉</span>
                  <input
                    id="auth-email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="auth-input-group">
                <label htmlFor="auth-password">Password</label>
                <div className="auth-input">
                  <span>♙</span>
                  <input
                    id="auth-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete={isSignup ? "new-password" : "current-password"}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              {isSignup && (
                <div className="auth-input-group">
                  <label htmlFor="auth-confirm">Confirm Password</label>
                  <div className="auth-input">
                    <span>♙</span>
                    <input
                      id="auth-confirm"
                      type={showPassword ? "text" : "password"}
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      autoComplete="new-password"
                    />
                  </div>
                </div>
              )}

              {!isSignup && (
                <div className="auth-options">
                  <label>
                    <input type="checkbox" />
                    <span>Remember me</span>
                  </label>
                  <button
                    type="button"
                    className="forgot-password"
                    onClick={() => {
                      setMessage("Password reset is not configured yet.");
                      setMessageType("error");
                    }}
                  >
                    Forgot Password?
                  </button>
                </div>
              )}

              {message && (
                <div className={`auth-message ${messageType}`}>
                  {message}
                </div>
              )}

              <button
                type="submit"
                className="auth-submit"
                disabled={loading}
              >
                {loading
                  ? "Please wait..."
                  : isSignup
                    ? "Create Account  →"
                    : "Login  →"}
              </button>
            </form>

            <div className="auth-divider">
              <span></span>
              <p>or</p>
              <span></span>
            </div>

            <div className="auth-socials">
              <button type="button" disabled title="Google login is not configured yet">
                <span className="google-icon">G</span>
                Continue with Google
              </button>
              <button type="button" disabled title="GitHub login is not configured yet">
                <span className="github-icon">●</span>
                Continue with GitHub
              </button>
            </div>

            <p className="auth-switch">
              {isSignup ? "Already have an account?" : "Don't have an account?"}
              <button
                type="button"
                onClick={() => switchMode(!isSignup)}
              >
                {isSignup ? "Login" : "Sign Up"}
              </button>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Auth;
