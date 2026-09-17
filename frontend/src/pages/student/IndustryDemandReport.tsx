import React, { useState, useEffect } from "react";

import MainLayout from "../../components/layout/MainLayout";

import {
  BarChart3,
  Building2,
  TrendingUp,
  Loader2,
  AlertCircle,
  HelpCircle,
  ArrowLeft,
  Sparkles,
  Info,
} from "lucide-react";

import { useNavigate } from "react-router-dom";
import type { DemandItem } from "../../components/dashboard/IndustryDemand";
import { API_BASE_URL } from "../../config/api";

const IndustryDemandReport: React.FC = () => {
  const navigate = useNavigate();
  const [demandList, setDemandList] = useState<DemandItem[]>([]);
  const [totalOpportunities, setTotalOpportunities] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReportData = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(
          `${API_BASE_URL}/dashboard/industry-demand?all=true`,
        );
        const result = await res.json();

        if (res.ok && result.success) {
          setDemandList(Array.isArray(result.data) ? result.data : []);
          setTotalOpportunities(result.meta?.totalOpportunities || 0);
        } else {
          throw new Error(
            result.message || "Failed to load industry demand analytics.",
          );
        }
      } catch (err: any) {
        console.error("fetchReportData error:", err);
        setError(err.message || "Unable to reach server.");
      } finally {
        setLoading(false);
      }
    };

    fetchReportData();
  }, []);

  const getBadgeStyle = (level: string) => {
    switch (level) {
      case "High Demand":
        return "bg-[var(--accent-emerald-bg)] border-[var(--accent-emerald)]/30 text-[var(--accent-emerald)]";
      case "Strong Demand":
        return "bg-[var(--accent-cyan-bg)] border-[var(--accent-cyan)]/30 text-[var(--accent-cyan)]";
      case "Moderate Demand":
        return "bg-[var(--accent-amber-bg)] border-[var(--accent-amber)]/30 text-[var(--accent-amber)]";
      default:
        return "bg-[var(--bg-muted)] border-[var(--border-color)] text-[var(--text-muted)]";
    }
  };

  return (
    <MainLayout showRightPanel={false}>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[var(--bg-card)] border border-[var(--border-color)] p-6 rounded-2xl shadow-[var(--shadow-md)]">
          <div className="space-y-1">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--primary)] hover:text-[var(--primary-hover)] transition-colors mb-2 cursor-pointer"
            >
              <ArrowLeft size={14} />
              Back to Dashboard
            </button>

            <div className="flex items-center gap-2">
              <BarChart3 className="text-[var(--primary)]" size={26} />
              <h1 className="text-2xl font-black tracking-tight text-[var(--text-primary)]">
                Industry Skill Demand Report
              </h1>
            </div>

            <p className="text-[var(--text-secondary)] text-sm">
              Real-time analytics of in-demand skills based on current
              SkillBridge opportunities.
            </p>
          </div>

          <div className="bg-[var(--bg-muted)] border border-[var(--border-color)] p-4 rounded-xl flex items-center gap-4 shadow-[var(--shadow-sm)]">
            <div className="p-3 bg-[var(--primary-subtle)] border border-[var(--primary-border)] rounded-xl text-[var(--primary)]">
              <Building2 size={24} />
            </div>

            <div>
              <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider block">
                Active Industry Listings
              </span>

              <span className="text-2xl font-black text-[var(--text-primary)]">
                {totalOpportunities}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-[var(--bg-card)] border border-[var(--primary-border)] p-5 rounded-2xl text-[var(--text-secondary)] space-y-2 shadow-[var(--shadow-sm)]">
          <div className="flex items-center gap-2 text-[var(--primary)] font-bold text-sm">
            <Info size={18} />
            <span>How Demand Percentages are Calculated</span>
          </div>

          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            The demand percentage reflects the proportion of active, published
            opportunity listings on SkillBridge that explicitly require a
            specific skill:
          </p>

          <div className="p-3 bg-[var(--bg-muted)] border border-[var(--border-subtle)] rounded-xl text-xs font-mono text-[var(--primary)]">
            Demand % = (Distinct Active Opportunities Requiring Skill ÷ Total
            Active Opportunities) × 100
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-5 rounded-2xl shadow-[var(--shadow-sm)]">
            <span className="text-xs text-[var(--text-muted)] font-medium block mb-1">
              Top Demanded Skill
            </span>

            <div className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
              <Sparkles
                size={18}
                className="text-[var(--accent-amber)] shrink-0"
              />
              <span>{demandList[0]?.skillName || "N/A"}</span>
            </div>

            <span className="text-xs text-[var(--text-muted)] mt-1 block">
              {demandList[0]
                ? `${demandList[0].demandPercentage}% of listings`
                : "No active data"}
            </span>
          </div>

          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-5 rounded-2xl shadow-[var(--shadow-sm)]">
            <span className="text-xs text-[var(--text-muted)] font-medium block mb-1">
              High Demand Skills
            </span>

            <div className="text-2xl font-black text-[var(--accent-emerald)]">
              {demandList.filter((d) => d.demandLevel === "High Demand").length}
            </div>

            <span className="text-xs text-[var(--text-muted)] mt-1 block">
              Skills required in ≥80% listings
            </span>
          </div>

          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-5 rounded-2xl shadow-[var(--shadow-sm)]">
            <span className="text-xs text-[var(--text-muted)] font-medium block mb-1">
              Total Skills Tracked
            </span>

            <div className="text-2xl font-black text-[var(--primary)]">
              {demandList.length}
            </div>

            <span className="text-xs text-[var(--text-muted)] mt-1 block">
              With active industry requirement
            </span>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-[var(--accent-rose-bg)] border border-[var(--accent-rose)]/30 rounded-xl text-[var(--accent-rose)] text-sm flex items-center gap-2">
            <AlertCircle size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl space-y-3 shadow-[var(--shadow-sm)]">
            <Loader2 className="animate-spin text-[var(--primary)]" size={32} />
            <p className="text-[var(--text-muted)] text-sm font-medium">
              Calculating platform skill demand...
            </p>
          </div>
        ) : demandList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl text-center px-4 shadow-[var(--shadow-sm)]">
            <HelpCircle
              size={40}
              className="text-[var(--text-muted)] mb-2 opacity-60"
            />

            <h3 className="text-base font-bold text-[var(--text-primary)]">
              No Current Opportunity Data Available
            </h3>

            <p className="text-[var(--text-secondary)] text-xs max-w-md mt-1">
              As industry partners post verified internships and job
              opportunities, skill demand benchmarks will automatically update
              here.
            </p>
          </div>
        ) : (
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 space-y-4 shadow-[var(--shadow-md)]">
            <h3 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
              <TrendingUp size={18} className="text-[var(--primary)]" />
              Skill Demand Breakdown
            </h3>

            <div className="space-y-3">
              {demandList.map((item, index) => (
                <div
                  key={item.skillId}
                  className="bg-[var(--bg-muted)] border border-[var(--border-subtle)] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-[var(--primary-border)] hover:bg-[var(--bg-card-hover)] transition-all"
                >
                  <div className="flex items-center gap-3.5 min-w-[200px]">
                    <div className="w-8 h-8 rounded-lg bg-[var(--primary-subtle)] border border-[var(--primary-border)] text-[var(--primary)] flex items-center justify-center font-bold text-xs shrink-0">
                      #{index + 1}
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-[var(--text-primary)]">
                        {item.skillName}
                      </h4>

                      <span className="text-[11px] text-[var(--text-muted)] font-medium">
                        {item.category}
                        {item.studentCount !== undefined
                          ? ` • ${item.studentCount} Students`
                          : ""}
                      </span>
                    </div>
                  </div>

                  <div className="flex-1 max-w-md space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-[var(--text-muted)]">
                        {item.opportunityCount} of {totalOpportunities}{" "}
                        opportunities
                      </span>

                      <span className="text-[var(--text-primary)]">
                        {item.demandPercentage}%
                      </span>
                    </div>

                    <div className="w-full h-2.5 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[var(--primary)] rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.max(item.demandPercentage, 4)}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${getBadgeStyle(
                        item.demandLevel,
                      )}`}
                    >
                      {item.demandLevel}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default IndustryDemandReport;
