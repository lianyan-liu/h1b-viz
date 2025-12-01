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
      <div className="text-center mb-8">
        <h2 className="section-title">Top Occupations and Sponsors</h2>
        <p className="text-justify text-base md:text-lg mb-3">
          When analyzing certified H-1B Labor Condition Applications across the United
          States, several occupation groups consistently rise to the top in terms of
          median salary. Among them, three major categories clearly dominate the upper end of the wage spectrum.
        </p>
      </div>
      
        <div className="mb-6 grid gap-8 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1.5fr)] items-center">
          <div className="flex justify-center">
            <img
              src="/top paying industry.svg"
              alt="Illustration of top paying H1B jobs and industries"
              className="max-w-full h-auto"
            />
          </div>

          <div>
            <p className="text-xl md:text-base text-muted-foreground mb-3">
               
            </p>
            <ul className="list-disc pl-6 space-y-2 text-xl md:text-lg text-muted-foreground leading-relaxed">
              <li>
                  <strong className="text-primary">Healthcare Practitioners</strong> — This group
                  includes physicians, surgeons, anesthesiologist, diagnostic specialists
                  and other advanced medical specialists. With a median salary of <strong>$475k</strong>,
                  healthcare stands as the highest-earning profession cluster
                  in the H-1B landscape. These roles command high pay due to intense
                  educational requirements, long training pipelines, and strict licensing barriers
                  that limit the supply of qualified professionals.
              </li>
              <li>
                  <strong className="text-primary">Management Occupations</strong> — Executive and senior leadership
                  roles such as CEOs, product leaders, and IT management positions form
                  another top-earning segment. These jobs involve significant
                  decision-making responsibility, cross-functional oversight, and deep
                  industry experience, leading employers to offer premium salaries well above
                  typical technical or analyst roles.
              </li>
              <li>
                  <strong className="text-primary">Sales and Related Occupations</strong> — Particularly in financial
                  services, securities trading, and high-end real estate, some roles
                  deliver exceptionally high total compensation. While base salaries can vary
                  widely, the potential for substantial commissions and performance-linked
                  incentives pushes these occupations into the upper salary tier of
                  H-1B-supported jobs.
              </li>
            </ul>
            <p className="text-base md:text-lg text-muted-foreground mb-3 mt-4">
                Beyond these top three categories, several other professions also
                demonstrate strong earning potential in the H-1B market. <strong>Computer
                occupations</strong> remain one of the fastest-growing and
                consistently well-paid fields due to sustained demand for advanced technical
                skills. <strong>Business and financial operations roles</strong> also
                offer competitive compensation, though salaries vary widely with seniority.
                Meanwhile, <strong>architecture and engineering occupations</strong> continue
                to command solid pay driven by their technical rigor and steady cross-industry demand.
            </p>
          </div>
        </div>
        
        <div className="mt-4 mb-12">
          <p className="text-base md:text-lg leading-relaxed">
            Taken together, these patterns highlight how <strong className = "text-[hsl(216,50%,30%)]">specialized skills,
            high educational barriers, professional licensing, and strong industry
            demand</strong> shape the salary distribution across H-1B occupations.
            Employers turn to H-1B hiring in areas where U.S. supply is limited or
            competition for talent is fierce. Consequently, the
            highest-paying H-1B jobs tend to have collective requirements that justify the
            substantial wages observed in these roles.
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
