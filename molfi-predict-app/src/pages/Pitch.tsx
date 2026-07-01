import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { ArrowRight, Check, X, Target, Lightbulb, Zap, Users, Rocket, ExternalLink, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SEO } from "@/components/SEO";
import { ParticleEffects } from "@/components/ParticleEffects";
import { LiquidityNetwork3D } from "@/components/LiquidityNetwork3D";
import { AAWalletOption3 } from "@/components/AAWalletOption3";
import optimismLogo from "@/assets/optimism-logo.png";
import dynamicLogo from "@/assets/dynamic-logo.png";
import usdcLogo from "@/assets/usdc-logo.png";
import quillauditLogo from "@/assets/quillaudit-logo.png";
import storkLogo from "@/assets/stork-logo.svg";
import vialabsLogo from "@/assets/vialabs-logo.svg";
import databricksLogo from "@/assets/databricks-logo.png";
import googleCloudLogo from "@/assets/google-cloud-logo.svg";

const Pitch = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.8]);
  
  // Gradient animation based on scroll
  const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);
  const gradientRotation = useTransform(scrollYProgress, [0, 1], [0, 360]);

  return (
    <>
      <SEO 
        title="Pitch Deck - Molfi"
        description="The Unified Prediction Engine for DeFi. Cross-market aggregation, liquidity routing, and developer APIs for the next era of decentralized trading."
      />
      <div ref={containerRef} className="min-h-screen bg-background relative">
        {/* Animated Gradient Background */}
        <motion.div 
          className="fixed inset-0 pointer-events-none z-0"
          style={{
            background: `linear-gradient(${gradientRotation}deg, 
              hsl(var(--primary) / 0.05), 
              hsl(var(--secondary) / 0.08), 
              hsl(var(--accent) / 0.05))`,
            backgroundSize: "400% 400%",
          }}
        />
        
        {/* Hero Section */}
        <section className="min-h-screen flex items-center justify-center relative overflow-hidden">
          <ParticleEffects />
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 animate-gradient bg-300%" />
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnoiIHN0cm9rZT0iY3VycmVudENvbG9yIiBzdHJva2Utb3BhY2l0eT0iLjA1IiBzdHJva2Utd2lkdGg9IjIiLz48L2c+PC9zdmc+')] opacity-30" />
          
          <motion.div
            style={{ opacity, scale }}
            className="text-center z-10 px-4"
          >
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-6xl md:text-8xl font-bold mb-6 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                Molfi
              </h1>
              <p className="text-2xl md:text-4xl font-semibold text-foreground mb-4">
                The Unified Prediction Engine for DeFi
              </p>
              <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
                Cross-market aggregation, liquidity routing, and developer APIs for the next era of decentralized trading
              </p>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5, duration: 1 }}
            className="absolute bottom-10 left-1/2 -translate-x-1/2"
          >
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <span className="text-sm">Scroll to explore</span>
              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                <ArrowRight className="rotate-90" />
              </motion.div>
            </div>
          </motion.div>
        </section>

        {/* Problem Section */}
        <PitchSection
          icon={<Target className="w-12 h-12" />}
          title="Problem"
          subtitle="Prediction Markets Are Fragmented"
        >
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: "Scattered Liquidity",
                description: "Traders chase liquidity across isolated venues like Polymarket, Limitless, and Zeitgeist",
              },
              {
                title: "Price Inefficiency",
                description: "Odds and liquidity differ across platforms, creating market inefficiencies",
              },
              {
                title: "Redundant Development",
                description: "Developers rebuild the same core logic repeatedly across different chains",
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="p-6 h-full bg-card/50 backdrop-blur-sm border-2 hover:border-primary/50 transition-colors">
                  <h3 className="text-xl font-semibold mb-3 text-foreground">{item.title}</h3>
                  <p className="text-muted-foreground">{item.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </PitchSection>

        {/* Solution Section */}
        <PitchSection
          icon={<Lightbulb className="w-12 h-12" />}
          title="Solution"
          subtitle="One Engine. Unified Liquidity."
          gradient="from-secondary/20 to-primary/20"
        >
          <p className="text-xl text-center mb-12 text-foreground">
            Molfi aggregates every market, routes liquidity, and creates a universal access layer
          </p>
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {[
              { title: "Native Prediction Markets", icon: "🎯" },
              { title: "Aggregator Layer", icon: "🔗" },
              { title: "Cross-Market Arbitrage", icon: "⚖️" },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.15 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.05 }}
                className="text-center"
              >
                <div className="text-6xl mb-4">{item.icon}</div>
                <h3 className="text-xl font-semibold text-foreground">{item.title}</h3>
              </motion.div>
            ))}
          </div>
          
          {/* 3D Liquidity Network Visualization */}
          <LiquidityNetwork3D />
        </PitchSection>

        {/* Core Components */}
        <PitchSection
          icon={<Zap className="w-12 h-12" />}
          title="Core Components"
          subtitle="Modular Architecture for Maximum Impact"
        >
          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                component: "Native Prediction Market",
                description: "On-chain markets powered by Molfi's own matching engine",
              },
              {
                component: "Aggregator Layer",
                description: "Routes liquidity across external venues for best-odds execution",
              },
              {
                component: "Arbitrage Engine",
                description: "Balances cross-market pricing using automated strategies",
              },
              {
                component: "Unified API Infrastructure",
                description: "One endpoint for all major prediction protocols — build once, connect everywhere",
              },
              {
                component: "AA Wallets & Chain Abstraction",
                description: "Simplified onboarding; users trade seamlessly without managing chains or gas",
              },
              {
                component: "AI-Based Market Scoring",
                description: "Proprietary models rank markets by confidence and opportunity",
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="p-6 bg-gradient-to-br from-card to-card/50 border-2 hover:border-accent transition-all hover:shadow-glow">
                  <h3 className="text-lg font-semibold mb-2 text-primary">{item.component}</h3>
                  <p className="text-muted-foreground">{item.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </PitchSection>

        {/* Chain Abstraction & Intent Architecture */}
        <PitchSection
          title="Chain Abstraction & Intent Architecture"
          subtitle="Trade from any chain. Stay on your native chain. We handle everything."
          gradient="from-primary/20 to-accent/20"
        >
          <AAWalletOption3 />
        </PitchSection>

        {/* Technology Stack */}
        <PitchSection
          title="Technology Stack"
          subtitle="AI, Data, and Interoperability at Core"
          gradient="from-accent/20 to-secondary/20"
        >
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-wrap justify-center gap-4 mb-12">
              {["Data", "AI Scoring", "Aggregator", "API", "Wallet Abstraction"].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  viewport={{ once: true }}
                  className="relative"
                >
                  <div className="px-6 py-3 bg-primary/10 border-2 border-primary rounded-full font-semibold text-foreground">
                    {item}
                  </div>
                  {i < 4 && (
                    <ArrowRight className="absolute -right-6 top-1/2 -translate-y-1/2 text-primary hidden md:block" />
                  )}
                </motion.div>
              ))}
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { title: "Modular & EVM-compatible", icon: "🔧" },
                { title: "AI pipelines with Databricks ($50k grant)", icon: "🤖" },
                { title: "Smart Contract Audit by QuillAudit", icon: "🛡️" },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  viewport={{ once: true }}
                  className="text-center p-6 bg-card/50 rounded-lg"
                >
                  <div className="text-4xl mb-3">{item.icon}</div>
                  <p className="text-foreground font-medium">{item.title}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </PitchSection>

        {/* Market Opportunity */}
        <PitchSection
          title="Market Opportunity"
          subtitle="A $100B+ Data and DeFi Opportunity"
        >
          <div className="max-w-3xl mx-auto space-y-6">
            {[
              "DeFi + on-chain prediction markets = emerging category of decentralized intelligence",
              "No unified liquidity or analytics layer exists today",
              "Molfi bridges liquidity, intelligence, and developer access",
            ].map((text, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.15 }}
                viewport={{ once: true }}
                className="flex items-center gap-4 p-4 bg-success/10 border-l-4 border-success rounded-r-lg"
              >
                <Check className="w-6 h-6 text-success flex-shrink-0" />
                <p className="text-foreground text-lg">{text}</p>
              </motion.div>
            ))}
          </div>
        </PitchSection>

        {/* Competitive Edge */}
        <PitchSection
          title="Competitive Edge"
          subtitle="Molfi isn't another market — it's the layer that unifies them all"
          gradient="from-primary/20 to-accent/20"
        >
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-card/50">
                  <th className="p-4 text-left font-semibold text-foreground">Feature</th>
                  <th className="p-4 text-center font-semibold text-muted-foreground">Polymarket</th>
                  <th className="p-4 text-center font-semibold text-muted-foreground">Omen</th>
                  <th className="p-4 text-center font-semibold text-muted-foreground">Thales</th>
                  <th className="p-4 text-center font-semibold text-primary">Molfi</th>
                </tr>
              </thead>
              <tbody>
                {[
                  "Cross-venue liquidity",
                  "AI market scoring",
                  "Unified API layer",
                  "Chain abstraction",
                ].map((feature, i) => (
                  <motion.tr
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    viewport={{ once: true }}
                    className="border-t border-border"
                  >
                    <td className="p-4 font-medium text-foreground">{feature}</td>
                    <td className="p-4 text-center"><X className="w-5 h-5 text-destructive mx-auto" /></td>
                    <td className="p-4 text-center"><X className="w-5 h-5 text-destructive mx-auto" /></td>
                    <td className="p-4 text-center"><X className="w-5 h-5 text-destructive mx-auto" /></td>
                    <td className="p-4 text-center"><Check className="w-5 h-5 text-success mx-auto" /></td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </PitchSection>

        {/* Partners */}
        <PitchSection
          title="Partners"
          subtitle="Powering Molfi's Growth"
        >
          <div className="grid md:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {[
              { 
                logo: optimismLogo, 
                name: "Optimism Superchain", 
                description: "Awarded Grant for Smart Contract Audit",
                alt: "Optimism Superchain"
              },
              { 
                logo: quillauditLogo, 
                name: "QuillAudit", 
                description: "Smart Contract Audit Partner",
                alt: "QuillAudit"
              },
              { 
                logo: dynamicLogo, 
                name: "Dynamic", 
                description: "Smart AA Wallet Provider",
                alt: "Dynamic"
              },
              { 
                logo: storkLogo, 
                name: "Stork.network", 
                description: "Decentralized & Custom Oracle Provider",
                alt: "Stork Network"
              },
              { 
                logo: vialabsLogo, 
                name: "ViaLabs", 
                description: "Cross-Chain Message Provider",
                alt: "ViaLabs"
              },
              { 
                logo: usdcLogo, 
                name: "Circle USDC", 
                description: "Native Stablecoin Integration",
                alt: "Circle USDC"
              },
              { 
                logo: databricksLogo, 
                name: "Databricks", 
                description: "$50,000 Credit Grant",
                alt: "Databricks"
              },
              { 
                logo: googleCloudLogo, 
                name: "Google Cloud", 
                description: "Google Cloud Credit Grant under Web3 Startup Program",
                alt: "Google Cloud"
              },
            ].map((partner, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -5 }}
              >
                <Card className="p-6 text-center bg-card/50 backdrop-blur-sm border-2 hover:border-primary/50 transition-all h-full flex flex-col items-center justify-between gap-4">
                  <div className="h-16 flex items-center justify-center w-full">
                    <img 
                      src={partner.logo} 
                      alt={partner.alt}
                      className="max-h-12 max-w-full object-contain"
                      style={{ filter: 'brightness(0.9)' }}
                    />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold mb-2 text-foreground">{partner.name}</h3>
                    <p className="text-xs text-muted-foreground">{partner.description}</p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </PitchSection>

        {/* Team */}
        <PitchSection
          icon={<Users className="w-12 h-12" />}
          title="Founding Team"
          subtitle="Experienced Builders in Trading, Security, and Product"
          gradient="from-secondary/20 to-primary/20"
        >
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "Danny",
                role: "Founder",
                bio: "14+ years in product strategy, trading tech, and government systems. Leads architecture, partnerships, and growth. Recipient of Databricks & Google Web3 grants.",
              },
              {
                name: "Shaivy",
                role: "Co-Founder",
                bio: "13 years in SaaS & MarTech. Focuses on simplifying DeFi mechanics into intuitive user experiences and market design.",
              },
              {
                name: "Vicky",
                role: "Tech Lead",
                bio: "Former JPMorgan security engineer. 14+ years in infra hardening, blockchain audits, and DLT security. Leads protocol security & audits.",
              },
            ].map((member, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.15 }}
                viewport={{ once: true }}
              >
                <Card className="p-6 h-full bg-gradient-to-br from-card to-accent/5 border-2 hover:border-accent transition-all">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-secondary mb-4 mx-auto" />
                  <h3 className="text-xl font-bold text-center mb-1 text-foreground">{member.name}</h3>
                  <p className="text-primary text-center font-semibold mb-4">{member.role}</p>
                  <p className="text-muted-foreground text-sm">{member.bio}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </PitchSection>

        {/* Vision */}
        <PitchSection
          icon={<Rocket className="w-12 h-12" />}
          title="Vision"
          subtitle="The Standard Layer for Prediction Markets"
        >
          <div className="text-center max-w-3xl mx-auto">
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-2xl text-foreground mb-8"
            >
              Molfi powers traders, developers, and markets through unified access, liquidity, and intelligence
            </motion.p>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="inline-block"
            >
              <div className="p-8 bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 rounded-2xl border-2 border-primary/50">
                <p className="text-lg text-foreground font-medium">
                  Building the infrastructure layer that connects every prediction market, everywhere
                </p>
              </div>
            </motion.div>
          </div>
        </PitchSection>

        {/* CTA Section */}
        <section className="min-h-screen flex items-center justify-center relative overflow-hidden">
          <ParticleEffects />
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 animate-gradient bg-300%" />
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center z-10 px-4 relative"
          >
            <h2 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              Join the Unified Market Layer
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Seeking ecosystem partners, developer integrations, and technical collaborators ahead of testnet
            </p>
            <p className="text-lg text-foreground mb-12">
              Open to strategic alliances with DeFi protocols and data infrastructure players
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="text-lg px-8" asChild>
                <a href="https://molfi.com" target="_blank" rel="noopener noreferrer">
                  Visit Molfi <ExternalLink className="ml-2 w-5 h-5" />
                </a>
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8" asChild>
                <a href="https://x.com/molfi_com" target="_blank" rel="noopener noreferrer">
                  @molfi_com <ExternalLink className="ml-2 w-5 h-5" />
                </a>
              </Button>
            </div>
          </motion.div>
        </section>
      </div>
    </>
  );
};

const PitchSection = ({
  icon,
  title,
  subtitle,
  children,
  gradient,
}: {
  icon?: React.ReactNode;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  gradient?: string;
}) => {
  return (
    <section className={`min-h-screen flex items-center justify-center py-20 px-4 relative ${gradient ? `bg-gradient-to-br ${gradient} animate-gradient bg-300%` : ""}`}>
      {gradient && <ParticleEffects />}
      <div className="max-w-6xl w-full relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          className="text-center mb-16"
        >
          {icon && (
            <motion.div
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ type: "spring", stiffness: 200 }}
              className="inline-block mb-6 text-primary"
            >
              {icon}
            </motion.div>
          )}
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">{title}</h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">{subtitle}</p>
        </motion.div>
        {children}
      </div>
    </section>
  );
};

export default Pitch;
