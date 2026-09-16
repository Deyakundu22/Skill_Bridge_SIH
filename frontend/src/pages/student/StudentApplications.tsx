import React, { useState, useEffect, useCallback } from "react";
import MainLayout from "../../components/layout/MainLayout";
import {
  FileText,
  MapPin,
  IndianRupee,
  Briefcase,
  Eye,
  Loader2,
  AlertCircle,
  Clock,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { StudentApplicationDetailModal } from "../../components/student/StudentApplicationDetailModal";

import { API_BASE_URL } from "../../config/api";

export const StudentApplicationsPage: React.FC = () => {
  const { token } = useAuth();
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const [selectedAppId, setSelectedAppId] = useState<number | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    setError(null);
    const authToken = token || localStorage.getItem("skillbridge_token");

    try {
      const res = await fetch(`${API_BASE_URL}/student/applications`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to load applications.");
      }

      setApplications(
        Array.isArray(data.applications) ? data.applications : []
      );
    } catch (err: any) {
      console.error("fetchApplications error:", err);
      setError(err.message || "Could not fetch your applications.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const filteredApplications = applications.filter((app) => {
    if (statusFilter === "all") return true;
    return app.status === statusFilter;
  });

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "shortlisted":
        return (
          <span className="px-2.5 py-1 bg-[var(--accent-amber-bg)] border border-[var(--accent-amber)]/30 text-[var(--accent-amber)] font-bold text-[11px] rounded-full uppercase tracking-wider">
            Shortlisted
          </span>
        );

      case "selected":
        return (
          <span className="px-2.5 py-1 bg-[var(--accent-emerald-bg)] border border-[var(--accent-emerald)]/30 text-[var(--accent-emerald)] font-bold text-[11px] rounded-full uppercase tracking-wider">
            Selected 🎉
          </span>
        );

      case "rejected":
        return (
          <span className="px-2.5 py-1 bg-[var(--accent-rose-bg)] border border-[var(--accent-rose)]/30 text-[var(--accent-rose)] font-bold text-[11px] rounded-full uppercase tracking-wider">
            Not Selected
          </span>
        );

      default:
        return (
          <span className="px-2.5 py-1 bg-[var(--primary-subtle)] border border-[var(--primary-border)] text-[var(--primary)] font-bold text-[11px] rounded-full uppercase tracking-wider">
            Applied
          </span>
        );
    }
  };

  const formatStipend = (
    min: number | null,
    max: number | null,
    type: string
  ) => {
    if (!min && !max) return "Disclosed on interview";

    const unit = type === "internship" ? "/month" : "/annum";

    if (min && max) {
      return `₹${min.toLocaleString()} - ₹${max.toLocaleString()} ${unit}`;
    }

    if (min) return `From ₹${min.toLocaleString()} ${unit}`;
    if (max) return `Up to ₹${max.toLocaleString()} ${unit}`;

    return "Disclosed on interview";
  };

  const filterTabs = [
    {
      value: "all",
      label: "All Applications",
      count: applications.length,
    },
    {
      value: "applied",
      label: "Applied",
      count: applications.filter((a) => a.status === "applied").length,
    },
    {
      value: "shortlisted",
      label: "Shortlisted",
      count: applications.filter((a) => a.status === "shortlisted").length,
    },
    {
      value: "selected",
      label: "Selected",
      count: applications.filter((a) => a.status === "selected").length,
    },
    {
      value: "rejected",
      label: "Rejected",
      count: applications.filter((a) => a.status === "rejected").length,
    },
  ];

  return (
    <MainLayout showRightPanel={false}>
      <div className="w-full max-w-7xl mx-auto px-4 py-6 space-y-6">
        <div className="bg-[var(--bg-card)] backdrop-blur-xl border border-[var(--border-color)] rounded-2xl p-6 shadow-[var(--shadow-lg)]">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[var(--primary-subtle)] border border-[var(--primary-border)] rounded-2xl text-[var(--primary)] shrink-0">
              <FileText size={28} />
            </div>

            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--primary)]">
                Application Tracker
              </span>

              <h1 className="text-2xl font-bold text-[var(--text-primary)] mt-0.5">
                My Applications
              </h1>

              <p className="text-sm text-[var(--text-secondary)] mt-1">
                Track real-time updates and review details of all your
                submitted applications.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-[var(--bg-card)] backdrop-blur-xl border border-[var(--border-color)] rounded-2xl p-4 shadow-[var(--shadow-lg)] flex items-center justify-between gap-4 overflow-x-auto">
          <div className="flex items-center gap-1.5 min-w-max">
            {filterTabs.map((tab) => (
              <button
                key={tab.value}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  statusFilter === tab.value
                    ? "bg-[var(--primary)] text-[var(--text-on-primary)] shadow-[var(--shadow-md)]"
                    : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]"
                }`}
                onClick={() => setStatusFilter(tab.value)}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
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
          <div className="flex flex-col items-center justify-center py-16 bg-[var(--bg-muted)] border border-[var(--border-color)] rounded-2xl space-y-4">
            <Loader2
              className="animate-spin text-[var(--primary)]"
              size={36}
            />
            <p className="text-[var(--text-muted)] text-sm font-medium">
              Fetching your application history...
            </p>
          </div>
        ) : filteredApplications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 bg-[var(--bg-muted)] border border-[var(--border-color)] rounded-2xl text-center px-4">
            <div className="p-4 bg-[var(--bg-card-hover)] border border-[var(--border-subtle)] rounded-2xl text-[var(--text-muted)] mb-3">
              <Briefcase size={44} />
            </div>

            <h3 className="text-lg font-bold text-[var(--text-primary)]">
              No Applications Found
            </h3>

            <p className="text-[var(--text-secondary)] text-sm max-w-md mt-1">
              {statusFilter === "all"
                ? "You haven't submitted any job or internship applications yet."
                : `No applications found with status '${statusFilter}'.`}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredApplications.map((app) => (
              <div
                key={app.id}
                className="bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-color)] hover:border-[var(--primary-border)] rounded-2xl p-5 shadow-[var(--shadow-md)] transition-all duration-300 flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-[var(--primary-subtle)] border border-[var(--primary-border)] flex items-center justify-center text-[var(--primary)] font-bold shrink-0 overflow-hidden">
                        {app.opportunity?.industry?.logo ? (
                          <img
                            src={app.opportunity.industry.logo}
                            alt={app.opportunity.industry.companyName}
                            className="w-full h-full object-cover rounded-xl"
                          />
                        ) : (
                          (
                            app.opportunity?.industry?.companyName || "C"
                          )
                            .charAt(0)
                            .toUpperCase()
                        )}
                      </div>

                      <div className="min-w-0">
                        <span className="text-[11px] font-semibold text-[var(--primary)] uppercase tracking-wider block truncate">
                          {app.opportunity?.industry?.companyName ||
                            "Verified Partner"}
                        </span>

                        <h3 className="text-base font-bold text-[var(--text-primary)] group-hover:text-[var(--primary-light)] transition-colors truncate">
                          {app.opportunity?.title}
                        </h3>
                      </div>
                    </div>

                    {renderStatusBadge(app.status)}
                  </div>

                  <div className="pt-2 border-t border-[var(--border-subtle)] flex flex-wrap gap-y-2 gap-x-4 text-xs text-[var(--text-muted)]">
                    <span className="flex items-center gap-1.5">
                      <MapPin
                        size={13}
                        className="text-[var(--primary)] shrink-0"
                      />
                      {app.opportunity?.workMode}{" "}
                      {app.opportunity?.location
                        ? `• ${app.opportunity.location}`
                        : ""}
                    </span>

                    <span className="flex items-center gap-1.5">
                      <IndianRupee
                        size={13}
                        className="text-[var(--accent-emerald)] shrink-0"
                      />
                      {formatStipend(
                        app.opportunity?.stipendMin,
                        app.opportunity?.stipendMax,
                        app.opportunity?.type
                      )}
                    </span>

                    <span className="flex items-center gap-1.5">
                      <Clock
                        size={13}
                        className="text-[var(--accent-amber)] shrink-0"
                      />
                      Applied:{" "}
                      {new Date(app.appliedAt).toLocaleDateString("en-IN")}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between">
                  <span className="text-xs text-[var(--text-muted)] uppercase font-medium">
                    ID #{app.id}
                  </span>

                  <button
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[var(--bg-muted)] hover:bg-[var(--bg-card-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-xl text-xs font-semibold transition-all border border-[var(--border-color)] hover:border-[var(--border-color-hover)] cursor-pointer"
                    onClick={() => {
                      setSelectedAppId(app.id);
                      setIsDetailOpen(true);
                    }}
                  >
                    <Eye size={14} />
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <StudentApplicationDetailModal
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          applicationId={selectedAppId}
        />
      </div>
    </MainLayout>
  );
};

export default StudentApplicationsPage;