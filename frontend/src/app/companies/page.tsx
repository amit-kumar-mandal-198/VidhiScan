"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  Filter,
  ShieldCheck,
  Award,
  AlertTriangle,
  ShieldAlert,
  Sparkles,
  Building2,
  CheckCircle2,
  X,
  ExternalLink,
  Copy,
  Check,
  ArrowRight,
  TrendingUp,
  Package,
  Layers,
  History,
  FileText,
  BadgeAlert
} from "lucide-react";
import VidhiBadge, { getBadgeConfig } from "@/components/VidhiBadge";

interface CompanyItem {
  id: number;
  name: string;
  brand_slug: string;
  gstin?: string;
  cin?: string;
  contact_email?: string;
  contact_phone?: string;
  address?: string;
  category: string;
  current_vidhiscore: number;
  tier?: {
    id: number;
    tier_name: string;
    badge_code: string;
    min_score: number;
    max_score: number;
    badge_color: string;
    icon_name: string;
    description?: string;
    privileges?: string;
  } | null;
  is_blacklisted: boolean;
  active_violations_count: number;
  total_scans_count: number;
  clean_scans_streak: number;
  products_count: number;
}

export default function CompaniesDirectoryPage() {
  const [companies, setCompanies] = useState<CompanyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTier, setSelectedTier] = useState<string>("all");
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);
  const [companyDossier, setCompanyDossier] = useState<any | null>(null);
  const [loadingDossier, setLoadingDossier] = useState(false);
  const [copiedEmbed, setCopiedEmbed] = useState(false);

  // Fetch Companies List
  const fetchCompanies = () => {
    setLoading(true);
    fetch("/api/companies", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setCompanies(data);
        } else {
          // Fallback static companies
          setCompanies([
            {
              id: 1,
              name: "Amul / GCMMF",
              brand_slug: "amul",
              gstin: "24AAAAA0000A1Z5",
              category: "Dairy & Edible Oils",
              current_vidhiscore: 940,
              tier: { id: 1, tier_name: "Vidhi Ratna (Diamond)", badge_code: "diamond", min_score: 900, max_score: 1000, badge_color: "#10B981", icon_name: "Diamond" },
              is_blacklisted: false,
              active_violations_count: 0,
              total_scans_count: 184,
              clean_scans_streak: 42,
              products_count: 18
            },
            {
              id: 2,
              name: "Hindustan Unilever Ltd",
              brand_slug: "hul",
              gstin: "27AAACH1770F1ZI",
              category: "Household & Detergents",
              current_vidhiscore: 860,
              tier: { id: 2, tier_name: "Vidhi Shrestha (Gold)", badge_code: "gold", min_score: 750, max_score: 899, badge_color: "#F59E0B", icon_name: "Award" },
              is_blacklisted: false,
              active_violations_count: 1,
              total_scans_count: 210,
              clean_scans_streak: 14,
              products_count: 32
            },
            {
              id: 3,
              name: "Nestle India Limited",
              brand_slug: "nestle",
              gstin: "06AAACN0149G1Z7",
              category: "Packaged Snacks & Confectionery",
              current_vidhiscore: 790,
              tier: { id: 2, tier_name: "Vidhi Shrestha (Gold)", badge_code: "gold", min_score: 750, max_score: 899, badge_color: "#F59E0B", icon_name: "Award" },
              is_blacklisted: false,
              active_violations_count: 2,
              total_scans_count: 165,
              clean_scans_streak: 6,
              products_count: 24
            },
            {
              id: 4,
              name: "Fortune / Adani Wilmar",
              brand_slug: "adani-wilmar",
              gstin: "24AAACA5912K1Z9",
              category: "Dairy & Edible Oils",
              current_vidhiscore: 680,
              tier: { id: 3, tier_name: "Vidhi Mitra (Silver)", badge_code: "silver", min_score: 600, max_score: 749, badge_color: "#64748B", icon_name: "ShieldCheck" },
              is_blacklisted: false,
              active_violations_count: 4,
              total_scans_count: 120,
              clean_scans_streak: 3,
              products_count: 14
            },
            {
              id: 5,
              name: "Metro Cash & Carry Wholesale Repackers",
              brand_slug: "metro-repack",
              gstin: "29AAACM6942D1Z3",
              category: "Bulk Commodity Repackaging",
              current_vidhiscore: 520,
              tier: { id: 4, tier_name: "Vidhi Chetna (Bronze Watchlist)", badge_code: "bronze", min_score: 450, max_score: 599, badge_color: "#EA580C", icon_name: "AlertTriangle" },
              is_blacklisted: false,
              active_violations_count: 7,
              total_scans_count: 89,
              clean_scans_streak: 0,
              products_count: 9
            },
            {
              id: 6,
              name: "Kalyan Relabeling & Counterfeit Syndicate",
              brand_slug: "kalyan-syndicate",
              gstin: "27AABCK9999P1Z1",
              category: "Packaged Snacks & Confectionery",
              current_vidhiscore: 340,
              tier: { id: 5, tier_name: "Defaulter (Red Flag)", badge_code: "defaulter", min_score: 0, max_score: 449, badge_color: "#EF4444", icon_name: "ShieldAlert" },
              is_blacklisted: true,
              active_violations_count: 15,
              total_scans_count: 44,
              clean_scans_streak: 0,
              products_count: 4
            }
          ]);
        }
      })
      .catch((err) => {
        console.error("Error fetching companies:", err);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  // Fetch full dossier when modal opened
  const openCompanyDossier = (companyId: number) => {
    setSelectedCompanyId(companyId);
    setLoadingDossier(true);
    setCompanyDossier(null);

    fetch(`/api/companies/${companyId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setCompanyDossier(data);
        } else {
          const comp = companies.find((c) => c.id === companyId);
          if (comp) {
            setCompanyDossier({
              company: comp,
              products: [
                { id: 101, product_name: "Standard Packaged SKU 01", barcode: "8901234567890", official_mrp: 99.0, net_weight: "500g", category: comp.category },
                { id: 102, product_name: "Standard Packaged SKU 02", barcode: "8909876543210", official_mrp: 149.0, net_weight: "1kg", category: comp.category }
              ],
              score_history: [
                { id: 1, previous_score: 750, new_score: comp.current_vidhiscore, points_delta: comp.current_vidhiscore - 750, reason: "Statutory baseline compliance calibration.", created_at: "Recent" }
              ],
              enforcement_actions: []
            });
          }
        }
      })
      .catch((e) => console.error("Error fetching dossier:", e))
      .finally(() => setLoadingDossier(false));
  };

  // Filtered companies
  const filteredCompanies = useMemo(() => {
    return companies.filter((c) => {
      const matchesSearch =
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.brand_slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.gstin && c.gstin.toLowerCase().includes(searchQuery.toLowerCase())) ||
        c.category.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesTier =
        selectedTier === "all" ||
        (selectedTier === "diamond" && c.current_vidhiscore >= 900) ||
        (selectedTier === "gold" && c.current_vidhiscore >= 750 && c.current_vidhiscore < 900) ||
        (selectedTier === "silver" && c.current_vidhiscore >= 600 && c.current_vidhiscore < 750) ||
        (selectedTier === "bronze" && c.current_vidhiscore >= 450 && c.current_vidhiscore < 600) ||
        (selectedTier === "defaulter" && c.current_vidhiscore < 450);

      return matchesSearch && matchesTier;
    });
  }, [companies, searchQuery, selectedTier]);

  // Statistics
  const stats = useMemo(() => {
    const total = companies.length;
    const accredited = companies.filter((c) => c.current_vidhiscore >= 750).length;
    const watchlist = companies.filter((c) => c.current_vidhiscore >= 450 && c.current_vidhiscore < 600).length;
    const defaulters = companies.filter((c) => c.current_vidhiscore < 450 || c.is_blacklisted).length;
    return { total, accredited, watchlist, defaulters };
  }, [companies]);

  const copyEmbedCode = (companyName: string, score: number, tierName: string) => {
    const code = `<div class="vidhiscan-trust-badge" data-brand="${companyName}" data-score="${score}" data-tier="${tierName}">
  <!-- VidhiScan Certified Legal Metrology Compliance Badge -->
  <a href="https://vidhiscan.gov.in/companies" target="_blank" rel="noopener">
    <img src="https://img.shields.io/badge/VidhiScore™-${score}%2F1000-${score >= 750 ? 'brightgreen' : score >= 600 ? 'blue' : 'red'}?style=for-the-badge&logo=shield" alt="VidhiScan Certified ${companyName}" />
  </a>
</div>`;
    navigator.clipboard.writeText(code);
    setCopiedEmbed(true);
    setTimeout(() => setCopiedEmbed(false), 2500);
  };

  return (
    <div className="min-h-screen bg-surface-base pb-24 pt-6">
      <div className="container mx-auto px-4 max-w-6xl space-y-6">

        {/* Header Hero Banner */}
        <div className="bg-surface-solid border border-border rounded-xl p-6 md:p-8 shadow-xs relative overflow-hidden">
          <div className="absolute right-0 top-0 w-96 h-full bg-gradient-to-l from-tile-indigo-bg/30 to-transparent pointer-events-none" />
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 bg-tile-indigo-bg text-tile-indigo-fg px-2.5 py-1 rounded-full text-xs font-semibold font-mono">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>PCR 2011 • Brand Trust & Compliance Index</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-ink-900">
                National VidhiScore™ & Brand Accreditation Grid
              </h1>
              <p className="text-sm text-ink-500 max-w-2xl leading-relaxed">
                Public verification directory tracking manufacturer compliance under the Legal Metrology Act, 2009.
                Transparent grading across 5 national tiers: Diamond, Gold, Silver, Bronze, and Defaulter Watchlist.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Link
                href="/manufacturer"
                className="inline-flex items-center gap-2 bg-ink-900 hover:bg-black text-white px-4 py-2.5 rounded-lg text-xs font-semibold shadow-xs transition-all active:scale-[0.98]"
              >
                <Building2 className="w-4 h-4 text-lime-400" />
                <span>Manufacturer portal</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Top KPI Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-border">
            <div className="bg-surface-base p-3.5 rounded-lg border border-border">
              <div className="text-[11px] text-ink-500 font-medium">Monitored Brands</div>
              <div className="text-2xl font-bold font-mono text-ink-900 mt-0.5">{stats.total}</div>
              <div className="text-[10px] text-ink-400 mt-0.5">Active in Master Registry</div>
            </div>

            <div className="bg-emerald-50/70 p-3.5 rounded-lg border border-emerald-200">
              <div className="text-[11px] text-emerald-800 font-medium flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-600" />
                <span>Diamond / Gold</span>
              </div>
              <div className="text-2xl font-bold font-mono text-emerald-900 mt-0.5">{stats.accredited}</div>
              <div className="text-[10px] text-emerald-700 mt-0.5">Score ≥ 750 • Green Channel</div>
            </div>

            <div className="bg-orange-50/70 p-3.5 rounded-lg border border-orange-200">
              <div className="text-[11px] text-orange-800 font-medium flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-orange-600" />
                <span>Bronze Watchlist</span>
              </div>
              <div className="text-2xl font-bold font-mono text-orange-900 mt-0.5">{stats.watchlist}</div>
              <div className="text-[10px] text-orange-700 mt-0.5">Score 450-599 • Notice Sent</div>
            </div>

            <div className="bg-red-50/70 p-3.5 rounded-lg border border-red-200">
              <div className="text-[11px] text-red-800 font-medium flex items-center gap-1">
                <ShieldAlert className="w-3 h-3 text-red-600" />
                <span>Defaulters / Raid</span>
              </div>
              <div className="text-2xl font-bold font-mono text-red-900 mt-0.5">{stats.defaulters}</div>
              <div className="text-[10px] text-red-700 mt-0.5">Score &lt; 450 • Seizure Priority</div>
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-surface-solid border border-border rounded-xl p-4 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            {/* Search Input */}
            <div className="relative w-full sm:w-96">
              <Search className="w-4 h-4 text-ink-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search brand, company name, GSTIN..."
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-border bg-surface-base text-xs text-ink-900 placeholder:text-ink-400 focus:outline-hidden focus:ring-1 focus:ring-ink-900"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-900"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Tier Filters */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
              {[
                { id: "all", label: "All Tiers" },
                { id: "diamond", label: "💎 Diamond", color: "text-emerald-700" },
                { id: "gold", label: "🥇 Gold", color: "text-amber-700" },
                { id: "silver", label: "🥈 Silver", color: "text-slate-700" },
                { id: "bronze", label: "🥉 Bronze", color: "text-orange-700" },
                { id: "defaulter", label: "🚨 Defaulters", color: "text-red-700" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedTier(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    selectedTier === tab.id
                      ? "bg-ink-900 text-white shadow-2xs"
                      : "bg-surface-base text-ink-600 hover:bg-surface-tint border border-border"
                  }`}
                >
                  <span className={selectedTier !== tab.id ? tab.color : ""}>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Brand Grid */}
        {loading ? (
          <div className="text-center py-20 bg-surface-solid border border-border rounded-xl">
            <div className="w-8 h-8 border-2 border-ink-900 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-ink-500 font-mono">Querying Central Legal Metrology Trust Ledger...</p>
          </div>
        ) : filteredCompanies.length === 0 ? (
          <div className="text-center py-20 bg-surface-solid border border-border rounded-xl">
            <Building2 className="w-10 h-10 text-ink-300 mx-auto mb-2" />
            <h3 className="font-bold text-sm text-ink-900">No brand matching your criteria</h3>
            <p className="text-xs text-ink-500 mt-1">Try clearing your search query or selecting "All Tiers".</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCompanies.map((comp) => {
              const cfg = getBadgeConfig(comp.current_vidhiscore, comp.tier?.badge_code, comp.tier?.tier_name);
              const progressPct = Math.min(100, Math.max(5, (comp.current_vidhiscore / 1000) * 100));

              return (
                <div
                  key={comp.id}
                  className={`bg-surface-solid border rounded-xl p-5 shadow-xs transition-all hover:shadow-md flex flex-col justify-between ${
                    comp.is_blacklisted || comp.current_vidhiscore < 450
                      ? "border-red-300 bg-red-50/30"
                      : "border-border"
                  }`}
                >
                  <div className="space-y-4">
                    {/* Card Top: Brand info + Badge */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-bold text-base text-ink-900 tracking-tight leading-snug">
                            {comp.name}
                          </h3>
                        </div>
                        <p className="text-xs text-ink-500 mt-0.5">{comp.category}</p>
                        {comp.gstin && (
                          <div className="text-[10px] font-mono text-ink-400 mt-1">
                            GSTIN: {comp.gstin}
                          </div>
                        )}
                      </div>

                      <VidhiBadge
                        score={comp.current_vidhiscore}
                        badgeCode={comp.tier?.badge_code}
                        tierName={comp.tier?.tier_name}
                        size="sm"
                        isBlacklisted={comp.is_blacklisted}
                      />
                    </div>

                    {/* Score Bar & Numeric Metric */}
                    <div className="space-y-1.5 bg-surface-base/80 p-3 rounded-lg border border-border/80">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-ink-500 font-medium">VidhiScore™ Index</span>
                        <div className="flex items-center gap-1">
                          <span className="font-mono font-bold text-sm text-ink-900">
                            {comp.current_vidhiscore}
                          </span>
                          <span className="text-[10px] text-ink-400 font-mono">/ 1000</span>
                        </div>
                      </div>

                      <div className="w-full h-2 rounded-full bg-border overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${progressPct}%`,
                            backgroundColor: cfg.color
                          }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-ink-500 pt-0.5 font-mono">
                        <span>0 (Defaulter)</span>
                        <span className="font-bold">{cfg.label}</span>
                        <span>1000 (Ratna)</span>
                      </div>
                    </div>

                    {/* Key Metrics Pill Grid */}
                    <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
                      <div className="p-2 rounded-md bg-surface-base border border-border">
                        <div className="text-[10px] text-ink-400">Products</div>
                        <div className="font-mono font-semibold text-ink-800">{comp.products_count} SKUs</div>
                      </div>

                      <div className="p-2 rounded-md bg-surface-base border border-border">
                        <div className="text-[10px] text-ink-400">Audits</div>
                        <div className="font-mono font-semibold text-ink-800">{comp.total_scans_count}</div>
                      </div>

                      <div className={`p-2 rounded-md border ${
                        comp.active_violations_count > 0
                          ? "bg-red-50 border-red-200 text-red-900"
                          : "bg-emerald-50 border-emerald-200 text-emerald-900"
                      }`}>
                        <div className="text-[10px] opacity-75">Violations</div>
                        <div className="font-mono font-semibold">
                          {comp.active_violations_count} active
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom CTA */}
                  <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                    <button
                      onClick={() => openCompanyDossier(comp.id)}
                      className="text-xs font-semibold text-ink-900 hover:text-black flex items-center gap-1.5 transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5 text-ink-500" />
                      <span>Inspect Dossier</span>
                    </button>

                    <button
                      onClick={() => openCompanyDossier(comp.id)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-ink-900 text-white text-[11px] font-semibold hover:bg-black transition-all"
                    >
                      <span>Verification seal</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* Company Dossier & Verification Modal */}
      {selectedCompanyId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface-solid border border-border rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-border flex items-center justify-between sticky top-0 bg-surface-solid z-10">
              <div className="flex items-center gap-2.5">
                <Building2 className="w-5 h-5 text-ink-900" />
                <div>
                  <h3 className="font-bold text-base text-ink-900">
                    {companyDossier?.company?.name || "Corporate Compliance Dossier"}
                  </h3>
                  <p className="text-xs text-ink-500">Legal Metrology Central Registry Verification Record</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCompanyId(null)}
                className="w-8 h-8 rounded-lg hover:bg-surface-base flex items-center justify-center text-ink-500 hover:text-ink-900 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {loadingDossier ? (
                <div className="text-center py-12">
                  <div className="w-7 h-7 border-2 border-ink-900 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-xs text-ink-500 font-mono">Loading full company telemetry & ledger...</p>
                </div>
              ) : companyDossier ? (
                <>
                  {/* Large Badge Preview */}
                  <VidhiBadge
                    score={companyDossier.company.current_vidhiscore}
                    badgeCode={companyDossier.company.tier?.badge_code}
                    tierName={companyDossier.company.tier?.tier_name}
                    size="lg"
                    isBlacklisted={companyDossier.company.is_blacklisted}
                  />

                  {/* Company Details Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs bg-surface-base p-4 rounded-xl border border-border font-mono">
                    <div>
                      <span className="text-ink-400 block text-[10px]">GSTIN</span>
                      <span className="font-semibold text-ink-900">{companyDossier.company.gstin || "Unlisted"}</span>
                    </div>
                    <div>
                      <span className="text-ink-400 block text-[10px]">Category</span>
                      <span className="font-semibold text-ink-900">{companyDossier.company.category}</span>
                    </div>
                    <div>
                      <span className="text-ink-400 block text-[10px]">Clean Audit Streak</span>
                      <span className="font-semibold text-emerald-700">{companyDossier.company.clean_scans_streak || 0} inspections</span>
                    </div>
                    <div>
                      <span className="text-ink-400 block text-[10px]">Total Scans Count</span>
                      <span className="font-semibold text-ink-900">{companyDossier.company.total_scans_count || 0}</span>
                    </div>
                    <div>
                      <span className="text-ink-400 block text-[10px]">Active Violations</span>
                      <span className={`font-semibold ${companyDossier.company.active_violations_count > 0 ? "text-red-600" : "text-emerald-700"}`}>
                        {companyDossier.company.active_violations_count || 0}
                      </span>
                    </div>
                    <div>
                      <span className="text-ink-400 block text-[10px]">Compliance State</span>
                      <span className="font-semibold text-ink-900">
                        {companyDossier.company.is_blacklisted ? "DEFALUTER / BLACKLISTED" : "AUTHORIZED COMPLIANT"}
                      </span>
                    </div>
                  </div>

                  {/* Embeddable Badge Code for E-Commerce */}
                  <div className="space-y-2 border border-border rounded-xl p-4 bg-surface-base">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-emerald-600" />
                        <h4 className="font-bold text-xs text-ink-900">E-Commerce Trust Badge Embed</h4>
                      </div>
                      <button
                        onClick={() =>
                          copyEmbedCode(
                            companyDossier.company.name,
                            companyDossier.company.current_vidhiscore,
                            companyDossier.company.tier?.tier_name || "Silver"
                          )
                        }
                        className="inline-flex items-center gap-1 text-[11px] font-semibold bg-white border border-border px-2.5 py-1 rounded-md hover:bg-surface-tint transition-all"
                      >
                        {copiedEmbed ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-600">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 text-ink-600" />
                            <span>Copy embed tag</span>
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-[11px] text-ink-500">
                      Embed this dynamic badge onto Amazon, Blinkit, Zepto, or your brand packaging to certify your official Legal Metrology compliance rating.
                    </p>
                  </div>

                  {/* Registered SKUs / Commodities */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-xs text-ink-900 flex items-center gap-1.5">
                        <Package className="w-4 h-4 text-ink-500" />
                        <span>Registered Commodities ({companyDossier.products?.length || 0})</span>
                      </h4>
                    </div>

                    <div className="max-h-44 overflow-y-auto border border-border rounded-lg divide-y divide-border text-xs">
                      {companyDossier.products?.length > 0 ? (
                        companyDossier.products.map((p: any) => (
                          <div key={p.id} className="p-2.5 flex items-center justify-between hover:bg-surface-base">
                            <div>
                              <div className="font-medium text-ink-900">{p.product_name}</div>
                              <div className="text-[10px] text-ink-400 font-mono">Barcode: {p.barcode || "N/A"}</div>
                            </div>
                            <div className="text-right font-mono">
                              <div className="font-bold text-ink-900">₹{p.official_mrp}</div>
                              <div className="text-[10px] text-ink-400">{p.net_weight}</div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 text-center text-xs text-ink-400">No commodities registered under this entity yet.</div>
                      )}
                    </div>
                  </div>

                  {/* Score History Audit Trail */}
                  <div className="space-y-2">
                    <h4 className="font-bold text-xs text-ink-900 flex items-center gap-1.5">
                      <History className="w-4 h-4 text-ink-500" />
                      <span>VidhiScore™ Audit History Timeline</span>
                    </h4>

                    <div className="max-h-44 overflow-y-auto border border-border rounded-lg divide-y divide-border text-xs">
                      {companyDossier.score_history?.length > 0 ? (
                        companyDossier.score_history.map((h: any) => (
                          <div key={h.id} className="p-2.5 flex items-center justify-between">
                            <div className="space-y-0.5 pr-3">
                              <div className="text-ink-800 font-medium text-[11px]">{h.reason}</div>
                              <div className="text-[10px] text-ink-400 font-mono">{h.created_at}</div>
                            </div>
                            <div className="shrink-0 text-right font-mono font-bold">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[11px] ${
                                  h.points_delta > 0
                                    ? "bg-emerald-100 text-emerald-800"
                                    : h.points_delta < 0
                                    ? "bg-red-100 text-red-800"
                                    : "bg-slate-100 text-slate-700"
                                }`}
                              >
                                {h.points_delta > 0 ? `+${h.points_delta}` : h.points_delta} pts
                              </span>
                              <div className="text-[10px] text-ink-500 mt-1 font-normal">Score: {h.new_score}</div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 text-center text-xs text-ink-400">No score revisions recorded yet.</div>
                      )}
                    </div>
                  </div>
                </>
              ) : null}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-border bg-surface-base flex items-center justify-end">
              <button
                onClick={() => setSelectedCompanyId(null)}
                className="px-4 py-2 rounded-lg bg-ink-900 text-white text-xs font-semibold hover:bg-black transition-colors"
              >
                Close Dossier
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
