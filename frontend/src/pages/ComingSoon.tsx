import { useSearchParams, useNavigate } from "react-router-dom";

import MainLayout from "../components/layout/MainLayout";

import { ArrowLeft, Clock, Rocket, ShieldCheck, Cpu } from "lucide-react";

const ComingSoonPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const featureName = searchParams.get("feature") || "Feature";

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)] transition-all duration-200 mb-8 text-sm font-medium shadow-[var(--shadow-sm)]"
        >
          <ArrowLeft size={16} />
          Go Back
        </button>

        <div className="relative overflow-hidden bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-8 sm:p-12 text-center shadow-[var(--shadow-xl)]">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-[var(--primary-subtle)] rounded-full blur-3xl pointer-events-none" />

          <div className="relative">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[var(--primary-subtle)] text-[var(--primary)] border border-[var(--primary-border)] text-xs font-semibold mb-6">
              <Clock size={14} />
              <span>IN ACTIVE DEVELOPMENT</span>
            </div>

            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-[var(--primary-lighter)] flex items-center justify-center text-[var(--text-on-primary)] shadow-[var(--shadow-lg)]">
              <Rocket size={32} />
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--text-primary)] mb-3">
              {featureName} is Coming Soon
            </h1>

            <p className="text-base text-[var(--text-secondary)] max-w-lg mx-auto mb-8 leading-relaxed">
              We are engineering this feature with real-time industry analytics
              and high-performance algorithms for the SkillBridge platform.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left mb-10 pt-6 border-t border-[var(--border-subtle)]">
              <div className="bg-[var(--bg-muted)] p-4 rounded-xl border border-[var(--border-subtle)]">
                <div className="flex items-center gap-2 text-[var(--primary)] mb-1.5 font-semibold text-sm">
                  <Cpu size={16} />
                  Real-Time Data Integration
                </div>

                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  Powered by our active MySQL opportunity aggregation engine.
                </p>
              </div>

              <div className="bg-[var(--bg-muted)] p-4 rounded-xl border border-[var(--border-subtle)]">
                <div className="flex items-center gap-2 text-[var(--accent-emerald)] mb-1.5 font-semibold text-sm">
                  <ShieldCheck size={16} />
                  Verified Industry Quality
                </div>

                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  Ensuring smooth collaboration between students and academia.
                </p>
              </div>
            </div>

            <div className="flex justify-center gap-4 flex-wrap">
              <button
                onClick={() => navigate("/dashboard")}
                className="px-7 py-3 rounded-lg bg-[var(--primary-lighter)] text-[var(--text-on-primary)] border border-[var(--primary)] font-semibold text-sm shadow-[var(--shadow-md)] hover:bg-[var(--primary-hover)] active:bg-[var(--primary-active)] transition-all duration-200"
              >
                Back to Dashboard
              </button>

              <button
                onClick={() => navigate("/opportunities")}
                className="px-7 py-3 rounded-lg bg-transparent text-[var(--text-primary)] border border-[var(--border-color)] font-semibold text-sm hover:bg-[var(--bg-card-hover)] hover:border-[var(--border-color-hover)] transition-all duration-200"
              >
                Explore Opportunities
              </button>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default ComingSoonPage;
