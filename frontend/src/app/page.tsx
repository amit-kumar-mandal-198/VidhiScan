"use client";

import { useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import StackSpread from "@/components/ui/stack-spread";

const Hero3DContainer = dynamic(() => import("@/components/Hero3DContainer"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <div className="w-12 h-12 border-3 border-ink-400/30 border-t-ink-900 rounded-full animate-spin" />
    </div>
  ),
});

import {
  ScanLine,
  ShieldCheck,
  ShieldAlert,
  Scale,
  FileText,
  Camera,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Cpu,
  Layers,
  Lock,
  Building2,
  DollarSign,
  Calendar,
  MapPin,
  Compass,
  Headphones,
  Tag,
  Award,
  Download,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Zap,
  Eye,
  BarChart3,
  Check,
  Info
} from "lucide-react";

interface DeclarationItem {
  rule: string;
  name: string;
  value: string;
  pass: boolean;
  isProviso?: boolean;
}

interface DemoScenario {
  name: string;
  brand: string;
  status: string;
  score: number;
  rulesMet: string;
  mrp: string;
  officialMrp: string;
  overcharge: boolean;
  overchargeAmount?: string;
  badgeClass: string;
  verdict: string;
  description: string;
  declarations: DeclarationItem[];
}

export default function LandingPage() {
  const [activeDemo, setActiveDemo] = useState<"butter" | "surf" | "oil">("butter");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const demoScenarios: Record<"butter" | "surf" | "oil", DemoScenario> = {
    butter: {
      name: "Amul Pasteurised Butter 100g",
      brand: "Amul / GCMMF Ltd.",
      status: "Compliant",
      score: 100,
      rulesMet: "8 / 8",
      mrp: "₹ 58.00 (Incl. of all taxes)",
      officialMrp: "₹ 58.00",
      overcharge: false,
      badgeClass: "bg-tile-mint-bg text-tile-mint-fg border-tile-mint-fg/30",
      verdict: "Fully compliant with Legal Metrology Rules, 2011",
      description: "All 8 mandatory declarations are legibly printed with proper metric unit symbols and matching central price registry.",
      declarations: [
        { rule: "Rule 6(1)(a)", name: "Manufacturer name & address", value: "GCMMF Ltd., Anand 388001, Gujarat", pass: true },
        { rule: "Rule 6(1)(b)", name: "Generic commodity name", value: "Pasteurised Butter", pass: true },
        { rule: "Rule 6(1)(c)", name: "Net quantity", value: "100 g (Standard metric)", pass: true },
        { rule: "Rule 6(1)(d)", name: "Date of manufacture", value: "02/2026", pass: true },
        { rule: "Rule 6(1)(e)", name: "Best before / expiry", value: "9 months from manufacture", pass: true },
        { rule: "Rule 6(1)(f)", name: "Country of origin", value: "India", pass: true },
        { rule: "Rule 6(1)(g)", name: "Consumer care details", value: "1800-258-3333 | gcmmf@amul.coop", pass: true },
        { rule: "Rule 6(1)(h)", name: "MRP & unit sale price", value: "₹ 58.00 (USP: ₹ 0.58/g)", pass: true },
      ]
    },
    surf: {
      name: "Surf Excel Easy Wash 1kg",
      brand: "Hindustan Unilever Ltd.",
      status: "Violation",
      score: 50,
      rulesMet: "4 / 8",
      mrp: "₹ 519.00 (Retailer sticker overwrite)",
      officialMrp: "₹ 469.00",
      overcharge: true,
      overchargeAmount: "₹ 50.00",
      badgeClass: "bg-tile-peach-bg text-tile-peach-fg border-tile-peach-fg/30",
      verdict: "Section 36(2) overcharge offence detected",
      description: "Illegal sticker alteration detected over original packaging MRP. Retail price ₹519 exceeds legal manufacturer cap of ₹469.",
      declarations: [
        { rule: "Rule 6(1)(a)", name: "Manufacturer name & address", value: "Hindustan Unilever Ltd, Mumbai", pass: true },
        { rule: "Rule 6(1)(b)", name: "Generic commodity name", value: "Detergent Powder", pass: true },
        { rule: "Rule 6(1)(c)", name: "Net quantity", value: "1 kg", pass: true },
        { rule: "Rule 6(1)(d)", name: "Date of manufacture", value: "01/2026", pass: true },
        { rule: "Rule 6(1)(e)", name: "Best before / expiry", value: "Missing on main display label", pass: false },
        { rule: "Rule 6(1)(f)", name: "Country of origin", value: "India", pass: true },
        { rule: "Rule 6(1)(g)", name: "Consumer care details", value: "Illegible / Missing telephone contact", pass: false },
        { rule: "Rule 6(1)(h)", name: "MRP & unit sale price", value: "Overcharge detected (+₹50 markup)", pass: false },
      ]
    },
    oil: {
      name: "Fortune Sunlite Refined Oil 1L",
      brand: "Adani Wilmar Ltd.",
      status: "Proviso",
      score: 87,
      rulesMet: "7 / 8",
      mrp: "₹ 165.00 (Incl. of all taxes)",
      officialMrp: "₹ 165.00",
      overcharge: false,
      badgeClass: "bg-tile-indigo-bg text-tile-indigo-fg border-tile-indigo-fg/30",
      verdict: "Proviso compliance clause validated",
      description: "Date of manufacture is stamped on crown seal/neck area pursuant to statutory Proviso to Rule 6(1)(d).",
      declarations: [
        { rule: "Rule 6(1)(a)", name: "Packer name & address", value: "Adani Wilmar Ltd, Ahmedabad", pass: true },
        { rule: "Rule 6(1)(b)", name: "Generic commodity name", value: "Refined Sunflower Oil", pass: true },
        { rule: "Rule 6(1)(c)", name: "Net volume", value: "1 L (Standard metric)", pass: true },
        { rule: "Rule 6(1)(d)", name: "Date of packing", value: "Affixed on seal/neck [Proviso to R6(1)(d)]", pass: true, isProviso: true },
        { rule: "Rule 6(1)(e)", name: "Best before duration", value: "9 months from packaging date", pass: true },
        { rule: "Rule 6(1)(f)", name: "Country of origin", value: "India", pass: true },
        { rule: "Rule 6(1)(g)", name: "Consumer grievance cell", value: "customercare@adaniwilmar.in", pass: true },
        { rule: "Rule 6(1)(h)", name: "MRP & unit sale price", value: "₹ 165.00 (USP: ₹ 0.165/ml)", pass: true },
      ]
    }
  };

  const currentScenario = demoScenarios[activeDemo];

  const mandatoryRules = [
    {
      code: "Rule 6(1)(a)",
      title: "Name & address of maker",
      desc: "Mandatory complete legal address of manufacturer, packer, or importer with postal code.",
      icon: Building2,
      tileClass: "bg-tile-indigo-bg text-tile-indigo-fg",
      penalty: "Section 36(1) fine up to ₹25,000"
    },
    {
      code: "Rule 6(1)(b)",
      title: "Generic / common name",
      desc: "Specific recognized generic commodity title so consumers are not misled by marketing slogans.",
      icon: Tag,
      tileClass: "bg-tile-mint-bg text-tile-mint-fg",
      penalty: "Misleading declaration offence"
    },
    {
      code: "Rule 6(1)(c)",
      title: "Net quantity & metric unit",
      desc: "Clear weight, measure, or numerical count adhering strictly to standard SI metric units (g, kg, ml, l).",
      icon: Scale,
      tileClass: "bg-tile-peach-bg text-tile-peach-fg",
      penalty: "Underweight / short-measure seizure"
    },
    {
      code: "Rule 6(1)(d)",
      title: "Month & year of manufacture",
      desc: "Pre-packing date prominently displayed or declared on seal/crown area under statutory proviso.",
      icon: Calendar,
      tileClass: "bg-tile-neutral-bg text-tile-neutral-fg",
      penalty: "Mandatory stamping clause"
    },
    {
      code: "Rule 6(1)(e)",
      title: "Best before / expiry period",
      desc: "Compulsory for all perishable goods, foods, pharmaceutical preparations, and active solvents.",
      icon: ShieldAlert,
      tileClass: "bg-tile-peach-bg text-tile-peach-fg",
      penalty: "Consumer safety direct liability"
    },
    {
      code: "Rule 6(1)(f)",
      title: "Country of origin",
      desc: "Unambiguous disclosure of origin country for both indigenous manufacture and imported packages.",
      icon: Compass,
      tileClass: "bg-tile-indigo-bg text-tile-indigo-fg",
      penalty: "Foreign trade & metrology breach"
    },
    {
      code: "Rule 6(1)(g)",
      title: "Consumer grievance cell",
      desc: "Full contact coordinates: designated officer name, toll-free phone, email, and postal address.",
      icon: Headphones,
      tileClass: "bg-tile-mint-bg text-tile-mint-fg",
      penalty: "Redressal deprivation penalty"
    },
    {
      code: "Rule 6(1)(h)",
      title: "MRP & unit sale price (USP)",
      desc: "Retail price inclusive of all taxes, plus compulsory unit sale price in ₹/g or ₹/ml for fair value comparison.",
      icon: DollarSign,
      tileClass: "bg-tile-neutral-bg text-tile-neutral-fg",
      penalty: "Section 36(2) overcharge prosecution"
    }
  ];

  const faqs = [
    {
      q: "Does VidhiScan require active internet connectivity inside supermarket basements?",
      a: "No. VidhiScan is engineered as an offline-first progressive web app. When an inspector or citizen scans in low-connectivity retail basements or wholesale mandis, images and forensic metadata are locally cached with device GPS coordinates and synchronized seamlessly once signal is restored."
    },
    {
      q: "How does the AI detect dual-MRP stickers and unauthorized price alteration?",
      a: "Our computer vision pipeline combines EasyOCR text extraction with OpenCV contour and edge variance analysis. If a retailer pastes a physical barcode or secondary price tag over the factory MRP, the system detects edge boundaries, dual price signatures, and cross-checks with the Central Master Registry."
    },
    {
      q: "Are the generated seizure notices legally admissible under Indian law?",
      a: "Yes. The system automatically formats statutory seizure and inspection memorandums under Section 36 of the Legal Metrology Act, 2009. The generated PDF embeds photographic evidence, high-accuracy GPS coordinates, cryptographic timestamps, and cited rule infractions."
    },
    {
      q: "How does the platform prevent fake or retaliatory complaints?",
      a: "VidhiScan implements a multi-layer anti-spam defense: submissions require live camera sensor capture, validate embedded EXIF sensor hashes, and require one-time verified token authentication."
    }
  ];

  return (
    <div className="w-full space-y-12 md:space-y-16 pb-16 max-w-6xl mx-auto px-4">
      
      {/* 1. HERO SECTION (FROSTED CANVAS) */}
      <section className="relative rounded-canvas bg-gradient-to-b from-canvas-top via-canvas-mid to-canvas-bottom border border-frame-border shadow-soft p-6 sm:p-8 md:p-12 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-6 items-center min-h-[480px]">
          
          {/* LEFT: Hero Text Content */}
          <div className="space-y-6 text-center lg:text-left order-2 lg:order-1">
            
            {/* Official Mandate Tag */}
            <div className="inline-flex items-center space-x-2 bg-surface-solid/80 border border-border px-3.5 py-1.5 rounded-chip shadow-xs">
              <span className="w-2 h-2 rounded-full bg-lime-600 animate-pulse" />
              <span className="text-xs font-mono font-medium text-ink-500">
                PCR 2011 • Department of Consumer Affairs
              </span>
            </div>

            {/* Main Hero Headline */}
            <div className="space-y-3">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-ink-900 leading-[1.15]">
                Automated statutory compliance for India's packaged commodities
              </h1>

              <p className="text-sm md:text-base text-ink-500 max-w-xl mx-auto lg:mx-0 leading-relaxed font-normal">
                Empowering 1.4 billion consumers and field enforcement officers with instant neural package auditing, dual-MRP tampering detection, and automated Section 36 legal notices.
              </p>
            </div>

            {/* Primary Action Button Cluster */}
            <div className="flex flex-col sm:flex-row items-center lg:items-start justify-center lg:justify-start gap-3 pt-1">
              <Link
                href="/scan"
                className="btn btn--primary w-full sm:w-auto h-10 px-5 shadow-xs"
              >
                <Camera className="w-4 h-4 text-ink-900" />
                <span>Launch citizen scanner</span>
                <ArrowRight className="w-4 h-4 ml-1 text-ink-900" />
              </Link>

              <Link
                href="/inspector"
                className="btn btn--ghost w-full sm:w-auto h-10 px-5 border border-border/60"
              >
                <ShieldAlert className="w-4 h-4 text-ink-900" />
                <span>Inspector squad</span>
              </Link>
            </div>

            {/* Key Trust Signals */}
            <div className="grid grid-cols-2 gap-2.5 max-w-md mx-auto lg:mx-0 text-xs text-ink-500 font-mono">
              <div className="bg-surface-solid/70 p-2.5 rounded-control border border-border flex items-center space-x-2 shadow-xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-tile-mint-fg shrink-0" />
                <span>8 rules audited</span>
              </div>
              <div className="bg-surface-solid/70 p-2.5 rounded-control border border-border flex items-center space-x-2 shadow-xs">
                <Zap className="w-3.5 h-3.5 text-tile-indigo-fg shrink-0" />
                <span>&lt; 1.2s latency</span>
              </div>
              <div className="bg-surface-solid/70 p-2.5 rounded-control border border-border flex items-center space-x-2 shadow-xs">
                <Lock className="w-3.5 h-3.5 text-ink-500 shrink-0" />
                <span>Offline-first PWA</span>
              </div>
              <div className="bg-surface-solid/70 p-2.5 rounded-control border border-border flex items-center space-x-2 shadow-xs">
                <FileText className="w-3.5 h-3.5 text-tile-peach-fg shrink-0" />
                <span>Section 36 notices</span>
              </div>
            </div>
          </div>

          {/* RIGHT: 3D Holographic Hero Showcase */}
          <div className="relative order-1 lg:order-2 flex items-center justify-center w-full">
            <div className="w-full max-w-[480px] relative">
              <Hero3DContainer />
            </div>
          </div>

        </div>
      </section>

      {/* 2. PACKAGING DESIGN & COMPLIANCE SPREAD SHOWCASE */}
      <StackSpread
        scrollLength={250}
        bgColor="#EDEDFB"
        textColor="#1A1A33"
      />

      {/* 3. INTERACTIVE COMPLIANCE SIMULATOR SHOWCASE */}
      <section className="rounded-canvas bg-white/70 backdrop-blur-xl p-6 sm:p-8 md:p-10 border border-border shadow-soft space-y-6">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 text-ink-500 text-xs font-mono font-semibold uppercase tracking-wider mb-1">
              <Sparkles className="w-3.5 h-3.5 text-tile-indigo-fg" />
              <span>Interactive inspection simulator</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-semibold text-ink-900">
              How VidhiScan audits packaging in real time
            </h2>
            <p className="text-xs sm:text-sm text-ink-500 mt-1">
              Select a benchmark commodity below to simulate the AI Legal Metrology diagnostic engine.
            </p>
          </div>

          {/* Step Pill Selectors */}
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1">
            <button
              onClick={() => setActiveDemo("butter")}
              className={`step ${activeDemo === "butter" ? "is-active" : ""}`}
            >
              <span className={`step__num w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center ${activeDemo === "butter" ? "bg-lime-500 text-ink-900" : "bg-tile-neutral-bg text-tile-neutral-fg"}`}>
                1
              </span>
              <span>Amul butter (Pass)</span>
            </button>
            <button
              onClick={() => setActiveDemo("surf")}
              className={`step ${activeDemo === "surf" ? "is-active" : ""}`}
            >
              <span className={`step__num w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center ${activeDemo === "surf" ? "bg-lime-500 text-ink-900" : "bg-tile-neutral-bg text-tile-neutral-fg"}`}>
                2
              </span>
              <span>Surf Excel (Overcharge)</span>
            </button>
            <button
              onClick={() => setActiveDemo("oil")}
              className={`step ${activeDemo === "oil" ? "is-active" : ""}`}
            >
              <span className={`step__num w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center ${activeDemo === "oil" ? "bg-lime-500 text-ink-900" : "bg-tile-neutral-bg text-tile-neutral-fg"}`}>
                3
              </span>
              <span>Fortune oil (Proviso)</span>
            </button>
          </div>
        </div>

        {/* Active Diagnostic Card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch pt-2">
          
          {/* Left: Verdict & Price Registry */}
          <div className="lg:col-span-5 space-y-4 flex flex-col justify-between">
            <div className="p-5 rounded-card bg-surface-solid/90 border border-border shadow-soft space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[11px] font-mono text-ink-500 uppercase">Commodity sample</span>
                  <h3 className="text-base font-semibold text-ink-900 mt-0.5">{currentScenario.name}</h3>
                  <p className="text-xs text-ink-500">{currentScenario.brand}</p>
                </div>
                <span className={`px-2.5 py-0.5 rounded-chip text-xs font-semibold font-mono border ${currentScenario.badgeClass}`}>
                  {currentScenario.status}
                </span>
              </div>

              <div className="space-y-2 pt-2 border-t border-border">
                <div className="flex justify-between text-xs">
                  <span className="text-ink-500">Scanned retail price:</span>
                  <span className="font-mono font-semibold text-ink-900">{currentScenario.mrp}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-ink-500">Central master registry MRP:</span>
                  <span className="font-mono font-semibold text-ink-900">{currentScenario.officialMrp}</span>
                </div>
                {currentScenario.overcharge && (
                  <div className="p-3 rounded-panel bg-tile-peach-bg/70 border border-tile-peach-fg/30 text-xs text-tile-peach-fg font-medium">
                    Section 36(2) illegal markup: overcharged by {currentScenario.overchargeAmount}
                  </div>
                )}
              </div>

              {/* Score Bar */}
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-ink-500">Statutory score</span>
                  <span className="font-semibold text-ink-900">{currentScenario.score}% ({currentScenario.rulesMet} met)</span>
                </div>
                <div className="w-full bg-surface-tint rounded-full h-2 overflow-hidden p-0.5">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      currentScenario.score >= 85
                        ? "bg-lime-500"
                        : currentScenario.score >= 50
                        ? "bg-tile-peach-fg"
                        : "bg-tile-peach-fg"
                    }`}
                    style={{ width: `${currentScenario.score}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="panel space-y-1.5">
              <div className="flex items-center space-x-2 text-ink-900 text-xs font-semibold">
                <ShieldCheck className="w-4 h-4 text-tile-mint-fg" />
                <span>Statutory legal finding</span>
              </div>
              <p className="text-xs text-ink-500 leading-relaxed">
                {currentScenario.description}
              </p>
            </div>

            <Link
              href="/scan"
              className="btn btn--primary w-full justify-center shadow-xs"
            >
              <Camera className="w-4 h-4 text-ink-900" />
              <span>Test with live camera scanner</span>
            </Link>
          </div>

          {/* Right: Declarations Table */}
          <div className="lg:col-span-7 bg-surface-solid/80 rounded-card border border-border p-4 sm:p-5 shadow-soft flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-3 pb-2 border-b border-border">
                <span className="text-xs font-semibold text-ink-900 flex items-center gap-1.5">
                  <Scale className="w-3.5 h-3.5 text-tile-indigo-fg" />
                  <span>8 mandatory declarations checklist (PCR Rule 6)</span>
                </span>
                <span className="text-[11px] text-ink-500 font-mono bg-surface-tint px-2 py-0.5 rounded-chip border border-border">
                  Real-time extraction
                </span>
              </div>

              <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                {currentScenario.declarations.map((decl, idx) => (
                  <div
                    key={idx}
                    className={`p-2.5 rounded-panel border text-xs flex items-start justify-between gap-3 ${
                      decl.pass
                        ? decl.isProviso
                          ? "bg-tile-indigo-bg/30 border-tile-indigo-fg/30"
                          : "bg-surface-solid border-border"
                        : "bg-tile-peach-bg/30 border-tile-peach-fg/30"
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-[10px] font-semibold text-ink-500 bg-surface-tint px-1.5 py-0.5 rounded-chip">
                          {decl.rule}
                        </span>
                        <span className="font-medium text-ink-900">{decl.name}</span>
                      </div>
                      <p className="text-[12px] text-ink-500 font-mono pl-0.5">{decl.value}</p>
                    </div>

                    <span
                      className={`text-[10px] font-semibold font-mono px-2 py-0.5 rounded-full flex items-center gap-1 whitespace-nowrap ${
                        decl.pass
                          ? decl.isProviso
                            ? "bg-tile-indigo-bg text-tile-indigo-fg border border-tile-indigo-fg/30"
                            : "bg-tile-mint-bg text-tile-mint-fg border border-tile-mint-fg/30"
                          : "bg-tile-peach-bg text-tile-peach-fg border border-tile-peach-fg/30"
                      }`}
                    >
                      {decl.pass ? (
                        decl.isProviso ? <Info className="w-3 h-3" /> : <Check className="w-3 h-3" />
                      ) : (
                        <XCircle className="w-3 h-3" />
                      )}
                      <span>{decl.pass ? (decl.isProviso ? "Proviso" : "Pass") : "Fail"}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-[11px] text-ink-500 font-mono">
              <span>FastAPI OCR neural engine v2.4</span>
              <span className="text-ink-900 font-medium">Tamper forensics: active</span>
            </div>
          </div>

        </div>

      </section>

      {/* 3. CORE METRICS COUNTER */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-card border border-border text-center space-y-1 bg-surface-solid/70 shadow-soft">
          <p className="text-3xl sm:text-4xl font-semibold text-ink-900 font-mono">8 / 8</p>
          <p className="text-xs font-semibold text-ink-900">Statutory declarations</p>
          <p className="text-[12px] text-ink-500">Rule 6(1)(a) to 6(1)(h) audited in one scan</p>
        </div>

        <div className="glass-panel p-5 rounded-card border border-border text-center space-y-1 bg-surface-solid/70 shadow-soft">
          <p className="text-3xl sm:text-4xl font-semibold text-ink-900 font-mono">&lt; 1.2s</p>
          <p className="text-xs font-semibold text-ink-900">Verification speed</p>
          <p className="text-[12px] text-ink-500">High-throughput EasyOCR on edge devices</p>
        </div>

        <div className="glass-panel p-5 rounded-card border border-border text-center space-y-1 bg-surface-solid/70 shadow-soft">
          <p className="text-3xl sm:text-4xl font-semibold text-ink-900 font-mono">₹ 25k</p>
          <p className="text-xs font-semibold text-ink-900">First-offence fine</p>
          <p className="text-[12px] text-ink-500">Section 36 legal penalty shield</p>
        </div>

        <div className="glass-panel p-5 rounded-card border border-border text-center space-y-1 bg-surface-solid/70 shadow-soft">
          <p className="text-3xl sm:text-4xl font-semibold text-ink-900 font-mono">100%</p>
          <p className="text-xs font-semibold text-ink-900">Zero cloud dependency</p>
          <p className="text-[12px] text-ink-500">Fully local, private, and offline capable</p>
        </div>
      </section>

      {/* 4. THE 8 MANDATORY DECLARATIONS MATRIX */}
      <section className="space-y-6">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <div className="inline-flex items-center space-x-2 text-ink-500 text-xs font-mono font-semibold uppercase tracking-wider">
            <Scale className="w-3.5 h-3.5 text-tile-indigo-fg" />
            <span>Statutory enforcement scope</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-semibold text-ink-900">
            The 8 mandatory declarations under Rule 6
          </h2>
          <p className="text-xs sm:text-sm text-ink-500">
            Every pre-packaged commodity sold across India must display these 8 statutory items legibly.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {mandatoryRules.map((rule, idx) => {
            const Icon = rule.icon;
            return (
              <div
                key={idx}
                className="card glass-card-hover bg-surface-solid/80 border border-border flex flex-col justify-between space-y-4 shadow-soft"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className={`tile ${rule.tileClass} rounded-[10px]`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="font-mono text-[10px] bg-surface-tint border border-border text-ink-500 font-medium px-2 py-0.5 rounded-chip">
                      {rule.code}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-semibold text-[15px] text-ink-900">{rule.title}</h3>
                    <p className="text-[13px] text-ink-500 mt-1 leading-relaxed">{rule.desc}</p>
                  </div>
                </div>

                <div className="pt-2 border-t border-border">
                  <span className="text-[11px] font-mono text-tile-peach-fg font-medium">
                    Liability: {rule.penalty}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. CUTTING-EDGE AI FORENSICS */}
      <section className="rounded-canvas bg-white/70 backdrop-blur-xl border border-border p-6 sm:p-8 md:p-10 shadow-soft space-y-6">
        <div className="max-w-2xl space-y-2">
          <span className="text-xs font-mono font-semibold text-ink-500 uppercase tracking-wider flex items-center gap-1.5">
            <Cpu className="w-4 h-4 text-tile-indigo-fg" />
            <span>Advanced computer vision forensics</span>
          </span>
          <h2 className="text-2xl sm:text-3xl font-semibold text-ink-900">
            Defeating evasion, fake stickers & tampered dates
          </h2>
          <p className="text-xs sm:text-sm text-ink-500 leading-relaxed">
            Unscrupulous retail practices often bypass manual inspections through sticker overlays and smudged ink. VidhiScan executes specialized computer vision algorithms designed specifically for Legal Metrology enforcement.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="p-5 rounded-card bg-surface-solid border border-border space-y-3 shadow-soft">
            <div className="tile bg-tile-indigo-bg text-tile-indigo-fg rounded-[10px]">
              <Eye className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-ink-900">Dual-MRP overcharge shield</h3>
            <p className="text-xs text-ink-500 leading-relaxed">
              Flags retailer price stickers pasted on top of factory-printed MRP. Extracts both layers and cross-checks the registered statutory maximum from the central FMCG database.
            </p>
            <div className="text-[11px] font-mono text-ink-500 pt-1">
              Enforces Section 36(2)
            </div>
          </div>

          <div className="p-5 rounded-card bg-surface-solid border border-border space-y-3 shadow-soft">
            <div className="tile bg-tile-mint-bg text-tile-mint-fg rounded-[10px]">
              <Scale className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-ink-900">Rule 7 font height ratio analysis</h3>
            <p className="text-xs text-ink-500 leading-relaxed">
              Rule 7 mandates that declaration font heights scale proportionally with package surface area. OpenCV contour bounding boxes compute character dimensions in millimeters.
            </p>
            <div className="text-[11px] font-mono text-ink-500 pt-1">
              Automated font height verification
            </div>
          </div>

          <div className="p-5 rounded-card bg-surface-solid border border-border space-y-3 shadow-soft">
            <div className="tile bg-tile-peach-bg text-tile-peach-fg rounded-[10px]">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-ink-900">Court-ready seizure notices</h3>
            <p className="text-xs text-ink-500 leading-relaxed">
              When a non-compliance is verified, the system compiles high-resolution cropped label evidence, GPS coordinates, and exact legal charges into an official Section 36 PDF notice.
            </p>
            <div className="text-[11px] font-mono text-ink-500 pt-1">
              Python ReportLab PDF generation
            </div>
          </div>
        </div>
      </section>

      {/* 6. TRI-TIER ROLE ECOSYSTEM */}
      <section className="space-y-6">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <span className="text-xs font-mono font-semibold text-ink-500 uppercase tracking-wider">
            Operational architecture
          </span>
          <h2 className="text-2xl sm:text-3xl font-semibold text-ink-900">
            Built for citizens, inspectors & regulators
          </h2>
          <p className="text-xs sm:text-sm text-ink-500">
            A unified national grid bridging grassroots consumer empowerment with rapid field enforcement and high-level regulatory governance.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Consumers */}
          <div className="card bg-surface-solid/85 border border-border space-y-5 flex flex-col justify-between shadow-soft">
            <div className="space-y-4">
              <div className="tile bg-tile-indigo-bg text-tile-indigo-fg rounded-[10px]">
                <Camera className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-semibold text-tile-indigo-fg bg-tile-indigo-bg px-2 py-0.5 rounded-chip">
                  Public portal
                </span>
                <h3 className="text-lg font-semibold text-ink-900 mt-2">For 1.4B consumers</h3>
                <p className="text-xs text-ink-500 mt-1.5 leading-relaxed">
                  Verify packaged items while shopping in supermarkets, corner stores, or transit hubs. Detect price alterations and file verified reports.
                </p>
              </div>
              <ul className="space-y-2 text-xs text-ink-500">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-tile-mint-fg" />
                  <span>No login or app installation needed</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-tile-mint-fg" />
                  <span>Instant unit sale price fairness check</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-tile-mint-fg" />
                  <span>One-click complaint filing with evidence</span>
                </li>
              </ul>
            </div>

            <Link
              href="/scan"
              className="btn btn--ghost w-full justify-center border border-border/60"
            >
              <span>Open citizen scanner</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Inspectors */}
          <div className="card bg-surface-solid border-1.5 border-ink-900 space-y-5 flex flex-col justify-between shadow-soft relative">
            <div className="space-y-4">
              <div className="tile bg-tile-mint-bg text-tile-mint-fg rounded-[10px]">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-semibold text-tile-mint-fg bg-tile-mint-bg px-2 py-0.5 rounded-chip">
                  Field enforcement
                </span>
                <h3 className="text-lg font-semibold text-ink-900 mt-2">For field squads</h3>
                <p className="text-xs text-ink-500 mt-1.5 leading-relaxed">
                  Equips Legal Metrology Officers during surprise raids with automated evidence capture, GPS verification, and instant Section 36 notice dispatch.
                </p>
              </div>
              <ul className="space-y-2 text-xs text-ink-500">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-tile-mint-fg" />
                  <span>Official raid scanning & queue triage</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-tile-mint-fg" />
                  <span>GPS-tagged digital chain of custody</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-tile-mint-fg" />
                  <span>Instant court-ready PDF notice generation</span>
                </li>
              </ul>
            </div>

            <Link
              href="/inspector"
              className="btn btn--primary w-full justify-center shadow-xs"
            >
              <span>Access inspector squad</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Leadership */}
          <div className="card bg-surface-solid/85 border border-border space-y-5 flex flex-col justify-between shadow-soft">
            <div className="space-y-4">
              <div className="tile bg-tile-neutral-bg text-tile-neutral-fg rounded-[10px]">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-semibold text-ink-500 bg-surface-tint px-2 py-0.5 rounded-chip">
                  Command HQ
                </span>
                <h3 className="text-lg font-semibold text-ink-900 mt-2">For central leadership</h3>
                <p className="text-xs text-ink-500 mt-1.5 leading-relaxed">
                  Statewide compliance radar, hotspot maps, repeat violator registries, and direct management of the Central Approved FMCG Master Registry.
                </p>
              </div>
              <ul className="space-y-2 text-xs text-ink-500">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-tile-mint-fg" />
                  <span>Statewide violation heatmaps & trends</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-tile-mint-fg" />
                  <span>Central Master FMCG price registry database</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-tile-mint-fg" />
                  <span>One-click audit report & CSV data export</span>
                </li>
              </ul>
            </div>

            <Link
              href="/admin"
              className="btn btn--ghost w-full justify-center border border-border/60"
            >
              <span>Command headquarters</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* 7. COMPARISON TABLE */}
      <section className="space-y-4">
        <div className="text-center space-y-1">
          <span className="text-xs font-mono font-semibold text-ink-500 uppercase tracking-wider">
            Operational comparison
          </span>
          <h2 className="text-2xl sm:text-3xl font-semibold text-ink-900">
            Manual enforcement vs. VidhiScan AI grid
          </h2>
        </div>

        <div className="rounded-card bg-surface-solid/85 border border-border overflow-hidden shadow-soft">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-surface-tint/80 text-ink-500 font-mono text-[11px] uppercase border-b border-border">
                <tr>
                  <th className="p-4">Inspection dimension</th>
                  <th className="p-4 text-tile-peach-fg">Legacy manual procedure</th>
                  <th className="p-4 text-ink-900 bg-tile-indigo-bg/30 font-semibold">VidhiScan AI grid</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-ink-900">
                <tr>
                  <td className="p-4 font-medium">Inspection time per SKU</td>
                  <td className="p-4 text-ink-500">15 – 25 minutes (Manual ruler & checklist)</td>
                  <td className="p-4 font-semibold text-ink-900 bg-tile-indigo-bg/15">&lt; 1.5 seconds (Neural extraction)</td>
                </tr>
                <tr>
                  <td className="p-4 font-medium">MRP price verification</td>
                  <td className="p-4 text-ink-500">Relies on physical receipts or memory</td>
                  <td className="p-4 font-semibold text-ink-900 bg-tile-indigo-bg/15">Instant cross-check with central database</td>
                </tr>
                <tr>
                  <td className="p-4 font-medium">Evidence chain of custody</td>
                  <td className="p-4 text-ink-500">Handwritten seizure memos prone to dispute</td>
                  <td className="p-4 font-semibold text-ink-900 bg-tile-indigo-bg/15">GPS geotagged photographic digital audit trail</td>
                </tr>
                <tr>
                  <td className="p-4 font-medium">Legal notice issuance</td>
                  <td className="p-4 text-ink-500">3 – 5 days via bureaucratic drafting</td>
                  <td className="p-4 font-semibold text-ink-900 bg-tile-indigo-bg/15">Instant Section 36 PDF notice with 1 click</td>
                </tr>
                <tr>
                  <td className="p-4 font-medium">Market surveillance reach</td>
                  <td className="p-4 text-ink-500">Limited to small fraction of retail outlets</td>
                  <td className="p-4 font-semibold text-ink-900 bg-tile-indigo-bg/15">Crowd-sourced by 1.4B empowered citizens</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 8. FAQS */}
      <section className="space-y-4 max-w-3xl mx-auto">
        <div className="text-center space-y-1">
          <span className="text-xs font-mono font-semibold text-ink-500 uppercase tracking-wider">
            Clear answers
          </span>
          <h2 className="text-2xl sm:text-3xl font-semibold text-ink-900">
            Frequently asked questions
          </h2>
        </div>

        <div className="space-y-2.5">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="rounded-card bg-surface-solid/80 border border-border overflow-hidden shadow-soft transition-all"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full p-4 sm:p-5 text-left flex justify-between items-center gap-4 text-xs sm:text-sm font-semibold text-ink-900 hover:text-ink-900"
                >
                  <span>{faq.q}</span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-ink-900 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-ink-400 shrink-0" />
                  )}
                </button>

                {isOpen && (
                  <div className="px-4 sm:px-5 pb-5 text-xs text-ink-500 leading-relaxed border-t border-border pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 9. BOTTOM CONVERTING CTA BANNER */}
      <section className="rounded-canvas bg-gradient-to-b from-canvas-top via-canvas-mid to-canvas-bottom border border-frame-border p-8 sm:p-12 text-center shadow-soft relative overflow-hidden space-y-5">
        <div className="max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-ink-900 tracking-tight">
            Ready to verify packaging compliance?
          </h2>
          <p className="text-xs sm:text-sm md:text-base text-ink-500">
            Point your smartphone camera at any packaged commodity now to see instant Legal Metrology Rule 6 analysis.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto pt-1">
          <Link
            href="/scan"
            className="btn btn--primary w-full sm:w-auto h-10 px-6 shadow-xs"
          >
            <Camera className="w-4 h-4 text-ink-900" />
            <span>Launch citizen scanner</span>
            <ArrowRight className="w-4 h-4 ml-1 text-ink-900" />
          </Link>

          <Link
            href="/inspector"
            className="btn btn--ghost w-full sm:w-auto h-10 px-5 border border-border/60"
          >
            <ShieldAlert className="w-4 h-4 text-ink-900" />
            <span>Inspector squad</span>
          </Link>
        </div>

        <p className="text-[11px] font-mono text-ink-400 pt-2">
          Legal Metrology (Packaged Commodities) Rules, 2011 • Department of Consumer Affairs
        </p>
      </section>

    </div>
  );
}
