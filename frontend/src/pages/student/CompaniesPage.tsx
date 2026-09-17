import React, { useState, useEffect } from "react";
import MainLayout from "../../components/layout/MainLayout";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { API_BASE_URL } from "../../config/api";
import {
  Handshake,
  Search,
  Filter,
  Plus,
  Calendar,
  Clock,
  MapPin,
  Users,
  Award,
  Sparkles,
  CheckCircle2,
  X,
  Loader2,
  AlertCircle,
  Building2,
  GraduationCap,
  Trash2,
  Check,
  Zap,
  RotateCw,
  ChevronRight,
  BookOpen,
} from "lucide-react";

interface SkillItem {
  id: number;
  name: string;
  category?: string;
}

interface Collaboration {
  id: number;
  created_by: number;
  industry_id: number | null;
  institution_id: number | null;
  title: string;
  description: string;
  collaboration_type: string;
  target_audience: "Student" | "Faculty" | "Both";
  start_date: string | null;
  end_date: string | null;
  start_time?: string | null;
  location: string | null;
  mode: "Online" | "Offline" | "Hybrid";
  capacity: number;
  status: "draft" | "published" | "closed";
  created_at: string;
  creator_name: string;
  creator_role: string;
  company_name?: string | null;
  company_logo?: string | null;
  institution_name?: string | null;
  participant_count: number;
  skills: SkillItem[];
  match_score?: number | null;
  my_status?: "Applied" | "Accepted" | "Rejected" | "Completed" | null;
}

interface Participant {
  participant_id: number;
  user_id: number;
  role: string;
  status: "Applied" | "Accepted" | "Rejected" | "Completed";
  applied_at: string;
  name: string;
  email: string;
  degree?: string;
  department?: string;
  current_sem?: string;
  roll_number?: string;
  cgpa?: number | string;
  phone?: string;
}

const COLLAB_TYPES = [
  "Mentorship",
  "Workshop",
  "Guest Lecture",
  "Innovation Challenge",
  "Live Industry Project",
  "Research Collaboration",
  "Faculty Training",
  "Industrial Training",
];

