import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, BarChart3, FileDown, FileStack, Loader2, RefreshCw, Table2, Users, CalendarDays } from "lucide-react";
import { toast } from "sonner";
import { api, ADMIN_TOKEN_KEY } from "../lib/api";

const DAYS_SHOWN = 14;
const BAR_COLOR = "#2563EB"; // blue-600, the site's accent
const BAR_SELECTED = "#1E40AF"; // blue-800 — the same hue, one step darker

const fmtNumber = (n) => new Intl.NumberFormat("en-US").format(n);
const plural = (n, one, many) => `${fmtNumber(n)} ${n === 1 ? one : many}`;
// Stats days are calendar dates (YYYY-MM-DD); parse them as local dates, not UTC.
const parseDay = (d) => {
  const [y, m, day] = d.split("-").map(Number);
  return new Date(y, m - 1, day);
};
const fmtDayLong = (d) => parseDay(d).toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
const fmtDayShort = (d) => parseDay(d).toLocaleDateString("en-US", { day: "numeric", month: "short" });
const fmtTime = (iso) => new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

function StatTile({ icon: Icon, label, value, note }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
        <Icon className="h-4 w-4 text-slate-400" />
        {label}
      </div>
      <div className="mt-2 text-2xl font-semibold tabular-nums text-slate-900">{value}</div>
      {note && <div className="mt-0.5 text-xs text-slate-400">{note}</div>}
    </div>
  );
}

