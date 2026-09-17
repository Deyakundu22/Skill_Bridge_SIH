import React, { useState, useEffect, useCallback } from "react";

import MainLayout from "../../components/layout/MainLayout";

import {
  Building2,
  Users,
  Brain,
  Briefcase,
  GraduationCap,
  TrendingUp,
  AlertCircle,
  Loader2,
  RotateCw,
  CheckCircle2,
  Award,
  BarChart3,
  ShieldCheck,
  Sparkles,
  ChevronRight,
  Zap,
} from "lucide-react";

import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { API_BASE_URL } from "../../config/api";

interface DashboardData {
  institution: {
    id: number;
    name: string;
    code: string;
    location: string;
    website: string;
  };
  overview: {
    totalStudents: number;
    completedProfiles: number;
    completedProfilesPercentage: number;
    assessedStudents: number;
    assessedStudentsPercentage: number;
    industryReadyStudents: number;
    industryReadyPercentage: number;
    internshipStudents: number;
    internshipPercentage: number;
    placedStudents: number;
    placedPercentage: number;
  };
  skillReadiness: {
    ready: { count: number; percentage: number };
    developing: { count: number; percentage: number };
    needsImprovement: { count: number; percentage: number };
  };
  skillDemandVsSupply: Array<{
    skillId: number;
    skillName: string;
    category: string;
    opportunityCount: number;
    industryDemandPercentage: number;
    avgRequiredProficiency: number;
    studentCount: number;
    studentCoveragePercentage: number;
    avgStudentProficiency: number;
    gapDelta: number;
    isCriticalGap: boolean;
  }>;
  skillsToPrioritize: Array<{
    skillId: number;
    skillName: string;
    category: string;
    priority: "High" | "Medium" | "Moderate";
    priorityScore: number;
    industryDemandPercentage: number;
    studentCount: number;
    studentCoveragePercentage: number;
    avgRequiredProficiency: number;
    avgStudentProficiency: number;
    gapDelta: number;
    reason: string;
  }>;
  institutionalActions: string[];
  topIndustrySkills: Array<{
    skillId: number;
    skillName: string;
    category: string;
    demandCount: number;
    demandPercentage: number;
    avgRequiredProficiency: number;
  }>;
  topStudentSkills: Array<{
    skillId: number;
    skillName: string;
    category: string;
    studentCount: number;
    studentPercentage: number;
    avgProficiency: number;
  }>;
  internships: {
    totalApplications: number;
    totalApplicants: number;
    applied: number;
    shortlisted: number;
    selected: number;
    rejected: number;
    participatingStudents: number;
    participationRate: number;
  };
  placements: {
    totalApplications: number;
    totalApplicants: number;
    applied: number;
    shortlisted: number;
    selected: number;
    rejected: number;
    placedStudents: number;
    placementRate: number;
  };
  demandedSkills: Array<{
    skillId: number;
    skillName: string;
    category: string;
    demandCount: number;
    avgRequiredProficiency: number;
  }>;
  studentSkillInsights: Array<{
    skillId: number;
    skillName: string;
    category: string;
    industryDemandCount: number;
    avgRequiredProficiency: number;
    avgStudentProficiency: number;
    studentCount: number;
    gap: number;
    status: "Strong" | "Developing" | "Curriculum Gap";
  }>;
  students: Array<{
    studentProfileId: number;
    userId: number;
    name: string;
    email: string;
    degree: string;
    department: string;
    cgpa: number | null;
    currentSem: string;
    assessedSkillsCount: number;
    avgProficiency: number;
    verificationStatus?: string;
  }>;
}

const InstitutionDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { token } = useAuth();

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<string>("");

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);

    const authToken = token || localStorage.getItem("skillbridge_token");

    try {
      const res = await fetch(`${API_BASE_URL}/institution/dashboard`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(
          result.message || "Failed to load institution dashboard data.",
        );
      }

      setData(result);

      setLastRefreshed(
        new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      );
    } catch (err: any) {
      console.error("InstitutionDashboard fetch error:", err);
      setError(err.message || "Unable to retrieve dashboard statistics.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (loading && !data) {
    return (
      <MainLayout showRightPanel={false}>
        <div className="w-full max-w-7xl mx-auto px-4 py-20 flex flex-col items-center justify-center space-y-4">
          <Loader2 className="animate-spin text-[var(--primary)]" size={44} />
          <p className="text-[var(--text-muted)] font-medium text-sm text-center">
            Calculating institutional skill metrics & real-time industry
            analytics...
          </p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout showRightPanel={false}>
      <div className="w-full max-w-7xl mx-auto px-4 py-6 space-y-6 text-[var(--text-primary)]">
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 shadow-[var(--shadow-md)]">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3.5 bg-[var(--primary-subtle)] border border-[var(--primary-border)] text-[var(--primary)] rounded-2xl shrink-0">
                <Building2 size={32} />
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 bg-[var(--primary-subtle)] border border-[var(--primary-border)] text-[var(--primary)] font-bold text-[11px] rounded-full uppercase tracking-wider">
                    {data?.institution.code || "INSTITUTION"}
                  </span>

                  <span className="text-xs text-[var(--text-muted)] font-medium flex items-center gap-1">
                    <ShieldCheck
                      size={13}
                      className="text-[var(--accent-emerald)]"
                    />
                    Authenticated Institutional Portal
                  </span>
                </div>

                <h1 className="text-2xl font-extrabold text-[var(--text-primary)] mt-1">
                  {data?.institution.name ||
                    "Institution Smart Analytics Dashboard"}
                </h1>

                <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-0.5">
                  Automated institutional intelligence connecting student skill
                  development, industry demand, and curriculum alignment.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {lastRefreshed && (
                <span className="text-xs text-[var(--text-muted)] hidden sm:inline-block font-medium">
                  Refreshed: {lastRefreshed}
                </span>
              )}

              <button
                onClick={fetchDashboardData}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-[var(--bg-card-hover)] hover:bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border-color)] rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-[var(--shadow-sm)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RotateCw
                  size={14}
                  className={
                    loading ? "animate-spin text-[var(--primary)]" : ""
                  }
                />
                Refresh Telemetry
              </button>
            </div>
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

        {data && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-5 shadow-[var(--shadow-md)] relative overflow-hidden group hover:border-[var(--primary-border)] transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                    Total Students
                  </span>

                  <div className="p-2 bg-[var(--primary-subtle)] text-[var(--primary)] rounded-xl">
                    <Users size={18} />
                  </div>
                </div>

                <div className="mt-3">
                  <span className="text-3xl font-black text-[var(--text-primary)]">
                    {data.overview.totalStudents.toLocaleString()}
                  </span>

                  <p className="text-[11px] text-[var(--text-muted)] mt-1 flex items-center gap-1 font-medium">
                    <GraduationCap
                      size={12}
                      className="text-[var(--primary)]"
                    />
                    Enrolled Students
                  </p>
                </div>
              </div>

              <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-5 shadow-[var(--shadow-md)] relative overflow-hidden group hover:border-[var(--accent-cyan)]/30 transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                    Assessed
                  </span>

                  <div className="p-2 bg-[var(--accent-cyan-bg)] text-[var(--accent-cyan)] rounded-xl">
                    <Brain size={18} />
                  </div>
                </div>

                <div className="mt-3">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-[var(--text-primary)]">
                      {data.overview.assessedStudents}
                    </span>

                    <span className="text-xs font-extrabold text-[var(--accent-cyan)]">
                      ({data.overview.assessedStudentsPercentage}%)
                    </span>
                  </div>

                  <div className="w-full bg-[var(--bg-muted)] h-1.5 rounded-full mt-2 overflow-hidden">
                    <div
                      className="bg-[var(--accent-cyan)] h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${data.overview.assessedStudentsPercentage}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-5 shadow-[var(--shadow-md)] relative overflow-hidden group hover:border-[var(--accent-emerald)]/30 transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                    Industry Ready
                  </span>

                  <div className="p-2 bg-[var(--accent-emerald-bg)] text-[var(--accent-emerald)] rounded-xl">
                    <Award size={18} />
                  </div>
                </div>

                <div className="mt-3">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-[var(--text-primary)]">
                      {data.overview.industryReadyStudents}
                    </span>

                    <span className="text-xs font-extrabold text-[var(--accent-emerald)]">
                      ({data.overview.industryReadyPercentage}%)
                    </span>
                  </div>

                  <p className="text-[11px] text-[var(--text-muted)] mt-1 flex items-center gap-1 font-medium">
                    <TrendingUp
                      size={12}
                      className="text-[var(--accent-emerald)]"
                    />
                    ≥75% Proficiency Score
                  </p>
                </div>
              </div>

              <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-5 shadow-[var(--shadow-md)] relative overflow-hidden group hover:border-[var(--accent-purple)]/30 transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                    Internships
                  </span>

                  <div className="p-2 bg-[var(--accent-purple-bg)] text-[var(--accent-purple)] rounded-xl">
                    <GraduationCap size={18} />
                  </div>
                </div>

                <div className="mt-3">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-[var(--text-primary)]">
                      {data.overview.internshipStudents}
                    </span>

                    <span className="text-xs font-extrabold text-[var(--accent-purple)]">
                      ({data.overview.internshipPercentage}%)
                    </span>
                  </div>

                  <p className="text-[11px] text-[var(--text-muted)] mt-1 flex items-center gap-1 font-medium">
                    <Briefcase
                      size={12}
                      className="text-[var(--accent-purple)]"
                    />
                    Participating Students
                  </p>
                </div>
              </div>

              <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-5 shadow-[var(--shadow-md)] relative overflow-hidden group hover:border-[var(--accent-pink)]/30 transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                    Placed
                  </span>

                  <div className="p-2 bg-[var(--accent-pink-bg)] text-[var(--accent-pink)] rounded-xl">
                    <CheckCircle2 size={18} />
                  </div>
                </div>

                <div className="mt-3">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-[var(--text-primary)]">
                      {data.overview.placedStudents}
                    </span>

                    <span className="text-xs font-extrabold text-[var(--accent-pink)]">
                      ({data.overview.placedPercentage}%)
                    </span>
                  </div>

                  <p className="text-[11px] text-[var(--text-muted)] mt-1 flex items-center gap-1 font-medium">
                    <Award size={12} className="text-[var(--accent-pink)]" />
                    Full-Time Corporate Offers
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 shadow-[var(--shadow-md)] space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-subtle)] pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-[var(--primary-subtle)] text-[var(--primary)] rounded-xl shrink-0">
                    <Zap size={22} />
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-lg font-bold text-[var(--text-primary)]">
                        Smart Automation: What Should We Teach?
                      </h2>

                      <span className="px-2 py-0.5 bg-[var(--accent-amber-bg)] text-[var(--accent-amber)] border border-[var(--accent-amber)]/30 text-[10px] font-extrabold rounded-md uppercase tracking-wider">
                        Institutional Priority Engine
                      </span>
                    </div>

                    <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                      Automated algorithm calculating institutional priority
                      scores based on Industry Demand + Student Coverage Gaps.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.skillsToPrioritize.map((item, idx) => (
                  <div
                    key={item.skillId}
                    className="p-4 bg-[var(--bg-muted)] border border-[var(--border-color)] rounded-xl space-y-3 shadow-[var(--shadow-sm)] hover:border-[var(--border-color-hover)] transition-all"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-5 h-5 flex items-center justify-center bg-[var(--bg-card-hover)] text-[var(--text-secondary)] rounded-full font-bold text-xs shrink-0">
                          {idx + 1}
                        </span>

                        <h3 className="font-extrabold text-sm text-[var(--text-primary)] truncate">
                          {item.skillName}
                        </h3>
                      </div>

                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider whitespace-nowrap ${
                          item.priority === "High"
                            ? "bg-[var(--accent-rose-bg)] text-[var(--accent-rose)] border border-[var(--accent-rose)]/30"
                            : item.priority === "Medium"
                              ? "bg-[var(--accent-amber-bg)] text-[var(--accent-amber)] border border-[var(--accent-amber)]/30"
                              : "bg-[var(--bg-card-hover)] text-[var(--text-secondary)] border border-[var(--border-color)]"
                        }`}
                      >
                        {item.priority} Priority ({item.priorityScore}/100)
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 py-1 bg-[var(--bg-input)] p-2.5 rounded-lg text-xs border border-[var(--border-subtle)]">
                      <div>
                        <span className="text-[10px] text-[var(--text-muted)] block font-semibold">
                          Industry Demand
                        </span>

                        <strong className="text-[var(--accent-amber)] font-extrabold">
                          {item.industryDemandPercentage}%
                        </strong>
                      </div>

                      <div>
                        <span className="text-[10px] text-[var(--text-muted)] block font-semibold">
                          Student Coverage
                        </span>

                        <strong className="text-[var(--accent-cyan)] font-extrabold">
                          {item.studentCoveragePercentage}% ({item.studentCount}{" "}
                          students)
                        </strong>
                      </div>
                    </div>

                    <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed font-medium bg-[var(--bg-input)] p-2 rounded-md border border-[var(--border-subtle)]">
                      💡 {item.reason}
                    </p>
                  </div>
                ))}
              </div>

              <div className="p-4 bg-[var(--accent-amber-bg)] border border-[var(--accent-amber)]/25 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-[var(--accent-amber)] uppercase tracking-wider">
                  <Sparkles size={15} />
                  Recommended Institutional Curriculum Actions
                </div>

                <ul className="space-y-1.5 pt-1">
                  {data.institutionalActions.map((action, idx) => (
                    <li
                      key={idx}
                      className="text-xs text-[var(--text-secondary)] flex items-start gap-2"
                    >
                      <ChevronRight
                        size={14}
                        className="text-[var(--accent-amber)] shrink-0 mt-0.5"
                      />
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 shadow-[var(--shadow-md)] space-y-4">
              <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-[var(--accent-cyan-bg)] text-[var(--accent-cyan)] rounded-xl">
                    <BarChart3 size={20} />
                  </div>

                  <div>
                    <h2 className="text-lg font-bold text-[var(--text-primary)]">
                      Skill Demand vs Student Supply Analysis
                    </h2>

                    <p className="text-xs text-[var(--text-secondary)]">
                      Direct comparison of industry hiring demand percentage
                      against student coverage & proficiency.
                    </p>
                  </div>
                </div>
              </div>

              {data.skillDemandVsSupply.length === 0 ? (
                <div className="py-8 text-center text-[var(--text-muted)] text-sm bg-[var(--bg-muted)] rounded-xl border border-[var(--border-subtle)]">
                  No active skill telemetry recorded yet.
                </div>
              ) : (
                <div className="space-y-4 pt-2">
                  {data.skillDemandVsSupply.map((skill) => (
                    <div
                      key={skill.skillId}
                      className="p-4 bg-[var(--bg-muted)] border border-[var(--border-color)] rounded-xl space-y-2 hover:border-[var(--border-color-hover)] transition-all"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-extrabold text-sm text-[var(--text-primary)]">
                            {skill.skillName}
                          </span>

                          <span className="px-2 py-0.5 bg-[var(--bg-card-hover)] text-[var(--text-muted)] text-[10px] rounded-md font-semibold">
                            {skill.category}
                          </span>

                          {skill.isCriticalGap && (
                            <span className="px-2 py-0.5 bg-[var(--accent-rose-bg)] text-[var(--accent-rose)] border border-[var(--accent-rose)]/30 text-[10px] font-bold rounded-md uppercase">
                              ⚠ Critical Gap
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-4 text-[var(--text-muted)] text-xs">
                          <span>
                            Students Assessed:{" "}
                            <strong className="text-[var(--text-primary)]">
                              {skill.studentCount} (
                              {skill.studentCoveragePercentage}%)
                            </strong>
                          </span>

                          <span>
                            Avg Student Prof:{" "}
                            <strong className="text-[var(--accent-cyan)]">
                              {skill.avgStudentProficiency}%
                            </strong>
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1.5 pt-1">
                        <div className="flex items-center gap-3 text-[11px]">
                          <span className="w-28 font-bold text-[var(--accent-amber)] shrink-0">
                            Industry Demand
                          </span>

                          <div className="w-full bg-[var(--bg-card-hover)] h-2.5 rounded-full overflow-hidden">
                            <div
                              className="bg-[var(--accent-amber)] h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${skill.industryDemandPercentage}%`,
                              }}
                            />
                          </div>

                          <span className="w-12 text-right font-extrabold text-[var(--accent-amber)]">
                            {skill.industryDemandPercentage}%
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-[11px]">
                          <span className="w-28 font-bold text-[var(--accent-cyan)] shrink-0">
                            Student Supply
                          </span>

                          <div className="w-full bg-[var(--bg-card-hover)] h-2.5 rounded-full overflow-hidden">
                            <div
                              className="bg-[var(--accent-cyan)] h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${skill.studentCoveragePercentage}%`,
                              }}
                            />
                          </div>

                          <span className="w-12 text-right font-extrabold text-[var(--accent-cyan)]">
                            {skill.studentCoveragePercentage}%
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 shadow-[var(--shadow-md)] space-y-4">
                <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-[var(--accent-amber-bg)] text-[var(--accent-amber)] rounded-xl">
                      <Briefcase size={18} />
                    </div>

                    <h2 className="text-base font-bold text-[var(--text-primary)]">
                      Top Industry Demanded Skills
                    </h2>
                  </div>
                </div>

                <div className="space-y-2.5">
                  {data.topIndustrySkills.map((sk) => (
                    <div
                      key={sk.skillId}
                      className="p-3 bg-[var(--bg-muted)] border border-[var(--border-color)] rounded-xl flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-extrabold text-[var(--text-primary)] block">
                          {sk.skillName}
                        </span>

                        <span className="text-[10px] text-[var(--text-muted)]">
                          {sk.category} • Target Required:{" "}
                          {sk.avgRequiredProficiency}%
                        </span>
                      </div>

                      <span className="px-2.5 py-1 bg-[var(--accent-amber-bg)] text-[var(--accent-amber)] border border-[var(--accent-amber)]/25 font-extrabold rounded-lg">
                        {sk.demandCount} Opportunities
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 shadow-[var(--shadow-md)] space-y-4">
                <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-[var(--accent-cyan-bg)] text-[var(--accent-cyan)] rounded-xl">
                      <GraduationCap size={18} />
                    </div>

                    <h2 className="text-base font-bold text-[var(--text-primary)]">
                      Top Student Possessed Skills
                    </h2>
                  </div>
                </div>

                <div className="space-y-2.5">
                  {data.topStudentSkills.map((sk) => (
                    <div
                      key={sk.skillId}
                      className="p-3 bg-[var(--bg-muted)] border border-[var(--border-color)] rounded-xl flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-extrabold text-[var(--text-primary)] block">
                          {sk.skillName}
                        </span>

                        <span className="text-[10px] text-[var(--text-muted)]">
                          {sk.category} • Avg Student Score: {sk.avgProficiency}
                          %
                        </span>
                      </div>

                      <span className="px-2.5 py-1 bg-[var(--accent-cyan-bg)] text-[var(--accent-cyan)] border border-[var(--accent-cyan)]/25 font-extrabold rounded-lg">
                        {sk.studentCount} Students
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 shadow-[var(--shadow-md)] space-y-4">
                <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-[var(--accent-purple-bg)] text-[var(--accent-purple)] rounded-xl">
                      <GraduationCap size={20} />
                    </div>

                    <div>
                      <h2 className="text-base font-bold text-[var(--text-primary)]">
                        Internship Participation
                      </h2>

                      <p className="text-xs text-[var(--text-secondary)]">
                        Real-time student internship application metrics.
                      </p>
                    </div>
                  </div>

                  <span className="text-xs font-extrabold text-[var(--text-secondary)] bg-[var(--bg-card-hover)] border border-[var(--border-color)] px-3 py-1 rounded-lg">
                    {data.internships.totalApplications} Applications
                  </span>
                </div>

                <div className="space-y-2.5">
                  <div className="flex items-center justify-between p-3 bg-[var(--accent-emerald-bg)] border border-[var(--accent-emerald)]/25 rounded-xl">
                    <div className="flex items-center gap-2 text-xs font-bold text-[var(--accent-emerald)]">
                      <CheckCircle2 size={16} /> Selected / Hired Interns
                    </div>

                    <span className="text-sm font-black text-[var(--accent-emerald)]">
                      {data.internships.selected}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-[var(--accent-cyan-bg)] border border-[var(--accent-cyan)]/25 rounded-xl">
                    <div className="flex items-center gap-2 text-xs font-bold text-[var(--accent-cyan)]">
                      <Award size={16} /> Shortlisted
                    </div>

                    <span className="text-sm font-black text-[var(--accent-cyan)]">
                      {data.internships.shortlisted}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-[var(--bg-muted)] border border-[var(--border-color)] rounded-xl">
                    <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-secondary)]">
                      <Briefcase
                        size={16}
                        className="text-[var(--accent-amber)]"
                      />
                      Pending Review
                    </div>

                    <span className="text-sm font-black text-[var(--text-primary)]">
                      {data.internships.applied}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-[var(--accent-rose-bg)] border border-[var(--accent-rose)]/25 rounded-xl">
                    <div className="flex items-center gap-2 text-xs font-bold text-[var(--accent-rose)]">
                      <AlertCircle size={16} /> Not Selected
                    </div>

                    <span className="text-sm font-black text-[var(--accent-rose)]">
                      {data.internships.rejected}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 shadow-[var(--shadow-md)] space-y-4">
                <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-[var(--accent-purple-bg)] text-[var(--accent-purple)] rounded-xl">
                      <Briefcase size={20} />
                    </div>

                    <div>
                      <h2 className="text-base font-bold text-[var(--text-primary)]">
                        Placement Progress
                      </h2>

                      <p className="text-xs text-[var(--text-secondary)]">
                        Corporate recruitment telemetry & offer acceptances.
                      </p>
                    </div>
                  </div>

                  <span className="text-xs font-extrabold text-[var(--text-secondary)] bg-[var(--bg-card-hover)] border border-[var(--border-color)] px-3 py-1 rounded-lg">
                    {data.placements.totalApplications} Applications
                  </span>
                </div>

                <div className="space-y-2.5">
                  <div className="flex items-center justify-between p-3 bg-[var(--accent-emerald-bg)] border border-[var(--accent-emerald)]/25 rounded-xl">
                    <div className="flex items-center gap-2 text-xs font-bold text-[var(--accent-emerald)]">
                      <CheckCircle2 size={16} /> Offers Extended / Placed
                    </div>

                    <span className="text-sm font-black text-[var(--accent-emerald)]">
                      {data.placements.selected}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-[var(--accent-purple-bg)] border border-[var(--accent-purple)]/25 rounded-xl">
                    <div className="flex items-center gap-2 text-xs font-bold text-[var(--accent-purple)]">
                      <Award size={16} /> Shortlisted / Interviewing
                    </div>

                    <span className="text-sm font-black text-[var(--accent-purple)]">
                      {data.placements.shortlisted}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-[var(--bg-muted)] border border-[var(--border-color)] rounded-xl">
                    <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-secondary)]">
                      <Briefcase
                        size={16}
                        className="text-[var(--accent-amber)]"
                      />
                      Under Evaluation
                    </div>

                    <span className="text-sm font-black text-[var(--text-primary)]">
                      {data.placements.applied}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-[var(--accent-rose-bg)] border border-[var(--accent-rose)]/25 rounded-xl">
                    <div className="flex items-center gap-2 text-xs font-bold text-[var(--accent-rose)]">
                      <AlertCircle size={16} /> Not Selected
                    </div>

                    <span className="text-sm font-black text-[var(--accent-rose)]">
                      {data.placements.rejected}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 shadow-[var(--shadow-md)] space-y-4">
              <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-[var(--primary-subtle)] text-[var(--primary)] rounded-xl">
                    <Users size={20} />
                  </div>

                  <div>
                    <h2 className="text-lg font-bold text-[var(--text-primary)]">
                      Enrolled Student Cohort Roster
                    </h2>

                    <p className="text-xs text-[var(--text-secondary)]">
                      Verified student profiles enrolled under{" "}
                      {data.institution.name}.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[var(--text-secondary)] bg-[var(--bg-card-hover)] border border-[var(--border-color)] px-3 py-1 rounded-lg">
                    {data.students.length} Enrolled
                  </span>

                  <button
                    onClick={() => navigate("/institution/students")}
                    className="flex items-center gap-1 px-3 py-1 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--text-on-primary)] rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-[var(--shadow-sm)]"
                  >
                    View All Directory <ChevronRight size={14} />
                  </button>
                </div>
              </div>

              {data.students.length === 0 ? (
                <div className="py-8 text-center text-[var(--text-muted)] text-sm bg-[var(--bg-muted)] rounded-xl border border-[var(--border-subtle)]">
                  No students currently enrolled under this institution.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-[var(--border-color)] text-[var(--text-muted)] uppercase tracking-wider font-bold">
                        <th className="py-3 px-3">Student Name</th>
                        <th className="py-3 px-3">Degree & Dept</th>
                        <th className="py-3 px-3">CGPA</th>
                        <th className="py-3 px-3">Assessed Skills</th>
                        <th className="py-3 px-3">Avg Proficiency</th>
                        <th className="py-3 px-3 text-center">Readiness</th>
                        <th className="py-3 px-3 text-right">
                          Student Details
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-[var(--border-subtle)] text-[var(--text-secondary)]">
                      {data.students.map((st) => (
                        <tr
                          key={st.studentProfileId}
                          onClick={() =>
                            navigate(
                              `/institution/students?studentId=${st.studentProfileId}`,
                            )
                          }
                          className="hover:bg-[var(--bg-card-hover)] transition-colors cursor-pointer group"
                        >
                          <td className="py-3.5 px-3 font-bold text-[var(--text-primary)] group-hover:text-[var(--primary)] transition-colors">
                            {st.name}

                            <span className="block text-[10px] text-[var(--text-muted)] font-normal">
                              {st.email}
                            </span>
                          </td>

                          <td className="py-3.5 px-3">
                            <span className="font-semibold text-[var(--text-primary)]">
                              {st.degree}
                            </span>

                            <span className="block text-[10px] text-[var(--text-muted)]">
                              {st.department} • Sem {st.currentSem}
                            </span>
                          </td>

                          <td className="py-3.5 px-3 font-extrabold text-[var(--text-primary)]">
                            {st.cgpa !== null ? st.cgpa.toFixed(2) : "N/A"}
                          </td>

                          <td className="py-3.5 px-3 font-semibold text-[var(--text-secondary)]">
                            {st.assessedSkillsCount} Skills
                          </td>

                          <td className="py-3.5 px-3 font-bold text-[var(--accent-cyan)]">
                            {st.avgProficiency}%
                          </td>

                          <td className="py-3.5 px-3 text-center">
                            <span
                              className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                                st.avgProficiency >= 75
                                  ? "bg-[var(--accent-emerald-bg)] text-[var(--accent-emerald)] border border-[var(--accent-emerald)]/30"
                                  : st.avgProficiency >= 50
                                    ? "bg-[var(--accent-cyan-bg)] text-[var(--accent-cyan)] border border-[var(--accent-cyan)]/30"
                                    : "bg-[var(--accent-amber-bg)] text-[var(--accent-amber)] border border-[var(--accent-amber)]/30"
                              }`}
                            >
                              {st.avgProficiency >= 75
                                ? "Ready"
                                : st.avgProficiency >= 50
                                  ? "Developing"
                                  : "Needs Review"}
                            </span>
                          </td>

                          <td className="py-3.5 px-3 text-right">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(
                                  `/institution/students?studentId=${st.studentProfileId}`,
                                );
                              }}
                              className="px-2.5 py-1 bg-[var(--primary-subtle)] text-[var(--primary)] border border-[var(--primary-border)] hover:bg-[var(--primary)] hover:text-[var(--text-on-primary)] rounded-lg text-xs font-bold transition-all cursor-pointer"
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
};

export default InstitutionDashboard;
