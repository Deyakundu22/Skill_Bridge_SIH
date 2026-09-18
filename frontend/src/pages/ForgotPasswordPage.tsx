import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Mail } from "lucide-react";
import { API_BASE_URL } from "../config/api";
import { useTheme } from "../context/ThemeContext";
import "./Auth.css";

const ForgotPasswordPage: React.FC = () => {
  const { theme } = useTheme();
  const [email, setEmail] = useState("");
  const [captcha, setCaptcha] = useState<{
    id: string;
    question: string;
    image: string;
  } | null>(null);
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const loadCaptcha = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/captcha`);
      const data = await response.json();
      if (response.ok && data.success && data.captcha) {
        setCaptcha(data.captcha);
      }
    } catch (error) {
      console.error("Failed to load captcha challenge:", error);
    }
  };

  useEffect(() => {
    loadCaptcha();
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    if (!email.trim() || !captcha?.id) {
      setErrorMsg(
        "Please enter a valid email and complete the captcha challenge.",
      );
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          captchaId: captcha.id,
          captchaAnswer,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to send reset link.");
      }

      setSuccessMsg(
        data.message ||
          "If an account exists, a reset link has been sent to your email.",
      );
      setEmail("");
      setCaptchaAnswer("");
      await loadCaptcha();
    } catch (error: any) {
      setErrorMsg(error.message || "Unable to send the reset link.");
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
              <h2>Forgot Password</h2>
              <p>We’ll send a secure reset link to your email address.</p>
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
                <label>Email address</label>
                <div className="input-box">
                  <Mail size={18} className="input-icon" />
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="name@university.edu"
                    required
                  />
                </div>
              </div>

              <div className="captcha-panel">
                <div className="captcha-header">
                  <span>Security check</span>
                  <button
                    type="button"
                    className="link-btn"
                    onClick={loadCaptcha}
                  >
                    Refresh
                  </button>
                </div>

                {captcha ? (
                  <>
                    <img
                      src={captcha.image}
                      alt={captcha.question}
                      className="captcha-image"
                    />
                    <input
                      type="number"
                      value={captchaAnswer}
                      onChange={(event) => setCaptchaAnswer(event.target.value)}
                      placeholder="Enter the result"
                      className="captcha-answer-input"
                    />
                  </>
                ) : (
                  <div className="captcha-loading">Loading challenge...</div>
                )}
              </div>

              <button
                type="submit"
                className="neo-submit-btn"
                disabled={loading}
              >
                {loading ? <span className="loader" /> : "Send Reset Link"}
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

export default ForgotPasswordPage;
