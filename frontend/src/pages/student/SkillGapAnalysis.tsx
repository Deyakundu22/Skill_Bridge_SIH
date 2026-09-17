import React, { useState, useEffect, useCallback } from "react";
import MainLayout from "../../components/layout/MainLayout";
import {
  TrendingUp,
  Award,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Brain,
  RotateCw,
  Loader2,
  AlertCircle,
  Sparkles,
  Filter,
  BarChart2,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { SkillAssessment } from "../../components/student/SkillAssessment";
import { API_BASE_URL } from "../../config/api";

interface SkillGapItem {
  skillId: number;
  skillName: string;
  category: string;
  opportunityCount: number;
  requiredProficiency: number;
  studentProficiency: number;
  hasSkill: boolean;
  gapScore: number;
  status: "Strong" | "Needs Improvement" | "Critical Gap";
  recommendation: string;
}

interface GapAnalysisSummary {
  overallReadinessPercentage: number;
  totalDemandedSkills: number;
  strongCount: number;
  needsImprovementCount: number;
  criticalGapCount: number;
  unpossessedDemandedCount: number;
  assessedSkillsCount: number;
}

const SkillGapAnalysisPage: React.FC = () => {
  const { token } = useAuth();

  const [summary, setSummary] = useState<GapAnalysisSummary | null>(null);
  const [skills, setSkills] = useState<SkillGapItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const [activeAssessmentSkill, setActiveAssessmentSkill] = useState<{
    skillId: number;
    skillName: string;
  } | null>(null);

  const fetchGapAnalysis = useCallback(async () => {
    setLoading(true);
    setError(null);
    const authToken = token || localStorage.getItem("skillbridge_token");

    try {
      const res = await fetch(`${API_BASE_URL}/student/skill-gap-analysis`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to fetch skill gap analysis.");
      }

      setSummary(data.summary);
      setSkills(Array.isArray(data.skills) ? data.skills : []);
    } catch (err: any) {
      console.error("fetchGapAnalysis error:", err);
      setError(err.message || "Could not load skill gap analysis data.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchGapAnalysis();
  }, [fetchGapAnalysis]);

  const categories = Array.from(
    new Set(skills.map((s) => s.category).filter(Boolean)),
  );

  const filteredSkills = skills.filter((item) => {
    const matchesStatus =
      statusFilter === "all" ||
      item.status.toLowerCase() === statusFilter.toLowerCase();

    const matchesCategory =
      categoryFilter === "all" || item.category === categoryFilter;

    return matchesStatus && matchesCategory;
  });

  return (
    <MainLayout showRightPanel={false}>
      <div className="w-full max-w-7xl mx-auto px-4 py-6 space-y-6">
        <div className="relative overflow-hidden bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 shadow-[var(--shadow-xl)]">
          <div className="absolute -top-20 -right-20 w-48 h-48 rounded-full bg-[var(--primary-subtle)] blur-3xl pointer-events-none" />

          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3.5 bg-[var(--primary-subtle)] border border-[var(--primary-border)] rounded-2xl text-[var(--primary)] shrink-0">
                <BarChart2 size={32} />
              </div>

              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--primary)]">
                  Real-time Skill Benchmark & Readiness
                </span>

                <h1 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)] mt-0.5">
                  Skill Gap Analysis
                </h1>

                <p className="text-sm text-[var(--text-secondary)] mt-1 max-w-2xl">
                  Evaluate your verified skill proficiency against real live
                  demand from active industry job opportunities.
                </p>
              </div>
            </div>

            <button
              onClick={fetchGapAnalysis}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2.5 bg-[var(--bg-muted)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-color)] hover:border-[var(--border-color-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-xl text-xs font-semibold transition-all shadow-[var(--shadow-sm)] cursor-pointer shrink-0"
            >
              <RotateCw
                size={15}
                className={loading ? "animate-spin text-[var(--primary)]" : ""}
              />
              Refresh Analytics
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
              Calculating skill gap matrices from database...
            </p>
          </div>
        ) : (
          summary && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-5 shadow-[var(--shadow-md)] flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                      Overall Readiness
                    </span>

                    <div className="p-2 bg-[var(--primary-subtle)] border border-[var(--primary-border)] text-[var(--primary)] rounded-xl">
                      <TrendingUp size={18} />
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="text-3xl font-extrabold text-[var(--text-primary)]">
                      {summary.overallReadinessPercentage}%
                    </div>

                    <div className="w-full bg-[var(--bg-muted)] border border-[var(--border-subtle)] rounded-full h-2 mt-3 overflow-hidden">
                      <div
                        className="bg-[var(--primary)] h-2 rounded-full transition-all duration-1000"
                        style={{
                          width: `${summary.overallReadinessPercentage}%`,
                        }}
                      />
                    </div>

                    <p className="text-[11px] text-[var(--text-muted)] mt-2">
                      Industry benchmark fit score based on live hiring
                      requirements.
                    </p>
                  </div>
                </div>

                <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-5 shadow-[var(--shadow-md)] flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[var(--accent-emerald)] uppercase tracking-wider">
                      Strong / Meets Demand
                    </span>

                    <div className="p-2 bg-[var(--accent-emerald-bg)] border border-[var(--accent-emerald)]/25 text-[var(--accent-emerald)] rounded-xl">
                      <CheckCircle2 size={18} />
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="text-3xl font-extrabold text-[var(--accent-emerald)]">
                      {summary.strongCount}
                    </div>

                    <p className="text-[11px] text-[var(--text-muted)] mt-2">
                      Skills where your proficiency matches or exceeds industry
                      demand.
                    </p>
                  </div>
                </div>

                <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-5 shadow-[var(--shadow-md)] flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[var(--accent-amber)] uppercase tracking-wider">
                      Needs Improvement
                    </span>

                    <div className="p-2 bg-[var(--accent-amber-bg)] border border-[var(--accent-amber)]/25 text-[var(--accent-amber)] rounded-xl">
                      <AlertTriangle size={18} />
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="text-3xl font-extrabold text-[var(--accent-amber)]">
                      {summary.needsImprovementCount}
                    </div>

                    <p className="text-[11px] text-[var(--text-muted)] mt-2">
                      Slightly below target proficiency for active listings.
                    </p>
                  </div>
                </div>

                <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-5 shadow-[var(--shadow-md)] flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[var(--accent-rose)] uppercase tracking-wider">
                      Critical Skill Gaps
                    </span>

                    <div className="p-2 bg-[var(--accent-rose-bg)] border border-[var(--accent-rose)]/25 text-[var(--accent-rose)] rounded-xl">
                      <HelpCircle size={18} />
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="text-3xl font-extrabold text-[var(--accent-rose)]">
                      {summary.criticalGapCount}
                    </div>

                    <p className="text-[11px] text-[var(--text-muted)] mt-2">
                      {summary.unpossessedDemandedCount} required skills not yet
                      assessed or acquired.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-[var(--bg-card)] backdrop-blur-xl border border-[var(--border-color)] rounded-2xl p-5 shadow-[var(--shadow-xl)] space-y-4">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border-subtle)]">
                  <div>
                    <h3 className="text-lg font-bold text-[var(--text-primary)]">
                      Industry Skill Benchmark Matrix
                    </h3>

                    <p className="text-xs text-[var(--text-muted)] mt-0.5">
                      Real-time comparison of your verified score vs. active job
                      posting requirements.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1.5 bg-[var(--bg-muted)] border border-[var(--border-color)] rounded-xl px-3 py-1.5 text-xs">
                      <Filter size={14} className="text-[var(--primary)]" />

                      <select
                        className="bg-transparent text-[var(--text-secondary)] font-medium focus:outline-none cursor-pointer"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                      >
                        <option value="all" className="bg-[var(--bg-elevated)]">
                          All Statuses
                        </option>
                        <option
                          value="strong"
                          className="bg-[var(--bg-elevated)]"
                        >
                          Strong / Meets Demand
                        </option>
                        <option
                          value="needs improvement"
                          className="bg-[var(--bg-elevated)]"
                        >
                          Needs Improvement
                        </option>
                        <option
                          value="critical gap"
                          className="bg-[var(--bg-elevated)]"
                        >
                          Critical Gap
                        </option>
                      </select>
                    </div>

                    {categories.length > 0 && (
                      <div className="flex items-center gap-1.5 bg-[var(--bg-muted)] border border-[var(--border-color)] rounded-xl px-3 py-1.5 text-xs">
                        <select
                          className="bg-transparent text-[var(--text-secondary)] font-medium focus:outline-none cursor-pointer"
                          value={categoryFilter}
                          onChange={(e) => setCategoryFilter(e.target.value)}
                        >
                          <option
                            value="all"
                            className="bg-[var(--bg-elevated)]"
                          >
                            All Categories
                          </option>

                          {categories.map((cat) => (
                            <option
                              key={cat}
                              value={cat}
                              className="bg-[var(--bg-elevated)]"
                            >
                              {cat}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>

                {filteredSkills.length === 0 ? (
                  <div className="text-center py-12 text-[var(--text-muted)]">
                    <Brain
                      size={36}
                      className="mx-auto text-[var(--text-disabled)] mb-2"
                    />

                    <p className="font-semibold text-[var(--text-secondary)]">
                      No skill gaps match your filter.
                    </p>

                    <p className="text-xs mt-1">
                      Try selecting a different status or category filter.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredSkills.map((item, idx) => {
                      const cardVariants = [
                        "border-l-[3px] border-l-[var(--primary)]",
                        "border-l-[3px] border-l-[var(--accent-cyan)]",
                        "border-l-[3px] border-l-[var(--accent-purple)]",
                        "border-l-[3px] border-l-[var(--accent-emerald)]",
                      ];

                      const variantStyle =
                        cardVariants[idx % cardVariants.length];

                      return (
                        <div
                          key={item.skillId}
                          className={`p-5 rounded-xl transition-all duration-300 space-y-3.5 bg-[var(--bg-muted)] border border-[var(--border-subtle)] hover:border-[var(--border-color-hover)] shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] ${variantStyle}`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex flex-wrap items-center gap-2.5">
                              <h4 className="text-base font-bold text-[var(--text-primary)]">
                                {item.skillName}
                              </h4>

                              <span className="px-2 py-0.5 bg-[var(--bg-card-hover)] text-[var(--text-muted)] border border-[var(--border-subtle)] rounded-md text-[10px] font-semibold uppercase">
                                {item.category}
                              </span>

                              <span className="px-2 py-0.5 bg-[var(--primary-subtle)] border border-[var(--primary-border)] text-[var(--primary)] rounded-md text-[10px] font-bold">
                                Demanded in {item.opportunityCount}{" "}
                                {item.opportunityCount === 1
                                  ? "Opportunity"
                                  : "Opportunities"}
                              </span>
                            </div>

                            <span
                              className={`px-3 py-1 rounded-full text-xs font-bold inline-self-start sm:inline-self-auto ${
                                item.status === "Strong"
                                  ? "bg-[var(--accent-emerald-bg)] border border-[var(--accent-emerald)]/30 text-[var(--accent-emerald)]"
                                  : item.status === "Needs Improvement"
                                    ? "bg-[var(--accent-amber-bg)] border border-[var(--accent-amber)]/30 text-[var(--accent-amber)]"
                                    : "bg-[var(--accent-rose-bg)] border border-[var(--accent-rose)]/30 text-[var(--accent-rose)]"
                              }`}
                            >
                              {item.status === "Strong" &&
                                "✓ Meets Industry Demand"}
                              {item.status === "Needs Improvement" &&
                                "⚡ Needs Improvement"}
                              {item.status === "Critical Gap" &&
                                "⚠ Critical Skill Gap"}
                            </span>
                          </div>

                          <div className="space-y-2 pt-1">
                            <div>
                              <div className="flex justify-between text-xs mb-1 font-medium">
                                <span className="text-[var(--text-muted)] flex items-center gap-1">
                                  Your Verified Score:
                                </span>

                                <span className="text-[var(--primary)] font-bold">
                                  {item.hasSkill
                                    ? `${item.studentProficiency}%`
                                    : "Not Assessed (0%)"}
                                </span>
                              </div>

                              <div className="w-full bg-[var(--bg-card-hover)] border border-[var(--border-subtle)] rounded-full h-2 overflow-hidden">
                                <div
                                  className={`h-2 rounded-full transition-all duration-700 ${
                                    item.status === "Strong"
                                      ? "bg-[var(--accent-emerald)]"
                                      : item.status === "Needs Improvement"
                                        ? "bg-[var(--accent-amber)]"
                                        : "bg-[var(--accent-rose)]"
                                  }`}
                                  style={{
                                    width: `${item.studentProficiency}%`,
                                  }}
                                />
                              </div>
                            </div>

                            <div>
                              <div className="flex justify-between text-xs mb-1 font-medium">
                                <span className="text-[var(--text-muted)] flex items-center gap-1">
                                  Industry Average Target:
                                </span>

                                <span className="text-[var(--accent-cyan)] font-bold">
                                  {item.requiredProficiency}%
                                </span>
                              </div>

                              <div className="w-full bg-[var(--bg-card-hover)] border border-[var(--border-subtle)] rounded-full h-2 overflow-hidden">
                                <div
                                  className="bg-[var(--accent-cyan)] h-2 rounded-full transition-all duration-700"
                                  style={{
                                    width: `${item.requiredProficiency}%`,
                                  }}
                                />
                              </div>
                            </div>
                          </div>

                          <div className="pt-2 border-t border-[var(--border-subtle)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-start gap-2 text-xs text-[var(--text-secondary)]">
                              <Sparkles
                                size={14}
                                className="text-[var(--accent-amber)] shrink-0 mt-0.5"
                              />

                              <span>{item.recommendation}</span>
                            </div>

                            <button
                              onClick={() =>
                                setActiveAssessmentSkill({
                                  skillId: item.skillId,
                                  skillName: item.skillName,
                                })
                              }
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--primary-lighter)] hover:bg-[var(--primary-hover)] text-[var(--text-on-primary)] rounded-xl text-xs font-semibold transition-all shadow-[var(--shadow-sm)] cursor-pointer shrink-0"
                            >
                              <Award size={14} />
                              Take Skill Assessment
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )
        )}

        {activeAssessmentSkill && (
          <SkillAssessment
            skillId={activeAssessmentSkill.skillId}
            skillName={activeAssessmentSkill.skillName}
            onClose={() => setActiveAssessmentSkill(null)}
            onComplete={() => {
              setActiveAssessmentSkill(null);
              fetchGapAnalysis();
            }}
          />
        )}
      </div>
    </MainLayout>
  );
};

export default SkillGapAnalysisPage;
