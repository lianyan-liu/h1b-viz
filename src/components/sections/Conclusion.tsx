import { TrendingUp, Globe, DollarSign } from "lucide-react";

const Conclusion = () => {
  return (
    <section id="conclusion" className="section-container" style={{ background: "var(--gradient-hero)" }}>
      <div className="max-w-6xl mx-auto text-center">
        <h2 className="text-4xl sm:text-5xl font-bold text-[hsl(216,50%,30%)] mb-6">
          Looking Ahead: The Future of H1B
        </h2>
        <p className=" text-justify text-lg md:text-xl text-muted-foreground mb-10 leading-relaxed">
          Our analysis of recent H-1B labor condition applications shows a program that
          is already highly selective, wage-sensitive, and concentrated in a handful
          of STEM and professional occupations. At the same time, a wave of new rules
          and fees is reshaping how the lottery works, who can realistically file, and
          what it takes to build a successful case from 2025 onward.
        </p>

        <div className="grid md:grid-cols-3 gap-6 mb-12 text-left mx-auto">
          <div className="bg-[hsl(42,35%,98%)] backdrop-blur-sm rounded-xl p-6 border border-[hsl(42,30%,85%)]">
            <TrendingUp className="w-12 h-12 text-[hsl(6,72%,45%)] mb-4 mx-auto" />
            <h3 className="text-lg text-center font-bold text-[hsl(216,50%,30%)] mb-2">A High-Skill, High-Wage Funnel</h3>
            <p className="text-sm text-[hsl(24,20%,25%)] leading-relaxed">
                Most approved H-1B roles sit at the intersection of specialized skills
                and competitive pay: software and data roles, advanced healthcare and
                engineering positions, and a limited set of business and finance jobs.
                Higher wages improve the odds, but approval ultimately follows the
                clarity of the role, the match between degree and duties, and the
                employer’s track record—not salary alone.
            </p>
          </div>

          <div className="bg-[hsl(42,35%,98%)] backdrop-blur-sm rounded-xl p-6 border border-[hsl(42,30%,85%)]">
            <Globe className="w-10 h-10 text-[hsl(6,72%,45%)] mb-4 mx-auto" />
            <h3 className="text-lg text-center font-bold text-[hsl(216,50%,30%)] mb-2">Fairer Odds, Higher Bar</h3>
            <p className="text-sm text-[hsl(24,20%,25%)] leading-relaxed">
                From FY 2025, the H-1B lottery becomes beneficiary-centric, giving each person only one chance regardless of how many employers register them, closing the multi-registration loophole and creating a fairer selection. New rules also narrow the “specialty occupation” standard, require degrees to be directly related to job duties. Additionally, USCIS is sharply raising fees, including a future increase in the registration fee and a proposed $100,000 surcharge on many abroad-filed petitions.
            </p>
          </div>

          <div className="bg-[hsl(42,35%,98%)] backdrop-blur-sm rounded-xl p-6 border border-[hsl(42,30%,85%)]">
            <DollarSign className="w-10 h-10 text-[hsl(6,72%,45%)] mb-4 mx-auto" />
            <h3 className="text-lg text-center font-bold text-[hsl(216,50%,30%)] mb-2">A More Expensive & Strategic H-1B</h3>
            <p className="text-sm text-[hsl(24,20%,25%)] leading-relaxed">
                If these rules remain in place, H-1B will increasingly become a
                high-stakes path reserved for clearly defined, graduate-level roles at
                employers willing to invest heavily in compliance. Large, experienced
                sponsors may absorb the new costs and standards; smaller firms and
                marginal use-cases are more likely to be priced out or pushed toward
                alternatives such as F-1 STEM OPT extensions, L-1 transfers, O-1
                extraordinary ability visas, or fully remote teams abroad.
            </p>
          </div>
        </div>

        <div className="bg-[hsl(42,35%,98%)] backdrop-blur-sm rounded-xl p-8 border border-[hsl(42,30%,85%)] text-left">
          <h3 className="text-2xl font-bold text-[hsl(216,50%,30%)] mb-4">Key Takeaways</h3>
          <ul className="text-[hsl(24,20%,25%)] space-y-3 text-sm md:text-base leading-relaxed">
            <li className="flex items-start gap-3">
              <span className="text-accent text-xl leading-none">•</span>
              <span>The program is shifting from “more petitions” to “better petitions.” Beneficiary-centric selection and tougher specialty-occupation rules reward well-documented roles that clearly rely on specialized degrees and advanced skills.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-accent text-xl leading-none">•</span>
              <span>Cost and risk will matter more than ever. Higher government fees and the potential $100,000 surcharge for some new petitions mean employers will think carefully about which candidates they sponsor, and for which roles, instead of filing broadly just in case.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-accent text-xl leading-none">•</span>
              <span>Strong alignment between role, degree, and wage will be the new baseline. Candidates with clearly related education, differentiated skills, and compensation in line with or above market levels will be best positioned under the modernized rules.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-accent text-xl leading-none">•</span>
              <span>Uncertainty will remain part of the landscape. Several recent changes may be revised or litigated, so both employers and applicants should expect the rules of the game to keep evolving and plan for multiple immigration and talent-strategy scenarios.</span>
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
