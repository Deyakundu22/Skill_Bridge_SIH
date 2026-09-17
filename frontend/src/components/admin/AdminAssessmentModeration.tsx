import React, { useState, useEffect, useCallback } from "react";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  AlertCircle,
  Edit,
  Trash2,
  FileQuestion,
  Sparkles,
  Building2,
  GraduationCap,
  ShieldCheck,
  X,
  Send,
  RotateCw,
  Eye,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  Layers,
  Save,
  Target,
  Sliders,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { API_BASE_URL } from "../../config/api";

interface AdminQuestionItem {
  id: number;
  skill_id: number;
  skill_name: string;
  skill_category: string;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: "A" | "B" | "C" | "D";
  difficulty: "Easy" | "Medium" | "Hard";
  explanation: string;
  source_type: "industry" | "faculty" | "admin" | "system";
  source_company_id?: number | null;
  contributor_company?: string | null;
  contributor_name?: string | null;
  contributor_role?: string | null;
  status: "pending" | "approved" | "rejected";
  rejection_reason?: string | null;
  created_at: string;
  updated_at: string;
}

interface SkillRequestItem {
  id: number;
  requested_by: number;
  requester_name: string;
  requester_role: string;
  skill_name: string;
  category: string;
  reason?: string | null;
  status: "pending" | "approved" | "rejected";
  rejection_reason?: string | null;
  created_at: string;
}

interface SkillSummaryItem {
  skillId: number;
  skillName: string;
  skillCategory?: string;
  targetQuestions: number;
  totalQuestions: number;
  approvedQuestions: number;
  pendingQuestions: number;
  rejectedQuestions: number;
}