// Single-series column chart of daily uses. Each column is its own hover/click
// target (the whole day's slot, not just the bar), shows that day's numbers in a
// tooltip, and selects the day for the activity log below.
function DailyUsesChart({ daily, selectedDate, onSelect }) {
  const [hovered, setHovered] = useState(null);
  const max = Math.max(1, ...daily.map((d) => d.uses));
  // A clean tick step so the axis reads 0 / 5 / 10 rather than 0 / 3.67 / 7.33.
  const step = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000].find((s) => max / s <= 4) || Math.ceil(max / 4);
  const top = Math.ceil(max / step) * step;
  const ticks = Array.from({ length: top / step + 1 }, (_, i) => i * step);
  const CHART_H = 180;

  return (
    <div className="relative">
      <div className="flex">
        {/* Y axis */}
        <div className="relative mr-2 w-8 shrink-0" style={{ height: CHART_H }}>
          {ticks.map((t) => (
            <span
              key={t}
              className="absolute right-0 -translate-y-1/2 text-[11px] tabular-nums text-slate-400"
              style={{ top: CHART_H - (t / top) * CHART_H }}
            >
              {fmtNumber(t)}
            </span>
          ))}
        </div>
        <div className="relative flex-1" style={{ height: CHART_H }}>
          {/* Hairline gridlines */}
          {ticks.map((t) => (
            <div key={t} className="absolute inset-x-0 border-t border-slate-100" style={{ top: CHART_H - (t / top) * CHART_H }} />
          ))}
          <div className="absolute inset-0 flex items-end gap-[2px]">
            {daily.map((d) => {
              const selected = d.date === selectedDate;
              const h = (d.uses / top) * CHART_H;
              return (
                <button
                  key={d.date}
                  type="button"
                  onClick={() => onSelect(d.date)}
                  onMouseEnter={() => setHovered(d.date)}
                  onMouseLeave={() => setHovered(null)}
                  onFocus={() => setHovered(d.date)}
                  onBlur={() => setHovered(null)}
                  aria-label={`${fmtDayLong(d.date)}: ${plural(d.uses, "use", "uses")}`}
                  aria-pressed={selected}
                  className={`group relative flex h-full flex-1 items-end justify-center rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 ${selected ? "bg-blue-50/70" : "hover:bg-slate-50"}`}
                >
                  <span
                    className="block w-full max-w-[24px] rounded-t-[4px]"
                    style={{ height: Math.max(h, d.uses ? 2 : 0), background: selected ? BAR_SELECTED : BAR_COLOR }}
                  />
                  {hovered === d.date && (
                    <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 w-max -translate-x-1/2 rounded-lg bg-slate-900 px-2.5 py-1.5 text-left text-[11px] leading-snug text-white shadow-lg">
                      <span className="block font-semibold">{fmtDayLong(d.date)}</span>
                      <span className="block">{plural(d.uses, "use", "uses")}</span>
                      <span className="block text-slate-300">{plural(d.exports, "PDF export", "PDF exports")}</span>
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
      {/* X axis */}
      <div className="ml-10 mt-1.5 flex gap-[2px]">
        {daily.map((d, i) => (
          <span
            key={d.date}
            className={`flex-1 text-center text-[10px] ${d.date === selectedDate ? "font-semibold text-slate-800" : "text-slate-400"}`}
          >
            {i % 2 === daily.length % 2 || d.date === selectedDate ? fmtDayShort(d.date) : ""}
          </span>
        ))}
      </div>
    </div>
  );
}

function DailyTable({ daily, selectedDate, onSelect }) {
  return (
    <div className="max-h-[260px] overflow-auto">
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-white text-left text-xs text-slate-500">
          <tr>
            <th className="py-2 pr-4 font-medium">Date</th>
            <th className="py-2 pr-4 text-right font-medium">Uses</th>
            <th className="py-2 text-right font-medium">PDF exports</th>
          </tr>
        </thead>
        <tbody>
          {[...daily].reverse().map((d) => (
            <tr
              key={d.date}
              onClick={() => onSelect(d.date)}
              className={`cursor-pointer border-t border-slate-100 ${d.date === selectedDate ? "bg-blue-50" : "hover:bg-slate-50"}`}
            >
              <td className="py-2 pr-4 text-slate-700">{fmtDayLong(d.date)}</td>
              <td className="py-2 pr-4 text-right tabular-nums text-slate-900">{fmtNumber(d.uses)}</td>
              <td className="py-2 text-right tabular-nums text-slate-700">{fmtNumber(d.exports)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export const AdminSiteDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("chart");

  const load = useCallback(
    async (date) => {
      setLoading(true);
      try {
        const res = await api.get("/admin/analytics/room-configurator", {
          params: { days: DAYS_SHOWN, ...(date ? { date } : {}) },
        });
        setStats(res.data);
        setSelectedDate(res.data.selected_date);
      } catch (error) {
        const status = error?.response?.status;
        if (status === 401 || status === 403) {
          localStorage.removeItem(ADMIN_TOKEN_KEY);
          navigate("/admin/login");
          return;
        }
        toast.error("Couldn't load the dashboard");
      } finally {
        setLoading(false);
      }
    },
    [navigate]
  );

  useEffect(() => {
    if (!localStorage.getItem(ADMIN_TOKEN_KEY)) {
      navigate("/admin/login");
      return;
    }
    load();
  }, [load, navigate]);

  const today = stats?.today;
  const yesterday = stats?.daily?.[stats.daily.length - 2];
  const last7Days = (stats?.daily || []).slice(-7);
  const last7 = last7Days.reduce((sum, d) => sum + d.uses, 0);
  const last7Exports = last7Days.reduce((sum, d) => sum + d.exports, 0);
  const delta = today && yesterday ? today.uses - yesterday.uses : null;
  const selectedDay = stats?.daily?.find((d) => d.date === selectedDate);
  const isToday = selectedDate && today && selectedDate === today.date;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <Link to="/admin" className="mb-2 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
              <ArrowLeft className="h-4 w-4" /> Admin
            </Link>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard</h1>
            <p className="text-sm text-slate-500">
              Room Planner usage{stats ? ` · days counted in ${stats.timezone} time` : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={() => load(selectedDate)}
            disabled={loading}
            className="inline-flex min-h-[40px] items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {!stats ? (
          <div className="flex items-center justify-center py-24 text-slate-400">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <>
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,2fr)]">
              <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="text-sm font-medium text-slate-500">Room Planner uses today</div>
                <div className="mt-2 text-6xl font-semibold tabular-nums tracking-tight text-slate-900">{fmtNumber(today.uses)}</div>
                <div className="mt-2 text-sm text-slate-500">
                  {delta === null ? "" : delta === 0 ? "Same as yesterday" : `${delta > 0 ? "+" : "−"}${fmtNumber(Math.abs(delta))} vs yesterday (${fmtNumber(yesterday.uses)})`}
                </div>
                <p className="mt-4 text-xs leading-relaxed text-slate-400">
                  One use = one visit to the configurator in a browser tab. Reloading the same tab doesn't count twice.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <StatTile icon={FileDown} label="PDF exports today" value={fmtNumber(today.exports)} />
                <StatTile icon={CalendarDays} label="Uses, last 7 days" value={fmtNumber(last7)} />
                <StatTile icon={FileStack} label="PDF exports, last 7 days" value={fmtNumber(last7Exports)} />
                <StatTile icon={Users} label="Uses, all time" value={fmtNumber(stats.all_time_uses)} />
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-slate-800">Daily uses — last {DAYS_SHOWN} days</h2>
                  <p className="text-xs text-slate-500">Select a day to see its activity.</p>
                </div>
                <div className="inline-flex rounded-lg border border-slate-200 p-0.5" role="group" aria-label="View">
                  {[
                    { id: "chart", label: "Chart", Icon: BarChart3 },
                    { id: "table", label: "Table", Icon: Table2 },
                  ].map(({ id, label, Icon }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setView(id)}
                      aria-pressed={view === id}
                      className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium ${view === id ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-50"}`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              {view === "chart" ? (
                <DailyUsesChart daily={stats.daily} selectedDate={selectedDate} onSelect={(d) => load(d)} />
              ) : (
                <DailyTable daily={stats.daily} selectedDate={selectedDate} onSelect={(d) => load(d)} />
              )}
            </div>

            <div className="mt-4">
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-sm font-semibold text-slate-800">
                  Activity log — {isToday ? "today" : fmtDayLong(selectedDate)}
                </h2>
                <p className="mb-3 text-xs text-slate-500">
                  {selectedDay ? `${plural(selectedDay.uses, "use", "uses")} · ${plural(selectedDay.exports, "PDF export", "PDF exports")} · ` : ""}
                  most recent first, times in your local time
                </p>
                {stats.entries.length === 0 ? (
                  <p className="py-6 text-center text-sm text-slate-400">No activity on this day.</p>
                ) : (
                  <div className="max-h-[360px] max-w-md overflow-auto">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 bg-white text-left text-xs text-slate-500">
                        <tr>
                          <th className="py-2 pr-3 font-medium">Time</th>
                          <th className="py-2 font-medium">Event</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.entries.map((e, i) => (
                          <tr key={`${e.created_at}-${i}`} className="border-t border-slate-100">
                            <td className="whitespace-nowrap py-2 pr-3 text-xs text-slate-500">{fmtTime(e.created_at)}</td>
                            <td className="py-2">
                              <span
                                className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                                  e.event === "export" ? "bg-slate-100 text-slate-700" : "bg-blue-50 text-blue-700"
                                }`}
                              >
                                {e.event === "export" ? "PDF export" : "Opened"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
