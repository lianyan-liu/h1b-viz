import { useState, useEffect } from "react";
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import Papa from "papaparse";

interface YearStatusData {
  Year: string;
  Status: string;
  Count: string;
}

interface ChartData {
  year: number;
  CERTIFIED: number;
  "CERTIFIED-WITHDRAWN": number;
  WITHDRAWN: number;
  DENIED: number;
  total: number;
  certifiedRate: number;
}

const ApprovalTrends = () => {
  const [data, setData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const dataBase = import.meta.env.BASE_URL;

  useEffect(() => {
    fetch(`${dataBase}data/h1b_year_status.csv`)
      .then((response) => response.text())
      .then((csvText) => {
        Papa.parse<YearStatusData>(csvText, {
          header: true,
          complete: (results) => {
            // Aggregate by year
            const yearMap = new Map<number, ChartData>();
            
            results.data.forEach((row) => {
              if (!row.Year || !row.Status || !row.Count) return;
              
              const year = parseInt(row.Year);
              const count = parseInt(row.Count);
              
              if (!yearMap.has(year)) {
                yearMap.set(year, {
                  year,
                  CERTIFIED: 0,
                  "CERTIFIED-WITHDRAWN": 0,
                  WITHDRAWN: 0,
                  DENIED: 0,
                  total: 0,
                  certifiedRate: 0,
                });
              }
              
              const yearData = yearMap.get(year)!;
              yearData[row.Status as keyof typeof yearData] = count;
              yearData.total += count;
            });
            
            // Calculate certified rate
            const chartData = Array.from(yearMap.values())
              .map((d) => ({
                ...d,
                certifiedRate: (d.CERTIFIED / d.total) * 100,
              }))
              .sort((a, b) => a.year - b.year);
            
            setData(chartData);
            setLoading(false);
          },
        });
      });
  }, []);


  const STATUS_COLORS = {
    CERTIFIED: "hsl(var(--certified))",
    "CERTIFIED-WITHDRAWN": "hsl(var(--certified-withdrawn))",
    WITHDRAWN: "hsl(var(--withdrawn))",
    DENIED: "hsl(var(--denied))",
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="chart-tooltip">
          <p className="font-semibold mb-2">Year {payload[0].payload.year}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-xs" style={{ color: entry.color }}>
              {entry.name === "certifiedRate" 
                ? `Certified Rate: ${entry.value.toFixed(1)}%`
                : `${entry.name}: ${entry.value.toLocaleString()}`
              }
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <section id="overview" className="section-container bg-background">
        <div className="text-center">Loading data...</div>
      </section>
    );
  }

  return (
    <section id="overview" className="section-container bg-background">
      <div className="text-center mb-12">
        <h2 className="section-title">Approval Trends Over Time</h2>
        <p className="text-left md:text-lg mt-12 mb-3">
            Despite fluctuations in total application volume, the H-1B approval landscape has become noticeably more stable and predictable over the past five years. Certified rates climbed <strong className = "text-primary"> from 90% to 96% </strong>, while denials steadily fell. Rather than signaling looser scrutiny, this pattern reflects employers becoming more disciplined—filing fewer speculative petitions and preparing stronger cases from the start. One of the most telling signs of this shift is the plunge in Certified-Withdrawn cases, dropping from over 45,000 in 2020 to fewer than 8,000 in 2024. Employers are no longer “over-filing” as a safety strategy; they are applying with clearer hiring intent and better alignment with actual roles.
        </p>
        <p className = "text-left md:text-lg mt-3">
          Although application volume peaked in 2020 and then softened slightly by 2024, the overall picture is one of a system stabilizing after years of pandemic-era uncertainty. What emerges is a more intentional, quality-driven H-1B process, where approvals rise not because the bar is lower, but because the applicants and employers approaching it are better prepared.
        </p>
      </div>

      <div className="bg-card rounded-2xl p-6 shadow-lg">
        <ResponsiveContainer width="100%" height={550}>
          <ComposedChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="year" stroke="hsl(var(--muted-foreground))" />
            <YAxis 
              yAxisId="left"
              stroke="hsl(var(--muted-foreground))" 
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} 
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              stroke="hsl(var(--primary))"
              domain={[85, 100]}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar yAxisId="left" dataKey="CERTIFIED" stackId="a" fill={STATUS_COLORS.CERTIFIED} name="Certified" />
            <Bar yAxisId="left" dataKey="CERTIFIED-WITHDRAWN" stackId="a" fill={STATUS_COLORS["CERTIFIED-WITHDRAWN"]} name="Certified-Withdrawn" />
            <Bar yAxisId="left" dataKey="WITHDRAWN" stackId="a" fill={STATUS_COLORS.WITHDRAWN} name="Withdrawn" />
            <Bar yAxisId="left" dataKey="DENIED" stackId="a" fill={STATUS_COLORS.DENIED} name="Denied" />
            <Line 
              yAxisId="right"
              type="monotone"
              dataKey="certifiedRate"
              stroke="hsl(var(--primary))"
              strokeWidth={3}
              dot={{ fill: "hsl(var(--primary))", r: 6 }}
              name="Certified Rate (%)"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
};

export default ApprovalTrends;
