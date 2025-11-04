import { useState, useEffect } from "react";
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
          State-level variation reveals distinct patterns: California leads in volume, while Washington 
          commands the highest approval rates and median wages. Coastal concentration remains dominant.
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
          </svg>

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
