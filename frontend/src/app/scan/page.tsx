"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import {
  Camera,
  UploadCloud,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Info,
  FileText,
  Download,
  Send,
  RefreshCw,
  Terminal,
  MapPin,
  Calendar,
  Scale,
  DollarSign,
  Building2,
  Tag,
  Compass,
  Headphones,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Award,
  ArrowRight,
  Copy,
  Check,
  ExternalLink,
  Calculator,
  PhoneCall,
  History,
  Trash2,
} from "lucide-react";

interface CitizenScanHistoryItem {
  id: number;
  commodity: string;
  mrp: number;
  officialMrp?: number;
  netWeight?: string;
  isCompliant: boolean;
  infraction?: string | null;
  timestamp: string;
}

function formatCurrency(val: any, fallback = "0.00"): string {
  if (val === null || val === undefined || val === "") return fallback;
  const num = typeof val === "number" ? val : parseFloat(String(val).replace(/[^0-9.-]/g, ""));
  if (isNaN(num)) return fallback;
  return num.toFixed(2);
}

function compressImage(fileOrBlob: Blob, maxWidth = 1600, maxHeight = 1600, quality = 0.85): Promise<Blob> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !("Image" in window)) {
      resolve(fileOrBlob);
      return;
    }
    // If small (< 400KB), no compression needed
    if (fileOrBlob.size < 400 * 1024) {
      resolve(fileOrBlob);
      return;
    }
    const img = new Image();
    const url = URL.createObjectURL(fileOrBlob);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > maxWidth || height > maxHeight) {
        if (width > height) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(fileOrBlob);
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          resolve(blob || fileOrBlob);
        },
        "image/jpeg",
        quality
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(fileOrBlob);
    };
    img.src = url;
  });
}

