import React, { useState, useEffect, useCallback } from "react";

import MainLayout from "../../components/layout/MainLayout";

import {
  Building2,
  Search,
  MapPin,
  Globe,
  Briefcase,
  Mail,
  Phone,
  CheckCircle2,
  Loader2,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Filter,
  RotateCw,
  Eye,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../../config/api";

interface PartnerCompany {
  id: number;
  companyName: string;
  companyType?: string | null;
  industrySector?: string | null;
  description?: string | null;
  website?: string | null;
  location?: string | null;
  contactEmail?: string | null;
  phone?: string | null;
  logo?: string | null;
  verificationStatus: string;
  activeOpportunitiesCount: number;
  opportunities?: Array<{
    id: number;
    title: string;
    type: string;
    location?: string | null;
    work_mode: string;
    stipend_min?: number | null;
    stipend_max?: number | null;
  }>;
}

const CompaniesPage: React.FC = () => {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState<PartnerCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSector, setSelectedSector] = useState("all");
  const [selectedCompanyModal, setSelectedCompanyModal] =
    useState<PartnerCompany | null>(null);

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let url = `${API_BASE_URL}/companies`;
      const params = new URLSearchParams();

      if (searchTerm.trim()) {
        params.append("search", searchTerm.trim());
      }

      if (selectedSector !== "all") {
        params.append("sector", selectedSector);
      }

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const res = await fetch(url);
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to load partner companies.");
      }

      setCompanies(Array.isArray(data.companies) ? data.companies : []);
    } catch (err: any) {
      console.error("fetchCompanies error:", err);
      setError(err.message || "Could not fetch company listings.");
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedSector]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const sectors = Array.from(
    new Set(companies.map((c) => c.industrySector).filter(Boolean)),
  ) as string[];

  return (
    <MainLayout showRightPanel={false}>
      <div className="w-full max-w-7xl mx-auto px-4 py-6 space-y-6">
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 shadow-[var(--shadow-lg)]">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3.5 bg-[var(--primary-subtle)] border border-[var(--primary-border)] rounded-2xl text-[var(--primary)] shrink-0">
                <Building2 size={32} />
              </div>

              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--primary)]">
                  Industry Network & Directory
                </span>

                <h1 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)] mt-0.5">
                  Partner Companies & Employers
                </h1>

                <p className="text-sm text-[var(--text-secondary)] mt-1 max-w-2xl">
                  Connect with hiring partners, explore company profiles, and
                  discover active internships & full-time career opportunities.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="px-4 py-2 bg-[var(--bg-muted)] border border-[var(--border-color)] rounded-xl text-center">
                <span className="text-xs text-[var(--text-muted)] block font-medium">
                  Verified Partners
                </span>

                <span className="text-lg font-bold text-[var(--primary)]">
                  {companies.filter((c) => c.verificationStatus === "approved")
                    .length || companies.length}
                </span>
              </div>

              <div className="px-4 py-2 bg-[var(--accent-emerald-bg)] border border-[var(--accent-emerald)]/30 rounded-xl text-center">
                <span className="text-xs text-[var(--text-muted)] block font-medium">
                  Live Roles
                </span>

                <span className="text-lg font-bold text-[var(--accent-emerald)]">
                  {companies.reduce(
                    (acc, c) => acc + (Number(c.activeOpportunitiesCount) || 0),
                    0,
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[var(--bg-muted)] border border-[var(--border-color)] rounded-2xl p-4 shadow-[var(--shadow-md)] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
            />

            <input
              type="text"
              placeholder="Search companies by name, location, or description..."
              className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--focus-ring)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] text-sm rounded-xl pl-10 pr-4 py-2.5 transition-all outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl px-3 py-1.5">
              <Filter size={15} className="text-[var(--primary)]" />

              <select
                className="bg-transparent text-[var(--text-primary)] text-xs font-medium focus:outline-none cursor-pointer"
                value={selectedSector}
                onChange={(e) => setSelectedSector(e.target.value)}
              >
                <option
                  value="all"
                  className="bg-[var(--bg-elevated)] text-[var(--text-primary)]"
                >
                  All Sectors
                </option>

                {sectors.map((sec) => (
                  <option
                    key={sec}
                    value={sec}
                    className="bg-[var(--bg-elevated)] text-[var(--text-primary)]"
                  >
                    {sec}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={fetchCompanies}
              disabled={loading}
              className="p-2.5 bg-[var(--bg-card-hover)] hover:bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--primary)] rounded-xl transition-all cursor-pointer disabled:opacity-50"
              title="Refresh companies list"
            >
              <RotateCw
                size={16}
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

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-[var(--bg-muted)] border border-[var(--border-color)] rounded-2xl space-y-4">
            <Loader2 className="animate-spin text-[var(--primary)]" size={36} />

            <p className="text-[var(--text-muted)] text-sm font-medium">
              Loading partner company directory...
            </p>
          </div>
        ) : companies.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-[var(--bg-muted)] border border-[var(--border-color)] rounded-2xl text-center px-4">
            <div className="p-4 bg-[var(--bg-card-hover)] rounded-2xl text-[var(--text-muted)] mb-3">
              <Building2 size={44} />
            </div>

            <h3 className="text-lg font-bold text-[var(--text-primary)]">
              No Partner Companies Found
            </h3>

            <p className="text-[var(--text-muted)] text-sm max-w-md mt-1">
              No registered industry partners matched your current search
              filters.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {companies.map((comp) => (
              <div
                key={comp.id}
                className="group bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-color)] hover:border-[var(--primary-border)] rounded-2xl p-5 shadow-[var(--shadow-md)] hover:shadow-[var(--shadow-lg)] transition-all duration-300 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-[var(--primary-subtle)] border border-[var(--primary-border)] flex items-center justify-center text-[var(--primary)] font-bold text-lg shrink-0">
                        {comp.logo ? (
                          <img
                            src={comp.logo}
                            alt={comp.companyName}
                            className="w-full h-full object-cover rounded-2xl"
                          />
                        ) : (
                          (comp.companyName || "C").charAt(0).toUpperCase()
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-base font-bold text-[var(--text-primary)] group-hover:text-[var(--primary)] transition-colors">
                            {comp.companyName}
                          </h3>

                          {comp.verificationStatus === "approved" && (
                            <span title="Verified Employer">
                              <CheckCircle2
                                size={15}
                                className="text-[var(--accent-emerald)] shrink-0"
                              />
                            </span>
                          )}
                        </div>

                        <span className="text-xs text-[var(--primary)] font-medium">
                          {comp.industrySector ||
                            comp.companyType ||
                            "Technology Partner"}
                        </span>
                      </div>
                    </div>

                    <span className="px-2.5 py-1 bg-[var(--accent-emerald-bg)] border border-[var(--accent-emerald)]/30 text-[var(--accent-emerald)] rounded-full text-[11px] font-bold shrink-0">
                      {comp.activeOpportunitiesCount} Live{" "}
                      {Number(comp.activeOpportunitiesCount) === 1
                        ? "Role"
                        : "Roles"}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-[var(--text-muted)]">
                    {comp.location && (
                      <span className="flex items-center gap-1">
                        <MapPin size={13} className="text-[var(--primary)]" />
                        {comp.location}
                      </span>
                    )}

                    {comp.website && (
                      <a
                        href={
                          comp.website.startsWith("http")
                            ? comp.website
                            : `https://${comp.website}`
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 text-[var(--primary)] hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Globe size={13} />
                        Website <ExternalLink size={10} />
                      </a>
                    )}
                  </div>

                  <p className="text-xs text-[var(--text-secondary)] line-clamp-3 leading-relaxed bg-[var(--bg-muted)] p-3 rounded-xl border border-[var(--border-subtle)]">
                    {comp.description ||
                      "Verified corporate partner looking for talented students to hire across various engineering and business domains."}
                  </p>

                  {comp.opportunities && comp.opportunities.length > 0 && (
                    <div className="pt-2 border-t border-[var(--border-subtle)] space-y-1.5">
                      <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1">
                        <Sparkles
                          size={11}
                          className="text-[var(--accent-amber)]"
                        />
                        Featured Active Postings:
                      </span>

                      <div className="space-y-1.5">
                        {comp.opportunities.slice(0, 2).map((opp) => (
                          <div
                            key={opp.id}
                            className="p-2 bg-[var(--bg-muted)] hover:bg-[var(--bg-card-hover)] rounded-lg border border-[var(--border-subtle)] flex items-center justify-between transition-colors cursor-pointer"
                            onClick={() => navigate("/opportunities")}
                          >
                            <div className="flex items-center gap-2">
                              <Briefcase
                                size={13}
                                className="text-[var(--primary)]"
                              />

                              <span className="text-xs font-medium text-[var(--text-primary)] truncate max-w-[170px]">
                                {opp.title}
                              </span>
                            </div>

                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[var(--primary-subtle)] text-[var(--primary)] uppercase">
                              {opp.type}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between">
                  <button
                    onClick={() => setSelectedCompanyModal(comp)}
                    className="flex items-center gap-1.5 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors cursor-pointer"
                  >
                    <Eye size={14} /> Full Company Profile
                  </button>

                  <button
                    onClick={() => navigate("/opportunities")}
                    className="flex items-center gap-1 px-3 py-1.5 bg-[var(--primary-light)] hover:bg-[var(--primary-hover)] text-[var(--text-on-primary)] rounded-xl text-xs font-semibold transition-all shadow-[var(--shadow-sm)] cursor-pointer"
                  >
                    Explore Roles <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedCompanyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--bg-app)]/85 backdrop-blur-md">
            <div className="bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-[var(--shadow-xl)]">
              <div className="flex items-start justify-between border-b border-[var(--border-subtle)] pb-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-[var(--primary-subtle)] border border-[var(--primary-border)] flex items-center justify-center text-[var(--primary)] font-bold text-xl">
                    {selectedCompanyModal.logo ? (
                      <img
                        src={selectedCompanyModal.logo}
                        alt={selectedCompanyModal.companyName}
                        className="w-full h-full object-cover rounded-2xl"
                      />
                    ) : (
                      (selectedCompanyModal.companyName || "C")
                        .charAt(0)
                        .toUpperCase()
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold text-[var(--text-primary)]">
                        {selectedCompanyModal.companyName}
                      </h2>

                      {selectedCompanyModal.verificationStatus ===
                        "approved" && (
                        <span className="px-2 py-0.5 bg-[var(--accent-emerald-bg)] border border-[var(--accent-emerald)]/30 text-[var(--accent-emerald)] rounded-full text-xs font-bold flex items-center gap-1">
                          <CheckCircle2 size={12} />
                          Verified Employer
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-[var(--primary)] font-medium mt-0.5">
                      {selectedCompanyModal.industrySector ||
                        selectedCompanyModal.companyType ||
                        "Industry Corporate Partner"}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedCompanyModal(null)}
                  className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-lg font-bold p-1 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {selectedCompanyModal.location && (
                  <div className="p-3 bg-[var(--bg-muted)] rounded-xl border border-[var(--border-subtle)]">
                    <span className="text-[var(--text-muted)] block mb-1 font-medium">
                      Headquarters Location
                    </span>

                    <span className="text-[var(--text-primary)] font-bold flex items-center gap-1">
                      <MapPin size={14} className="text-[var(--primary)]" />
                      {selectedCompanyModal.location}
                    </span>
                  </div>
                )}

                {selectedCompanyModal.website && (
                  <div className="p-3 bg-[var(--bg-muted)] rounded-xl border border-[var(--border-subtle)]">
                    <span className="text-[var(--text-muted)] block mb-1 font-medium">
                      Official Website
                    </span>

                    <a
                      href={
                        selectedCompanyModal.website.startsWith("http")
                          ? selectedCompanyModal.website
                          : `https://${selectedCompanyModal.website}`
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="text-[var(--primary)] font-bold flex items-center gap-1 hover:underline"
                    >
                      <Globe size={14} />
                      {selectedCompanyModal.website}
                      <ExternalLink size={11} />
                    </a>
                  </div>
                )}

                {selectedCompanyModal.contactEmail && (
                  <div className="p-3 bg-[var(--bg-muted)] rounded-xl border border-[var(--border-subtle)]">
                    <span className="text-[var(--text-muted)] block mb-1 font-medium">
                      Contact Email
                    </span>

                    <span className="text-[var(--text-primary)] font-bold flex items-center gap-1">
                      <Mail size={14} className="text-[var(--accent-cyan)]" />
                      {selectedCompanyModal.contactEmail}
                    </span>
                  </div>
                )}

                {selectedCompanyModal.phone && (
                  <div className="p-3 bg-[var(--bg-muted)] rounded-xl border border-[var(--border-subtle)]">
                    <span className="text-[var(--text-muted)] block mb-1 font-medium">
                      Contact Phone
                    </span>

                    <span className="text-[var(--text-primary)] font-bold flex items-center gap-1">
                      <Phone
                        size={14}
                        className="text-[var(--accent-emerald)]"
                      />
                      {selectedCompanyModal.phone}
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
                  Company Overview
                </h4>

                <p className="text-sm text-[var(--text-secondary)] leading-relaxed bg-[var(--bg-muted)] p-4 rounded-xl border border-[var(--border-subtle)]">
                  {selectedCompanyModal.description ||
                    "No detailed description provided by company admin."}
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
                    Published Opportunities (
                    {selectedCompanyModal.opportunities?.length || 0})
                  </h4>

                  <button
                    onClick={() => {
                      setSelectedCompanyModal(null);
                      navigate("/opportunities");
                    }}
                    className="text-xs font-semibold text-[var(--primary)] hover:underline"
                  >
                    View All in Discovery →
                  </button>
                </div>

                {selectedCompanyModal.opportunities &&
                selectedCompanyModal.opportunities.length > 0 ? (
                  <div className="space-y-2">
                    {selectedCompanyModal.opportunities.map((opp) => (
                      <div
                        key={opp.id}
                        className="p-3 bg-[var(--bg-muted)] hover:bg-[var(--bg-card-hover)] rounded-xl border border-[var(--border-subtle)] flex items-center justify-between transition-all"
                      >
                        <div>
                          <h5 className="text-sm font-bold text-[var(--text-primary)]">
                            {opp.title}
                          </h5>

                          <span className="text-xs text-[var(--text-muted)]">
                            {opp.work_mode}{" "}
                            {opp.location ? `• ${opp.location}` : ""}
                          </span>
                        </div>

                        <button
                          onClick={() => {
                            setSelectedCompanyModal(null);
                            navigate("/opportunities");
                          }}
                          className="px-3 py-1 bg-[var(--primary-light)] hover:bg-[var(--primary-hover)] text-[var(--text-on-primary)] rounded-lg text-xs font-semibold transition-all shadow-[var(--shadow-sm)]"
                        >
                          Apply / Details
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[var(--text-muted)] italic">
                    No live active job postings right now.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default CompaniesPage;
