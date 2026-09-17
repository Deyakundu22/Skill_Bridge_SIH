import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Lock,
  Mail,
  User as UserIcon,
  Eye,
  EyeOff,
  ArrowRight,
  GraduationCap,
  Building2,
  BookOpen,
  Briefcase,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { API_BASE_URL } from "../config/api";
import { InstitutionSelectCombobox } from "../components/common/InstitutionSelectCombobox";
import "./Auth.css";

const Auth: React.FC = () => {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotStage, setForgotStage] = useState<"request" | "reset">(
    "request",
  );
  const [captcha, setCaptcha] = useState<{
    id: string;
    question: string;
    image: string;
  } | null>(null);
  const [forgotEmail, setForgotEmail] = useState("");
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [resetPasswordData, setResetPasswordData] = useState({
    password: "",
    confirmPassword: "",
    token: "",
  });

  const { login } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();

  const [dbInstitutions, setDbInstitutions] = useState<
    Array<{ id: number; name: string; code: string; location: string }>
  >([]);

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
    const loadPublicInstitutions = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/institution/public`);
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          const approvedInsts = data.data.filter(
            (inst: any) =>
              !inst.verification_status ||
              inst.verification_status.toLowerCase() === "approved",
          );
          setDbInstitutions(approvedInsts);
        }
      } catch (err) {
        console.error("Failed to load institutions:", err);
      }
    };

    loadPublicInstitutions();
    loadCaptcha();
  }, []);

  const [signInData, setSignInData] = useState({
    identifier: "",
    password: "",
  });
  const [signUpData, setSignUpData] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    role: "Student",
    institution_id: "",
    companyName: "",
    industrySector: "",
    companyType: "",
  });

  const getRolePlaceholders = () => {
    switch (signUpData.role) {
      case "Faculty":
        return {
          nameLabel: "Full Name (with Title)",
          namePlaceholder: "e.g. Dr. Priya Nair",
          usernamePlaceholder: "e.g. prof_priya",
          emailLabel: "Institutional Email Address",
          emailPlaceholder: "e.g. priya.nair@iitm.ac.in",
        };
      case "Institute":
        return {
          nameLabel: "Institution Name",
          namePlaceholder: "e.g. IIT Madras",
          usernamePlaceholder: "e.g. iit_madras",
          emailLabel: "Official Institute Email",
          emailPlaceholder: "e.g. registrar@iitm.ac.in",
        };
      case "Industry":
        return {
          nameLabel: "Representative Name",
          namePlaceholder: "e.g. Rahul Sharma",
          usernamePlaceholder: "e.g. rahul_zoho",
          emailLabel: "Corporate Email Address",
          emailPlaceholder: "e.g. rahul.sharma@zoho.com",
        };
      case "Student":
      default:
        return {
          nameLabel: "Full Name",
          namePlaceholder: "e.g. Aarav Patel",
          usernamePlaceholder: "e.g. aarav_patel",
          emailLabel: "Email Address",
          emailPlaceholder: "e.g. aarav.patel@student.ac.in",
        };
    }
  };

  const placeholders = getRolePlaceholders();

  const handleSignInChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSignInData({ ...signInData, [e.target.name]: e.target.value });
    setErrorMsg("");
  };

  const handleSignUpChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setSignUpData({ ...signUpData, [e.target.name]: e.target.value });
    setErrorMsg("");
  };

  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    if (!captcha?.id || !captchaAnswer.trim()) {
      setErrorMsg("Please complete the captcha challenge to continue.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/signin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...signInData,
          captchaId: captcha.id,
          captchaAnswer,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to sign in");
      }

      setSuccessMsg("Welcome back! Entering the bridge...");
      setCaptchaAnswer("");
      await loadCaptcha();
      login(data.token, data.user);

      const targetPath =
        data.user?.role?.toLowerCase() === "admin"
          ? "/admin/dashboard"
          : data.user?.role?.toLowerCase() === "industry"
            ? "/industry/profile"
            : "/dashboard";

      setTimeout(() => navigate(targetPath), 600);
    } catch (err: any) {
      setErrorMsg(err.message || "Invalid credentials. Please try again.");
      setCaptchaAnswer("");
      await loadCaptcha();
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordRequest = async () => {
    if (!forgotEmail.trim() || !captcha?.id) {
      setErrorMsg(
        "Please enter a valid email and complete the captcha challenge.",
      );
      return;
    }

    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: forgotEmail,
          captchaId: captcha.id,
          captchaAnswer: captchaAnswer,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to process password reset request",
        );
      }

      setSuccessMsg(data.message || "Password reset instructions generated.");
      const nextResetToken = data.resetToken || "";
      setResetToken(nextResetToken);
      setResetPasswordData((prev) => ({
        ...prev,
        token: nextResetToken,
      }));
      setForgotStage("reset");
      setCaptchaAnswer("");
      await loadCaptcha();
    } catch (err: any) {
      setErrorMsg(err.message || "Unable to process password reset request");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPasswordSubmit = async () => {
    const tokenToUse = resetToken || resetPasswordData.token;

    if (!tokenToUse.trim()) {
      setErrorMsg(
        "Reset token is missing. Paste it from the request response or reload the form.",
      );
      return;
    }

    if (resetPasswordData.password.length < 6) {
      setErrorMsg("Password must be at least 6 characters long.");
      return;
    }

    if (resetPasswordData.password !== resetPasswordData.confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: tokenToUse,
          password: resetPasswordData.password,
          confirmPassword: resetPasswordData.confirmPassword,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to reset password");
      }

      setSuccessMsg(data.message || "Password reset successful.");
      setForgotOpen(false);
      setForgotStage("request");
      setForgotEmail("");
      setCaptchaAnswer("");
      setResetToken("");
      setResetPasswordData({
        password: "",
        confirmPassword: "",
        token: "",
      });
      setMode("signin");
      setShowPassword(false);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    if (!captcha?.id || !captchaAnswer.trim()) {
      setErrorMsg("Please complete the captcha challenge to register.");
      setLoading(false);
      return;
    }

    if (["Student", "Faculty", "Institute"].includes(signUpData.role)) {
      if (!signUpData.institution_id) {
        setErrorMsg(
          "Please select a registered University / Institution from our database.",
        );
        setLoading(false);
        return;
      }
    }

    try {
      const payload = {
        ...signUpData,
        captchaId: captcha.id,
        captchaAnswer,
        institution_id: signUpData.institution_id
          ? Number(signUpData.institution_id)
          : undefined,
        companyName:
          signUpData.role === "Industry"
            ? signUpData.companyName || signUpData.name
            : undefined,
        industrySector:
          signUpData.role === "Industry"
            ? signUpData.industrySector
            : undefined,
        companyType:
          signUpData.role === "Industry" ? signUpData.companyType : undefined,
      };

      const response = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to create account");
      }

      setSuccessMsg(
        signUpData.role === "Industry"
          ? "Industry node established! Redirecting..."
          : "Account synthesized! Redirecting...",
      );
      setCaptchaAnswer("");
      await loadCaptcha();
      login(data.token, data.user);

      const targetPath =
        data.user?.role?.toLowerCase() === "industry"
          ? "/industry/profile"
          : "/dashboard";

      setTimeout(() => navigate(targetPath), 600);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to create account");
      setCaptchaAnswer("");
      await loadCaptcha();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`neo-auth-wrapper ${theme}`}>
      {/* Animated Background Orbs */}
      <div className="bg-orb orb-1"></div>
      <div className="bg-orb orb-2"></div>
      <div className="bg-orb orb-3"></div>

      <div className="neo-auth-container">
        {/* Left Side: Branding / Visuals */}
        <div className="neo-brand-panel">
          <div className="brand-header flex items-center gap-4">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r">
                SkillBridge
              </h2>
              <p className="brand-subtitle">Bridge Skills. Build Careers.</p>
            </div>
          </div>

          <div className="glass-hero-card">
            <h1 className="hero-heading">
              Decode Your <span className="text-gradient">Career</span>
            </h1>
            <p className="hero-text">
              Enter an ecosystem where top tech companies, verified skills, and
              elite opportunities converge.
            </p>

            <ul className="hero-feature-list">
              <li>
                <div className="feature-icon-box">
                  <CheckCircle2 size={16} />
                </div>
                <span>Automated Skill Verification</span>
              </li>
              <li>
                <div className="feature-icon-box">
                  <CheckCircle2 size={16} />
                </div>
                <span>Real-Time Internship Matching</span>
              </li>
              <li>
                <div className="feature-icon-box">
                  <CheckCircle2 size={16} />
                </div>
                <span>Stand-out Academic Portfolios</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Right Side: Interactive Form */}
        <div className="neo-form-panel">
          <div className="form-glass-container">
            {/* Segmented Toggle Control */}
            <div className="segmented-control">
              <div
                className={`segment-indicator ${mode === "signup" ? "right" : "left"}`}
              ></div>
              <button
                className={`segment-btn ${mode === "signin" ? "active" : ""}`}
                onClick={() => {
                  setMode("signin");
                  setErrorMsg("");
                }}
                type="button"
              >
                Sign In
              </button>
              <button
                className={`segment-btn ${mode === "signup" ? "active" : ""}`}
                onClick={() => {
                  setMode("signup");
                  setErrorMsg("");
                }}
                type="button"
              >
                Register
              </button>
            </div>

            {/* Alerts */}
            {errorMsg && <div className="neo-alert error">{errorMsg}</div>}
            {successMsg && (
              <div className="neo-alert success">{successMsg}</div>
            )}

            {/* FORM RENDER */}
            {mode === "signin" ? (
              <form onSubmit={handleSignInSubmit} className="neo-form slide-in">
                <div className="form-header">
                  <h2>Welcome Back</h2>
                  <p>Resume your journey on SkillBridge.</p>
                </div>

                <div className="neo-input-group">
                  <label>Email or Username</label>
                  <div className="input-box">
                    <Mail size={18} className="input-icon" />
                    <input
                      type="text"
                      name="identifier"
                      value={signInData.identifier}
                      onChange={handleSignInChange}
                      placeholder="e.g. aarav.patel@student.ac.in"
                      required
                    />
                  </div>
                </div>

                <div className="neo-input-group">
                  <div className="label-row">
                    <label>Password</label>
                    <a
                      href="#forgot"
                      onClick={(e) => {
                        e.preventDefault();
                        setForgotOpen(true);
                        setForgotStage("request");
                        setErrorMsg("");
                        setSuccessMsg("");
                        loadCaptcha();
                      }}
                      className="forgot-link"
                    >
                      Forgot?
                    </a>
                  </div>
                  <div className="input-box">
                    <Lock size={18} className="input-icon" />
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={signInData.password}
                      onChange={handleSignInChange}
                      placeholder="Enter your password"
                      required
                    />
                    <button
                      type="button"
                      className="icon-btn"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
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
                        onChange={(e) => setCaptchaAnswer(e.target.value)}
                        placeholder="Enter the result"
                        className="captcha-answer-input"
                      />
                    </>
                  ) : (
                    <div className="captcha-loading">Loading challenge...</div>
                  )}
                </div>

                {forgotOpen && (
                  <div className="forgot-panel">
                    {forgotStage === "request" ? (
                      <>
                        <div className="mini-header">
                          <h3>Reset your password</h3>
                          <button
                            type="button"
                            className="close-link"
                            onClick={() => setForgotOpen(false)}
                          >
                            Close
                          </button>
                        </div>

                        <div className="neo-input-group compact">
                          <label>Email address</label>
                          <div className="input-box">
                            <Mail size={18} className="input-icon" />
                            <input
                              type="email"
                              value={forgotEmail}
                              onChange={(e) => setForgotEmail(e.target.value)}
                              placeholder="name@university.edu"
                              required
                            />
                          </div>
                        </div>

                        {captcha && (
                          <div className="captcha-box">
                            <label>Security check</label>
                            <div className="captcha-inline image-inline">
                              <img
                                src={captcha.image}
                                alt={captcha.question}
                                className="captcha-image small"
                              />
                              <button
                                type="button"
                                className="link-btn"
                                onClick={loadCaptcha}
                              >
                                Refresh
                              </button>
                            </div>
                            <input
                              type="number"
                              value={captchaAnswer}
                              onChange={(e) => setCaptchaAnswer(e.target.value)}
                              placeholder="Enter the answer"
                            />
                          </div>
                        )}

                        <button
                          type="button"
                          className="neo-submit-btn secondary-submit"
                          onClick={handleForgotPasswordRequest}
                          disabled={loading}
                        >
                          {loading ? (
                            <span className="loader"></span>
                          ) : (
                            "Send Reset Token"
                          )}
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="mini-header">
                          <h3>Set a new password</h3>
                          <button
                            type="button"
                            className="close-link"
                            onClick={() => setForgotOpen(false)}
                          >
                            Close
                          </button>
                        </div>

                        <div className="neo-input-group compact">
                          <label>Reset token</label>
                          <div className="input-box">
                            <Lock size={18} className="input-icon" />
                            <input
                              type="text"
                              value={resetToken || resetPasswordData.token}
                              onChange={(e) => {
                                setResetToken(e.target.value);
                                setResetPasswordData((prev) => ({
                                  ...prev,
                                  token: e.target.value,
                                }));
                              }}
                              placeholder="Paste reset token"
                            />
                          </div>
                        </div>

                        <div className="neo-input-group compact">
                          <label>New password</label>
                          <div className="input-box">
                            <Lock size={18} className="input-icon" />
                            <input
                              type={showPassword ? "text" : "password"}
                              value={resetPasswordData.password}
                              onChange={(e) =>
                                setResetPasswordData((prev) => ({
                                  ...prev,
                                  password: e.target.value,
                                }))
                              }
                              placeholder="Minimum 6 characters"
                            />
                          </div>
                        </div>

                        <div className="neo-input-group compact">
                          <label>Confirm password</label>
                          <div className="input-box">
                            <Lock size={18} className="input-icon" />
                            <input
                              type={showPassword ? "text" : "password"}
                              value={resetPasswordData.confirmPassword}
                              onChange={(e) =>
                                setResetPasswordData((prev) => ({
                                  ...prev,
                                  confirmPassword: e.target.value,
                                }))
                              }
                              placeholder="Repeat your new password"
                            />
                          </div>
                        </div>

                        <button
                          type="button"
                          className="neo-submit-btn secondary-submit"
                          onClick={handleResetPasswordSubmit}
                          disabled={loading}
                        >
                          {loading ? (
                            <span className="loader"></span>
                          ) : (
                            "Reset Password"
                          )}
                        </button>
                      </>
                    )}
                  </div>
                )}

                <button
                  type="submit"
                  className="neo-submit-btn"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="loader"></span>
                  ) : (
                    <>
                      <span>Access Portal</span> <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleSignUpSubmit} className="neo-form slide-in">
                <div className="form-header">
                  <h2>Register Yourself</h2>
                  <p>Select your persona to begin.</p>
                </div>

                <div className="neo-role-grid">
                  {[
                    { id: "Student", icon: GraduationCap },
                    { id: "Faculty", icon: BookOpen },
                    { id: "Institute", icon: Building2 },
                    { id: "Industry", icon: Briefcase },
                  ].map((role) => (
                    <div
                      key={role.id}
                      className={`neo-role-card ${signUpData.role === role.id ? "active" : ""}`}
                      onClick={() =>
                        setSignUpData({ ...signUpData, role: role.id })
                      }
                    >
                      <role.icon size={20} className="role-icon" />
                      <span>{role.id}</span>
                    </div>
                  ))}
                </div>

                <div className="input-row">
                  <div className="neo-input-group">
                    <label>{placeholders.nameLabel}</label>
                    <div className="input-box">
                      <UserIcon size={18} className="input-icon" />
                      <input
                        type="text"
                        name="name"
                        value={signUpData.name}
                        onChange={handleSignUpChange}
                        placeholder={placeholders.namePlaceholder}
                        required
                      />
                    </div>
                  </div>
                  <div className="neo-input-group">
                    <label>Username</label>
                    <div className="input-box">
                      <UserIcon size={18} className="input-icon" />
                      <input
                        type="text"
                        name="username"
                        value={signUpData.username}
                        onChange={handleSignUpChange}
                        placeholder={placeholders.usernamePlaceholder}
                        required
                      />
                    </div>
                  </div>
                </div>

                {signUpData.role === "Industry" && (
                  <div className="input-row">
                    <div className="neo-input-group">
                      <label>Company Name</label>
                      <div className="input-box">
                        <Building2 size={18} className="input-icon" />
                        <input
                          type="text"
                          name="companyName"
                          value={signUpData.companyName}
                          onChange={handleSignUpChange}
                          placeholder="e.g. Zoho Corporation"
                          required
                        />
                      </div>
                    </div>
                    <div className="neo-input-group">
                      <label>Industry Sector</label>
                      <div className="input-box">
                        <Briefcase size={18} className="input-icon" />
                        <input
                          type="text"
                          name="industrySector"
                          value={signUpData.industrySector}
                          onChange={handleSignUpChange}
                          placeholder="e.g. SaaS & Cloud"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {["Student", "Faculty"].includes(signUpData.role) && (
                  <div className="neo-input-group">
                    <label>
                      University / Institution{" "}
                      <span className="text-amber-500 font-bold">*</span>
                    </label>
                    <InstitutionSelectCombobox
                      institutions={dbInstitutions}
                      selectedId={signUpData.institution_id}
                      onSelect={(inst) => {
                        setSignUpData((prev) => ({
                          ...prev,
                          institution_id: inst ? String(inst.id) : "",
                        }));
                      }}
                      placeholder="Search registered university or college..."
                      required
                    />
                    <span className="text-[11px] text-slate-400 opacity-80 mt-1 block">
                      * Registration is strictly permitted only for institutions
                      approved in our database.
                    </span>
                  </div>
                )}

                <div className="neo-input-group">
                  <label>{placeholders.emailLabel}</label>
                  <div className="input-box">
                    <Mail size={18} className="input-icon" />
                    <input
                      type="email"
                      name="email"
                      value={signUpData.email}
                      onChange={handleSignUpChange}
                      placeholder={placeholders.emailPlaceholder}
                      required
                    />
                  </div>
                </div>

                <div className="neo-input-group">
                  <label>Password</label>
                  <div className="input-box">
                    <Lock size={18} className="input-icon" />
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={signUpData.password}
                      onChange={handleSignUpChange}
                      placeholder="Minimum 6 characters"
                      required
                    />
                    <button
                      type="button"
                      className="icon-btn"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="captcha-panel">
                  <div className="captcha-header">
                    <span>Human verification</span>
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
                        onChange={(e) => setCaptchaAnswer(e.target.value)}
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
                  {loading ? (
                    <span className="loader"></span>
                  ) : (
                    <>
                      <span>Create Account</span> <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
