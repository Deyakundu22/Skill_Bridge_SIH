import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, MailWarning } from "lucide-react";
import { API_BASE_URL } from "../config/api";
import { useTheme } from "../context/ThemeContext";
import "./Auth.css";

const VerifyEmailPage: React.FC = () => {
  const { theme } = useTheme();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [message, setMessage] = useState("Verifying your email...");

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setStatus("error");
        setMessage("The verification link is missing a token.");
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/auth/verify-email`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Verification failed.");
        }

        setStatus("success");
        setMessage(
          data.message || "Your email has been verified successfully.",
        );
      } catch (error: any) {
        setStatus("error");
        setMessage(error.message || "We could not verify this email.");
      }
    };

    verifyEmail();
  }, [token]);

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
          <div className="form-glass-container" style={{ textAlign: "center" }}>
            {status === "loading" && (
              <>
                <div className="loader" style={{ margin: "0 auto 16px" }} />
                <h2>Verifying your email</h2>
                <p>{message}</p>
              </>
            )}

            {status === "success" && (
              <>
                <CheckCircle2
                  size={44}
                  style={{ color: "#16a34a", marginBottom: 12 }}
                />
                <h2>Email verified</h2>
                <p>{message}</p>
              </>
            )}

            {status === "error" && (
              <>
                <MailWarning
                  size={44}
                  style={{ color: "#ef4444", marginBottom: 12 }}
                />
                <h2>Verification issue</h2>
                <p>{message}</p>
              </>
            )}

            <div style={{ marginTop: 20 }}>
              <Link
                to="/login"
                className="neo-submit-btn"
                style={{ display: "inline-block", textDecoration: "none" }}
              >
                Go to login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPage;
