import { useEffect, useMemo, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, ZAxis, Legend
} from "recharts";
import { Button } from "@/components/ui/button";
import Papa from "papaparse";

/** CSV columns in /data/25Q3_status_site_wage.csv
 *  STATUS_GROUP | SOC_TITLE_CLEAN | WAGE_ANNUAL
 */

type Row = {
  STATUS_GROUP?: string;
  SOC_TITLE_CLEAN?: string;
  WAGE_ANNUAL?: string | number | null;
};

type CleanRow = {
  STATUS_GROUP: string;
  SOC_TITLE_CLEAN: string;
  WAGE_ANNUAL: number;
};

type RollingPoint = { wage: number; approvalRate: number };
type BubblePoint = { occupation: string; approval_rate: number; median_wage: number; total: number; low: boolean };

function toNum(x: unknown): number | null {
  if (x === null || x === undefined) return null;
  const n = typeof x === "number" ? x : Number(String(x).replace(/[, ]+/g, ""));
  return Number.isFinite(n) ? n : null;
}
function quantile(sorted: number[], p: number): number | null {
  if (!sorted.length) return null;
  if (p <= 0) return sorted[0];
  if (p >= 1) return sorted[sorted.length - 1];
  const i = (sorted.length - 1) * p;
  const lo = Math.floor(i), hi = Math.ceil(i);
  if (lo === hi) return sorted[lo];
  const t = i - lo;
  return sorted[lo] * (1 - t) + sorted[hi] * t;
}
function median(arr: number[]): number | null {
  if (!arr.length) return null;
  const s = [...arr].sort((a, b) => a - b);
  return quantile(s, 0.5);
}
function groupBy<T>(arr: T[], key: (d: T) => string): Record<string, T[]> {
  const m: Record<string, T[]> = {};
  for (const d of arr) (m[key(d)] ||= []).push(d);
  return m;
}

