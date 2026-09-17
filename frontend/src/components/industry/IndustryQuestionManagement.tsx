import React, { useState, useEffect, useRef } from "react";
import {
  HelpCircle,
  PlusCircle,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Search,
  Filter,
  Edit,
  Trash2,
  FileQuestion,
  Award,
  BarChart3,
  X,
  Sparkles,
  Send,
  Building2,
  Upload,
  Download,
  FileText,
  ArrowLeft,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { API_BASE_URL } from "../../config/api";

interface QuestionItem {
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
  source_type: string;
  status: "pending" | "approved" | "rejected";
  rejection_reason?: string | null;
  created_at: string;
  updated_at: string;
}

interface SkillOption {
  id: number;
  name: string;
  category?: string;
}

interface IndustryStats {
  total_questions: number;
  approved: number;
  pending: number;
  rejected: number;
  total_student_attempts: number;
  avg_student_accuracy: number;
}

type BulkQuestion = {
  clientId: string;
  skill_id: string;
  skill: string;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: string;
  difficulty: string;
  explanation: string;
  errors: string[];
};

const QUESTION_TEMPLATE = `QUESTION:
What is the purpose of TypeScript?

SKILL:
TypeScript

A:
To replace JavaScript

B:
To add static typing to JavaScript

C:
To replace HTML

D:
To replace CSS

ANSWER:
B

DIFFICULTY:
Medium

EXPLANATION:
TypeScript adds static typing and additional features to JavaScript.

QUESTION:
Which React hook stores local component state?

SKILL:
React

A:
useEffect

B:
useMemo

C:
useState

D:
useContext

ANSWER:
C

DIFFICULTY:
Easy

EXPLANATION:
useState creates and updates state held by a function component.`;

const normalize = (value: string) =>
  (value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .trim();

export const IndustryQuestionManagement: React.FC = () => {
  const { token } = useAuth();
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [skills, setSkills] = useState<SkillOption[]>([]);
  const [stats, setStats] = useState<IndustryStats>({
    total_questions: 0,
    approved: 0,
    pending: 0,
    rejected: 0,
    total_student_attempts: 0,
    avg_student_accuracy: 0,
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [statusTab, setStatusTab] = useState<string>("all");
  const [selectedSkillFilter, setSelectedSkillFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");

  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState<boolean>(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkStep, setBulkStep] = useState<"input" | "review">("input");
  const [bulkText, setBulkText] = useState("");
  const [bulkQuestions, setBulkQuestions] = useState<BulkQuestion[]>([]);
  const [bulkEditId, setBulkEditId] = useState<string | null>(null);
  const [bulkSubmitting, setBulkSubmitting] = useState(false);
  const [bulkError, setBulkError] = useState<string | null>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const [isSkillModalOpen, setIsSkillModalOpen] = useState<boolean>(false);
  const [editingQuestion, setEditingQuestion] = useState<QuestionItem | null>(
    null,
  );
  const [submitting, setSubmitting] = useState<boolean>(false);

  const [formData, setFormData] = useState({
    skill_id: "",
    question: "",
    option_a: "",
    option_b: "",
    option_c: "",
    option_d: "",
    correct_option: "A" as "A" | "B" | "C" | "D",
    difficulty: "Medium" as "Easy" | "Medium" | "Hard",
    explanation: "",
  });

  const [skillReqData, setSkillReqData] = useState({
    skill_name: "",
    category: "Technical",
    reason: "",
  });

  const fetchQuestionsAndSkills = async () => {
    const authToken = token || localStorage.getItem("skillbridge_token");
    if (!authToken) return;

    setLoading(true);
    setErrorMsg(null);

    try {
      const resQ = await fetch(`${API_BASE_URL}/assessment/questions/my`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const dataQ = await resQ.json();
      if (resQ.ok && dataQ.success) {
        setQuestions(dataQ.questions || []);
      }

      const resS = await fetch(`${API_BASE_URL}/skills`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const dataS = await resS.json();
      if (resS.ok && Array.isArray(dataS)) {
        setSkills(dataS);
      } else if (resS.ok && dataS.skills) {
        setSkills(dataS.skills);
      }

      const resStats = await fetch(
        `${API_BASE_URL}/assessment/stats/industry`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
        },
      );
      const dataStats = await resStats.json();
      if (resStats.ok && dataStats.success) {
        setStats(dataStats.stats);
      }
    } catch (err: any) {
      console.error("Error loading question data:", err);
      setErrorMsg("Failed to load your submitted question bank.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestionsAndSkills();
  }, [token]);

  const validateBulkQuestion = (
    item: Omit<BulkQuestion, "errors">,
    allItems: Omit<BulkQuestion, "errors">[] = [],
  ): BulkQuestion => {
    const errors: string[] = [];
    const normSkill = normalize(item.skill);
    let matchingSkill = skills.find(
      (skill) => normalize(skill.name) === normSkill,
    );

    if (!matchingSkill && normSkill) {
      matchingSkill = skills.find((skill) => {
        const sNorm = normalize(skill.name);
        return sNorm.includes(normSkill) || normSkill.includes(sNorm);
      });
    }

    if (!matchingSkill && skills.length > 0) {
      if (selectedSkillFilter !== "all") {
        matchingSkill = skills.find(
          (s) => String(s.id) === selectedSkillFilter,
        );
      }
      if (!matchingSkill) {
        matchingSkill = skills[0];
      }
    }

    if (!item.question?.trim()) errors.push("Question is required.");
    if (!matchingSkill)
      errors.push("Please select a valid skill for this question.");
    if (!item.option_a?.trim()) errors.push("Option A is required.");
    if (!item.option_b?.trim()) errors.push("Option B is required.");
    if (!item.option_c?.trim()) errors.push("Option C is required.");
    if (!item.option_d?.trim()) errors.push("Option D is required.");

    const correctOption = ["A", "B", "C", "D"].includes(
      item.correct_option?.trim().toUpperCase(),
    )
      ? item.correct_option.trim().toUpperCase()
      : "A";

    let difficulty = item.difficulty?.trim() || "Medium";
    difficulty =
      difficulty.charAt(0).toUpperCase() + difficulty.slice(1).toLowerCase();

    if (!["Easy", "Medium", "Hard"].includes(difficulty)) {
      difficulty = "Medium";
    }

    const explanation =
      item.explanation && item.explanation.trim().length >= 5
        ? item.explanation.trim()
        : item.question?.trim()
          ? `Explanation for: ${item.question.trim()}`
          : "No detailed explanation provided.";

    const duplicate = allItems.some(
      (other) =>
        other.clientId !== item.clientId &&
        normalize(other.skill || matchingSkill?.name || "") ===
          normalize(item.skill || matchingSkill?.name || "") &&
        normalize(other.question) === normalize(item.question),
    );

    if (item.question?.trim() && duplicate) {
      errors.push("This is a duplicate question in the current import batch.");
    }

    return {
      ...item,
      skill: matchingSkill ? matchingSkill.name : item.skill,
      skill_id: matchingSkill
        ? String(matchingSkill.id)
        : skills[0]
          ? String(skills[0].id)
          : "1",
      correct_option: correctOption,
      difficulty,
      explanation,
      errors,
    };
  };

  const parseBulkText = () => {
    setBulkError(null);

    if (!bulkText.trim()) {
      return setBulkError(
        "Paste question content or upload a supported text file before parsing.",
      );
    }

    if (bulkText.length > 50_000) {
      return setBulkError(
        `Import limit exceeded. Your input has ${bulkText.length.toLocaleString()} characters; the maximum is 50,000.`,
      );
    }

    let rawBlocks = bulkText.split(
      /(?:^|\n)\s*(?:[#*`\->\d.\s]*(?:\bQUESTION|\bQ\d+|\bQ\b)\s*[:.\-]\s*)/im,
    );

    if (rawBlocks.length <= 1) {
      rawBlocks = bulkText.split(/(?:^|\n)\s*(?:\d+[\.\)]\s+)/im);
    }

    const blocks = rawBlocks.slice(1);

    if (!blocks.length) {
      return setBulkError(
        "No question blocks were found. Make sure questions start with 'QUESTION:' or '1.' format.",
      );
    }

    if (blocks.length > 100) {
      return setBulkError(
        `Import limit exceeded. ${blocks.length} questions were detected; the maximum is 100.`,
      );
    }

    const labelPattern =
      /(?:^|\n)\s*(?:[#*`\->\s]*)(SKILL|TARGET SKILL|OPTION\s*[ABCD]|[ABCD]|CORRECT\s*ANSWER|CORRECT\s*OPTION|CORRECT|ANSWER|ANS|DIFFICULTY\s*LEVEL|DIFFICULTY|EXPLANATION|EXPLAIN|RATIONALE)(?:[#*`\s]*)\s*[:.\)\-]\s*/gim;

    const cleanVal = (val: string) =>
      val.replace(/^[\s#*`\->]+|[\s#*`]+$/g, "").trim();

    const parsed = blocks.map((block, index) => {
      const matches = [...block.matchAll(labelPattern)];

      const fields: Record<string, string> = {
        QUESTION: cleanVal(block.slice(0, matches[0]?.index ?? block.length)),
      };

      matches.forEach((match, matchIndex) => {
        const rawKey = match[1].toUpperCase().replace(/\s+/g, " ");
        let key = rawKey;

        if (rawKey.includes("SKILL")) key = "SKILL";
        else if (rawKey === "OPTION A" || rawKey === "A") key = "A";
        else if (rawKey === "OPTION B" || rawKey === "B") key = "B";
        else if (rawKey === "OPTION C" || rawKey === "C") key = "C";
        else if (rawKey === "OPTION D" || rawKey === "D") key = "D";
        else if (
          rawKey.includes("ANSWER") ||
          rawKey.includes("CORRECT") ||
          rawKey === "ANS"
        ) {
          key = "ANSWER";
        } else if (rawKey.includes("DIFFICULTY")) {
          key = "DIFFICULTY";
        } else if (
          rawKey.includes("EXPLANATION") ||
          rawKey.includes("EXPLAIN") ||
          rawKey.includes("RATIONALE")
        ) {
          key = "EXPLANATION";
        }

        const start = (match.index ?? 0) + match[0].length;
        const end = matches[matchIndex + 1]?.index ?? block.length;

        fields[key] = cleanVal(block.slice(start, end));
      });

      let diff = fields.DIFFICULTY || "Medium";

      if (diff) {
        diff = diff.charAt(0).toUpperCase() + diff.slice(1).toLowerCase();
      }

      if (!["Easy", "Medium", "Hard"].includes(diff)) {
        diff = "Medium";
      }

      let ans = fields.ANSWER || "";
      const ansMatch = ans.match(/\b([ABCD])\b/i) || ans.match(/([ABCD])/i);

      if (ansMatch) {
        ans = ansMatch[1].toUpperCase();
      } else if (ans.trim()) {
        const normAns = normalize(ans);

        if (normAns === normalize(fields.A || "")) ans = "A";
        else if (normAns === normalize(fields.B || "")) ans = "B";
        else if (normAns === normalize(fields.C || "")) ans = "C";
        else if (normAns === normalize(fields.D || "")) ans = "D";
      }

      if (!["A", "B", "C", "D"].includes(ans)) {
        ans = "A";
      }

      const defaultSkillName =
        (selectedSkillFilter !== "all"
          ? skills.find((s) => String(s.id) === selectedSkillFilter)?.name
          : null) ||
        skills[0]?.name ||
        "General";

      return {
        clientId: `${Date.now()}-${index}`,
        skill_id: "",
        skill: fields.SKILL || defaultSkillName,
        question: fields.QUESTION || "",
        option_a: fields.A || "Option A",
        option_b: fields.B || "Option B",
        option_c: fields.C || "Option C",
        option_d: fields.D || "Option D",
        correct_option: ans,
        difficulty: diff,
        explanation: fields.EXPLANATION || "",
      };
    });

    setBulkQuestions(parsed.map((item) => validateBulkQuestion(item, parsed)));
    setBulkStep("review");
  };

  const openBulkImport = () => {
    setBulkError(null);
    setBulkText("");
    setBulkQuestions([]);
    setBulkEditId(null);
    setBulkStep("input");
    setIsBulkModalOpen(true);
  };

  const downloadTemplate = () => {
    const link = document.createElement("a");

    link.href = URL.createObjectURL(
      new Blob([QUESTION_TEMPLATE], { type: "text/plain" }),
    );

    link.download = "skillbridge-question-import-template.txt";
    link.click();

    URL.revokeObjectURL(link.href);
  };

  const handleUpload = async (file?: File) => {
    if (!file) return;

    const extension = file.name.split(".").pop()?.toLowerCase();

    if (!extension || !["txt", "md", "markdown"].includes(extension)) {
      return setBulkError("Only .txt, .md, and .markdown files are supported.");
    }

    if (file.size > 55_000) {
      return setBulkError(
        "File is too large. Keep imported content within 50,000 characters.",
      );
    }

    const text = await file.text();

    if (text.length > 50_000) {
      return setBulkError(
        `Import limit exceeded. Your file contains ${text.length.toLocaleString()} characters; the maximum is 50,000.`,
      );
    }

    setBulkError(null);
    setBulkText(text);
  };

  const saveBulkEdit = (item: BulkQuestion) => {
    const rawItems = bulkQuestions.map((question) =>
      question.clientId === item.clientId
        ? { ...item, errors: undefined }
        : { ...question, errors: undefined },
    );

    setBulkQuestions(
      rawItems.map((question) => validateBulkQuestion(question, rawItems)),
    );

    setBulkEditId(null);
  };

  const submitBulkImport = async () => {
    if (bulkQuestions.length === 0) {
      return setBulkError("No questions found in this import batch.");
    }

    if (bulkQuestions.some((question) => question.errors.length)) {
      return setBulkError(
        "Please fix or remove invalid questions before submitting.",
      );
    }

    if (
      !window.confirm(
        `Ready to submit ${bulkQuestions.length} question${bulkQuestions.length === 1 ? "" : "s"}? They will be submitted for Admin moderation.`,
      )
    ) {
      return;
    }

    const authToken = token || localStorage.getItem("skillbridge_token");

    if (!authToken) {
      return setBulkError(
        "Your authentication session has expired. Please log in again.",
      );
    }

    setBulkSubmitting(true);
    setBulkError(null);

    try {
      const payloadQuestions = bulkQuestions.map((q) => {
        let sid = parseInt(q.skill_id, 10);

        if (isNaN(sid) || sid <= 0) {
          const match = skills.find(
            (s) => normalize(s.name) === normalize(q.skill),
          );

          sid = match ? match.id : skills[0]?.id || 1;
        }

        return {
          skill_id: sid,
          question: q.question.trim(),
          option_a: q.option_a.trim() || "Option A",
          option_b: q.option_b.trim() || "Option B",
          option_c: q.option_c.trim() || "Option C",
          option_d: q.option_d.trim() || "Option D",
          correct_option: ["A", "B", "C", "D"].includes(q.correct_option)
            ? q.correct_option
            : "A",
          difficulty: ["Easy", "Medium", "Hard"].includes(q.difficulty)
            ? q.difficulty
            : "Medium",
          explanation:
            q.explanation && q.explanation.trim().length >= 5
              ? q.explanation.trim()
              : q.question.trim()
                ? `Explanation for: ${q.question.trim()}`
                : "No detailed explanation provided.",
        };
      });

      const res1 = await fetch(
        `${API_BASE_URL}/assessment/questions/bulkimport`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ questions: payloadQuestions }),
        },
      );

      const result1 = await res1.json();

      if (!res1.ok || !result1.success) {
        return setBulkError(
          result1.message || "Import failed. No questions were added.",
        );
      }

      setSuccessMsg(result1.message || "Questions imported successfully.");
      setTimeout(() => setSuccessMsg(null), 5000);
      setIsBulkModalOpen(false);
      fetchQuestionsAndSkills();
    } catch (err: any) {
      setBulkError(err?.message || "Network error while importing questions.");
    } finally {
      setBulkSubmitting(false);
    }
  };

  const handleOpenSubmitModal = (itemToEdit?: QuestionItem) => {
    if (itemToEdit) {
      setEditingQuestion(itemToEdit);

      setFormData({
        skill_id: String(itemToEdit.skill_id),
        question: itemToEdit.question,
        option_a: itemToEdit.option_a,
        option_b: itemToEdit.option_b,
        option_c: itemToEdit.option_c,
        option_d: itemToEdit.option_d,
        correct_option: itemToEdit.correct_option,
        difficulty: itemToEdit.difficulty,
        explanation: itemToEdit.explanation,
      });
    } else {
      setEditingQuestion(null);

      setFormData({
        skill_id: skills.length > 0 ? String(skills[0].id) : "",
        question: "",
        option_a: "",
        option_b: "",
        option_c: "",
        option_d: "",
        correct_option: "A",
        difficulty: "Medium",
        explanation: "",
      });
    }

    setIsSubmitModalOpen(true);
  };

  const handleQuestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const authToken = token || localStorage.getItem("skillbridge_token");
    if (!authToken) return;

    if (!formData.skill_id) {
      setErrorMsg("Please select a valid skill.");
      return;
    }

    if (formData.question.trim().length < 5) {
      setErrorMsg("Question text must be at least 5 characters long.");
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    const payload = {
      skill_id: parseInt(formData.skill_id, 10),
      question: formData.question.trim(),
      option_a: formData.option_a.trim(),
      option_b: formData.option_b.trim(),
      option_c: formData.option_c.trim(),
      option_d: formData.option_d.trim(),
      correct_option: formData.correct_option,
      difficulty: formData.difficulty,
      explanation: formData.explanation.trim(),
    };

    try {
      const url = editingQuestion
        ? `${API_BASE_URL}/assessment/questions/${editingQuestion.id}`
        : `${API_BASE_URL}/assessment/questions`;

      const method = editingQuestion ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (res.ok && result.success) {
        setSuccessMsg(
          result.message || "Question submitted for Admin moderation.",
        );

        setTimeout(() => setSuccessMsg(null), 4000);
        setIsSubmitModalOpen(false);
        fetchQuestionsAndSkills();
      } else {
        setErrorMsg(result.message || "Failed to save assessment question.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Network error while submitting question.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteQuestion = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this question?")) {
      return;
    }

    const authToken = token || localStorage.getItem("skillbridge_token");
    if (!authToken) return;

    try {
      const res = await fetch(`${API_BASE_URL}/assessment/questions/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${authToken}` },
      });

      const result = await res.json();

      if (res.ok && result.success) {
        setSuccessMsg("Question deleted successfully.");
        setTimeout(() => setSuccessMsg(null), 3000);
        fetchQuestionsAndSkills();
      } else {
        setErrorMsg(result.message || "Failed to delete question.");
      }
    } catch (err: any) {
      setErrorMsg("Network error deleting question.");
    }
  };

  const handleSkillRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const authToken = token || localStorage.getItem("skillbridge_token");
    if (!authToken) return;

    if (!skillReqData.skill_name.trim()) {
      setErrorMsg("Skill name is required.");
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`${API_BASE_URL}/assessment/skills/request`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(skillReqData),
      });

      const result = await res.json();

      if (res.ok && result.success) {
        setSuccessMsg(result.message || "Skill request submitted to Admin.");
        setTimeout(() => setSuccessMsg(null), 4000);
        setIsSkillModalOpen(false);
        setSkillReqData({
          skill_name: "",
          category: "Technical",
          reason: "",
        });
      } else {
        setErrorMsg(result.message || "Failed to request skill.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Network error submitting skill request.");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredQuestions = questions.filter((q) => {
    const matchesTab = statusTab === "all" || q.status === statusTab;

    const matchesSkill =
      selectedSkillFilter === "all" ||
      String(q.skill_id) === selectedSkillFilter;

    const qText = q.question.toLowerCase();
    const sName = (q.skill_name || "").toLowerCase();
    const search = searchTerm.toLowerCase();

    const matchesSearch =
      !search || qText.includes(search) || sName.includes(search);

    return matchesTab && matchesSkill && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6 shadow-[var(--shadow-xl)]">
        <div className="absolute -right-20 -top-20 h-48 w-48 rounded-full bg-[var(--primary-subtle)] blur-3xl" />
        <div className="absolute -bottom-24 left-1/3 h-40 w-40 rounded-full bg-[var(--accent-purple-bg)] blur-3xl" />

        <div className="relative z-10 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div>
            <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--primary)]">
              <Building2 size={16} />
              Industry Assessment Management
            </div>

            <h2 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
              Shared Assessment Question Bank
            </h2>

            <p className="mt-1 max-w-2xl text-sm text-[var(--text-secondary)]">
              Contribute high-quality, industry-validated questions to
              SkillBridge's shared skill bank. Submitted questions are moderated
              by Administrators before entering randomized student assessments.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSkillModalOpen(true)}
              className="flex cursor-pointer items-center gap-2 rounded-xl border border-[var(--primary-border)] bg-[var(--primary-subtle)] px-4 py-2.5 text-xs font-semibold text-[var(--primary)] transition-all hover:bg-[var(--bg-card-hover)]"
            >
              <Sparkles size={15} />
              <span>Request New Skill</span>
            </button>

            <button
              onClick={() => handleOpenSubmitModal()}
              className="flex cursor-pointer items-center gap-2 rounded-xl bg-[var(--primary-lighter)] px-4 py-2.5 text-xs font-semibold text-[var(--text-on-primary)] shadow-[var(--shadow-md)] transition-all hover:bg-[var(--primary-hover)]"
            >
              <PlusCircle size={16} />
              <span>Add Manually</span>
            </button>

            <button
              onClick={openBulkImport}
              className="flex cursor-pointer items-center gap-2 rounded-xl border border-[var(--primary-border)] bg-[var(--bg-muted)] px-4 py-2.5 text-xs font-semibold text-[var(--primary)] transition-all hover:border-[var(--primary)] hover:bg-[var(--bg-card-hover)]"
            >
              <Upload size={15} />
              <span>Bulk Import</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-4 shadow-[var(--shadow-sm)]">
          <div className="flex items-center justify-between text-xs font-medium text-[var(--text-muted)]">
            <span>Total Contributed</span>
            <FileQuestion size={16} className="text-[var(--primary)]" />
          </div>
          <div className="mt-2 text-2xl font-bold text-[var(--text-primary)]">
            {stats.total_questions}
          </div>
        </div>

        <div className="rounded-xl border border-[var(--accent-emerald)]/30 bg-[var(--accent-emerald-bg)] p-4 shadow-[var(--shadow-sm)]">
          <div className="flex items-center justify-between text-xs font-medium text-[var(--text-muted)]">
            <span>Approved & Live</span>
            <CheckCircle2 size={16} className="text-[var(--accent-emerald)]" />
          </div>
          <div className="mt-2 text-2xl font-bold text-[var(--accent-emerald)]">
            {stats.approved}
          </div>
        </div>

        <div className="rounded-xl border border-[var(--accent-amber)]/30 bg-[var(--accent-amber-bg)] p-4 shadow-[var(--shadow-sm)]">
          <div className="flex items-center justify-between text-xs font-medium text-[var(--text-muted)]">
            <span>Pending Review</span>
            <Clock size={16} className="text-[var(--accent-amber)]" />
          </div>
          <div className="mt-2 text-2xl font-bold text-[var(--accent-amber)]">
            {stats.pending}
          </div>
        </div>

        <div className="rounded-xl border border-[var(--accent-rose)]/30 bg-[var(--accent-rose-bg)] p-4 shadow-[var(--shadow-sm)]">
          <div className="flex items-center justify-between text-xs font-medium text-[var(--text-muted)]">
            <span>Rejected</span>
            <XCircle size={16} className="text-[var(--accent-rose)]" />
          </div>
          <div className="mt-2 text-2xl font-bold text-[var(--accent-rose)]">
            {stats.rejected}
          </div>
        </div>

        <div className="rounded-xl border border-[var(--accent-purple)]/30 bg-[var(--accent-purple-bg)] p-4 shadow-[var(--shadow-sm)]">
          <div className="flex items-center justify-between text-xs font-medium text-[var(--text-muted)]">
            <span>Student Attempts</span>
            <Award size={16} className="text-[var(--accent-purple)]" />
          </div>
          <div className="mt-2 text-2xl font-bold text-[var(--accent-purple)]">
            {stats.total_student_attempts}
          </div>
        </div>

        <div className="rounded-xl border border-[var(--accent-cyan)]/30 bg-[var(--accent-cyan-bg)] p-4 shadow-[var(--shadow-sm)]">
          <div className="flex items-center justify-between text-xs font-medium text-[var(--text-muted)]">
            <span>Avg Student Accuracy</span>
            <BarChart3 size={16} className="text-[var(--accent-cyan)]" />
          </div>
          <div className="mt-2 text-2xl font-bold text-[var(--accent-cyan)]">
            {stats.avg_student_accuracy}%
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="flex items-center gap-3 rounded-xl border border-[var(--accent-emerald)]/30 bg-[var(--accent-emerald-bg)] p-4 text-sm text-[var(--accent-emerald)]">
          <CheckCircle2 size={18} className="shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-3 rounded-xl border border-[var(--accent-rose)]/30 bg-[var(--accent-rose-bg)] p-4 text-sm text-[var(--accent-rose)]">
          <AlertCircle size={18} className="shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="flex flex-col items-center justify-between gap-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-4 shadow-[var(--shadow-sm)] md:flex-row">
        <div className="flex w-full items-center gap-2 overflow-x-auto md:w-auto">
          {["all", "pending", "approved", "rejected"].map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusTab(tab)}
              className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-all ${
                statusTab === tab
                  ? "bg-[var(--primary-lighter)] text-[var(--text-on-primary)] shadow-[var(--shadow-sm)]"
                  : "bg-[var(--bg-muted)] text-[var(--text-muted)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)]"
              }`}
            >
              {tab === "all" ? "All Questions" : tab}
            </button>
          ))}
        </div>

        <div className="flex w-full items-center gap-3 md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
            />
            <input
              type="text"
              placeholder="Search question text or skill..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-input)] py-1.5 pl-9 pr-3 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--focus-ring)]"
            />
          </div>

          <div className="flex items-center gap-1 rounded-lg border border-[var(--border-color)] bg-[var(--bg-input)] px-2 py-1.5 text-xs text-[var(--text-secondary)]">
            <Filter size={12} className="text-[var(--text-muted)]" />
            <select
              value={selectedSkillFilter}
              onChange={(e) => setSelectedSkillFilter(e.target.value)}
              className="cursor-pointer bg-transparent text-[var(--text-primary)] focus:outline-none"
            >
              <option
                value="all"
                className="bg-[var(--bg-elevated)] text-[var(--text-primary)]"
              >
                All Skills
              </option>

              {skills.map((s) => (
                <option
                  key={s.id}
                  value={String(s.id)}
                  className="bg-[var(--bg-elevated)] text-[var(--text-primary)]"
                >
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-muted)] p-12 text-center text-sm text-[var(--text-muted)]">
          <div className="mb-3 inline-block h-8 w-8 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" />
          <p>Loading assessment questions...</p>
        </div>
      ) : filteredQuestions.length === 0 ? (
        <div className="space-y-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-muted)] p-12 text-center text-[var(--text-muted)]">
          <HelpCircle
            size={40}
            className="mx-auto text-[var(--text-disabled)]"
          />

          <h3 className="text-lg font-semibold text-[var(--text-primary)]">
            No Questions Found
          </h3>

          <p className="mx-auto max-w-md text-xs text-[var(--text-secondary)]">
            {searchTerm || statusTab !== "all" || selectedSkillFilter !== "all"
              ? "No assessment questions match your active filters."
              : "You haven't contributed any assessment questions yet. Start building your company's question bank today!"}
          </p>

          <button
            onClick={() => handleOpenSubmitModal()}
            className="mt-2 inline-flex cursor-pointer items-center gap-2 rounded-lg bg-[var(--primary-lighter)] px-4 py-2 text-xs font-semibold text-[var(--text-primary)] transition-colors hover:bg-[var(--primary-hover)]"
          >
            <PlusCircle size={14} />
            Submit Question
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredQuestions.map((item) => (
            <div
              key={item.id}
              className={`rounded-2xl border bg-[var(--bg-card)] p-5 shadow-[var(--shadow-md)] backdrop-blur-md transition-all ${
                item.status === "approved"
                  ? "border-[var(--accent-emerald)]/30 hover:border-[var(--accent-emerald)]/50"
                  : item.status === "rejected"
                    ? "border-[var(--accent-rose)]/30 hover:border-[var(--accent-rose)]/50"
                    : "border-[var(--accent-amber)]/30 hover:border-[var(--accent-amber)]/50"
              }`}
            >
              <div className="flex flex-col items-start justify-between gap-3 border-b border-[var(--border-subtle)] pb-3 md:flex-row md:items-center">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-[var(--primary-border)] bg-[var(--primary-subtle)] px-2.5 py-0.5 text-xs font-medium text-[var(--primary)]">
                    {item.skill_name}
                  </span>

                  <span
                    className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                      item.difficulty === "Easy"
                        ? "border-[var(--accent-emerald)]/30 bg-[var(--accent-emerald-bg)] text-[var(--accent-emerald)]"
                        : item.difficulty === "Hard"
                          ? "border-[var(--accent-rose)]/30 bg-[var(--accent-rose-bg)] text-[var(--accent-rose)]"
                          : "border-[var(--accent-amber)]/30 bg-[var(--accent-amber-bg)] text-[var(--accent-amber)]"
                    }`}
                  >
                    {item.difficulty}
                  </span>

                  <span
                    className={`flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                      item.status === "approved"
                        ? "border-[var(--accent-emerald)]/30 bg-[var(--accent-emerald-bg)] text-[var(--accent-emerald)]"
                        : item.status === "rejected"
                          ? "border-[var(--accent-rose)]/30 bg-[var(--accent-rose-bg)] text-[var(--accent-rose)]"
                          : "border-[var(--accent-amber)]/30 bg-[var(--accent-amber-bg)] text-[var(--accent-amber)]"
                    }`}
                  >
                    {item.status === "approved" && <CheckCircle2 size={12} />}
                    {item.status === "pending" && <Clock size={12} />}
                    {item.status === "rejected" && <XCircle size={12} />}
                    <span className="capitalize">{item.status}</span>
                  </span>
                </div>

                <div className="flex items-center gap-2 self-end md:self-auto">
                  {item.status !== "approved" && (
                    <>
                      <button
                        onClick={() => handleOpenSubmitModal(item)}
                        className="cursor-pointer rounded-lg p-1.5 text-[var(--text-muted)] transition-colors hover:bg-[var(--primary-subtle)] hover:text-[var(--primary)]"
                        title="Edit question"
                      >
                        <Edit size={14} />
                      </button>

                      <button
                        onClick={() => handleDeleteQuestion(item.id)}
                        className="cursor-pointer rounded-lg p-1.5 text-[var(--text-muted)] transition-colors hover:bg-[var(--accent-rose-bg)] hover:text-[var(--accent-rose)]"
                        title="Delete question"
                      >
                        <Trash2 size={14} />
                      </button>
                    </>
                  )}

                  {item.status === "approved" && (
                    <button
                      onClick={() => handleOpenSubmitModal(item)}
                      className="flex cursor-pointer items-center gap-1 rounded-lg border border-[var(--accent-amber)]/30 bg-[var(--accent-amber-bg)] px-2.5 py-1 text-xs text-[var(--accent-amber)] transition-colors hover:bg-[var(--accent-amber)]/15"
                      title="Editing an approved question will submit it for Admin re-moderation"
                    >
                      <Edit size={12} />
                      Edit (Re-submit)
                    </button>
                  )}
                </div>
              </div>

              <div className="py-3">
                <p className="text-sm font-semibold leading-relaxed text-[var(--text-primary)]">
                  {item.question}
                </p>

                <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
                  {[
                    { key: "A", text: item.option_a },
                    { key: "B", text: item.option_b },
                    { key: "C", text: item.option_c },
                    { key: "D", text: item.option_d },
                  ].map((opt) => (
                    <div
                      key={opt.key}
                      className={`flex items-center gap-2 rounded-lg border p-2.5 text-xs ${
                        item.correct_option === opt.key
                          ? "border-[var(--accent-emerald)]/40 bg-[var(--accent-emerald-bg)] font-medium text-[var(--accent-emerald)]"
                          : "border-[var(--border-subtle)] bg-[var(--bg-muted)] text-[var(--text-secondary)]"
                      }`}
                    >
                      <span
                        className={`h-5 w-5 shrink-0 rounded-full text-center text-[10px] font-bold leading-5 ${
                          item.correct_option === opt.key
                            ? "bg-[var(--accent-emerald)] text-[var(--text-on-primary)]"
                            : "bg-[var(--bg-elevated)] text-[var(--text-secondary)]"
                        }`}
                      >
                        {opt.key}
                      </span>

                      <span className="truncate">{opt.text}</span>
                    </div>
                  ))}
                </div>

                {item.explanation && (
                  <div className="mt-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-muted)] p-3 text-xs text-[var(--text-secondary)]">
                    <span className="font-semibold text-[var(--primary)]">
                      Explanation:{" "}
                    </span>
                    {item.explanation}
                  </div>
                )}

                {item.status === "rejected" && item.rejection_reason && (
                  <div className="mt-3 rounded-xl border border-[var(--accent-rose)]/30 bg-[var(--accent-rose-bg)] p-3 text-xs text-[var(--accent-rose)]">
                    <div className="mb-1 flex items-center gap-1.5 font-semibold">
                      <AlertCircle size={14} />
                      Admin Rejection Reason:
                    </div>

                    <p>{item.rejection_reason}</p>

                    <p className="mt-2 text-[11px] text-[var(--text-muted)]">
                      Click "Edit" above to update the question based on
                      feedback and re-submit it for review.
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {isBulkModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-[var(--bg-app)]/80 p-4 backdrop-blur-md">
          <div className="mx-auto my-4 max-w-5xl rounded-2xl border border-[var(--border-color)] bg-[var(--bg-elevated)] p-5 shadow-[var(--shadow-xl)] md:p-7">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--primary)]">
                  Assessment questions
                </p>

                <h3 className="text-xl font-bold text-[var(--text-primary)]">
                  {bulkStep === "input" ? "Bulk Import" : "Review & Import"}
                </h3>

                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  Questions are not saved until you submit the final import.
                </p>
              </div>

              <button
                onClick={() => setIsBulkModalOpen(false)}
                className="rounded-lg p-2 text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)]"
              >
                <X size={20} />
              </button>
            </div>

            {bulkError && (
              <div className="mb-4 flex gap-2 rounded-lg border border-[var(--accent-rose)]/30 bg-[var(--accent-rose-bg)] p-3 text-sm text-[var(--accent-rose)]">
                <AlertCircle size={17} className="shrink-0" />
                {bulkError}
              </div>
            )}

            {bulkStep === "input" ? (
              <div className="space-y-4">
                <div className="flex flex-wrap justify-between gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-muted)] p-4">
                  <div>
                    <p className="text-sm font-semibold text-[var(--text-primary)]">
                      Paste structured text or upload a text file
                    </p>

                    <p className="mt-1 text-xs text-[var(--text-muted)]">
                      Supported: .txt, .md, .markdown. Maximum 50,000 characters
                      and 100 questions.
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={downloadTemplate}
                      className="flex items-center gap-1.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-input)] px-3 py-2 text-xs text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)]"
                    >
                      <Download size={14} />
                      Download Question Template
                    </button>

                    <button
                      onClick={() => uploadInputRef.current?.click()}
                      className="flex items-center gap-1.5 rounded-lg border border-[var(--primary-border)] bg-[var(--primary-subtle)] px-3 py-2 text-xs font-medium text-[var(--primary)] transition-colors hover:bg-[var(--bg-card-hover)]"
                    >
                      <Upload size={14} />
                      Upload TXT/MD
                    </button>

                    <input
                      ref={uploadInputRef}
                      type="file"
                      accept=".txt,.md,.markdown,text/plain,text/markdown"
                      className="hidden"
                      onChange={(event) => {
                        handleUpload(event.target.files?.[0]);
                        event.currentTarget.value = "";
                      }}
                    />
                  </div>
                </div>

                <textarea
                  value={bulkText}
                  onChange={(event) => {
                    setBulkText(event.target.value);
                    setBulkError(null);
                  }}
                  rows={18}
                  placeholder={QUESTION_TEMPLATE}
                  className="w-full resize-y rounded-xl border border-[var(--border-color)] bg-[var(--bg-input)] p-4 font-mono text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--focus-ring)]"
                />

                <div className="flex justify-between text-xs text-[var(--text-muted)]">
                  <span>
                    Characters:{" "}
                    <b
                      className={
                        bulkText.length > 50_000
                          ? "text-[var(--accent-rose)]"
                          : "text-[var(--text-primary)]"
                      }
                    >
                      {bulkText.length.toLocaleString()} / 50,000
                    </b>
                  </span>

                  <span>
                    Questions detected:{" "}
                    <b
                      className={
                        (bulkText.match(/^\s*QUESTION\s*:/gim) || []).length >
                        100
                          ? "text-[var(--accent-rose)]"
                          : "text-[var(--text-primary)]"
                      }
                    >
                      {(bulkText.match(/^\s*QUESTION\s*:/gim) || []).length} /
                      100
                    </b>
                  </span>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={parseBulkText}
                    className="flex items-center gap-2 rounded-xl bg-[var(--primary)] px-5 py-2.5 text-sm font-semibold text-[var(--text-on-primary)] transition-colors hover:bg-[var(--primary-hover)]"
                  >
                    <FileText size={16} />
                    Parse Questions
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                {(() => {
                  const valid = bulkQuestions.filter(
                    (q) => !q.errors.length,
                  ).length;

                  const summary = bulkQuestions.reduce<Record<string, number>>(
                    (acc, q) => {
                      const name = q.skill.trim() || "Unspecified skill";
                      acc[name] = (acc[name] || 0) + 1;
                      return acc;
                    },
                    {},
                  );

                  return (
                    <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-muted)] p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <h4 className="font-bold text-[var(--text-primary)]">
                            Import Summary
                          </h4>

                          <p className="mt-1 text-sm text-[var(--text-secondary)]">
                            Total Questions: {bulkQuestions.length} ·{" "}
                            <span className="text-[var(--accent-emerald)]">
                              ✓ Valid: {valid}
                            </span>{" "}
                            ·{" "}
                            <span className="text-[var(--accent-amber)]">
                              ⚠ Needs Correction: {bulkQuestions.length - valid}
                            </span>
                          </p>
                        </div>

                        <button
                          onClick={() => setBulkStep("input")}
                          className="flex items-center gap-1 text-xs text-[var(--primary)] transition-colors hover:text-[var(--primary-hover)]"
                        >
                          <ArrowLeft size={14} />
                          Back to input
                        </button>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {Object.entries(summary)
                          .sort((a, b) => b[1] - a[1])
                          .map(([skill, count]) => (
                            <span
                              key={skill}
                              className="rounded border border-[var(--border-subtle)] bg-[var(--bg-card-hover)] px-2 py-1 text-xs text-[var(--text-secondary)]"
                            >
                              {skill}: {count}
                            </span>
                          ))}
                      </div>
                    </div>
                  );
                })()}

                {bulkQuestions.map((item, index) => (
                  <div
                    key={item.clientId}
                    className={`rounded-xl border p-4 ${
                      item.errors.length
                        ? "border-[var(--accent-amber)]/50 bg-[var(--accent-amber-bg)]"
                        : "border-[var(--accent-emerald)]/25 bg-[var(--bg-muted)]"
                    }`}
                  >
                    <div className="flex justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-xs text-[var(--text-muted)]">
                          Question #{index + 1} ·{" "}
                          <span className="text-[var(--primary)]">
                            {item.skill || "No skill"}
                          </span>{" "}
                          · {item.difficulty || "No difficulty"}
                        </p>

                        <p className="mt-1 whitespace-pre-wrap font-semibold text-[var(--text-primary)]">
                          {item.question || "Missing question"}
                        </p>
                      </div>

                      <div className="flex shrink-0 gap-2">
                        <button
                          onClick={() => setBulkEditId(item.clientId)}
                          className="text-xs text-[var(--primary)] transition-colors hover:text-[var(--primary-hover)]"
                        >
                          <Edit size={14} className="mr-1 inline" />
                          Edit
                        </button>

                        <button
                          onClick={() => {
                            if (
                              window.confirm(
                                `Remove Question #${index + 1} from this import batch?`,
                              )
                            ) {
                              setBulkQuestions((current) =>
                                current.filter(
                                  (q) => q.clientId !== item.clientId,
                                ),
                              );
                            }
                          }}
                          className="text-xs text-[var(--accent-rose)] transition-colors hover:text-[var(--accent-rose)]"
                        >
                          <Trash2 size={14} className="mr-1 inline" />
                          Delete
                        </button>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-1 gap-2 text-xs text-[var(--text-secondary)] md:grid-cols-2">
                      {[
                        ["A", item.option_a],
                        ["B", item.option_b],
                        ["C", item.option_c],
                        ["D", item.option_d],
                      ].map(([letter, value]) => (
                        <p
                          key={letter}
                          className={
                            item.correct_option === letter
                              ? "text-[var(--accent-emerald)]"
                              : ""
                          }
                        >
                          <b>{letter}.</b> {value || "—"}
                        </p>
                      ))}
                    </div>

                    <p className="mt-3 text-xs text-[var(--text-muted)]">
                      <b className="text-[var(--text-secondary)]">Answer:</b>{" "}
                      {item.correct_option || "—"} ·{" "}
                      <b className="text-[var(--text-secondary)]">
                        Explanation:
                      </b>{" "}
                      {item.explanation || "—"}
                    </p>

                    {item.errors.length ? (
                      <ul className="mt-3 list-inside list-disc text-xs text-[var(--accent-amber)]">
                        {item.errors.map((error) => (
                          <li key={error}>{error}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-3 text-xs text-[var(--accent-emerald)]">
                        ✓ Valid
                      </p>
                    )}
                  </div>
                ))}

                <div className="flex justify-end gap-3 border-t border-[var(--border-subtle)] pt-4">
                  <button
                    onClick={() => setIsBulkModalOpen(false)}
                    className="px-4 py-2 text-sm text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
                  >
                    Cancel
                  </button>

                  <button
                    disabled={
                      bulkSubmitting ||
                      bulkQuestions.length === 0 ||
                      bulkQuestions.some((q) => q.errors.length)
                    }
                    onClick={submitBulkImport}
                    className="rounded-xl bg-[var(--primary)] px-5 py-2 text-sm font-semibold text-[var(--text-on-primary)] transition-colors hover:bg-[var(--primary-hover)] disabled:cursor-not-allowed disabled:bg-[var(--bg-muted)] disabled:text-[var(--text-disabled)]"
                  >
                    {bulkSubmitting
                      ? "Importing..."
                      : `Import ${bulkQuestions.length} Question${bulkQuestions.length === 1 ? "" : "s"}`}
                  </button>
                </div>
              </div>
            )}
          </div>

          {bulkEditId &&
            (() => {
              const item = bulkQuestions.find((q) => q.clientId === bulkEditId);

              if (!item) return null;

              return (
                <BulkEditModal
                  item={item}
                  skills={skills}
                  onCancel={() => setBulkEditId(null)}
                  onSave={saveBulkEdit}
                />
              );
            })()}
        </div>
      )}

      {isSubmitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[var(--bg-app)]/80 p-4 backdrop-blur-md">
          <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[var(--border-color)] bg-[var(--bg-elevated)] p-6 shadow-[var(--shadow-xl)]">
            <button
              onClick={() => setIsSubmitModalOpen(false)}
              className="absolute right-4 top-4 rounded-lg p-1 text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)]"
            >
              <X size={20} />
            </button>

            <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--primary)]">
              <FileQuestion size={16} />
              {editingQuestion
                ? "Edit Assessment Question"
                : "Submit Assessment Question"}
            </div>

            <h3 className="mb-4 text-xl font-bold text-[var(--text-primary)]">
              {editingQuestion
                ? "Update Question Details"
                : "Add Question to Skill Bank"}
            </h3>

            <form onSubmit={handleQuestionSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block font-medium text-[var(--text-secondary)]">
                    Target Skill *
                  </label>

                  <select
                    value={formData.skill_id}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        skill_id: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-input)] p-2.5 text-[var(--text-primary)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--focus-ring)]"
                    required
                  >
                    <option
                      value=""
                      disabled
                      className="bg-[var(--bg-elevated)] text-[var(--text-primary)]"
                    >
                      Select target skill
                    </option>

                    {skills.map((s) => (
                      <option
                        key={s.id}
                        value={String(s.id)}
                        className="bg-[var(--bg-elevated)] text-[var(--text-primary)]"
                      >
                        {s.name} ({s.category || "Technical"})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block font-medium text-[var(--text-secondary)]">
                    Difficulty Level *
                  </label>

                  <select
                    value={formData.difficulty}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        difficulty: e.target.value as any,
                      })
                    }
                    className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-input)] p-2.5 text-[var(--text-primary)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--focus-ring)]"
                  >
                    <option
                      value="Easy"
                      className="bg-[var(--bg-elevated)] text-[var(--text-primary)]"
                    >
                      Easy
                    </option>
                    <option
                      value="Medium"
                      className="bg-[var(--bg-elevated)] text-[var(--text-primary)]"
                    >
                      Medium
                    </option>
                    <option
                      value="Hard"
                      className="bg-[var(--bg-elevated)] text-[var(--text-primary)]"
                    >
                      Hard
                    </option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block font-medium text-[var(--text-secondary)]">
                  Question Text *
                </label>

                <textarea
                  rows={3}
                  value={formData.question}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      question: e.target.value,
                    })
                  }
                  placeholder="Enter clear, concise question prompt..."
                  className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-input)] p-3 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--focus-ring)]"
                  required
                />
              </div>

              <div className="space-y-3">
                <label className="block font-medium text-[var(--text-secondary)]">
                  Multiple Choice Options *
                </label>

                {[
                  { key: "A", keyName: "option_a", val: formData.option_a },
                  { key: "B", keyName: "option_b", val: formData.option_b },
                  { key: "C", keyName: "option_c", val: formData.option_c },
                  { key: "D", keyName: "option_d", val: formData.option_d },
                ].map((opt) => (
                  <div key={opt.key} className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          correct_option: opt.key as any,
                        })
                      }
                      className={`h-7 w-7 shrink-0 cursor-pointer rounded-lg text-xs font-bold transition-colors ${
                        formData.correct_option === opt.key
                          ? "bg-[var(--accent-emerald)] text-[var(--text-on-primary)] shadow-[var(--shadow-sm)]"
                          : "bg-[var(--bg-muted)] text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)]"
                      }`}
                      title={`Mark Option ${opt.key} as correct answer`}
                    >
                      {opt.key}
                    </button>

                    <input
                      type="text"
                      placeholder={`Option ${opt.key} text...`}
                      value={opt.val}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          [opt.keyName]: e.target.value,
                        })
                      }
                      className={`flex-1 rounded-xl border bg-[var(--bg-input)] p-2.5 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none ${
                        formData.correct_option === opt.key
                          ? "border-[var(--accent-emerald)]/60 focus:border-[var(--accent-emerald)]"
                          : "border-[var(--border-color)] focus:border-[var(--primary)]"
                      }`}
                      required
                    />
                  </div>
                ))}

                <p className="text-[11px] text-[var(--text-muted)]">
                  Click on letter badge (A, B, C, or D) to select the correct
                  answer. Selected:{" "}
                  <strong className="text-[var(--accent-emerald)]">
                    Option {formData.correct_option}
                  </strong>
                </p>
              </div>

              <div>
                <label className="mb-1 block font-medium text-[var(--text-secondary)]">
                  Answer Explanation *
                </label>

                <textarea
                  rows={2}
                  value={formData.explanation}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      explanation: e.target.value,
                    })
                  }
                  placeholder="Provide detailed explanation to guide students after submission..."
                  className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-input)] p-3 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--focus-ring)]"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-[var(--border-subtle)] pt-4">
                <button
                  type="button"
                  onClick={() => setIsSubmitModalOpen(false)}
                  className="cursor-pointer rounded-xl bg-[var(--bg-muted)] px-4 py-2 font-semibold text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)]"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="flex cursor-pointer items-center gap-2 rounded-xl bg-[var(--primary)] px-5 py-2 font-semibold text-[var(--text-on-primary)] transition-colors hover:bg-[var(--primary-hover)] disabled:cursor-not-allowed disabled:bg-[var(--bg-muted)] disabled:text-[var(--text-disabled)]"
                >
                  <Send size={14} />

                  <span>
                    {submitting
                      ? "Saving..."
                      : editingQuestion
                        ? "Update & Resubmit"
                        : "Submit for Moderation"}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isSkillModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--bg-app)]/80 p-4 backdrop-blur-md">
          <div className="relative w-full max-w-md rounded-2xl border border-[var(--border-color)] bg-[var(--bg-elevated)] p-6 shadow-[var(--shadow-xl)]">
            <button
              onClick={() => setIsSkillModalOpen(false)}
              className="absolute right-4 top-4 rounded-lg p-1 text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)]"
            >
              <X size={18} />
            </button>

            <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--accent-amber)]">
              <Sparkles size={16} />
              Skill Request
            </div>

            <h3 className="mb-3 text-lg font-bold text-[var(--text-primary)]">
              Request New Skill
            </h3>

            <form
              onSubmit={handleSkillRequestSubmit}
              className="space-y-4 text-xs"
            >
              <div>
                <label className="mb-1 block font-medium text-[var(--text-secondary)]">
                  Skill Name *
                </label>

                <input
                  type="text"
                  placeholder="e.g. Next.js, Rust, Kubernetes..."
                  value={skillReqData.skill_name}
                  onChange={(e) =>
                    setSkillReqData({
                      ...skillReqData,
                      skill_name: e.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-input)] p-2.5 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-amber)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-amber)]/30"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block font-medium text-[var(--text-secondary)]">
                  Skill Category
                </label>

                <input
                  type="text"
                  placeholder="Technical / Soft Skills / Domain"
                  value={skillReqData.category}
                  onChange={(e) =>
                    setSkillReqData({
                      ...skillReqData,
                      category: e.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-input)] p-2.5 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-amber)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-amber)]/30"
                />
              </div>

              <div>
                <label className="mb-1 block font-medium text-[var(--text-secondary)]">
                  Reason / Notes
                </label>

                <textarea
                  rows={2}
                  placeholder="Why is this skill needed for industry assessment?"
                  value={skillReqData.reason}
                  onChange={(e) =>
                    setSkillReqData({
                      ...skillReqData,
                      reason: e.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-input)] p-2.5 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-amber)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-amber)]/30"
                />
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-[var(--border-subtle)] pt-3">
                <button
                  type="button"
                  onClick={() => setIsSkillModalOpen(false)}
                  className="cursor-pointer rounded-xl bg-[var(--bg-muted)] px-4 py-2 font-semibold text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)]"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="flex cursor-pointer items-center gap-2 rounded-xl bg-[var(--accent-amber)] px-4 py-2 font-semibold text-[var(--text-on-primary)] transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:bg-[var(--bg-muted)] disabled:text-[var(--text-disabled)]"
                >
                  <Send size={14} />
                  <span>{submitting ? "Submitting..." : "Submit Request"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const BulkEditModal: React.FC<{
  item: BulkQuestion;
  skills: SkillOption[];
  onCancel: () => void;
  onSave: (item: BulkQuestion) => void;
}> = ({ item, skills, onCancel, onSave }) => {
  const [draft, setDraft] = useState(item);

  const update = (key: keyof BulkQuestion, value: string) =>
    setDraft((current) => ({ ...current, [key]: value }));

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[var(--bg-app)]/80 p-4 backdrop-blur-md">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSave(draft);
        }}
        className="max-h-[90vh] w-full max-w-2xl space-y-3 overflow-y-auto rounded-2xl border border-[var(--border-color)] bg-[var(--bg-elevated)] p-5 shadow-[var(--shadow-xl)]"
      >
        <div className="flex justify-between">
          <h4 className="font-bold text-[var(--text-primary)]">
            Edit Imported Question
          </h4>

          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg p-1 text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)]"
          >
            <X size={18} />
          </button>
        </div>

        <label className="block text-xs text-[var(--text-secondary)]">
          Target Skill
          <select
            value={draft.skill}
            onChange={(event) => update("skill", event.target.value)}
            className="mt-1 w-full rounded border border-[var(--border-color)] bg-[var(--bg-input)] p-2 text-[var(--text-primary)] focus:border-[var(--primary)] focus:outline-none"
          >
            <option
              value=""
              className="bg-[var(--bg-elevated)] text-[var(--text-primary)]"
            >
              Select a skill
            </option>

            {skills.map((skill) => (
              <option
                key={skill.id}
                value={skill.name}
                className="bg-[var(--bg-elevated)] text-[var(--text-primary)]"
              >
                {skill.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-xs text-[var(--text-secondary)]">
          Difficulty
          <select
            value={draft.difficulty}
            onChange={(event) => update("difficulty", event.target.value)}
            className="mt-1 w-full rounded border border-[var(--border-color)] bg-[var(--bg-input)] p-2 text-[var(--text-primary)] focus:border-[var(--primary)] focus:outline-none"
          >
            <option
              value=""
              className="bg-[var(--bg-elevated)] text-[var(--text-primary)]"
            >
              Select difficulty
            </option>

            <option className="bg-[var(--bg-elevated)] text-[var(--text-primary)]">
              Easy
            </option>

            <option className="bg-[var(--bg-elevated)] text-[var(--text-primary)]">
              Medium
            </option>

            <option className="bg-[var(--bg-elevated)] text-[var(--text-primary)]">
              Hard
            </option>
          </select>
        </label>

        <label className="block text-xs text-[var(--text-secondary)]">
          Question
          <textarea
            required
            value={draft.question}
            onChange={(event) => update("question", event.target.value)}
            rows={3}
            className="mt-1 w-full rounded border border-[var(--border-color)] bg-[var(--bg-input)] p-2 text-[var(--text-primary)] focus:border-[var(--primary)] focus:outline-none"
          />
        </label>

        {(["a", "b", "c", "d"] as const).map((letter) => (
          <label
            key={letter}
            className="block text-xs text-[var(--text-secondary)]"
          >
            Option {letter.toUpperCase()}
            <input
              required
              value={draft[`option_${letter}`]}
              onChange={(event) =>
                update(`option_${letter}`, event.target.value)
              }
              className="mt-1 w-full rounded border border-[var(--border-color)] bg-[var(--bg-input)] p-2 text-[var(--text-primary)] focus:border-[var(--primary)] focus:outline-none"
            />
          </label>
        ))}

        <label className="block text-xs text-[var(--text-secondary)]">
          Correct Answer
          <select
            value={draft.correct_option}
            onChange={(event) => update("correct_option", event.target.value)}
            className="mt-1 w-full rounded border border-[var(--border-color)] bg-[var(--bg-input)] p-2 text-[var(--text-primary)] focus:border-[var(--primary)] focus:outline-none"
          >
            <option
              value=""
              className="bg-[var(--bg-elevated)] text-[var(--text-primary)]"
            >
              Select answer
            </option>

            {["A", "B", "C", "D"].map((letter) => (
              <option
                key={letter}
                className="bg-[var(--bg-elevated)] text-[var(--text-primary)]"
              >
                {letter}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-xs text-[var(--text-secondary)]">
          Explanation
          <textarea
            required
            value={draft.explanation}
            onChange={(event) => update("explanation", event.target.value)}
            rows={3}
            className="mt-1 w-full rounded border border-[var(--border-color)] bg-[var(--bg-input)] p-2 text-[var(--text-primary)] focus:border-[var(--primary)] focus:outline-none"
          />
        </label>

        <div className="flex justify-end gap-3 border-t border-[var(--border-subtle)] pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-2 text-sm text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
          >
            Cancel
          </button>

          <button
            type="submit"
            className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-[var(--text-on-primary)] transition-colors hover:bg-[var(--primary-hover)]"
          >
            Save & Revalidate
          </button>
        </div>
      </form>
    </div>
  );
};

export default IndustryQuestionManagement;
