import { ChevronDown } from "lucide-react";

const Hero = () => {
  const scrollToOverview = () => {
    const element = document.querySelector("#overview");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      style={{ background: "var(--gradient-hero)" }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(255,255,255,0.1),transparent)]" />
      
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-[hsl(216,50%,30%)] mb-6 animate-fade-in">
          Data Behind <span className="text-[hsl(6,72%,45%)]">H1-B</span> Visas
        </h1>
        <p className="text-xl sm:text-2xl  text-[hsl(24,20%,25%)] mb-4 max-w-3xl mx-auto animate-slide-up">
          Exploring trends in H1B visa applications from 2020–2024
        </p>
        <p className="text-base sm:text-lg text-[hsl(24,20%,25%)] mb-12 max-w-2xl mx-auto animate-slide-up">
          The H-1B visa allows specialized foreign workers into the U.S. when a skill gap exists
          in the domestic labor market. The program is heavily weighted towards STEM, where software
          developers represent 38% of the occupations.
        </p>
        
        <button
          onClick={scrollToOverview}
          className="group animate-bounce hover:animate-none transition-all"
          aria-label="Scroll to content"
        >
          <ChevronDown className="w-12 h-12 text-[hsl(6,72%,45%)] group-hover:text-white transition-colors" />
        </button>
      </div>
    </section>
  );
};

export default Hero;
