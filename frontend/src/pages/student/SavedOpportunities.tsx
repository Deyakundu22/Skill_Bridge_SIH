import React, { useState, useEffect, useCallback } from "react";
import MainLayout from "../../components/layout/MainLayout";
import {
  Bookmark,
  BookmarkX,
  MapPin,
  Clock,
  Briefcase,
  Search,
  RotateCw,
  ExternalLink,
  GraduationCap,
  Sparkles,
  AlertCircle,
  Loader2,
  Trash2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import type { Opportunity } from "../../types/opportunity";
import { OpportunityDetailModal } from "../../components/industry/OpportunityDetailModal";
import { ApplyOpportunityModal } from "../../components/student/ApplyOpportunityModal";
import { API_BASE_URL } from "../../config/api";

const SavedOpportunities: React.FC = () => {
  const navigate = useNavigate();
  const { token } = useAuth();

  const [savedOpportunities, setSavedOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState<boolean>(false);

  const fetchSavedOpportunities = useCallback(async () => {
    setLoading(true);
    setError(null);
    const authToken = token || localStorage.getItem("skillbridge_token");

    try {
      const res = await fetch(`${API_BASE_URL}/opportunities/saved`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to fetch saved opportunities.");
      }

      setSavedOpportunities(Array.isArray(data.opportunities) ? data.opportunities : []);
    } catch (err: any) {
      console.error("fetchSavedOpportunities error:", err);
      setError(err.message || "Could not load saved opportunities.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchSavedOpportunities();
  }, [fetchSavedOpportunities]);

  const handleRemoveBookmark = async (oppId: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const authToken = token || localStorage.getItem("skillbridge_token");

    try {
      setSavedOpportunities((prev) => prev.filter((opp) => opp.id !== oppId));

      const res = await fetch(`${API_BASE_URL}/opportunities/${oppId}/save`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        fetchSavedOpportunities();
        throw new Error(data.message || "Failed to update saved status.");
      }
    } catch (err: any) {
      console.error("Remove bookmark error:", err);
    }
  };

  const formatStipend = (min: number | null, max: number | null, type: string) => {
    if (!min && !max) return "Disclosed on interview";
    const unit =
      type === "internship" || type === "faculty_internship"
        ? "/month"
        : "/annum";

    if (min && max) {
      return `₹${min.toLocaleString()} - ₹${max.toLocaleString()} ${unit}`;
    }

    if (min) return `From ₹${min.toLocaleString()} ${unit}`;
    if (max) return `Up to ₹${max.toLocaleString()} ${unit}`;

    return "Disclosed on interview";
  };

  const filteredOpportunities = savedOpportunities.filter((opp) => {
    const matchesType = typeFilter === "all" || opp.type === typeFilter;
    const matchesSearch =
      !searchTerm.trim() ||
      opp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (opp.company_name &&
        opp.company_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (opp.location &&
        opp.location.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesType && matchesSearch;
  });

  return (
    <MainLayout showRightPanel={false}>
      <div className="w-full max-w-7xl mx-auto px-4 py-6 space-y-6">
        <div className="relative overflow-hidden bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 shadow-[var(--shadow-xl)]">
          <div className="absolute -top-20 -right-20 w-48 h-48 rounded-full bg-[var(--primary-subtle)] blur-3xl pointer-events-none" />

          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-[var(--accent-amber-bg)] border border-[var(--accent-amber)]/25 rounded-2xl text-[var(--accent-amber)] shrink-0">
                <Bookmark size={28} />
              </div>

              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--accent-amber)]">
                  Bookmarked Listings
                </span>

                <h1 className="text-2xl font-bold text-[var(--text-primary)] mt-0.5">
                  Saved Opportunities
                </h1>

                <p className="text-sm text-[var(--text-secondary)] mt-1">
                  Manage and quickly apply to your bookmarked opportunity listings.
                </p>
              </div>
            </div>

            <button
              onClick={() => navigate("/opportunities")}
              className="flex items-center gap-2 px-4 py-2.5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--text-on-primary)] font-semibold text-xs rounded-xl shadow-[var(--shadow-md)] transition-all cursor-pointer shrink-0"
            >
              <Sparkles size={15} />
              <span>Explore More Opportunities</span>
            </button>
          </div>
        </div>

        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-4 shadow-[var(--shadow-lg)] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
            />

            <input
              type="text"
              placeholder="Search saved opportunities by title, technology, or company..."
              className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--focus-ring)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] text-sm rounded-xl pl-10 pr-4 py-2.5 transition-all outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap items-center gap-1 p-1 bg-[var(--bg-muted)] border border-[var(--border-color)] rounded-xl">
            <button
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                typeFilter === "all"
                  ? "bg-[var(--primary)] text-[var(--text-on-primary)] font-bold shadow-[var(--shadow-sm)]"
                  : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]"
              }`}
              onClick={() => setTypeFilter("all")}
            >
              All Saved ({savedOpportunities.length})
            </button>

            <button
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                typeFilter === "internship"
                  ? "bg-[var(--primary)] text-[var(--text-on-primary)] font-bold shadow-[var(--shadow-sm)]"
                  : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]"
              }`}
              onClick={() => setTypeFilter("internship")}
            >
              <GraduationCap size={14} />
              Internships
            </button>

            <button
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                typeFilter === "job"
                  ? "bg-[var(--primary)] text-[var(--text-on-primary)] font-bold shadow-[var(--shadow-sm)]"
                  : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]"
              }`}
              onClick={() => setTypeFilter("job")}
            >
              <Briefcase size={14} />
              Jobs
            </button>

            <button
              onClick={fetchSavedOpportunities}
              disabled={loading}
              className="p-1.5 text-[var(--text-muted)] hover:text-[var(--primary)] hover:bg-[var(--bg-card-hover)] rounded-lg transition-colors cursor-pointer ml-1"
              title="Refresh saved listings"
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
            <AlertCircle size={18} className="text-[var(--accent-rose)] shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 bg-[var(--bg-muted)] border border-[var(--border-color)] rounded-2xl space-y-4">
            <Loader2
              className="animate-spin text-[var(--primary)]"
              size={36}
            />

            <p className="text-[var(--text-muted)] text-sm font-medium">
              Loading your bookmarked opportunities...
            </p>
          </div>
        ) : filteredOpportunities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 bg-[var(--bg-muted)] border border-[var(--border-color)] rounded-2xl text-center px-4">
            <div className="p-4 bg-[var(--accent-amber-bg)] border border-[var(--accent-amber)]/25 rounded-2xl text-[var(--accent-amber)] mb-3">
              <BookmarkX size={44} />
            </div>

            <h3 className="text-lg font-bold text-[var(--text-primary)]">
              {savedOpportunities.length === 0
                ? "No Saved Opportunities Yet"
                : "No matching saved opportunities found"}
            </h3>

            <p className="text-sm text-[var(--text-secondary)] max-w-md mt-1 mb-5">
              {savedOpportunities.length === 0
                ? "Click the bookmark icon on any opportunity card while browsing to save it here for quick reference."
                : "Try adjusting your search query or type filters to find your saved items."}
            </p>

            <button
              onClick={() => navigate("/opportunities")}
              className="px-4 py-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--text-on-primary)] font-semibold text-xs rounded-xl shadow-[var(--shadow-md)] transition-all cursor-pointer"
            >
              Browse Opportunities
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredOpportunities.map((opp) => (
              <div
                key={opp.id}
                onClick={() => {
                  setSelectedOpportunity(opp);
                  setIsDetailModalOpen(true);
                }}
                className="group relative bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-[var(--primary-border)] hover:bg-[var(--bg-card-hover)] rounded-2xl p-5 shadow-[var(--shadow-md)] hover:shadow-[var(--shadow-lg)] transition-all duration-300 flex flex-col justify-between cursor-pointer"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 bg-[var(--bg-muted)] border border-[var(--border-subtle)] rounded-xl flex items-center justify-center font-bold text-[var(--text-primary)] overflow-hidden shrink-0">
                        {opp.company_logo ? (
                          <img
                            src={opp.company_logo}
                            alt={opp.company_name || "Company"}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          (opp.company_name || "C").charAt(0).toUpperCase()
                        )}
                      </div>

                      <div>
                        <h4 className="font-semibold text-[var(--text-primary)] text-xs">
                          {opp.company_name || "Industry Partner"}
                        </h4>

                        <span className="inline-block px-2 py-0.5 mt-0.5 text-[10px] font-bold rounded-md bg-[var(--primary-subtle)] text-[var(--primary)] border border-[var(--primary-border)] uppercase tracking-wider">
                          {opp.type.replace(/_/g, " ")}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={(e) => handleRemoveBookmark(opp.id, e)}
                      className="p-2 text-[var(--accent-amber)] hover:text-[var(--accent-rose)] bg-[var(--accent-amber-bg)] hover:bg-[var(--accent-rose-bg)] border border-[var(--accent-amber)]/25 hover:border-[var(--accent-rose)]/30 rounded-xl transition-all cursor-pointer"
                      title="Remove from saved"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <h3 className="text-base font-bold text-[var(--text-primary)] group-hover:text-[var(--primary)] transition-colors line-clamp-1 mb-1">
                    {opp.title}
                  </h3>

                  <p className="text-xs text-[var(--text-secondary)] line-clamp-2 mb-4 leading-relaxed">
                    {opp.description}
                  </p>

                  <div className="grid grid-cols-2 gap-2 py-2.5 px-3 bg-[var(--bg-muted)] border border-[var(--border-subtle)] rounded-xl text-xs text-[var(--text-secondary)] mb-4">
                    <div className="flex items-center gap-1.5 text-[var(--text-muted)]">
                      <MapPin
                        size={13}
                        className="text-[var(--accent-amber)] shrink-0"
                      />
                      <span className="truncate">
                        {opp.location || "Remote"}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-[var(--text-muted)]">
                      <Clock
                        size={13}
                        className="text-[var(--accent-cyan)] shrink-0"
                      />
                      <span className="truncate">
                        {opp.duration || "Flexible"}
                      </span>
                    </div>

                    <div className="col-span-2 flex items-center gap-1.5 font-medium text-[var(--text-primary)]">
                      <span className="text-[var(--accent-emerald)] font-bold">
                        ₹
                      </span>

                      <span className="truncate">
                        {formatStipend(
                          opp.stipend_min,
                          opp.stipend_max,
                          opp.type
                        )}
                      </span>
                    </div>
                  </div>

                  {opp.requiredSkills && opp.requiredSkills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {opp.requiredSkills.slice(0, 3).map((s, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 text-[11px] bg-[var(--bg-muted)] text-[var(--text-secondary)] rounded-md border border-[var(--border-subtle)]"
                        >
                          {s.skill_name || `Skill #${s.skill_id}`}
                        </span>
                      ))}

                      {opp.requiredSkills.length > 3 && (
                        <span className="px-2 py-0.5 text-[11px] bg-[var(--bg-card-hover)] text-[var(--text-muted)] rounded-md border border-[var(--border-subtle)]">
                          +{opp.requiredSkills.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between gap-2 mt-auto">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedOpportunity(opp);
                      setIsDetailModalOpen(true);
                    }}
                    className="flex-1 py-2 px-3 bg-[var(--bg-muted)] hover:bg-[var(--bg-card-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-semibold text-xs rounded-xl border border-[var(--border-color)] hover:border-[var(--border-color-hover)] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <ExternalLink size={14} />
                    View Details
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedOpportunity(opp);
                      setIsApplyModalOpen(true);
                    }}
                    className="flex-1 py-2 px-3 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--text-on-primary)] font-semibold text-xs rounded-xl shadow-[var(--shadow-md)] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Briefcase size={14} />
                    Apply Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedOpportunity && isDetailModalOpen && (
          <OpportunityDetailModal
            opportunity={selectedOpportunity}
            isOpen={isDetailModalOpen}
            onClose={() => {
              setIsDetailModalOpen(false);
              setSelectedOpportunity(null);
            }}
          />
        )}

        {selectedOpportunity && isApplyModalOpen && (
          <ApplyOpportunityModal
            opportunity={selectedOpportunity}
            isOpen={isApplyModalOpen}
            onClose={() => {
              setIsApplyModalOpen(false);
              setSelectedOpportunity(null);
            }}
            onSuccess={() => {
              setIsApplyModalOpen(false);
              setSelectedOpportunity(null);
            }}
          />
        )}
      </div>
    </MainLayout>
  );
};

export default SavedOpportunities;