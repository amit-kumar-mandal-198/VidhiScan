"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Scale,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  Award,
  Building2,
  ScanLine,
  LayoutDashboard,
  ArrowRight,
  ExternalLink,
  Download,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  FileText,
  Clock,
  Compass
} from "lucide-react";
import VidhiBadge from "@/components/VidhiBadge";

export default function DemoPage() {
  const [activeSimulation, setActiveSimulation] = useState<string | null>(null);
  const [simulationResult, setSimulationResult] = useState<any | null>(null);
  const [simulating, setSimulating] = useState(false);

  // Trigger interactive test scenarios via API
  const runSimulation = async (scenario: "clean" | "overcharge" | "raid") => {
    setActiveSimulation(scenario);
    setSimulating(true);
    setSimulationResult(null);

    try {
      if (scenario === "clean") {
        // Amul clean scan simulation
        const res = await fetch("/api/enforcement", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            company_id: 1, // Amul
            action_type: "NOTICE",
            officer_id: "MAH-LM-HQ-SQ4",
            officer_notes: "Routine quarterly compliance audit passed with 100% adherence to Rule 6."
          })
        });
        setSimulationResult({
          title: "Clean Inspection Verified: Amul / GCMMF",
          score: 940,
          badge: "Vidhi Ratna (Diamond)",
          delta: "+10 pts",
          type: "success",
          message: "Statutory declarations confirmed. Clean streak extended. Diamond accreditation preserved.",
          link: "/companies"
        });
      } else if (scenario === "overcharge") {
        // Overcharge deduction simulation
        setSimulationResult({
          title: "Section 36(2) Retail Overcharge Detected",
          brand: "Hindustan Unilever Ltd",
          commodity: "Surf Excel 1kg",
          score: 710,
          badge: "Vidhi Mitra (Silver)",
          delta: "-150 pts",
          type: "warning",
          message: "Scanned price ₹519 exceeds legal MRP ₹469 (+₹50 overcharge). Brand VidhiScore degraded from Gold (860) to Silver (710)!",
          link: "/scan"
        });
      } else if (scenario === "raid") {
        // Raid warrant generation against Defaulter
        const res = await fetch("/api/enforcement", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            company_id: 6, // Kalyan Syndicate
            action_type: "RAID_ORDER",
            officer_id: "MAH-LM-FLYING-SQUAD-04",
            officer_notes: "Multiple citizen reports confirmed illegal relabeling & erased expiry dates in Bhiwandi godown. Section 15 seizure ordered."
          })
        });
        const data = await res.json();
        setSimulationResult({
          title: "Section 15 Physical Raid Warrant Authorized",
          target: "Kalyan Relabeling & Counterfeit Syndicate",
          score: 340,
          badge: "Defaulter (Red Flag)",
          delta: "-300 pts (Defaulter Lock)",
          warrantUrl: data.document_url || "/static/reports/sample_warrant.pdf",
          type: "critical",
          message: "VidhiScore < 450. Flying Squad #04 dispatched with statutory entry, inventory seizure, and premises sealing powers.",
          link: "/admin"
        });
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-base pb-24 pt-6">
      <div className="container mx-auto px-4 max-w-5xl space-y-8">

        {/* Hero Banner */}
        <div className="rounded-xl border border-border bg-surface-solid p-6 md:p-8 shadow-xs relative overflow-hidden">
          <div className="space-y-3 relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-tile-indigo-bg text-tile-indigo-fg text-xs font-semibold px-3 py-1 rounded-full font-mono">
              <Sparkles className="w-3.5 h-3.5 text-lime-500" />
              <span>Smart India Hackathon • Judges Demo Showcase</span>
            </div>

            <h1 className="text-2xl md:text-4xl font-bold tracking-tight text-ink-900 leading-tight">
              VidhiScore™ & Brand Badge System: Live Judge Demonstration
            </h1>

            <p className="text-xs md:text-sm text-ink-600 leading-relaxed">
              Experience the end-to-end Legal Metrology enforcement pipeline in <strong>3 minutes</strong>: From manufacturer product registration and citizen AI scanning to real-time score degradation and 1-click Section 15 physical raid dispatch.
            </p>
          </div>
        </div>

        {/* Quick Role Switcher (God Mode) */}
        <div className="space-y-3">
          <h2 className="font-bold text-xs uppercase tracking-wider text-ink-400 font-mono">
            Direct Stakeholder Navigation (1-Click Switch)
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {[
              {
                title: "Citizen Scanner",
                href: "/scan",
                icon: ScanLine,
                role: "Public",
                color: "bg-emerald-50 text-emerald-800 border-emerald-200"
              },
              {
                title: "Brand Trust Grid",
                href: "/companies",
                icon: Award,
                role: "Directory",
                color: "bg-amber-50 text-amber-800 border-amber-200"
              },
              {
                title: "Manufacturer",
                href: "/manufacturer",
                icon: Building2,
                role: "Industry",
                color: "bg-blue-50 text-blue-800 border-blue-200"
              },
              {
                title: "Inspector Squad",
                href: "/inspector",
                icon: ShieldAlert,
                role: "Enforcement",
                color: "bg-orange-50 text-orange-800 border-orange-200"
              },
              {
                title: "Command HQ",
                href: "/admin",
                icon: LayoutDashboard,
                role: "State Admin",
                color: "bg-purple-50 text-purple-800 border-purple-200"
              }
            ].map((card) => {
              const Icon = card.icon;
              return (
                <Link
                  key={card.href}
                  href={card.href}
                  className="p-4 rounded-xl border border-border bg-surface-solid hover:shadow-md transition-all group flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Icon className="w-5 h-5 text-ink-800 group-hover:scale-110 transition-transform" />
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wider border ${card.color}`}>
                        {card.role}
                      </span>
                    </div>
                    <div className="font-bold text-xs text-ink-900">{card.title}</div>
                  </div>

                  <div className="text-[11px] text-ink-400 flex items-center gap-1 group-hover:text-ink-900 transition-colors mt-3">
                    <span>Enter role</span>
                    <ArrowRight className="w-3 h-3" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* 3-Minute Master Judge Demo Flow */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-base text-ink-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-ink-600" />
              <span>Recommended 4-Step Presentation Script for Judges</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Step 1: The Trust Grid */}
            <div className="bg-surface-solid border border-border rounded-xl p-5 shadow-xs space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-ink-500">
                  <span className="w-5 h-5 rounded-full bg-ink-900 text-white flex items-center justify-center text-[10px]">1</span>
                  <span>STEP 1: CORPORATE TRUST & BADGES</span>
                </div>
                <h3 className="font-bold text-sm text-ink-900">Show the 5-Tier Brand Directory</h3>
                <p className="text-xs text-ink-600 leading-relaxed">
                  <em>Pitch line:</em> "Currently, companies treat legal metrology fines as pocket change. VidhiScan creates public accountability through a <strong>0–1000 VidhiScore™</strong>. Top performers earn Diamond and Gold trust badges, which e-commerce platforms like Blinkit and Amazon verify via API."
                </p>
              </div>

              <div className="pt-2 border-t border-border flex items-center justify-between">
                <span className="text-[11px] font-mono text-emerald-700">Amul: 940 (Diamond)</span>
                <Link
                  href="/companies"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-ink-900 hover:text-black"
                >
                  <span>Open Directory</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </div>

            {/* Step 2: Citizen Live Scan */}
            <div className="bg-surface-solid border border-border rounded-xl p-5 shadow-xs space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-ink-500">
                  <span className="w-5 h-5 rounded-full bg-ink-900 text-white flex items-center justify-center text-[10px]">2</span>
                  <span>STEP 2: SCAN & REAL-TIME PENALTY</span>
                </div>
                <h3 className="font-bold text-sm text-ink-900">Catch Retail Overcharging on Camera</h3>
                <p className="text-xs text-ink-600 leading-relaxed">
                  <em>Pitch line:</em> "When a citizen or officer scans a Surf Excel packet sold at ₹519 instead of the legal ₹469 MRP, our AI engine instantly flags the Section 36(2) violation and <strong>deducts -150 points</strong> from the brand's score, demoting its badge."
                </p>
              </div>

              <div className="pt-2 border-t border-border flex items-center justify-between">
                <button
                  onClick={() => runSimulation("overcharge")}
                  disabled={simulating}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-tile-peach-fg text-white text-xs font-semibold hover:opacity-90 transition-all"
                >
                  <Play className="w-3 h-3" />
                  <span>Test Overcharge (-150 pts)</span>
                </button>

                <Link
                  href="/scan"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-ink-900 hover:text-black"
                >
                  <span>Open Scanner</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </div>

            {/* Step 3: Raid Radar */}
            <div className="bg-surface-solid border border-border rounded-xl p-5 shadow-xs space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-ink-500">
                  <span className="w-5 h-5 rounded-full bg-ink-900 text-white flex items-center justify-center text-[10px]">3</span>
                  <span>STEP 3: COMMAND HQ RAID RADAR</span>
                </div>
                <h3 className="font-bold text-sm text-ink-900">Flag Chronic Defaulters</h3>
                <p className="text-xs text-ink-600 leading-relaxed">
                  <em>Pitch line:</em> "Companies that repeatedly violate rules drop below 450 points onto the <strong>Enterprise Raid Radar</strong>. Legal Metrology officers don't waste time on random checks; they target syndicates ready for immediate seizure."
                </p>
              </div>

              <div className="pt-2 border-t border-border flex items-center justify-between">
                <button
                  onClick={() => runSimulation("raid")}
                  disabled={simulating}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition-all"
                >
                  <ShieldAlert className="w-3 h-3" />
                  <span>Execute Raid Warrant (Sec 15)</span>
                </button>

                <Link
                  href="/admin"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-ink-900 hover:text-black"
                >
                  <span>Open Admin HQ</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </div>

            {/* Step 4: Legal Warrant PDF */}
            <div className="bg-surface-solid border border-border rounded-xl p-5 shadow-xs space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-ink-500">
                  <span className="w-5 h-5 rounded-full bg-ink-900 text-white flex items-center justify-center text-[10px]">4</span>
                  <span>STEP 4: INSTANT STATUTORY WARRANT</span>
                </div>
                <h3 className="font-bold text-sm text-ink-900">Official Section 15 Seizure Order</h3>
                <p className="text-xs text-ink-600 leading-relaxed">
                  <em>Pitch line:</em> "With 1-click, the system generates an official Search, Seizure & Raid Warrant complete with officer dispatch directives, GPS coordinates, and legal compounding notices ready for court proceedings."
                </p>
              </div>

              <div className="pt-2 border-t border-border flex items-center justify-between">
                <span className="text-[11px] font-mono text-ink-500">ReportLab PDF Engine</span>
                <Link
                  href="/inspector"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-ink-900 hover:text-black"
                >
                  <span>Inspector Orders</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </div>

          </div>
        </div>

        {/* Live Simulation Output Box */}
        {simulationResult && (
          <div className={`p-6 rounded-xl border space-y-3 shadow-md animate-in fade-in duration-300 ${
            simulationResult.type === "critical"
              ? "bg-red-50 border-red-300"
              : simulationResult.type === "warning"
              ? "bg-orange-50 border-orange-300"
              : "bg-emerald-50 border-emerald-300"
          }`}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                {simulationResult.type === "critical" ? (
                  <ShieldAlert className="w-5 h-5 text-red-600" />
                ) : simulationResult.type === "warning" ? (
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                )}
                <h3 className="font-bold text-sm text-ink-900">{simulationResult.title}</h3>
              </div>

              <VidhiBadge
                score={simulationResult.score}
                tierName={simulationResult.badge}
                size="sm"
              />
            </div>

            <p className="text-xs text-ink-700 leading-relaxed font-mono">
              {simulationResult.message}
            </p>

            <div className="pt-2 flex items-center justify-between border-t border-black/10">
              {simulationResult.delta ? (
                <div className="text-xs font-mono font-bold">
                  Impact: <span className={simulationResult.delta.startsWith("+") ? "text-emerald-700" : "text-red-700"}>
                    {simulationResult.delta}
                  </span>
                </div>
              ) : <div />}

              <div className="flex items-center gap-2">
                {simulationResult.warrantUrl && (
                  <a
                    href={simulationResult.warrantUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-700 shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Generated Warrant PDF</span>
                  </a>
                )}

                <Link
                  href={simulationResult.link}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-ink-900 hover:text-black"
                >
                  <span>Inspect in Module</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
