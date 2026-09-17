import React, { useState, useEffect, useCallback } from "react";
import MainLayout from "../../components/layout/MainLayout";
import {
  Building2,
  Search,
  MapPin,
  Calendar,
  IndianRupee,
  Briefcase,
  GraduationCap,
  Sparkles,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Eye,
  Send,
  Target,
  Globe,
  RotateCw,
  Bookmark,
  Clock,
  Award,
  XCircle,
} from "lucide-react";
import type { Opportunity } from "../../types/opportunity";
import type { RecommendedOpportunity } from "../../types/matching";
import { OpportunityDetailModal } from "../../components/industry/OpportunityDetailModal";
import { ApplyOpportunityModal } from "../../components/student/ApplyOpportunityModal";
import { SkillAssessment } from "../../components/student/SkillAssessment";
import { useAuth } from "../../context/AuthContext";
import { API_BASE_URL } from "../../config/api";

const StudentOpportunities: React.FC = () => {
  const { token, user } = useAuth();
  const userRole = user?.role ? String(user.role).toLowerCase() : "student";
  const isAcademicianRole = [
    "academician",
    "faculty",
    "institution",
    "institute",
  ].includes(userRole);

  const [viewMode, setViewMode] = useState<"recommended" | "all">("all");
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [recommendations, setRecommendations] = useState<
    RecommendedOpportunity[]
  >([]);
  const [savedIds, setSavedIds] = useState<Set<number>>(new Set());

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");

  const [selectedOpportunity, setSelectedOpportunity] =
    useState<Opportunity | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);

  const [activeAssessmentSkill, setActiveAssessmentSkill] = useState<{
    skillId: number;
    skillName: string;
  } | null>(null);

  // Check if deadline has passed
  const isDeadlinePassed = (deadlineDateString?: string | null): boolean => {
    if (!deadlineDateString) return false;
    const deadline = new Date(deadlineDateString);
    return deadline.getTime() < Date.now();
  };

  // Helper to render current application status badge
  const renderApplicationStatusBadge = (status?: string | null) => {
    if (!status) return null;
    const normStatus = status.toLowerCase();

    switch (normStatus) {
      case "selected":
      case "accepted":
        return (
          <span className="px-2.5 py-1 bg-[var(--accent-emerald-bg)] border border-[var(--accent-emerald)]/30 text-[var(--accent-emerald)] rounded-xl text-xs font-bold flex items-center gap-1 shrink-0">
            <Award size={13} /> Selected 🎉
          </span>
        );
      case "shortlisted":
        return (
          <span className="px-2.5 py-1 bg-[var(--accent-amber-bg)] border border-[var(--accent-amber)]/30 text-[var(--accent-amber)] rounded-xl text-xs font-bold flex items-center gap-1 shrink-0">
            <Sparkles size={13} /> Shortlisted
          </span>
        );
      case "rejected":
      case "not selected":
        return (
          <span className="px-2.5 py-1 bg-[var(--accent-rose-bg)] border border-[var(--accent-rose)]/30 text-[var(--accent-rose)] rounded-xl text-xs font-bold flex items-center gap-1 shrink-0">
            <XCircle size={13} /> Not Selected
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 bg-[var(--accent-cyan-bg)] border border-[var(--accent-cyan)]/30 text-[var(--accent-cyan)] rounded-xl text-xs font-bold flex items-center gap-1 shrink-0">
            <CheckCircle2 size={13} /> Already Applied
          </span>
        );
    }
  };

  const fetchSavedIds = useCallback(async () => {
    const authToken = token || localStorage.getItem("skillbridge_token");
    if (!authToken) return;

    try {
      const res = await fetch(`${API_BASE_URL}/opportunities/saved/ids`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      const data = await res.json();

      if (res.ok && data.success && Array.isArray(data.savedIds)) {
        setSavedIds(new Set(data.savedIds));
      }
    } catch (err) {
      console.error("fetchSavedIds error:", err);
    }
  }, [token]);

  useEffect(() => {
    fetchSavedIds();
  }, [fetchSavedIds]);

  const toggleBookmark = async (oppId: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    const authToken = token || localStorage.getItem("skillbridge_token");
    if (!authToken) return;

    setSavedIds((prev) => {
      const next = new Set(prev);
      if (next.has(oppId)) next.delete(oppId);
      else next.add(oppId);
      return next;
    });

    try {
      const res = await fetch(`${API_BASE_URL}/opportunities/${oppId}/save`, {
        method: "POST",
        headers: { Authorization: `Bearer ${authToken}` },
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        fetchSavedIds();
      }
    } catch (_err) {
      fetchSavedIds();
    }
  };

  const fetchRecommendations = useCallback(async () => {
    setLoading(true);
    setError(null);

    const authToken = token || localStorage.getItem("skillbridge_token");

    try {
      const res = await fetch(
        `${API_BASE_URL}/student/opportunities/recommended?limit=20`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        },
      );

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to fetch recommendations.");
      }

      setRecommendations(
        Array.isArray(data.recommendations) ? data.recommendations : [],
      );
    } catch (err: any) {
      console.error("fetchRecommendations error:", err);
      setError(err.message || "Could not load recommended opportunities.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  const fetchAllOpportunities = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let url = `${API_BASE_URL}/opportunities`;
      const params = new URLSearchParams();

      if (isAcademicianRole) {
        params.append("audience", "ACADEMICIAN");
      } else {
        params.append("audience", "STUDENT");
      }

      if (typeFilter !== "all") params.append("type", typeFilter);
      if (searchTerm.trim()) params.append("search", searchTerm.trim());

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to load opportunities.");
      }

      setOpportunities(
        Array.isArray(data.opportunities) ? data.opportunities : [],
      );
    } catch (err: any) {
      console.error("fetchAllOpportunities error:", err);
      setError(err.message || "Could not fetch published opportunities.");
    } finally {
      setLoading(false);
    }
  }, [typeFilter, searchTerm, isAcademicianRole, token]);

  useEffect(() => {
    if (viewMode === "recommended") {
      fetchRecommendations();
    } else {
      fetchAllOpportunities();
    }
  }, [viewMode, fetchRecommendations, fetchAllOpportunities]);

  const formatStipend = (
    min: number | null,
    max: number | null,
    type: string,
  ) => {
    if (!min && !max) return "Disclosed on interview";

    const unit =
      type === "internship" || type === "faculty_internship"
        ? "/month"
        : "/annum";

    if (min && max)
      return `₹${min.toLocaleString()} - ₹${max.toLocaleString()} ${unit}`;

    if (min) return `From ₹${min.toLocaleString()} ${unit}`;
    if (max) return `Up to ₹${max.toLocaleString()} ${unit}`;

    return "Disclosed on interview";
  };

  const renderMatchBadge = (score: number | null, category: string) => {
    if (score === null || category === "Match Unavailable") {
      return (
        <span className="px-2.5 py-0.5 bg-[var(--bg-muted)] text-[var(--text-muted)] font-semibold text-[11px] rounded-full border border-[var(--border-color)]">
          Match Unavailable
        </span>
      );
    }

    if (category === "Incomplete Profile") {
      return (
        <span className="px-2.5 py-0.5 bg-[var(--accent-amber-bg)] border border-[var(--accent-amber)]/30 text-[var(--accent-amber)] font-semibold text-[11px] rounded-full">
          Incomplete Profile
        </span>
      );
    }

    if (score >= 80) {
      return (
        <span className="px-2.5 py-0.5 bg-[var(--accent-emerald-bg)] border border-[var(--accent-emerald)]/30 text-[var(--accent-emerald)] font-bold text-[11px] rounded-full">
          🎯 {score}% Match • {category}
        </span>
      );
    }

    if (score >= 65) {
      return (
        <span className="px-2.5 py-0.5 bg-[var(--accent-cyan-bg)] border border-[var(--accent-cyan)]/30 text-[var(--accent-cyan)] font-bold text-[11px] rounded-full">
          🎯 {score}% Match • {category}
        </span>
      );
    }

    if (score >= 50) {
      return (
        <span className="px-2.5 py-0.5 bg-[var(--accent-amber-bg)] border border-[var(--accent-amber)]/30 text-[var(--accent-amber)] font-bold text-[11px] rounded-full">
          🎯 {score}% Match • {category}
        </span>
      );
    }

    return (
      <span className="px-2.5 py-0.5 bg-[var(--accent-rose-bg)] border border-[var(--accent-rose)]/30 text-[var(--accent-rose)] font-bold text-[11px] rounded-full">
        🎯 {score}% Match • {category}
      </span>
    );
  };

  const filteredRecommendations = recommendations
    .filter((rec) => {
      const matchesType = typeFilter === "all" || rec.type === typeFilter;

      const matchesSearch =
        !searchTerm.trim() ||
        rec.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rec.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (rec.location &&
          rec.location.toLowerCase().includes(searchTerm.toLowerCase()));

      return matchesType && matchesSearch;
    })
    .sort((a, b) => {
      const scoreA =
        a.matchScore !== null && a.matchScore !== undefined ? a.matchScore : -1;

      const scoreB =
        b.matchScore !== null && b.matchScore !== undefined ? b.matchScore : -1;

      if (scoreB !== scoreA) {
        return scoreB - scoreA;
      }

      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  return (
    <MainLayout showRightPanel={false}>
      <div className="w-full max-w-7xl mx-auto px-4 py-6 space-y-6">
        <div className="bg-[var(--bg-card)] backdrop-blur-xl border border-[var(--border-color)] rounded-2xl p-6 shadow-[var(--shadow-lg)]">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-[var(--primary-subtle)] border border-[var(--primary-border)] rounded-2xl text-[var(--primary)] shrink-0">
                <Briefcase size={28} />
              </div>

              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--primary)]">
                  {isAcademicianRole
                    ? "Academia & Industry Ecosystem"
                    : "Skill Profile & Recommendations"}
                </span>

                <h1 className="text-2xl font-bold text-[var(--text-primary)] mt-0.5">
                  {isAcademicianRole
                    ? "Academician Industry Opportunities"
                    : "Opportunity Discovery"}
                </h1>

                <p className="text-sm text-[var(--text-secondary)] mt-1">
                  {isAcademicianRole
                    ? "Explore industry internships, industrial training, FDPs, consultancy projects, research collaborations, and guest lectures."
                    : "Explore ranked opportunity recommendations matched against your verified skills."}
                </p>
              </div>
            </div>

            {!isAcademicianRole && (
              <div className="flex items-center gap-1.5 p-1 bg-[var(--bg-muted)] border border-[var(--border-color)] rounded-xl shrink-0">
                <button
                  onClick={() => setViewMode("recommended")}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    viewMode === "recommended"
                      ? "bg-[var(--primary)] text-[var(--text-on-primary)] shadow-md"
                      : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]"
                  }`}
                >
                  <Target size={15} /> Recommended for You
                </button>

                <button
                  onClick={() => setViewMode("all")}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    viewMode === "all"
                      ? "bg-[var(--primary)] text-[var(--text-on-primary)] shadow-md"
                      : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]"
                  }`}
                >
                  <Globe size={15} /> All Opportunities
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="bg-[var(--bg-card)] backdrop-blur-xl border border-[var(--border-color)] rounded-2xl p-4 shadow-[var(--shadow-lg)] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
            />

            <input
              type="text"
              placeholder="Search by title, technology, domain, or company name..."
              className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--focus-ring)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] text-sm rounded-xl pl-10 pr-4 py-2.5 transition-all outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap items-center gap-1 p-1 bg-[var(--bg-muted)] border border-[var(--border-color)] rounded-xl">
            <button
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                typeFilter === "all"
                  ? "bg-[var(--primary)] text-[var(--text-on-primary)] shadow-md"
                  : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]"
              }`}
              onClick={() => setTypeFilter("all")}
            >
              All Types
            </button>

            {!isAcademicianRole ? (
              <>
                <button
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    typeFilter === "internship"
                      ? "bg-[var(--primary)] text-[var(--text-on-primary)] shadow-md"
                      : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]"
                  }`}
                  onClick={() => setTypeFilter("internship")}
                >
                  <GraduationCap size={14} /> Internships
                </button>

                <button
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    typeFilter === "job"
                      ? "bg-[var(--primary)] text-[var(--text-on-primary)] shadow-md"
                      : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]"
                  }`}
                  onClick={() => setTypeFilter("job")}
                >
                  <Briefcase size={14} /> Jobs
                </button>
              </>
            ) : (
              <>
                {[
                  ["faculty_internship", "Faculty Internships"],
                  ["industrial_training", "Industrial Training"],
                  ["fdp", "FDPs"],
                  ["consultancy", "Consultancy"],
                  ["research_collaboration", "Research"],
                  ["guest_lecture", "Guest Lectures"],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      typeFilter === value
                        ? "bg-[var(--primary)] text-[var(--text-on-primary)] shadow-md"
                        : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]"
                    }`}
                    onClick={() => setTypeFilter(value)}
                  >
                    {label}
                  </button>
                ))}
              </>
            )}

            <button
              onClick={() =>
                viewMode === "recommended"
                  ? fetchRecommendations()
                  : fetchAllOpportunities()
              }
              disabled={loading}
              className="p-1.5 text-[var(--text-muted)] hover:text-[var(--primary)] hover:bg-[var(--bg-card-hover)] rounded-lg transition-colors cursor-pointer ml-1"
              title="Refresh listings"
            >
              <RotateCw
                size={15}
                className={loading ? "animate-spin text-[var(--primary)]" : ""}
              />
            </button>
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

        {viewMode === "recommended" ? (
          loading ? (
            <div className="flex flex-col items-center justify-center py-16 bg-[var(--bg-muted)] border border-[var(--border-color)] rounded-2xl space-y-4">
              <Loader2
                className="animate-spin text-[var(--primary)]"
                size={36}
              />
              <p className="text-[var(--text-muted)] text-sm font-medium">
                Calculating skill matches & ranking recommendations...
              </p>
            </div>
          ) : filteredRecommendations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 bg-[var(--bg-muted)] border border-[var(--border-color)] rounded-2xl text-center px-4">
              <div className="p-4 bg-[var(--bg-card-hover)] rounded-2xl text-[var(--text-muted)] mb-3">
                <Target size={44} />
              </div>

              <h3 className="text-lg font-bold text-[var(--text-primary)]">
                No Recommendations Available
              </h3>

              <p className="text-[var(--text-secondary)] text-sm max-w-md mt-1">
                {searchTerm || typeFilter !== "all"
                  ? "No recommendations match your search filters."
                  : "Take skill assessments in your profile to unlock personalized opportunity recommendations!"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredRecommendations.map((rec) => {
                const expired = isDeadlinePassed(rec.applicationDeadline);
                const hasApplied = rec.hasApplied;
                const applicationStatus =
                  (rec as any).applicationStatus ||
                  (rec.hasApplied ? "applied" : null);

                return (
                  <div
                    key={rec.opportunityId}
                    className="relative overflow-hidden group bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-color)] hover:border-[var(--primary-border)] rounded-2xl p-5 shadow-[var(--shadow-md)] hover:shadow-[var(--shadow-lg)] transition-all duration-300 flex flex-col justify-between space-y-4"
                  >
                    {expired && (
                      <div className="absolute top-6 -right-10 bg-red-600/90 text-white font-black text-[10px] uppercase tracking-widest py-1 px-10 rotate-45 shadow-md border-y border-red-400 select-none pointer-events-none z-10">
                        Expired
                      </div>
                    )}

                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-[var(--primary-subtle)] border border-[var(--primary-border)] flex items-center justify-center text-[var(--primary)] font-bold shrink-0">
                            {rec.companyLogo ? (
                              <img
                                src={rec.companyLogo}
                                alt={rec.companyName}
                                className="w-full h-full object-cover rounded-xl"
                              />
                            ) : (
                              (rec.companyName || "C").charAt(0).toUpperCase()
                            )}
                          </div>

                          <div>
                            <span className="text-[11px] font-semibold text-[var(--primary)] uppercase tracking-wider block">
                              {rec.companyName || "Verified Partner"}
                            </span>

                            <h3 className="text-base font-bold text-[var(--text-primary)] group-hover:text-[var(--primary)] transition-colors">
                              {rec.title}
                            </h3>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              rec.type === "internship"
                                ? "bg-[var(--accent-cyan-bg)] border border-[var(--accent-cyan)]/30 text-[var(--accent-cyan)]"
                                : "bg-[var(--accent-purple-bg)] border border-[var(--accent-purple)]/30 text-[var(--accent-purple)]"
                            }`}
                          >
                            {rec.type === "internship"
                              ? "Internship"
                              : "Full-Time"}
                          </span>

                          <button
                            onClick={(e) =>
                              toggleBookmark(rec.opportunityId, e)
                            }
                            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                              savedIds.has(rec.opportunityId)
                                ? "bg-[var(--accent-amber-bg)] border-[var(--accent-amber)]/40 text-[var(--accent-amber)]"
                                : "bg-[var(--bg-muted)] border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]"
                            }`}
                            title={
                              savedIds.has(rec.opportunityId)
                                ? "Remove from saved"
                                : "Save opportunity"
                            }
                          >
                            <Bookmark
                              size={14}
                              className={
                                savedIds.has(rec.opportunityId)
                                  ? "fill-[var(--accent-amber)] text-[var(--accent-amber)]"
                                  : ""
                              }
                            />
                          </button>
                        </div>
                      </div>

                      <div className="py-1">
                        {renderMatchBadge(rec.matchScore, rec.matchCategory)}
                      </div>

                      <div className="flex flex-wrap gap-y-1.5 gap-x-3 text-xs text-[var(--text-muted)]">
                        <span className="flex items-center gap-1">
                          <MapPin size={12} className="text-[var(--primary)]" />
                          {rec.workMode}
                          {rec.location ? ` • ${rec.location}` : ""}
                        </span>

                        <span className="flex items-center gap-1">
                          <IndianRupee
                            size={12}
                            className="text-[var(--accent-emerald)]"
                          />
                          {formatStipend(
                            rec.stipendMin || null,
                            rec.stipendMax || null,
                            rec.type,
                          )}
                        </span>

                        {rec.applicationDeadline && (
                          <span
                            className={`flex items-center gap-1 ${expired ? "text-red-500 font-medium" : ""}`}
                          >
                            <Calendar
                              size={12}
                              className={
                                expired
                                  ? "text-red-500"
                                  : "text-[var(--accent-amber)]"
                              }
                            />
                            {new Date(
                              rec.applicationDeadline,
                            ).toLocaleDateString("en-IN")}
                          </span>
                        )}
                      </div>

                      {rec.description && (
                        <p className="text-xs text-[var(--text-secondary)] line-clamp-3 leading-relaxed bg-[var(--bg-muted)] p-2.5 rounded-xl border border-[var(--border-subtle)]">
                          {rec.description}
                        </p>
                      )}

                      {rec.requiredSkills && rec.requiredSkills.length > 0 && (
                        <div className="pt-2 border-t border-[var(--border-subtle)] space-y-1.5">
                          <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider block">
                            Skill Compatibility Breakdown:
                          </span>

                          <div className="flex flex-wrap gap-1.5">
                            {rec.requiredSkills.map((sk) => (
                              <button
                                key={sk.skillId}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveAssessmentSkill({
                                    skillId: sk.skillId,
                                    skillName: sk.skillName,
                                  });
                                }}
                                title={`Click to take assessment for ${sk.skillName}`}
                                className={`px-2 py-0.5 rounded-md text-[11px] font-medium flex items-center gap-1 border transition-all cursor-pointer hover:scale-105 ${
                                  sk.status === "matched"
                                    ? "bg-[var(--accent-emerald-bg)] hover:bg-[var(--accent-emerald-bg)] border-[var(--accent-emerald)]/25 text-[var(--accent-emerald)]"
                                    : sk.status === "partial"
                                      ? "bg-[var(--accent-amber-bg)] hover:bg-[var(--accent-amber-bg)] border-[var(--accent-amber)]/25 text-[var(--accent-amber)]"
                                      : "bg-[var(--accent-rose-bg)] hover:bg-[var(--accent-rose-bg)] border-[var(--accent-rose)]/25 text-[var(--accent-rose)]"
                                }`}
                              >
                                {sk.status === "matched" && "✓"}
                                {sk.status === "partial" && "◐"}
                                {sk.status === "missing" && "⚠"}
                                {sk.skillName}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between gap-2">
                      {hasApplied ? (
                        renderApplicationStatusBadge(applicationStatus)
                      ) : (
                        <span className="text-xs text-[var(--text-muted)] font-medium">
                          Deterministic Match
                        </span>
                      )}

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--bg-muted)] hover:bg-[var(--bg-card-hover)] text-[var(--text-primary)] rounded-xl text-xs font-semibold transition-all cursor-pointer border border-[var(--border-color)]"
                          onClick={() => {
                            setSelectedOpportunity({
                              id: rec.opportunityId,
                              industry_id: 0,
                              type: rec.type,
                              title: rec.title,
                              description: rec.description || "",
                              location: rec.location || null,
                              work_mode: rec.workMode,
                              stipend_min: rec.stipendMin || null,
                              stipend_max: rec.stipendMax || null,
                              duration: null,
                              eligibility: null,
                              application_deadline:
                                rec.applicationDeadline || null,
                              status: "published",
                              created_at: rec.createdAt,
                              updated_at: rec.createdAt,
                              requiredSkills: (rec as any).requiredSkills || [],
                            });
                            setIsDetailModalOpen(true);
                          }}
                        >
                          <Eye size={14} /> Details
                        </button>

                        {!hasApplied &&
                          (expired ? (
                            <button
                              disabled
                              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gray-400/20 text-gray-400 border border-gray-400/30 rounded-xl text-xs font-semibold cursor-not-allowed shadow-none"
                            >
                              <Clock size={14} /> Deadline Passed
                            </button>
                          ) : (
                            <button
                              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--text-on-primary)] rounded-xl text-xs font-semibold transition-all shadow-md cursor-pointer"
                              onClick={() => {
                                setSelectedOpportunity({
                                  id: rec.opportunityId,
                                  industry_id: 0,
                                  type: rec.type,
                                  title: rec.title,
                                  description: rec.description || "",
                                  location: rec.location || null,
                                  work_mode: rec.workMode,
                                  stipend_min: rec.stipendMin || null,
                                  stipend_max: rec.stipendMax || null,
                                  duration: null,
                                  eligibility: null,
                                  application_deadline:
                                    rec.applicationDeadline || null,
                                  status: "published",
                                  created_at: rec.createdAt,
                                  updated_at: rec.createdAt,
                                  requiredSkills:
                                    (rec as any).requiredSkills || [],
                                });
                                setIsApplyModalOpen(true);
                              }}
                            >
                              <Send size={14} /> Apply
                            </button>
                          ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : loading ? (
          <div className="flex flex-col items-center justify-center py-16 bg-[var(--bg-muted)] border border-[var(--border-color)] rounded-2xl space-y-4">
            <Loader2 className="animate-spin text-[var(--primary)]" size={36} />

            <p className="text-[var(--text-muted)] text-sm font-medium">
              Loading verified industry opportunities...
            </p>
          </div>
        ) : opportunities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 bg-[var(--bg-muted)] border border-[var(--border-color)] rounded-2xl text-center px-4">
            <div className="p-4 bg-[var(--bg-card-hover)] rounded-2xl text-[var(--text-muted)] mb-3">
              <Building2 size={44} />
            </div>

            <h3 className="text-lg font-bold text-[var(--text-primary)]">
              No Opportunities Found
            </h3>

            <p className="text-[var(--text-secondary)] text-sm max-w-md mt-1">
              There are no active published opportunities matching your search
              criteria.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {opportunities.map((opp) => {
              const expired = isDeadlinePassed(opp.application_deadline);
              const hasApplied = Boolean(
                (opp as any).has_applied || (opp as any).hasApplied,
              );
              const applicationStatus =
                (opp as any).application_status ||
                (opp as any).applicationStatus ||
                (hasApplied ? "applied" : null);

              return (
                <div
                  key={opp.id}
                  className="relative overflow-hidden group bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-color)] hover:border-[var(--primary-border)] rounded-2xl p-5 shadow-[var(--shadow-md)] hover:shadow-[var(--shadow-lg)] transition-all duration-300 flex flex-col justify-between space-y-4"
                >
                  {expired && (
                    <div className="absolute top-6 -right-10 bg-red-600/90 text-white font-black text-[10px] uppercase tracking-widest py-1 px-10 rotate-45 shadow-md border-y border-red-400 select-none pointer-events-none z-10">
                      Expired
                    </div>
                  )}

                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[var(--primary-subtle)] border border-[var(--primary-border)] flex items-center justify-center text-[var(--primary)] font-bold shrink-0">
                          {opp.company_logo ? (
                            <img
                              src={opp.company_logo}
                              alt={opp.company_name}
                              className="w-full h-full object-cover rounded-xl"
                            />
                          ) : (
                            (opp.company_name || "C").charAt(0).toUpperCase()
                          )}
                        </div>

                        <div>
                          <span className="text-[11px] font-semibold text-[var(--primary)] uppercase tracking-wider block">
                            {opp.company_name || "Verified Partner"}
                          </span>

                          <h3 className="text-base font-bold text-[var(--text-primary)] group-hover:text-[var(--primary)] transition-colors">
                            {opp.title}
                          </h3>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                            opp.type === "internship"
                              ? "bg-[var(--accent-cyan-bg)] border border-[var(--accent-cyan)]/30 text-[var(--accent-cyan)]"
                              : "bg-[var(--accent-purple-bg)] border border-[var(--accent-purple)]/30 text-[var(--accent-purple)]"
                          }`}
                        >
                          {opp.type === "internship"
                            ? "Internship"
                            : "Full-Time Job"}
                        </span>

                        <button
                          onClick={(e) => toggleBookmark(opp.id, e)}
                          className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                            savedIds.has(opp.id)
                              ? "bg-[var(--accent-amber-bg)] border-[var(--accent-amber)]/40 text-[var(--accent-amber)]"
                              : "bg-[var(--bg-muted)] border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]"
                          }`}
                          title={
                            savedIds.has(opp.id)
                              ? "Remove from saved"
                              : "Save opportunity"
                          }
                        >
                          <Bookmark
                            size={14}
                            className={
                              savedIds.has(opp.id)
                                ? "fill-[var(--accent-amber)] text-[var(--accent-amber)]"
                                : ""
                            }
                          />
                        </button>
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

                      <span className="flex items-center gap-1.5">
                        <IndianRupee
                          size={13}
                          className="text-[var(--accent-emerald)]"
                        />
                        {formatStipend(
                          opp.stipend_min,
                          opp.stipend_max,
                          opp.type,
                        )}
                      </span>

                      {opp.application_deadline && (
                        <span
                          className={`flex items-center gap-1.5 ${expired ? "text-red-500 font-medium" : ""}`}
                        >
                          <Calendar
                            size={13}
                            className={
                              expired
                                ? "text-red-500"
                                : "text-[var(--accent-amber)]"
                            }
                          />
                          {new Date(
                            opp.application_deadline,
                          ).toLocaleDateString("en-IN")}
                        </span>
                      )}
                    </div>

                    {opp.requiredSkills && opp.requiredSkills.length > 0 && (
                      <div className="pt-3 border-t border-[var(--border-subtle)] space-y-1.5">
                        <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1">
                          <Sparkles
                            size={11}
                            className="text-[var(--primary)]"
                          />
                          Skill Benchmarks:
                        </span>

                        <div className="flex flex-wrap gap-1.5">
                          {opp.requiredSkills.map((s, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 bg-[var(--bg-muted)] border border-[var(--border-subtle)] rounded-md text-[11px] font-medium text-[var(--text-secondary)] flex items-center gap-1"
                            >
                              <CheckCircle2
                                size={11}
                                className="text-[var(--accent-emerald)]"
                              />
                              {s.skill_name || `Skill #${s.skill_id}`} (≥
                              {s.required_proficiency}%)
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between gap-2">
                    {hasApplied ? (
                      renderApplicationStatusBadge(applicationStatus)
                    ) : (
                      <span className="text-xs text-[var(--text-muted)] font-medium">
                        Verified Industry Listing
                      </span>
                    )}

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--bg-muted)] hover:bg-[var(--bg-card-hover)] text-[var(--text-primary)] rounded-xl text-xs font-semibold transition-all cursor-pointer border border-[var(--border-color)]"
                        onClick={() => {
                          setSelectedOpportunity(opp);
                          setIsDetailModalOpen(true);
                        }}
                      >
                        <Eye size={14} /> Details
                      </button>

                      {!hasApplied &&
                        (expired ? (
                          <button
                            disabled
                            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gray-400/20 text-gray-400 border border-gray-400/30 rounded-xl text-xs font-semibold cursor-not-allowed shadow-none"
                          >
                            <Clock size={14} /> Deadline Passed
                          </button>
                        ) : (
                          <button
                            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--text-on-primary)] rounded-xl text-xs font-semibold transition-all shadow-md cursor-pointer"
                            onClick={() => {
                              setSelectedOpportunity(opp);
                              setIsApplyModalOpen(true);
                            }}
                          >
                            <Send size={14} /> Apply
                          </button>
                        ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <OpportunityDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          opportunity={selectedOpportunity}
          onApplicationSuccess={() => {
            if (viewMode === "recommended") {
              fetchRecommendations();
            } else {
              fetchAllOpportunities();
            }
          }}
        />

        <ApplyOpportunityModal
          isOpen={isApplyModalOpen}
          onClose={() => setIsApplyModalOpen(false)}
          opportunity={selectedOpportunity}
          onSuccess={() => {
            if (viewMode === "recommended") {
              fetchRecommendations();
            } else {
              fetchAllOpportunities();
            }
          }}
        />

        {activeAssessmentSkill && (
          <SkillAssessment
            skillId={activeAssessmentSkill.skillId}
            skillName={activeAssessmentSkill.skillName}
            onClose={() => setActiveAssessmentSkill(null)}
            onComplete={() => {
              setActiveAssessmentSkill(null);

              if (viewMode === "recommended") {
                fetchRecommendations();
              } else {
                fetchAllOpportunities();
              }
            }}
          />
        )}
      </div>
    </MainLayout>
  );
};

export default StudentOpportunities;
