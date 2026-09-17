import React, { useState, useEffect, useCallback } from "react";

import MainLayout from "../../components/layout/MainLayout";
import { useAuth } from "../../context/AuthContext";
import type { IndustryProfile } from "../../types/industry";
import type { Opportunity, MasterSkill } from "../../types/opportunity";
import { OpportunityFormModal } from "../../components/industry/OpportunityFormModal";
import { OpportunityDetailModal } from "../../components/industry/OpportunityDetailModal";
import { IndustryApplicantsModal } from "../../components/industry/IndustryApplicantsModal";

import {
  Building2,
  Plus,
  Search,
  Eye,
  Edit3,
  Trash2,
  Send,
  Lock,
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  MapPin,
  Calendar,
  IndianRupee,
  Sparkles,
  GraduationCap,
  Briefcase,
  Users,
  X,
  ChevronDown,
} from "lucide-react";

import { API_BASE_URL } from "../../config/api";

const IndustryOpportunities: React.FC = () => {
  const { token } = useAuth();
  const [profile, setProfile] = useState<IndustryProfile | null>(null);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [masterSkills, setMasterSkills] = useState<MasterSkill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [opportunityToEdit, setOpportunityToEdit] =
    useState<Opportunity | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] =
    useState<Opportunity | null>(null);

  const [isApplicantsModalOpen, setIsApplicantsModalOpen] = useState(false);
  const [applicantOppId, setApplicantOppId] = useState<number | null>(null);
  const [applicantOppTitle, setApplicantOppTitle] = useState<string>("");

  const [isAddSkillModalOpen, setIsAddSkillModalOpen] = useState(false);
  const [newSkillName, setNewSkillName] = useState("");
  const [newSkillCategory, setNewSkillCategory] = useState("Technical");
  const [addingSkill, setAddingSkill] = useState(false);
  const [skillMsg, setSkillMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const fetchProfile = useCallback(async () => {
    try {
      const authToken = token || localStorage.getItem("skillbridge_token");
      if (!authToken) return;

      const res = await fetch(`${API_BASE_URL}/industry/profile`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setProfile(data.data || data.profile);
      }
    } catch (err) {
      console.error("Failed to fetch industry profile:", err);
    }
  }, [token]);

  const fetchSkills = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/skills`);
      const data = await res.json();

      if (Array.isArray(data)) {
        setMasterSkills(data);
      }
    } catch (err) {
      console.error("Failed to fetch master skills:", err);
    }
  }, []);

  const fetchOpportunities = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const authToken = token || localStorage.getItem("skillbridge_token");

      if (!authToken) {
        throw new Error("Authentication token not found.");
      }

      const res = await fetch(`${API_BASE_URL}/industry/opportunities`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to load opportunities.");
      }

      setOpportunities(
        Array.isArray(data.opportunities) ? data.opportunities : [],
      );
    } catch (err: any) {
      console.error("fetchOpportunities error:", err);
      setError(err.message || "Could not fetch opportunities.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchProfile();
    fetchSkills();
    fetchOpportunities();
  }, [fetchProfile, fetchSkills, fetchOpportunities]);

  const showSuccessMessage = (msg: string) => {
    setActionSuccess(msg);
    setTimeout(() => setActionSuccess(null), 3500);
  };

  const handleAddCustomSkill = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newSkillName.trim()) return;

    setAddingSkill(true);
    setSkillMsg(null);

    try {
      const authToken = token || localStorage.getItem("skillbridge_token");

      const res = await fetch(`${API_BASE_URL}/skills`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newSkillName.trim(),
          category: newSkillCategory,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSkillMsg({
          type: "success",
          text: `Skill "${data.skill.name}" successfully created!`,
        });

        setNewSkillName("");
        fetchSkills();

        setTimeout(() => {
          setSkillMsg(null);
          setIsAddSkillModalOpen(false);
        }, 1200);
      } else {
        setSkillMsg({
          type: "error",
          text: data.error || data.message || "Failed to add skill.",
        });
      }
    } catch (err: any) {
      setSkillMsg({
        type: "error",
        text: err.message || "Network error adding skill.",
      });
    } finally {
      setAddingSkill(false);
    }
  };

  const handlePublish = async (oppId: number) => {
    try {
      const authToken = token || localStorage.getItem("skillbridge_token");

      const res = await fetch(
        `${API_BASE_URL}/industry/opportunities/${oppId}/publish`,
        {
          method: "PUT",
          headers: { Authorization: `Bearer ${authToken}` },
        },
      );

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to publish opportunity.");
      }

      showSuccessMessage("Opportunity published successfully!");
      fetchOpportunities();
    } catch (err: any) {
      setError(err.message || "Error publishing opportunity.");
    }
  };

  const handleCloseOpp = async (oppId: number) => {
    try {
      const authToken = token || localStorage.getItem("skillbridge_token");

      const res = await fetch(
        `${API_BASE_URL}/industry/opportunities/${oppId}/close`,
        {
          method: "PUT",
          headers: { Authorization: `Bearer ${authToken}` },
        },
      );

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to close opportunity.");
      }

      showSuccessMessage("Opportunity status updated to Closed.");
      fetchOpportunities();
    } catch (err: any) {
      setError(err.message || "Error closing opportunity.");
    }
  };

  const handleDelete = async (oppId: number) => {
    if (!window.confirm("Are you sure you want to delete this opportunity?")) {
      return;
    }

    try {
      const authToken = token || localStorage.getItem("skillbridge_token");

      const res = await fetch(
        `${API_BASE_URL}/industry/opportunities/${oppId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${authToken}` },
        },
      );

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to delete opportunity.");
      }

      showSuccessMessage("Opportunity deleted successfully.");
      fetchOpportunities();
    } catch (err: any) {
      setError(err.message || "Error deleting opportunity.");
    }
  };

  const statusVal = profile?.verificationStatus || profile?.verification_status;

  const isVerified = statusVal === "approved";

  const filteredOpportunities = opportunities.filter((opp) => {
    const matchesStatus =
      statusFilter === "all" ||
      opp.status.toLowerCase() === statusFilter.toLowerCase();

    const matchesType =
      typeFilter === "all" ||
      opp.type.toLowerCase() === typeFilter.toLowerCase();

    const matchesSearch =
      !searchTerm.trim() ||
      opp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (opp.location &&
        opp.location.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesStatus && matchesType && matchesSearch;
  });

  return (
    <MainLayout showRightPanel={false}>
      <div className="w-full max-w-7xl mx-auto px-4 py-6 space-y-6">
        {actionSuccess && (
          <div className="fixed top-5 right-5 z-50 flex items-center gap-3 bg-[var(--accent-emerald-bg)] border border-[var(--accent-emerald)]/30 text-[var(--accent-emerald)] px-4 py-3 rounded-xl shadow-[var(--shadow-xl)] backdrop-blur-xl animate-fade-in">
            <CheckCircle2
              size={20}
              className="text-[var(--accent-emerald)] shrink-0"
            />
            <span className="text-sm font-medium">{actionSuccess}</span>
          </div>
        )}

        <div className="bg-[var(--bg-card)] backdrop-blur-xl border border-[var(--border-color)] rounded-2xl p-6 shadow-[var(--shadow-xl)]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-[var(--primary-subtle)] border border-[var(--primary-border)] rounded-2xl text-[var(--primary)] shrink-0">
                <Building2 size={28} />
              </div>

              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--primary)]">
                  Industry Portal
                </span>

                <h1 className="text-2xl font-bold text-[var(--text-primary)] mt-0.5">
                  Opportunities & Skills
                </h1>

                <p className="text-sm text-[var(--text-secondary)] mt-1">
                  Create, publish, and benchmark technical skills for
                  internships and job roles.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 border ${
                  isVerified
                    ? "bg-[var(--bg-muted)] hover:bg-[var(--bg-card-hover)] text-[var(--primary)] hover:text-[var(--primary-hover)] border-[var(--primary-border)] cursor-pointer"
                    : "bg-[var(--bg-muted)] text-[var(--text-disabled)] border-[var(--border-subtle)] cursor-not-allowed"
                }`}
                disabled={!isVerified}
                onClick={() => setIsAddSkillModalOpen(true)}
                title={
                  !isVerified
                    ? "Verification required"
                    : "Add custom master skill to platform"
                }
              >
                <Sparkles size={16} className="text-[var(--primary)]" />
                <span>Add Custom Skill</span>
              </button>

              <button
                className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 shadow-[var(--shadow-md)] ${
                  isVerified
                    ? "bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--text-on-primary)] active:scale-95 cursor-pointer"
                    : "bg-[var(--bg-muted)] text-[var(--text-disabled)] border border-[var(--border-subtle)] cursor-not-allowed"
                }`}
                disabled={!isVerified}
                onClick={() => {
                  setOpportunityToEdit(null);
                  setIsFormModalOpen(true);
                }}
                title={
                  !isVerified
                    ? "Verification required to create opportunities"
                    : ""
                }
              >
                <Plus size={18} />
                <span>Create Opportunity</span>
              </button>
            </div>
          </div>

          {!isVerified && (
            <div className="mt-5 p-4 bg-[var(--accent-amber-bg)] border border-[var(--accent-amber)]/30 rounded-xl flex items-start gap-3 text-[var(--accent-amber)] text-sm backdrop-blur-md">
              <Lock
                size={18}
                className="text-[var(--accent-amber)] shrink-0 mt-0.5"
              />

              <div>
                <strong className="font-semibold text-[var(--accent-amber)]">
                  Verification Required:{" "}
                </strong>
                Your company profile is currently pending administrator
                verification. Once verified, you will be able to post, edit, and
                publish opportunities for candidates.
              </div>
            </div>
          )}
        </div>

        <div className="bg-[var(--bg-card)] backdrop-blur-xl border border-[var(--border-color)] rounded-2xl p-4 shadow-[var(--shadow-xl)] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
            />

            <input
              type="text"
              className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--focus-ring)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] text-sm rounded-xl pl-10 pr-4 py-2.5 transition-all outline-none"
              placeholder="Search by role title, location, or technology..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1 p-1 bg-[var(--bg-muted)] border border-[var(--border-color)] rounded-xl">
              {[
                {
                  label: `All (${opportunities.length})`,
                  key: "all",
                },
                {
                  label: `Drafts (${
                    opportunities.filter((o) => o.status === "draft").length
                  })`,
                  key: "draft",
                },
                {
                  label: `Published (${
                    opportunities.filter((o) => o.status === "published").length
                  })`,
                  key: "published",
                },
                {
                  label: `Closed (${
                    opportunities.filter((o) => o.status === "closed").length
                  })`,
                  key: "closed",
                },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setStatusFilter(tab.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    statusFilter === tab.key
                      ? "bg-[var(--primary)] text-[var(--text-on-primary)] shadow-[var(--shadow-sm)]"
                      : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-[var(--bg-muted)] border border-[var(--border-color)] text-[var(--text-primary)] text-xs font-medium rounded-xl px-3.5 py-2 focus:border-[var(--primary)] outline-none cursor-pointer"
            >
              <option
                value="all"
                className="bg-[var(--bg-elevated)] text-[var(--text-primary)]"
              >
                All Role Types
              </option>
              <option
                value="internship"
                className="bg-[var(--bg-elevated)] text-[var(--text-primary)]"
              >
                Internships Only
              </option>
              <option
                value="job"
                className="bg-[var(--bg-elevated)] text-[var(--text-primary)]"
              >
                Jobs Only
              </option>
            </select>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-[var(--accent-rose-bg)] border border-[var(--accent-rose)]/30 rounded-xl flex items-center gap-3 text-[var(--accent-rose)] text-sm">
            <AlertCircle
              size={18}
              className="text-[var(--accent-rose)] shrink-0"
            />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 bg-[var(--bg-muted)] border border-[var(--border-color)] rounded-2xl space-y-4">
            <Loader2 className="animate-spin text-[var(--primary)]" size={36} />
            <p className="text-[var(--text-muted)] text-sm font-medium">
              Fetching posted opportunities from database...
            </p>
          </div>
        ) : filteredOpportunities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 bg-[var(--bg-muted)] border border-[var(--border-color)] rounded-2xl text-center px-4">
            <div className="p-4 bg-[var(--bg-card-hover)] border border-[var(--border-subtle)] rounded-2xl text-[var(--text-muted)] mb-3">
              <Building2 size={44} />
            </div>

            <h3 className="text-lg font-bold text-[var(--text-primary)]">
              No Opportunities Found
            </h3>

            <p className="text-[var(--text-secondary)] text-sm max-w-md mt-1">
              {searchTerm || statusFilter !== "all" || typeFilter !== "all"
                ? "No opportunity listings match your current filters."
                : "You haven't posted any opportunities yet. Click create opportunity above to post your first listing."}
            </p>

            {isVerified && (
              <button
                className="mt-5 flex items-center gap-2 px-4 py-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--text-on-primary)] rounded-xl text-xs font-semibold transition-all shadow-[var(--shadow-md)]"
                onClick={() => {
                  setOpportunityToEdit(null);
                  setIsFormModalOpen(true);
                }}
              >
                <Plus size={15} />
                Create First Opportunity
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredOpportunities.map((opp) => (
              <div
                key={opp.id}
                className="group bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-color)] hover:border-[var(--primary-border)] rounded-2xl p-5 shadow-[var(--shadow-lg)] hover:shadow-[var(--shadow-xl)] transition-all duration-300 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                          opp.type === "internship"
                            ? "bg-[var(--accent-cyan-bg)] border border-[var(--accent-cyan)]/30 text-[var(--accent-cyan)]"
                            : "bg-[var(--accent-purple-bg)] border border-[var(--accent-purple)]/30 text-[var(--accent-purple)]"
                        }`}
                      >
                        {opp.type === "internship" ? (
                          <span className="inline-flex items-center gap-1">
                            <GraduationCap size={13} />
                            Internship
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1">
                            <Briefcase size={13} />
                            Full-Time Job
                          </span>
                        )}
                      </span>

                      <h3 className="text-base font-bold text-[var(--text-primary)] mt-2 group-hover:text-[var(--primary)] transition-colors">
                        {opp.title}
                      </h3>
                    </div>

                    <div className="shrink-0">
                      {opp.status === "published" && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[var(--accent-emerald-bg)] border border-[var(--accent-emerald)]/30 text-[var(--accent-emerald)]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-emerald)] animate-pulse" />
                          Published
                        </span>
                      )}

                      {opp.status === "draft" && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[var(--accent-amber-bg)] border border-[var(--accent-amber)]/30 text-[var(--accent-amber)]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-amber)]" />
                          Draft
                        </span>
                      )}

                      {opp.status === "closed" && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[var(--accent-rose-bg)] border border-[var(--accent-rose)]/30 text-[var(--accent-rose)]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-rose)]" />
                          Closed
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-[var(--text-secondary)] line-clamp-3 leading-relaxed">
                    {opp.description}
                  </p>

                  <div className="pt-2 flex flex-wrap gap-y-2 gap-x-4 text-xs text-[var(--text-muted)]">
                    <span className="flex items-center gap-1.5">
                      <MapPin size={13} className="text-[var(--primary)]" />
                      {opp.work_mode}
                      {opp.location ? ` • ${opp.location}` : ""}
                    </span>

                    {opp.stipend_min !== null && (
                      <span className="flex items-center gap-1.5">
                        <IndianRupee
                          size={13}
                          className="text-[var(--accent-emerald)]"
                        />
                        ₹{opp.stipend_min.toLocaleString()}
                        {opp.stipend_max
                          ? ` - ₹${opp.stipend_max.toLocaleString()}`
                          : ""}
                        {opp.type === "internship" ? "/mo" : "/yr"}
                      </span>
                    )}

                    {opp.application_deadline && (
                      <span className="flex items-center gap-1.5">
                        <Calendar
                          size={13}
                          className="text-[var(--accent-amber)]"
                        />
                        {new Date(opp.application_deadline).toLocaleDateString(
                          "en-IN",
                        )}
                      </span>
                    )}
                  </div>

                  {opp.requiredSkills && opp.requiredSkills.length > 0 && (
                    <div className="pt-3 border-t border-[var(--border-subtle)] space-y-1.5">
                      <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1">
                        <Sparkles size={11} className="text-[var(--primary)]" />
                        Skill Benchmarks:
                      </span>

                      <div className="flex flex-wrap gap-1.5">
                        {opp.requiredSkills.map((s, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 bg-[var(--bg-muted)] border border-[var(--border-subtle)] rounded-md text-[11px] font-medium text-[var(--text-secondary)]"
                          >
                            {s.skill_name || `Skill #${s.skill_id}`} (≥
                            {s.required_proficiency}%)
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--bg-muted)] hover:bg-[var(--bg-card-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-lg text-xs font-semibold transition-all border border-[var(--border-subtle)] cursor-pointer"
                      onClick={() => {
                        setSelectedOpportunity(opp);
                        setIsDetailModalOpen(true);
                      }}
                    >
                      <Eye size={14} />
                      Details
                    </button>

                    {isVerified && (
                      <button
                        className="flex items-center gap-1 px-3 py-1.5 bg-[var(--primary-subtle)] hover:bg-[var(--primary-border)] text-[var(--primary)] border border-[var(--primary-border)] rounded-lg text-xs font-semibold transition-all cursor-pointer"
                        onClick={() => {
                          setApplicantOppId(opp.id);
                          setApplicantOppTitle(opp.title);
                          setIsApplicantsModalOpen(true);
                        }}
                      >
                        <Users size={14} />
                        Applicants
                      </button>
                    )}
                  </div>

                  {isVerified && (
                    <div className="flex items-center gap-1.5">
                      <button
                        className="p-1.5 bg-[var(--bg-muted)] hover:bg-[var(--primary-subtle)] text-[var(--text-muted)] hover:text-[var(--primary)] rounded-lg transition-all border border-[var(--border-subtle)] cursor-pointer"
                        onClick={() => {
                          setOpportunityToEdit(opp);
                          setIsFormModalOpen(true);
                        }}
                        title="Edit Opportunity"
                      >
                        <Edit3 size={14} />
                      </button>

                      {opp.status === "draft" && (
                        <button
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-[var(--accent-emerald-bg)] hover:bg-[var(--accent-emerald)]/20 text-[var(--accent-emerald)] border border-[var(--accent-emerald)]/30 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                          onClick={() => handlePublish(opp.id)}
                          title="Publish Opportunity"
                        >
                          <Send size={13} />
                          Publish
                        </button>
                      )}

                      {opp.status === "published" && (
                        <button
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-[var(--accent-amber-bg)] hover:bg-[var(--accent-amber)]/20 text-[var(--accent-amber)] border border-[var(--accent-amber)]/30 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                          onClick={() => handleCloseOpp(opp.id)}
                          title="Close Opportunity"
                        >
                          <Clock size={13} />
                          Close
                        </button>
                      )}

                      <button
                        className="p-1.5 bg-[var(--bg-muted)] hover:bg-[var(--accent-rose-bg)] text-[var(--text-muted)] hover:text-[var(--accent-rose)] rounded-lg transition-all border border-[var(--border-subtle)] cursor-pointer"
                        onClick={() => handleDelete(opp.id)}
                        title="Delete Opportunity"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <OpportunityFormModal
          isOpen={isFormModalOpen}
          onClose={() => setIsFormModalOpen(false)}
          onSuccess={() => {
            sessionStorage.removeItem("sb_top_opportunities");
            window.dispatchEvent(new Event("opportunitiesUpdated"));
            showSuccessMessage("Opportunity saved successfully.");
            fetchOpportunities();
          }}
          opportunityToEdit={opportunityToEdit}
          masterSkills={masterSkills}
          token={token}
        />

        <OpportunityDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          opportunity={selectedOpportunity}
        />

        <IndustryApplicantsModal
          isOpen={isApplicantsModalOpen}
          onClose={() => setIsApplicantsModalOpen(false)}
          opportunityId={applicantOppId}
          opportunityTitle={applicantOppTitle}
        />

        {isAddSkillModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--bg-app)]/80 backdrop-blur-md animate-fadeIn">
            <div className="bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-2xl max-w-md w-full p-6 shadow-[var(--shadow-xl)] space-y-5">
              <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles size={20} className="text-[var(--primary)]" />

                  <h3 className="text-lg font-bold text-[var(--text-primary)]">
                    Add New Master Skill
                  </h3>
                </div>

                <button
                  onClick={() => setIsAddSkillModalOpen(false)}
                  className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1 rounded-lg transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {skillMsg && (
                <div
                  className={`p-3 rounded-xl text-xs font-medium ${
                    skillMsg.type === "success"
                      ? "bg-[var(--accent-emerald-bg)] text-[var(--accent-emerald)] border border-[var(--accent-emerald)]/30"
                      : "bg-[var(--accent-rose-bg)] text-[var(--accent-rose)] border border-[var(--accent-rose)]/30"
                  }`}
                >
                  {skillMsg.text}
                </div>
              )}

              <form onSubmit={handleAddCustomSkill} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                    Skill Name{" "}
                    <span className="text-[var(--accent-amber)]">*</span>
                  </label>

                  <input
                    type="text"
                    required
                    placeholder="e.g. Next.js, FastAPI, Kubernetes, PyTorch"
                    value={newSkillName}
                    onChange={(e) => setNewSkillName(e.target.value)}
                    className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--focus-ring)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] rounded-xl px-4 py-2.5 text-sm outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                    Skill Category
                  </label>

                  <div className="relative">
                    <select
                      value={newSkillCategory}
                      onChange={(e) => setNewSkillCategory(e.target.value)}
                      className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--focus-ring)] text-[var(--text-primary)] rounded-xl pl-4 pr-10 py-2.5 text-sm font-medium outline-none appearance-none cursor-pointer transition-all hover:border-[var(--border-color-hover)]"
                    >
                      <option
                        value="Technical"
                        className="bg-[var(--bg-elevated)] text-[var(--text-primary)]"
                      >
                        Technical / Programming
                      </option>

                      <option
                        value="Frontend"
                        className="bg-[var(--bg-elevated)] text-[var(--text-primary)]"
                      >
                        Frontend Development
                      </option>

                      <option
                        value="Backend"
                        className="bg-[var(--bg-elevated)] text-[var(--text-primary)]"
                      >
                        Backend & APIs
                      </option>

                      <option
                        value="Database"
                        className="bg-[var(--bg-elevated)] text-[var(--text-primary)]"
                      >
                        Database & Data Engineering
                      </option>

                      <option
                        value="Cloud/DevOps"
                        className="bg-[var(--bg-elevated)] text-[var(--text-primary)]"
                      >
                        Cloud & DevOps
                      </option>

                      <option
                        value="AI/ML"
                        className="bg-[var(--bg-elevated)] text-[var(--text-primary)]"
                      >
                        AI & Machine Learning
                      </option>

                      <option
                        value="Soft Skills"
                        className="bg-[var(--bg-elevated)] text-[var(--text-primary)]"
                      >
                        Soft Skills & Communication
                      </option>

                      <option
                        value="Domain Knowledge"
                        className="bg-[var(--bg-elevated)] text-[var(--text-primary)]"
                      >
                        Domain & Industry Knowledge
                      </option>
                    </select>

                    <ChevronDown
                      size={16}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--primary)] pointer-events-none"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsAddSkillModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={addingSkill || !newSkillName.trim()}
                    className={`px-5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                      addingSkill || !newSkillName.trim()
                        ? "bg-[var(--bg-muted)] text-[var(--text-disabled)] cursor-not-allowed"
                        : "bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--text-on-primary)] shadow-[var(--shadow-md)] cursor-pointer"
                    }`}
                  >
                    {addingSkill ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Plus size={14} />
                    )}

                    <span>
                      {addingSkill ? "Adding..." : "Add to Master Database"}
                    </span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default IndustryOpportunities;
