import React, { useState, useEffect, useCallback } from "react";
import { BarChart3, Loader2, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { API_BASE_URL } from "../../config/api";

export interface DemandItem {
  skillId: number;
  skillName: string;
  category: string;
  opportunityCount: number;
  demandPercentage: number;
  demandLevel: string;
  studentCount?: number;
}

const IndustryDemand: React.FC = () => {
  const navigate = useNavigate();
  const [demandList, setDemandList] = useState<DemandItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);

  const fetchDemandData = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`${API_BASE_URL}/dashboard/industry-demand`);
      const result = await res.json();
      if (res.ok && result.success && Array.isArray(result.data)) {
        setDemandList(result.data);
      } else {
        setDemandList([]);
      }
    } catch (err) {
      console.error("Failed to fetch industry demand data:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDemandData();
  }, [fetchDemandData]);
return (
  <section className="panel">
    <div className="section-heading">
      <div>
        <h2 className="text-[15px] font-semibold text-[var(--text-primary)]">
          Industry Demand
        </h2>
        <p className="text-xs text-[var(--text-secondary)] mt-0.5">
          Based on current SkillBridge opportunities
        </p>
      </div>

      <div className="flex items-center gap-2">
        <button
          className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] rounded-lg transition-colors cursor-pointer"
          onClick={fetchDemandData}
          disabled={loading}
          title="Refresh Industry Demand"
        >
          <RefreshCw
            size={14}
            className={loading ? "animate-spin text-[var(--primary)]" : ""}
          />
        </button>

        <button
          className="text-btn cursor-pointer text-[var(--primary)] hover:text-[var(--primary-hover)]"
          onClick={() => navigate("/student/industry-demand")}
        >
          View Report
        </button>
      </div>
    </div>

    {loading ? (
      <div className="flex items-center justify-center py-8 text-[var(--text-secondary)] text-xs gap-2">
        <Loader2
          className="animate-spin text-[var(--primary)]"
          size={18}
        />
        <span>Loading industry demand...</span>
      </div>
    ) : error ? (
      <div className="p-4 text-center text-[var(--text-secondary)] text-xs border border-[var(--border-color)] rounded-xl bg-[var(--bg-muted)]">
        <p className="font-semibold text-[var(--text-primary)]">
          Unable to load industry demand
        </p>
        <span className="text-[11px] text-[var(--text-muted)]">
          Please check server connection.
        </span>
      </div>
    ) : demandList.length === 0 ? (
      <div className="p-4 text-center text-[var(--text-secondary)] text-xs border border-[var(--border-color)] rounded-xl bg-[var(--bg-muted)]">
        <p className="font-semibold text-[var(--text-primary)]">
          No current opportunity data available.
        </p>
      </div>
    ) : (
      <div className="demand-list max-h-[380px] overflow-y-auto pr-1 space-y-2.5 scrollbar-thin scrollbar-thumb-[var(--border-color)]">
        {demandList.map((item) => (
          <div className="demand" key={item.skillId}>
            <div className="demand-name flex items-center gap-2">
              <BarChart3
                size={17}
                className="text-[var(--primary)] shrink-0"
              />

              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-[var(--text-primary)] truncate">
                  {item.skillName}
                </span>

                <span className="text-[10px] text-[var(--text-secondary)] font-medium truncate">
                  {item.category || "Technical"}
                  {item.studentCount !== undefined
                    ? ` • ${item.studentCount} Students`
                    : ""}
                </span>
              </div>
            </div>

            <span className="demand-label text-[var(--text-primary)] font-semibold">
              {item.demandLevel}
            </span>

            <div className="demand-bar bg-[var(--bg-muted)] border border-[var(--border-subtle)]">
              <span
                className="bg-[var(--primary)]"
                style={{
                  width: `${Math.max(item.demandPercentage, 6)}%`,
                }}
              />
            </div>

            <b className="text-xs text-[var(--primary)] font-bold">
              {item.demandPercentage}%
            </b>
          </div>
        ))}
      </div>
    )}
  </section>
);
};

export default IndustryDemand;