const CollaborationsPage: React.FC = () => {
  const { token, user } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const role = user?.role ? user.role.toString().toLowerCase() : "student";
  const isIndustry = role === "industry";
  const canCreate = [
    "industry",
    "institution",
    "academician",
    "faculty",
    "institute",
    "admin",
  ].includes(role);

  // State
  const [activeTab, setActiveTab] = useState<"explore" | "my" | "created">(
    isIndustry ? "created" : "explore",
  );
  const [collaborations, setCollaborations] = useState<Collaboration[]>([]);
  const [myParticipations, setMyParticipations] = useState<any[]>([]);
  const [myCreated, setMyCreated] = useState<Collaboration[]>([]);
  const [masterSkills, setMasterSkills] = useState<SkillItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dedicated Refresh Handler
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([fetchCollaborations(), fetchMyCollaborations()]);
    setTimeout(() => setIsRefreshing(false), 500);
  };

  // Filters
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [modeFilter, setModeFilter] = useState("");
  const [audienceFilter, setAudienceFilter] = useState("");

  // Modals
  const [selectedCollab, setSelectedCollab] = useState<Collaboration | null>(
    null,
  );
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [manageModalOpen, setManageModalOpen] = useState(false);

  // Apply State
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Create Form State
  const [formTitle, setFormTitle] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formType, setFormType] = useState("Mentorship");
  const [formAudience, setFormAudience] = useState<
    "Student" | "Faculty" | "Both"
  >("Both");
  const [formMode, setFormMode] = useState<"Online" | "Offline" | "Hybrid">(
    "Online",
  );
  const [formLocation, setFormLocation] = useState("");
  const [formCapacity, setFormCapacity] = useState(50);
  const [formStartDate, setFormStartDate] = useState("");
  const [formEndDate, setFormEndDate] = useState("");
  const [formStartTime, setFormStartTime] = useState("");
  const [selectedSkillIds, setSelectedSkillIds] = useState<number[]>([]);
  const [customSkills, setCustomSkills] = useState<string[]>([]);
  const [skillFilterText, setSkillFilterText] = useState("");

  // Participants State
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [participantsLoading, setParticipantsLoading] = useState(false);

  // Fetch Collaborations
  const fetchCollaborations = async () => {
    setLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams();
      if (search) queryParams.append("search", search);
      if (typeFilter) queryParams.append("type", typeFilter);
      if (modeFilter) queryParams.append("mode", modeFilter);
      if (audienceFilter) queryParams.append("target_audience", audienceFilter);

      const res = await fetch(
        `${API_BASE_URL}/collaborations?${queryParams.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await res.json();
      if (res.ok && data.success) {
        setCollaborations(data.collaborations || []);
      } else {
        setError(data.message || "Failed to load collaborations.");
      }
    } catch (err: any) {
      setError("Network error fetching collaborations.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch My Collaborations
  const fetchMyCollaborations = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/collaborations/my`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMyParticipations(data.participations || []);
        setMyCreated(data.created || []);
      }
    } catch (err) {
      console.error("Error fetching my collaborations:", err);
    }
  };

  // Fetch Master Skills
  const fetchMasterSkills = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/skills`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        if (Array.isArray(data)) {
          setMasterSkills(data);
        } else if (data.skills && Array.isArray(data.skills)) {
          setMasterSkills(data.skills);
        }
      }
    } catch (err) {
      console.error("Error fetching master skills:", err);
    }
  };

  useEffect(() => {
    fetchCollaborations();
    fetchMyCollaborations();
    fetchMasterSkills();
  }, [search, typeFilter, modeFilter, audienceFilter]);

  // Handle Apply
  const handleApply = async (collabId: number) => {
    setActionLoading(true);
    setActionMessage(null);
    try {
      const res = await fetch(
        `${API_BASE_URL}/collaborations/${collabId}/apply`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );
      const data = await res.json();
      if (res.ok && data.success) {
        setActionMessage({
          type: "success",
          text: "Successfully registered for initiative!",
        });
        fetchCollaborations();
        fetchMyCollaborations();
        if (selectedCollab && selectedCollab.id === collabId) {
          setSelectedCollab({
            ...selectedCollab,
            my_status: "Applied",
            participant_count: selectedCollab.participant_count + 1,
          });
        }
      } else {
        setActionMessage({
          type: "error",
          text: data.message || "Failed to apply.",
        });
      }
    } catch (err) {
      setActionMessage({
        type: "error",
        text: "Network error during application.",
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Cancel Application
  const handleCancelApplication = async (collabId: number) => {
    setActionLoading(true);
    setActionMessage(null);
    try {
      const res = await fetch(
        `${API_BASE_URL}/collaborations/${collabId}/apply`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await res.json();
      if (res.ok && data.success) {
        setActionMessage({
          type: "success",
          text: "Application cancelled.",
        });
        fetchCollaborations();
        fetchMyCollaborations();
        if (selectedCollab && selectedCollab.id === collabId) {
          setSelectedCollab({
            ...selectedCollab,
            my_status: null,
            participant_count: Math.max(
              0,
              selectedCollab.participant_count - 1,
            ),
          });
        }
      } else {
        setActionMessage({
          type: "error",
          text: data.message || "Failed to cancel application.",
        });
      }
    } catch (err) {
      setActionMessage({
        type: "error",
        text: "Network error during cancellation.",
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Create Submit
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setActionMessage(null);
    try {
      const res = await fetch(`${API_BASE_URL}/collaborations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: formTitle,
          description: formDesc,
          collaboration_type: formType,
          target_audience: formAudience,
          mode: formMode,
          location: formLocation,
          capacity: formCapacity,
          start_date: formStartDate || null,
          end_date: formEndDate || null,
          start_time: formStartTime || null,
          skill_ids: [...selectedSkillIds, ...customSkills],
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setActionMessage({
          type: "success",
          text: "Collaboration initiative published!",
        });
        setCreateModalOpen(false);
        // Reset form
        setFormTitle("");
        setFormDesc("");
        setFormLocation("");
        setFormStartDate("");
        setFormEndDate("");
        setFormStartTime("");
        setSelectedSkillIds([]);
        setCustomSkills([]);
        setSkillFilterText("");
        fetchCollaborations();
        fetchMyCollaborations();
      } else {
        setActionMessage({
          type: "error",
          text: data.message || "Failed to create collaboration.",
        });
      }
    } catch (err) {
      setActionMessage({
        type: "error",
        text: "Network error creating collaboration.",
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Manage Participants Open
  const openManageParticipants = async (collab: Collaboration) => {
    setSelectedCollab(collab);
    setManageModalOpen(true);
    setParticipantsLoading(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/collaborations/${collab.id}/participants`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await res.json();
      if (res.ok && data.success) {
        setParticipants(data.participants || []);
      }
    } catch (err) {
      console.error("Error loading participants:", err);
    } finally {
      setParticipantsLoading(false);
    }
  };

  // Handle Participant Status Update
  const handleUpdateParticipantStatus = async (
    participantId: number,
    newStatus: string,
  ) => {
    if (!selectedCollab) return;
    try {
      const res = await fetch(
        `${API_BASE_URL}/collaborations/${selectedCollab.id}/participants/${participantId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: newStatus }),
        },
      );
      const data = await res.json();
      if (res.ok && data.success) {
        setParticipants((prev) =>
          prev.map((p) =>
            p.participant_id === participantId
              ? { ...p, status: newStatus as any }
              : p,
          ),
        );
      }
    } catch (err) {
      console.error("Error updating participant status:", err);
    }
  };

  // Delete Collaboration
  const handleDeleteCollaboration = async (collabId: number) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this collaboration initiative?",
      )
    )
      return;
    try {
      const res = await fetch(`${API_BASE_URL}/collaborations/${collabId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        fetchCollaborations();
        fetchMyCollaborations();
        setDetailModalOpen(false);
      }
    } catch (err) {
      console.error("Error deleting collaboration:", err);
    }
  };

  const getStatusStyle = (st?: string | null) => {
    switch (st) {
      case "Accepted":
        return isDark
          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
          : "bg-emerald-50 text-emerald-800 border-emerald-200";
      case "Applied":
        return isDark
          ? "bg-sky-500/10 text-sky-400 border-sky-500/20"
          : "bg-sky-50 text-sky-800 border-sky-200";
      case "Completed":
        return isDark
          ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
          : "bg-purple-50 text-purple-800 border-purple-200";
      case "Rejected":
        return isDark
          ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
          : "bg-rose-50 text-rose-800 border-rose-200";
      default:
        return isDark
          ? "bg-slate-800 text-slate-300 border-slate-700"
          : "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  return (
    <MainLayout showRightPanel={false}>
      <div
        className={`min-h-screen py-8 px-4 sm:px-6 lg:px-8 font-sans transition-colors ${
          isDark ? "bg-[#0b132b] text-slate-100" : "bg-slate-50 text-slate-900"
        }`}
      >
        <div className="max-w-7xl mx-auto space-y-8">
          {/* ================= HERO HEADER ================= */}
          <div
            className={`border rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm relative overflow-hidden ${
              isDark
                ? "bg-slate-900/90 border-slate-800"
                : "bg-white border-slate-200"
            }`}
          >
            <div className="max-w-2xl space-y-3">
              <div
                className={`inline-flex items-center gap-2 px-3 py-1 rounded-md border text-xs font-mono font-bold uppercase tracking-wider ${
                  isDark
                    ? "bg-slate-950 border-slate-800 text-sky-400"
                    : "bg-sky-50 border-sky-200 text-sky-800"
                }`}
              >
                <Handshake
                  size={14}
                  className="text-sky-600 dark:text-sky-400"
                />
                <span>Academia–Industry Ecosystem Hub</span>
              </div>
              <h1
                className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
                  isDark ? "text-white" : "text-slate-900"
                }`}
              >
                Bridge Industry Innovation with{" "}
                <span className="text-sky-600 dark:text-sky-400">
                  Academic Excellence
                </span>
              </h1>
              <p
                className={`text-xs sm:text-sm leading-relaxed ${
                  isDark ? "text-slate-400" : "text-slate-600"
                }`}
              >
                Discover mentorship programs, joint research initiatives, guest
                lectures, and industrial training opportunities connecting
                students, faculty, and industry partners.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                onClick={handleRefresh}
                className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                  isDark
                    ? "bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800"
                    : "bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200"
                }`}
                title="Refresh Initiatives"
              >
                <RotateCw
                  size={15}
                  className={
                    isRefreshing
                      ? "animate-spin text-sky-600 dark:text-sky-400"
                      : ""
                  }
                />
                <span>Refresh</span>
              </button>

              {canCreate && (
                <button
                  onClick={() => setCreateModalOpen(true)}
                  className="px-4 py-2.5 bg-sky-700 hover:bg-sky-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer border border-sky-600"
                >
                  <Plus size={16} />
                  <span>Publish Initiative</span>
                </button>
              )}
            </div>
          </div>

          {/* ================= ACTION TOAST ================= */}
          {actionMessage && (
            <div
              className={`p-4 rounded-xl border text-xs font-medium flex items-center justify-between gap-3 ${
                actionMessage.type === "success"
                  ? isDark
                    ? "bg-emerald-950/40 border-emerald-800 text-emerald-300"
                    : "bg-emerald-50 border-emerald-200 text-emerald-900"
                  : isDark
                    ? "bg-rose-950/40 border-rose-800 text-rose-300"
                    : "bg-rose-50 border-rose-200 text-rose-900"
              }`}
            >
              <div className="flex items-center gap-2">
                {actionMessage.type === "success" ? (
                  <CheckCircle2
                    size={16}
                    className="text-emerald-500 shrink-0"
                  />
                ) : (
                  <AlertCircle size={16} className="text-rose-500 shrink-0" />
                )}
                <span>{actionMessage.text}</span>
              </div>
              <button
                onClick={() => setActionMessage(null)}
                className="opacity-70 hover:opacity-100"
              >
                <X size={15} />
              </button>
            </div>
          )}

          {/* ================= NAVIGATION TABS ================= */}
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
            <button
              onClick={() => setActiveTab("explore")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                activeTab === "explore"
                  ? "bg-sky-700 text-white border-sky-600 shadow-xs"
                  : isDark
                    ? "bg-slate-900 text-slate-400 border-slate-800 hover:text-white"
                    : "bg-white text-slate-600 border-slate-200 hover:text-slate-900"
              }`}
            >
              <Sparkles size={14} />
              <span>Explore Initiatives</span>
              <span className="px-1.5 py-0.5 text-[10px] rounded-md font-mono bg-white/20 dark:bg-black/20">
                {collaborations.length}
              </span>
            </button>

            {!isIndustry && (
              <button
                onClick={() => setActiveTab("my")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                  activeTab === "my"
                    ? "bg-sky-700 text-white border-sky-600 shadow-xs"
                    : isDark
                      ? "bg-slate-900 text-slate-400 border-slate-800 hover:text-white"
                      : "bg-white text-slate-600 border-slate-200 hover:text-slate-900"
                }`}
              >
                <Award size={14} />
                <span>My Participations</span>
                <span className="px-1.5 py-0.5 text-[10px] rounded-md font-mono bg-white/20 dark:bg-black/20">
                  {myParticipations.length}
                </span>
              </button>
            )}

            {canCreate && (
              <button
                onClick={() => setActiveTab("created")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                  activeTab === "created"
                    ? "bg-sky-700 text-white border-sky-600 shadow-xs"
                    : isDark
                      ? "bg-slate-900 text-slate-400 border-slate-800 hover:text-white"
                      : "bg-white text-slate-600 border-slate-200 hover:text-slate-900"
                }`}
              >
                <Building2 size={14} />
                <span>Managed Initiatives</span>
                <span className="px-1.5 py-0.5 text-[10px] rounded-md font-mono bg-white/20 dark:bg-black/20">
                  {myCreated.length}
                </span>
              </button>
            )}
          </div>

          {/* ================= TAB 1: EXPLORE ================= */}
          {activeTab === "explore" && (
            <div className="space-y-6">
              {/* Filter Controls */}
              <div
                className={`border rounded-2xl p-4 flex flex-col md:flex-row items-center gap-3 ${
                  isDark
                    ? "bg-slate-900/80 border-slate-800"
                    : "bg-white border-slate-200"
                }`}
              >
                <div className="relative flex-1 w-full">
                  <Search
                    size={16}
                    className="absolute left-3.5 top-3 text-slate-400"
                  />
                  <input
                    type="text"
                    placeholder="Search by title, organization, or domain..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className={`w-full pl-10 pr-8 py-2 rounded-xl text-xs font-medium border outline-none ${
                      isDark
                        ? "bg-slate-950 border-slate-800 text-white placeholder-slate-500 focus:border-sky-500"
                        : "bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-sky-600"
                    }`}
                  />
                  {search && (
                    <button
                      onClick={() => setSearch("")}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
                  <Filter size={15} className="text-slate-400 shrink-0" />
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className={`py-2 px-3 rounded-xl text-xs font-medium border outline-none cursor-pointer ${
                      isDark
                        ? "bg-slate-950 border-slate-800 text-slate-200"
                        : "bg-slate-50 border-slate-200 text-slate-800"
                    }`}
                  >
                    <option value="">All Types</option>
                    {COLLAB_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>

                  <select
                    value={modeFilter}
                    onChange={(e) => setModeFilter(e.target.value)}
                    className={`py-2 px-3 rounded-xl text-xs font-medium border outline-none cursor-pointer ${
                      isDark
                        ? "bg-slate-950 border-slate-800 text-slate-200"
                        : "bg-slate-50 border-slate-200 text-slate-800"
                    }`}
                  >
                    <option value="">All Modes</option>
                    <option value="Online">Online</option>
                    <option value="Offline">Offline</option>
                    <option value="Hybrid">Hybrid</option>
                  </select>

                  <select
                    value={audienceFilter}
                    onChange={(e) => setAudienceFilter(e.target.value)}
                    className={`py-2 px-3 rounded-xl text-xs font-medium border outline-none cursor-pointer ${
                      isDark
                        ? "bg-slate-950 border-slate-800 text-slate-200"
                        : "bg-slate-50 border-slate-200 text-slate-800"
                    }`}
                  >
                    <option value="">All Audiences</option>
                    <option value="Student">Students</option>
                    <option value="Faculty">Faculty & Academicians</option>
                    <option value="Both">Both (Students & Faculty)</option>
                  </select>
                </div>
              </div>

              {/* Grid Content */}
              {loading ? (
                <div className="py-20 text-center space-y-3">
                  <Loader2
                    size={32}
                    className="animate-spin text-sky-600 dark:text-sky-400 mx-auto"
                  />
                  <p className="text-xs text-slate-400 font-medium">
                    Fetching academic-industry initiatives...
                  </p>
                </div>
              ) : error ? (
                <div className="p-8 border rounded-2xl text-center space-y-3 bg-rose-50/10 border-rose-500/20 text-rose-400">
                  <AlertCircle size={28} className="mx-auto text-rose-500" />
                  <p className="text-xs font-medium">{error}</p>
                  <button
                    onClick={fetchCollaborations}
                    className="px-4 py-2 bg-rose-600 text-white text-xs font-bold rounded-xl"
                  >
                    Retry
                  </button>
                </div>
              ) : collaborations.length === 0 ? (
                <div
                  className={`border rounded-2xl p-12 text-center space-y-3 ${
                    isDark
                      ? "bg-slate-900 border-slate-800"
                      : "bg-white border-slate-200"
                  }`}
                >
                  <Handshake size={40} className="mx-auto text-slate-400" />
                  <h3
                    className={`text-base font-bold ${
                      isDark ? "text-slate-200" : "text-slate-800"
                    }`}
                  >
                    No Collaboration Initiatives Found
                  </h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Try adjusting your search criteria or clear current filters.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {collaborations.map((item) => (
                    <div
                      key={item.id}
                      className={`border border-l-4 border-l-sky-600 rounded-2xl p-6 transition-all duration-200 flex flex-col justify-between space-y-5 shadow-xs ${
                        isDark
                          ? "bg-slate-900/90 border-slate-800 hover:border-slate-700"
                          : "bg-white border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className="space-y-4">
                        {/* Badges Row */}
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span
                            className={`px-2.5 py-1 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider border ${
                              isDark
                                ? "bg-slate-950 border-slate-800 text-sky-400"
                                : "bg-sky-50 border-sky-200 text-sky-800"
                            }`}
                          >
                            {item.collaboration_type}
                          </span>

                          {item.match_score !== null &&
                            item.match_score !== undefined && (
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold border ${
                                  item.match_score >= 70
                                    ? isDark
                                      ? "bg-emerald-950/50 border-emerald-800 text-emerald-400"
                                      : "bg-emerald-50 border-emerald-200 text-emerald-800"
                                    : item.match_score >= 40
                                      ? isDark
                                        ? "bg-amber-950/50 border-amber-800 text-amber-400"
                                        : "bg-amber-50 border-amber-200 text-amber-800"
                                      : isDark
                                        ? "bg-slate-950 border-slate-800 text-slate-400"
                                        : "bg-slate-100 border-slate-200 text-slate-700"
                                }`}
                              >
                                <Zap size={11} className="text-amber-500" />
                                {item.match_score}% Match
                              </span>
                            )}

                          {item.my_status && (
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold border ${getStatusStyle(
                                item.my_status,
                              )}`}
                            >
                              {item.my_status}
                            </span>
                          )}
                        </div>

                        {/* Title & Organization */}
                        <div className="space-y-1.5">
                          <h3
                            className={`text-base font-bold line-clamp-2 ${
                              isDark ? "text-white" : "text-slate-900"
                            }`}
                          >
                            {item.title}
                          </h3>

                          <div
                            className={`flex items-center gap-2 text-xs font-medium ${
                              isDark ? "text-slate-400" : "text-slate-600"
                            }`}
                          >
                            {item.company_name ? (
                              <>
                                <Building2
                                  size={14}
                                  className="text-sky-600 dark:text-sky-400 shrink-0"
                                />
                                <span>{item.company_name}</span>
                              </>
                            ) : (
                              <>
                                <GraduationCap
                                  size={14}
                                  className="text-sky-600 dark:text-sky-400 shrink-0"
                                />
                                <span>
                                  {item.institution_name || item.creator_name}
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        <p
                          className={`text-xs leading-relaxed line-clamp-3 ${
                            isDark ? "text-slate-400" : "text-slate-600"
                          }`}
                        >
                          {item.description}
                        </p>

                        {/* Skills */}
                        {item.skills && item.skills.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {item.skills.map((sk) => (
                              <span
                                key={sk.id}
                                className={`px-2 py-0.5 rounded text-[10px] font-mono border ${
                                  isDark
                                    ? "bg-slate-950 border-slate-800 text-slate-300"
                                    : "bg-slate-100 border-slate-200 text-slate-700"
                                }`}
                              >
                                {sk.name}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Metadata Row */}
                        <div
                          className={`pt-3 border-t text-xs space-y-1.5 ${
                            isDark
                              ? "border-slate-800 text-slate-400"
                              : "border-slate-200 text-slate-600"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                              <MapPin
                                size={13}
                                className="text-sky-600 dark:text-sky-400 shrink-0"
                              />
                              <span>{item.mode}</span>
                            </span>
                            <span className="flex items-center gap-1.5 font-mono">
                              <Users
                                size={13}
                                className="text-sky-600 dark:text-sky-400 shrink-0"
                              />
                              <span>
                                {item.participant_count} / {item.capacity} Seats
                              </span>
                            </span>
                          </div>

                          {item.start_date && (
                            <div className="flex items-center gap-1.5">
                              <Calendar
                                size={13}
                                className="text-sky-600 dark:text-sky-400 shrink-0"
                              />
                              <span>
                                {new Date(item.start_date).toLocaleDateString(
                                  "en-US",
                                  {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  },
                                )}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Card Actions */}
                      <div className="pt-2 flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedCollab(item);
                            setDetailModalOpen(true);
                          }}
                          className="flex-1 py-2 px-3 bg-sky-700 hover:bg-sky-800 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-sky-600"
                        >
                          <span>View Details</span>
                          <ChevronRight size={14} />
                        </button>

                        {item.created_by === user?.id && (
                          <button
                            onClick={() => openManageParticipants(item)}
                            className={`py-2 px-3 border text-xs font-bold rounded-xl transition-all cursor-pointer ${
                              isDark
                                ? "bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800"
                                : "bg-slate-100 border-slate-200 text-slate-800 hover:bg-slate-200"
                            }`}
                          >
                            Manage ({item.participant_count})
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ================= TAB 2: MY PARTICIPATIONS ================= */}
          {activeTab === "my" && !isIndustry && (
            <div
              className={`border rounded-2xl overflow-hidden shadow-xs ${
                isDark
                  ? "bg-slate-900 border-slate-800"
                  : "bg-white border-slate-200"
              }`}
            >
              {myParticipations.length === 0 ? (
                <div className="p-12 text-center space-y-3">
                  <Award size={40} className="mx-auto text-slate-400" />
                  <h3
                    className={`text-base font-bold ${
                      isDark ? "text-slate-200" : "text-slate-800"
                    }`}
                  >
                    No Application Records
                  </h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    You haven't applied to any collaboration initiatives yet.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead
                      className={`border-b font-mono font-bold uppercase tracking-wider ${
                        isDark
                          ? "bg-slate-950 border-slate-800 text-slate-400"
                          : "bg-slate-50 border-slate-200 text-slate-600"
                      }`}
                    >
                      <tr>
                        <th className="py-3.5 px-4">Initiative Title</th>
                        <th className="py-3.5 px-4">Type</th>
                        <th className="py-3.5 px-4">Organizer</th>
                        <th className="py-3.5 px-4">Mode</th>
                        <th className="py-3.5 px-4">Applied Date</th>
                        <th className="py-3.5 px-4">Status</th>
                        <th className="py-3.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody
                      className={`divide-y ${
                        isDark ? "divide-slate-800" : "divide-slate-200"
                      }`}
                    >
                      {myParticipations.map((p) => (
                        <tr
                          key={p.participant_id}
                          className={
                            isDark
                              ? "hover:bg-slate-800/40"
                              : "hover:bg-slate-50"
                          }
                        >
                          <td className="py-3.5 px-4 font-bold">
                            <span
                              className={
                                isDark ? "text-slate-100" : "text-slate-900"
                              }
                            >
                              {p.title}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                                isDark
                                  ? "bg-slate-950 border-slate-800 text-sky-400"
                                  : "bg-sky-50 border-sky-200 text-sky-800"
                              }`}
                            >
                              {p.collaboration_type}
                            </span>
                          </td>
                          <td
                            className={`py-3.5 px-4 ${
                              isDark ? "text-slate-300" : "text-slate-700"
                            }`}
                          >
                            {p.company_name ||
                              p.institution_name ||
                              p.creator_name}
                          </td>
                          <td
                            className={`py-3.5 px-4 ${
                              isDark ? "text-slate-400" : "text-slate-600"
                            }`}
                          >
                            {p.mode}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-slate-400">
                            {new Date(p.applied_at).toLocaleDateString()}
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${getStatusStyle(
                                p.participation_status,
                              )}`}
                            >
                              {p.participation_status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            {p.participation_status === "Applied" && (
                              <button
                                onClick={() =>
                                  handleCancelApplication(p.collaboration_id)
                                }
                                disabled={actionLoading}
                                className="px-3 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 text-[11px] font-bold rounded-lg border border-rose-500/30 transition-all cursor-pointer"
                              >
                                Cancel
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ================= TAB 3: MANAGED INITIATIVES ================= */}
          {activeTab === "created" && canCreate && (
            <div className="space-y-6">
              {myCreated.length === 0 ? (
                <div
                  className={`border rounded-2xl p-12 text-center space-y-4 ${
                    isDark
                      ? "bg-slate-900 border-slate-800"
                      : "bg-white border-slate-200"
                  }`}
                >
                  <Building2 size={40} className="mx-auto text-slate-400" />
                  <div className="space-y-1">
                    <h3
                      className={`text-base font-bold ${
                        isDark ? "text-slate-200" : "text-slate-800"
                      }`}
                    >
                      No Initiatives Published Yet
                    </h3>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      Publish a collaboration initiative to invite campus
                      applicants.
                    </p>
                  </div>
                  <button
                    onClick={() => setCreateModalOpen(true)}
                    className="px-5 py-2.5 bg-sky-700 hover:bg-sky-800 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer border border-sky-600 inline-flex items-center gap-2"
                  >
                    <Plus size={16} />
                    <span>Publish First Initiative</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {myCreated.map((item) => (
                    <div
                      key={item.id}
                      className={`border rounded-2xl p-6 transition-all space-y-5 flex flex-col justify-between shadow-xs ${
                        isDark
                          ? "bg-slate-900 border-slate-800"
                          : "bg-white border-slate-200"
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`px-2.5 py-1 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider border ${
                              isDark
                                ? "bg-slate-950 border-slate-800 text-sky-400"
                                : "bg-sky-50 border-sky-200 text-sky-800"
                            }`}
                          >
                            {item.collaboration_type}
                          </span>
                          <span className="text-emerald-500 text-[10px] font-mono font-bold uppercase">
                            Published
                          </span>
                        </div>

                        <h3
                          className={`text-base font-bold ${
                            isDark ? "text-white" : "text-slate-900"
                          }`}
                        >
                          {item.title}
                        </h3>

                        <p
                          className={`text-xs leading-relaxed line-clamp-2 ${
                            isDark ? "text-slate-400" : "text-slate-600"
                          }`}
                        >
                          {item.description}
                        </p>

                        <div
                          className={`pt-3 border-t text-xs space-y-1.5 font-mono ${
                            isDark
                              ? "border-slate-800 text-slate-400"
                              : "border-slate-200 text-slate-600"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span>Applicants:</span>
                            <span className="font-bold text-sky-600 dark:text-sky-400">
                              {item.participant_count} / {item.capacity}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-2">
                        <button
                          onClick={() => openManageParticipants(item)}
                          className="flex-1 py-2 px-3 bg-sky-700 hover:bg-sky-800 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-sky-600"
                        >
                          <Users size={14} />
                          <span>Applicants ({item.participant_count})</span>
                        </button>

                        <button
                          onClick={() => handleDeleteCollaboration(item.id)}
                          className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-xl border border-rose-500/30 transition-all cursor-pointer"
                          title="Delete Initiative"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ================= MODAL: DETAIL & APPLY ================= */}
        {detailModalOpen && selectedCollab && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
            onClick={() => setDetailModalOpen(false)}
          >
            <div
              className={`w-full max-w-2xl rounded-2xl border p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto ${
                isDark
                  ? "bg-slate-900 border-slate-800 text-white"
                  : "bg-white border-slate-200 text-slate-900"
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <span
                    className={`px-2.5 py-1 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider border ${
                      isDark
                        ? "bg-slate-950 border-slate-800 text-sky-400"
                        : "bg-sky-50 border-sky-200 text-sky-800"
                    }`}
                  >
                    {selectedCollab.collaboration_type}
                  </span>
                  <h2 className="text-xl font-extrabold pt-1">
                    {selectedCollab.title}
                  </h2>
                </div>
                <button
                  onClick={() => setDetailModalOpen(false)}
                  className="p-1.5 rounded-lg border text-slate-400 hover:text-white border-transparent hover:border-slate-700"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Grid Metrics */}
              <div
                className={`grid grid-cols-2 gap-3 p-4 rounded-xl border text-xs ${
                  isDark
                    ? "bg-slate-950 border-slate-800"
                    : "bg-slate-50 border-slate-200"
                }`}
              >
                <div>
                  <span className="text-slate-400 font-mono uppercase text-[10px]">
                    Mode & Location
                  </span>
                  <p className="font-bold pt-0.5">
                    {selectedCollab.mode}{" "}
                    {selectedCollab.location
                      ? `(${selectedCollab.location})`
                      : ""}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400 font-mono uppercase text-[10px]">
                    Capacity
                  </span>
                  <p className="font-bold pt-0.5">
                    {selectedCollab.participant_count} /{" "}
                    {selectedCollab.capacity} Seats Filled
                  </p>
                </div>
                <div>
                  <span className="text-slate-400 font-mono uppercase text-[10px]">
                    Target Audience
                  </span>
                  <p className="font-bold pt-0.5">
                    {selectedCollab.target_audience}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400 font-mono uppercase text-[10px]">
                    Schedule
                  </span>
                  <p className="font-bold pt-0.5">
                    {selectedCollab.start_date
                      ? new Date(selectedCollab.start_date).toLocaleDateString()
                      : "Flexible Start"}
                  </p>
                </div>
              </div>

              {/* Overview */}
              <div className="space-y-2">
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
                  Initiative Overview
                </h4>
                <p
                  className={`text-xs leading-relaxed ${
                    isDark ? "text-slate-300" : "text-slate-600"
                  }`}
                >
                  {selectedCollab.description}
                </p>
              </div>

              {/* Skills */}
              {selectedCollab.skills && selectedCollab.skills.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
                    Required Competencies
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedCollab.skills.map((sk) => (
                      <span
                        key={sk.id}
                        className={`px-2.5 py-1 rounded-md text-xs font-mono border ${
                          isDark
                            ? "bg-slate-950 border-slate-800 text-sky-400"
                            : "bg-sky-50 border-sky-200 text-sky-800"
                        }`}
                      >
                        {sk.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                {selectedCollab.my_status ? (
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold border ${getStatusStyle(
                        selectedCollab.my_status,
                      )}`}
                    >
                      Status: {selectedCollab.my_status}
                    </span>
                    {selectedCollab.my_status === "Applied" && (
                      <button
                        onClick={() =>
                          handleCancelApplication(selectedCollab.id)
                        }
                        disabled={actionLoading}
                        className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl"
                      >
                        Cancel Application
                      </button>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => handleApply(selectedCollab.id)}
                    disabled={actionLoading}
                    className="px-6 py-2.5 bg-sky-700 hover:bg-sky-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-2 border border-sky-600"
                  >
                    {actionLoading && (
                      <Loader2 size={14} className="animate-spin" />
                    )}
                    <span>Apply / Register Now</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ================= MODAL: CREATE INITIATIVE ================= */}
        {createModalOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
            onClick={() => setCreateModalOpen(false)}
          >
            <div
              className={`w-full max-w-2xl rounded-2xl border p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto ${
                isDark
                  ? "bg-slate-900 border-slate-800 text-white"
                  : "bg-white border-slate-200 text-slate-900"
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-extrabold">
                    Publish Collaboration Initiative
                  </h2>
                  <p className="text-xs text-slate-400 pt-1">
                    Create a mentorship, workshop, or joint research
                    opportunity.
                  </p>
                </div>
                <button
                  onClick={() => setCreateModalOpen(false)}
                  className="p-1.5 rounded-lg border text-slate-400 hover:text-white border-transparent hover:border-slate-700"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold">
                    Initiative Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Next-Gen Full Stack Mentorship"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className={`w-full py-2 px-3 rounded-xl text-xs border outline-none ${
                      isDark
                        ? "bg-slate-950 border-slate-800 text-white"
                        : "bg-slate-50 border-slate-200 text-slate-900"
                    }`}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold">
                      Collaboration Type *
                    </label>
                    <select
                      value={formType}
                      onChange={(e) => setFormType(e.target.value)}
                      className={`w-full py-2 px-3 rounded-xl text-xs border outline-none ${
                        isDark
                          ? "bg-slate-950 border-slate-800 text-white"
                          : "bg-slate-50 border-slate-200 text-slate-900"
                      }`}
                    >
                      {COLLAB_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold">
                      Target Audience *
                    </label>
                    <select
                      value={formAudience}
                      onChange={(e) => setFormAudience(e.target.value as any)}
                      className={`w-full py-2 px-3 rounded-xl text-xs border outline-none ${
                        isDark
                          ? "bg-slate-950 border-slate-800 text-white"
                          : "bg-slate-50 border-slate-200 text-slate-900"
                      }`}
                    >
                      <option value="Both">Both (Students & Faculty)</option>
                      <option value="Student">Students Only</option>
                      <option value="Faculty">Faculty Only</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold">Mode *</label>
                    <select
                      value={formMode}
                      onChange={(e) => setFormMode(e.target.value as any)}
                      className={`w-full py-2 px-3 rounded-xl text-xs border outline-none ${
                        isDark
                          ? "bg-slate-950 border-slate-800 text-white"
                          : "bg-slate-50 border-slate-200 text-slate-900"
                      }`}
                    >
                      <option value="Online">Online</option>
                      <option value="Offline">Offline</option>
                      <option value="Hybrid">Hybrid</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold">Location / Link</label>
                    <input
                      type="text"
                      placeholder="e.g. Virtual Meeting Link"
                      value={formLocation}
                      onChange={(e) => setFormLocation(e.target.value)}
                      className={`w-full py-2 px-3 rounded-xl text-xs border outline-none ${
                        isDark
                          ? "bg-slate-950 border-slate-800 text-white"
                          : "bg-slate-50 border-slate-200 text-slate-900"
                      }`}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold">Capacity *</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={formCapacity}
                      onChange={(e) => setFormCapacity(Number(e.target.value))}
                      className={`w-full py-2 px-3 rounded-xl text-xs border outline-none ${
                        isDark
                          ? "bg-slate-950 border-slate-800 text-white"
                          : "bg-slate-50 border-slate-200 text-slate-900"
                      }`}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold">
                    Description & Objectives *
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Describe program goals and expected outcomes..."
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                    className={`w-full py-2 px-3 rounded-xl text-xs border outline-none ${
                      isDark
                        ? "bg-slate-950 border-slate-800 text-white"
                        : "bg-slate-50 border-slate-200 text-slate-900"
                    }`}
                  />
                </div>

                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setCreateModalOpen(false)}
                    className="px-4 py-2 border rounded-xl text-xs font-bold text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-6 py-2 bg-sky-700 hover:bg-sky-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-2 border border-sky-600"
                  >
                    {actionLoading && (
                      <Loader2 size={14} className="animate-spin" />
                    )}
                    <span>Publish Initiative</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ================= MODAL: MANAGE PARTICIPANTS ================= */}
        {manageModalOpen && selectedCollab && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
            onClick={() => setManageModalOpen(false)}
          >
            <div
              className={`w-full max-w-4xl rounded-2xl border p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto ${
                isDark
                  ? "bg-slate-900 border-slate-800 text-white"
                  : "bg-white border-slate-200 text-slate-900"
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-extrabold">
                    Manage Participants
                  </h2>
                  <p className="text-xs text-slate-400 pt-0.5">
                    Applicants for:{" "}
                    <strong className="text-sky-600 dark:text-sky-400">
                      {selectedCollab.title}
                    </strong>
                  </p>
                </div>
                <button
                  onClick={() => setManageModalOpen(false)}
                  className="p-1.5 rounded-lg border text-slate-400 hover:text-white border-transparent hover:border-slate-700"
                >
                  <X size={18} />
                </button>
              </div>

              {participantsLoading ? (
                <div className="py-12 text-center space-y-2">
                  <Loader2
                    size={24}
                    className="animate-spin mx-auto text-sky-600 dark:text-sky-400"
                  />
                  <p className="text-xs text-slate-400 font-medium">
                    Fetching applicant roster...
                  </p>
                </div>
              ) : participants.length === 0 ? (
                <div className="py-12 text-center space-y-2 text-slate-400">
                  <Users size={32} className="mx-auto" />
                  <p className="text-xs font-medium">
                    No applications submitted for this initiative yet.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto border rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead
                      className={`border-b font-mono font-bold uppercase tracking-wider ${
                        isDark
                          ? "bg-slate-950 border-slate-800 text-slate-400"
                          : "bg-slate-50 border-slate-200 text-slate-600"
                      }`}
                    >
                      <tr>
                        <th className="py-3 px-3">Applicant</th>
                        <th className="py-3 px-3">Role</th>
                        <th className="py-3 px-3">Email</th>
                        <th className="py-3 px-3">Applied</th>
                        <th className="py-3 px-3">Status</th>
                        <th className="py-3 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody
                      className={`divide-y ${
                        isDark ? "divide-slate-800" : "divide-slate-200"
                      }`}
                    >
                      {participants.map((p) => (
                        <tr key={p.participant_id}>
                          <td className="py-3 px-3 font-bold">{p.name}</td>
                          <td className="py-3 px-3 font-mono">{p.role}</td>
                          <td className="py-3 px-3 text-slate-400">
                            {p.email}
                          </td>
                          <td className="py-3 px-3 font-mono text-slate-400">
                            {new Date(p.applied_at).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${getStatusStyle(
                                p.status,
                              )}`}
                            >
                              {p.status}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right space-x-1">
                            {p.status !== "Accepted" && (
                              <button
                                onClick={() =>
                                  handleUpdateParticipantStatus(
                                    p.participant_id,
                                    "Accepted",
                                  )
                                }
                                className="px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white text-[10px] font-bold rounded border border-emerald-500/30 transition-all"
                              >
                                Accept
                              </button>
                            )}
                            {p.status !== "Rejected" && (
                              <button
                                onClick={() =>
                                  handleUpdateParticipantStatus(
                                    p.participant_id,
                                    "Rejected",
                                  )
                                }
                                className="px-2.5 py-1 bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white text-[10px] font-bold rounded border border-rose-500/30 transition-all"
                              >
                                Reject
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default CollaborationsPage;
