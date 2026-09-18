import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Lock } from "lucide-react";
import { API_BASE_URL } from "../config/api";
import { useTheme } from "../context/ThemeContext";
import "./Auth.css";

const ResetPasswordPage: React.FC = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [token, setToken] = useState(searchParams.get("token") || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    if (!token.trim()) {
      setErrorMsg(
        "The reset token is missing. Please use the link sent to your email.",
      );
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters long.");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password, confirmPassword }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to reset password.");
      }

      setSuccessMsg(
        data.message || "Your password has been reset successfully.",
      );
      setPassword("");
      setConfirmPassword("");
      setTimeout(() => navigate("/login"), 1800);
    } catch (error: any) {
      setErrorMsg(error.message || "Unable to reset password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`neo-auth-wrapper ${theme}`}>
      <div className="bg-orb orb-1" />
      <div className="bg-orb orb-2" />
      <div className="bg-orb orb-3" />

      <div className="neo-auth-container" style={{ justifyContent: "center" }}>
        <div
          className="neo-form-panel"
          style={{ maxWidth: 520, width: "100%" }}
        >
          <div className="form-glass-container">
            <div className="form-header" style={{ marginBottom: 12 }}>
              <h2>Reset Password</h2>
              <p>Create a new password for your account.</p>
            </div>

            {errorMsg && <div className="neo-alert error">{errorMsg}</div>}
            {successMsg && (
              <div className="neo-alert success">
                <CheckCircle2 size={18} style={{ marginRight: 8 }} />
                {successMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="neo-form slide-in">
              <div className="neo-input-group">
                <label>Reset token</label>
                <div className="input-box">
                  <Lock size={18} className="input-icon" />
                  <input
                    type="text"
                    value={token}
                    onChange={(event) => setToken(event.target.value)}
                    placeholder="Paste the reset token from your email"
                    required
                  />
                </div>
              </div>

              <div className="neo-input-group">
                <label>New password</label>
                <div className="input-box">
                  <Lock size={18} className="input-icon" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Minimum 6 characters"
                    required
                  />
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={() => setShowPassword((current) => !current)}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <div className="neo-input-group">
                <label>Confirm password</label>
                <div className="input-box">
                  <Lock size={18} className="input-icon" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="Repeat your new password"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="neo-submit-btn"
                disabled={loading}
              >
                {loading ? <span className="loader" /> : "Set New Password"}
              </button>
            </form>

            <div style={{ marginTop: 20 }}>
              <Link
                to="/login"
                className="forgot-link"
                style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
              >
                <ArrowLeft size={16} />
                Back to login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
