import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Papa from "papaparse";

interface DashboardRow {
  Occupation: string;
  Employer: string;
  Applications: string;
  Employer_Median_Wage: string;
  Occupation_Median_Wage: string;
  Occupation_75th_Wage: string;
  Occupation_90th_Wage: string;
  Sample_Count: string;
  Bin_Center: string;
}

interface EmployerData {
  name: string;
  applications: number;
  medianWage: number;
}

interface SalaryDistribution {
  binCenter: number;
  count: number;
}

const OccupationInsights = () => {
  const [allData, setAllData] = useState<DashboardRow[]>([]);
  const [occupations, setOccupations] = useState<string[]>([]);
  const [selectedOccupation, setSelectedOccupation] = useState("");
  const [employers, setEmployers] = useState<EmployerData[]>([]);
  const [salaryDist, setSalaryDist] = useState<SalaryDistribution[]>([]);
  const [occupationStats, setOccupationStats] = useState({ median: 0, q75: 0, q90: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/data/H1B_dashboard_dataset.csv")
      .then((response) => response.text())
      .then((csvText) => {
        Papa.parse<DashboardRow>(csvText, {
          header: true,
          complete: (results) => {
            const data = results.data.filter((row) => row.Occupation);
            setAllData(data);
            
            // Get unique occupations (first 20)
            const uniqueOccs = Array.from(new Set(data.map((d) => d.Occupation))).slice(0, 20);
            setOccupations(uniqueOccs);
            setSelectedOccupation(uniqueOccs[0]);
            setLoading(false);
          },
        });
      });
  }, []);

  useEffect(() => {
    if (!selectedOccupation || allData.length === 0) return;

    const occData = allData.filter((d) => d.Occupation === selectedOccupation);
    
    // Get top employers (those with employer names, not "ALL")
    const employerRows = occData
      .filter((d) => d.Employer !== "ALL" && d.Applications)
      .map((d) => ({
        name: d.Employer,
        applications: parseInt(d.Applications),
        medianWage: parseFloat(d.Employer_Median_Wage) || 0,
      }))
      .sort((a, b) => b.applications - a.applications)
      .slice(0, 10);
    
    setEmployers(employerRows);

    // Get salary distribution (rows with "ALL" as employer and Bin_Center values)
    const distRows = occData
      .filter((d) => d.Employer === "ALL" && d.Bin_Center)
      .map((d) => ({
        binCenter: parseFloat(d.Bin_Center),
        count: parseInt(d.Sample_Count) || 0,
      }))
      .sort((a, b) => a.binCenter - b.binCenter);
    
    setSalaryDist(distRows);

    // Get occupation stats
    if (occData.length > 0) {
      setOccupationStats({
        median: parseFloat(occData[0].Occupation_Median_Wage) || 0,
        q75: parseFloat(occData[0].Occupation_75th_Wage) || 0,
        q90: parseFloat(occData[0].Occupation_90th_Wage) || 0,
      });
    }
  }, [selectedOccupation, allData]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="chart-tooltip">
          <p className="font-semibold">{payload[0].payload.name || `$${(payload[0].payload.binCenter / 1000).toFixed(0)}k`}</p>
          <p className="text-xs">
            {payload[0].name}: {payload[0].value.toLocaleString()}
          </p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <section id="occupations" className="section-container bg-background">
        <div className="text-center">Loading data...</div>
      </section>
    );
  }

  return (
    <section id="occupations" className="section-container bg-background">
      <div className="text-center mb-12">
        <h2 className="section-title">Top Occupations and Sponsors</h2>
        <p className="section-subtitle mx-auto">
          Discover which professions and companies dominate H1B filings, and how they differ in approval rates and compensation.
        </p>
      </div>

      <div className="bg-card rounded-2xl p-6 shadow-lg">
        <div className="mb-8">
          <label className="block text-sm font-medium mb-2">Select Occupation:</label>
          <Select value={selectedOccupation} onValueChange={setSelectedOccupation}>
            <SelectTrigger className="w-full max-w-md">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {occupations.map((occ) => (
                <SelectItem key={occ} value={occ}>
                  {occ}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Salary Distribution Histogram with Box Plot Stats */}
        <div className="mb-8">
          <h3 className="text-xl font-bold mb-4">Salary Distribution for {selectedOccupation}</h3>
          <div className="grid md:grid-cols-3 gap-4 mb-4">
            <div className="p-3 bg-primary/10 border border-primary/30 rounded-lg text-center">
              <p className="text-xs text-muted-foreground">Median Wage</p>
              <p className="text-lg font-bold text-primary">${occupationStats.median.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-accent/10 border border-accent/30 rounded-lg text-center">
              <p className="text-xs text-muted-foreground">75th Percentile</p>
              <p className="text-lg font-bold text-accent-foreground">${occupationStats.q75.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-success/10 border border-success/30 rounded-lg text-center">
              <p className="text-xs text-muted-foreground">90th Percentile</p>
              <p className="text-lg font-bold text-success">${occupationStats.q90.toLocaleString()}</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={salaryDist}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="binCenter" 
                stroke="hsl(var(--muted-foreground))"
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" fill="hsl(var(--primary))" name="Applications" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Top Sponsors Chart */}
          <div>
            <h3 className="text-xl font-bold mb-4">Top Sponsors by Application Count</h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={employers.slice(0, 8)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={180}
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fontSize: 11 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="applications" fill="hsl(var(--primary))" name="Applications" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Employer Table */}
          <div>
            <h3 className="text-xl font-bold mb-4">Detailed Employer Data</h3>
            <div className="overflow-auto max-h-[400px] border border-border rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-muted sticky top-0">
                  <tr>
                    <th className="p-3 text-left font-semibold">Employer</th>
                    <th className="p-3 text-right font-semibold">Applications</th>
                    <th className="p-3 text-right font-semibold">Median Wage</th>
                  </tr>
                </thead>
                <tbody>
                  {employers.map((employer, idx) => (
                    <tr key={idx} className="border-t border-border hover:bg-muted/50 transition-colors">
                      <td className="p-3 text-xs">{employer.name}</td>
                      <td className="p-3 text-right">{employer.applications.toLocaleString()}</td>
                      <td className="p-3 text-right text-success font-medium">
                        ${employer.medianWage.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default OccupationInsights;
