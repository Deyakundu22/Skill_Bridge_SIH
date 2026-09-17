import React, { useState, useEffect, useCallback, useMemo } from "react";

import MainLayout from "../../components/layout/MainLayout";

import {
  Users,
  Search,
  RotateCw,
  Loader2,
  AlertCircle,
  Filter,
  BookOpen,
  X,
  GraduationCap,
  Layers,
  CheckCircle2,
  XCircle,
  Clock,
  Award,
  FileText,
  Briefcase,
  Mail,
  Phone,
  Sparkles,
  Eye,
  ShieldCheck,
  Download,
  ExternalLink,
} from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { API_BASE_URL } from "../../config/api";

interface StudentData {
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
}

interface DashboardResponse {
  institution: {
    id: number;
    name: string;
    code: string;
    location: string;
    website: string;
    verification_status?: string;
  };
  students: StudentData[];
}

interface DetailedStudentInfo {
  studentProfileId: number;
  userId: number;
  name: string;
  email: string;
  phone?: string;
  degree: string;
  department: string;
  cgpa: number | null;
  currentSem: string;
  rollNumber?: string;
  studentId?: string;
  bio?: string;
  location?: string;
  verificationStatus: string;
  registeredAt?: string;
  skills: Array<{
    studentSkillId: number;
    skillId: number;
    skillName: string;
    category: string;
    proficiencyScore: number;
    assessedAt?: string;
  }>;
  applications: Array<{
    applicationId: number;
    opportunityTitle: string;
    companyName: string;
    opportunityType: string;
    status: string;
    appliedAt: string;
  }>;
  documents: Array<{
    id: number;
    documentType: string;
    originalName: string;
    fileUrl: string;
    uploadedAt: string;
  }>;
}

