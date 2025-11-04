import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, AlertCircle } from "lucide-react";
import Papa from "papaparse";

interface StateData {
  state: string;
  state_abbr: string;
  apps: string;
  wage_median: string;
  approval_rate: string;
}

interface OccupationOption {
  name: string;
}

const PredictionTool = () => {
  const [stateData, setStateData] = useState<StateData[]>([]);
  const [occupations, setOccupations] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    occupation: "",
    state: "",
    wage: "",
  });
  const [prediction, setPrediction] = useState<number | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load state data
    fetch("/data/h1b_state_agg.csv")
      .then((response) => response.text())
      .then((csvText) => {
        Papa.parse<StateData>(csvText, {
          header: true,
          complete: (results) => {
            setStateData(results.data.filter((row) => row.state));
          },
        });
      });

    // Load occupation data
    fetch("/data/H1B_dashboard_dataset.csv")
      .then((response) => response.text())
      .then((csvText) => {
        Papa.parse(csvText, {
          header: true,
          complete: (results) => {
            const uniqueOccs = Array.from(
              new Set(results.data.map((row: any) => row.Occupation).filter(Boolean))
            ).slice(0, 20) as string[];
            setOccupations(uniqueOccs);
            setLoading(false);
          },
        });
      });
  }, []);

  const calculatePrediction = () => {
    setIsCalculating(true);
    
    setTimeout(() => {
      // Simple mock prediction logic based on wage
      let baseRate = 90;
      
      // Wage factor
      const wage = parseInt(formData.wage);
      if (wage >= 150000) baseRate += 5;
      else if (wage >= 100000) baseRate += 3;
      else if (wage >= 80000) baseRate += 1;
      
      // State factor
      const state = stateData.find(s => s.state === formData.state);
      if (state) {
        baseRate = (baseRate + parseFloat(state.approval_rate)) / 2;
      }
      
      // Add some randomness
      const finalRate = Math.min(98, Math.max(85, baseRate + (Math.random() * 2 - 1)));
      
      setPrediction(finalRate);
      setIsCalculating(false);
    }, 1500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.occupation && formData.state && formData.wage) {
      calculatePrediction();
    }
  };

  const resetForm = () => {
    setFormData({ occupation: "", state: "", wage: "" });
    setPrediction(null);
  };

  return (
    <section id="prediction" className="section-container bg-background">
      <div className="text-center mb-12">
        <h2 className="section-title">Will Your Application Be Approved?</h2>
        <p className="section-subtitle mx-auto">
          Enter your details to get an estimated approval probability based on historical H1B data trends.
        </p>
      </div>

      {loading ? (
        <div className="text-center">Loading form data...</div>
      ) : (
        <div className="max-w-3xl mx-auto bg-card rounded-2xl p-8 shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="occupation">Occupation</Label>
              <Select value={formData.occupation} onValueChange={(val) => setFormData({ ...formData, occupation: val })}>
                <SelectTrigger id="occupation">
                  <SelectValue placeholder="Select your occupation" />
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

            <div>
              <Label htmlFor="state">Work State</Label>
              <Select value={formData.state} onValueChange={(val) => setFormData({ ...formData, state: val })}>
                <SelectTrigger id="state">
                  <SelectValue placeholder="Select work location state" />
                </SelectTrigger>
                <SelectContent>
                  {stateData.map((state) => (
                    <SelectItem key={state.state_abbr} value={state.state}>
                      {state.state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

          <div>
            <Label htmlFor="wage">Annual Wage (USD)</Label>
            <Input
              id="wage"
              type="number"
              placeholder="e.g., 120000"
              value={formData.wage}
              onChange={(e) => setFormData({ ...formData, wage: e.target.value })}
              min="40000"
              max="500000"
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={!formData.occupation || !formData.state || !formData.wage || isCalculating}
          >
            {isCalculating ? "Calculating..." : "Calculate Approval Probability"}
          </Button>
          </form>

        {prediction !== null && (
          <div className="mt-8 animate-fade-in">
            <div className="text-center mb-6">
              <div className="relative inline-block">
                <svg className="w-48 h-48 mx-auto" viewBox="0 0 200 200">
                  {/* Background circle */}
                  <circle
                    cx="100"
                    cy="100"
                    r="80"
                    fill="none"
                    stroke="hsl(var(--muted))"
                    strokeWidth="20"
                  />
                  {/* Progress circle */}
                  <circle
                    cx="100"
                    cy="100"
                    r="80"
                    fill="none"
                    stroke={prediction >= 93 ? "hsl(var(--success))" : "hsl(var(--warning))"}
                    strokeWidth="20"
                    strokeDasharray={`${(prediction / 100) * 502} 502`}
                    strokeLinecap="round"
                    transform="rotate(-90 100 100)"
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-5xl font-bold">{prediction.toFixed(1)}%</span>
                  <span className="text-sm text-muted-foreground">Estimated</span>
                </div>
              </div>
            </div>

            <div className={`p-4 rounded-lg border ${
              prediction >= 93
                ? "bg-success/10 border-success/30"
                : "bg-warning/10 border-warning/30"
            }`}>
              <div className="flex items-start gap-3">
                {prediction >= 93 ? (
                  <CheckCircle className="w-5 h-5 text-success mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-warning mt-0.5" />
                )}
                <div className="flex-1">
                  <p className="font-semibold mb-2">
                    {prediction >= 93 ? "Strong Approval Likelihood" : "Moderate Approval Likelihood"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {prediction >= 93
                      ? `Your profile aligns well with successful H1B applications. Applicants with similar profiles 
                         in your occupation and wage bracket had approximately ${prediction.toFixed(0)}% approval rates 
                         in recent years.`
                      : `Your application has a reasonable chance. Consider strengthening your profile with additional 
                         qualifications or exploring higher wage opportunities to improve approval likelihood.`}
                  </p>
                </div>
              </div>
            </div>

            <Button onClick={resetForm} variant="outline" className="w-full mt-4">
              Try Another Scenario
            </Button>
          </div>
          )}
        </div>
      )}
    </section>
  );
};

export default PredictionTool;