const WageAnalysis = () => {
  const [raw, setRaw] = useState<CleanRow[]>([]);
  const [view, setView] = useState<"rolling" | "bubble">("rolling");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    fetch("/data/25Q3_status_site_wage.csv")
      .then(r => r.text())
      .then(csv => {
        Papa.parse<Row>(csv, {
          header: true,
          skipEmptyLines: true,
          complete: ({ data }) => {
            const cleaned = data
              .map(r => {
                const w = toNum(r.WAGE_ANNUAL);
                const s = r.STATUS_GROUP?.trim();
                const o = r.SOC_TITLE_CLEAN?.trim();
                if (!w || !s || !o) return null;
                return { STATUS_GROUP: s, SOC_TITLE_CLEAN: o, WAGE_ANNUAL: w };
              })
              .filter(Boolean) as CleanRow[];
            if (alive) { setRaw(cleaned); setLoading(false); }
          },
          error: (err) => { console.error(err); if (alive) setLoading(false); }
        });
      })
      .catch(e => { console.error(e); setLoading(false); });
    return () => { alive = false; };
  }, []);

  // ---------------- ROLLING CURVE ----------------
  const rollingData: RollingPoint[] = useMemo(() => {
    if (!raw.length) return [];

    const tmp = raw.map(d => ({
      wage: d.WAGE_ANNUAL,
      is_certified: d.STATUS_GROUP === "Certified" ? 1 : 0
    }));

    // Trim 0.5% ~ 99.5%
    const wages = [...tmp.map(d => d.wage)].sort((a, b) => a - b);
    const lo = quantile(wages, 0.005) ?? wages[0];
    const hi = quantile(wages, 0.995) ?? wages[wages.length - 1];
    const trimmed = tmp.filter(d => d.wage >= lo! && d.wage <= hi!).sort((a, b) => a.wage - b.wage);

    const n = trimmed.length;
    if (n < 80) return [];

    // Rolling window ~1% (>=500)
    const win = Math.max(500, Math.floor(n * 0.01));
    const half = Math.floor(win / 2);
    const minPeriods = Math.max(60, Math.floor(win / 5));

    // prefix sums
    const prefix = new Array<number>(n + 1).fill(0);
    for (let i = 0; i < n; i++) prefix[i + 1] = prefix[i] + trimmed[i].is_certified;

    // rolling mean
    const rawPts: RollingPoint[] = [];
    for (let i = 0; i < n; i++) {
      const L = Math.max(0, i - half);
      const R = Math.min(n - 1, i + half);
      const count = R - L + 1;
      if (count < minPeriods) continue;
      const sum = prefix[R + 1] - prefix[L];
      rawPts.push({ wage: trimmed[i].wage, approvalRate: (sum / count) * 100 });
    }

    // light down-sampling for readability (target ~900 points)
    const target = 900;
    if (rawPts.length <= target) return rawPts;
    const step = Math.ceil(rawPts.length / target);
    const sampled: RollingPoint[] = [];
    for (let i = 0; i < rawPts.length; i += step) sampled.push(rawPts[i]);
    return sampled;
  }, [raw]);

  // compute dynamic Y domain so the trend pops (adds padding)
  const yDomain = useMemo<[number, number]>(() => {
    if (!rollingData.length) return [85, 100];
    const vals = rollingData.map(d => d.approvalRate).sort((a, b) => a - b);
    const lo = Math.max(80, (quantile(vals, 0.02) ?? vals[0]) - 0.5);
    const hi = Math.min(100, (quantile(vals, 0.98) ?? vals[vals.length - 1]) + 0.5);
    return [Math.floor(lo), Math.ceil(hi)];
  }, [rollingData]);

  // ---------------- BUBBLE CHART ----------------
  const { bubbles, lowList } = useMemo(() => {
    if (!raw.length) return { bubbles: [] as BubblePoint[], lowList: [] as BubblePoint[] };

    const byOcc = groupBy(raw, d => d.SOC_TITLE_CLEAN);
    const rows: BubblePoint[] = [];

    Object.entries(byOcc).forEach(([occ, arr]) => {
      const total = arr.length;
      if (total < 30) return;
      const approved = arr.reduce((s, d) => s + (d.STATUS_GROUP === "Certified" ? 1 : 0), 0);
      const rate = Math.min(100, (approved / total) * 100);
      const med = median(arr.map(d => d.WAGE_ANNUAL))!;
      rows.push({ occupation: occ, approval_rate: rate, median_wage: med, total, low: rate < 50 });
    });

    if (!rows.length) return { bubbles: [], lowList: [] };

    const wagesSorted = [...rows.map(d => d.median_wage)].sort((a, b) => a - b);
    const lo = quantile(wagesSorted, 0.01) ?? wagesSorted[0];
    const hi = quantile(wagesSorted, 0.99) ?? wagesSorted[wagesSorted.length - 1];
    const filtered = rows.filter(d => d.median_wage >= lo! && d.median_wage <= hi!);

    const lowList = filtered
      .filter(d => d.low)
      .sort((a, b) => a.approval_rate - b.approval_rate)
      .slice(0, 6); // show a few worst

    return { bubbles: filtered, lowList };
  }, [raw]);

  // ---- tooltips ----
  const RollingTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload as RollingPoint;
      return (
        <div className="chart-tooltip">
          <p className="font-semibold">Annual Wage: ${Math.round(d.wage).toLocaleString()}</p>
          <p className="text-sm text-success">Approval Rate: {d.approvalRate.toFixed(1)}%</p>
        </div>
      );
    }
    return null;
  };
  const BubbleTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload as BubblePoint;
      return (
        <div className="chart-tooltip">
          <p className="font-semibold">{d.occupation}</p>
          <p className="text-sm">Median Wage: ${Math.round(d.median_wage).toLocaleString()}</p>
          <p className="text-sm">
            Approval Rate: <span className={d.low ? "text-[hsl(6,72%,45%)]" : "text-success"}>
              {d.approval_rate.toFixed(1)}%
            </span>
          </p>
          <p className="text-xs text-muted-foreground">Applications: {d.total.toLocaleString()}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <section id="wages" className="section-container" style={{ background: "var(--gradient-subtle)" }}>
      <div className="text-center mb-8">
        <h2 className="section-title">Do Higher Wages Mean Higher Approval?</h2>
        <p className="section-subtitle mx-auto">
          Relationship between compensation and certification outcomes, using real LCA records (2020–2024).
        </p>
      </div>

      <div className="bg-card rounded-2xl p-6 shadow-lg">
        <div className="flex justify-center gap-3 mb-6">
          <Button onClick={() => setView("rolling")} variant={view === "rolling" ? "default" : "outline"}>
            Smoothed Rolling Curve
          </Button>
          <Button onClick={() => setView("bubble")} variant={view === "bubble" ? "default" : "outline"}>
            Occupation Bubble View
          </Button>
        </div>

        {loading ? (
          <div className="text-center text-muted-foreground py-24">Loading wage data…</div>
        ) : view === "rolling" ? (
          <ResponsiveContainer width="100%" height={470}>
            <LineChart
              data={rollingData}
              margin={{ top: 8, right: 24, bottom: 8, left: 8 }}
            >
              <CartesianGrid strokeDasharray="4 4" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="wage"
                stroke="hsl(var(--muted-foreground))"
                tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
                tickMargin={8}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                domain={yDomain}
                tickFormatter={(v: number) => `${v.toFixed(0)}%`}
                tickMargin={6}
                width={60}
              />
              <Tooltip content={<RollingTooltip />} />
              <Line
                type="monotone"
                dataKey="approvalRate"
                stroke="hsl(var(--denied))"
                strokeWidth={2.5}
                dot={false}
                animationDuration={600}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height={540}>
            <ScatterChart
              margin={{ top: 36, right: 36, bottom: 40, left: 60 }}  // more room for y label & ticks
            >
              <CartesianGrid stroke="hsl(var(--border))" />
              <XAxis
                type="number"
                dataKey="approval_rate"
                name="Approval Rate"
                domain={[0, 100]}
                tickFormatter={(v: number) => `${v.toFixed(0)}%`}
                stroke="hsl(var(--muted-foreground))"
                tickMargin={1}
                label={{ value: "Approval Rate (%)", position: "insideBottom", offset: -6 }}
              />
              <YAxis
                type="number"
                dataKey="median_wage"
                name="Median Annual Wage (USD)"
                tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
                stroke="hsl(var(--muted-foreground))"
                tickMargin={1}
                label={{ value: "Median Annual Wage (USD)", angle: -90, position: "left" }}
              />
              <ZAxis type="number" dataKey="total" range={[60, 800]} />
              <Legend
                verticalAlign="top"
                align="right"
                wrapperStyle={{ top: 4, right: 8 }}
              />
              {/* two series: green = normal, red = very low approval */}
              <Scatter
                name="Occupations"
                data={bubbles.filter(d => !d.low)}
                fill="hsl(var(--success))"
                opacity={0.7}
              />
              <Scatter
                name="Low approval occupations(<50%)"
                data={bubbles.filter(d => d.low)}
                fill="hsl(6,72%,45%)"
                opacity={0.85}
              />
              <Tooltip content={<BubbleTooltip />} />
            </ScatterChart>
          </ResponsiveContainer>
        )}

        {/* Insights */}
        {view === "rolling" && !loading && rollingData.length > 0 && (
          <div className="mt-6 p-4 bg-success/10 border border-success/30 rounded-lg">
            <p className="text-sm text-center">
              <span className="font-semibold text-success">Insight:</span> Dynamic Y-axis + light smoothing/down-sampling reveal a clearer upward trend with wage before stabilizing.
            </p>
          </div>
        )}

        {view === "bubble" && !loading && bubbles.length > 0 && (
          <div className="mt-6 p-4 bg-secondary rounded-lg border">
            <p className="text-sm text-center text-muted-foreground mb-3">
              Bubble size represents total applications per occupation. Filter: ≥ 30 records, median wage within 1st–99th percentile.
            </p>
            {lowList.length > 0 && (
              <div className="text-sm">
                <div className="font-semibold mb-2">
                  ⚠️ Occupations with very low approval rate (&lt; 50%):
                </div>
                <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-1">
                  {lowList.map((d) => (
                    <li key={d.occupation} className="flex items-center gap-2">
                      <span className="inline-block w-1 h-1 rounded-full bg-[black]" />
                      <span className="truncate">{d.occupation}</span>
                      <span className="ml-auto tabular-nums">{d.approval_rate.toFixed(1)}%</span>
                      <span className="ml-3 text-muted-foreground">n={d.total.toLocaleString()}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default WageAnalysis;