const InstitutionStudents: React.FC = () => {
  const { token } = useAuth();
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedReadiness, setSelectedReadiness] = useState<string>("all");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [selectedSemester, setSelectedSemester] = useState<string>("all");
  const [selectedVerification, setSelectedVerification] =
    useState<string>("all");
  const [lastRefreshed, setLastRefreshed] = useState<string>("");
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(
    null,
  );
  const [detailedStudent, setDetailedStudent] =
    useState<DetailedStudentInfo | null>(null);
  const [detailLoading, setDetailLoading] = useState<boolean>(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [previewDoc, setPreviewDoc] = useState<{
    url: string;
    title: string;
  } | null>(null);

  const getViewUrl = (url: string) => {
    if (!url) return "#";
    const authToken =
      localStorage.getItem("skillbridge_token") ||
      localStorage.getItem("token") ||
      "";
    const cleaned = url.replace(/\/fl_attachment\//g, "/");
    return `${API_BASE_URL}/institution/students/document/view?url=${encodeURIComponent(
      cleaned,
    )}&token=${encodeURIComponent(authToken)}`;
  };

  const getDownloadUrl = (url: string) => {
    if (!url) return "#";
    if (url.includes("cloudinary.com") && !url.includes("fl_attachment")) {
      return url.replace("/upload/", "/upload/fl_attachment/");
    }
    return url;
  };

  const fetchStudentsData = useCallback(async () => {
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
          result.message || "Failed to load enrolled student data.",
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
      console.error("InstitutionStudents fetch error:", err);
      setError(err.message || "Unable to retrieve student roster.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  const [searchParams] = useSearchParams();

  useEffect(() => {
    fetchStudentsData();
  }, [fetchStudentsData]);

  useEffect(() => {
    const paramId = searchParams.get("studentId");

    if (paramId) {
      const parsedId = parseInt(paramId, 10);

      if (!isNaN(parsedId)) {
        fetchStudentDetails(parsedId);
      }
    }
  }, [searchParams]);

  const fetchStudentDetails = async (studentId: number) => {
    setSelectedStudentId(studentId);
    setDetailLoading(true);
    setDetailError(null);
    setDetailedStudent(null);

    const authToken = token || localStorage.getItem("skillbridge_token");

    try {
      const res = await fetch(
        `${API_BASE_URL}/institution/students/${studentId}/details`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
        },
      );

      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.message || "Failed to fetch student details.");
      }

      setDetailedStudent(result.student);
    } catch (err: any) {
      console.error("fetchStudentDetails error:", err);
      setDetailError(err.message || "Could not load detailed student profile.");
    } finally {
      setDetailLoading(false);
    }
  };

  const handleVerifyStudent = async (
    studentId: number,
    status: "approved" | "rejected",
  ) => {
    setActionLoadingId(studentId);
    const authToken = token || localStorage.getItem("skillbridge_token");

    try {
      const res = await fetch(
        `${API_BASE_URL}/institution/students/${studentId}/verification`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status }),
        },
      );

      const result = await res.json();

      if (res.ok && result.success) {
        fetchStudentsData();

        if (detailedStudent && detailedStudent.studentProfileId === studentId) {
          setDetailedStudent((prev) =>
            prev ? { ...prev, verificationStatus: status } : null,
          );
        }
      } else {
        alert(result.message || "Failed to update student verification status");
      }
    } catch (err: any) {
      alert("Error updating student verification status");
    } finally {
      setActionLoadingId(null);
    }
  };

  const availableDepartments = useMemo(() => {
    if (!data?.students) return [];

    const depts = new Set<string>();

    data.students.forEach((s) => {
      if (s.department && s.department !== "N/A") {
        depts.add(s.department);
      }
    });

    return Array.from(depts).sort();
  }, [data]);

  const availableSemesters = useMemo(() => {
    if (!data?.students) return [];

    const sems = new Set<string>();

    data.students.forEach((s) => {
      if (s.currentSem && s.currentSem !== "N/A") {
        sems.add(s.currentSem);
      }
    });

    return Array.from(sems).sort();
  }, [data]);

  const filteredStudents = useMemo(() => {
    return (data?.students || []).filter((st) => {
      const matchesSearch =
        !searchTerm.trim() ||
        st.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        st.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        st.degree.toLowerCase().includes(searchTerm.toLowerCase()) ||
        st.department.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;

      if (
        selectedDepartment !== "all" &&
        st.department !== selectedDepartment
      ) {
        return false;
      }

      if (selectedSemester !== "all" && st.currentSem !== selectedSemester) {
        return false;
      }

      if (selectedReadiness === "ready") {
        if (st.assessedSkillsCount === 0 || st.avgProficiency < 75) {
          return false;
        }
      } else if (selectedReadiness === "developing") {
        if (
          st.assessedSkillsCount === 0 ||
          st.avgProficiency < 50 ||
          st.avgProficiency >= 75
        ) {
          return false;
        }
      } else if (selectedReadiness === "needs_focus") {
        if (st.assessedSkillsCount === 0 || st.avgProficiency >= 50) {
          return false;
        }
      } else if (selectedReadiness === "unassessed") {
        if (st.assessedSkillsCount > 0) return false;
      }

      if (selectedVerification !== "all") {
        const vStatus = (st.verificationStatus || "pending").toLowerCase();

        if (vStatus !== selectedVerification) return false;
      }

      return true;
    });
  }, [
    data,
    searchTerm,
    selectedDepartment,
    selectedSemester,
    selectedReadiness,
    selectedVerification,
  ]);

  const isAnyFilterActive =
    searchTerm.trim() !== "" ||
    selectedReadiness !== "all" ||
    selectedDepartment !== "all" ||
    selectedSemester !== "all" ||
    selectedVerification !== "all";

  const resetAllFilters = () => {
    setSearchTerm("");
    setSelectedReadiness("all");
    setSelectedDepartment("all");
    setSelectedSemester("all");
    setSelectedVerification("all");
  };

  const getInitials = (name?: string): string => {
    if (!name || !name.trim()) return "SB";

    const titles = new Set([
      "dr",
      "dr.",
      "mr",
      "mr.",
      "mrs",
      "mrs.",
      "ms",
      "ms.",
      "prof",
      "prof.",
      "er",
      "er.",
      "shri",
      "smt",
      "sir",
      "madam",
    ]);

    const parts = name
      .trim()
      .split(/\s+/)
      .filter((part) => !titles.has(part.toLowerCase()));

    if (parts.length === 0) {
      const raw = name.replace(/[^a-zA-Z]/g, "");
      return raw.substring(0, 2).toUpperCase() || "SB";
    }

    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase();
    }

    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  if (loading && !data) {
    return (
      <MainLayout showRightPanel={false}>
        <div className="w-full max-w-7xl mx-auto px-4 py-16 flex flex-col items-center justify-center space-y-4">
          <Loader2 className="animate-spin text-[var(--primary)]" size={42} />
          <p className="text-[var(--text-muted)] font-medium text-sm">
            Retrieving enrolled student details & skill evaluations...
          </p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout showRightPanel={false}>
      <div className="w-full max-w-7xl mx-auto px-4 py-6 space-y-6">
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 shadow-[var(--shadow-lg)]">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3.5 bg-[var(--primary-subtle)] border border-[var(--primary-border)] rounded-2xl text-[var(--primary)] shrink-0">
                <Users size={32} />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 bg-[var(--primary-subtle)] border border-[var(--primary-border)] text-[var(--primary)] font-bold text-[11px] rounded-full uppercase tracking-wider">
                    {data?.institution.code || "INSTITUTION"}
                  </span>

                  <span className="text-xs text-[var(--text-muted)] font-medium">
                    Enrolled Roster & Skill Telemetry
                  </span>
                </div>

                <h1 className="text-2xl font-bold text-[var(--text-primary)] mt-1">
                  Enrolled Student Details & Skills
                </h1>

                <p className="text-sm text-[var(--text-secondary)] mt-0.5">
                  Comprehensive directory and verified skill evaluations for
                  students registered under{" "}
                  {data?.institution?.name
                    ? data.institution.name
                    : "your institution"}
                  .
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {lastRefreshed && (
                <span className="text-xs text-[var(--text-muted)] hidden sm:inline-block">
                  Updated: {lastRefreshed}
                </span>
              )}

              <button
                onClick={fetchStudentsData}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-[var(--bg-card-hover)] hover:text-(--primary) text-[var(--text-secondary)] rounded-xl text-xs font-semibold border border-[var(--border-color)] transition-all cursor-pointer shadow-[var(--shadow-sm)] disabled:opacity-50"
              >
                <RotateCw
                  size={14}
                  className={
                    loading ? "animate-spin text-[var(--primary)]" : ""
                  }
                />
                Refresh Roster
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

        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-5 shadow-[var(--shadow-lg)] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">
              <Filter size={14} className="text-[var(--primary)]" />
              Multi-Filter Roster & Skill Telemetry
            </div>

            {isAnyFilterActive && (
              <button
                onClick={resetAllFilters}
                className="flex items-center gap-1.5 px-3 py-1 bg-[var(--accent-rose-bg)] hover:bg-[var(--accent-rose-bg)] text-[var(--accent-rose)] border border-[var(--accent-rose)]/30 rounded-lg text-xs font-semibold transition-all cursor-pointer"
              >
                <X size={13} />
                Reset All Filters
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div className="relative md:col-span-1">
              <Search
                size={15}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
              />

              <input
                type="text"
                placeholder="Search name, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl pl-9 pr-3 py-2 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--focus-ring)] transition-colors"
              />
            </div>

            <div className="relative">
              <GraduationCap
                size={15}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none"
              />

              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl pl-9 pr-8 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--focus-ring)] transition-colors appearance-none cursor-pointer"
              >
                <option value="all">All Departments</option>
                {availableDepartments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative">
              <Layers
                size={15}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none"
              />

              <select
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value)}
                className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl pl-9 pr-8 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--focus-ring)] transition-colors appearance-none cursor-pointer"
              >
                <option value="all">All Semesters</option>
                {availableSemesters.map((sem) => (
                  <option key={sem} value={sem}>
                    {sem}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative">
              <Sparkles
                size={15}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none"
              />

              <select
                value={selectedReadiness}
                onChange={(e) => setSelectedReadiness(e.target.value)}
                className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl pl-9 pr-8 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--focus-ring)] transition-colors appearance-none cursor-pointer"
              >
                <option value="all">All Skill Readiness</option>
                <option value="ready">Ready (≥75% Avg)</option>
                <option value="developing">Developing (50-74%)</option>
                <option value="needs_focus">Needs Focus (&lt;50%)</option>
                <option value="unassessed">Unassessed</option>
              </select>
            </div>

            <div className="relative">
              <ShieldCheck
                size={15}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none"
              />

              <select
                value={selectedVerification}
                onChange={(e) => setSelectedVerification(e.target.value)}
                className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl pl-9 pr-8 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--focus-ring)] transition-colors appearance-none cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="approved">Approved / Verified</option>
                <option value="pending">Pending Approval</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 shadow-[var(--shadow-lg)] space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
            <h2 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
              <BookOpen size={18} className="text-[var(--primary)]" />
              Enrolled Student Directory
            </h2>

            <span className="text-xs font-semibold text-[var(--text-muted)] bg-[var(--bg-muted)] px-3 py-1 rounded-lg border border-[var(--border-subtle)]">
              Showing {filteredStudents.length} of {data?.students.length || 0}{" "}
              Students
            </span>
          </div>

          {filteredStudents.length === 0 ? (
            <div className="py-12 text-center text-[var(--text-muted)] text-sm bg-[var(--bg-muted)] rounded-xl border border-[var(--border-color)] space-y-2">
              <p className="font-semibold text-[var(--text-secondary)]">
                No students match your active filter combination.
              </p>

              <p className="text-xs text-[var(--text-muted)]">
                Try adjusting or clearing your search, department, semester, or
                readiness filters.
              </p>

              {isAnyFilterActive && (
                <button
                  onClick={resetAllFilters}
                  className="mt-2 px-4 py-1.5 bg-[var(--primary-subtle)] text-[var(--primary)] border border-[var(--primary-border)] rounded-lg text-xs font-semibold hover:bg-[var(--primary-border)] transition-all cursor-pointer"
                >
                  Clear All Active Filters
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[var(--border-color)] text-[var(--text-muted)] uppercase tracking-wider font-semibold">
                    <th className="py-3.5 px-3">Student Name & Email</th>
                    <th className="py-3.5 px-3">Degree & Department</th>
                    <th className="py-3.5 px-3">Semester</th>
                    <th className="py-3.5 px-3">Verification</th>
                    <th className="py-3.5 px-3">Assessed Skills</th>
                    <th className="py-3.5 px-3">Avg Proficiency</th>
                    <th className="py-3.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[var(--border-subtle)] text-[var(--text-secondary)]">
                  {filteredStudents.map((st) => {
                    const currentStatus = (
                      st.verificationStatus || "pending"
                    ).toLowerCase();

                    let vBadge = {
                      text: "Pending Approval",
                      class:
                        "bg-[var(--accent-amber-bg)] text-[var(--accent-amber)] border-[var(--accent-amber)]/30",
                    };

                    if (currentStatus === "approved") {
                      vBadge = {
                        text: "Verified Student",
                        class:
                          "bg-[var(--accent-emerald-bg)] text-[var(--accent-emerald)] border-[var(--accent-emerald)]/30",
                      };
                    } else if (currentStatus === "rejected") {
                      vBadge = {
                        text: "Rejected",
                        class:
                          "bg-[var(--accent-rose-bg)] text-[var(--accent-rose)] border-[var(--accent-rose)]/30",
                      };
                    }

                    return (
                      <tr
                        key={st.studentProfileId}
                        className="hover:bg-[var(--bg-card-hover)] transition-colors cursor-pointer group"
                        onClick={() => fetchStudentDetails(st.studentProfileId)}
                      >
                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-[var(--primary-subtle)] text-[var(--primary)] font-bold text-xs flex items-center justify-center border border-[var(--primary-border)] shrink-0">
                              {getInitials(st.name)}
                            </div>

                            <div>
                              <span className="font-bold text-[var(--text-primary)] group-hover:text-[var(--primary)] transition-colors block">
                                {st.name}
                              </span>

                              <span className="text-[10px] text-[var(--text-muted)] font-normal">
                                {st.email}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-3">
                          <span className="font-medium text-[var(--text-primary)] block">
                            {st.degree || "N/A"}
                          </span>
                          <span className="text-[10px] text-[var(--text-muted)]">
                            {st.department || "N/A"}
                          </span>
                        </td>

                        <td className="py-3.5 px-3">
                          <span className="px-2 py-0.5 bg-[var(--bg-muted)] text-[var(--text-secondary)] font-medium text-[11px] rounded-md border border-[var(--border-color)]">
                            {st.currentSem}
                          </span>
                        </td>

                        <td className="py-3.5 px-3">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${vBadge.class}`}
                          >
                            {vBadge.text}
                          </span>
                        </td>

                        <td className="py-3.5 px-3 font-semibold text-[var(--text-secondary)]">
                          {st.assessedSkillsCount}{" "}
                          {st.assessedSkillsCount === 1 ? "skill" : "skills"}
                        </td>

                        <td className="py-3.5 px-3">
                          {st.assessedSkillsCount > 0 ? (
                            <span className="font-bold text-[var(--accent-cyan)] text-sm">
                              {st.avgProficiency}%
                            </span>
                          ) : (
                            <span className="text-[var(--text-muted)]">
                              N/A
                            </span>
                          )}
                        </td>

                        <td
                          className="py-3.5 px-3 text-right"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() =>
                                fetchStudentDetails(st.studentProfileId)
                              }
                              className="flex items-center gap-1 px-2.5 py-1 bg-[var(--primary-subtle)] text-[var(--primary)] border border-[var(--primary-border)] rounded-lg text-[11px] font-semibold hover:bg-[var(--primary)] hover:text-[var(--text-on-primary)] transition-all cursor-pointer"
                            >
                              <Eye size={12} />
                              Details
                            </button>

                            {currentStatus !== "approved" && (
                              <button
                                disabled={
                                  actionLoadingId === st.studentProfileId
                                }
                                onClick={() =>
                                  handleVerifyStudent(
                                    st.studentProfileId,
                                    "approved",
                                  )
                                }
                                className="px-2.5 py-1 bg-[var(--accent-emerald-bg)] text-[var(--accent-emerald)] border border-[var(--accent-emerald)]/30 rounded-lg text-[11px] font-semibold hover:bg-[var(--accent-emerald)] hover:text-[var(--text-on-primary)] transition-all cursor-pointer disabled:opacity-50"
                              >
                                Approve
                              </button>
                            )}

                            {currentStatus !== "rejected" && (
                              <button
                                disabled={
                                  actionLoadingId === st.studentProfileId
                                }
                                onClick={() =>
                                  handleVerifyStudent(
                                    st.studentProfileId,
                                    "rejected",
                                  )
                                }
                                className="px-2.5 py-1 bg-[var(--accent-rose-bg)] text-[var(--accent-rose)] border border-[var(--accent-rose)]/30 rounded-lg text-[11px] font-semibold hover:bg-[var(--accent-rose)] hover:text-[var(--text-on-primary)] transition-all cursor-pointer disabled:opacity-50"
                              >
                                Reject
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {selectedStudentId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--bg-app)]/85 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-3xl bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-2xl shadow-[var(--shadow-xl)] p-6 space-y-6 my-8 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <button
              onClick={() => setSelectedStudentId(null)}
              className="absolute top-4 right-4 p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] bg-[var(--bg-card-hover)] hover:bg-[var(--bg-muted)] rounded-xl transition-all cursor-pointer"
            >
              <X size={18} />
            </button>

            {detailLoading ? (
              <div className="py-20 flex flex-col items-center justify-center space-y-3">
                <Loader2
                  className="animate-spin text-[var(--primary)]"
                  size={38}
                />
                <p className="text-[var(--text-muted)] text-sm font-medium">
                  Retrieving student details & skill profile...
                </p>
              </div>
            ) : detailError ? (
              <div className="py-12 space-y-4 text-center">
                <div className="p-3 bg-[var(--accent-rose-bg)] border border-[var(--accent-rose)]/30 rounded-xl text-[var(--accent-rose)] text-sm max-w-md mx-auto">
                  {detailError}
                </div>

                <button
                  onClick={() => setSelectedStudentId(null)}
                  className="px-4 py-2 bg-[var(--bg-card-hover)] hover:bg-[var(--bg-muted)] text-[var(--text-secondary)] rounded-xl text-xs font-semibold border border-[var(--border-color)]"
                >
                  Close Modal
                </button>
              </div>
            ) : detailedStudent ? (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-[var(--border-subtle)]">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-[var(--primary-subtle)] text-[var(--primary)] font-bold text-lg flex items-center justify-center border border-[var(--primary-border)] shrink-0 shadow-[var(--shadow-md)]">
                      {getInitials(detailedStudent.name)}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-bold text-[var(--text-primary)]">
                          {detailedStudent.name}
                        </h2>

                        {detailedStudent.verificationStatus === "approved" ? (
                          <span className="px-2.5 py-0.5 bg-[var(--accent-emerald-bg)] text-[var(--accent-emerald)] border border-[var(--accent-emerald)]/30 text-[10px] font-extrabold rounded-full uppercase tracking-wider flex items-center gap-1">
                            <CheckCircle2 size={11} />
                            Verified
                          </span>
                        ) : detailedStudent.verificationStatus ===
                          "rejected" ? (
                          <span className="px-2.5 py-0.5 bg-[var(--accent-rose-bg)] text-[var(--accent-rose)] border border-[var(--accent-rose)]/30 text-[10px] font-extrabold rounded-full uppercase tracking-wider flex items-center gap-1">
                            <XCircle size={11} />
                            Rejected
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 bg-[var(--accent-amber-bg)] text-[var(--accent-amber)] border border-[var(--accent-amber)]/30 text-[10px] font-extrabold rounded-full uppercase tracking-wider flex items-center gap-1">
                            <Clock size={11} />
                            Pending
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--text-muted)] mt-1">
                        <span className="flex items-center gap-1">
                          <Mail size={13} className="text-[var(--primary)]" />
                          {detailedStudent.email}
                        </span>

                        {detailedStudent.phone && (
                          <span className="flex items-center gap-1">
                            <Phone
                              size={13}
                              className="text-[var(--accent-emerald)]"
                            />
                            {detailedStudent.phone}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 sm:mr-12 mt-2 sm:mt-0">
                    {detailedStudent.verificationStatus !== "approved" && (
                      <button
                        disabled={
                          actionLoadingId === detailedStudent.studentProfileId
                        }
                        onClick={() =>
                          handleVerifyStudent(
                            detailedStudent.studentProfileId,
                            "approved",
                          )
                        }
                        className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[var(--accent-emerald)] hover:opacity-90 text-[var(--text-on-primary)] rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-[var(--shadow-sm)] disabled:opacity-50"
                      >
                        <CheckCircle2 size={14} />
                        Approve Student
                      </button>
                    )}

                    {detailedStudent.verificationStatus !== "rejected" && (
                      <button
                        disabled={
                          actionLoadingId === detailedStudent.studentProfileId
                        }
                        onClick={() =>
                          handleVerifyStudent(
                            detailedStudent.studentProfileId,
                            "rejected",
                          )
                        }
                        className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[var(--accent-rose-bg)] text-[var(--accent-rose)] border border-[var(--accent-rose)]/30 hover:bg-[var(--accent-rose)] hover:text-[var(--text-on-primary)] rounded-xl text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
                      >
                        <XCircle size={14} />
                        Reject
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 bg-[var(--bg-muted)] p-4 rounded-xl border border-[var(--border-subtle)]">
                  <div>
                    <span className="text-[10px] text-[var(--text-muted)] uppercase font-semibold block">
                      Student ID
                    </span>
                    <span className="text-xs font-bold text-[var(--primary)] mt-0.5 block">
                      {detailedStudent.studentId || "Not provided"}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-[var(--text-muted)] uppercase font-semibold block">
                      Roll Number
                    </span>
                    <span className="text-xs font-bold text-[var(--text-primary)] mt-0.5 block">
                      {detailedStudent.rollNumber || "Not provided"}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-[var(--text-muted)] uppercase font-semibold block">
                      Degree / Major
                    </span>
                    <span className="text-xs font-bold text-[var(--text-primary)] mt-0.5 block">
                      {detailedStudent.degree || "N/A"}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-[var(--text-muted)] uppercase font-semibold block">
                      Department
                    </span>
                    <span className="text-xs font-bold text-[var(--text-primary)] mt-0.5 block">
                      {detailedStudent.department || "N/A"}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-[var(--text-muted)] uppercase font-semibold block">
                      Current Semester
                    </span>
                    <span className="text-xs font-bold text-[var(--text-primary)] mt-0.5 block">
                      {detailedStudent.currentSem || "N/A"}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-[var(--text-muted)] uppercase font-semibold block">
                      Academic CGPA
                    </span>
                    <span className="text-xs font-bold text-[var(--accent-cyan)] mt-0.5 block">
                      {detailedStudent.cgpa !== null
                        ? `${detailedStudent.cgpa} / 10.0`
                        : "Not provided"}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                    <Award size={16} className="text-[var(--primary)]" />
                    Verified Skill Evaluations ({detailedStudent.skills.length})
                  </h3>

                  {detailedStudent.skills.length === 0 ? (
                    <div className="p-4 bg-[var(--bg-muted)] border border-[var(--border-color)] rounded-xl text-center text-[var(--text-muted)] text-xs">
                      No skill evaluations recorded for this student yet.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {detailedStudent.skills.map((sk) => {
                        let levelColor =
                          "text-[var(--accent-rose)] bg-[var(--accent-rose-bg)] border-[var(--accent-rose)]/20";
                        let levelText = "Novice";

                        if (sk.proficiencyScore >= 80) {
                          levelColor =
                            "text-[var(--accent-emerald)] bg-[var(--accent-emerald-bg)] border-[var(--accent-emerald)]/20";
                          levelText = "Expert";
                        } else if (sk.proficiencyScore >= 65) {
                          levelColor =
                            "text-[var(--accent-cyan)] bg-[var(--accent-cyan-bg)] border-[var(--accent-cyan)]/20";
                          levelText = "Proficient";
                        } else if (sk.proficiencyScore >= 50) {
                          levelColor =
                            "text-[var(--accent-amber)] bg-[var(--accent-amber-bg)] border-[var(--accent-amber)]/20";
                          levelText = "Intermediate";
                        }

                        return (
                          <div
                            key={sk.studentSkillId}
                            className="bg-[var(--bg-muted)] border border-[var(--border-subtle)] rounded-xl p-3.5 space-y-2"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-xs text-[var(--text-primary)]">
                                {sk.skillName}
                              </span>

                              <span
                                className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold border ${levelColor}`}
                              >
                                {sk.proficiencyScore}% • {levelText}
                              </span>
                            </div>

                            <div className="w-full h-1.5 bg-[var(--bg-card-hover)] rounded-full overflow-hidden">
                              <div
                                className="h-full bg-[var(--primary)] rounded-full"
                                style={{
                                  width: `${sk.proficiencyScore}%`,
                                }}
                              />
                            </div>

                            <span className="text-[10px] text-[var(--text-muted)] block">
                              Category: {sk.category}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="space-y-3 pt-2">
                  <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                    <FileText
                      size={16}
                      className="text-[var(--accent-emerald)]"
                    />
                    Digital Documents & Resume (
                    {detailedStudent.documents?.length || 0})
                  </h3>

                  {!detailedStudent.documents ||
                  detailedStudent.documents.length === 0 ? (
                    <div className="p-4 bg-[var(--bg-muted)] border border-[var(--border-color)] rounded-xl text-center text-[var(--text-muted)] text-xs">
                      No documents uploaded by this student yet.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {detailedStudent.documents.map((doc) => (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between p-3 bg-[var(--bg-muted)] border border-[var(--border-subtle)] rounded-xl text-xs"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-[var(--accent-emerald-bg)] border border-[var(--accent-emerald)]/20 text-[var(--accent-emerald)] rounded-lg">
                              <FileText size={16} />
                            </div>

                            <div>
                              <span className="font-bold text-[var(--text-primary)] block">
                                {doc.originalName}
                              </span>
                              <span className="text-[10px] text-[var(--text-muted)] uppercase">
                                {doc.documentType}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                const inlineUrl = getViewUrl(doc.fileUrl);

                                setPreviewDoc({
                                  url: inlineUrl,
                                  title: `${detailedStudent.name} - ${doc.originalName}`,
                                });
                              }}
                              className="flex items-center gap-1 px-3 py-1 bg-[var(--primary-subtle)] hover:bg-[var(--primary)] text-[var(--primary)] hover:text-[var(--text-on-primary)] border border-[var(--primary-border)] rounded-lg text-xs font-semibold transition-all cursor-pointer"
                            >
                              <Eye size={12} />
                              View Document
                            </button>

                            <a
                              href={getDownloadUrl(doc.fileUrl)}
                              download={doc.originalName}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-1 px-3 py-1 bg-[var(--bg-card-hover)] hover:bg-[var(--bg-elevated)] text-[var(--text-secondary)] rounded-lg text-xs font-semibold border border-[var(--border-color)] transition-all cursor-pointer"
                            >
                              <Download size={12} />
                              Download
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-3 pt-2">
                  <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                    <Briefcase
                      size={16}
                      className="text-[var(--accent-amber)]"
                    />
                    Internship & Placement Applications (
                    {detailedStudent.applications?.length || 0})
                  </h3>

                  {!detailedStudent.applications ||
                  detailedStudent.applications.length === 0 ? (
                    <div className="p-4 bg-[var(--bg-muted)] border border-[var(--border-color)] rounded-xl text-center text-[var(--text-muted)] text-xs">
                      This student has not submitted any job/internship
                      applications yet.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {detailedStudent.applications.map((app) => {
                        const statusLower = (
                          app.status || "applied"
                        ).toLowerCase();

                        let appBadge =
                          "bg-[var(--primary-subtle)] text-[var(--primary)] border-[var(--primary-border)]";

                        if (statusLower === "selected") {
                          appBadge =
                            "bg-[var(--accent-emerald-bg)] text-[var(--accent-emerald)] border-[var(--accent-emerald)]/30";
                        } else if (statusLower === "shortlisted") {
                          appBadge =
                            "bg-[var(--accent-cyan-bg)] text-[var(--accent-cyan)] border-[var(--accent-cyan)]/30";
                        } else if (statusLower === "rejected") {
                          appBadge =
                            "bg-[var(--accent-rose-bg)] text-[var(--accent-rose)] border-[var(--accent-rose)]/30";
                        }

                        return (
                          <div
                            key={app.applicationId}
                            className="flex items-center justify-between p-3 bg-[var(--bg-muted)] border border-[var(--border-subtle)] rounded-xl text-xs"
                          >
                            <div>
                              <span className="font-bold text-[var(--text-primary)] block">
                                {app.opportunityTitle}
                              </span>

                              <span className="text-[10px] text-[var(--text-muted)]">
                                {app.companyName} • {app.opportunityType}
                              </span>
                            </div>

                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase border ${appBadge}`}
                            >
                              {app.status}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {previewDoc && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[var(--bg-app)]/85 backdrop-blur-md">
          <div className="relative w-full max-w-4xl bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-2xl shadow-[var(--shadow-xl)] overflow-hidden flex flex-col h-[85vh]">
            <div className="flex items-center justify-between p-4 border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)]">
              <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2 truncate">
                <FileText size={16} className="text-[var(--primary)]" />
                {previewDoc.title}
              </h3>

              <div className="flex items-center gap-2">
                <a
                  href={previewDoc.url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1 bg-[var(--bg-card-hover)] hover:bg-[var(--bg-muted)] text-[var(--text-secondary)] rounded-lg text-xs font-semibold transition-all flex items-center gap-1 border border-[var(--border-color)]"
                >
                  <ExternalLink size={12} />
                  Open in New Tab
                </a>

                <button
                  onClick={() => setPreviewDoc(null)}
                  className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] bg-[var(--bg-card-hover)] hover:bg-[var(--bg-muted)] rounded-xl transition-all cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="flex-1 bg-[var(--bg-app)] p-2 overflow-hidden">
              <iframe
                src={previewDoc.url}
                title={previewDoc.title}
                className="w-full h-full rounded-xl border-0"
              />
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default InstitutionStudents;
