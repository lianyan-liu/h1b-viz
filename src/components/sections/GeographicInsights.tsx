import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import Papa from "papaparse";
import { geoPath, geoAlbersUsa } from "d3-geo";
import { feature } from "topojson-client";

interface StateData {
  state: string;
  state_abbr: string;
  apps: string;
  wage_median: string;
  approval_rate: string;
}

interface StateMetrics {
  [key: string]: {
    approvalRate: number;
    medianWage: number;
    applications: number;
    name: string;
  };
}

type MetricType = "approvalRate" | "medianWage" | "applications";

const GeographicInsights = () => {
  const [selectedMetric, setSelectedMetric] = useState<MetricType>("applications");
  const [stateMetrics, setStateMetrics] = useState<StateMetrics>({});
  const [geoData, setGeoData] = useState<any>(null);
  const [hoveredState, setHoveredState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
    
    const nameToAbbr = useMemo(() => {
        const m: Record<string, string> = {};
        Object.keys(stateMetrics).forEach(abbr => {
            const name = stateMetrics[abbr]?.name;
            if (name) m[name] = abbr;
        });
        return m;}, [stateMetrics]);
    
    const legendSpec = useMemo(() => {
        if (selectedMetric === "approvalRate") {
            return {
                title: "Approval Rate",
                bins: [
                    { label: "< 87%",   color: "hsl(var(--destructive))" },
                    { label: "87–90%",  color: "hsl(var(--warning))" },
                    { label: "90–93%",  color: "hsl(var(--certified-withdrawn))" },
                    { label: "≥ 93%",   color: "hsl(var(--success))" },
                ],
            };
        }
        if (selectedMetric === "medianWage") {
            return {
                title: "Median Wage",
                bins: [
                    { label: "< $110k",      color: "hsl(var(--primary))" },
                    { label: "$110k–120k",   color: "hsl(var(--warning))" },
                    { label: "$120k–140k",   color: "hsl(var(--certified-withdrawn))" },
                    { label: "≥ $140k",      color: "hsl(var(--success))" },
                ],
            };
        }
        // applications
        return {
            title: "Applications",
            bins: [
                { label: "< 5k",    color: "hsl(var(--primary))" },
                { label: "5k–10k",  color: "hsl(var(--warning))" },
                { label: "10k–20k", color: "hsl(var(--certified-withdrawn))" },
                { label: "≥ 20k",   color: "hsl(var(--success))" },
            ],
        };
    }, [selectedMetric, stateMetrics]);


  useEffect(() => {
    // Load state data
    fetch("/data/h1b_state_agg.csv")
      .then((response) => response.text())
      .then((csvText) => {
        Papa.parse<StateData>(csvText, {
          header: true,
          complete: (results) => {
            const metrics: StateMetrics = {};
            results.data.forEach((row) => {
              if (row.state_abbr) {
                metrics[row.state_abbr] = {
                  name: row.state,
                  approvalRate: parseFloat(row.approval_rate),
                  medianWage: parseFloat(row.wage_median),
                  applications: parseInt(row.apps),
                };
              }
            });
            setStateMetrics(metrics);
          },
        });
      });

    // Load TopoJSON
    fetch("/data/us-states-10m.json")
      .then((response) => response.json())
      .then((topology) => {
        const states = feature(topology, topology.objects.states);
        setGeoData(states);
        setLoading(false);
      });
  }, []);

  const getColor = (stateId: string) => {
    const state = geoData?.features.find((f: any) => f.id === stateId);
    if (!state) return "hsl(var(--muted))";
    
    const stateName = state.properties.name;
    const stateAbbr = Object.keys(stateMetrics).find(
      (key) => stateMetrics[key].name === stateName
    );
    
    if (!stateAbbr) return "hsl(var(--muted))";
    
    const data = stateMetrics[stateAbbr];
    const value = data[selectedMetric];
    
    if (selectedMetric === "approvalRate") {
      if (value >= 93) return "hsl(var(--success))";
      if (value >= 90) return "hsl(var(--certified-withdrawn))";
      if (value >= 87) return "hsl(var(--warning))";
      return "hsl(var(--destructive))";
    } else if (selectedMetric === "medianWage") {
      if (value >= 140000) return "hsl(var(--success))";
      if (value >= 120000) return "hsl(var(--certified-withdrawn))";
      if (value >= 110000) return "hsl(var(--warning))";
      return "hsl(var(--primary))";
    } else {
      if (value >= 20000) return "hsl(var(--success))";
      if (value >= 10000) return "hsl(var(--certified-withdrawn))";
      if (value >= 5000) return "hsl(var(--warning))";
      return "hsl(var(--primary))";
    }
  };

  const formatValue = (value: number) => {
    if (selectedMetric === "approvalRate") return `${value.toFixed(1)}%`;
    if (selectedMetric === "medianWage") return `$${value.toLocaleString()}`;
    return value.toLocaleString();
  };

  const getStateData = (stateId: string) => {
    const state = geoData?.features.find((f: any) => f.id === stateId);
    if (!state) return null;
    
    const stateName = state.properties.name;
    const stateAbbr = Object.keys(stateMetrics).find(
      (key) => stateMetrics[key].name === stateName
    );
    
    return stateAbbr ? stateMetrics[stateAbbr] : null;
  };

  if (loading) {
    return (
      <section id="geography" className="section-container" style={{ background: "var(--gradient-subtle)" }}>
        <div className="text-center">Loading map data...</div>
      </section>
    );
  }

  const projection = geoAlbersUsa().scale(1300).translate([487.5, 305]);
  const pathGenerator = geoPath().projection(projection);

  return (
    <section id="geography" className="section-container" style={{ background: "var(--gradient-subtle)" }}>
      <div className="text-center mb-12">
        <h2 className="section-title">Where H1B Jobs Are Concentrated</h2>
        <p className="section-subtitle mx-auto">
          H-1B opportunities cluster where specialized skills are in highest demand, not necessarily where the population or job market is largest.
        </p>
        <p className="text-left text-base md:text-lg mt-9">
          H-1B jobs don’t spread evenly across the United States. They cluster where employers rely most on specialized talent. States with large tech hubs or major research institutions attract the highest volumes, while regions dominated by smaller markets or less knowledge-intensive industries naturally show lighter demand. Approval rates, however, don’t always follow volume: some low-volume states maintain exceptionally high approval ratios, often because only the most well-documented, high-intent petitions are filed there.
        </p>
        <p className="text-left text-base md:text-lg mt-3">
          Wage patterns add another layer of contrast. Higher median salaries tend to appear in states with strong healthcare, government, or advanced-technology sectors rather than only in places with many filings. Together, these maps highlight a key point: where H-1B jobs concentrate tells us less about population or size of the state, and more about where employers are actively competing for scarce, highly specialized skill sets.
        </p>
      </div>

      <div className="bg-card rounded-2xl p-6 shadow-lg">
        <div className="flex flex-wrap justify-center gap-3 mb-8">
          <Button
            onClick={() => setSelectedMetric("applications")}
            variant={selectedMetric === "applications" ? "default" : "outline"}
          >
            Application Count
          </Button>
          <Button
            onClick={() => setSelectedMetric("approvalRate")}
            variant={selectedMetric === "approvalRate" ? "default" : "outline"}
          >
            Approval Rate
          </Button>
          <Button
            onClick={() => setSelectedMetric("medianWage")}
            variant={selectedMetric === "medianWage" ? "default" : "outline"}
          >
            Median Wage
          </Button>
        </div>

        <div className="relative">
          <svg width="975" height="610" viewBox="0 0 975 610" className="w-full h-auto">
            <g>
              {geoData?.features.map((feature: any) => {
                const stateData = getStateData(feature.id);
                return (
                  <path
                    key={feature.id}
                    d={pathGenerator(feature) || ""}
                    fill={getColor(feature.id)}
                    stroke="hsl(var(--border))"
                    strokeWidth="1"
                    className="transition-all duration-300 cursor-pointer hover:opacity-80"
                    onMouseEnter={() => setHoveredState(feature.id)}
                    onMouseLeave={() => setHoveredState(null)}
                  />
                );
              })}
            </g>
            <g pointerEvents="none">
             {geoData?.features.map((f: any) => {
               const [cx, cy] = pathGenerator.centroid(f);
               const abbr = nameToAbbr[f.properties?.name as string];
               if (!abbr || !Number.isFinite(cx) || !Number.isFinite(cy)) return null;
               return (
                 <text
                   key={`${f.id}-label`}
                   x={cx}
                   y={cy}
                   textAnchor="middle"
                   style={{
                     fill: "hsl(var(--foreground))",
                     opacity: 0.8,
                     fontSize: "11px",
                     fontWeight: 700,
                     paintOrder: "stroke",
                     stroke: "hsl(var(--card))",
                     strokeWidth: 3,
                   }}
                 >
                   {abbr}
                 </text>
               );
             })}
           </g>
          </svg>
          
          <div className="absolute bottom-1 right-4 bg-card/95 border border-border rounded-lg shadow-lg px-3 py-2">
            <div className="text-xs font-semibold mb-1 text-muted-foreground">{legendSpec.title}</div>
            <div className="flex items-center gap-2">
              {legendSpec.bins.map((b, i) => (
                <div key={i} className="flex items-center gap-1">
                  <span
                    className="inline-block rounded-sm"
                    style={{ width: 14, height: 10, background: b.color }}
                  />
                  <span className="text-xs text-muted-foreground">{b.label}</span>
                  {i < legendSpec.bins.length - 1 && <span className="mx-1 text-muted-foreground/60">|</span>}
                </div>
              ))}
            </div>
          </div>


          {hoveredState && getStateData(hoveredState) && (
            <div
              className="absolute top-4 right-4 bg-card border border-border rounded-lg p-4 shadow-lg"
              style={{ minWidth: "200px" }}
            >
              <p className="font-semibold mb-2">{getStateData(hoveredState)?.name}</p>
              <p className="text-xs">Applications: {getStateData(hoveredState)?.applications.toLocaleString()}</p>
              <p className="text-xs text-success">Approval Rate: {getStateData(hoveredState)?.approvalRate.toFixed(1)}%</p>
              <p className="text-xs text-primary">Median Wage: ${getStateData(hoveredState)?.medianWage.toLocaleString()}</p>
            </div>
          )}
        </div>

        <div className="mt-6 grid sm:grid-cols-3 gap-4">
          <div className="p-4 bg-primary/10 border border-primary/30 rounded-lg text-center">
            <p className="text-sm text-muted-foreground mb-1">Highest Volume</p>
            <p className="text-xl font-bold text-primary">New Mexico</p>
            <p className="text-sm">45,091 applications</p>
          </div>
          <div className="p-4 bg-success/10 border border-success/30 rounded-lg text-center">
            <p className="text-sm text-muted-foreground mb-1">Highest Approval Rate</p>
            <p className="text-xl font-bold text-success">New Mexico</p>
            <p className="text-sm">95.2% approved</p>
          </div>
          <div className="p-4 bg-accent/10 border border-accent/30 rounded-lg text-center">
            <p className="text-sm text-muted-foreground mb-1">Highest Median Wage</p>
            <p className="text-xl font-bold text-accent-foreground">West Virginia</p>
            <p className="text-sm">$169,201</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default GeographicInsights;
