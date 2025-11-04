import { TrendingUp, Globe, DollarSign } from "lucide-react";

const Conclusion = () => {
  return (
    <section id="conclusion" className="section-container" style={{ background: "var(--gradient-hero)" }}>
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-4xl sm:text-5xl font-bold text-[hsl(216,50%,30%)] mb-6">
          Looking Ahead: The Future of H1B
        </h2>
        <p className="text-xl text-[hsl(24,20%,25%)] mb-12">
          The data reveals clear trends that shape the H1B landscape. Understanding these patterns helps
          applicants, employers, and policymakers navigate this critical program more effectively.
        </p>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-[hsl(42,35%,98%)] backdrop-blur-sm rounded-xl p-6 border border-[hsl(42,30%,85%)]">
            <TrendingUp className="w-12 h-12 text-[hsl(6,72%,45%)] mb-4 mx-auto" />
            <h3 className="text-lg font-bold text-[hsl(216,50%,30%)] mb-2">Rising Approval Rates</h3>
            <p className="text-sm text-[hsl(24,20%,25%)]">
              Approval rates have climbed steadily from 90.5% in 2020 to 96.2% in 2024, reflecting
              improved processing efficiency.
            </p>
          </div>

          <div className="bg-[hsl(42,35%,98%)] backdrop-blur-sm rounded-xl p-6 border border-[hsl(42,30%,85%)]">
            <DollarSign className="w-12 h-12 text-[hsl(6,72%,45%)] mx-auto" />
            <h3 className="text-lg font-bold text-[hsl(216,50%,30%)] mb-2">Wage Correlation</h3>
            <p className="text-sm text-[hsl(24,20%,25%)]">
              Higher wages strongly correlate with approval success, especially for positions
              offering $150,000+ annually.
            </p>
          </div>

          <div className="bg-[hsl(42,35%,98%)] backdrop-blur-sm rounded-xl p-6 border border-[hsl(42,30%,85%)]">
            <Globe className="w-12 h-12 text-[hsl(6,72%,45%)] mb-4 mx-auto" />
            <h3 className="text-lg font-bold text-[hsl(216,50%,30%)] mb-2">Geographic Concentration</h3>
            <p className="text-sm text-[hsl(24,20%,25%)]">
              Tech hubs in California, Washington, and New York continue to dominate H1B applications
              and offer top compensation.
            </p>
          </div>
        </div>

        <div className="bg-[hsl(42,35%,98%)] backdrop-blur-sm rounded-xl p-8 border border-[hsl(42,30%,85%)]">
          <h3 className="text-2xl font-bold text-[hsl(216,50%,30%)] mb-4">Key Takeaways</h3>
          <ul className="text-left text-[hsl(24,20%,25%)] space-y-3 max-w-2xl mx-auto">
            <li className="flex items-start gap-3">
              <span className="text-accent text-xl">•</span>
              <span>Software development roles continue to dominate with 38% of all H1B occupations</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-accent text-xl">•</span>
              <span>STEM fields maintain the highest approval rates, consistently above 94%</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-accent text-xl">•</span>
              <span>Major tech companies remain the primary sponsors, offering competitive compensation</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-accent text-xl">•</span>
              <span>Application volumes continue to grow, reflecting sustained demand for specialized talent</span>
            </li>
          </ul>
        </div>

        <p className="text-[hsl(24,20%,25%)] mt-12 text-sm">
          INFO 5920 Specialization Projects | Based on U.S. Department of Labor LCA data (2020-2024)
        </p>
      </div>
    </section>
  );
};

export default Conclusion;