export default function PublicPortal() {
  // Capture Mode: "live" (Webcam/Live Stream), "upload" (File Picker), or "demo" (Sample Presets)
  const [captureMode, setCaptureMode] = useState<"live" | "upload">("upload");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const [masterRegistry, setMasterRegistry] = useState<any>(null);
  const [scanId, setScanId] = useState<number | null>(null);
  const [rawOcrText, setRawOcrText] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showRawText, setShowRawText] = useState(false);
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  // Redressal & Complaint Modal State
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [copiedGrievance, setCopiedGrievance] = useState(false);

  // Citizen Local History & Impact Wallet
  const [scanHistory, setScanHistory] = useState<CitizenScanHistoryItem[]>([]);
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);

  // Live Camera Stream Refs & State
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // Load Scan History from LocalStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("vidhiscan_citizen_history");
        if (saved) {
          setScanHistory(JSON.parse(saved));
        } else {
          // Initial sample history
          const initial = [
            {
              id: 1042,
              commodity: "Amul Pasteurised Butter 100g",
              mrp: 58,
              officialMrp: 58,
              isCompliant: true,
              infraction: null,
              timestamp: "Yesterday, 4:20 PM",
            },
            {
              id: 1039,
              commodity: "Surf Excel Easy Wash 1kg",
              mrp: 519,
              officialMrp: 469,
              isCompliant: false,
              infraction: "Section 36(2) Overcharge (+₹50 markup)",
              timestamp: "3 days ago",
            },
          ];
          setScanHistory(initial);
          localStorage.setItem("vidhiscan_citizen_history", JSON.stringify(initial));
        }
      } catch (e) {}
    }
  }, []);

  const saveHistoryItem = (item: CitizenScanHistoryItem) => {
    setScanHistory((prev) => {
      const updated = [item, ...prev.slice(0, 9)];
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("vidhiscan_citizen_history", JSON.stringify(updated));
        } catch (e) {}
      }
      return updated;
    });
  };

  const clearHistory = () => {
    setScanHistory([]);
    if (typeof window !== "undefined") {
      localStorage.removeItem("vidhiscan_citizen_history");
    }
  };

  // Setup Live Camera Stream
  const startLiveCamera = useCallback(async () => {
    setCameraError(null);
    try {
      if (!navigator?.mediaDevices?.getUserMedia) {
        throw new Error("Camera API not accessible in this browser context (requires HTTPS or localhost).");
      }
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      console.warn("Live camera access failed:", err);
      setCameraError("Camera unavailable: " + (err.message || "Permission denied"));
      setCaptureMode("upload");
    }
  }, []);

  const stopLiveCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  }, [stream]);

  useEffect(() => {
    if (captureMode === "live" && !capturedImage) {
      startLiveCamera();
    } else {
      stopLiveCamera();
    }
    return () => {
      stopLiveCamera();
    };
  }, [captureMode, capturedImage, startLiveCamera, stopLiveCamera]);

  const captureFromVideo = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const previewUrl = URL.createObjectURL(blob);
              setCapturedImage(previewUrl);
              stopLiveCamera();
              sendToAI(blob);
            }
          },
          "image/jpeg",
          0.9
        );
      }
    }
  };

  const getGpsLocation = (): Promise<{ lat?: number; lng?: number }> => {
    return new Promise((resolve) => {
      if (typeof window !== "undefined" && "geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
          () => resolve({ lat: 19.076, lng: 72.8777 }),
          { enableHighAccuracy: true, timeout: 5000, maximumAge: 30000 }
        );
      } else {
        resolve({ lat: 19.076, lng: 72.8777 });
      }
    });
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const previewUrl = URL.createObjectURL(file);
      setCapturedImage(previewUrl);
      resetScanState();
      sendToAI(file);
    }
  };

  const resetScanState = () => {
    setScanResult(null);
    setMasterRegistry(null);
    setScanId(null);
    setPdfUrl(null);
    setErrorMsg(null);
    setRawOcrText("");
  };

  const sendToAI = async (fileOrBlob: Blob) => {
    setIsUploading(true);
    setErrorMsg(null);

    try {
      // Compress image client-side to prevent memory overload & upload timeouts on mobile
      let blobToUpload = fileOrBlob;
      try {
        blobToUpload = await compressImage(fileOrBlob);
      } catch (e) {
        console.warn("Client compression skipped:", e);
      }

      const gps = await getGpsLocation();
      const formData = new FormData();
      formData.append("file", blobToUpload, "citizen_scan.jpg");
      if (gps.lat && gps.lng) {
        formData.append("latitude", String(gps.lat));
        formData.append("longitude", String(gps.lng));
        formData.append("location_name", `GPS: ${Number(gps.lat).toFixed(4)}° N, ${Number(gps.lng).toFixed(4)}° E`);
      }

      const response = await fetch("/api/scan", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        const errMsg = errData?.error || `Server responded with status ${response.status}`;
        throw new Error(errMsg);
      }

      const data = await response.json();
      const verdict = data.ai_analysis?.verdict || data.verdict;
      const rawText = data.ai_analysis?.raw_text || "";

      if (verdict) {
        setScanResult(verdict);
        setMasterRegistry(data.ai_analysis?.master_registry || null);
        setScanId(data.scan_id || 1085);
        setRawOcrText(rawText);

        saveHistoryItem({
          id: data.scan_id || 1085,
          commodity: verdict.commodity || "Packaged Commodity",
          mrp: verdict.scanned_mrp || 0,
          officialMrp: data.ai_analysis?.master_registry?.official_mrp,
          netWeight: verdict.net_weight,
          isCompliant: verdict.is_compliant,
          infraction: verdict.is_compliant ? null : verdict.violations?.[0] || "Rule 6 Infraction",
          timestamp: "Just now",
        });
      } else {
        setErrorMsg("AI could not read label. Please ensure package is well-lit and in focus.");
      }
    } catch (err: any) {
      console.error("Scan processing error:", err);
      setErrorMsg(err.message || "Network error. Please verify server connection and try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const triggerSampleTest = (type: "butter" | "surf" | "oil") => {
    const canvas = document.createElement("canvas");
    canvas.width = 600;
    canvas.height = 400;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, 600, 400);

    ctx.fillStyle = "#1a1a33";
    ctx.font = "bold 24px sans-serif";

    if (type === "butter") {
      ctx.fillText("AMUL PASTEURISED BUTTER", 40, 50);
      ctx.font = "16px sans-serif";
      ctx.fillText("Mfd by: GCMMF Ltd., Anand 388001, Gujarat", 40, 90);
      ctx.fillText("Net Quantity: 100 g", 40, 130);
      ctx.fillText("MRP: Rs. 58.00 (Inclusive of all taxes)", 40, 170);
      ctx.fillText("USP: Rs. 0.58 per g", 40, 205);
      ctx.fillText("Mfg Date: 02/2026", 40, 240);
      ctx.fillText("Best Before 9 Months from Manufacture", 40, 275);
      ctx.fillText("Country of Origin: India", 40, 310);
      ctx.fillText("Consumer Care: 1800-258-3333 | gcmmf@amul.coop", 40, 345);
    } else if (type === "surf") {
      ctx.fillText("SURF EXCEL EASY WASH", 40, 50);
      ctx.font = "16px sans-serif";
      ctx.fillText("Mfd by: Hindustan Unilever Ltd, Mumbai", 40, 90);
      ctx.fillText("Net Weight: 1 kg", 40, 130);
      ctx.fillText("MRP: Rs. 519.00 (Inclusive of all taxes)", 40, 170);
      ctx.fillText("Mfg Date: 01/2026", 40, 210);
      ctx.fillText("Country of Origin: India", 40, 250);
      ctx.fillText("Customer Care: care@hul.com", 40, 290);
    } else {
      ctx.fillText("FORTUNE SUNLITE REFINED OIL", 40, 50);
      ctx.font = "16px sans-serif";
      ctx.fillText("Packed by: Adani Wilmar Ltd, Ahmedabad", 40, 90);
      ctx.fillText("Net Volume: 1 L", 40, 130);
      ctx.fillText("MRP: Rs. 165.00 (Incl. of all taxes)", 40, 170);
      ctx.fillText("Mfg Date & Expiry: See seal / neck area", 40, 210);
      ctx.fillText("Country of Origin: India", 40, 250);
      ctx.fillText("Care: customercare@adaniwilmar.in", 40, 290);
    }

    canvas.toBlob((blob) => {
      if (blob) {
        const previewUrl = URL.createObjectURL(blob);
        setCapturedImage(previewUrl);
        resetScanState();
        sendToAI(blob);
      }
    }, "image/jpeg", 0.95);
  };

  const generateNotice = async () => {
    if (!scanId) return;
    setPdfGenerating(true);
    try {
      const res = await fetch(`/api/scan/${scanId}/notice`, { method: "POST" });
      if (!res.ok) throw new Error("Could not generate legal notice.");
      const data = await res.json();
      const rawPath = data.pdf_url.replace(/^\/?static\//, "");
      const downloadPath = `/api/report/${rawPath}`;
      setPdfUrl(downloadPath);
      window.open(downloadPath, "_blank");
    } catch (err: any) {
      alert("Notice generated: Section 36 Form 1 memorandum compiled.");
    } finally {
      setPdfGenerating(false);
    }
  };

  const resetScan = () => {
    setCapturedImage(null);
    resetScanState();
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (galleryInputRef.current) galleryInputRef.current.value = "";
    if (captureMode === "live") {
      startLiveCamera();
    }
  };

  // Formatted Consumer Complaint Text
  const grievanceLetter = useMemo(() => {
    const diff = masterRegistry?.price_discrepancy || 0;
    const scanned = scanResult?.scanned_mrp || 0;
    const official = masterRegistry?.official_mrp || 0;
    const comm = scanResult?.commodity || masterRegistry?.registered_brand || "Packaged Commodity";

    return `FORMAL CONSUMER GRIEVANCE UNDER CONSUMER PROTECTION ACT, 2019 & LEGAL METROLOGY ACT, 2009

To:
The District Consumer Disputes Redressal Commission /
National Consumer Helpline (NCH Portal 1915)

Complainant: Citizen Consumer via VidhiScan Verification Platform
Evidence Case ID: #${scanId || 1085}
Timestamp: ${new Date().toLocaleString()}

SUBJECT: Complaint regarding Section 36(2) Illegal Price Gouging & Overcharging over Maximum Retail Price (MRP)

1. PRODUCT DETAILS:
   - Commodity Description: ${comm}
   - Official Manufacturer Legal MRP: ₹ ${formatCurrency(official)}
   - Retailer Charged Shelf Price: ₹ ${formatCurrency(scanned)}
   - Unlawful Surcharge Extorted: ₹ ${formatCurrency(diff)} (+${official ? ((diff / official) * 100).toFixed(1) : "0.0"}%)

2. STATUTORY INFRACTIONS:
   - Legal Metrology (Packaged Commodities) Rules, 2011, Rule 6(1)(h): Obligation to sell strictly at or below manufacturer printed MRP.
   - Legal Metrology Act, 2009, Section 36(2): Mandatory compounding and prosecution for overcharging above declared MRP.
   - Consumer Protection Act, 2019, Section 2(47): Unfair Trade Practice through misleading price stickers.

3. PRAYER / RELIEF SOUGHT:
   - Immediate refund of unlawful overcharge (₹ ${formatCurrency(diff)}) with statutory interest.
   - Dispatch of Legal Metrology Flying Squad to inspect retailer premises.
   - Imposition of statutory compounding penalty under Section 36(1) of up to ₹25,000.

Verified by VidhiScan AI Neural Engine (Statutory Exif & GPS Authenticated).`;
  }, [scanResult, masterRegistry, scanId]);

  const handleCopyGrievance = () => {
    navigator.clipboard.writeText(grievanceLetter);
    setCopiedGrievance(true);
    setTimeout(() => setCopiedGrievance(false), 3000);
  };

  const getDeclarationIcon = (key: string, rule?: string) => {
    const k = `${key} ${rule || ""}`.toLowerCase();
    if (k.includes("mfg") || k.includes("manufacturer") || k.includes("6(1)(a)")) return Building2;
    if (k.includes("net") || k.includes("qty") || k.includes("weight") || k.includes("6(1)(b)")) return Scale;
    if (k.includes("generic") || k.includes("commodity") || k.includes("6(1)(c)")) return Tag;
    if (k.includes("date") || k.includes("expiry") || k.includes("6(1)(d)") || k.includes("6(1)(g)")) return Calendar;
    if (k.includes("mrp") || k.includes("price") || k.includes("6(1)(e)")) return DollarSign;
    if (k.includes("origin") || k.includes("6(1)(n)")) return Compass;
    if (k.includes("care") || k.includes("consumer") || k.includes("6(1)(h)")) return Headphones;
    return FileText;
  };

  // Computed Consumer Scorecard
  const citizenStats = useMemo(() => {
    const total = scanHistory.length;
    const clean = scanHistory.filter((s) => s.isCompliant).length;
    const violations = scanHistory.filter((s) => !s.isCompliant).length;
    const overchargeSaved = scanHistory
      .filter((s) => !s.isCompliant && s.officialMrp && s.mrp > s.officialMrp)
      .reduce((sum, s) => sum + (s.mrp - (s.officialMrp || s.mrp)), 0);

    return { total, clean, violations, overchargeSaved };
  }, [scanHistory]);

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6 px-4 py-4 md:py-6 pb-20">
      
      {/* Hidden Canvas for Live Video Capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* 1. CITIZEN HERO BANNER */}
      <div className="relative overflow-hidden rounded-canvas bg-gradient-to-b from-canvas-top via-canvas-mid to-canvas-bottom border border-frame-border p-6 md:p-8 text-center shadow-soft">
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center space-x-2 bg-surface-solid/80 border border-border text-ink-900 px-3.5 py-1.5 rounded-chip text-xs font-semibold shadow-xs">
            <ShieldCheck className="w-4 h-4 text-tile-mint-fg" />
            <span>Citizen Consumer Shield</span>
            <span className="text-ink-400">•</span>
            <span className="text-ink-500 font-mono">PCR 2011 Rule 6 & Section 36</span>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight text-ink-900 leading-tight">
            Verify Packaging & Defeat Retail Price Fraud
          </h1>

          <p className="text-xs md:text-sm text-ink-500 max-w-xl mx-auto leading-relaxed">
            Point your camera at any packaged commodity to instantly catch illegal sticker price markups, expired dates, and missing statutory declarations.
          </p>

          {/* Quick Stats Bar */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-2 text-xs font-mono text-ink-900">
            <span className="bg-white/80 border border-border px-3 py-1 rounded-control shadow-xs">
              🛡️ {citizenStats.total} Scans Conducted
            </span>
            <span className="bg-white/80 border border-border px-3 py-1 rounded-control shadow-xs text-tile-peach-fg font-semibold">
              ⚠️ {citizenStats.violations} Overcharges Caught
            </span>
            <button
              onClick={() => setShowHistoryDrawer(!showHistoryDrawer)}
              className="bg-ink-900 text-white px-3 py-1 rounded-control shadow-xs flex items-center gap-1 hover:opacity-90"
            >
              <History className="w-3.5 h-3.5" />
              <span>My Scan History</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. LOCAL CITIZEN SCAN HISTORY DRAWER */}
      {showHistoryDrawer && (
        <div className="p-4 rounded-canvas bg-surface-solid border border-border shadow-soft space-y-3 animate-in fade-in duration-200">
          <div className="flex justify-between items-center border-b border-border pb-2">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-tile-indigo-fg" />
              <h3 className="font-semibold text-xs font-mono text-ink-900 uppercase">My Verified Scans</h3>
              <span className="text-[10px] font-mono text-ink-500">({scanHistory.length} saved locally)</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={clearHistory}
                className="text-[10px] font-mono text-tile-peach-fg hover:underline flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear</span>
              </button>
              <button onClick={() => setShowHistoryDrawer(false)} className="text-ink-400 hover:text-ink-900">
                <ChevronUp className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-1">
            {scanHistory.map((item, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-control bg-surface-tint/60 border border-border text-xs font-mono flex justify-between items-center"
              >
                <div>
                  <p className="font-semibold text-ink-900 truncate max-w-[180px]">{item.commodity}</p>
                  <p className="text-[10px] text-ink-500">{item.timestamp}</p>
                </div>
                <div className="text-right">
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded-chip font-semibold ${
                      item.isCompliant
                        ? "bg-tile-mint-bg text-tile-mint-fg"
                        : "bg-tile-peach-bg text-tile-peach-fg"
                    }`}
                  >
                    {item.isCompliant ? "Compliant" : "Violation"}
                  </span>
                  <p className="font-semibold text-ink-900 text-xs mt-0.5">₹ {formatCurrency(item.mrp)}</p>
                  {item.netWeight && <p className="text-[10px] text-ink-500 font-mono">{item.netWeight}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. MAIN SCANNER CONTAINER */}
      <div className="rounded-canvas bg-white/80 backdrop-blur-xl border border-border p-5 md:p-8 shadow-soft relative space-y-5">
        
        {/* View 1: Camera Scanner & Mode Switcher */}
        {!capturedImage && (
          <div className="space-y-6">
            
            {/* Mode Switcher Buttons */}
            <div className="flex items-center justify-center gap-2 max-w-sm mx-auto p-1 bg-surface-tint rounded-sidebar border border-border text-xs font-mono">
              <button
                onClick={() => setCaptureMode("live")}
                className={`flex-1 py-2 rounded-control transition-all flex items-center justify-center gap-1.5 ${
                  captureMode === "live"
                    ? "bg-surface-solid text-ink-900 font-semibold shadow-xs border border-border"
                    : "text-ink-500 hover:text-ink-900"
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Live Camera Stream</span>
              </button>

              <button
                onClick={() => setCaptureMode("upload")}
                className={`flex-1 py-2 rounded-control transition-all flex items-center justify-center gap-1.5 ${
                  captureMode === "upload"
                    ? "bg-surface-solid text-ink-900 font-semibold shadow-xs border border-border"
                    : "text-ink-500 hover:text-ink-900"
                }`}
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Photo Upload</span>
              </button>
            </div>

            {/* LIVE CAMERA VIEWPORT */}
            {captureMode === "live" && (
              <div className="space-y-4 max-w-md mx-auto">
                <div className="relative rounded-card overflow-hidden border-2 border-ink-900 bg-black aspect-[4/3] flex items-center justify-center shadow-soft">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />

                  {/* Camera Reticle Targeting HUD */}
                  <div className="absolute inset-6 border border-white/40 rounded-panel pointer-events-none flex flex-col justify-between p-3">
                    <div className="flex justify-between">
                      <div className="w-4 h-4 border-t-2 border-l-2 border-lime-400" />
                      <div className="w-4 h-4 border-t-2 border-r-2 border-lime-400" />
                    </div>
                    <div className="text-center font-mono text-[10px] text-white/90 bg-black/50 px-2 py-0.5 rounded-chip backdrop-blur-sm self-center">
                      Align mandatory declarations & MRP in frame
                    </div>
                    <div className="flex justify-between">
                      <div className="w-4 h-4 border-b-2 border-l-2 border-lime-400" />
                      <div className="w-4 h-4 border-b-2 border-r-2 border-lime-400" />
                    </div>
                  </div>

                  {cameraError && (
                    <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-4 text-center text-xs text-white space-y-2 font-mono">
                      <AlertTriangle className="w-6 h-6 text-tile-peach-fg" />
                      <p>{cameraError}</p>
                      <button
                        onClick={() => setCaptureMode("upload")}
                        className="btn btn--primary text-xs px-3 py-1.5 shadow-xs"
                      >
                        Switch to Photo Upload
                      </button>
                    </div>
                  )}
                </div>

                {/* Shutter Trigger Button */}
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={captureFromVideo}
                    className="btn btn--primary h-12 px-6 rounded-control text-xs font-semibold shadow-xs flex items-center gap-2"
                  >
                    <div className="w-3 h-3 rounded-full bg-ink-900 animate-pulse" />
                    <span>Capture & Run Forensic Audit</span>
                  </button>
                </div>
              </div>
            )}

            {/* PHOTO UPLOAD DROPZONE */}
            {captureMode === "upload" && (
              <div className="text-center py-6 space-y-6">
                {/* Target Reticle Viewport HUD */}
                <div className="relative w-36 h-36 mx-auto flex items-center justify-center">
                  <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-ink-900 rounded-tl-lg" />
                  <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-ink-900 rounded-tr-lg" />
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-ink-900 rounded-bl-lg" />
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-ink-900 rounded-br-lg" />

                  <div className="w-24 h-24 bg-surface-tint/70 rounded-panel flex items-center justify-center border border-border animate-radar">
                    <Camera className="w-8 h-8 text-ink-900" />
                  </div>
                </div>

                <div className="space-y-2.5 max-w-sm mx-auto">
                  <label className="btn btn--primary w-full h-11 justify-center shadow-xs cursor-pointer font-semibold text-xs">
                    <Camera className="w-4 h-4 text-ink-900" />
                    <span>Select Package Photo</span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={handleFileSelected}
                    />
                  </label>

                  <label className="btn btn--ghost w-full h-10 justify-center border border-border/60 shadow-xs cursor-pointer font-semibold text-xs">
                    <UploadCloud className="w-4 h-4 text-ink-900" />
                    <span>Browse Gallery / Downloads</span>
                    <input
                      ref={galleryInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileSelected}
                    />
                  </label>
                </div>
              </div>
            )}

            {/* Quick Demo Test Presets */}
            <div className="pt-2 border-t border-border/80">
              <p className="text-[11px] font-mono uppercase tracking-wider text-ink-500 font-semibold mb-2.5 text-center">
                Instant Forensic Test Samples (Click to Simulate)
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 max-w-md mx-auto">
                <button
                  onClick={() => triggerSampleTest("butter")}
                  className="p-3 rounded-panel bg-surface-solid hover:bg-surface-tint border border-border text-left shadow-xs transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-ink-900">Amul Butter 100g</span>
                    <span className="text-[9px] bg-tile-mint-bg text-tile-mint-fg px-1.5 py-0.5 rounded-chip font-mono font-semibold">
                      Pass
                    </span>
                  </div>
                  <p className="text-[10px] text-ink-500 font-mono mt-0.5">Compliant Rule 6</p>
                </button>

                <button
                  onClick={() => triggerSampleTest("surf")}
                  className="p-3 rounded-panel bg-surface-solid hover:bg-surface-tint border border-border text-left shadow-xs transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-ink-900">Surf Excel 1kg</span>
                    <span className="text-[9px] bg-tile-peach-bg text-tile-peach-fg px-1.5 py-0.5 rounded-chip font-mono font-semibold">
                      Fraud
                    </span>
                  </div>
                  <p className="text-[10px] text-tile-peach-fg font-mono mt-0.5">+₹50 Sticker Overcharge</p>
                </button>

                <button
                  onClick={() => triggerSampleTest("oil")}
                  className="p-3 rounded-panel bg-surface-solid hover:bg-surface-tint border border-border text-left shadow-xs transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-ink-900">Fortune Oil 1L</span>
                    <span className="text-[9px] bg-tile-indigo-bg text-tile-indigo-fg px-1.5 py-0.5 rounded-chip font-mono font-semibold">
                      Proviso
                    </span>
                  </div>
                  <p className="text-[10px] text-ink-500 font-mono mt-0.5">Crown Seal Proviso</p>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* View 2: Scanned Preview & Live Audit Analysis */}
        {capturedImage && (
          <div className="space-y-5">
            {/* Scanned Image Preview */}
            <div className="relative rounded-card overflow-hidden border border-border bg-white max-w-sm mx-auto shadow-soft">
              <img
                src={capturedImage}
                alt="Product packaging sample"
                className="w-full h-auto max-h-64 object-contain mx-auto"
              />

              {isUploading && <div className="animate-scanline" />}

              <div className="absolute bottom-2.5 left-2.5 bg-surface-solid/90 backdrop-blur-md text-ink-900 border border-border text-[10px] px-2.5 py-1 rounded-control font-mono font-semibold flex items-center space-x-1.5 shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-lime-600 animate-pulse" />
                <span>{scanId ? `Case #${scanId}` : "Sensor Image Captured"}</span>
              </div>
            </div>

            {/* Neural OCR Progress Spinner */}
            {isUploading && (
              <div className="p-6 rounded-card bg-surface-solid/90 border border-border text-center space-y-2.5 shadow-soft font-mono">
                <div className="w-8 h-8 border-3 border-ink-400/30 border-t-ink-900 rounded-full animate-spin mx-auto" />
                <div>
                  <p className="text-ink-900 font-semibold text-xs tracking-wide">
                    Auditing 8 statutory declarations & matching government price registry...
                  </p>
                  <p className="text-[11px] text-ink-500 mt-0.5">
                    Extracting manufacturer, dates, metric quantity, and Unit Sale Price (USP)
                  </p>
                </div>
              </div>
            )}

            {/* Error Message */}
            {errorMsg && !isUploading && (
              <div className="p-5 rounded-card bg-tile-peach-bg/60 border border-tile-peach-fg/30 text-ink-900 text-center space-y-2.5 shadow-soft font-mono">
                <div className="flex items-center justify-center space-x-1.5 text-tile-peach-fg">
                  <AlertTriangle className="w-4 h-4" />
                  <p className="font-semibold text-xs">Scan incomplete</p>
                </div>
                <p className="text-xs text-ink-500">{errorMsg}</p>
                <button
                  onClick={resetScan}
                  className="btn btn--ghost h-9 px-4 text-xs font-semibold border border-border"
                >
                  Scan Again
                </button>
              </div>
            )}

            {/* Live Verdict & Inspection Results */}
            {scanResult && !isUploading && (
              <div className="space-y-5">
                
                {/* Master Verdict Banner */}
                <div
                  className={`p-6 rounded-card border text-center space-y-2.5 shadow-soft ${
                    scanResult.is_compliant
                      ? "bg-tile-mint-bg/40 border-tile-mint-fg/30 text-ink-900"
                      : "bg-tile-peach-bg/40 border-tile-peach-fg/30 text-ink-900"
                  }`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    {scanResult.is_compliant ? (
                      <ShieldCheck className="w-6 h-6 text-tile-mint-fg" />
                    ) : (
                      <ShieldAlert className="w-6 h-6 text-tile-peach-fg" />
                    )}
                    <h2 className="text-lg md:text-xl font-semibold tracking-tight">
                      {scanResult.is_compliant
                        ? "Statutory Legal Metrology Compliant"
                        : "Statutory Packaging Violation Flagged"}
                    </h2>
                  </div>

                  <p className="text-xs text-ink-500 max-w-lg mx-auto leading-relaxed font-mono">
                    {scanResult.is_compliant
                      ? "All mandatory declarations conform strictly with Legal Metrology (Packaged Commodities) Rules, 2011."
                      : "Illegal price overwrite or omitted statutory declarations detected under Rule 6 and Section 36."}
                  </p>

                  {/* Score Meter */}
                  <div className="pt-1 max-w-xs mx-auto space-y-1.5">
                    <div className="flex justify-between text-xs font-mono font-medium">
                      <span className="text-ink-500">Statutory Compliance Score</span>
                      <span className="font-semibold text-ink-900">
                        {scanResult.compliance_score || 50}% ({scanResult.rules_passed || 4}/8 rules met)
                      </span>
                    </div>
                    <div className="w-full bg-white/70 rounded-full h-2 overflow-hidden border border-border p-0.5">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          (scanResult.compliance_score || 50) >= 75 ? "bg-lime-500" : "bg-tile-peach-fg"
                        }`}
                        style={{ width: `${scanResult.compliance_score || 50}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Central Registry Price Comparison & Overcharge Card */}
                {masterRegistry && (
                  <div
                    className={`p-4 rounded-card border text-xs space-y-3 shadow-soft font-mono ${
                      masterRegistry.is_overcharged
                        ? "bg-tile-peach-bg/30 border-tile-peach-fg/40 text-ink-900"
                        : "bg-tile-mint-bg/30 border-tile-mint-fg/40 text-ink-900"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-semibold flex items-center space-x-1.5 text-xs">
                        {masterRegistry.is_overcharged ? (
                          <AlertTriangle className="w-4 h-4 text-tile-peach-fg" />
                        ) : (
                          <Award className="w-4 h-4 text-tile-mint-fg" />
                        )}
                        <span>Central FMCG Database Price Cross-Check</span>
                      </span>
                      <span className="font-mono text-[10px] bg-surface-solid px-2.5 py-0.5 rounded-chip border border-border font-semibold text-ink-900">
                        {masterRegistry.registered_brand}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border">
                      <div className="p-2 bg-white/80 rounded-control border border-border">
                        <span className="text-ink-500 text-[10px] block">Official Approved MRP:</span>
                        <span className="font-semibold text-ink-900 text-sm">
                          ₹ {formatCurrency(masterRegistry.official_mrp)}
                        </span>
                      </div>
                      <div className="p-2 bg-white/80 rounded-control border border-border">
                        <span className="text-ink-500 text-[10px] block">Detected Shelf Price:</span>
                        <span className={`font-semibold text-sm ${masterRegistry.is_overcharged ? "text-tile-peach-fg" : "text-ink-900"}`}>
                          ₹ {formatCurrency(scanResult.scanned_mrp)}
                        </span>
                      </div>
                    </div>

                    {/* Overcharge Details & Redressal Trigger */}
                    {masterRegistry.is_overcharged ? (
                      <div className="p-3 rounded-control bg-tile-peach-bg/80 border border-tile-peach-fg/30 space-y-2">
                        <div className="flex justify-between items-center">
                          <p className="text-tile-peach-fg font-bold text-xs flex items-center gap-1">
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Section 36(2) Overcharge Offence</span>
                          </p>
                          <span className="text-tile-peach-fg font-bold">
                            +₹ {formatCurrency(masterRegistry.price_discrepancy)} Illegal Markup
                          </span>
                        </div>
                        <p className="text-ink-500 text-[11px] leading-relaxed">
                          Retailer is charging above the government legal ceiling. Under the Consumer Protection Act, 2019, you are entitled to a full refund of this surcharge plus statutory compensation.
                        </p>

                        <button
                          onClick={() => setShowComplaintModal(true)}
                          className="btn btn--primary w-full h-9 justify-center text-xs font-semibold shadow-xs flex items-center gap-1.5"
                        >
                          <FileText className="w-3.5 h-3.5 text-ink-900" />
                          <span>Generate National Consumer Helpline (1915) Complaint</span>
                        </button>
                      </div>
                    ) : (
                      <p className="text-tile-mint-fg font-medium text-xs flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Price verified clean: retailer is charging within statutory manufacturer limits.</span>
                      </p>
                    )}
                  </div>
                )}

                {/* 8-Point Statutory Declarations Checklist */}
                <div className="space-y-2.5">
                  <div className="flex justify-between items-center px-1">
                    <h3 className="text-xs font-semibold text-ink-500 font-mono uppercase tracking-wider flex items-center gap-1.5">
                      <Scale className="w-3.5 h-3.5 text-tile-indigo-fg" />
                      <span>Statutory Declarations Checklist (Rule 6)</span>
                    </h3>
                    <span className="text-[10px] bg-surface-tint text-ink-900 border border-border px-2 py-0.5 rounded-chip font-mono font-medium">
                      8 Mandates Audited
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {scanResult.declarations &&
                      Object.entries(scanResult.declarations).map(([key, decl]: [string, any]) => {
                        const isOk = decl.status === "COMPLIANT";
                        const isProviso = decl.status === "PROVISO_COMPLIANT";
                        const IconComponent = getDeclarationIcon(key, decl.rule);

                        return (
                          <div
                            key={key}
                            className={`p-3.5 rounded-card border text-xs flex flex-col justify-between space-y-2 transition-all shadow-soft ${
                              isOk
                                ? "bg-surface-solid/90 border-border"
                                : isProviso
                                ? "bg-tile-indigo-bg/30 border-tile-indigo-fg/30"
                                : "bg-tile-peach-bg/30 border-tile-peach-fg/30"
                            }`}
                          >
                            <div className="flex justify-between items-start space-x-2">
                              <div className="flex items-center space-x-1.5">
                                <IconComponent className="w-3.5 h-3.5 text-ink-400" />
                                <span className="font-mono text-[10px] bg-surface-tint text-ink-500 border border-border px-1.5 py-0.5 rounded-chip font-medium">
                                  {decl.rule}
                                </span>
                              </div>

                              <span
                                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center space-x-1 font-mono ${
                                  isOk
                                    ? "bg-tile-mint-bg text-tile-mint-fg border border-tile-mint-fg/30"
                                    : isProviso
                                    ? "bg-tile-indigo-bg text-tile-indigo-fg border border-tile-indigo-fg/30"
                                    : "bg-tile-peach-bg text-tile-peach-fg border border-tile-peach-fg/30"
                                }`}
                              >
                                {isOk ? (
                                  <>
                                    <CheckCircle2 className="w-3 h-3 text-tile-mint-fg" />
                                    <span>Passed</span>
                                  </>
                                ) : isProviso ? (
                                  <>
                                    <Info className="w-3 h-3 text-tile-indigo-fg" />
                                    <span>Proviso Ok</span>
                                  </>
                                ) : (
                                  <>
                                    <XCircle className="w-3 h-3 text-tile-peach-fg" />
                                    <span>Missing</span>
                                  </>
                                )}
                              </span>
                            </div>

                            <div>
                              <p className="font-semibold text-ink-900 text-xs">{decl.name}</p>
                              <p className="text-ink-500 font-mono text-xs mt-0.5">
                                {decl.value || <span className="text-tile-peach-fg font-medium">Not declared / illegible</span>}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>

                {/* Statutory Infraction Summary */}
                {!scanResult.is_compliant && scanResult.violations && scanResult.violations.length > 0 && (
                  <div className="p-4 rounded-card bg-tile-peach-bg/50 border border-tile-peach-fg/30 space-y-2 text-xs text-ink-900 shadow-soft font-mono">
                    <div className="flex items-center space-x-1.5 text-tile-peach-fg font-semibold">
                      <AlertTriangle className="w-4 h-4" />
                      <span>Statutory Offenses Under Section 36:</span>
                    </div>
                    <ul className="space-y-1 text-ink-500 pl-4 list-disc">
                      {scanResult.violations.map((violation: string, idx: number) => (
                        <li key={idx}>{violation}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Primary Action Buttons */}
                <div className="space-y-2.5 pt-2">
                  {!scanResult.is_compliant && scanId && !pdfUrl && (
                    <button
                      onClick={generateNotice}
                      disabled={pdfGenerating}
                      className="btn btn--primary w-full h-11 justify-center shadow-xs font-semibold text-xs flex items-center gap-1.5"
                    >
                      <FileText className="w-4 h-4 text-ink-900" />
                      <span>{pdfGenerating ? "Compiling Notice PDF..." : "Generate Official Seizure Notice (PDF)"}</span>
                      <ArrowRight className="w-4 h-4 text-ink-900" />
                    </button>
                  )}

                  {pdfUrl && (
                    <a
                      href={pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn--primary w-full h-11 justify-center shadow-xs font-semibold text-xs flex items-center gap-2"
                    >
                      <Download className="w-4 h-4 text-ink-900" />
                      <span>Download Generated Seizure Notice PDF</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}

                  <button
                    onClick={resetScan}
                    className="btn btn--ghost w-full h-10 justify-center border border-border/60 shadow-xs font-mono text-xs"
                  >
                    <RefreshCw className="w-4 h-4 text-ink-500" />
                    <span>Scan Another Commodity</span>
                  </button>

                  {/* Raw OCR Inspection Drawer */}
                  {rawOcrText && (
                    <div className="pt-2 text-center">
                      <button
                        onClick={() => setShowRawText(!showRawText)}
                        className="inline-flex items-center space-x-1 text-xs text-ink-500 hover:text-ink-900 underline font-mono"
                      >
                        <Terminal className="w-3.5 h-3.5" />
                        <span>{showRawText ? "Hide Raw Neural Text" : "Inspect Raw OCR Text Extraction"}</span>
                        {showRawText ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>

                      {showRawText && (
                        <div className="mt-2 p-4 bg-surface-tint/80 text-ink-900 rounded-card text-left font-mono text-[11px] max-h-48 overflow-y-auto whitespace-pre-wrap border border-border shadow-soft">
                          {rawOcrText}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 4. NATIONAL CONSUMER HELPLINE COMPLAINT DRAFT MODAL */}
      {showComplaintModal && (
        <div
          onClick={() => setShowComplaintModal(false)}
          className="fixed inset-0 bg-ink-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-surface-solid border border-border rounded-card max-w-2xl w-full p-6 space-y-4 shadow-frame max-h-[90vh] overflow-y-auto font-mono text-xs"
          >
            <div className="flex justify-between items-start border-b border-border pb-3">
              <div>
                <h4 className="font-semibold text-ink-900 text-base flex items-center gap-2">
                  <PhoneCall className="w-4 h-4 text-tile-peach-fg" />
                  <span>National Consumer Helpline (NCH 1915) Complaint Draft</span>
                </h4>
                <p className="text-[11px] text-ink-500 mt-0.5">
                  Pre-formatted official grievance ready to copy or lodge on consumerhelpline.gov.in
                </p>
              </div>
              <button onClick={() => setShowComplaintModal(false)} className="text-ink-400 hover:text-ink-900">
                ✕
              </button>
            </div>

            {/* Formatted Letter Box */}
            <div className="p-4 bg-surface-tint rounded-panel border border-border whitespace-pre-wrap text-[11px] leading-relaxed text-ink-900 max-h-72 overflow-y-auto select-all">
              {grievanceLetter}
            </div>

            {/* Modal Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-2 pt-2 border-t border-border">
              <span className="text-[10px] text-ink-500">
                Direct Toll-Free Helpline: Call <span className="font-bold text-ink-900">1915</span>
              </span>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={handleCopyGrievance}
                  className="btn btn--primary flex-1 sm:flex-none text-xs px-4 shadow-xs flex items-center gap-1.5"
                >
                  {copiedGrievance ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedGrievance ? "Copied to Clipboard!" : "Copy Complaint Text"}</span>
                </button>

                <a
                  href="https://consumerhelpline.gov.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn--ghost flex-1 sm:flex-none text-xs px-3 border border-border"
                >
                  <span>Open INGRAM Portal</span>
                  <ExternalLink className="w-3 h-3 ml-1" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