export const AdminAssessmentModeration: React.FC = () => {
  const { token } = useAuth();
  const [questions, setQuestions] = useState<AdminQuestionItem[]>([]);
  const [skillRequests, setSkillRequests] = useState<SkillRequestItem[]>([]);
  const [skillsList, setSkillsList] = useState<{ id: number; name: string }[]>(
    [],
  );
  const [counts, setCounts] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });

  const [skillSummary, setSkillSummary] = useState<SkillSummaryItem[]>([]);
  const [summaryLoading, setSummaryLoading] = useState<boolean>(true);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const [editingTargetSkillId, setEditingTargetSkillId] = useState<
    number | null
  >(null);
  const [targetInputVal, setTargetInputVal] = useState<number>(10);

  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [activeSubTab, setActiveSubTab] = useState<
    "questions" | "summary" | "skills"
  >("questions");

  const [statusFilter, setStatusFilter] = useState<string>("pending");
  const [skillFilter, setSkillFilter] = useState<string>("all");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");

  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(20);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalFiltered, setTotalFiltered] = useState<number>(0);

  const [viewingQuestion, setViewingQuestion] =
    useState<AdminQuestionItem | null>(null);
  const [selectedQuestionForReject, setSelectedQuestionForReject] =
    useState<AdminQuestionItem | null>(null);
  const [rejectionReasonText, setRejectionReasonText] = useState<string>("");
  const [editingQuestion, setEditingQuestion] =
    useState<AdminQuestionItem | null>(null);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  const [editFormData, setEditFormData] = useState({
    question: "",
    option_a: "",
    option_b: "",
    option_c: "",
    option_d: "",
    correct_option: "A" as "A" | "B" | "C" | "D",
    difficulty: "Medium" as "Easy" | "Medium" | "Hard",
    explanation: "",
  });

  useEffect(() => {
    const fetchSkills = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/skills`);
        const data = await res.json();
        if (res.ok) {
          if (Array.isArray(data)) {
            setSkillsList(data);
          } else if (data && Array.isArray(data.skills)) {
            setSkillsList(data.skills);
          }
        }
      } catch (err) {
        console.error("Error fetching skills list:", err);
      }
    };
    fetchSkills();
  }, []);

  const fetchSkillSummary = useCallback(async () => {
    const authToken = token || localStorage.getItem("skillbridge_token");
    if (!authToken) return;

    setSummaryLoading(true);
    setSummaryError(null);

    try {
      const res = await fetch(
        `${API_BASE_URL}/admin/assessment/questions/skill-summary`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
        },
      );
      const data = await res.json();
      if (res.ok && data.success) {
        setSkillSummary(data.summary || []);
      } else {
        setSummaryError(data.message || "Unable to load question statistics.");
      }
    } catch (err: any) {
      console.error("fetchSkillSummary error:", err);
      setSummaryError("Unable to load question statistics.");
    } finally {
      setSummaryLoading(false);
    }
  }, [token]);

  const fetchModerationData = useCallback(async () => {
    const authToken = token || localStorage.getItem("skillbridge_token");
    if (!authToken) return;

    setLoading(true);
    setErrorMsg(null);

    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append("status", statusFilter);
      if (skillFilter !== "all") params.append("skill_id", skillFilter);
      if (difficultyFilter !== "all")
        params.append("difficulty", difficultyFilter);
      if (sourceFilter !== "all") params.append("source_type", sourceFilter);
      if (searchTerm.trim()) params.append("search", searchTerm.trim());
      params.append("page", page.toString());
      params.append("limit", limit.toString());

      const qUrl = `${API_BASE_URL}/admin/assessment/questions?${params.toString()}`;
      const resQ = await fetch(qUrl, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const dataQ = await resQ.json();

      if (resQ.ok && dataQ.success) {
        setQuestions(dataQ.questions || []);
        if (dataQ.counts) {
          setCounts(dataQ.counts);
        }
        if (dataQ.pagination) {
          setTotalPages(dataQ.pagination.totalPages || 1);
          setTotalFiltered(dataQ.pagination.total || 0);
        }
      } else {
        setErrorMsg(
          dataQ.message || "Failed to fetch questions for moderation.",
        );
      }

      const resSR = await fetch(`${API_BASE_URL}/admin/skill-requests`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const dataSR = await resSR.json();

      if (resSR.ok && dataSR.success) {
        setSkillRequests(dataSR.skill_requests || []);
      }

      fetchSkillSummary();
    } catch (err: any) {
      console.error("fetchModerationData error:", err);
      setErrorMsg("Network error fetching moderation records.");
    } finally {
      setLoading(false);
    }
  }, [
    token,
    statusFilter,
    skillFilter,
    difficultyFilter,
    sourceFilter,
    searchTerm,
    page,
    limit,
    fetchSkillSummary,
  ]);

  useEffect(() => {
    fetchModerationData();
  }, [fetchModerationData]);

  const handleSaveTargetQuestions = async (
    skillId: number,
    countVal: number,
  ) => {
    const authToken = token || localStorage.getItem("skillbridge_token");
    if (!authToken) return;

    setActionLoading(true);

    try {
      const res = await fetch(
        `${API_BASE_URL}/admin/assessment/skills/${skillId}/target-questions`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ target_questions: countVal }),
        },
      );

      const data = await res.json();

      if (res.ok && data.success) {
        setSuccessMsg(
          data.message || `Updated target questions to ${countVal}.`,
        );
        setTimeout(() => setSuccessMsg(null), 3000);
        setEditingTargetSkillId(null);
        fetchSkillSummary();
      } else {
        setErrorMsg(data.message || "Failed to update target questions.");
      }
    } catch (err: any) {
      setErrorMsg("Error updating target questions.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleTabChange = (newStatus: string) => {
    setStatusFilter(newStatus);
    setPage(1);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchModerationData();
  };

  const handleApproveQuestion = async (id: number) => {
    const authToken = token || localStorage.getItem("skillbridge_token");
    if (!authToken) return;

    setActionLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch(
        `${API_BASE_URL}/admin/assessment/questions/${id}/approve`,
        {
          method: "PUT",
          headers: { Authorization: `Bearer ${authToken}` },
        },
      );

      const result = await res.json();

      if (res.ok && result.success) {
        setSuccessMsg(
          result.message ||
            "Question approved and added to active assessment pool.",
        );
        setTimeout(() => setSuccessMsg(null), 4000);

        if (viewingQuestion?.id === id) {
          setViewingQuestion((prev) =>
            prev ? { ...prev, status: "approved" } : null,
          );
        }

        fetchModerationData();
      } else {
        setErrorMsg(result.message || "Failed to approve question.");
      }
    } catch (err: any) {
      setErrorMsg("Error approving question.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectQuestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedQuestionForReject) return;

    if (!rejectionReasonText.trim()) {
      setErrorMsg("Rejection reason is required.");
      return;
    }

    const authToken = token || localStorage.getItem("skillbridge_token");
    if (!authToken) return;

    setActionLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch(
        `${API_BASE_URL}/admin/assessment/questions/${selectedQuestionForReject.id}/reject`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            rejection_reason: rejectionReasonText.trim(),
          }),
        },
      );

      const result = await res.json();

      if (res.ok && result.success) {
        setSuccessMsg("Question rejected successfully.");
        setTimeout(() => setSuccessMsg(null), 4000);

        if (viewingQuestion?.id === selectedQuestionForReject.id) {
          setViewingQuestion((prev) =>
            prev
              ? {
                  ...prev,
                  status: "rejected",
                  rejection_reason: rejectionReasonText.trim(),
                }
              : null,
          );
        }

        setSelectedQuestionForReject(null);
        setRejectionReasonText("");
        fetchModerationData();
      } else {
        setErrorMsg(result.message || "Failed to reject question.");
      }
    } catch (err: any) {
      setErrorMsg("Error rejecting question.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteQuestion = async (id: number) => {
    if (
      !window.confirm(
        "Are you sure you want to permanently delete this question?",
      )
    )
      return;

    const authToken = token || localStorage.getItem("skillbridge_token");
    if (!authToken) return;

    setActionLoading(true);

    try {
      const res = await fetch(
        `${API_BASE_URL}/admin/assessment/questions/${id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${authToken}` },
        },
      );

      const result = await res.json();

      if (res.ok && result.success) {
        setSuccessMsg("Question deleted successfully.");
        setTimeout(() => setSuccessMsg(null), 3000);

        if (viewingQuestion?.id === id) {
          setViewingQuestion(null);
        }

        fetchModerationData();
      } else {
        setErrorMsg(result.message || "Failed to delete question.");
      }
    } catch (err: any) {
      setErrorMsg("Error deleting question.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenEditModal = (q: AdminQuestionItem) => {
    setEditingQuestion(q);
    setEditFormData({
      question: q.question,
      option_a: q.option_a,
      option_b: q.option_b,
      option_c: q.option_c,
      option_d: q.option_d,
      correct_option: q.correct_option,
      difficulty: q.difficulty,
      explanation: q.explanation,
    });
  };

  const handleAdminEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingQuestion) return;

    const authToken = token || localStorage.getItem("skillbridge_token");
    if (!authToken) return;

    setActionLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch(
        `${API_BASE_URL}/admin/assessment/questions/${editingQuestion.id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(editFormData),
        },
      );

      const result = await res.json();

      if (res.ok && result.success) {
        setSuccessMsg("Question updated by Admin.");
        setTimeout(() => setSuccessMsg(null), 4000);
        setEditingQuestion(null);

        if (viewingQuestion?.id === editingQuestion.id) {
          setViewingQuestion((prev) =>
            prev ? { ...prev, ...editFormData } : null,
          );
        }

        fetchModerationData();
      } else {
        setErrorMsg(result.message || "Failed to update question.");
      }
    } catch (err: any) {
      setErrorMsg("Error updating question.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveSkillRequest = async (id: number) => {
    const authToken = token || localStorage.getItem("skillbridge_token");
    if (!authToken) return;

    setActionLoading(true);

    try {
      const res = await fetch(
        `${API_BASE_URL}/admin/skill-requests/${id}/approve`,
        {
          method: "PUT",
          headers: { Authorization: `Bearer ${authToken}` },
        },
      );

      const result = await res.json();

      if (res.ok && result.success) {
        setSuccessMsg(
          result.message || "Skill approved and added to master registry.",
        );
        setTimeout(() => setSuccessMsg(null), 4000);
        fetchModerationData();
      } else {
        setErrorMsg(result.message || "Failed to approve skill request.");
      }
    } catch (err: any) {
      setErrorMsg("Error approving skill request.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectSkillRequest = async (id: number) => {
    const authToken = token || localStorage.getItem("skillbridge_token");
    if (!authToken) return;

    const reason = window.prompt(
      "Enter rejection reason for this skill request:",
    );
    if (reason === null) return;

    setActionLoading(true);

    try {
      const res = await fetch(
        `${API_BASE_URL}/admin/skill-requests/${id}/reject`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ rejection_reason: reason }),
        },
      );

      const result = await res.json();

      if (res.ok && result.success) {
        setSuccessMsg("Skill request rejected.");
        setTimeout(() => setSuccessMsg(null), 3000);
        fetchModerationData();
      } else {
        setErrorMsg(result.message || "Failed to reject skill request.");
      }
    } catch (err: any) {
      setErrorMsg("Error rejecting skill request.");
    } finally {
      setActionLoading(false);
    }
  };

  const pendingSkillRequestsCount = skillRequests.filter(
    (s) => s.status === "pending",
  ).length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-[var(--shadow-sm)]">
          <div className="flex items-center justify-between text-[var(--text-muted)] text-xs font-medium">
            <span>Total Questions</span>
            <FileQuestion size={16} className="text-[var(--primary)]" />
          </div>
          <div className="text-2xl font-bold text-[var(--text-primary)] mt-2">
            {counts.total}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--accent-amber)]/30 shadow-[var(--shadow-sm)]">
          <div className="flex items-center justify-between text-[var(--text-muted)] text-xs font-medium">
            <span>Pending Review</span>
            <Clock
              size={16}
              className="text-[var(--accent-amber)] animate-pulse"
            />
          </div>
          <div className="text-2xl font-bold text-[var(--accent-amber)] mt-2">
            {counts.pending}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--accent-emerald)]/30 shadow-[var(--shadow-sm)]">
          <div className="flex items-center justify-between text-[var(--text-muted)] text-xs font-medium">
            <span>Approved & Live</span>
            <CheckCircle2 size={16} className="text-[var(--accent-emerald)]" />
          </div>
          <div className="text-2xl font-bold text-[var(--accent-emerald)] mt-2">
            {counts.approved}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--accent-rose)]/30 shadow-[var(--shadow-sm)]">
          <div className="flex items-center justify-between text-[var(--text-muted)] text-xs font-medium">
            <span>Rejected</span>
            <XCircle size={16} className="text-[var(--accent-rose)]" />
          </div>
          <div className="text-2xl font-bold text-[var(--accent-rose)] mt-2">
            {counts.rejected}
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-[var(--accent-emerald-bg)] border border-[var(--accent-emerald)]/30 text-[var(--accent-emerald)] text-sm flex items-center gap-3">
          <CheckCircle2 size={18} className="shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-[var(--accent-rose-bg)] border border-[var(--accent-rose)]/30 text-[var(--accent-rose)] text-sm flex items-center gap-3">
          <AlertCircle size={18} className="shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-3 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl shadow-[var(--shadow-sm)]">
        <div className="flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveSubTab("questions")}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === "questions"
                ? "bg-[var(--primary-lighter)] text-[var(--text-on-primary)] shadow-[var(--shadow-md)]"
                : "bg-[var(--bg-muted)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]"
            }`}
          >
            <ShieldCheck size={15} />
            <span>Question Submissions Moderation</span>
            {counts.pending > 0 && (
              <span className="w-5 h-5 rounded-full bg-[var(--accent-amber)] text-[var(--text-on-primary)] font-bold text-[10px] flex items-center justify-center">
                {counts.pending}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab("summary")}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === "summary"
                ? "bg-[var(--primary)] text-[var(--text-on-primary)] shadow-[var(--shadow-md)]"
                : "bg-[var(--bg-muted)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]"
            }`}
          >
            <Layers size={15} className="text-[var(--primary)]" />
            <span>Question Bank & Skill Config</span>
          </button>

          <button
            onClick={() => setActiveSubTab("skills")}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === "skills"
                ? "bg-[var(--primary)] text-[var(--text-on-primary)] shadow-[var(--shadow-md)]"
                : "bg-[var(--bg-muted)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]"
            }`}
          >
            <Sparkles size={15} className="text-[var(--accent-amber)]" />
            <span>Requested Skills</span>
            {pendingSkillRequestsCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-[var(--accent-amber)] text-[var(--text-on-primary)] font-bold text-[10px] flex items-center justify-center">
                {pendingSkillRequestsCount}
              </span>
            )}
          </button>
        </div>

        <button
          onClick={fetchModerationData}
          disabled={loading}
          className="px-3 py-1.5 bg-[var(--bg-muted)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-lg text-xs font-medium flex items-center gap-2 cursor-pointer self-end md:self-auto shrink-0 disabled:opacity-50"
        >
          <RotateCw size={13} className={loading ? "animate-spin" : ""} />
          <span>Refresh</span>
        </button>
      </div>

      {activeSubTab === "questions" && (
        <>
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 border-b border-[var(--border-color)] pb-2 overflow-x-auto">
              {[
                {
                  key: "pending",
                  label: "Pending Questions",
                  count: counts.pending,
                },
                { key: "approved", label: "Approved", count: counts.approved },
                { key: "rejected", label: "Rejected", count: counts.rejected },
                { key: "all", label: "All Questions", count: counts.total },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => handleTabChange(tab.key)}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                    statusFilter === tab.key
                      ? "bg-[var(--primary-lighter)] text-[var(--text-primary)] shadow-[var(--shadow-md)]"
                      : "bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-color)]"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] ${
                      statusFilter === tab.key
                        ? "bg-[var(--primary-light)]/30 text-[var(--text-on-primary)]"
                        : "bg-[var(--bg-muted)] text-[var(--text-muted)]"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] flex flex-wrap items-center justify-between gap-3 shadow-[var(--shadow-sm)]">
              <form
                onSubmit={handleSearchSubmit}
                className="flex-1 min-w-[240px]"
              >
                <div className="relative">
                  <Search
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
                  />
                  <input
                    type="text"
                    placeholder="Search question text or skill..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--focus-ring)]"
                  />
                </div>
              </form>

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--text-secondary)]">
                  <Filter size={12} className="text-[var(--text-muted)]" />
                  <select
                    value={skillFilter}
                    onChange={(e) => {
                      setSkillFilter(e.target.value);
                      setPage(1);
                    }}
                    className="bg-transparent text-[var(--text-primary)] focus:outline-none cursor-pointer text-xs"
                  >
                    <option value="all" className="bg-[var(--bg-elevated)]">
                      All Skills
                    </option>
                    {skillsList.map((s) => (
                      <option
                        key={s.id}
                        value={s.id.toString()}
                        className="bg-[var(--bg-elevated)]"
                      >
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-1 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--text-secondary)]">
                  <select
                    value={difficultyFilter}
                    onChange={(e) => {
                      setDifficultyFilter(e.target.value);
                      setPage(1);
                    }}
                    className="bg-transparent text-[var(--text-primary)] focus:outline-none cursor-pointer text-xs"
                  >
                    <option value="all" className="bg-[var(--bg-elevated)]">
                      All Difficulties
                    </option>
                    <option value="Easy" className="bg-[var(--bg-elevated)]">
                      Easy
                    </option>
                    <option value="Medium" className="bg-[var(--bg-elevated)]">
                      Medium
                    </option>
                    <option value="Hard" className="bg-[var(--bg-elevated)]">
                      Hard
                    </option>
                  </select>
                </div>

                <div className="flex items-center gap-1 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--text-secondary)]">
                  <select
                    value={sourceFilter}
                    onChange={(e) => {
                      setSourceFilter(e.target.value);
                      setPage(1);
                    }}
                    className="bg-transparent text-[var(--text-primary)] focus:outline-none cursor-pointer text-xs"
                  >
                    <option value="all" className="bg-[var(--bg-elevated)]">
                      All Sources
                    </option>
                    <option
                      value="industry"
                      className="bg-[var(--bg-elevated)]"
                    >
                      Industry
                    </option>
                    <option value="faculty" className="bg-[var(--bg-elevated)]">
                      Faculty
                    </option>
                    <option value="admin" className="bg-[var(--bg-elevated)]">
                      Admin
                    </option>
                    <option value="system" className="bg-[var(--bg-elevated)]">
                      System Base
                    </option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-[var(--text-muted)] text-sm bg-[var(--bg-muted)] rounded-xl border border-[var(--border-color)]">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-[var(--primary)] border-t-transparent mb-3" />
              <p>Loading assessment questions...</p>
            </div>
          ) : questions.length === 0 ? (
            <div className="p-12 text-center bg-[var(--bg-muted)] rounded-xl border border-[var(--border-color)] text-[var(--text-muted)] space-y-2">
              <CheckCircle2
                size={40}
                className="mx-auto text-[var(--accent-emerald)]"
              />
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                No Questions Found
              </h3>
              <p className="text-xs">
                No questions matched your filter or search criteria.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] shadow-[var(--shadow-md)]">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[var(--bg-muted)] text-[var(--text-muted)] font-semibold border-b border-[var(--border-color)] uppercase tracking-wider text-[11px]">
                      <th className="py-3 px-4">Question</th>
                      <th className="py-3 px-4">Skill</th>
                      <th className="py-3 px-4">Difficulty</th>
                      <th className="py-3 px-4">Source</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-[var(--border-subtle)]">
                    {questions.map((q) => (
                      <tr
                        key={q.id}
                        className="hover:bg-[var(--bg-card-hover)] transition-colors"
                      >
                        <td className="py-3.5 px-4 max-w-md">
                          <p className="font-semibold text-[var(--text-primary)] line-clamp-2">
                            {q.question}
                          </p>
                          <span className="text-[10px] text-[var(--text-muted)] block mt-0.5">
                            Added {new Date(q.created_at).toLocaleDateString()}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="px-2.5 py-1 rounded-full bg-[var(--primary-subtle)] text-[var(--primary)] border border-[var(--primary-border)] text-[11px] font-medium">
                            {q.skill_name}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                              q.difficulty === "Easy"
                                ? "bg-[var(--accent-emerald-bg)] text-[var(--accent-emerald)] border-[var(--accent-emerald)]/30"
                                : q.difficulty === "Hard"
                                  ? "bg-[var(--accent-rose-bg)] text-[var(--accent-rose)] border-[var(--accent-rose)]/30"
                                  : "bg-[var(--accent-amber-bg)] text-[var(--accent-amber)] border-[var(--accent-amber)]/30"
                            }`}
                          >
                            {q.difficulty}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 text-[11px] text-[var(--text-secondary)]">
                            {q.source_type === "industry" ? (
                              <Building2
                                size={13}
                                className="text-[var(--accent-purple)] shrink-0"
                              />
                            ) : q.source_type === "faculty" ? (
                              <GraduationCap
                                size={13}
                                className="text-[var(--accent-purple)] shrink-0"
                              />
                            ) : (
                              <UserCheck
                                size={13}
                                className="text-[var(--primary)] shrink-0"
                              />
                            )}

                            <span
                              className="truncate max-w-[120px]"
                              title={
                                q.contributor_company ||
                                q.contributor_name ||
                                q.source_type
                              }
                            >
                              {q.contributor_company ||
                                q.contributor_name ||
                                q.source_type}
                            </span>
                          </span>
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold inline-flex items-center gap-1 border ${
                              q.status === "approved"
                                ? "bg-[var(--accent-emerald-bg)] text-[var(--accent-emerald)] border-[var(--accent-emerald)]/30"
                                : q.status === "rejected"
                                  ? "bg-[var(--accent-rose-bg)] text-[var(--accent-rose)] border-[var(--accent-rose)]/30"
                                  : "bg-[var(--accent-amber-bg)] text-[var(--accent-amber)] border-[var(--accent-amber)]/30"
                            }`}
                          >
                            {q.status === "approved" && (
                              <CheckCircle2 size={11} />
                            )}
                            {q.status === "pending" && <Clock size={11} />}
                            {q.status === "rejected" && <XCircle size={11} />}
                            <span className="capitalize">{q.status}</span>
                          </span>
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setViewingQuestion(q)}
                              className="px-2.5 py-1 bg-[var(--primary-subtle)] hover:bg-[var(--primary-border)] text-[var(--primary)] border border-[var(--primary-border)] rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
                              title="View Full Question Details"
                            >
                              <Eye size={13} /> View
                            </button>

                            {q.status !== "approved" && (
                              <button
                                onClick={() => handleApproveQuestion(q.id)}
                                disabled={actionLoading}
                                className="p-1.5 bg-[var(--accent-emerald-bg)] hover:bg-[var(--accent-emerald)] text-[var(--accent-emerald)] hover:text-[var(--text-on-primary)] border border-[var(--accent-emerald)]/30 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                                title="Approve Question"
                              >
                                <CheckCircle2 size={14} />
                              </button>
                            )}

                            {q.status !== "rejected" && (
                              <button
                                onClick={() => {
                                  setSelectedQuestionForReject(q);
                                  setRejectionReasonText("");
                                }}
                                disabled={actionLoading}
                                className="p-1.5 bg-[var(--accent-rose-bg)] hover:bg-[var(--accent-rose)] text-[var(--accent-rose)] hover:text-[var(--text-on-primary)] border border-[var(--accent-rose)]/30 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                                title="Reject Question"
                              >
                                <XCircle size={14} />
                              </button>
                            )}

                            <button
                              onClick={() => handleOpenEditModal(q)}
                              className="p-1.5 text-[var(--text-muted)] hover:text-[var(--primary)] hover:bg-[var(--bg-muted)] rounded-lg transition-colors cursor-pointer"
                              title="Edit Question"
                            >
                              <Edit size={14} />
                            </button>

                            <button
                              onClick={() => handleDeleteQuestion(q.id)}
                              className="p-1.5 text-[var(--text-muted)] hover:text-[var(--accent-rose)] hover:bg-[var(--accent-rose-bg)] rounded-lg transition-colors cursor-pointer"
                              title="Delete Question"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl text-xs text-[var(--text-muted)] shadow-[var(--shadow-sm)]">
                <div>
                  Showing{" "}
                  <strong className="text-[var(--text-primary)]">
                    {Math.min((page - 1) * limit + 1, totalFiltered)}
                  </strong>{" "}
                  to{" "}
                  <strong className="text-[var(--text-primary)]">
                    {Math.min(page * limit, totalFiltered)}
                  </strong>{" "}
                  of{" "}
                  <strong className="text-[var(--text-primary)]">
                    {totalFiltered}
                  </strong>{" "}
                  questions
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1 || loading}
                    className="px-3 py-1.5 bg-[var(--bg-muted)] hover:bg-[var(--bg-card-hover)] disabled:opacity-40 text-[var(--text-secondary)] rounded-lg font-medium flex items-center gap-1 transition-all cursor-pointer border border-[var(--border-subtle)]"
                  >
                    <ChevronLeft size={14} /> Previous
                  </button>

                  <span className="px-3 py-1.5 bg-[var(--primary-subtle)] text-[var(--primary)] font-bold border border-[var(--primary-border)] rounded-lg">
                    Page {page} of {totalPages}
                  </span>

                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages || loading}
                    className="px-3 py-1.5 bg-[var(--bg-muted)] hover:bg-[var(--bg-card-hover)] disabled:opacity-40 text-[var(--text-secondary)] rounded-lg font-medium flex items-center gap-1 transition-all cursor-pointer border border-[var(--border-subtle)]"
                  >
                    Next <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {activeSubTab === "summary" && (
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-[var(--shadow-md)] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h3 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
                <Target size={18} className="text-[var(--primary)]" />
                Skill Assessment Configuration & Question Bank Coverage
              </h3>
              <p className="text-xs text-[var(--text-secondary)] mt-1 max-w-2xl">
                Define the required target number of assessment questions for
                each skill and review live bank availability against target
                thresholds.
              </p>
            </div>

            <button
              onClick={fetchSkillSummary}
              disabled={summaryLoading}
              className="px-3.5 py-2 bg-[var(--bg-muted)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shrink-0 disabled:opacity-50"
            >
              <RotateCw
                size={13}
                className={summaryLoading ? "animate-spin" : ""}
              />
              <span>Refresh Summary</span>
            </button>
          </div>

          {summaryLoading ? (
            <div className="p-12 text-center text-[var(--text-muted)] text-sm bg-[var(--bg-muted)] rounded-xl border border-[var(--border-color)]">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-[var(--primary)] border-t-transparent mb-3" />
              <p>
                Loading skill question bank summary and target configurations...
              </p>
            </div>
          ) : summaryError ? (
            <div className="p-4 rounded-xl bg-[var(--accent-rose-bg)] border border-[var(--accent-rose)]/30 text-[var(--accent-rose)] text-xs flex items-center justify-between">
              <span>{summaryError}</span>
              <button
                onClick={fetchSkillSummary}
                className="px-3 py-1 bg-[var(--accent-rose)] text-[var(--text-on-primary)] rounded-lg font-semibold hover:opacity-90 transition-all cursor-pointer"
              >
                Retry
              </button>
            </div>
          ) : skillSummary.length === 0 ? (
            <div className="p-12 text-center bg-[var(--bg-muted)] rounded-xl border border-[var(--border-color)] text-[var(--text-muted)]">
              <p className="text-sm font-semibold">
                No skills registered in database.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] shadow-[var(--shadow-lg)]">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[var(--bg-muted)] text-[var(--text-muted)] font-semibold border-b border-[var(--border-color)] uppercase tracking-wider text-[11px]">
                    <th className="py-3.5 px-4">Skill</th>
                    <th className="py-3.5 px-4 text-center">Admin Target</th>
                    <th className="py-3.5 px-4 text-right">Total Questions</th>
                    <th className="py-3.5 px-4 text-right">Approved</th>
                    <th className="py-3.5 px-4 text-right">Pending</th>
                    <th className="py-3.5 px-4 text-right">Rejected</th>
                    <th className="py-3.5 px-4 text-center">Bank Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[var(--border-subtle)]">
                  {skillSummary.map((item) => {
                    const isTargetMet =
                      item.approvedQuestions >= item.targetQuestions;
                    const deficit = Math.max(
                      0,
                      item.targetQuestions - item.approvedQuestions,
                    );

                    return (
                      <tr
                        key={item.skillId}
                        className="hover:bg-[var(--bg-card-hover)] transition-colors"
                      >
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[var(--text-primary)] text-sm">
                              {item.skillName}
                            </span>

                            {item.skillCategory && (
                              <span className="px-2.5 py-0.5 rounded-full bg-[var(--bg-muted)] text-[var(--text-muted)] border border-[var(--border-subtle)] text-[10px]">
                                {item.skillCategory}
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          {editingTargetSkillId === item.skillId ? (
                            <div className="flex items-center justify-center gap-1.5">
                              <input
                                type="number"
                                min={1}
                                max={100}
                                value={targetInputVal}
                                onChange={(e) =>
                                  setTargetInputVal(
                                    parseInt(e.target.value, 10) || 1,
                                  )
                                }
                                className="w-16 px-2 py-1 bg-[var(--bg-input)] border border-[var(--primary)] rounded-lg text-[var(--text-primary)] font-bold text-center focus:outline-none text-xs"
                              />

                              <button
                                onClick={() =>
                                  handleSaveTargetQuestions(
                                    item.skillId,
                                    targetInputVal,
                                  )
                                }
                                disabled={actionLoading}
                                className="p-1 bg-[var(--accent-emerald)] hover:opacity-90 text-[var(--text-on-primary)] rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                                title="Save Target"
                              >
                                <Save size={13} />
                              </button>

                              <button
                                onClick={() => setEditingTargetSkillId(null)}
                                className="p-1 bg-[var(--bg-muted)] text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-lg border border-[var(--border-subtle)]"
                                title="Cancel"
                              >
                                <X size={13} />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center gap-2">
                              <span className="px-3 py-1 rounded-lg bg-[var(--primary-subtle)] text-[var(--primary)] border border-[var(--primary-border)] font-bold text-xs">
                                {item.targetQuestions} questions
                              </span>

                              <button
                                onClick={() => {
                                  setEditingTargetSkillId(item.skillId);
                                  setTargetInputVal(item.targetQuestions);
                                }}
                                className="p-1 text-[var(--text-muted)] hover:text-[var(--primary)] hover:bg-[var(--bg-muted)] rounded-lg transition-colors cursor-pointer"
                                title="Edit Target Question Count"
                              >
                                <Sliders size={13} />
                              </button>
                            </div>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-right font-semibold text-[var(--text-primary)]">
                          {item.totalQuestions}
                        </td>

                        <td className="py-3.5 px-4 text-right font-bold text-[var(--accent-emerald)] text-sm">
                          {item.approvedQuestions}
                        </td>

                        <td className="py-3.5 px-4 text-right font-medium text-[var(--accent-amber)]">
                          {item.pendingQuestions}
                        </td>

                        <td className="py-3.5 px-4 text-right font-medium text-[var(--accent-rose)]">
                          {item.rejectedQuestions}
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          {isTargetMet ? (
                            <span className="px-2.5 py-1 rounded-full bg-[var(--accent-emerald-bg)] text-[var(--accent-emerald)] border border-[var(--accent-emerald)]/30 text-[11px] font-bold flex items-center justify-center gap-1">
                              <CheckCircle2 size={12} />
                              Target Met ({item.approvedQuestions}/
                              {item.targetQuestions})
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full bg-[var(--accent-rose-bg)] text-[var(--accent-rose)] border border-[var(--accent-rose)]/30 text-[11px] font-bold flex items-center justify-center gap-1">
                              <AlertCircle size={12} />
                              Need {deficit} More
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <button
                            onClick={() => {
                              setSkillFilter(item.skillId.toString());
                              setStatusFilter("all");
                              setPage(1);
                              setActiveSubTab("questions");
                            }}
                            className="px-3 py-1.5 bg-[var(--bg-muted)] hover:bg-[var(--primary)] text-[var(--text-secondary)] hover:text-[var(--text-on-primary)] rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ml-auto border border-[var(--border-subtle)] hover:border-[var(--primary)]"
                          >
                            <Eye size={13} /> View Questions
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeSubTab === "skills" && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)]">
            <h3 className="text-sm font-bold text-[var(--text-primary)]">
              Requested New Skills
            </h3>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Skills requested by Industry partners or Faculty that are not
              currently in the master skills registry.
            </p>
          </div>

          {skillRequests.length === 0 ? (
            <div className="p-12 text-center bg-[var(--bg-muted)] rounded-xl border border-[var(--border-color)] text-[var(--text-muted)]">
              <Sparkles
                size={36}
                className="mx-auto text-[var(--accent-amber)] mb-2"
              />
              <p className="text-sm font-semibold">
                No Skill Addition Requests
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {skillRequests.map((sr) => (
                <div
                  key={sr.id}
                  className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-[var(--shadow-sm)]"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-[var(--text-primary)]">
                        {sr.skill_name}
                      </span>

                      <span className="px-2 py-0.5 rounded bg-[var(--primary-subtle)] text-[var(--primary)] border border-[var(--primary-border)] text-[11px]">
                        {sr.category}
                      </span>

                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-semibold capitalize border ${
                          sr.status === "approved"
                            ? "bg-[var(--accent-emerald-bg)] text-[var(--accent-emerald)] border-[var(--accent-emerald)]/30"
                            : sr.status === "rejected"
                              ? "bg-[var(--accent-rose-bg)] text-[var(--accent-rose)] border-[var(--accent-rose)]/30"
                              : "bg-[var(--accent-amber-bg)] text-[var(--accent-amber)] border-[var(--accent-amber)]/30"
                        }`}
                      >
                        {sr.status}
                      </span>
                    </div>

                    <p className="text-xs text-[var(--text-secondary)] mt-1">
                      Requested by:{" "}
                      <strong className="text-[var(--text-primary)]">
                        {sr.requester_name}
                      </strong>{" "}
                      ({sr.requester_role})
                    </p>

                    {sr.reason && (
                      <p className="text-xs text-[var(--text-secondary)] italic mt-1">
                        "{sr.reason}"
                      </p>
                    )}
                  </div>

                  {sr.status === "pending" && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleApproveSkillRequest(sr.id)}
                        disabled={actionLoading}
                        className="px-3 py-1.5 bg-[var(--accent-emerald)] hover:opacity-90 text-[var(--text-on-primary)] rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        <CheckCircle2 size={13} /> Approve Skill
                      </button>

                      <button
                        onClick={() => handleRejectSkillRequest(sr.id)}
                        disabled={actionLoading}
                        className="px-3 py-1.5 bg-[var(--accent-rose)] hover:opacity-90 text-[var(--text-on-primary)] rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        <XCircle size={13} /> Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {viewingQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--bg-app)]/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-2xl bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-2xl p-6 relative max-h-[90vh] overflow-y-auto custom-scrollbar shadow-[var(--shadow-xl)] text-[var(--text-primary)]">
            <button
              onClick={() => setViewingQuestion(null)}
              className="absolute right-4 top-4 text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1 rounded-lg bg-[var(--bg-muted)] hover:bg-[var(--bg-card-hover)] transition-colors"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2 text-[var(--primary)] text-xs font-bold uppercase tracking-wider mb-2">
              <Eye size={16} /> Question Details Audit
            </div>

            <div className="flex items-center gap-2 flex-wrap mb-4">
              <span className="px-2.5 py-0.5 rounded-full bg-[var(--primary-subtle)] border border-[var(--primary-border)] text-[var(--primary)] text-xs font-bold">
                {viewingQuestion.skill_name}
              </span>

              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                  viewingQuestion.difficulty === "Easy"
                    ? "bg-[var(--accent-emerald-bg)] text-[var(--accent-emerald)] border-[var(--accent-emerald)]/30"
                    : viewingQuestion.difficulty === "Hard"
                      ? "bg-[var(--accent-rose-bg)] text-[var(--accent-rose)] border-[var(--accent-rose)]/30"
                      : "bg-[var(--accent-amber-bg)] text-[var(--accent-amber)] border-[var(--accent-amber)]/30"
                }`}
              >
                {viewingQuestion.difficulty}
              </span>

              <span className="px-2.5 py-0.5 rounded-full bg-[var(--accent-purple-bg)] text-[var(--accent-purple)] border border-[var(--accent-purple)]/30 text-xs font-semibold flex items-center gap-1">
                {viewingQuestion.source_type === "industry" ? (
                  <Building2 size={12} />
                ) : (
                  <GraduationCap size={12} />
                )}
                <span>
                  {viewingQuestion.contributor_company ||
                    viewingQuestion.contributor_name ||
                    viewingQuestion.source_type.toUpperCase()}
                </span>
              </span>

              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 border ${
                  viewingQuestion.status === "approved"
                    ? "bg-[var(--accent-emerald-bg)] text-[var(--accent-emerald)] border-[var(--accent-emerald)]/30"
                    : viewingQuestion.status === "rejected"
                      ? "bg-[var(--accent-rose-bg)] text-[var(--accent-rose)] border-[var(--accent-rose)]/30"
                      : "bg-[var(--accent-amber-bg)] text-[var(--accent-amber)] border-[var(--accent-amber)]/30"
                }`}
              >
                {viewingQuestion.status === "approved" && (
                  <CheckCircle2 size={11} />
                )}
                {viewingQuestion.status === "pending" && <Clock size={11} />}
                {viewingQuestion.status === "rejected" && <XCircle size={11} />}
                <span className="capitalize">{viewingQuestion.status}</span>
              </span>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-[var(--bg-muted)] border border-[var(--border-subtle)] rounded-xl">
                <h4 className="text-xs uppercase font-bold text-[var(--text-muted)] mb-1">
                  Question Prompt
                </h4>
                <p className="text-sm font-semibold text-[var(--text-primary)] whitespace-pre-line">
                  {viewingQuestion.question}
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs uppercase font-bold text-[var(--text-muted)]">
                  Options & Correct Answer
                </h4>

                <div className="grid grid-cols-1 gap-2">
                  {[
                    { key: "A", text: viewingQuestion.option_a },
                    { key: "B", text: viewingQuestion.option_b },
                    { key: "C", text: viewingQuestion.option_c },
                    { key: "D", text: viewingQuestion.option_d },
                  ].map((opt) => (
                    <div
                      key={opt.key}
                      className={`p-3 rounded-xl text-xs flex items-center justify-between border ${
                        viewingQuestion.correct_option === opt.key
                          ? "bg-[var(--accent-emerald-bg)] text-[var(--accent-emerald)] border-[var(--accent-emerald)]/40 font-bold"
                          : "bg-[var(--bg-muted)] text-[var(--text-secondary)] border-[var(--border-subtle)]"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`w-6 h-6 rounded-full text-center leading-6 text-xs font-bold shrink-0 ${
                            viewingQuestion.correct_option === opt.key
                              ? "bg-[var(--accent-emerald)] text-[var(--text-on-primary)]"
                              : "bg-[var(--bg-card-hover)] text-[var(--text-secondary)]"
                          }`}
                        >
                          {opt.key}
                        </span>
                        <span>{opt.text}</span>
                      </div>

                      {viewingQuestion.correct_option === opt.key && (
                        <span className="px-2 py-0.5 rounded bg-[var(--accent-emerald-bg)] text-[var(--accent-emerald)] text-[10px] font-bold uppercase tracking-wider">
                          Correct Answer
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {viewingQuestion.explanation && (
                <div className="p-3 bg-[var(--bg-muted)] border border-[var(--border-subtle)] rounded-xl text-xs space-y-1">
                  <h4 className="font-bold text-[var(--primary)] uppercase tracking-wider text-[11px]">
                    Explanation
                  </h4>
                  <p className="text-[var(--text-secondary)] leading-relaxed">
                    {viewingQuestion.explanation}
                  </p>
                </div>
              )}

              {viewingQuestion.rejection_reason && (
                <div className="p-3 bg-[var(--accent-rose-bg)] border border-[var(--accent-rose)]/30 rounded-xl text-xs space-y-1">
                  <h4 className="font-bold text-[var(--accent-rose)] uppercase tracking-wider text-[11px]">
                    Rejection Reason
                  </h4>
                  <p className="text-[var(--accent-rose)]">
                    {viewingQuestion.rejection_reason}
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-[var(--border-subtle)] flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setViewingQuestion(null)}
                className="px-4 py-2 bg-[var(--bg-muted)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-subtle)] text-[var(--text-secondary)] rounded-xl text-xs font-semibold transition-all cursor-pointer"
              >
                Close
              </button>

              <div className="flex items-center gap-2">
                {viewingQuestion.status !== "approved" && (
                  <button
                    onClick={() => handleApproveQuestion(viewingQuestion.id)}
                    disabled={actionLoading}
                    className="px-4 py-2 bg-[var(--accent-emerald)] hover:opacity-90 text-[var(--text-on-primary)] rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <CheckCircle2 size={14} /> Approve Question
                  </button>
                )}

                {viewingQuestion.status !== "rejected" && (
                  <button
                    onClick={() => {
                      setSelectedQuestionForReject(viewingQuestion);
                      setRejectionReasonText("");
                    }}
                    disabled={actionLoading}
                    className="px-4 py-2 bg-[var(--accent-rose)] hover:opacity-90 text-[var(--text-on-primary)] rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <XCircle size={14} /> Reject Question
                  </button>
                )}

                <button
                  onClick={() => handleOpenEditModal(viewingQuestion)}
                  className="px-4 py-2 bg-[var(--bg-muted)] hover:bg-[var(--bg-card-hover)] text-[var(--primary)] rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer border border-[var(--border-subtle)]"
                >
                  <Edit size={14} /> Edit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedQuestionForReject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--bg-app)]/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-2xl p-6 relative shadow-[var(--shadow-xl)]">
            <button
              onClick={() => setSelectedQuestionForReject(null)}
              className="absolute right-4 top-4 text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1 rounded-lg bg-[var(--bg-muted)] hover:bg-[var(--bg-card-hover)]"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2 text-[var(--accent-rose)] text-xs font-semibold uppercase tracking-wider mb-1">
              <XCircle size={16} /> Moderation Rejection
            </div>

            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-3">
              Specify Rejection Reason
            </h3>

            <form
              onSubmit={handleRejectQuestionSubmit}
              className="space-y-4 text-xs"
            >
              <p className="text-[var(--text-secondary)]">
                Question: "
                <span className="italic">
                  {selectedQuestionForReject.question}
                </span>
                "
              </p>

              <div>
                <label className="block text-[var(--text-secondary)] font-medium mb-1">
                  Reason for Rejection *
                </label>

                <textarea
                  rows={3}
                  placeholder="Explain why this question was rejected (e.g. incorrect answer key, ambiguous wording, duplicate)..."
                  value={rejectionReasonText}
                  onChange={(e) => setRejectionReasonText(e.target.value)}
                  className="w-full p-3 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-rose)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-rose)]/20"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--border-subtle)]">
                <button
                  type="button"
                  onClick={() => setSelectedQuestionForReject(null)}
                  className="px-4 py-2 bg-[var(--bg-muted)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-subtle)] text-[var(--text-secondary)] rounded-xl font-semibold cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-[var(--accent-rose)] hover:opacity-90 text-[var(--text-on-primary)] rounded-xl font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Send size={14} />
                  <span>
                    {actionLoading ? "Rejecting..." : "Submit Rejection"}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--bg-app)]/80 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-2xl bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-2xl p-6 relative max-h-[90vh] overflow-y-auto shadow-[var(--shadow-xl)]">
            <button
              onClick={() => setEditingQuestion(null)}
              className="absolute right-4 top-4 text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1 rounded-lg bg-[var(--bg-muted)] hover:bg-[var(--bg-card-hover)]"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2 text-[var(--primary)] text-xs font-semibold uppercase tracking-wider mb-1">
              <Edit size={16} /> Admin Question Edit
            </div>

            <h3 className="text-xl font-bold text-[var(--text-primary)] mb-4">
              Edit Question directly
            </h3>

            <form
              onSubmit={handleAdminEditSubmit}
              className="space-y-4 text-xs"
            >
              <div>
                <label className="block text-[var(--text-secondary)] font-medium mb-1">
                  Question Prompt
                </label>

                <textarea
                  rows={3}
                  value={editFormData.question}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      question: e.target.value,
                    })
                  }
                  className="w-full p-3 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--focus-ring)]"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[var(--text-secondary)] font-medium">
                  Options
                </label>

                {[
                  { key: "A", keyName: "option_a", val: editFormData.option_a },
                  { key: "B", keyName: "option_b", val: editFormData.option_b },
                  { key: "C", keyName: "option_c", val: editFormData.option_c },
                  { key: "D", keyName: "option_d", val: editFormData.option_d },
                ].map((opt) => (
                  <div key={opt.key} className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setEditFormData({
                          ...editFormData,
                          correct_option: opt.key as "A" | "B" | "C" | "D",
                        })
                      }
                      className={`w-7 h-7 rounded-lg text-xs font-bold shrink-0 ${
                        editFormData.correct_option === opt.key
                          ? "bg-[var(--accent-emerald)] text-[var(--text-on-primary)]"
                          : "bg-[var(--bg-muted)] text-[var(--text-secondary)] border border-[var(--border-subtle)]"
                      }`}
                    >
                      {opt.key}
                    </button>

                    <input
                      type="text"
                      value={opt.val}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          [opt.keyName]: e.target.value,
                        })
                      }
                      className="flex-1 p-2 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)]"
                      required
                    />
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-[var(--text-secondary)] font-medium mb-1">
                  Explanation
                </label>

                <textarea
                  rows={2}
                  value={editFormData.explanation}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      explanation: e.target.value,
                    })
                  }
                  className="w-full p-3 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--focus-ring)]"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--border-subtle)]">
                <button
                  type="button"
                  onClick={() => setEditingQuestion(null)}
                  className="px-4 py-2 bg-[var(--bg-muted)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-subtle)] text-[var(--text-secondary)] rounded-xl font-semibold cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--text-on-primary)] rounded-xl font-semibold flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Send size={14} /> Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAssessmentModeration;
