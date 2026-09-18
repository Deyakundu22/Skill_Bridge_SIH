import React, { useCallback, useEffect, useState } from "react";
import {
  User,
  Mail,
  Phone,
  MapPin,
  GraduationCap,
  Briefcase,
  Award,
  FileText,
  Edit3,
  CheckCircle2,
  Globe,
  Code,
  ShieldCheck,
  Calendar,
  BookOpen,
  Target,
  Sparkles,
  Save,
  Check,
  Loader2,
  AlertCircle,
  Plus,
  Trash2,
  ExternalLink,
  X,
  Building,
  ShieldAlert,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { useSearchParams } from "react-router-dom";
import { SkillAssessment } from "../components/student/SkillAssessment";
import type {
  ProfileApiResponse,
  Institution,
  MasterSkill,
} from "../types/profile";

import { API_BASE_URL } from "../config/api";
import { InstitutionSelectCombobox } from "../components/common/InstitutionSelectCombobox";
import { DigitalDocumentsManager } from "../components/student/DigitalDocumentsManager";

type Tab =
  | "personal"
  | "academic"
  | "skills"
  | "preferences"
  | "projects"
  | "documents";

export const Profile: React.FC = () => {
  const { token, user } = useAuth();
  const [searchParams] = useSearchParams();

  const rawRole = (user?.role || "student").toLowerCase();
  const isAcademicUser = rawRole === "student" || rawRole === "faculty";

  const initialTab = (searchParams.get("tab") as Tab) || "personal";
  const [activeTab, setActiveTab] = useState<Tab>(
    ["personal", "academic", "skills", "preferences", "projects", "documents"].includes(initialTab)
      ? initialTab
      : "personal"
  );

  useEffect(() => {
    const tabParam = searchParams.get("tab") as Tab;
    if (
      tabParam &&
      ["personal", "academic", "skills", "preferences", "projects", "documents"].includes(tabParam)
    ) {
      if (!isAcademicUser && ["academic", "skills", "preferences"].includes(tabParam)) {
        setActiveTab("personal");
      } else {
        setActiveTab(tabParam);
      }
    }
  }, [searchParams, isAcademicUser]);

  const [isEditing, setIsEditing] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  const [data, setData] = useState<ProfileApiResponse | null>(null);
  const [formData, setFormData] = useState<any>(null);
  const [targetRolesInput, setTargetRolesInput] = useState<string>("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [institutions, setInstitutions] = useState<Institution[]>([]);

  // Skills state
  const [masterSkills, setMasterSkills] = useState<MasterSkill[]>([]);
  const [selectedSkillId, setSelectedSkillId] = useState<number | "">("");
  const [skillAddLoading, setSkillAddLoading] = useState(false);
  const [skillActionMessage, setSkillActionMessage] = useState<string | null>(null);
  const [skillActionError, setSkillActionError] = useState<string | null>(null);

  // Assessment modal state
  const [activeAssessmentSkill, setActiveAssessmentSkill] = useState<{
    skillId: number;
    skillName: string;
    skillCategory?: string;
  } | null>(null);

  // Add Project modal state
  const [showAddProjectModal, setShowAddProjectModal] = useState(false);
  const [newProjData, setNewProjData] = useState({
    title: "",
    description: "",
    tech_stack: "",
    project_url: "",
    repo_url: "",
    status: "Completed",
  });
  const [addProjLoading, setAddProjLoading] = useState(false);

  useEffect(() => {
    if (isAcademicUser) {
      fetch(`${API_BASE_URL}/student/institutions`)
        .then((res) => res.json())
        .then((resData) => setInstitutions(Array.isArray(resData) ? resData : []))
        .catch(() => setInstitutions([]));

      fetch(`${API_BASE_URL}/skills`)
        .then((res) => res.json())
        .then((resData) => setMasterSkills(Array.isArray(resData) ? resData : []))
        .catch((err) => console.error("Error fetching master skills:", err));
    }
  }, [isAcademicUser]);

  const fetchProfile = useCallback(
    async (forceRefresh = false) => {
      try {
        const cacheKey = `sb_profile_${rawRole}`;
        if (!forceRefresh) {
          const cached = sessionStorage.getItem(cacheKey);
          if (cached) {
            try {
              const parsed = JSON.parse(cached);
              const profileObj = parsed?.profile || parsed?.user || parsed;
              if (profileObj) {
                setData(parsed);
                const rolesArray = Array.isArray(profileObj.target_roles)
                  ? [...profileObj.target_roles]
                  : [];
                setFormData({ ...profileObj, target_roles: rolesArray });
                setTargetRolesInput(rolesArray.join(", "));
                setError(null);
                setLoading(false);
                return;
              }
            } catch (_e) {}
          }
        }

        const authToken = token || localStorage.getItem("skillbridge_token");
        if (!authToken) throw new Error("No authentication token found. Please sign in again.");

        const endpoint = isAcademicUser
          ? `${API_BASE_URL}/student/profile`
          : `${API_BASE_URL}/${rawRole}/profile`;

        const response = await fetch(endpoint, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(errorData?.error || `Failed to load profile. Server returned ${response.status}.`);
        }

        const result = await response.json();
        const profileObj = result.profile || result.user || result;

        sessionStorage.setItem(cacheKey, JSON.stringify(result));
        setData(result);

        const rolesArray = Array.isArray(profileObj.target_roles)
          ? [...profileObj.target_roles]
          : [];

        setFormData({
          ...profileObj,
          name: profileObj.name || profileObj.username || profileObj.company_name || user?.name || "",
          target_roles: rolesArray,
        });

        setTargetRolesInput(rolesArray.join(", "));
        setError(null);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load profile.");
      } finally {
        setLoading(false);
      }
    },
    [token, rawRole, isAcademicUser, user]
  );

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((previous: any) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    if (!formData) return;

    const authToken = token || localStorage.getItem("skillbridge_token");
    if (!authToken) {
      setError("Authentication token missing. Please sign in again.");
      return;
    }

    setSaveLoading(true);
    setError(null);
    setSaveSuccess(false);

    try {
      const endpoint = isAcademicUser
        ? `${API_BASE_URL}/student/profile`
        : `${API_BASE_URL}/${rawRole}/profile`;

      const response = await fetch(endpoint, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || `Failed to save profile. Server returned ${response.status}.`);
      }

      await fetchProfile(true);
      window.dispatchEvent(new Event("profileUpdated"));

      setIsEditing(false);
      setSaveSuccess(true);
      window.setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save profile.");
    } finally {
      setSaveLoading(false);
    }
  };

  const handleCancelEdit = () => {
    const profileObj = data?.profile || (data as any)?.user || data;
    if (!profileObj) {
      setIsEditing(false);
      return;
    }

    const rolesArray = Array.isArray(profileObj.target_roles)
      ? [...profileObj.target_roles]
      : [];

    setFormData({
      ...profileObj,
      name: profileObj.name || profileObj.username || profileObj.company_name || "",
      target_roles: rolesArray,
    });

    setTargetRolesInput(rolesArray.join(", "));
    setIsEditing(false);
  };

  const selectedMasterSkill = masterSkills.find((s) => s.id === Number(selectedSkillId));
  const autoCategory = selectedMasterSkill ? selectedMasterSkill.category : "";

  const isSkillAlreadyAdded = Boolean(
    selectedSkillId &&
      data?.skills?.some(
        (s) =>
          s.skill_id === Number(selectedSkillId) ||
          (selectedMasterSkill && s.name.toLowerCase() === selectedMasterSkill.name.toLowerCase())
      )
  );

  const handleAddSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSkillId) return;

    const authToken = token || localStorage.getItem("skillbridge_token");
    if (!authToken) return;

    setSkillAddLoading(true);
    setSkillActionError(null);
    setSkillActionMessage(null);

    try {
      const res = await fetch(`${API_BASE_URL}/student/skills`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          skill_id: Number(selectedSkillId),
          proficiency_score: 0,
        }),
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Failed to add skill.");

      setSkillActionMessage(`Skill "${selectedMasterSkill?.name}" added successfully!`);
      setSelectedSkillId("");
      await fetchProfile(true);
      window.dispatchEvent(new Event("profileUpdated"));
    } catch (err: any) {
      setSkillActionError(err.message || "Error adding skill");
    } finally {
      setSkillAddLoading(false);
    }
  };

  const handleDeleteSkill = async (skillRecordId: number, skillName: string) => {
    const authToken = token || localStorage.getItem("skillbridge_token");
    if (!authToken) return;

    setSkillActionError(null);
    setSkillActionMessage(null);

    try {
      const res = await fetch(`${API_BASE_URL}/student/skills/${skillRecordId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        const resData = await res.json();
        throw new Error(resData.error || "Failed to remove skill.");
      }

      setSkillActionMessage(`Skill "${skillName}" removed successfully.`);
      await fetchProfile(true);
      window.dispatchEvent(new Event("profileUpdated"));
    } catch (err: any) {
      setSkillActionError(err.message || "Error removing skill");
    }
  };

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjData.title) return;

    setAddProjLoading(true);

    try {
      const authToken = token || localStorage.getItem("skillbridge_token");
      const res = await fetch(`${API_BASE_URL}/student/profile/projects`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newProjData),
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Failed to add project.");

      setNewProjData({
        title: "",
        description: "",
        tech_stack: "",
        project_url: "",
        repo_url: "",
        status: "Completed",
      });
      setShowAddProjectModal(false);
      await fetchProfile(true);
      window.dispatchEvent(new Event("profileUpdated"));
    } catch (err: any) {
      alert(err.message || "Error creating project.");
    } finally {
      setAddProjLoading(false);
    }
  };

  const handleDeleteProject = async (projectId: number) => {
    const authToken = token || localStorage.getItem("skillbridge_token");
    if (!authToken) return;

    try {
      const res = await fetch(`${API_BASE_URL}/student/profile/projects/${projectId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${authToken}` },
      });

      if (!res.ok) {
        const resData = await res.json();
        throw new Error(resData.error || "Failed to delete project.");
      }

      await fetchProfile(true);
      window.dispatchEvent(new Event("profileUpdated"));
    } catch (err: any) {
      alert(err.message || "Error deleting project.");
    }
  };

  if (loading) {
    return (
      <div className="profile-loading-screen">
        <Loader2 className="spin-icon" size={36} />
        <p>Loading profile details...</p>
      </div>
    );
  }

  if (error || !formData) {
    return (
      <div className="profile-error-screen">
        <AlertCircle size={44} color="#ef4444" />
        <h2>Failed to Load Profile</h2>
        <p>{error || "No profile data found in database."}</p>
        <button onClick={() => fetchProfile()} className="retry-btn">
          Retry Loading
        </button>
      </div>
    );
  }

  const getInitials = (name?: string): string => {
    if (!name || !name.trim()) return rawRole.substring(0, 2).toUpperCase();
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const displayName = formData.name || formData.username || formData.company_name || user?.name || "User";
  const initials = getInitials(displayName);

  return (
    <div className="profile-page-wrapper">
      {saveSuccess && (
        <div className="toast-notification success">
          <Check size={18} /> Profile changes successfully updated!
        </div>
      )}

      {/* COVER CARD */}
      <div className="profile-cover-card">
        <div className="cover-bg" />
        <div className="cover-content">
          <div className="avatar-section">
            <div className="main-avatar">{initials}</div>
          </div>

          <div className="identity-section">
            <div className="name-row">
              <h1>{displayName}</h1>
              <span className="verified-badge">
                <ShieldCheck size={16} />
                Verified {rawRole.charAt(0).toUpperCase() + rawRole.slice(1)}
              </span>
            </div>

            <p className="subtitle">
              {isAcademicUser ? (
                <>
                  {[formData.degree, formData.department].filter(Boolean).join(" • ") ||
                    "Program details pending"}
                  {formData.institution ? ` at ${formData.institution}` : ""}
                </>
              ) : (
                formData.organization_type ||
                formData.industry_sector ||
                `${rawRole.toUpperCase()} Account`
              )}
            </p>

            <div className="quick-contacts">
              {formData.email && (
                <span>
                  <Mail size={14} /> {formData.email}
                </span>
              )}
              {formData.phone && (
                <span>
                  <Phone size={14} /> {formData.phone}
                </span>
              )}
              {formData.location && (
                <span>
                  <MapPin size={14} /> {formData.location}
                </span>
              )}
            </div>
          </div>

          <div className="action-buttons">
            {!isEditing ? (
              <button className="btn-primary" onClick={() => setIsEditing(true)}>
                <Edit3 size={16} /> Edit Details
              </button>
            ) : (
              <>
                <button
                  className="btn-secondary"
                  onClick={handleCancelEdit}
                  disabled={saveLoading}
                >
                  Cancel
                </button>
                <button className="btn-save" onClick={handleSave} disabled={saveLoading}>
                  {saveLoading ? <Loader2 size={16} className="spin-icon" /> : <Save size={16} />}
                  Save Changes
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* METRIC STATS */}
      <div className="profile-stats-grid">
        <div className="stat-card">
          <div className="stat-icon purple">
            <Sparkles size={20} />
          </div>
          <div>
            <div className="stat-label">Profile Status</div>
            <div className="stat-value">Active</div>
            <small className="stat-sub">Role: {rawRole.toUpperCase()}</small>
          </div>
        </div>

        {isAcademicUser ? (
          <>
            <div className="stat-card">
              <div className="stat-icon blue">
                <GraduationCap size={20} />
              </div>
              <div>
                <div className="stat-label">Academic CGPA</div>
                <div className="stat-value">
                  {formData.cgpa !== null &&
                  formData.cgpa !== undefined &&
                  String(formData.cgpa).trim() !== ""
                    ? Number(formData.cgpa).toFixed(2)
                    : "N/A"}
                </div>
                <small className="stat-sub">Out of 10</small>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon green">
                <Award size={20} />
              </div>
              <div>
                <div className="stat-label">Verified Skills</div>
                <div className="stat-value">{data?.skills?.length || 0}</div>
                <small className="stat-sub">Database records</small>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="stat-card">
              <div className="stat-icon blue">
                <Building size={20} />
              </div>
              <div>
                <div className="stat-label">Verification ID</div>
                <div className="stat-value" style={{ fontSize: "1.1rem" }}>
                  {formData.verification_id || "VERIFIED"}
                </div>
                <small className="stat-sub">Official Partner</small>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon green">
                <ShieldAlert size={20} />
              </div>
              <div>
                <div className="stat-label">Linked Profiles</div>
                <div className="stat-value">
                  {[formData.github, formData.linkedin, formData.portfolio, formData.website].filter(
                    Boolean
                  ).length}
                </div>
                <small className="stat-sub">Connected URL(s)</small>
              </div>
            </div>
          </>
        )}

        <div className="stat-card">
          <div className="stat-icon amber">
            <FileText size={20} />
          </div>
          <div>
            <div className="stat-label">Projects / Uploads</div>
            <div className="stat-value">{data?.projects?.length || 0}</div>
            <small className="stat-sub">Database records</small>
          </div>
        </div>
      </div>

      {/* NAVIGATION TABS */}
      <div className="profile-tabs">
        <button
          className={activeTab === "personal" ? "active" : ""}
          onClick={() => setActiveTab("personal")}
        >
          <User size={16} /> Personal & Contact Info
        </button>

        {isAcademicUser && (
          <>
            <button
              className={activeTab === "academic" ? "active" : ""}
              onClick={() => setActiveTab("academic")}
            >
              <GraduationCap size={16} /> Academic Details
            </button>

            <button
              className={activeTab === "skills" ? "active" : ""}
              onClick={() => setActiveTab("skills")}
            >
              <Award size={16} /> Skill Matrix
            </button>

            <button
              className={activeTab === "preferences" ? "active" : ""}
              onClick={() => setActiveTab("preferences")}
            >
              <Target size={16} /> Career Goals
            </button>
          </>
        )}

        <button
          className={activeTab === "projects" ? "active" : ""}
          onClick={() => setActiveTab("projects")}
        >
          <Code size={16} /> Projects & Credentials
        </button>

        <button
          className={activeTab === "documents" ? "active" : ""}
          onClick={() => setActiveTab("documents")}
        >
          <FileText size={16} /> Digital Documents
        </button>
      </div>

      {/* TAB CONTENT PANELS */}
      <div className="profile-tab-content">
        {activeTab === "personal" && (
          <div className="tab-pane">
            <div className="card-header">
              <h2>
                <User size={20} /> Information Overview
              </h2>
              <p>Your primary profile details and connected web handles.</p>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label>{isAcademicUser ? "Full Name" : "Account / Entity Name"}</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="name"
                    value={formData.name ?? ""}
                    onChange={handleInputChange}
                  />
                ) : (
                  <span className="field-value">{displayName}</span>
                )}
              </div>

              <div className="form-group">
                <label>Username</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="username"
                    value={formData.username ?? ""}
                    onChange={handleInputChange}
                  />
                ) : (
                  <span className="field-value">{formData.username || "Not set"}</span>
                )}
              </div>

              <div className="form-group">
                <label>Email Address</label>
                <span className="field-value readonly">
                  <Mail size={14} /> {formData.email}
                </span>
              </div>

              <div className="form-group">
                <label>Phone Number</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone ?? ""}
                    onChange={handleInputChange}
                    placeholder="+91 98765 43210"
                  />
                ) : (
                  <span className="field-value">{formData.phone || "Not provided"}</span>
                )}
              </div>

              <div className="form-group">
                <label>Location</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="location"
                    value={formData.location ?? ""}
                    onChange={handleInputChange}
                    placeholder="City, Country"
                  />
                ) : (
                  <span className="field-value">
                    <MapPin size={14} /> {formData.location || "Not specified"}
                  </span>
                )}
              </div>

              {isAcademicUser && (
                <div className="form-group">
                  <label>Date of Birth</label>
                  {isEditing ? (
                    <input
                      type="date"
                      name="dob"
                      value={formData.dob ? formData.dob.split("T")[0] : ""}
                      onChange={handleInputChange}
                    />
                  ) : (
                    <span className="field-value">
                      <Calendar size={14} />
                      {formData.dob ? formData.dob.split("T")[0] : "Not provided"}
                    </span>
                  )}
                </div>
              )}

              <div className="form-group span-2">
                <label>Bio / Description</label>
                {isEditing ? (
                  <textarea
                    name="bio"
                    value={formData.bio ?? ""}
                    onChange={handleInputChange}
                    rows={3}
                    placeholder="Share an overview..."
                  />
                ) : (
                  <p className="bio-text">{formData.bio || "No description provided."}</p>
                )}
              </div>

              {isEditing && (
                <>
                  <div className="form-group">
                    <label>GitHub Profile / Username</label>
                    <input
                      type="text"
                      name="github"
                      value={formData.github ?? ""}
                      onChange={handleInputChange}
                      placeholder="e.g. octocat or https://github.com/octocat"
                    />
                  </div>

                  <div className="form-group">
                    <label>LinkedIn URL</label>
                    <input
                      type="text"
                      name="linkedin"
                      value={formData.linkedin ?? ""}
                      onChange={handleInputChange}
                      placeholder="https://linkedin.com/in/profile"
                    />
                  </div>

                  <div className="form-group span-2">
                    <label>Official Website / Portfolio URL</label>
                    <input
                      type="text"
                      name="portfolio"
                      value={formData.portfolio || formData.website || ""}
                      onChange={(e) => {
                        handleInputChange(e);
                        setFormData((prev: any) => ({
                          ...prev,
                          website: e.target.value,
                        }));
                      }}
                      placeholder="https://yourpage.com"
                    />
                  </div>
                </>
              )}
            </div>

            {!isEditing && (
              <div style={{ marginTop: "2rem" }}>
                <div className="sub-section-title">
                  <h3 style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <Code size={18} className="text-primary" /> Connected Profiles & Portals
                  </h3>
                </div>

                <div className="connected-accounts-grid">
                  <div className="account-card">
                    <div className="account-card-header">
                      <div className="account-info">
                        <div className="account-icon-wrapper github-bg">GH</div>
                        <div className="account-details">
                          <strong>GitHub Account</strong>
                          <p>{formData.github || "Not connected"}</p>
                        </div>
                      </div>
                      {formData.github ? (
                        <span className="connected-badge">
                          <CheckCircle2 size={12} /> Connected
                        </span>
                      ) : (
                        <span className="unconnected-badge">Unlinked</span>
                      )}
                    </div>
                    <div className="account-actions">
                      {formData.github && (
                        <a
                          href={
                            formData.github.startsWith("http")
                              ? formData.github
                              : `https://github.com/${formData.github}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="project-link-btn"
                        >
                          <ExternalLink size={13} /> View GitHub
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="account-card">
                    <div className="account-card-header">
                      <div className="account-info">
                        <div className="account-icon-wrapper linkedin-bg">in</div>
                        <div className="account-details">
                          <strong>LinkedIn Profile</strong>
                          <p>{formData.linkedin || "Not connected"}</p>
                        </div>
                      </div>
                      {formData.linkedin ? (
                        <span className="connected-badge">
                          <CheckCircle2 size={12} /> Connected
                        </span>
                      ) : (
                        <span className="unconnected-badge">Unlinked</span>
                      )}
                    </div>
                    <div className="account-actions">
                      {formData.linkedin && (
                        <a
                          href={
                            formData.linkedin.startsWith("http")
                              ? formData.linkedin
                              : `https://linkedin.com/in/${formData.linkedin}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="project-link-btn"
                        >
                          <ExternalLink size={13} /> View Profile ↗
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="account-card">
                    <div className="account-card-header">
                      <div className="account-info">
                        <div className="account-icon-wrapper portfolio-bg">
                          <Globe size={20} />
                        </div>
                        <div className="account-details">
                          <strong>Website / Portfolio</strong>
                          <p>{formData.portfolio || formData.website || "Not connected"}</p>
                        </div>
                      </div>
                      {formData.portfolio || formData.website ? (
                        <span className="connected-badge">
                          <CheckCircle2 size={12} /> Connected
                        </span>
                      ) : (
                        <span className="unconnected-badge">Unlinked</span>
                      )}
                    </div>
                    <div className="account-actions">
                      {(formData.portfolio || formData.website) && (
                        <a
                          href={
                            (formData.portfolio || formData.website).startsWith("http")
                              ? formData.portfolio || formData.website
                              : `https://${formData.portfolio || formData.website}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="project-link-btn"
                        >
                          <ExternalLink size={13} /> Visit Site ↗
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {isAcademicUser && activeTab === "academic" && (
          <div className="tab-pane">
            <div className="card-header">
              <h2>
                <GraduationCap size={20} /> Academic Credentials
              </h2>
              <p>Your institutional information.</p>
            </div>

            <div className="form-grid">
              <div className="form-group span-2">
                <label>Institution Name</label>
                {isEditing ? (
                  <InstitutionSelectCombobox
                    institutions={institutions}
                    selectedId={formData.institution_id}
                    onSelect={(inst) => {
                      setFormData((prev: any) =>
                        prev
                          ? {
                              ...prev,
                              institution_id: inst ? inst.id : undefined,
                              institution: inst ? inst.name : prev.institution,
                            }
                          : null
                      );
                    }}
                    placeholder="Search registered university or college..."
                  />
                ) : (
                  <span className="field-value bold">
                    <BookOpen size={16} />
                    {formData.institution || "Not specified"}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label>Degree Program</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="degree"
                    value={formData.degree ?? ""}
                    onChange={handleInputChange}
                  />
                ) : (
                  <span className="field-value">{formData.degree || "Not specified"}</span>
                )}
              </div>

              <div className="form-group">
                <label>Department / Branch</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="department"
                    value={formData.department ?? ""}
                    onChange={handleInputChange}
                  />
                ) : (
                  <span className="field-value">{formData.department || "Not specified"}</span>
                )}
              </div>

              <div className="form-group">
                <label>Cumulative CGPA</label>
                {isEditing ? (
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    name="cgpa"
                    value={formData.cgpa ?? ""}
                    onChange={handleInputChange}
                  />
                ) : (
                  <span className="field-value highlight">
                    {formData.cgpa !== null &&
                    formData.cgpa !== undefined &&
                    String(formData.cgpa).trim() !== ""
                      ? `${Number(formData.cgpa).toFixed(2)} / 10`
                      : "Not specified"}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {isAcademicUser && activeTab === "skills" && (
          <div className="tab-pane">
            <div className="card-header">
              <h2>
                <Sparkles size={20} /> Skill Matrix & Mastery
              </h2>
            </div>

            <div className="add-skill-card">
              <h3>
                <Plus size={18} /> Add New Skill
              </h3>
              <form onSubmit={handleAddSkill} className="skill-form-grid">
                <div className="skill-field-group">
                  <label>Skill Name</label>
                  <select
                    className="skill-select-input"
                    value={selectedSkillId}
                    onChange={(e) => {
                      setSelectedSkillId(e.target.value === "" ? "" : Number(e.target.value));
                      setSkillActionError(null);
                      setSkillActionMessage(null);
                    }}
                  >
                    <option value="">Select skill from database...</option>
                    {masterSkills.map((sk) => (
                      <option key={sk.id} value={sk.id}>
                        {sk.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="skill-field-group">
                  <label>Category</label>
                  <div className={`skill-category-display ${!autoCategory ? "empty" : ""}`}>
                    {autoCategory || "Auto-filled"}
                  </div>
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={!selectedSkillId || isSkillAlreadyAdded || skillAddLoading}
                    className="btn-primary"
                    style={{ width: "100%", justifyContent: "center" }}
                  >
                    {skillAddLoading ? <Loader2 size={16} className="spin-icon" /> : <Plus size={16} />}
                    {isSkillAlreadyAdded ? "Skill Already Added" : "Add Skill"}
                  </button>
                </div>
              </form>

              {skillActionError && (
                <div style={{ color: "#ef4444", marginTop: "0.5rem" }}>
                  <AlertCircle size={15} /> {skillActionError}
                </div>
              )}
              {skillActionMessage && (
                <div style={{ color: "#10b981", marginTop: "0.5rem" }}>
                  <CheckCircle2 size={15} /> {skillActionMessage}
                </div>
              )}
            </div>

            <div className="skills-dna-grid" style={{ marginTop: "1rem" }}>
              {data?.skills?.map((skill) => (
                <div key={skill.id} className="skill-meter-card">
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <strong>{skill.name}</strong>
                    <button
                      onClick={() => handleDeleteSkill(skill.id, skill.name)}
                      style={{ background: "none", border: "none", color: "#ef4444" }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                  <div className="skill-progress-bar" style={{ marginTop: "0.5rem" }}>
                    <span style={{ width: `${skill.proficiency_score}%` }} />
                  </div>
                  <div style={{ marginTop: "0.5rem", fontSize: "0.8rem" }}>
                    Score: {skill.proficiency_score}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {isAcademicUser && activeTab === "preferences" && (
          <div className="tab-pane">
            <div className="card-header">
              <h2>
                <Target size={20} /> Career Goals & Preferences
              </h2>
            </div>
            <div className="preferences-grid">
              <div className="pref-card">
                <Briefcase size={22} className="pref-icon" />
                <div style={{ width: "100%" }}>
                  <strong>Target Job Roles</strong>
                  {isEditing ? (
                    <textarea
                      value={targetRolesInput}
                      onChange={(e) => {
                        setTargetRolesInput(e.target.value);
                        const parsed = e.target.value.split(",").map((s) => s.trim()).filter(Boolean);
                        setFormData((prev: any) => ({ ...prev, target_roles: parsed }));
                      }}
                    />
                  ) : (
                    <div className="tag-list">
                      {formData?.target_roles?.map((role: string, i: number) => (
                        <span key={i} className="tag">{role}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "projects" && (
          <div className="tab-pane">
            <div className="card-header" style={{ display: "flex", justifyContent: "space-between" }}>
              <h2>
                <Code size={20} /> Projects & Portfolio Records
              </h2>
              <button
                type="button"
                className="btn-primary"
                onClick={() => setShowAddProjectModal(true)}
              >
                <Plus size={14} /> Add Project
              </button>
            </div>

            <div className="projects-grid">
              {data?.projects?.length === 0 ? (
                <p>No projects recorded yet.</p>
              ) : (
                data?.projects?.map((project) => (
                  <div key={project.id} className="project-card">
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <h4>{project.title}</h4>
                      <button
                        onClick={() => handleDeleteProject(project.id)}
                        style={{ color: "#ef4444", background: "none", border: "none" }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                    <p>{project.description}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === "documents" && (
          <div className="tab-pane">
            <DigitalDocumentsManager
              token={token}
              onProfileUpdated={() => {
                fetchProfile();
                window.dispatchEvent(new Event("profileUpdated"));
              }}
            />
          </div>
        )}

        {showAddProjectModal && (
          <div className="github-modal-overlay">
            <div className="github-modal-card" style={{ maxWidth: "550px" }}>
              <div className="github-modal-header">
                <h3>Add Custom Project</h3>
                <button onClick={() => setShowAddProjectModal(false)}>
                  <X size={16} />
                </button>
              </div>
              <form onSubmit={handleAddProject}>
                <div className="github-modal-body">
                  <div className="form-group">
                    <label>Project Title *</label>
                    <input
                      type="text"
                      required
                      value={newProjData.title}
                      onChange={(e) =>
                        setNewProjData({ ...newProjData, title: e.target.value })
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label>Description</label>
                    <textarea
                      rows={3}
                      value={newProjData.description}
                      onChange={(e) =>
                        setNewProjData({ ...newProjData, description: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="github-modal-footer">
                  <button type="submit" className="btn-primary" disabled={addProjLoading}>
                    Save Project
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {activeAssessmentSkill && (
          <SkillAssessment
            skillId={activeAssessmentSkill.skillId}
            skillName={activeAssessmentSkill.skillName}
            skillCategory={activeAssessmentSkill.skillCategory}
            onClose={() => setActiveAssessmentSkill(null)}
            onComplete={() => {
              fetchProfile();
              window.dispatchEvent(new Event("profileUpdated"));
            }}
          />
        )}
      </div>
    </div>
  );
};

export default Profile;