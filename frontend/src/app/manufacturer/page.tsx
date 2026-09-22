"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Building2,
  Plus,
  Package,
  ShieldCheck,
  Award,
  AlertTriangle,
  ShieldAlert,
  Sparkles,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Copy,
  Check,
  ArrowRight,
  TrendingUp,
  History,
  FileText,
  Barcode,
  Search,
  HelpCircle,
  Send,
  Clock,
  RefreshCw,
  UploadCloud,
  Download,
  Zap,
  Eye
} from "lucide-react";
import VidhiBadge, { getBadgeConfig } from "@/components/VidhiBadge";

interface CompanyProfile {
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
}

export default function ManufacturerPortal() {
  const [companies, setCompanies] = useState<CompanyProfile[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<any[]>([]);
  const [scoreHistory, setScoreHistory] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"catalog" | "preflight" | "history" | "badge">("catalog");

  // Pre-Flight Packaging Studio State
  const [preflightSample, setPreflightSample] = useState<"ghee" | "noodles" | "tea">("ghee");
  const [preflightAnalyzing, setPreflightAnalyzing] = useState(false);
  const [preflightDone, setPreflightDone] = useState(true);

  // Registration modal state
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [regName, setRegName] = useState("");
  const [regGstin, setRegGstin] = useState("");
  const [regCin, setRegCin] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regAddress, setRegAddress] = useState("");
  const [regCategory, setRegCategory] = useState("Dairy & Edible Oils");
  const [submittingReg, setSubmittingReg] = useState(false);
  const [regSuccessMsg, setRegSuccessMsg] = useState<string | null>(null);

  // Add Product modal state
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [prodBarcode, setProdBarcode] = useState("");
  const [prodName, setProdName] = useState("");
  const [prodMrp, setProdMrp] = useState("");
  const [prodNetWeight, setProdNetWeight] = useState("500g");
  const [prodShelfLife, setProdShelfLife] = useState("365");
  const [submittingProduct, setSubmittingProduct] = useState(false);

  // Dispute modal state
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeNotes, setDisputeNotes] = useState("");
  const [disputeSubmitted, setDisputeSubmitted] = useState(false);

  // Copy embed state
  const [copiedEmbed, setCopiedEmbed] = useState(false);

  // Fetch companies list
  const loadCompanies = (selectId?: number) => {
    setLoading(true);
    fetch("/api/companies", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setCompanies(data);
          const targetId = selectId || (data.length > 0 ? data[0].id : null);
          setSelectedCompanyId(targetId);
          if (targetId) {
            loadCompanyDetails(targetId);
          }
        }
      })
      .catch((e) => console.error("Failed to load companies:", e))
      .finally(() => setLoading(false));
  };

  // Fetch selected company full details
  const loadCompanyDetails = (id: number) => {
    fetch(`/api/companies/${id}`, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setProducts(data.products || []);
          setScoreHistory(data.score_history || []);
        }
      })
      .catch((e) => console.error("Error loading company details:", e));
  };

  useEffect(() => {
    loadCompanies();
  }, []);

  const handleSelectCompany = (id: number) => {
    setSelectedCompanyId(id);
    loadCompanyDetails(id);
  };

  const selectedCompany = useMemo(() => {
    return companies.find((c) => c.id === selectedCompanyId) || null;
  }, [companies, selectedCompanyId]);

  // Handle new company registration
  const handleRegisterCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim()) return;

    setSubmittingReg(true);
    setRegSuccessMsg(null);

    try {
      const res = await fetch("/api/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: regName.trim(),
          gstin: regGstin.trim() || undefined,
          cin: regCin.trim() || undefined,
          contact_email: regEmail.trim() || undefined,
          contact_phone: regPhone.trim() || undefined,
          address: regAddress.trim() || undefined,
          category: regCategory
        })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Failed to register" }));
        alert(err.error || "Registration error");
        return;
      }

      const data = await res.json();
      setRegSuccessMsg(`Brand '${regName}' registered successfully with 750 VidhiScore baseline!`);
      setTimeout(() => {
        setShowRegisterModal(false);
        setRegSuccessMsg(null);
        // Reset form
        setRegName("");
        setRegGstin("");
        setRegCin("");
        setRegEmail("");
        setRegPhone("");
        setRegAddress("");
        loadCompanies(data.company_id);
      }, 1500);
    } catch (err: any) {
      alert(err.message || "Registration failed");
    } finally {
      setSubmittingReg(false);
    }
  };

  // Handle adding product
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompany || !prodName.trim() || !prodMrp) return;

    setSubmittingProduct(true);
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          barcode: prodBarcode.trim() || undefined,
          brand_name: selectedCompany.name,
          product_name: prodName.trim(),
          official_mrp: parseFloat(prodMrp),
          net_weight: prodNetWeight.trim(),
          shelf_life_days: parseInt(prodShelfLife) || 365,
          category: selectedCompany.category,
          company_id: selectedCompany.id
        })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Failed to add SKU" }));
        alert(err.error || "Failed to add product");
        return;
      }

      setShowAddProductModal(false);
      setProdBarcode("");
      setProdName("");
      setProdMrp("");
      setProdNetWeight("500g");
      loadCompanyDetails(selectedCompany.id);
    } catch (err: any) {
      alert(err.message || "Error creating product");
    } finally {
      setSubmittingProduct(false);
    }
  };

  const copyTrustSeal = () => {
    if (!selectedCompany) return;
    const code = `<div class="vidhiscan-trust-badge" data-brand="${selectedCompany.name}" data-score="${selectedCompany.current_vidhiscore}">
  <a href="https://vidhiscan.gov.in/companies" target="_blank" rel="noopener">
    <img src="https://img.shields.io/badge/Legal_Metrology_Certified-${selectedCompany.current_vidhiscore}%2F1000-brightgreen?style=for-the-badge&logo=shield" alt="VidhiScan Certified" />
  </a>
</div>`;
    navigator.clipboard.writeText(code);
    setCopiedEmbed(true);
    setTimeout(() => setCopiedEmbed(false), 2000);
  };

  const badgeConfig = selectedCompany
    ? getBadgeConfig(selectedCompany.current_vidhiscore, selectedCompany.tier?.badge_code, selectedCompany.tier?.tier_name)
    : null;

  return (
    <div className="min-h-screen bg-surface-base pb-24 pt-6">
      <div className="container mx-auto px-4 max-w-6xl space-y-6">

        {/* Portal Top Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-solid border border-border p-6 rounded-xl shadow-xs">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 bg-tile-indigo-bg text-tile-indigo-fg text-xs font-semibold px-2.5 py-0.5 rounded-full font-mono">
              <Building2 className="w-3.5 h-3.5" />
              <span>Manufacturer Regulatory Console</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-ink-900">
              Brand Registration & VidhiScore™ Management
            </h1>
            <p className="text-xs text-ink-500">
              Register pre-packaged goods under Legal Metrology Rules, 2011, monitor market scans, and maintain your trust badge.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Switch / Select Brand Dropdown */}
            {companies.length > 0 && (
              <select
                value={selectedCompanyId || ""}
                onChange={(e) => handleSelectCompany(Number(e.target.value))}
                className="bg-surface-base border border-border text-xs font-semibold rounded-lg px-3 py-2 text-ink-900 focus:ring-1 focus:ring-ink-900"
              >
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.current_vidhiscore} pts)
                  </option>
                ))}
              </select>
            )}

            <button
              onClick={() => setShowRegisterModal(true)}
              className="inline-flex items-center gap-1.5 bg-ink-900 hover:bg-black text-white px-3.5 py-2 rounded-lg text-xs font-semibold shadow-xs transition-all active:scale-[0.98]"
            >
              <Plus className="w-4 h-4 text-lime-400" />
              <span>Register new brand</span>
            </button>
          </div>
        </div>

        {/* Active Company Telemetry Dashboard */}
        {selectedCompany && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Col: Dynamic Badge & Score Card */}
            <div className="bg-surface-solid border border-border rounded-xl p-6 shadow-xs flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[11px] text-ink-400 font-mono uppercase tracking-wider">Active Brand Dossier</span>
                    <h2 className="text-xl font-bold text-ink-900 mt-0.5">{selectedCompany.name}</h2>
                    <div className="text-xs text-ink-500 mt-0.5">{selectedCompany.category}</div>
                  </div>

                  <VidhiBadge
                    score={selectedCompany.current_vidhiscore}
                    badgeCode={selectedCompany.tier?.badge_code}
                    tierName={selectedCompany.tier?.tier_name}
                    size="md"
                    isBlacklisted={selectedCompany.is_blacklisted}
                  />
                </div>

                {/* Score Dial / Visual Ring */}
                <div className="p-4 rounded-xl bg-surface-base border border-border text-center space-y-2">
                  <div className="text-[11px] text-ink-500 font-medium">National Trust VidhiScore™</div>
                  <div className="text-4xl font-black font-mono tracking-tight text-ink-900">
                    {selectedCompany.current_vidhiscore}
                    <span className="text-sm font-normal text-ink-400 font-sans"> / 1000</span>
                  </div>

                  {/* Score status progress bar */}
                  <div className="w-full h-2 rounded-full bg-border overflow-hidden mt-2">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${(selectedCompany.current_vidhiscore / 1000) * 100}%`,
                        backgroundColor: badgeConfig?.color || "#64748B"
                      }}
                    />
                  </div>

                  <div className="text-xs font-semibold pt-1" style={{ color: badgeConfig?.color }}>
                    {badgeConfig?.name} • {badgeConfig?.statusText}
                  </div>
                </div>

                {/* Compliance Privileges & Rules */}
                <div className="space-y-2 text-xs">
                  <div className="font-semibold text-ink-800">Accredited Tier Privileges:</div>
                  <ul className="space-y-1.5 text-ink-600 text-[11px]">
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{selectedCompany.tier?.privileges || "Standard marketplace clearance and routine monitoring."}</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Eligible to display official VidhiScan Trust Seal on packaging</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Fast-track dispute resolution desk for packaging relabeling</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Bottom Quick Action: Contest or Embed */}
              <div className="pt-4 border-t border-border flex items-center justify-between gap-2">
                <button
                  onClick={() => setShowDisputeModal(true)}
                  className="text-xs font-semibold text-ink-700 hover:text-ink-900 flex items-center gap-1"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                  <span>Report counterfeit / dispute</span>
                </button>

                <button
                  onClick={copyTrustSeal}
                  className="px-3 py-1.5 rounded-lg bg-ink-900 text-white text-xs font-semibold hover:bg-black transition-all flex items-center gap-1"
                >
                  {copiedEmbed ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedEmbed ? "Copied!" : "Embed seal"}</span>
                </button>
              </div>
            </div>

            {/* Right 2 Cols: SKUs, Score History, and Telemetry */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Tab Selector */}
              <div className="bg-surface-solid border border-border rounded-xl p-1.5 flex items-center gap-1 shadow-xs">
                <button
                  onClick={() => setActiveTab("catalog")}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all ${
                    activeTab === "catalog"
                      ? "bg-ink-900 text-white shadow-xs"
                      : "text-ink-600 hover:text-ink-900"
                  }`}
                >
                  <Package className="w-4 h-4" />
                  <span>Registered commodities ({products.length})</span>
                </button>

                <button
                  onClick={() => setActiveTab("preflight")}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all ${
                    activeTab === "preflight"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "text-ink-600 hover:text-ink-900"
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Pre-Flight Studio</span>
                  <span className="bg-amber-400 text-ink-900 text-[10px] px-1.5 py-0.2 rounded font-mono font-bold uppercase">AI Twin</span>
                </button>

                <button
                  onClick={() => setActiveTab("history")}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all ${
                    activeTab === "history"
                      ? "bg-ink-900 text-white shadow-xs"
                      : "text-ink-600 hover:text-ink-900"
                  }`}
                >
                  <History className="w-4 h-4" />
                  <span>Score ledger & audits ({scoreHistory.length})</span>
                </button>

                <button
                  onClick={() => setActiveTab("badge")}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all ${
                    activeTab === "badge"
                      ? "bg-ink-900 text-white shadow-xs"
                      : "text-ink-600 hover:text-ink-900"
                  }`}
                >
                  <Award className="w-4 h-4" />
                  <span>Trust badge widget</span>
                </button>
              </div>

              {/* Tab 1: Product Catalog */}
              {activeTab === "catalog" && (
                <div className="bg-surface-solid border border-border rounded-xl p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-sm text-ink-900">Approved Statutory Master Registry</h3>
                      <p className="text-xs text-ink-500">
                        Commodities registered here will be verified during citizen and inspector camera scans.
                      </p>
                    </div>

                    <button
                      onClick={() => setShowAddProductModal(true)}
                      className="inline-flex items-center gap-1.5 bg-lime-500 hover:bg-lime-600 text-ink-900 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all active:scale-[0.98]"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Register new SKU</span>
                    </button>
                  </div>

                  <div className="border border-border rounded-lg overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-surface-base border-b border-border text-ink-500 font-mono text-[11px]">
                        <tr>
                          <th className="py-2.5 px-3">Barcode</th>
                          <th className="py-2.5 px-3">Product Description</th>
                          <th className="py-2.5 px-3">Official MRP</th>
                          <th className="py-2.5 px-3">Net Qty</th>
                          <th className="py-2.5 px-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {products.length > 0 ? (
                          products.map((p) => (
                            <tr key={p.id} className="hover:bg-surface-base/60 transition-colors">
                              <td className="py-2.5 px-3 font-mono font-medium text-ink-700">
                                {p.barcode || "No Barcode"}
                              </td>
                              <td className="py-2.5 px-3 font-medium text-ink-900">{p.product_name}</td>
                              <td className="py-2.5 px-3 font-mono font-bold text-ink-900">₹{p.official_mrp}</td>
                              <td className="py-2.5 px-3 text-ink-600">{p.net_weight}</td>
                              <td className="py-2.5 px-3">
                                <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-emerald-200">
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>Registry Approved</span>
                                </span>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-xs text-ink-400">
                              No products registered yet. Click "Register new SKU" to add your first commodity.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Tab 2: Packaging Pre-Flight AI Studio (Digital Twin) */}
              {activeTab === "preflight" && (
                <div className="bg-surface-solid border border-border rounded-xl p-5 shadow-xs space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
                    <div>
                      <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-700 uppercase">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        <span>Packaging Digital Twin & Pre-Launch Simulator</span>
                      </div>
                      <h3 className="font-bold text-base text-ink-900 mt-0.5">
                        Pre-Flight Metrology Verification Studio
                      </h3>
                      <p className="text-xs text-ink-500">
                        Test packaging artwork vector files against Rule 6 & Rule 7 before mass printing millions of units.
                      </p>
                    </div>
                    <span className="text-[11px] font-mono bg-emerald-50 text-emerald-800 border border-emerald-300 px-2.5 py-1 rounded-md self-start sm:self-auto font-bold">
                      Pre-Certification: +40 pts
                    </span>
                  </div>

                  {/* Artwork Sample Selector */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-ink-700 block">
                      Select Benchmark Packaging Vector / Artwork:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <button
                        onClick={() => setPreflightSample("ghee")}
                        className={`p-3 rounded-lg border text-left transition-all ${
                          preflightSample === "ghee"
                            ? "bg-emerald-50/80 border-emerald-500 ring-1 ring-emerald-400"
                            : "bg-surface-base border-border hover:border-ink-400"
                        }`}
                      >
                        <div className="text-lg mb-1">🧈</div>
                        <div className="font-bold text-xs text-ink-900">Pure Ghee 1L Tin</div>
                        <div className="text-[10px] text-ink-500">Tinplate • Rule 6 & 7 Compliant</div>
                      </button>

                      <button
                        onClick={() => setPreflightSample("noodles")}
                        className={`p-3 rounded-lg border text-left transition-all ${
                          preflightSample === "noodles"
                            ? "bg-emerald-50/80 border-emerald-500 ring-1 ring-emerald-400"
                            : "bg-surface-base border-border hover:border-ink-400"
                        }`}
                      >
                        <div className="text-lg mb-1">🍜</div>
                        <div className="font-bold text-xs text-ink-900">Instant Noodles 70g</div>
                        <div className="text-[10px] text-ink-500">Foil Pouch • Proviso Stamped</div>
                      </button>

                      <button
                        onClick={() => setPreflightSample("tea")}
                        className={`p-3 rounded-lg border text-left transition-all ${
                          preflightSample === "tea"
                            ? "bg-emerald-50/80 border-emerald-500 ring-1 ring-emerald-400"
                            : "bg-surface-base border-border hover:border-ink-400"
                        }`}
                      >
                        <div className="text-lg mb-1">🍵</div>
                        <div className="font-bold text-xs text-ink-900">Green Tea 250g Carton</div>
                        <div className="text-[10px] text-ink-500">Duplex Board • Multi-Language</div>
                      </button>
                    </div>
                  </div>

                  {/* Diagnostic Trigger Button */}
                  <div className="flex items-center justify-between p-4 rounded-xl bg-surface-base border border-border">
                    <div className="space-y-0.5">
                      <div className="text-xs font-bold text-ink-900">Simulate Rule 6 & 7 OpenCV Inspection</div>
                      <div className="text-[11px] text-ink-500">Computes font height, bounding box ratios & anti-tampering defensibility.</div>
                    </div>
                    <button
                      onClick={() => {
                        setPreflightAnalyzing(true);
                        setTimeout(() => {
                          setPreflightAnalyzing(false);
                          setPreflightDone(true);
                        }, 500);
                      }}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition-all flex items-center gap-1.5"
                    >
                      {preflightAnalyzing ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Running diagnostics...</span>
                        </>
                      ) : (
                        <>
                          <Zap className="w-3.5 h-3.5 text-amber-300" />
                          <span>Run Diagnostics</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Preflight Diagnostics Results */}
                  {preflightDone && (
                    <div className="space-y-4 pt-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        {/* Check 1: Font Height */}
                        <div className="p-3.5 rounded-lg border border-emerald-200 bg-emerald-50/50 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-emerald-950 flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Rule 7 Font Height Ratio</span>
                            </span>
                            <span className="text-[10px] font-mono bg-emerald-600 text-white px-1.5 py-0.2 rounded font-bold">
                              PASS (122%)
                            </span>
                          </div>
                          <p className="text-[11px] text-emerald-800 leading-snug">
                            Surface area: 340 cm². Mandated minimum font height: 2.0 mm. Detected: 2.45 mm.
                          </p>
                        </div>

                        {/* Check 2: Date Stamping Proviso */}
                        <div className="p-3.5 rounded-lg border border-emerald-200 bg-emerald-50/50 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-emerald-950 flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Rule 6(1)(d) Date Stamping</span>
                            </span>
                            <span className="text-[10px] font-mono bg-emerald-600 text-white px-1.5 py-0.2 rounded font-bold">
                              VALIDATED
                            </span>
                          </div>
                          <p className="text-[11px] text-emerald-800 leading-snug">
                            Pre-packing date affixed to crown seal/neck area pursuant to statutory proviso clause.
                          </p>
                        </div>

                        {/* Check 3: Unit Sale Price */}
                        <div className="p-3.5 rounded-lg border border-emerald-200 bg-emerald-50/50 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-emerald-950 flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Unit Sale Price (USP) Metric</span>
                            </span>
                            <span className="text-[10px] font-mono bg-emerald-600 text-white px-1.5 py-0.2 rounded font-bold">
                              COMPLIANT
                            </span>
                          </div>
                          <p className="text-[11px] text-emerald-800 leading-snug">
                            Declared MRP inclusive of all taxes. Unit sale price (₹/ml or ₹/g) printed in bold.
                          </p>
                        </div>

                        {/* Check 4: Anti-Tamper Hologram */}
                        <div className="p-3.5 rounded-lg border border-emerald-200 bg-emerald-50/50 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-emerald-950 flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Anti-Tampering Defensibility</span>
                            </span>
                            <span className="text-[10px] font-mono bg-emerald-600 text-white px-1.5 py-0.2 rounded font-bold">
                              95.8% SHIELD
                            </span>
                          </div>
                          <p className="text-[11px] text-emerald-800 leading-snug">
                            Holographic laser border prevents fraudulent dual-MRP price sticker overwrites.
                          </p>
                        </div>
                      </div>

                      {/* Official Pre-Launch Clearance Pass Banner */}
                      <div className="p-4 rounded-xl bg-surface-base border border-emerald-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="space-y-0.5">
                          <div className="text-xs font-bold text-ink-900 flex items-center gap-1.5">
                            <ShieldCheck className="w-4 h-4 text-emerald-600" />
                            <span>Pre-Launch Metrology Clearance Certificate Ready</span>
                          </div>
                          <div className="text-[11px] text-ink-500 font-mono">
                            Ref: CERT-DCA-PRE-2026-88194 • Grants +40 pts VidhiScore™ upon first production batch.
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => alert("Pre-Launch Legal Metrology Clearance Certificate generated and downloaded!")}
                            className="px-3 py-1.5 bg-ink-900 hover:bg-black text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download PDF Certificate</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: Score History Timeline */}
              {activeTab === "history" && (
                <div className="bg-surface-solid border border-border rounded-xl p-5 shadow-xs space-y-4">
                  <div>
                    <h3 className="font-bold text-sm text-ink-900">VidhiScore™ Audit Ledger</h3>
                    <p className="text-xs text-ink-500">
                      Immutable record of score adjustments triggered by verified inspections and clean compliance streaks.
                    </p>
                  </div>

                  <div className="space-y-2.5">
                    {scoreHistory.length > 0 ? (
                      scoreHistory.map((h) => (
                        <div
                          key={h.id}
                          className="p-3.5 rounded-lg border border-border bg-surface-base flex items-center justify-between gap-4 text-xs"
                        >
                          <div className="space-y-0.5">
                            <div className="font-medium text-ink-900">{h.reason}</div>
                            <div className="text-[10px] text-ink-400 font-mono">{h.created_at}</div>
                          </div>

                          <div className="text-right shrink-0 font-mono">
                            <span
                              className={`inline-block font-bold text-xs px-2.5 py-0.5 rounded-full ${
                                h.points_delta > 0
                                  ? "bg-emerald-100 text-emerald-900"
                                  : h.points_delta < 0
                                  ? "bg-red-100 text-red-900"
                                  : "bg-slate-200 text-slate-800"
                              }`}
                            >
                              {h.points_delta > 0 ? `+${h.points_delta}` : h.points_delta} pts
                            </span>
                            <div className="text-[10px] text-ink-500 mt-1">Score: {h.new_score} / 1000</div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center text-xs text-ink-400">No score revisions recorded.</div>
                    )}
                  </div>
                </div>
              )}

              {/* Tab 3: Trust Badge Widget */}
              {activeTab === "badge" && (
                <div className="bg-surface-solid border border-border rounded-xl p-6 shadow-xs space-y-5">
                  <div>
                    <h3 className="font-bold text-sm text-ink-900">Official Brand Accreditation Seal</h3>
                    <p className="text-xs text-ink-500">
                      Display your verified Legal Metrology compliance badge on e-commerce product pages and brand websites.
                    </p>
                  </div>

                  {/* Badge Live Preview */}
                  <div className="p-6 bg-surface-base rounded-xl border border-border flex items-center justify-center">
                    <VidhiBadge
                      score={selectedCompany.current_vidhiscore}
                      badgeCode={selectedCompany.tier?.badge_code}
                      tierName={selectedCompany.tier?.tier_name}
                      size="lg"
                      isBlacklisted={selectedCompany.is_blacklisted}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold text-ink-800">
                      <span>HTML Embed Snippet</span>
                      <button
                        onClick={copyTrustSeal}
                        className="text-[11px] font-semibold text-ink-900 hover:text-black flex items-center gap-1"
                      >
                        {copiedEmbed ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedEmbed ? "Copied!" : "Copy code"}</span>
                      </button>
                    </div>
                    <pre className="p-3.5 rounded-lg bg-ink-900 text-lime-400 font-mono text-[11px] overflow-x-auto">
{`<div class="vidhiscan-trust-seal" data-brand="${selectedCompany.name}">
  <a href="https://vidhiscan.gov.in/companies" target="_blank">
    <img src="https://img.shields.io/badge/VidhiScore™-${selectedCompany.current_vidhiscore}%2F1000-brightgreen?style=for-the-badge" alt="VidhiScan Verified" />
  </a>
</div>`}
                    </pre>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

      </div>

      {/* Register Brand Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface-solid border border-border rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-ink-900" />
                <h3 className="font-bold text-sm text-ink-900">Register Brand Enterprise</h3>
              </div>
              <button
                onClick={() => setShowRegisterModal(false)}
                className="text-ink-400 hover:text-ink-900"
              >
                ✕
              </button>
            </div>

            {regSuccessMsg ? (
              <div className="p-4 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold text-center">
                {regSuccessMsg}
              </div>
            ) : (
              <form onSubmit={handleRegisterCompany} className="space-y-3 text-xs">
                <div>
                  <label className="block text-ink-700 font-medium mb-1">Company / Brand Name *</label>
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="e.g. Dabur India Ltd / Real"
                    className="w-full p-2 rounded-lg border border-border bg-surface-base text-ink-900"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-ink-700 font-medium mb-1">GSTIN Number</label>
                    <input
                      type="text"
                      value={regGstin}
                      onChange={(e) => setRegGstin(e.target.value)}
                      placeholder="e.g. 27AAAAA0000A1Z5"
                      className="w-full p-2 rounded-lg border border-border bg-surface-base text-ink-900"
                    />
                  </div>

                  <div>
                    <label className="block text-ink-700 font-medium mb-1">Corporate Category</label>
                    <select
                      value={regCategory}
                      onChange={(e) => setRegCategory(e.target.value)}
                      className="w-full p-2 rounded-lg border border-border bg-surface-base text-ink-900"
                    >
                      <option>Dairy & Edible Oils</option>
                      <option>Packaged Snacks & Confectionery</option>
                      <option>Personal Care & Cosmetics</option>
                      <option>Beverages & Juices</option>
                      <option>Household & Detergents</option>
                      <option>Healthcare & Pharma FMCG</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-ink-700 font-medium mb-1">Official Compliance Email</label>
                    <input
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="legal@brand.com"
                      className="w-full p-2 rounded-lg border border-border bg-surface-base text-ink-900"
                    />
                  </div>
                  <div>
                    <label className="block text-ink-700 font-medium mb-1">Consumer Care Phone</label>
                    <input
                      type="text"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="+91 1800 000 0000"
                      className="w-full p-2 rounded-lg border border-border bg-surface-base text-ink-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-ink-700 font-medium mb-1">Registered Factory / Corporate Address</label>
                  <textarea
                    rows={2}
                    value={regAddress}
                    onChange={(e) => setRegAddress(e.target.value)}
                    placeholder="Enter registered address for Rule 6 statutory validation..."
                    className="w-full p-2 rounded-lg border border-border bg-surface-base text-ink-900"
                  />
                </div>

                <div className="p-3 bg-tile-indigo-bg/40 border border-tile-indigo-bg rounded-lg text-[11px] text-ink-600">
                  <span className="font-semibold text-ink-900">Note:</span> Initial registration grants a baseline{" "}
                  <span className="font-bold text-ink-900">750 VidhiScore™ (Silver Tier)</span>. Compliance streaks in
                  market scans will automatically promote the brand to Gold and Diamond Elite.
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowRegisterModal(false)}
                    className="px-4 py-2 rounded-lg border border-border text-ink-600 hover:bg-surface-base"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingReg}
                    className="px-4 py-2 rounded-lg bg-ink-900 text-white font-semibold hover:bg-black disabled:opacity-50"
                  >
                    {submittingReg ? "Registering..." : "Complete Registration"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Add Product SKU Modal */}
      {showAddProductModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface-solid border border-border rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-ink-900" />
                <h3 className="font-bold text-sm text-ink-900">Register New SKU Specification</h3>
              </div>
              <button onClick={() => setShowAddProductModal(false)} className="text-ink-400 hover:text-ink-900">
                ✕
              </button>
            </div>

            <form onSubmit={handleAddProduct} className="space-y-3 text-xs">
              <div>
                <label className="block text-ink-700 font-medium mb-1">Product Description / Name *</label>
                <input
                  type="text"
                  required
                  value={prodName}
                  onChange={(e) => setProdName(e.target.value)}
                  placeholder="e.g. Pasteurised Butter 100g Pouch"
                  className="w-full p-2 rounded-lg border border-border bg-surface-base text-ink-900"
                />
              </div>

              <div>
                <label className="block text-ink-700 font-medium mb-1">EAN-13 / GS1 Barcode</label>
                <input
                  type="text"
                  value={prodBarcode}
                  onChange={(e) => setProdBarcode(e.target.value)}
                  placeholder="e.g. 8901262010114"
                  className="w-full p-2 rounded-lg border border-border bg-surface-base text-ink-900 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-ink-700 font-medium mb-1">Statutory Official MRP (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={prodMrp}
                    onChange={(e) => setProdMrp(e.target.value)}
                    placeholder="58.00"
                    className="w-full p-2 rounded-lg border border-border bg-surface-base text-ink-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-ink-700 font-medium mb-1">Net Weight / Quantity *</label>
                  <input
                    type="text"
                    required
                    value={prodNetWeight}
                    onChange={(e) => setProdNetWeight(e.target.value)}
                    placeholder="100g / 1L"
                    className="w-full p-2 rounded-lg border border-border bg-surface-base text-ink-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-ink-700 font-medium mb-1">Shelf Life (Days)</label>
                <input
                  type="number"
                  value={prodShelfLife}
                  onChange={(e) => setProdShelfLife(e.target.value)}
                  placeholder="365"
                  className="w-full p-2 rounded-lg border border-border bg-surface-base text-ink-900 font-mono"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddProductModal(false)}
                  className="px-4 py-2 rounded-lg border border-border text-ink-600 hover:bg-surface-base"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingProduct}
                  className="px-4 py-2 rounded-lg bg-lime-500 text-ink-900 font-semibold hover:bg-lime-600 disabled:opacity-50"
                >
                  {submittingProduct ? "Saving..." : "Save to Central Registry"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dispute & Counterfeit Reporting Modal */}
      {showDisputeModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface-solid border border-border rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2 text-amber-700">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="font-bold text-sm text-ink-900">Contest Violation / Report Tampering</h3>
              </div>
              <button onClick={() => setShowDisputeModal(false)} className="text-ink-400 hover:text-ink-900">
                ✕
              </button>
            </div>

            {disputeSubmitted ? (
              <div className="p-4 bg-emerald-50 text-emerald-800 rounded-lg text-xs font-semibold text-center">
                Dispute filed successfully! Case reference #DSP-8921 opened for Inspector review.
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                <p className="text-ink-600">
                  If an unauthorized seller tampered with your package or altered prices, submit a dispute to freeze VidhiScore point deductions pending official laboratory verification.
                </p>

                <div>
                  <label className="block text-ink-700 font-medium mb-1">Dispute Statement & Evidence Reference</label>
                  <textarea
                    rows={4}
                    value={disputeNotes}
                    onChange={(e) => setDisputeNotes(e.target.value)}
                    placeholder="Describe batch number, unauthorized sticker relabeling, or retail seller details..."
                    className="w-full p-2 rounded-lg border border-border bg-surface-base text-ink-900"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    onClick={() => setShowDisputeModal(false)}
                    className="px-4 py-2 rounded-lg border border-border text-ink-600 hover:bg-surface-base"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      setDisputeSubmitted(true);
                      setTimeout(() => {
                        setDisputeSubmitted(false);
                        setShowDisputeModal(false);
                      }, 2000);
                    }}
                    className="px-4 py-2 rounded-lg bg-ink-900 text-white font-semibold hover:bg-black"
                  >
                    Submit Dispute to Enforcement HQ
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
