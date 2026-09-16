import React, { useState, useEffect, useCallback } from "react";
import MainLayout from "../../components/layout/MainLayout";
import {
  Briefcase,
  Code2,
  Award,
  Building2,
  Plus,
  Trash2,
  ExternalLink,
  GitBranch,
  Loader2,
  AlertCircle,
  Calendar,
  MapPin,
  CheckCircle2,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import { API_BASE_URL } from "../../config/api";
import { useAuth } from "../../context/AuthContext";

interface WorkExperience {
  id: number;
  title: string;
  companyName: string;
  location: string;
  employmentType: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  description: string;
  skillsUsed: string[];
}

interface Project {
  id: number;
  title: string;
  description: string;
  techStack: string[];
  status: string;
  projectUrl: string;
  repoUrl: string;
}

interface Certification {
  id: number;
  title: string;
  issuer: string;
  issueYear: string;
  credentialUrl: string;
  verificationStatus: string;
}

interface OpportunityExperience {
  applicationId: number;
  opportunityId: number;
  title: string;
  companyName: string;
  type: string;
  location: string;
  status: string;
  appliedAt: string;
}

interface ExperiencesData {
  workExperiences: WorkExperience[];
  projects: Project[];
  certifications: Certification[];
  opportunityExperiences: OpportunityExperience[];
}

const ExperiencesPage: React.FC = () => {
  const { token: authContextToken } = useAuth();

  const getAuthToken = useCallback(() => {
    return authContextToken || localStorage.getItem("skillbridge_token") || "";
  }, [authContextToken]);

  const [data, setData] = useState<ExperiencesData>({
    workExperiences: [],
    projects: [],
    certifications: [],
    opportunityExperiences: [],
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "all" | "work" | "projects" | "certs" | "opportunities"
  >("all");

  const [showWorkModal, setShowWorkModal] = useState<boolean>(false);
  const [showProjectModal, setShowProjectModal] = useState<boolean>(false);
  const [showCertModal, setShowCertModal] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  const [workForm, setWorkForm] = useState({
    title: "",
    companyName: "",
    location: "",
    employmentType: "Internship",
    startDate: "",
    endDate: "",
    isCurrent: false,
    description: "",
    skillsInput: "",
  });

  const [projectForm, setProjectForm] = useState({
    title: "",
    description: "",
    techStackInput: "",
    projectUrl: "",
    repoUrl: "",
  });

  const [certForm, setCertForm] = useState({
    title: "",
    issuer: "",
    issueYear: new Date().getFullYear().toString(),
    credentialUrl: "",
  });

  const fetchExperiences = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const token = getAuthToken();

      const res = await fetch(`${API_BASE_URL}/student/experiences`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      });

      const result = await res.json();

      if (res.ok && result.success) {
        setData(result.data);
      } else {
        throw new Error(
          result.message || "Failed to load experiences from database."
        );
      }
    } catch (err: any) {
      console.error("fetchExperiences error:", err);
      setError(
        err.message || "Server error while fetching student experiences."
      );
    } finally {
      setLoading(false);
    }
  }, [getAuthToken]);

  useEffect(() => {
    fetchExperiences();
  }, [fetchExperiences]);

  const handleAddWork = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!workForm.title || !workForm.companyName) return;

    setActionLoading(true);

    try {
      const token = getAuthToken();

      const skillsUsed = workForm.skillsInput
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await fetch(`${API_BASE_URL}/student/experiences/work`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({
          ...workForm,
          skillsUsed,
        }),
      });

      const result = await res.json();

      if (res.ok && result.success) {
        setShowWorkModal(false);

        setWorkForm({
          title: "",
          companyName: "",
          location: "",
          employmentType: "Internship",
          startDate: "",
          endDate: "",
          isCurrent: false,
          description: "",
          skillsInput: "",
        });

        fetchExperiences();
      } else {
        alert(result.message || "Failed to add work experience.");
      }
    } catch (err: any) {
      alert("Error adding experience: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!projectForm.title) return;

    setActionLoading(true);

    try {
      const token = getAuthToken();

      const techStack = projectForm.techStackInput
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await fetch(
        `${API_BASE_URL}/student/experiences/projects`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: token ? `Bearer ${token}` : "",
          },
          body: JSON.stringify({
            ...projectForm,
            techStack,
          }),
        }
      );

      const result = await res.json();

      if (res.ok && result.success) {
        setShowProjectModal(false);

        setProjectForm({
          title: "",
          description: "",
          techStackInput: "",
          projectUrl: "",
          repoUrl: "",
        });

        fetchExperiences();
      } else {
        alert(result.message || "Failed to add project.");
      }
    } catch (err: any) {
      alert("Error adding project: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddCert = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!certForm.title || !certForm.issuer) return;

    setActionLoading(true);

    try {
      const token = getAuthToken();

      const res = await fetch(
        `${API_BASE_URL}/student/experiences/certifications`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: token ? `Bearer ${token}` : "",
          },
          body: JSON.stringify(certForm),
        }
      );

      const result = await res.json();

      if (res.ok && result.success) {
        setShowCertModal(false);

        setCertForm({
          title: "",
          issuer: "",
          issueYear: new Date().getFullYear().toString(),
          credentialUrl: "",
        });

        fetchExperiences();
      } else {
        alert(result.message || "Failed to add certification.");
      }
    } catch (err: any) {
      alert("Error adding certification: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteWork = async (id: number) => {
    if (
      !window.confirm(
        "Are you sure you want to remove this work experience?"
      )
    )
      return;

    try {
      const token = getAuthToken();

      const res = await fetch(
        `${API_BASE_URL}/student/experiences/work/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
          },
        }
      );

      if (res.ok) fetchExperiences();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteProject = async (id: number) => {
    if (!window.confirm("Are you sure you want to remove this project?"))
      return;

    try {
      const token = getAuthToken();

      const res = await fetch(
        `${API_BASE_URL}/student/experiences/projects/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
          },
        }
      );

      if (res.ok) fetchExperiences();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteCert = async (id: number) => {
    if (
      !window.confirm(
        "Are you sure you want to remove this certification?"
      )
    )
      return;

    try {
      const token = getAuthToken();

      const res = await fetch(
        `${API_BASE_URL}/student/experiences/certifications/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
          },
        }
      );

      if (res.ok) fetchExperiences();
    } catch (err) {
      console.error(err);
    }
  };

  const totalCount =
    data.workExperiences.length +
    data.projects.length +
    data.certifications.length +
    data.opportunityExperiences.length;

  const tabs = [
    {
      value: "all" as const,
      label: "All",
      count: totalCount,
      icon: null,
    },
    {
      value: "work" as const,
      label: "Work & Internships",
      count: data.workExperiences.length,
      icon: Briefcase,
    },
    {
      value: "projects" as const,
      label: "Projects",
      count: data.projects.length,
      icon: Code2,
    },
    {
      value: "certs" as const,
      label: "Certifications",
      count: data.certifications.length,
      icon: Award,
    },
    {
      value: "opportunities" as const,
      label: "Applied Opportunities",
      count: data.opportunityExperiences.length,
      icon: Building2,
    },
  ];

  const inputClass =
    "w-full bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl p-3 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--focus-ring)] transition-all";

  return (
    <MainLayout showRightPanel={true}>
      <div className="space-y-6">
        <div className="relative overflow-hidden bg-[var(--bg-card)] border border-[var(--border-color)] p-6 md:p-8 rounded-3xl shadow-[var(--shadow-xl)]">
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-[var(--primary-subtle)] rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-[var(--primary-subtle)] border border-[var(--primary-border)] rounded-full text-xs font-semibold text-[var(--primary)] mb-3">
                <Sparkles size={14} />
                <span>Verified Career Portfolio</span>
              </div>

              <h1 className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
                Student Experiences & Track Record
              </h1>

              <p className="text-sm text-[var(--text-secondary)] mt-2 max-w-xl leading-relaxed">
                Real-time record of your internships, industrial training,
                technical projects, verified certifications, and matched
                industry opportunities.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={fetchExperiences}
                disabled={loading}
                className="p-3 bg-[var(--bg-muted)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-xl hover:bg-[var(--bg-card-hover)] transition-all cursor-pointer"
                title="Refresh Experiences Data"
              >
                <RefreshCw
                  size={16}
                  className={
                    loading ? "animate-spin text-[var(--primary)]" : ""
                  }
                />
              </button>

              <button
                onClick={() => setShowWorkModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--text-on-primary)] font-bold text-xs rounded-xl shadow-[var(--shadow-md)] transition-all cursor-pointer"
              >
                <Plus size={16} />
                <span>Add Experience</span>
              </button>

              <button
                onClick={() => setShowProjectModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-[var(--accent-amber)] hover:opacity-90 text-[var(--text-on-primary)] font-bold text-xs rounded-xl shadow-[var(--shadow-md)] transition-all cursor-pointer"
              >
                <Plus size={16} />
                <span>Add Project</span>
              </button>

              <button
                onClick={() => setShowCertModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-[var(--accent-emerald)] hover:opacity-90 text-[var(--text-on-primary)] font-bold text-xs rounded-xl shadow-[var(--shadow-md)] transition-all cursor-pointer"
              >
                <Plus size={16} />
                <span>Add Cert</span>
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-4 shadow-[var(--shadow-md)]">
            <span className="text-xs text-[var(--text-secondary)] font-semibold block mb-1">
              Total Experiences
            </span>
            <span className="text-2xl font-black text-[var(--text-primary)]">
              {totalCount}
            </span>
            <span className="text-[11px] text-[var(--text-muted)] mt-1 block">
              Live DB entries
            </span>
          </div>

          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-4 shadow-[var(--shadow-md)]">
            <span className="text-xs text-[var(--text-secondary)] font-semibold block mb-1">
              Work & Internships
            </span>
            <span className="text-2xl font-black text-[var(--accent-cyan)]">
              {data.workExperiences.length}
            </span>
            <span className="text-[11px] text-[var(--text-muted)] mt-1 block">
              Roles & industry training
            </span>
          </div>

          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-4 shadow-[var(--shadow-md)]">
            <span className="text-xs text-[var(--text-secondary)] font-semibold block mb-1">
              Projects Built
            </span>
            <span className="text-2xl font-black text-[var(--accent-amber)]">
              {data.projects.length}
            </span>
            <span className="text-[11px] text-[var(--text-muted)] mt-1 block">
              Software & technical projects
            </span>
          </div>

          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-4 shadow-[var(--shadow-md)]">
            <span className="text-xs text-[var(--text-secondary)] font-semibold block mb-1">
              Certifications
            </span>
            <span className="text-2xl font-black text-[var(--accent-emerald)]">
              {data.certifications.length}
            </span>
            <span className="text-[11px] text-[var(--text-muted)] mt-1 block">
              Credentials & badges
            </span>
          </div>
        </div>

        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-3 flex items-center justify-between gap-3 overflow-x-auto">
          <div className="flex items-center gap-2 shrink-0">
            {tabs.map((tab) => {
              const Icon = tab.icon;

              return (
                <button
                  key={tab.value}
                  onClick={() => setActiveTab(tab.value)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === tab.value
                      ? "bg-[var(--primary)] text-[var(--text-on-primary)] shadow-[var(--shadow-md)]"
                      : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]"
                  }`}
                >
                  {Icon && <Icon size={14} />}
                  <span>
                    {tab.label} ({tab.count})
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowProjectModal(true)}
              className="px-3 py-1.5 bg-[var(--bg-muted)] hover:bg-[var(--bg-card-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-semibold text-xs rounded-lg border border-[var(--border-color)] transition-all cursor-pointer"
            >
              + Add Project
            </button>

            <button
              onClick={() => setShowCertModal(true)}
              className="px-3 py-1.5 bg-[var(--bg-muted)] hover:bg-[var(--bg-card-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-semibold text-xs rounded-lg border border-[var(--border-color)] transition-all cursor-pointer"
            >
              + Add Cert
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-[var(--accent-rose-bg)] border border-[var(--accent-rose)]/30 rounded-2xl text-[var(--accent-rose)] text-sm flex items-center gap-2">
            <AlertCircle size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-[var(--bg-muted)] border border-[var(--border-color)] rounded-3xl space-y-3">
            <Loader2
              className="animate-spin text-[var(--primary)]"
              size={36}
            />
            <p className="text-[var(--text-muted)] text-sm font-medium">
              Loading real-time experience records from database...
            </p>
          </div>
        ) : totalCount === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-[var(--bg-muted)] border border-[var(--border-color)] rounded-3xl text-center px-4">
            <Briefcase
              size={48}
              className="text-[var(--text-muted)] mb-3 opacity-60"
            />

            <h3 className="text-lg font-bold text-[var(--text-primary)]">
              No experiences logged in database
            </h3>

            <p className="text-[var(--text-secondary)] text-xs max-w-md mt-1 mb-4">
              Start building your real-time verified career portfolio by
              adding your internships, software projects, or certifications.
            </p>

            <button
              onClick={() => setShowWorkModal(true)}
              className="px-5 py-2.5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--text-on-primary)] font-bold text-xs rounded-xl shadow-[var(--shadow-md)] cursor-pointer"
            >
              Add Your First Experience
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {(activeTab === "all" || activeTab === "work") && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
                    <Briefcase
                      className="text-[var(--primary)]"
                      size={18}
                    />
                    Work & Internship Experiences
                  </h3>

                  <span className="text-xs text-[var(--text-muted)] font-medium">
                    {data.workExperiences.length} Records
                  </span>
                </div>

                {data.workExperiences.length === 0 ? (
                  <div className="p-6 bg-[var(--bg-muted)] border border-[var(--border-color)] rounded-2xl text-center text-xs text-[var(--text-muted)]">
                    No work/internship experiences added yet. Click "+ Add
                    Experience" above to log your experience.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {data.workExperiences.map((w) => (
                      <div
                        key={w.id}
                        className="bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-[var(--primary-border)] hover:bg-[var(--bg-card-hover)] p-5 rounded-2xl space-y-3 transition-all relative group shadow-[var(--shadow-md)]"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <span className="inline-block px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-[var(--primary-subtle)] text-[var(--primary)] border border-[var(--primary-border)] rounded-md mb-1.5">
                              {w.employmentType}
                            </span>

                            <h4 className="text-base font-bold text-[var(--text-primary)]">
                              {w.title}
                            </h4>

                            <p className="text-xs font-semibold text-[var(--text-secondary)] flex items-center gap-1.5 mt-0.5">
                              <Building2
                                size={13}
                                className="text-[var(--text-muted)]"
                              />
                              <span>{w.companyName}</span>
                            </p>
                          </div>

                          <button
                            onClick={() => handleDeleteWork(w.id)}
                            className="p-1.5 text-[var(--text-muted)] hover:text-[var(--accent-rose)] hover:bg-[var(--accent-rose-bg)] rounded-lg transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                            title="Delete Experience"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--text-muted)] font-medium">
                          {w.location && (
                            <span className="flex items-center gap-1">
                              <MapPin size={13} />
                              {w.location}
                            </span>
                          )}

                          <span className="flex items-center gap-1">
                            <Calendar size={13} />
                            {w.startDate || "Date n/a"} -{" "}
                            {w.isCurrent
                              ? "Present"
                              : w.endDate || "Present"}
                          </span>
                        </div>

                        {w.description && (
                          <p className="text-xs text-[var(--text-secondary)] leading-relaxed bg-[var(--bg-muted)] p-3 rounded-xl border border-[var(--border-subtle)]">
                            {w.description}
                          </p>
                        )}

                        {Array.isArray(w.skillsUsed) &&
                          w.skillsUsed.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {w.skillsUsed.map((sk, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-0.5 text-[10px] font-semibold bg-[var(--bg-muted)] text-[var(--text-secondary)] border border-[var(--border-subtle)] rounded-md"
                                >
                                  {sk}
                                </span>
                              ))}
                            </div>
                          )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {(activeTab === "all" || activeTab === "projects") && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
                    <Code2
                      className="text-[var(--accent-amber)]"
                      size={18}
                    />
                    Technical Projects Portfolio
                  </h3>

                  <span className="text-xs text-[var(--text-muted)] font-medium">
                    {data.projects.length} Projects
                  </span>
                </div>

                {data.projects.length === 0 ? (
                  <div className="p-6 bg-[var(--bg-muted)] border border-[var(--border-color)] rounded-2xl text-center text-xs text-[var(--text-muted)]">
                    No software projects added yet. Click "+ Add Project" to
                    add projects to your portfolio.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {data.projects.map((p) => (
                      <div
                        key={p.id}
                        className="bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-[var(--accent-amber)]/40 hover:bg-[var(--bg-card-hover)] p-5 rounded-2xl space-y-3 transition-all relative group shadow-[var(--shadow-md)]"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <span className="inline-block px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-[var(--accent-amber-bg)] text-[var(--accent-amber)] border border-[var(--accent-amber)]/20 rounded-md mb-1.5">
                              {p.status || "Completed"}
                            </span>

                            <h4 className="text-base font-bold text-[var(--text-primary)]">
                              {p.title}
                            </h4>
                          </div>

                          <button
                            onClick={() => handleDeleteProject(p.id)}
                            className="p-1.5 text-[var(--text-muted)] hover:text-[var(--accent-rose)] hover:bg-[var(--accent-rose-bg)] rounded-lg transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                            title="Delete Project"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>

                        {p.description && (
                          <p className="text-xs text-[var(--text-secondary)] leading-relaxed bg-[var(--bg-muted)] p-3 rounded-xl border border-[var(--border-subtle)]">
                            {p.description}
                          </p>
                        )}

                        {Array.isArray(p.techStack) &&
                          p.techStack.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {p.techStack.map((tech, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-0.5 text-[10px] font-semibold bg-[var(--accent-amber-bg)] text-[var(--accent-amber)] border border-[var(--accent-amber)]/20 rounded-md"
                                >
                                  {tech}
                                </span>
                              ))}
                            </div>
                          )}

                        <div className="flex items-center gap-3 pt-2 text-xs font-semibold">
                          {p.projectUrl && (
                            <a
                              href={p.projectUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[var(--primary)] hover:text-[var(--primary-hover)]"
                            >
                              <ExternalLink size={13} />
                              Demo Link
                            </a>
                          )}

                          {p.repoUrl && (
                            <a
                              href={p.repoUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                            >
                              <GitBranch size={13} />
                              Source Code
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {(activeTab === "all" || activeTab === "certs") && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
                    <Award
                      className="text-[var(--accent-emerald)]"
                      size={18}
                    />
                    Verified Certifications & Licenses
                  </h3>

                  <span className="text-xs text-[var(--text-muted)] font-medium">
                    {data.certifications.length} Certifications
                  </span>
                </div>

                {data.certifications.length === 0 ? (
                  <div className="p-6 bg-[var(--bg-muted)] border border-[var(--border-color)] rounded-2xl text-center text-xs text-[var(--text-muted)]">
                    No certifications added yet. Click "+ Add Cert" to list
                    your verified credentials.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {data.certifications.map((c) => (
                      <div
                        key={c.id}
                        className="bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-[var(--accent-emerald)]/40 hover:bg-[var(--bg-card-hover)] p-5 rounded-2xl space-y-3 transition-all relative group shadow-[var(--shadow-md)] flex items-start justify-between gap-4"
                      >
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-[var(--accent-emerald-bg)] text-[var(--accent-emerald)] border border-[var(--accent-emerald)]/20 rounded-md">
                              <CheckCircle2 size={12} />
                              {c.verificationStatus}
                            </span>

                            {c.issueYear && (
                              <span className="text-[11px] text-[var(--text-muted)] font-medium">
                                Issued {c.issueYear}
                              </span>
                            )}
                          </div>

                          <h4 className="text-base font-bold text-[var(--text-primary)] truncate">
                            {c.title}
                          </h4>

                          <p className="text-xs font-semibold text-[var(--text-secondary)]">
                            {c.issuer}
                          </p>

                          {c.credentialUrl && (
                            <a
                              href={c.credentialUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-[var(--primary)] hover:text-[var(--primary-hover)] font-semibold pt-1"
                            >
                              <ExternalLink size={13} />
                              View Credential
                            </a>
                          )}
                        </div>

                        <button
                          onClick={() => handleDeleteCert(c.id)}
                          className="p-1.5 text-[var(--text-muted)] hover:text-[var(--accent-rose)] hover:bg-[var(--accent-rose-bg)] rounded-lg transition-colors opacity-0 group-hover:opacity-100 cursor-pointer shrink-0"
                          title="Delete Certification"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {(activeTab === "all" || activeTab === "opportunities") && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
                    <Building2
                      className="text-[var(--accent-cyan)]"
                      size={18}
                    />
                    Applied & Matched Opportunities
                  </h3>

                  <span className="text-xs text-[var(--text-muted)] font-medium">
                    {data.opportunityExperiences.length} Applications
                  </span>
                </div>

                {data.opportunityExperiences.length === 0 ? (
                  <div className="p-6 bg-[var(--bg-muted)] border border-[var(--border-color)] rounded-2xl text-center text-xs text-[var(--text-muted)]">
                    No active opportunity applications logged yet. Explore
                    Opportunities in the sidebar to apply.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {data.opportunityExperiences.map((opp) => (
                      <div
                        key={opp.applicationId}
                        className="bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-[var(--accent-cyan)]/40 hover:bg-[var(--bg-card-hover)] p-5 rounded-2xl space-y-2 shadow-[var(--shadow-md)] transition-all"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <span className="inline-block px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-[var(--accent-cyan-bg)] text-[var(--accent-cyan)] border border-[var(--accent-cyan)]/20 rounded-md mb-1">
                              {opp.type}
                            </span>

                            <h4 className="text-base font-bold text-[var(--text-primary)]">
                              {opp.title}
                            </h4>

                            <p className="text-xs font-semibold text-[var(--text-secondary)]">
                              {opp.companyName}
                            </p>
                          </div>

                          <span className="px-2.5 py-1 text-xs font-extrabold uppercase rounded-lg bg-[var(--bg-muted)] text-[var(--primary)] border border-[var(--border-color)]">
                            {opp.status}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-xs text-[var(--text-muted)] pt-2 border-t border-[var(--border-subtle)]">
                          <span>Location: {opp.location}</span>
                          <span>
                            Applied:{" "}
                            {new Date(opp.appliedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {showWorkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--bg-app)]/80 backdrop-blur-sm">
          <div className="bg-[var(--bg-elevated)] border border-[var(--border-color)] w-full max-w-lg rounded-3xl p-6 space-y-5 shadow-[var(--shadow-xl)] animate-in fade-in zoom-in-95">
            <h3 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
              <Briefcase
                size={20}
                className="text-[var(--primary)]"
              />
              Add Work or Internship Experience
            </h3>

            <form onSubmit={handleAddWork} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                  Role / Position Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Software Engineer Intern"
                  value={workForm.title}
                  onChange={(e) =>
                    setWorkForm({
                      ...workForm,
                      title: e.target.value,
                    })
                  }
                  className={inputClass}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                    Company / Organization *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. TechCorp Solutions"
                    value={workForm.companyName}
                    onChange={(e) =>
                      setWorkForm({
                        ...workForm,
                        companyName: e.target.value,
                      })
                    }
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                    Employment Type
                  </label>
                  <select
                    value={workForm.employmentType}
                    onChange={(e) =>
                      setWorkForm({
                        ...workForm,
                        employmentType: e.target.value,
                      })
                    }
                    className={inputClass}
                  >
                    <option value="Internship">Internship</option>
                    <option value="Industrial Training">
                      Industrial Training
                    </option>
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Research Assistant">
                      Research Assistant
                    </option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                    Start Date
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Jan 2024"
                    value={workForm.startDate}
                    onChange={(e) =>
                      setWorkForm({
                        ...workForm,
                        startDate: e.target.value,
                      })
                    }
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                    End Date
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Jun 2024"
                    disabled={workForm.isCurrent}
                    value={workForm.isCurrent ? "Present" : workForm.endDate}
                    onChange={(e) =>
                      setWorkForm({
                        ...workForm,
                        endDate: e.target.value,
                      })
                    }
                    className={`${inputClass} disabled:opacity-50`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                  Description / Key Outcomes
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe your responsibilities, achievements, and impact..."
                  value={workForm.description}
                  onChange={(e) =>
                    setWorkForm({
                      ...workForm,
                      description: e.target.value,
                    })
                  }
                  className={`${inputClass} resize-none`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                  Skills Used (comma separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. React, Node.js, Docker, MySQL"
                  value={workForm.skillsInput}
                  onChange={(e) =>
                    setWorkForm({
                      ...workForm,
                      skillsInput: e.target.value,
                    })
                  }
                  className={inputClass}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowWorkModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--text-on-primary)] font-bold text-xs rounded-xl shadow-[var(--shadow-md)] cursor-pointer disabled:opacity-60"
                >
                  {actionLoading ? "Saving..." : "Save Experience"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showProjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--bg-app)]/80 backdrop-blur-sm">
          <div className="bg-[var(--bg-elevated)] border border-[var(--border-color)] w-full max-w-lg rounded-3xl p-6 space-y-5 shadow-[var(--shadow-xl)] animate-in fade-in zoom-in-95">
            <h3 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
              <Code2
                size={20}
                className="text-[var(--accent-amber)]"
              />
              Add Technical Project
            </h3>

            <form onSubmit={handleAddProject} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                  Project Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SkillBridge AI Career Matcher"
                  value={projectForm.title}
                  onChange={(e) =>
                    setProjectForm({
                      ...projectForm,
                      title: e.target.value,
                    })
                  }
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Briefly describe what this project does and key features..."
                  value={projectForm.description}
                  onChange={(e) =>
                    setProjectForm({
                      ...projectForm,
                      description: e.target.value,
                    })
                  }
                  className={`${inputClass} resize-none`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                  Tech Stack (comma separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. React, TypeScript, Node.js, Express, MySQL"
                  value={projectForm.techStackInput}
                  onChange={(e) =>
                    setProjectForm({
                      ...projectForm,
                      techStackInput: e.target.value,
                    })
                  }
                  className={inputClass}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                    Live Demo URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={projectForm.projectUrl}
                    onChange={(e) =>
                      setProjectForm({
                        ...projectForm,
                        projectUrl: e.target.value,
                      })
                    }
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                    GitHub Repo URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://github.com/..."
                    value={projectForm.repoUrl}
                    onChange={(e) =>
                      setProjectForm({
                        ...projectForm,
                        repoUrl: e.target.value,
                      })
                    }
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowProjectModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-[var(--accent-amber)] hover:opacity-90 text-[var(--text-on-primary)] font-bold text-xs rounded-xl shadow-[var(--shadow-md)] cursor-pointer disabled:opacity-60"
                >
                  {actionLoading ? "Saving..." : "Save Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCertModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--bg-app)]/80 backdrop-blur-sm">
          <div className="bg-[var(--bg-elevated)] border border-[var(--border-color)] w-full max-w-lg rounded-3xl p-6 space-y-5 shadow-[var(--shadow-xl)] animate-in fade-in zoom-in-95">
            <h3 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
              <Award
                size={20}
                className="text-[var(--accent-emerald)]"
              />
              Add Verified Certification
            </h3>

            <form onSubmit={handleAddCert} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                  Certification Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AWS Certified Solutions Architect"
                  value={certForm.title}
                  onChange={(e) =>
                    setCertForm({
                      ...certForm,
                      title: e.target.value,
                    })
                  }
                  className={inputClass}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                    Issuing Organization *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Amazon Web Services, Coursera, NPTEL"
                    value={certForm.issuer}
                    onChange={(e) =>
                      setCertForm({
                        ...certForm,
                        issuer: e.target.value,
                      })
                    }
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                    Issue Year
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 2024"
                    value={certForm.issueYear}
                    onChange={(e) =>
                      setCertForm({
                        ...certForm,
                        issueYear: e.target.value,
                      })
                    }
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                  Credential Verification URL
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={certForm.credentialUrl}
                  onChange={(e) =>
                    setCertForm({
                      ...certForm,
                      credentialUrl: e.target.value,
                    })
                  }
                  className={inputClass}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCertModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-[var(--accent-emerald)] hover:opacity-90 text-[var(--text-on-primary)] font-bold text-xs rounded-xl shadow-[var(--shadow-md)] cursor-pointer disabled:opacity-60"
                >
                  {actionLoading ? "Saving..." : "Save Certification"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default ExperiencesPage;