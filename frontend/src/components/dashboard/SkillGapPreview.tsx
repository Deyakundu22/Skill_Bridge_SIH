import React from "react";
import { Target, AlertTriangle, AlertCircle, ArrowRight, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

export interface SkillGapItem {
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

interface SkillGapPreviewProps {
  skills: SkillGapItem[];
  loading?: boolean;
  targetRole?: string | null;
}

const SkillGapPreview: React.FC<SkillGapPreviewProps> = ({
  skills,
  loading = false,
  targetRole,
}) => {
  const navigate = useNavigate();

  // Filter for skills that actually need improvement (or unassessed demanded skills)
  const skillsToImprove = skills
    .filter((s) => s.status === "Critical Gap" || s.status === "Needs Improvement")
    .slice(0, 4);

  // If none need improvement (e.g., student is strong in all), show top demanded skills
  const displayList = skillsToImprove.length > 0 ? skillsToImprove : skills.slice(0, 4);

return (
  <section className="dashboard-card">
    <div className="card-header">
      <div className="header-text">
        <div className="flex items-center gap-2">
          <Target
            size={18}
            className="text-[var(--primary)] shrink-0"
          />
          <h2 className="card-title text-[var(--text-primary)]">
            Skill Gap Preview
          </h2>
        </div>

        <p className="card-subtitle text-[var(--text-secondary)]">
          Skills to improve based on active employer benchmarks
          {targetRole && (
            <span className="text-[var(--primary)] font-semibold">
              {" "}• {targetRole}
            </span>
          )}
        </p>
      </div>

      <button
        onClick={() => navigate("/student/skill-gap")}
        className="card-header-link text-[var(--primary)] hover:text-[var(--primary-hover)]"
      >
        <span>View Gap Analysis</span>
        <ArrowRight size={13} />
      </button>
    </div>

    <div className="card-body">
      {loading ? (
        <div className="space-y-3 py-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-10 bg-[var(--bg-muted)] border border-[var(--border-subtle)] rounded-lg animate-pulse"
            />
          ))}
        </div>
      ) : displayList.length === 0 ? (
        <div className="empty-state-box">
          <CheckCircle2
            size={28}
            className="text-[var(--accent-emerald)] mb-2"
          />

          <h3 className="empty-title text-[var(--text-primary)]">
            No Critical Gaps Detected
          </h3>

          <p className="empty-desc text-[var(--text-secondary)]">
            Your verified skills currently align well with platform industry requirements.
          </p>

          <button
            onClick={() => navigate("/student/skill-gap")}
            className="empty-cta-btn bg-[var(--primary)] text-[var(--text-on-primary)] hover:bg-[var(--primary-hover)]"
          >
            View Full Benchmark Report
          </button>
        </div>
      ) : (
        <div className="gap-table-wrapper">
          <table className="gap-table">
            <thead>
              <tr>
                <th className="text-[var(--text-secondary)]">
                  Skill
                </th>
                <th className="text-center text-[var(--text-secondary)]">
                  Your Level
                </th>
                <th className="text-center text-[var(--text-secondary)]">
                  Industry Target
                </th>
                <th className="text-right text-[var(--text-secondary)]">
                  Status
                </th>
              </tr>
            </thead>

            <tbody>
              {displayList.map((item) => (
                <tr
                  key={item.skillId}
                  className="gap-row border-t border-[var(--border-subtle)]"
                >
                  <td>
                    <div className="font-semibold text-[var(--text-primary)] text-xs truncate max-w-[160px]">
                      {item.skillName}
                    </div>

                    <span className="text-[10px] text-[var(--text-muted)]">
                      {item.category || "Technical"}
                    </span>
                  </td>

                  <td className="text-center">
                    <span className="text-xs font-mono font-semibold text-[var(--text-primary)]">
                      {item.studentProficiency > 0
                        ? `${item.studentProficiency}%`
                        : "0%"}
                    </span>
                  </td>

                  <td className="text-center">
                    <span className="text-xs font-mono font-semibold text-[var(--primary)]">
                      {item.requiredProficiency}%
                    </span>
                  </td>

                  <td className="text-right">
                    <span
                      className={`status-pill inline-flex items-center gap-1 ${
                        item.status === "Critical Gap"
                          ? "bg-[var(--accent-rose-bg)] text-[var(--accent-rose)] border border-[var(--accent-rose)]/25"
                          : item.status === "Needs Improvement"
                          ? "bg-[var(--accent-amber-bg)] text-[var(--accent-amber)] border border-[var(--accent-amber)]/25"
                          : "bg-[var(--accent-emerald-bg)] text-[var(--accent-emerald)] border border-[var(--accent-emerald)]/25"
                      }`}
                    >
                      {item.status === "Critical Gap" && (
                        <AlertCircle size={11} />
                      )}

                      {item.status === "Needs Improvement" && (
                        <AlertTriangle size={11} />
                      )}

                      {item.status === "Strong" && (
                        <CheckCircle2 size={11} />
                      )}

                      <span>{item.status}</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>

    <div className="card-footer">
      <div className="flex items-center justify-between text-xs">
        <span className="text-[var(--text-secondary)]">
          Compare vs {skills.length} market skills
        </span>

        <button
          onClick={() => navigate("/student/skill-gap")}
          className="text-[var(--primary)] hover:text-[var(--primary-hover)] font-medium flex items-center gap-1 transition-colors"
        >
          Explore Roadmaps
          <ArrowRight size={12} />
        </button>
      </div>
    </div>
  </section>
);
};

export default SkillGapPreview;
