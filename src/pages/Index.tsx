import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import ApprovalTrends from "@/components/sections/ApprovalTrends";
import WageAnalysis from "@/components/sections/WageAnalysis";
import OccupationInsights from "@/components/sections/OccupationInsights";
import GeographicInsights from "@/components/sections/GeographicInsights";
import PredictionTool from "@/components/sections/PredictionTool";
import Conclusion from "@/components/sections/Conclusion";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navigation />
      <Hero />
      <ApprovalTrends />
      <WageAnalysis />
      <OccupationInsights />
      <GeographicInsights />
      <PredictionTool />
      <Conclusion />
    </div>
  );
};

export default Index;
