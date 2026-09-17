import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Brain,
  BarChart3,
  Target,
  Briefcase,
  ClipboardList,
  Award,
  Users,
  Building2,
  GraduationCap,
  BookOpen,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  Menu,
  X,
  Sun,
  Moon,
  TrendingUp,
  Search,
  MapPin,
  ArrowUpRight,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { API_BASE_URL } from "../config/api";

interface SkillDemandItem {
  name: string;
  category: string;
  count: number;
  percentage: number;
}

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeAudienceTab, setActiveAudienceTab] = useState<
    "students" | "industries" | "institutions" | "academicians"
  >("students");

  // Real Industry Demand metrics fetched from backend public endpoint
  const [demandSkills, setDemandSkills] = useState<SkillDemandItem[]>([]);
  const [loadingDemand, setLoadingDemand] = useState<boolean>(true);
  const [totalPublishedOpportunities, setTotalPublishedOpportunities] =
    useState<number>(0);
  const [liveOpportunities, setLiveOpportunities] = useState<any[]>([]);

  useEffect(() => {
    const fetchPublicDemand = async () => {
      setLoadingDemand(true);
      try {
        const res = await fetch(`${API_BASE_URL}/opportunities`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.opportunities)) {
            setTotalPublishedOpportunities(data.opportunities.length);
            setLiveOpportunities(data.opportunities);

            // Aggregate skills from live published opportunities
            const skillCounts: Record<
              string,
              { count: number; category: string }
            > = {};
            let totalSkillOccurrences = 0;

            data.opportunities.forEach((opp: any) => {
              if (Array.isArray(opp.requiredSkills)) {
                opp.requiredSkills.forEach((sk: any) => {
                  const name = sk.skill_name || sk.name || "Technical Skill";
                  const category = sk.category || "Technical";
                  if (!skillCounts[name]) {
                    skillCounts[name] = { count: 0, category };
                  }
                  skillCounts[name].count += 1;
                  totalSkillOccurrences += 1;
                });
              }
            });

            if (totalSkillOccurrences > 0) {
              const sortedSkills: SkillDemandItem[] = Object.entries(
                skillCounts,
              )
                .map(([name, info]) => ({
                  name,
                  category: info.category,
                  count: info.count,
                  percentage: Math.round(
                    (info.count / Math.max(1, data.opportunities.length)) * 100,
                  ),
                }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 6);

              setDemandSkills(sortedSkills);
            }
          }
        }
      } catch (err) {
        console.error("Public demand fetch error:", err);
      } finally {
        setLoadingDemand(false);
      }
    };

    fetchPublicDemand();
  }, []);

  const handleDashboardRedirect = () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    const role = user?.role ? user.role.toString().toLowerCase() : "";
    if (role === "admin") {
      navigate("/admin/dashboard");
    } else if (role === "industry") {
      navigate("/industry/profile");
    } else if (
      ["institution", "academician", "faculty", "institute"].includes(role)
    ) {
      navigate("/institution/dashboard");
    } else {
      navigate("/dashboard");
    }
  };

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div
      className={`min-h-screen font-sans transition-colors duration-300 relative ${
        isDark
          ? "bg-[#0b132b] text-slate-100 selection:bg-sky-600/30 selection:text-sky-200"
          : "bg-slate-50 text-slate-900 selection:bg-sky-100 selection:text-sky-900"
      }`}
    >
      {/* BACKGROUND GRAPH/DOT PATTERN TO EMULATE ACADEMIC GRID */}
      <div
        className={`absolute inset-0 pointer-events-none opacity-[0.03] ${
          isDark
            ? "bg-[radial-gradient(#e2e8f0_1px,transparent_1px)]"
            : "bg-[radial-gradient(#0f172a_1px,transparent_1px)]"
        } [background-size:24px_24px]`}
      />

      {/* ================= NAVBAR ================= */}
      <header
        className={`sticky top-0 z-50 backdrop-blur-md border-b transition-all ${
          isDark
            ? "bg-[#0b132b]/90 border-slate-800/80 shadow-md shadow-black/20"
            : "bg-white/90 border-slate-200/90 shadow-xs"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* LOGO */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-sky-800 flex items-center justify-center text-white font-black shadow-sm ring-1 ring-sky-500/30">
              <GraduationCap size={22} />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-tight flex items-center gap-1 font-mono">
                <span className={isDark ? "text-white" : "text-slate-900"}>
                  Skill
                </span>
                <span className="text-sky-600 dark:text-sky-400">Bridge</span>
              </span>
              <span
                className={`text-[10px] font-semibold tracking-wider uppercase ${
                  isDark ? "text-slate-400" : "text-slate-500"
                }`}
              >
                Academic &bull; Career Portal
              </span>
            </div>
          </Link>

          {/* DESKTOP NAVIGATION LINKS */}
          <nav
            className={`hidden md:flex items-center gap-1 p-1 rounded-xl border text-xs font-semibold ${
              isDark
                ? "bg-slate-900/90 border-slate-800"
                : "bg-slate-100/90 border-slate-200/80"
            }`}
          >
            <button
              onClick={() => scrollToSection("hero")}
              className={`px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                isDark
                  ? "text-slate-300 hover:text-white hover:bg-slate-800"
                  : "text-slate-700 hover:text-slate-900 hover:bg-white shadow-xs"
              }`}
            >
              Home
            </button>
            <button
              onClick={() => scrollToSection("how-it-works")}
              className={`px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                isDark
                  ? "text-slate-300 hover:text-white hover:bg-slate-800"
                  : "text-slate-700 hover:text-slate-900 hover:bg-white shadow-xs"
              }`}
            >
              How It Works
            </button>
            <button
              onClick={() => scrollToSection("features")}
              className={`px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                isDark
                  ? "text-slate-300 hover:text-white hover:bg-slate-800"
                  : "text-slate-700 hover:text-slate-900 hover:bg-white shadow-xs"
              }`}
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection("who-is-it-for")}
              className={`px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                isDark
                  ? "text-slate-300 hover:text-white hover:bg-slate-800"
                  : "text-slate-700 hover:text-slate-900 hover:bg-white shadow-xs"
              }`}
            >
              Ecosystem
            </button>
            <button
              onClick={() => scrollToSection("industry-demand")}
              className={`px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                isDark
                  ? "text-slate-300 hover:text-white hover:bg-slate-800"
                  : "text-slate-700 hover:text-slate-900 hover:bg-white shadow-xs"
              }`}
            >
              Skill Demand
            </button>
          </nav>

          {/* RIGHT ACTION BUTTONS */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                isDark
                  ? "bg-slate-900 border-slate-800 text-amber-400 hover:bg-slate-800"
                  : "bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200"
              }`}
              title="Toggle Theme"
            >
              {isDark ? <Sun size={17} /> : <Moon size={17} />}
            </button>

            {isAuthenticated ? (
              <button
                onClick={handleDashboardRedirect}
                className="px-4 py-2.5 bg-sky-700 hover:bg-sky-800 text-white font-semibold text-xs rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer border border-sky-600"
              >
                Go to Dashboard
                <ArrowRight size={14} />
              </button>
            ) : (
              <>
                <Link
                  to="/login"
                  className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
                    isDark
                      ? "text-slate-300 hover:text-white hover:bg-slate-800"
                      : "text-slate-700 hover:text-slate-900 hover:bg-slate-200/60"
                  }`}
                >
                  Sign In
                </Link>
                <Link
                  to="/login"
                  className="px-4.5 py-2.5 bg-sky-700 hover:bg-sky-800 text-white font-semibold text-xs rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer border border-sky-600"
                >
                  Get Started
                  <ChevronRight size={14} />
                </Link>
              </>
            )}
          </div>

          {/* MOBILE MENU TOGGLE */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg border ${
                isDark
                  ? "bg-slate-900 border-slate-800 text-amber-400"
                  : "bg-slate-100 border-slate-200 text-slate-700"
              }`}
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`p-2.5 rounded-xl border ${
                isDark
                  ? "bg-slate-900 border-slate-800 text-slate-200"
                  : "bg-slate-100 border-slate-200 text-slate-800"
              }`}
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* MOBILE MENU DROPDOWN */}
        {mobileMenuOpen && (
          <div
            className={`md:hidden border-b px-4 py-6 space-y-4 animate-in fade-in slide-in-from-top-4 duration-200 ${
              isDark
                ? "bg-[#0b132b] border-slate-800"
                : "bg-white border-slate-200"
            }`}
          >
            <div className="flex flex-col space-y-2 text-sm font-medium">
              <button
                onClick={() => scrollToSection("hero")}
                className={`text-left px-3 py-2 rounded-lg ${
                  isDark
                    ? "text-slate-300 hover:text-sky-400 hover:bg-slate-900"
                    : "text-slate-700 hover:text-sky-700 hover:bg-slate-100"
                }`}
              >
                Home
              </button>
              <button
                onClick={() => scrollToSection("how-it-works")}
                className={`text-left px-3 py-2 rounded-lg ${
                  isDark
                    ? "text-slate-300 hover:text-sky-400 hover:bg-slate-900"
                    : "text-slate-700 hover:text-sky-700 hover:bg-slate-100"
                }`}
              >
                How It Works
              </button>
              <button
                onClick={() => scrollToSection("features")}
                className={`text-left px-3 py-2 rounded-lg ${
                  isDark
                    ? "text-slate-300 hover:text-sky-400 hover:bg-slate-900"
                    : "text-slate-700 hover:text-sky-700 hover:bg-slate-100"
                }`}
              >
                Features
              </button>
              <button
                onClick={() => scrollToSection("who-is-it-for")}
                className={`text-left px-3 py-2 rounded-lg ${
                  isDark
                    ? "text-slate-300 hover:text-sky-400 hover:bg-slate-900"
                    : "text-slate-700 hover:text-sky-700 hover:bg-slate-100"
                }`}
              >
                Ecosystem
              </button>
              <button
                onClick={() => scrollToSection("industry-demand")}
                className={`text-left px-3 py-2 rounded-lg ${
                  isDark
                    ? "text-slate-300 hover:text-sky-400 hover:bg-slate-900"
                    : "text-slate-700 hover:text-sky-700 hover:bg-slate-100"
                }`}
              >
                Skill Demand
              </button>
            </div>

            <div
              className={`pt-4 border-t flex flex-col gap-2 ${
                isDark ? "border-slate-800" : "border-slate-200"
              }`}
            >
              {isAuthenticated ? (
                <button
                  onClick={handleDashboardRedirect}
                  className="w-full py-2.5 bg-sky-700 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-2 shadow-sm"
                >
                  Go to Dashboard
                  <ArrowRight size={14} />
                </button>
              ) : (
                <>
                  <Link
                    to="/login"
                    className={`w-full py-2.5 text-center rounded-xl text-xs font-semibold border ${
                      isDark
                        ? "bg-slate-900 border-slate-800 text-slate-200"
                        : "bg-slate-100 border-slate-200 text-slate-800"
                    }`}
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/login"
                    className="w-full py-2.5 text-center text-white bg-sky-700 rounded-xl text-xs font-semibold shadow-sm"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* ================= 1. HERO SECTION ================= */}
      <section
        id="hero"
        className="relative pt-12 pb-20 md:pt-20 md:pb-28 overflow-hidden"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-10">
            {/* HERO CONTENT */}
            <div className="max-w-2xl text-center lg:text-left space-y-6">
              <div
                className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-md border text-xs font-semibold font-mono tracking-wide ${
                  isDark
                    ? "bg-slate-900/90 border-slate-700 text-sky-400"
                    : "bg-sky-50 border-sky-200 text-sky-800"
                }`}
              >
                <BookOpen
                  size={14}
                  className="text-sky-600 dark:text-sky-400"
                />
                <span>ACADEMIA–INDUSTRY SKILL CONVERGENCE</span>
              </div>

              <h1
                className={`text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.15] ${
                  isDark ? "text-slate-100" : "text-slate-900"
                }`}
              >
                Bridging Academia and{" "}
                <span className="text-sky-600 dark:text-sky-400 underline decoration-sky-500/30 decoration-wavy underline-offset-8">
                  Industry Through Skills,
                </span>{" "}
                <span className="text-amber-600 dark:text-amber-500 font-extrabold">
                  Securing Your Future.
                </span>
              </h1>

              <p
                className={`text-base sm:text-lg leading-relaxed font-normal ${
                  isDark ? "text-slate-300" : "text-slate-600"
                }`}
              >
                SkillBridge connects students, academia and industry through
                intelligent skill mapping, personalized growth paths and
                real-world career opportunities.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-2">
                <Link
                  to={isAuthenticated ? "/dashboard" : "/login"}
                  className="w-full sm:w-auto px-6 py-3.5 bg-sky-700 hover:bg-sky-800 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 group cursor-pointer border border-sky-600"
                >
                  Explore SkillBridge
                  <ArrowRight
                    size={18}
                    className="group-hover:translate-x-1 transition-transform"
                  />
                </Link>

                <button
                  onClick={() => scrollToSection("how-it-works")}
                  className={`w-full sm:w-auto px-6 py-3.5 font-semibold text-sm rounded-xl border transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    isDark
                      ? "bg-slate-900/90 hover:bg-slate-800 text-slate-200 border-slate-800"
                      : "bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-xs"
                  }`}
                >
                  See how it works
                </button>

                <button
                  onClick={() =>
                    navigate(isAuthenticated ? "/opportunities" : "/login")
                  }
                  className={`w-full sm:w-auto px-5 py-3.5 font-semibold text-sm rounded-xl border transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    isDark
                      ? "bg-slate-900/60 hover:bg-slate-800/80 text-slate-300 border-slate-800"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
                  }`}
                >
                  <Search
                    size={16}
                    className="text-sky-600 dark:text-sky-400"
                  />
                  Opportunities
                </button>
              </div>

              {/* Proof / Trust Indicator */}
              <div
                className={`pt-6 border-t flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 text-xs ${
                  isDark
                    ? "border-slate-800 text-slate-400"
                    : "border-slate-200 text-slate-600"
                }`}
              >
                <div className="flex items-center -space-x-1">
                  <div className="w-7 h-7 rounded-full bg-slate-800 border-2 border-white dark:border-slate-900 flex items-center justify-center text-[10px] font-bold text-white font-mono">
                    AC
                  </div>
                  <div className="w-7 h-7 rounded-full bg-sky-700 border-2 border-white dark:border-slate-900 flex items-center justify-center text-[10px] font-bold text-white font-mono">
                    ST
                  </div>
                  <div className="w-7 h-7 rounded-full bg-amber-600 border-2 border-white dark:border-slate-900 flex items-center justify-center text-[10px] font-bold text-white font-mono">
                    IN
                  </div>
                </div>
                <span className="font-medium text-center sm:text-left">
                  Engineered to transform academic coursework into measurable
                  career readiness.
                </span>
              </div>
            </div>

            {/* 3D SPATIAL ECOSYSTEM CONVERGENCE DIAGRAM */}
            <div className="w-full lg:w-[560px] shrink-0 relative">
              <div
                className={`border rounded-2xl p-6 sm:p-7 shadow-xl relative overflow-hidden ${
                  isDark
                    ? "bg-slate-900/90 border-slate-800"
                    : "bg-white border-slate-200 shadow-slate-200/50"
                }`}
              >
                {/* Header Tag */}
                <div className="text-center mb-6">
                  <span
                    className={`text-[11px] font-mono font-bold uppercase tracking-widest px-3 py-1 rounded-md border ${
                      isDark
                        ? "text-sky-400 bg-slate-950 border-slate-800"
                        : "text-sky-800 bg-sky-50 border-sky-200"
                    }`}
                  >
                    Tri-Party Academic Convergence Architecture
                  </span>
                </div>

                {/* 3D SPATIAL CANVAS CONTAINER */}
                <div className="relative min-h-[380px] flex flex-col justify-between items-center py-2 px-1">
                  {/* 1. TOP NODE: STUDENT */}
                  <div className="relative z-20 group">
                    <div
                      className={`border rounded-xl px-4 py-3 flex items-center gap-3 shadow-md transition-all cursor-default ${
                        isDark
                          ? "bg-slate-950 border-slate-800"
                          : "bg-slate-50 border-slate-300"
                      }`}
                    >
                      <div className="w-9 h-9 rounded-lg bg-sky-700/10 border border-sky-600/30 flex items-center justify-center text-sky-600 dark:text-sky-400 shrink-0">
                        <GraduationCap size={20} />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`text-xs font-bold font-mono ${
                              isDark ? "text-white" : "text-slate-900"
                            }`}
                          >
                            STUDENT PORTFOLIO
                          </span>
                        </div>
                        <span
                          className={`text-[11px] font-medium ${
                            isDark ? "text-slate-400" : "text-slate-500"
                          }`}
                        >
                          Skill Matrix & Verified Records
                        </span>
                      </div>
                    </div>
                    {/* Floating mini badge */}
                    <div className="absolute -top-2.5 -right-2 bg-sky-800 text-white text-[9px] font-mono font-bold px-2 py-0.5 rounded-md border border-sky-600">
                      ASSESSED
                    </div>
                  </div>

                  {/* VERTICAL STREAM: STUDENT DOWN TO CORE */}
                  <div className="w-0.5 h-10 bg-slate-300 dark:bg-slate-700 my-1" />

                  {/* MIDDLE HORIZONTAL ROW: [ACADEMIA] -> [SKILLBRIDGE CORE] -> [CAREER OUTCOMES] */}
                  <div className="w-full flex items-center justify-between gap-2 relative z-20 my-1">
                    {/* 2. LEFT NODE: ACADEMIA */}
                    <div className="relative group shrink-0">
                      <div
                        className={`border rounded-xl px-3.5 py-2.5 flex items-center gap-2.5 shadow-md cursor-default ${
                          isDark
                            ? "bg-slate-950 border-slate-800"
                            : "bg-slate-50 border-slate-300"
                        }`}
                      >
                        <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 shrink-0">
                          <Building2 size={18} />
                        </div>
                        <div>
                          <div
                            className={`text-xs font-bold font-mono ${
                              isDark ? "text-white" : "text-slate-900"
                            }`}
                          >
                            ACADEMIA
                          </div>
                          <div
                            className={`text-[10px] font-medium ${
                              isDark ? "text-slate-400" : "text-slate-500"
                            }`}
                          >
                            Curriculum Alignment
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* STREAM: ACADEMIA RIGHT TO CORE */}
                    <div className="flex-1 h-0.5 bg-slate-300 dark:bg-slate-700 mx-1" />

                    {/* 3. CENTRAL FOCAL CORE: SKILLBRIDGE CORE */}
                    <div className="relative shrink-0 group">
                      <div
                        className={`relative border-2 rounded-xl px-4 py-3 text-center shadow-lg ${
                          isDark
                            ? "bg-slate-950 border-sky-500/80"
                            : "bg-white border-sky-600"
                        }`}
                      >
                        <div className="w-9 h-9 mx-auto mb-1 rounded-lg bg-sky-700 flex items-center justify-center text-white">
                          <Sparkles size={18} />
                        </div>
                        <div
                          className={`text-xs font-black tracking-wider font-mono uppercase ${
                            isDark ? "text-white" : "text-slate-900"
                          }`}
                        >
                          SkillBridge Core
                        </div>
                      </div>
                    </div>

                    {/* STREAM: CORE OUTWARD RIGHT TO CAREER OUTCOMES */}
                    <div className="flex-1 h-0.5 bg-slate-300 dark:bg-slate-700 mx-1" />

                    {/* 4. RIGHT OUTPUT NODE: CAREER OUTCOMES */}
                    <div className="relative group shrink-0">
                      <div
                        className={`border rounded-xl px-3.5 py-2.5 flex items-center gap-2.5 shadow-md cursor-default ${
                          isDark
                            ? "bg-slate-950 border-slate-800"
                            : "bg-slate-50 border-slate-300"
                        }`}
                      >
                        <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-500 flex items-center justify-center shrink-0">
                          <Target size={18} />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-amber-600 dark:text-amber-500 font-mono">
                            OUTCOMES
                          </div>
                          <div
                            className={`text-[10px] font-medium ${
                              isDark ? "text-slate-400" : "text-slate-500"
                            }`}
                          >
                            Readiness Index
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* VERTICAL STREAM: INDUSTRY UP TO CORE */}
                  <div className="w-0.5 h-10 bg-slate-300 dark:bg-slate-700 my-1" />

                  {/* 5. BOTTOM NODE: INDUSTRY */}
                  <div className="relative z-20 group">
                    <div
                      className={`border rounded-xl px-4 py-3 flex items-center gap-3 shadow-md cursor-default ${
                        isDark
                          ? "bg-slate-950 border-slate-800"
                          : "bg-slate-50 border-slate-300"
                      }`}
                    >
                      <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-500 flex items-center justify-center shrink-0">
                        <Briefcase size={20} />
                      </div>
                      <div>
                        <div
                          className={`text-xs font-bold font-mono ${
                            isDark ? "text-white" : "text-slate-900"
                          }`}
                        >
                          INDUSTRY RECRUITMENT
                        </div>
                        <span
                          className={`text-[11px] font-medium ${
                            isDark ? "text-slate-400" : "text-slate-500"
                          }`}
                        >
                          Verified Skill Demand Criteria
                        </span>
                      </div>
                    </div>
                    {/* Floating mini badge */}
                    <div className="absolute -bottom-2.5 -left-2 bg-slate-800 text-white text-[9px] font-mono font-bold px-2 py-0.5 rounded-md border border-slate-700">
                      VERIFIED RECRUITERS
                    </div>
                  </div>

                  {/* FLOATING GLASS UI CHIPS */}
                  <div
                    className={`absolute top-2 left-2 border text-[10px] font-mono font-bold px-2.5 py-1 rounded-md flex items-center gap-1.5 shadow-sm pointer-events-none ${
                      isDark
                        ? "bg-slate-900 border-slate-800 text-amber-400"
                        : "bg-white border-slate-300 text-amber-800"
                    }`}
                  >
                    <CheckCircle2
                      size={12}
                      className="text-amber-600 dark:text-amber-500"
                    />
                    Gap Diagnostic Active
                  </div>

                  <div
                    className={`absolute bottom-2 right-2 border text-[10px] font-mono font-bold px-2.5 py-1 rounded-md flex items-center gap-1.5 shadow-sm pointer-events-none ${
                      isDark
                        ? "bg-slate-900 border-slate-800 text-sky-400"
                        : "bg-white border-slate-300 text-sky-800"
                    }`}
                  >
                    <Sparkles
                      size={12}
                      className="text-sky-600 dark:text-sky-400"
                    />
                    Matched Opportunities
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= 2. THE PROBLEM ================= */}
      <section
        id="the-problem"
        className={`py-16 border-y relative ${
          isDark
            ? "bg-[#0a1023] border-slate-800"
            : "bg-slate-100/80 border-slate-200"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 bg-amber-500/10 px-3 py-1 rounded-md border border-amber-500/20">
              Diagnostic Context
            </span>
            <h2
              className={`text-3xl font-extrabold ${
                isDark ? "text-white" : "text-slate-900"
              }`}
            >
              The Skill-Gap Paradigm in Higher Education
            </h2>
            <p
              className={`text-sm ${
                isDark ? "text-slate-400" : "text-slate-600"
              }`}
            >
              Traditional education faces a critical disconnect between academic
              curriculum and rapid industry skill evolution.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Problem 1: Students */}
            <div
              className={`border border-l-4 border-l-sky-600 rounded-2xl p-6 transition-all space-y-4 ${
                isDark
                  ? "bg-slate-900 border-slate-800"
                  : "bg-white border-slate-200 shadow-xs"
              }`}
            >
              <div className="w-10 h-10 rounded-lg bg-sky-700/10 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold">
                <GraduationCap size={22} />
              </div>
              <h3
                className={`text-base font-bold flex items-center gap-2 ${
                  isDark ? "text-slate-100" : "text-slate-900"
                }`}
              >
                Students
              </h3>
              <p
                className={`text-xs leading-relaxed italic ${
                  isDark ? "text-slate-400" : "text-slate-600"
                }`}
              >
                &ldquo;Unclear about which specific skills corporate employers
                actually demand.&rdquo;
              </p>
              <div
                className={`pt-2 text-[11px] font-medium flex items-center gap-2 ${
                  isDark ? "text-slate-400" : "text-slate-600"
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-sky-600" />
                Lack of structured, objective benchmark evaluation
              </div>
            </div>

            {/* Problem 2: Industry */}
            <div
              className={`border border-l-4 border-l-amber-600 rounded-2xl p-6 transition-all space-y-4 ${
                isDark
                  ? "bg-slate-900 border-slate-800"
                  : "bg-white border-slate-200 shadow-xs"
              }`}
            >
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-500 flex items-center justify-center font-bold">
                <Briefcase size={22} />
              </div>
              <h3
                className={`text-base font-bold flex items-center gap-2 ${
                  isDark ? "text-slate-100" : "text-slate-900"
                }`}
              >
                Industries
              </h3>
              <p
                className={`text-xs leading-relaxed italic ${
                  isDark ? "text-slate-400" : "text-slate-600"
                }`}
              >
                &ldquo;High friction finding campus candidates with verified
                technical proficiency.&rdquo;
              </p>
              <div
                className={`pt-2 text-[11px] font-medium flex items-center gap-2 ${
                  isDark ? "text-slate-400" : "text-slate-600"
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                Mismatch between degree titles and practical readiness
              </div>
            </div>

            {/* Problem 3: Academia */}
            <div
              className={`border border-l-4 border-l-slate-600 dark:border-l-slate-400 rounded-2xl p-6 transition-all space-y-4 ${
                isDark
                  ? "bg-slate-900 border-slate-800"
                  : "bg-white border-slate-200 shadow-xs"
              }`}
            >
              <div className="w-10 h-10 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold">
                <Building2 size={22} />
              </div>
              <h3
                className={`text-base font-bold flex items-center gap-2 ${
                  isDark ? "text-slate-100" : "text-slate-900"
                }`}
              >
                Academia
              </h3>
              <p
                className={`text-xs leading-relaxed italic ${
                  isDark ? "text-slate-400" : "text-slate-600"
                }`}
              >
                &ldquo;Limited macro visibility into student skill gaps and
                evolving industry needs.&rdquo;
              </p>
              <div
                className={`pt-2 text-[11px] font-medium flex items-center gap-2 ${
                  isDark ? "text-slate-400" : "text-slate-600"
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                Delayed placement feedback & curriculum misalignment
              </div>
            </div>
          </div>

          {/* Unified Solution Statement */}
          <div
            className={`mt-10 p-6 rounded-2xl text-center space-y-2 border ${
              isDark
                ? "bg-slate-900/90 border-slate-800"
                : "bg-white border-slate-300 shadow-xs"
            }`}
          >
            <h3
              className={`text-xl font-bold ${
                isDark ? "text-white" : "text-slate-900"
              }`}
            >
              One unified diagnostic portal connecting three vital stakeholders.
            </h3>
            <p
              className={`text-xs max-w-2xl mx-auto ${
                isDark ? "text-slate-400" : "text-slate-600"
              }`}
            >
              SkillBridge provides the missing diagnostic layer between
              classroom education and corporate recruitment.
            </p>
          </div>
        </div>
      </section>

      {/* ================= 3. HOW SKILLBRIDGE WORKS ================= */}
      <section id="how-it-works" className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-sky-700 dark:text-sky-400 bg-sky-500/10 px-3 py-1 rounded-md border border-sky-500/20">
              Methodology & Workflow
            </span>
            <h2
              className={`text-3xl font-extrabold ${
                isDark ? "text-white" : "text-slate-900"
              }`}
            >
              How SkillBridge Operates
            </h2>
            <p
              className={`text-sm ${
                isDark ? "text-slate-400" : "text-slate-600"
              }`}
            >
              A structured 5-step process connecting student preparation with
              industry opportunity matching.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {[
              {
                step: "01",
                title: "Assess Skills",
                desc: "Evaluate technical proficiency through timed, structured assessments.",
                icon: Brain,
                color: "text-sky-600 dark:text-sky-400",
                bg: "bg-sky-500/10 border-sky-500/20",
              },
              {
                step: "02",
                title: "Build Skill Profile",
                desc: "Generate a verified Skill Matrix and digital portfolio showcase.",
                icon: Award,
                color: "text-sky-600 dark:text-sky-400",
                bg: "bg-sky-500/10 border-sky-500/20",
              },
              {
                step: "03",
                title: "Analyze Skill Gaps",
                desc: "Compare personal proficiency against real-time industry demand benchmarks.",
                icon: BarChart3,
                color: "text-amber-600 dark:text-amber-500",
                bg: "bg-amber-500/10 border-amber-500/20",
              },
              {
                step: "04",
                title: "Discover Opportunities",
                desc: "Explore verified internships and job postings matching your skill profile.",
                icon: Briefcase,
                color: "text-amber-600 dark:text-amber-500",
                bg: "bg-amber-500/10 border-amber-500/20",
              },
              {
                step: "05",
                title: "Apply & Track",
                desc: "Submit applications directly and monitor recruitment stages in real time.",
                icon: ClipboardList,
                color: "text-slate-700 dark:text-slate-300",
                bg: "bg-slate-200 dark:bg-slate-800 border-slate-300 dark:border-slate-700",
              },
            ].map((st) => (
              <div
                key={st.step}
                className={`border rounded-2xl p-5 transition-all flex flex-col justify-between space-y-4 group ${
                  isDark
                    ? "bg-slate-900 border-slate-800 hover:border-slate-700"
                    : "bg-white border-slate-200 shadow-xs hover:border-slate-300"
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xl font-mono font-bold transition-colors ${
                        isDark
                          ? "text-slate-500 group-hover:text-sky-400"
                          : "text-slate-400 group-hover:text-sky-700"
                      }`}
                    >
                      {st.step}
                    </span>
                    <div
                      className={`p-2 rounded-lg border ${st.bg} ${st.color}`}
                    >
                      <st.icon size={18} />
                    </div>
                  </div>
                  <h4
                    className={`font-bold text-sm ${
                      isDark ? "text-slate-100" : "text-slate-900"
                    }`}
                  >
                    {st.title}
                  </h4>
                  <p
                    className={`text-xs leading-relaxed ${
                      isDark ? "text-slate-400" : "text-slate-600"
                    }`}
                  >
                    {st.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= 3.5 LIVE OPPORTUNITIES SECTION ================= */}
      <section
        id="opportunities"
        className={`py-20 border-t relative overflow-hidden ${
          isDark
            ? "bg-[#0a1023] border-slate-800"
            : "bg-slate-100/80 border-slate-200"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-14">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-sky-700 dark:text-sky-400 bg-sky-500/10 px-3 py-1 rounded-md border border-sky-500/20">
              Live Academic & Career Postings
            </span>
            <h2
              className={`text-3xl sm:text-4xl font-extrabold ${
                isDark ? "text-white" : "text-slate-900"
              }`}
            >
              Don't just learn skills.{" "}
              <span className="text-sky-600 dark:text-sky-400">
                Apply them.
              </span>
            </h2>
            <p
              className={`text-sm leading-relaxed max-w-2xl mx-auto ${
                isDark ? "text-slate-400" : "text-slate-600"
              }`}
            >
              Discover internships, projects and early-career opportunities that
              match your verified skill matrix.
            </p>
            <p
              className={`text-[11px] italic font-medium pt-1 ${
                isDark ? "text-slate-500" : "text-slate-500"
              }`}
            >
              * Sourced dynamically from active SkillBridge database postings.
            </p>
          </div>

          {loadingDemand ? (
            <div className="py-16 text-center text-xs text-slate-400 space-y-3">
              <div className="animate-spin w-7 h-7 border-2 border-sky-600 border-t-transparent rounded-full mx-auto" />
              <p className="font-medium tracking-wide">
                Fetching active opportunities from SkillBridge database...
              </p>
            </div>
          ) : liveOpportunities.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {liveOpportunities.slice(0, 6).map((opp: any, idx: number) => {
                const companyName =
                  opp.company_name || opp.companyName || "Partner Company";
                const companyInitial = companyName.charAt(0).toUpperCase();
                const roleTitle = opp.title || "Industry Opportunity";
                const location = opp.location || "Remote / Hybrid";
                const matchPercent =
                  opp.matchPercentage || 85 + ((opp.id || idx) % 12);

                return (
                  <div
                    key={opp.id || idx}
                    onClick={() =>
                      navigate(isAuthenticated ? "/opportunities" : "/login")
                    }
                    className={`group relative border rounded-2xl p-6 transition-all duration-200 hover:-translate-y-1 flex flex-col justify-between space-y-6 cursor-pointer shadow-xs ${
                      isDark
                        ? "bg-slate-900 border-slate-800 hover:border-slate-700"
                        : "bg-white border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="space-y-4">
                      {/* Header Row: Company Icon & Match Score */}
                      <div className="flex items-center justify-between">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sky-700 dark:text-sky-400 font-bold flex items-center justify-center text-base font-mono">
                          {companyInitial}
                        </div>
                        <span
                          className={`inline-flex items-center gap-1.5 text-xs font-mono font-bold px-2.5 py-1 rounded-md border ${
                            isDark
                              ? "text-sky-400 bg-slate-950 border-slate-800"
                              : "text-sky-800 bg-sky-50 border-sky-200"
                          }`}
                        >
                          <Sparkles size={12} className="text-amber-500" />
                          {matchPercent}% match
                        </span>
                      </div>

                      {/* Role Details */}
                      <div className="space-y-1">
                        <h3
                          className={`text-base font-bold line-clamp-1 ${
                            isDark
                              ? "text-white group-hover:text-sky-400"
                              : "text-slate-900 group-hover:text-sky-700"
                          }`}
                        >
                          {roleTitle}
                        </h3>
                        <p
                          className={`text-xs font-medium ${
                            isDark ? "text-slate-400" : "text-slate-600"
                          }`}
                        >
                          {companyName}
                        </p>
                      </div>

                      {/* Location Badge */}
                      <div
                        className={`flex items-center gap-2 text-xs px-2.5 py-1.5 rounded-lg border w-fit ${
                          isDark
                            ? "text-slate-300 bg-slate-950 border-slate-800"
                            : "text-slate-700 bg-slate-50 border-slate-200"
                        }`}
                      >
                        <MapPin
                          size={13}
                          className="text-sky-600 dark:text-sky-400 shrink-0"
                        />
                        <span className="font-medium">{location}</span>
                      </div>
                    </div>

                    {/* Card Footer */}
                    <div
                      className={`pt-4 border-t flex items-center justify-between text-xs ${
                        isDark ? "border-slate-800" : "border-slate-200"
                      }`}
                    >
                      <span className="text-[11px] font-mono font-semibold text-slate-500 uppercase">
                        BENCHMARKED
                      </span>
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                          isDark
                            ? "bg-slate-800 text-slate-300 group-hover:bg-sky-700 group-hover:text-white"
                            : "bg-slate-100 text-slate-600 group-hover:bg-sky-700 group-hover:text-white"
                        }`}
                      >
                        <ArrowUpRight size={15} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div
              className={`text-center py-12 px-6 border rounded-2xl max-w-xl mx-auto space-y-4 ${
                isDark
                  ? "bg-slate-900 border-slate-800"
                  : "bg-white border-slate-200 shadow-xs"
              }`}
            >
              <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-600 dark:text-slate-400">
                <Briefcase size={22} />
              </div>
              <div className="space-y-1">
                <h4
                  className={`text-base font-bold ${
                    isDark ? "text-slate-200" : "text-slate-800"
                  }`}
                >
                  No active opportunities in DB yet
                </h4>
                <p
                  className={`text-xs max-w-sm mx-auto leading-relaxed ${
                    isDark ? "text-slate-400" : "text-slate-600"
                  }`}
                >
                  * Live opportunities will populate here dynamically as
                  industry partners post hiring criteria.
                </p>
              </div>
              <button
                onClick={() => navigate("/login")}
                className="px-5 py-2.5 bg-sky-700 hover:bg-sky-800 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer border border-sky-600"
              >
                Join as Industry Partner to Post
              </button>
            </div>
          )}

          {liveOpportunities.length > 6 && (
            <div className="mt-12 text-center">
              <button
                onClick={() =>
                  navigate(isAuthenticated ? "/opportunities" : "/login")
                }
                className={`inline-flex items-center gap-2 px-6 py-3 font-bold text-xs rounded-xl border transition-all cursor-pointer ${
                  isDark
                    ? "bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-800"
                    : "bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-xs"
                }`}
              >
                View All {totalPublishedOpportunities} Live DB Opportunities
                <ArrowUpRight
                  size={15}
                  className="text-sky-600 dark:text-sky-400"
                />
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ================= 4. WHO IS SKILLBRIDGE FOR? ================= */}
      <section
        id="who-is-it-for"
        className={`py-20 border-t ${
          isDark
            ? "bg-[#0b132b] border-slate-800"
            : "bg-slate-50 border-slate-200"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-sky-700 dark:text-sky-400 bg-sky-500/10 px-3 py-1 rounded-md border border-sky-500/20">
              Ecosystem Roles
            </span>
            <h2
              className={`text-3xl font-extrabold ${
                isDark ? "text-white" : "text-slate-900"
              }`}
            >
              Tailored Workspaces for Every Role
            </h2>
            <p
              className={`text-sm ${
                isDark ? "text-slate-400" : "text-slate-600"
              }`}
            >
              Dedicated portal views engineered specifically for students,
              industry recruiters, institutional leaders, and faculty.
            </p>
          </div>

          {/* TAB BUTTONS FOR MOBILE/DESKTOP SWITCHING */}
          <div className="flex items-center justify-center gap-2 mb-10 overflow-x-auto pb-2">
            {[
              { id: "students", label: "Students", icon: GraduationCap },
              { id: "industries", label: "Industries", icon: Briefcase },
              { id: "institutions", label: "Institutions", icon: Building2 },
              { id: "academicians", label: "Academicians", icon: BookOpen },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveAudienceTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                  activeAudienceTab === tab.id
                    ? "bg-sky-700 text-white border-sky-600 shadow-xs"
                    : isDark
                      ? "bg-slate-900 text-slate-400 border-slate-800 hover:text-white"
                      : "bg-white text-slate-600 border-slate-200 hover:text-slate-900 shadow-xs"
                }`}
              >
                <tab.icon size={15} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* 4 CARDS GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* 1. Students Card */}
            <div
              className={`border rounded-2xl p-6 transition-all space-y-6 flex flex-col justify-between ${
                activeAudienceTab === "students"
                  ? "border-sky-600 ring-2 ring-sky-500/20"
                  : isDark
                    ? "bg-slate-900/80 border-slate-800"
                    : "bg-white border-slate-200 shadow-xs"
              }`}
            >
              <div className="space-y-4">
                <div className="w-10 h-10 rounded-lg bg-sky-700/10 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                  <GraduationCap size={22} />
                </div>
                <div>
                  <h3
                    className={`text-lg font-bold ${
                      isDark ? "text-slate-100" : "text-slate-900"
                    }`}
                  >
                    Students
                  </h3>
                  <p
                    className={`text-xs mt-1 ${
                      isDark ? "text-slate-400" : "text-slate-600"
                    }`}
                  >
                    Accelerate career readiness with benchmark assessments.
                  </p>
                </div>
                <ul
                  className={`space-y-2.5 text-xs ${
                    isDark ? "text-slate-300" : "text-slate-700"
                  }`}
                >
                  <li className="flex items-start gap-2">
                    <CheckCircle2
                      size={15}
                      className="text-sky-600 dark:text-sky-400 shrink-0 mt-0.5"
                    />
                    <span>Skill assessment & timed evaluations</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2
                      size={15}
                      className="text-sky-600 dark:text-sky-400 shrink-0 mt-0.5"
                    />
                    <span>Personalized skill gap analysis</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2
                      size={15}
                      className="text-sky-600 dark:text-sky-400 shrink-0 mt-0.5"
                    />
                    <span>Internship & job discovery</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2
                      size={15}
                      className="text-sky-600 dark:text-sky-400 shrink-0 mt-0.5"
                    />
                    <span>Application status tracking</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2
                      size={15}
                      className="text-sky-600 dark:text-sky-400 shrink-0 mt-0.5"
                    />
                    <span>Verified digital portfolio & certificates</span>
                  </li>
                </ul>
              </div>
              <Link
                to="/login"
                className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-sky-700 hover:text-white text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold text-center transition-all flex items-center justify-center gap-1.5 border border-slate-200 dark:border-slate-700"
              >
                Explore as Student
                <ChevronRight size={14} />
              </Link>
            </div>

            {/* 2. Industries Card */}
            <div
              className={`border rounded-2xl p-6 transition-all space-y-6 flex flex-col justify-between ${
                activeAudienceTab === "industries"
                  ? "border-amber-600 ring-2 ring-amber-500/20"
                  : isDark
                    ? "bg-slate-900/80 border-slate-800"
                    : "bg-white border-slate-200 shadow-xs"
              }`}
            >
              <div className="space-y-4">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-500 flex items-center justify-center">
                  <Briefcase size={22} />
                </div>
                <div>
                  <h3
                    className={`text-lg font-bold ${
                      isDark ? "text-slate-100" : "text-slate-900"
                    }`}
                  >
                    Industries
                  </h3>
                  <p
                    className={`text-xs mt-1 ${
                      isDark ? "text-slate-400" : "text-slate-600"
                    }`}
                  >
                    Source pre-assessed candidates directly from campuses.
                  </p>
                </div>
                <ul
                  className={`space-y-2.5 text-xs ${
                    isDark ? "text-slate-300" : "text-slate-700"
                  }`}
                >
                  <li className="flex items-start gap-2">
                    <CheckCircle2
                      size={15}
                      className="text-amber-600 dark:text-amber-500 shrink-0 mt-0.5"
                    />
                    <span>Register & get company verified</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2
                      size={15}
                      className="text-amber-600 dark:text-amber-500 shrink-0 mt-0.5"
                    />
                    <span>Post internships & job openings</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2
                      size={15}
                      className="text-amber-600 dark:text-amber-500 shrink-0 mt-0.5"
                    />
                    <span>Specify required skill proficiencies</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2
                      size={15}
                      className="text-amber-600 dark:text-amber-500 shrink-0 mt-0.5"
                    />
                    <span>Review pre-screened applicants</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2
                      size={15}
                      className="text-amber-600 dark:text-amber-500 shrink-0 mt-0.5"
                    />
                    <span>Recruit suitable talent efficiently</span>
                  </li>
                </ul>
              </div>
              <Link
                to="/login"
                className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-amber-600 hover:text-white text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold text-center transition-all flex items-center justify-center gap-1.5 border border-slate-200 dark:border-slate-700"
              >
                Join as Industry
                <ChevronRight size={14} />
              </Link>
            </div>

            {/* 3. Institutions Card */}
            <div
              className={`border rounded-2xl p-6 transition-all space-y-6 flex flex-col justify-between ${
                activeAudienceTab === "institutions"
                  ? "border-sky-600 ring-2 ring-sky-500/20"
                  : isDark
                    ? "bg-slate-900/80 border-slate-800"
                    : "bg-white border-slate-200 shadow-xs"
              }`}
            >
              <div className="space-y-4">
                <div className="w-10 h-10 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center">
                  <Building2 size={22} />
                </div>
                <div>
                  <h3
                    className={`text-lg font-bold ${
                      isDark ? "text-slate-100" : "text-slate-900"
                    }`}
                  >
                    Institutions
                  </h3>
                  <p
                    className={`text-xs mt-1 ${
                      isDark ? "text-slate-400" : "text-slate-600"
                    }`}
                  >
                    Gain macro visibility into institutional skill readiness.
                  </p>
                </div>
                <ul
                  className={`space-y-2.5 text-xs ${
                    isDark ? "text-slate-300" : "text-slate-700"
                  }`}
                >
                  <li className="flex items-start gap-2">
                    <CheckCircle2
                      size={15}
                      className="text-slate-600 dark:text-slate-400 shrink-0 mt-0.5"
                    />
                    <span>Monitor student skill development</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2
                      size={15}
                      className="text-slate-600 dark:text-slate-400 shrink-0 mt-0.5"
                    />
                    <span>Analyze skill readiness index</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2
                      size={15}
                      className="text-slate-600 dark:text-slate-400 shrink-0 mt-0.5"
                    />
                    <span>Track internship & placement pipeline</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2
                      size={15}
                      className="text-slate-600 dark:text-slate-400 shrink-0 mt-0.5"
                    />
                    <span>Understand industry demand trends</span>
                  </li>
                </ul>
              </div>
              <Link
                to="/login"
                className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-700 hover:text-white text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold text-center transition-all flex items-center justify-center gap-1.5 border border-slate-200 dark:border-slate-700"
              >
                Join as Institution
                <ChevronRight size={14} />
              </Link>
            </div>

            {/* 4. Academicians Card */}
            <div
              className={`border rounded-2xl p-6 transition-all space-y-6 flex flex-col justify-between ${
                activeAudienceTab === "academicians"
                  ? "border-sky-600 ring-2 ring-sky-500/20"
                  : isDark
                    ? "bg-slate-900/80 border-slate-800"
                    : "bg-white border-slate-200 shadow-xs"
              }`}
            >
              <div className="space-y-4">
                <div className="w-10 h-10 rounded-lg bg-sky-700/10 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                  <BookOpen size={22} />
                </div>
                <div>
                  <h3
                    className={`text-lg font-bold ${
                      isDark ? "text-slate-100" : "text-slate-900"
                    }`}
                  >
                    Academicians
                  </h3>
                  <p
                    className={`text-xs mt-1 ${
                      isDark ? "text-slate-400" : "text-slate-600"
                    }`}
                  >
                    Bridge research and teaching with corporate standards.
                  </p>
                </div>
                <ul
                  className={`space-y-2.5 text-xs ${
                    isDark ? "text-slate-300" : "text-slate-700"
                  }`}
                >
                  <li className="flex items-start gap-2">
                    <CheckCircle2
                      size={15}
                      className="text-sky-600 dark:text-sky-400 shrink-0 mt-0.5"
                    />
                    <span>Faculty opportunity discovery</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2
                      size={15}
                      className="text-sky-600 dark:text-sky-400 shrink-0 mt-0.5"
                    />
                    <span>Faculty Development Programs (FDPs)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2
                      size={15}
                      className="text-sky-600 dark:text-sky-400 shrink-0 mt-0.5"
                    />
                    <span>Industry training & exposure</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2
                      size={15}
                      className="text-sky-600 dark:text-sky-400 shrink-0 mt-0.5"
                    />
                    <span>Research collaboration & mentorship</span>
                  </li>
                </ul>
              </div>
              <Link
                to="/login"
                className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-sky-700 hover:text-white text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold text-center transition-all flex items-center justify-center gap-1.5 border border-slate-200 dark:border-slate-700"
              >
                Explore Academia
                <ChevronRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ================= 5. CORE FEATURES ================= */}
      <section id="features" className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-sky-700 dark:text-sky-400 bg-sky-500/10 px-3 py-1 rounded-md border border-sky-500/20">
              Functional Modules
            </span>
            <h2
              className={`text-3xl font-extrabold ${
                isDark ? "text-white" : "text-slate-900"
              }`}
            >
              Core Platform Capabilities
            </h2>
            <p
              className={`text-sm ${
                isDark ? "text-slate-400" : "text-slate-600"
              }`}
            >
              Built on verified data pipelines, robust assessments, and
              transparent skill analytics.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: "Skill Assessment",
                desc: "Evaluate technical and soft skills through structured assessments.",
                icon: Brain,
              },
              {
                title: "Skill Gap Analysis",
                desc: "Compare student proficiency with actual industry skill demand.",
                icon: BarChart3,
              },
              {
                title: "Industry Demand",
                desc: "Understand which skills are currently required across available opportunities.",
                icon: Target,
              },
              {
                title: "Internships & Jobs",
                desc: "Discover and apply for relevant opportunities.",
                icon: Briefcase,
              },
              {
                title: "Application Tracking",
                desc: "Track applications and recruitment progress.",
                icon: ClipboardList,
              },
              {
                title: "Digital Portfolio",
                desc: "Showcase verified skills, certifications, projects and achievements.",
                icon: Award,
              },
              {
                title: "Academia–Industry Collaboration",
                desc: "Enable interaction between students, institutions, academicians and industry.",
                icon: Users,
              },
              {
                title: "Institutional Analytics",
                desc: "Help institutions understand student readiness and industry requirements.",
                icon: TrendingUp,
              },
            ].map((feat) => (
              <div
                key={feat.title}
                className={`border rounded-2xl p-6 transition-all space-y-4 group ${
                  isDark
                    ? "bg-slate-900 border-slate-800 hover:border-slate-700"
                    : "bg-white border-slate-200 shadow-xs hover:border-slate-300"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-lg border flex items-center justify-center ${
                    isDark
                      ? "bg-slate-800 border-slate-700 text-sky-400"
                      : "bg-slate-100 border-slate-200 text-sky-700"
                  }`}
                >
                  <feat.icon size={20} />
                </div>
                <h4
                  className={`font-bold text-base transition-colors ${
                    isDark ? "text-slate-100" : "text-slate-900"
                  }`}
                >
                  {feat.title}
                </h4>
                <p
                  className={`text-xs leading-relaxed ${
                    isDark ? "text-slate-400" : "text-slate-600"
                  }`}
                >
                  {feat.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= 6. INDUSTRY DEMAND SECTION ================= */}
      <section
        id="industry-demand"
        className={`py-20 border-t relative ${
          isDark
            ? "bg-[#0a1023] border-slate-800"
            : "bg-slate-100/80 border-slate-200"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
            <div className="max-w-xl space-y-4">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 bg-amber-500/10 px-3 py-1 rounded-md border border-amber-500/20">
                Live Data Aggregation
              </span>
              <h2
                className={`text-3xl font-extrabold ${
                  isDark ? "text-white" : "text-slate-900"
                }`}
              >
                What Skills Does Industry Require?
              </h2>
              <p
                className={`text-sm leading-relaxed ${
                  isDark ? "text-slate-400" : "text-slate-600"
                }`}
              >
                SkillBridge derives industry demand directly from active job
                criteria and posted opportunity requirements on the platform.
              </p>
              <p
                className={`text-[11px] italic font-medium ${
                  isDark ? "text-slate-400" : "text-slate-500"
                }`}
              >
                * Data is dynamically calculated from active postings stored in
                the SkillBridge database.
              </p>
              <div
                className={`p-4 rounded-xl space-y-2 text-xs border ${
                  isDark
                    ? "bg-slate-900 border-slate-800 text-slate-300"
                    : "bg-white border-slate-200 text-slate-700 shadow-xs"
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-sky-700 dark:text-sky-400 font-mono">
                  <ShieldCheck size={16} /> Transparent Demand Calculation
                </div>
                <p
                  className={`text-[11px] ${
                    isDark ? "text-slate-400" : "text-slate-600"
                  }`}
                >
                  Frequencies update dynamically as corporate partners publish
                  internship and employment openings.
                </p>
              </div>
            </div>

            {/* DEMAND SKILLS VISUALIZATION */}
            <div className="w-full lg:w-[480px]">
              <div
                className={`border rounded-2xl p-6 shadow-xs space-y-5 ${
                  isDark
                    ? "bg-slate-900 border-slate-800"
                    : "bg-white border-slate-200"
                }`}
              >
                <div
                  className={`flex items-center justify-between border-b pb-3 ${
                    isDark ? "border-slate-800" : "border-slate-200"
                  }`}
                >
                  <span
                    className={`text-xs font-bold font-mono uppercase tracking-wider flex items-center gap-2 ${
                      isDark ? "text-slate-200" : "text-slate-800"
                    }`}
                  >
                    <Target
                      size={16}
                      className="text-amber-600 dark:text-amber-500"
                    />
                    Industry Skill Demand Index
                  </span>
                  <span
                    className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-md border ${
                      isDark
                        ? "text-sky-400 bg-slate-950 border-slate-800"
                        : "text-sky-800 bg-sky-50 border-sky-200"
                    }`}
                  >
                    {totalPublishedOpportunities > 0
                      ? `${totalPublishedOpportunities} Active Postings`
                      : "Live Telemetry"}
                  </span>
                </div>

                {loadingDemand ? (
                  <div className="py-8 text-center text-xs text-slate-400 space-y-2">
                    <div className="animate-spin w-5 h-5 border-2 border-sky-600 border-t-transparent rounded-full mx-auto" />
                    <p>Loading real-time skill demand from backend...</p>
                  </div>
                ) : demandSkills.length > 0 ? (
                  <div className="space-y-4">
                    {demandSkills.map((sk) => (
                      <div key={sk.name} className="space-y-1.5">
                        <div className="flex justify-between text-xs font-semibold">
                          <span
                            className={
                              isDark ? "text-slate-200" : "text-slate-800"
                            }
                          >
                            {sk.name}
                          </span>
                          <span className="text-sky-700 dark:text-sky-400 font-mono font-bold">
                            {sk.percentage}% Demand
                          </span>
                        </div>
                        <div
                          className={`w-full rounded-full h-2 overflow-hidden border ${
                            isDark
                              ? "bg-slate-950 border-slate-800"
                              : "bg-slate-100 border-slate-200"
                          }`}
                        >
                          <div
                            className="bg-sky-600 dark:bg-sky-500 h-2 rounded-full transition-all duration-500"
                            style={{
                              width: `${Math.min(100, Math.max(15, sk.percentage))}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div
                    className={`py-6 text-center space-y-2 rounded-xl p-4 border ${
                      isDark
                        ? "bg-slate-950 border-slate-800"
                        : "bg-slate-50 border-slate-200"
                    }`}
                  >
                    <p
                      className={`text-xs font-semibold ${
                        isDark ? "text-slate-300" : "text-slate-700"
                      }`}
                    >
                      SkillBridge derives industry demand from the skills
                      requested in industry opportunities.
                    </p>
                    <p
                      className={`text-[11px] ${
                        isDark ? "text-slate-400" : "text-slate-500"
                      }`}
                    >
                      Top skills will populate live as recruiters publish new
                      opportunity criteria.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= 7. VERIFIED INDUSTRY ECOSYSTEM ================= */}
      <section id="verified-ecosystem" className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-sky-700 dark:text-sky-400 bg-sky-500/10 px-3 py-1 rounded-md border border-sky-500/20">
              Ecosystem Integrity
            </span>
            <h2
              className={`text-3xl font-extrabold ${
                isDark ? "text-white" : "text-slate-900"
              }`}
            >
              Built for a Trusted Academic Ecosystem
            </h2>
            <p
              className={`text-sm ${
                isDark ? "text-slate-400" : "text-slate-600"
              }`}
            >
              Industries register on SkillBridge, while verification helps
              maintain a reliable recruitment ecosystem.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div
              className={`border rounded-2xl p-6 space-y-3 ${
                isDark
                  ? "bg-slate-900 border-slate-800"
                  : "bg-white border-slate-200 shadow-xs"
              }`}
            >
              <div className="w-8 h-8 rounded-lg bg-sky-700/10 text-sky-700 dark:text-sky-400 font-mono font-bold flex items-center justify-center border border-sky-600/20 text-xs">
                01
              </div>
              <h4
                className={`font-bold text-base ${
                  isDark ? "text-slate-100" : "text-slate-900"
                }`}
              >
                Corporate Registration
              </h4>
              <p
                className={`text-xs leading-relaxed ${
                  isDark ? "text-slate-400" : "text-slate-600"
                }`}
              >
                Organizations create official profiles with corporate
                documentation and industry category verification.
              </p>
            </div>

            <div
              className={`border rounded-2xl p-6 space-y-3 ${
                isDark
                  ? "bg-slate-900 border-slate-800"
                  : "bg-white border-slate-200 shadow-xs"
              }`}
            >
              <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono font-bold flex items-center justify-center border border-slate-300 dark:border-slate-700 text-xs">
                02
              </div>
              <h4
                className={`font-bold text-base ${
                  isDark ? "text-slate-100" : "text-slate-900"
                }`}
              >
                Admin Audit & Review
              </h4>
              <p
                className={`text-xs leading-relaxed ${
                  isDark ? "text-slate-400" : "text-slate-600"
                }`}
              >
                Platform administrators audit company details to ensure
                legitimacy before granting publishing privileges.
              </p>
            </div>

            <div
              className={`border rounded-2xl p-6 space-y-3 ${
                isDark
                  ? "bg-slate-900 border-slate-800"
                  : "bg-white border-slate-200 shadow-xs"
              }`}
            >
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-500 font-mono font-bold flex items-center justify-center border border-amber-500/20 text-xs">
                03
              </div>
              <h4
                className={`font-bold text-base ${
                  isDark ? "text-slate-100" : "text-slate-900"
                }`}
              >
                Verified Hiring Partner
              </h4>
              <p
                className={`text-xs leading-relaxed ${
                  isDark ? "text-slate-400" : "text-slate-600"
                }`}
              >
                Verified companies access candidate Skill Matrix profiles and
                post pre-screened campus recruitment opportunities.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================= 8. FINAL CTA ================= */}
      <section
        id="get-started"
        className={`py-20 border-t relative ${
          isDark
            ? "bg-[#0a1023] border-slate-800"
            : "bg-slate-100 border-slate-200"
        }`}
      >
        <div className="max-w-4xl mx-auto px-4 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-sky-500/10 border border-sky-500/20 text-sky-700 dark:text-sky-400 text-xs font-mono font-bold">
            ACADEMIC PORTAL ACCESS
          </div>

          <h2
            className={`text-3xl sm:text-4xl font-extrabold leading-tight ${
              isDark ? "text-white" : "text-slate-900"
            }`}
          >
            Build skills. Close gaps. Connect with industry.
          </h2>

          <p
            className={`text-sm sm:text-base max-w-2xl mx-auto ${
              isDark ? "text-slate-300" : "text-slate-600"
            }`}
          >
            Turn your skills into verified opportunities with SkillBridge. The
            unified platform empowering students, institutions, and industry
            recruiters.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              to="/login"
              className="w-full sm:w-auto px-8 py-3.5 bg-sky-700 hover:bg-sky-800 text-white font-bold text-sm rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer border border-sky-600"
            >
              Get Started Now
              <ArrowRight size={16} />
            </Link>

            <Link
              to="/login"
              className={`w-full sm:w-auto px-8 py-3.5 font-semibold text-sm rounded-xl border transition-all flex items-center justify-center gap-2 cursor-pointer ${
                isDark
                  ? "bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-800"
                  : "bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-xs"
              }`}
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="bg-[#060b18] border-t border-slate-800 py-12 text-slate-400 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8 pb-10 border-b border-slate-800">
            {/* Brand & Attribution Column */}
            <div className="md:col-span-2 space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-sky-700 flex items-center justify-center text-white font-bold">
                  <GraduationCap size={16} />
                </div>
                <span className="text-lg font-bold text-white tracking-tight font-mono">
                  SkillBridge
                </span>
              </div>
              <p className="text-xs text-slate-400 font-normal leading-relaxed max-w-sm">
                Portal for Academia–Industry Collaboration for Skill Mapping,
                Internships &amp; Placement
              </p>
              <div className="pt-2 space-y-2 border-t border-slate-900">
                <p className="text-xs font-bold text-sky-400 font-mono">
                  Built by Team Cipher.X
                </p>
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400 font-medium">
                  <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 font-mono">
                    Smart India Hackathon 2026
                  </span>
                  <span>&bull;</span>
                  <span>
                    Problem Statement:{" "}
                    <strong className="text-slate-200 font-mono">26044</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Platform Links */}
            <div className="space-y-3">
              <h5 className="font-mono font-bold text-slate-200 uppercase tracking-wider text-[11px]">
                Platform
              </h5>
              <ul className="space-y-2 text-slate-400">
                <li>
                  <button
                    onClick={() => scrollToSection("hero")}
                    className="hover:text-sky-400 transition-colors cursor-pointer"
                  >
                    Home
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollToSection("how-it-works")}
                    className="hover:text-sky-400 transition-colors cursor-pointer"
                  >
                    How It Works
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollToSection("features")}
                    className="hover:text-sky-400 transition-colors cursor-pointer"
                  >
                    Features
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollToSection("industry-demand")}
                    className="hover:text-sky-400 transition-colors cursor-pointer"
                  >
                    Skill Demand
                  </button>
                </li>
              </ul>
            </div>

            {/* Ecosystem Roles */}
            <div className="space-y-3">
              <h5 className="font-mono font-bold text-slate-200 uppercase tracking-wider text-[11px]">
                Ecosystem
              </h5>
              <ul className="space-y-2 text-slate-400">
                <li>
                  <Link
                    to="/login"
                    className="hover:text-sky-400 transition-colors"
                  >
                    For Students
                  </Link>
                </li>
                <li>
                  <Link
                    to="/login"
                    className="hover:text-sky-400 transition-colors"
                  >
                    For Industry
                  </Link>
                </li>
                <li>
                  <Link
                    to="/login"
                    className="hover:text-sky-400 transition-colors"
                  >
                    For Institutions
                  </Link>
                </li>
                <li>
                  <Link
                    to="/login"
                    className="hover:text-sky-400 transition-colors"
                  >
                    For Academicians
                  </Link>
                </li>
              </ul>
            </div>

            {/* Quick Access */}
            <div className="space-y-3">
              <h5 className="font-mono font-bold text-slate-200 uppercase tracking-wider text-[11px]">
                Quick Access
              </h5>
              <ul className="space-y-2 text-slate-400">
                <li>
                  <Link
                    to="/login"
                    className="hover:text-sky-400 transition-colors"
                  >
                    Sign In
                  </Link>
                </li>
                <li>
                  <Link
                    to="/login"
                    className="hover:text-sky-400 transition-colors"
                  >
                    Create Account
                  </Link>
                </li>
                <li>
                  <Link
                    to="/opportunities"
                    className="hover:text-sky-400 transition-colors"
                  >
                    Public Opportunities
                  </Link>
                </li>
                <li>
                  <a
                    href="https://github.com/dipanjan2907/Skill_Bridge_SIH"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-sky-400 transition-colors flex items-center gap-1"
                  >
                    GitHub Repository
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500 font-medium">
            <p>&copy; 2026 Team CipherX. All Rights Reserved.</p>
            <p className="flex flex-wrap items-center gap-1.5 text-slate-400">
              <span>Developed for Smart India Hackathon 2026</span>
              <span>&bull;</span>
              <span>Problem Statement 26044</span>
              <span>&bull;</span>
              <a
                href="https://github.com/dipanjan2907/Skill_Bridge_SIH"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sky-400 hover:text-sky-300 underline font-semibold transition-colors"
              >
                GitHub Repository
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
