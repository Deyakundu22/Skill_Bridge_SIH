import { useState } from "react";
import { Sparkles, Bot, Bell, CheckCircle2 } from "lucide-react";

const AIChatComingSoon = () => {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleNotify = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) setSubscribed(true);
  };

 return (
  <section className="relative overflow-hidden rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6 text-[var(--text-primary)] shadow-[var(--shadow-xl)] backdrop-blur-xl max-w-sm w-full">
    <div className="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-[var(--primary-subtle)] blur-3xl pointer-events-none" />
    <div className="absolute -bottom-12 -left-12 h-32 w-32 rounded-full bg-[var(--accent-purple-bg)] blur-3xl pointer-events-none" />

    <div className="flex items-center justify-between mb-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--primary-subtle)] border border-[var(--primary-border)] text-[var(--primary)] shadow-inner">
          <Bot size={20} />
        </div>

        <div>
          <h2 className="text-base font-semibold text-[var(--text-primary)] tracking-tight leading-tight">
            AI Career Assistant
          </h2>

          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--primary)]">
            <Sparkles size={11} /> Next-Gen AI
          </span>
        </div>
      </div>

      <span className="rounded-full border border-[var(--accent-amber)]/30 bg-[var(--accent-amber-bg)] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--accent-amber)]">
        Coming Soon
      </span>
    </div>

    <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-muted)] p-4 mb-5 backdrop-blur-sm">
      <p className="text-xs font-semibold text-[var(--text-primary)] mb-1">
        Tailored Career Intelligence 🚀
      </p>

      <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
        From personalized skill roadmaps to real-time resume refinement and
        internship matching.
      </p>
    </div>

    <div className="grid grid-cols-2 gap-2 mb-6">
      {[
        "Skill Roadmaps",
        "Internship Radar",
        "Resume Review",
        "Role Matcher",
      ].map((feature) => (
        <div
          key={feature}
          className="flex items-center gap-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-muted)] px-2.5 py-2 text-[11px] text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-card-hover)]"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--primary)] animate-pulse" />
          {feature}
        </div>
      ))}
    </div>

    {subscribed ? (
      <div className="flex items-center justify-center gap-2 rounded-xl border border-[var(--accent-emerald)]/30 bg-[var(--accent-emerald-bg)] py-2.5 text-xs font-medium text-[var(--accent-emerald)]">
        <CheckCircle2 size={15} /> You're on the early access list!
      </div>
    ) : (
      <form onSubmit={handleNotify} className="relative flex items-center">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Get notified at launch..."
          required
          className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-input)] px-3.5 py-2.5 pr-24 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--focus-ring)]"
        />

        <button
          type="submit"
          className="absolute right-1.5 flex items-center gap-1 rounded-lg bg-[var(--primary)] px-3 py-1.5 text-xs font-medium text-[var(--text-on-primary)] transition-all hover:bg-[var(--primary-hover)] active:scale-95"
        >
          <Bell size={12} />
          Notify
        </button>
      </form>
    )}
  </section>
);
};

export default AIChatComingSoon;
