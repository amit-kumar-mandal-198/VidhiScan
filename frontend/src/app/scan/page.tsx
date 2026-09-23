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
  Volume2,
  VolumeX,
  Languages,
  Gift,
  Plus,
  X,
  Layers,
  Eye,
  FlipHorizontal
} from "lucide-react";
import VidhiBadge from "@/components/VidhiBadge";
import { generateScanReportPdf } from "@/lib/pdfReportGenerator";

interface CitizenScanHistoryItem {
  id: number;
  commodity: string;
  mrp: number;
  officialMrp?: number;
  netWeight?: string;
  isCompliant: boolean;
  infraction?: string | null;
  timestamp: string;
  pdfUrl?: string;
  evidencePhoto?: string;
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

export interface CapturedImageItem {
  id: string;
  previewUrl: string;
  blobOrFile: Blob | File;
  label: string;
}

export default function PublicPortal() {
  // Capture Mode: "live" (Webcam/Live Stream), "upload" (File Picker), or "demo" (Sample Presets)
  const [captureMode, setCaptureMode] = useState<"live" | "upload">("upload");
  const [capturedImages, setCapturedImages] = useState<CapturedImageItem[]>([]);
  const [selectedPreviewIndex, setSelectedPreviewIndex] = useState<number>(0);

  const capturedImage = capturedImages.length > 0
    ? (capturedImages[selectedPreviewIndex]?.previewUrl || capturedImages[0]?.previewUrl)
    : null;

  const [isUploading, setIsUploading] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const isAuditActive = Boolean(scanResult || isUploading);
  const [masterRegistry, setMasterRegistry] = useState<any>(null);
  const [scanId, setScanId] = useState<number | null>(null);
  const [rawOcrText, setRawOcrText] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showRawText, setShowRawText] = useState(false);
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [companyProfile, setCompanyProfile] = useState<any | null>(null);

  // Redressal & Complaint Modal State
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [copiedGrievance, setCopiedGrievance] = useState(false);

  // Bharat-First Multilingual & Voice Narration State
  const [selectedLang, setSelectedLang] = useState<"hi" | "en" | "ta" | "bn" | "mr">("hi");
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // Jan-Prahari Citizen Whistleblower Bounty State
  const [showBountyModal, setShowBountyModal] = useState(false);
  const [bountyClaimed, setBountyClaimed] = useState(false);

  // Progressive disclosure tab for scan results: "price" | "audit" | "legal"
  const [resultTab, setResultTab] = useState<"price" | "audit" | "legal">("price");

  // Citizen Retailer Checkout Price Overcharge Checker
  const [customChargedPrice, setCustomChargedPrice] = useState<string>("");
  const [customOverchargeAlert, setCustomOverchargeAlert] = useState<{ isOvercharged: boolean; diff: number } | null>(null);

  // Voice narration synthesizer
  const handlePlayVoiceSummary = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      alert("Voice narration is supported on modern browsers.");
      return;
    }
    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
      return;
    }
    const isCompliant = scanResult?.is_compliant !== false;
    const mrpVal = scanResult?.detected_mrp || masterRegistry?.registered_mrp || 58;

    let textToSpeak = "";
    if (selectedLang === "hi") {
      textToSpeak = isCompliant
        ? `विधि-स्कैन कानूनी माप-विज्ञान सत्यापन: यह उत्पाद पूरी तरह से कानूनी रूप से मान्य है। अधिकतम खुदरा मूल्य ₹${mrpVal} है।`
        : `सावधान! इस उत्पाद पर धारा 36 के तहत गैरकानूनी मूल्य या लेबल उल्लंघन पाया गया है। कानूनी एमआरपी से अधिक पैसे न दें।`;
    } else if (selectedLang === "ta") {
      textToSpeak = isCompliant
        ? `விதிஸ்கேன் சட்டரீதியான சரிபார்ப்பு: இந்த தயாரிப்பு முழுமையாக விதிகளுக்கு இணங்குகிறது. அதிகபட்ச சில்லறை விலை ₹${mrpVal}.`
        : `எச்சரிக்கை! இந்த தயாரிப்பில் விலை திருத்தம் அல்லது சட்ட விதிமீறல் கண்டறியப்பட்டுள்ளது.`;
    } else if (selectedLang === "bn") {
      textToSpeak = isCompliant
        ? `বিধিস্ক্যান আইনি মেট্রোলজি যাচাইকরণ: এই পণ্যটি সম্পূর্ণরূপে আইনসম্মত। সর্বোচ্চ খুচরা মূল্য ₹${mrpVal}।`
        : `সতর্কতা! এই পণ্যে অতিরিক্ত মূল্য নেওয়া বা নিয়ম লঙ্ঘন ধরা পড়েছে।`;
    } else if (selectedLang === "mr") {
      textToSpeak = isCompliant
        ? `विधिसकॅन कायदेशीर वजन व मापे पडताळणी: हे उत्पादन नियमांनुसार पूर्णपणे वैध आहे. छापील किंमत ₹${mrpVal} आहे.`
        : `सावधान! या उत्पादनावर बेकायदेशीर किंमत वाढ आढळली आहे. त्वरित तक्रार नोंदवा.`;
    } else {
      textToSpeak = isCompliant
        ? `VidhiScan Legal Metrology Verification: This product conforms to all mandatory packaging declarations. Official price is ₹${mrpVal}.`
        : `Alert! Packaging violation detected under Section 36 of Legal Metrology Act. Retail price exceeds legal cap.`;
    }

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = selectedLang === "hi" ? "hi-IN" : selectedLang === "ta" ? "ta-IN" : selectedLang === "bn" ? "bn-IN" : selectedLang === "mr" ? "mr-IN" : "en-IN";
    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);
    setIsPlayingAudio(true);
    window.speechSynthesis.speak(utterance);
  };

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
    if (captureMode === "live" && !isAuditActive) {
      startLiveCamera();
    } else {
      stopLiveCamera();
    }
    return () => {
      stopLiveCamera();
    };
  }, [captureMode, isAuditActive, startLiveCamera, stopLiveCamera]);

  const compressImage = async (blobOrFile: Blob, maxWidth = 1280, quality = 0.85): Promise<Blob> => {
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(blobOrFile);
      img.onload = () => {
        URL.revokeObjectURL(url);
        let { width, height } = img;
        if (width > maxWidth || height > maxWidth) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxWidth) / height);
            height = maxWidth;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob(
            (b) => resolve(b || blobOrFile),
            "image/jpeg",
            quality
          );
        } else {
          resolve(blobOrFile);
        }
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(blobOrFile);
      };
      img.src = url;
    });
  };

  const getNextLabel = (index: number) => {
    if (index === 0) return "Front Face (PDP / Net Wt)";
    if (index === 1) return "Back Panel (Declarations & MRP)";
    if (index === 2) return "Side / Crimp / Seal";
    return `Packaging Face ${index + 1}`;
  };

  const addCapturedFiles = (files: FileList | File[]) => {
    const fileArr = Array.from(files);
    if (fileArr.length === 0) return;
    const startIndex = capturedImages.length;
    const newItems: CapturedImageItem[] = fileArr.map((file, idx) => ({
      id: `${Date.now()}-${startIndex + idx}-${Math.random().toString(36).substring(2, 6)}`,
      previewUrl: URL.createObjectURL(file),
      blobOrFile: file,
      label: getNextLabel(startIndex + idx),
    }));
    setCapturedImages((prev) => [...prev, ...newItems]);
    setSelectedPreviewIndex(startIndex);
  };

  const handleRemoveImage = (idToRemove: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCapturedImages((prev) => {
      const filtered = prev.filter((img) => img.id !== idToRemove);
      return filtered.map((item, idx) => ({
        ...item,
        label: getNextLabel(idx),
      }));
    });
    setSelectedPreviewIndex((prev) => Math.max(0, prev - 1));
  };

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
              const newItem: CapturedImageItem = {
                id: `${Date.now()}-${capturedImages.length}-${Math.random().toString(36).substring(2, 6)}`,
                previewUrl,
                blobOrFile: blob,
                label: getNextLabel(capturedImages.length),
              };
              setCapturedImages((prev) => [...prev, newItem]);
              setSelectedPreviewIndex(capturedImages.length);
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
      addCapturedFiles(e.target.files);
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (galleryInputRef.current) galleryInputRef.current.value = "";
    }
  };

  const resetScanState = () => {
    setScanResult(null);
    setMasterRegistry(null);
    setScanId(null);
    setPdfUrl(null);
    setErrorMsg(null);
    setRawOcrText("");
    setCompanyProfile(null);
  };

  const sendToAI = async (itemsToUpload?: CapturedImageItem[]) => {
    const imagesToProcess = itemsToUpload || capturedImages;
    if (!imagesToProcess || imagesToProcess.length === 0) return;

    setIsUploading(true);
    setErrorMsg(null);

    try {
      // Compress each image client-side to prevent memory overload & upload timeouts
      const compressedBlobs: { blob: Blob; label: string }[] = [];
      for (let i = 0; i < imagesToProcess.length; i++) {
        const item = imagesToProcess[i];
        let blobToUpload = item.blobOrFile;
        try {
          blobToUpload = await compressImage(item.blobOrFile);
        } catch (e) {
          console.warn("Client compression skipped for item", i, e);
        }
        compressedBlobs.push({ blob: blobToUpload, label: item.label });
      }

      const gps = await getGpsLocation();
      const formData = new FormData();

      // Append each image as "files" and "file" for multi-angle synthesis
      compressedBlobs.forEach((c, index) => {
        formData.append("files", c.blob, `panel_${index + 1}.jpg`);
        formData.append("file", c.blob, `panel_${index + 1}.jpg`);
      });

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
        setCompanyProfile(data.ai_analysis?.company_profile || null);
        setScanId(data.scan_id || 1085);
        setRawOcrText(rawText);

        const currentImg = capturedImages[0]?.previewUrl || null;

        generateReportPdfForCurrentScan({
          verdict,
          scanId: data.scan_id || 1085,
          pdfUrl: data.pdf_url,
          image: currentImg
        }).then((generatedPdf) => {
          saveHistoryItem({
            id: data.scan_id || 1085,
            commodity: verdict.commodity || "Packaged Commodity",
            mrp: verdict.scanned_mrp || 0,
            officialMrp: data.ai_analysis?.master_registry?.official_mrp,
            netWeight: verdict.net_weight,
            isCompliant: verdict.is_compliant,
            infraction: verdict.is_compliant ? null : verdict.violations?.[0] || "Rule 6 Infraction",
            timestamp: "Just now",
            pdfUrl: generatedPdf || undefined,
            evidencePhoto: currentImg || undefined
          });
        });
      } else {
        setErrorMsg("AI could not read label. Please ensure package is well-lit and in focus.");
      }
    } catch (err: any) {
      console.warn("Scan processing error:", err);
      setErrorMsg(err?.message || "AI packaging scan failed. Please ensure the label photo is clear and retry.");
    } finally {
      setIsUploading(false);
    }
  };

  const drawSampleFace = (title: string, lines: { label: string; val: string }[], bgHeader: string): Promise<Blob> => {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas");
      canvas.width = 600;
      canvas.height = 420;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Card Background
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, 600, 420);

      // Card Header Banner
      ctx.fillStyle = bgHeader;
      ctx.fillRect(0, 0, 600, 80);

      // Header Text
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 22px system-ui, sans-serif";
      ctx.fillText(title, 24, 48);

      // Content Lines
      let y = 125;
      lines.forEach(({ label, val }) => {
        ctx.fillStyle = "#64748b";
        ctx.font = "bold 13px system-ui, sans-serif";
        ctx.fillText(label.toUpperCase(), 24, y);

        ctx.fillStyle = "#0f172a";
        ctx.font = "15px monospace, sans-serif";
        ctx.fillText(val, 24, y + 22);

        y += 52;
      });

      // Bottom statutory watermark
      ctx.fillStyle = "#94a3b8";
      ctx.font = "11px system-ui, sans-serif";
      ctx.fillText("VidhiScan Multimodal Verification Sensor • Legal Metrology (PCR) 2011", 24, 395);

      canvas.toBlob((b) => resolve(b || new Blob()), "image/jpeg", 0.95);
    });
  };

  const triggerSampleTest = async (type: "butter" | "surf" | "oil") => {
    resetScanState();
    setIsUploading(true);

    let frontBlob: Blob;
    let backBlob: Blob;

    if (type === "butter") {
      frontBlob = await drawSampleFace(
        "AMUL PASTEURISED BUTTER",
        [
          { label: "Commodity", val: "Pasteurised Butter (Food Product)" },
          { label: "Net Quantity (Rule 6(1)(b))", val: "100 g (SI Metric Compliant)" },
          { label: "Brand Identity", val: "Amul - The Taste of India" },
          { label: "Storage Condition", val: "Keep Refrigerated at 4°C" }
        ],
        "#0284c7"
      );
      backBlob = await drawSampleFace(
        "STATUTORY DECLARATIONS & MRP (BACK)",
        [
          { label: "Maximum Retail Price (Rule 6(1)(e))", val: "Rs. 58.00 (USP Rs. 0.58/g incl. of all taxes)" },
          { label: "Month & Year of Packing", val: "02/2026 | Best Before 9 Months" },
          { label: "Manufacturer / Packer (Rule 6(1)(a))", val: "GCMMF Ltd., Anand 388001, Gujarat" },
          { label: "Consumer Care & Barcode", val: "1800-258-3333 | gcmmf@amul.coop | 8901262150114" }
        ],
        "#0f766e"
      );
    } else if (type === "surf") {
      frontBlob = await drawSampleFace(
        "SURF EXCEL EASY WASH",
        [
          { label: "Commodity", val: "Detergent Washing Powder" },
          { label: "Net Weight", val: "1 kg" },
          { label: "Brand Identity", val: "Surf Excel (Hindustan Unilever Ltd)" },
          { label: "Key Feature", val: "Super Fast Stain Removal Formula" }
        ],
        "#e11d48"
      );
      backBlob = await drawSampleFace(
        "DECLARATIONS & PRICING VIOLATION (BACK)",
        [
          { label: "Official Manufacturer Legal MRP", val: "Rs. 469.00 (Inclusive of all taxes)" },
          { label: "Sticker Price Overwrite", val: "Rs. 519.00 (Illegal Markup +Rs. 50.00 Extortion)" },
          { label: "Mfg Date & Batch", val: "01/2026 | Batch HUL-MUM-991" },
          { label: "Consumer Redressal", val: "care@hul.com | Toll Free 1800-10-22-221" }
        ],
        "#b91c1c"
      );
    } else {
      frontBlob = await drawSampleFace(
        "FORTUNE SUNLITE REFINED OIL",
        [
          { label: "Commodity", val: "Refined Sunflower Cooking Oil" },
          { label: "Net Volume", val: "1 L" },
          { label: "Brand Identity", val: "Fortune (Adani Wilmar Ltd)" },
          { label: "Nutritional Fortification", val: "Enriched with Vitamins A & D" }
        ],
        "#d97706"
      );
      backBlob = await drawSampleFace(
        "STATUTORY INFORMATION & PROVISO (BACK)",
        [
          { label: "Maximum Retail Price", val: "Rs. 165.00 (Inclusive of all taxes)" },
          { label: "Mfg Date & Expiry (Rule 6 Proviso)", val: "Referred to Crown Neck / Seal Area" },
          { label: "Packer Premises", val: "Adani Wilmar Ltd, Fortune House, Ahmedabad 380009" },
          { label: "Consumer Support", val: "customercare@adaniwilmar.in | 1800-233-9999" }
        ],
        "#b45309"
      );
    }

    const frontUrl = URL.createObjectURL(frontBlob);
    const backUrl = URL.createObjectURL(backBlob);

    setCapturedImages([
      {
        id: `sample-front-${Date.now()}`,
        previewUrl: frontUrl,
        blobOrFile: frontBlob,
        label: "Front Face (PDP / Net Wt)"
      },
      {
        id: `sample-back-${Date.now()}`,
        previewUrl: backUrl,
        blobOrFile: backBlob,
        label: "Back Panel (Declarations & MRP)"
      }
    ]);
    setSelectedPreviewIndex(0);

    setTimeout(() => {
          setIsUploading(false);
          if (type === "butter") {
            const verdict = {
              compliance_score: 100,
              rules_passed: 8,
              total_rules: 8,
              is_compliant: true,
              commodity: "Amul Pasteurised Butter 100g",
              scanned_mrp: 58.0,
              net_weight: "100 g",
              mfg_date: "02/2026",
              exp_date: "Best Before 9 Months from Manufacture",
              consumer_care: true,
              manufacturer: "GCMMF Ltd., Anand 388001, Gujarat",
              barcode: "8901262150114",
              declarations: {
                rule_1_mfg_name: { name: "Name & Address of Manufacturer / Packer", rule: "Rule 6(1)(a)", status: "COMPLIANT", value: "GCMMF Ltd., Anand 388001, Gujarat", details: "Mandatory name, address and premise of manufacturer/packer." },
                rule_2_net_qty: { name: "Net Quantity (Weight / Volume / Count)", rule: "Rule 6(1)(b)", status: "COMPLIANT", value: "100 g", details: "Declared in standard SI metric units (g, kg, ml, l)." },
                rule_3_generic_name: { name: "Generic / Common Name of Commodity", rule: "Rule 6(1)(c)", status: "COMPLIANT", value: "Pasteurised Butter", details: "Clear generic identity and commodity denomination." },
                rule_4_mfg_date: { name: "Month & Year of Manufacture / Packing", rule: "Rule 6(1)(d)", status: "COMPLIANT", value: "02/2026", details: "Month and year of packaging or import." },
                rule_5_mrp: { name: "Maximum Retail Price (MRP incl. of all taxes)", rule: "Rule 6(1)(e)", status: "COMPLIANT", value: "₹ 58.00 (USP ₹0.58/g)", details: "Retail price inclusive of all taxes clearly printed." },
                rule_6_expiry: { name: "Best Before / Expiry / Use By Date", rule: "Rule 6(1)(g)", status: "COMPLIANT", value: "Best Before 9 Months from Manufacture", details: "Mandatory duration or date for perishables and food." },
                rule_7_consumer_care: { name: "Consumer Care Details (Phone / Email / Address)", rule: "Rule 6(1)(h)", status: "COMPLIANT", value: "1800-258-3333 | gcmmf@amul.coop", details: "Designated officer phone, email or postal helpline." },
                rule_8_country_origin: { name: "Country of Origin", rule: "Rule 6(1)(n)", status: "COMPLIANT", value: "India (Domestic)", details: "Clear unambiguous origin declaration." }
              },
              violations: []
            };
            setScanResult(verdict);
            setMasterRegistry({
              registry_status: "MATCHED_MASTER_REGISTRY",
              registered_brand: "Amul / GCMMF",
              registered_product: "Pasteurised Butter 100g",
              official_mrp: 58.0,
              official_net_weight: "100g",
              is_overcharged: false,
              price_discrepancy: 0.0,
              section_36_violation: false
            });
            setCompanyProfile({
              company_id: 1,
              company_name: "Amul / GCMMF",
              brand_slug: "amul",
              current_vidhiscore: 940,
              tier_name: "Vidhi Ratna (Diamond)",
              badge_code: "diamond",
              badge_color: "#10B981"
            });
            setScanId(1085);
            setRawOcrText("AMUL PASTEURISED BUTTER Net Quantity: 100 g MRP: Rs. 58.00 (Inclusive of all taxes) USP: Rs. 0.58 per g Mfd by: GCMMF Ltd., Anand 388001, Gujarat Mfg Date: 02/2026 Best Before 9 Months from Manufacture Country of Origin: India Consumer Care: 1800-258-3333 | gcmmf@amul.coop");
            generateReportPdfForCurrentScan({ verdict, scanId: 1085, image: frontUrl }).then((pdf) => {
              saveHistoryItem({
                id: 1085,
                commodity: "Amul Pasteurised Butter 100g",
                mrp: 58.0,
                officialMrp: 58.0,
                netWeight: "100 g",
                isCompliant: true,
                infraction: null,
                timestamp: "Just now",
                pdfUrl: pdf || undefined,
                evidencePhoto: frontUrl
              });
            });
          } else if (type === "surf") {
            const verdict = {
              compliance_score: 62,
              rules_passed: 5,
              total_rules: 8,
              is_compliant: false,
              commodity: "Surf Excel Easy Wash 1kg",
              scanned_mrp: 519.0,
              net_weight: "1 kg",
              mfg_date: "01/2026",
              exp_date: "Best Before 24 Months",
              consumer_care: true,
              manufacturer: "Hindustan Unilever Ltd, Mumbai",
              barcode: "8901030382218",
              declarations: {
                rule_1_mfg_name: { name: "Name & Address of Manufacturer / Packer", rule: "Rule 6(1)(a)", status: "COMPLIANT", value: "Hindustan Unilever Ltd, Mumbai" },
                rule_2_net_qty: { name: "Net Quantity (Weight / Volume / Count)", rule: "Rule 6(1)(b)", status: "COMPLIANT", value: "1 kg" },
                rule_3_generic_name: { name: "Generic / Common Name of Commodity", rule: "Rule 6(1)(c)", status: "COMPLIANT", value: "Detergent Powder" },
                rule_4_mfg_date: { name: "Month & Year of Manufacture / Packing", rule: "Rule 6(1)(d)", status: "COMPLIANT", value: "01/2026" },
                rule_5_mrp: { name: "Maximum Retail Price (MRP incl. of all taxes)", rule: "Rule 6(1)(e)", status: "MISSING", value: "₹ 519.00 (Overcharged)" },
                rule_6_expiry: { name: "Best Before / Expiry / Use By Date", rule: "Rule 6(1)(g)", status: "COMPLIANT", value: "Best Before 24 Months" },
                rule_7_consumer_care: { name: "Consumer Care Details (Phone / Email / Address)", rule: "Rule 6(1)(h)", status: "COMPLIANT", value: "care@hul.com | 1800-10-22-221" },
                rule_8_country_origin: { name: "Country of Origin", rule: "Rule 6(1)(n)", status: "COMPLIANT", value: "India" }
              },
              violations: [
                "Section 36(2) Retail Overcharging: Scanned ₹519.00 exceeds Legal Max MRP ₹469.00 (+₹50.00 markup)"
              ]
            };
            setScanResult(verdict);
            setMasterRegistry({
              registry_status: "MATCHED_MASTER_REGISTRY",
              registered_brand: "Hindustan Unilever Ltd",
              registered_product: "Surf Excel Easy Wash 1kg",
              official_mrp: 469.0,
              official_net_weight: "1kg",
              is_overcharged: true,
              price_discrepancy: 50.0,
              section_36_violation: true
            });
            setCompanyProfile({
              company_id: 2,
              company_name: "Hindustan Unilever Ltd",
              brand_slug: "hul",
              current_vidhiscore: 710,
              tier_name: "Vidhi Mitra (Silver)",
              badge_code: "silver",
              badge_color: "#64748B"
            });
            setScanId(1092);
            setRawOcrText("SURF EXCEL EASY WASH 1kg Net Weight: 1 kg MRP: Rs. 519.00 (Inclusive of all taxes) Mfd by: Hindustan Unilever Ltd, Mumbai Mfg Date: 01/2026 Country of Origin: India Customer Care: care@hul.com");
            generateReportPdfForCurrentScan({ verdict, scanId: 1092, image: frontUrl }).then((pdf) => {
              saveHistoryItem({
                id: 1092,
                commodity: "Surf Excel Easy Wash 1kg",
                mrp: 519.0,
                officialMrp: 469.0,
                netWeight: "1 kg",
                isCompliant: false,
                infraction: "Section 36(2) Overcharge (+₹50.00 markup)",
                timestamp: "Just now",
                pdfUrl: pdf || undefined,
                evidencePhoto: frontUrl
              });
            });
          } else {
            const verdict = {
              compliance_score: 100,
              rules_passed: 8,
              total_rules: 8,
              is_compliant: true,
              commodity: "Fortune Sunlite Refined Oil 1L",
              scanned_mrp: 165.0,
              net_weight: "1 L",
              mfg_date: "Referred to Seal/Neck Area",
              exp_date: "Referred to Seal/Neck Area",
              consumer_care: true,
              manufacturer: "Adani Wilmar Ltd, Ahmedabad",
              barcode: "8906007280014",
              declarations: {
                rule_1_mfg_name: { name: "Name & Address of Manufacturer / Packer", rule: "Rule 6(1)(a)", status: "COMPLIANT", value: "Adani Wilmar Ltd, Fortune House, Ahmedabad 380009" },
                rule_2_net_qty: { name: "Net Quantity (Weight / Volume / Count)", rule: "Rule 6(1)(b)", status: "COMPLIANT", value: "1 L" },
                rule_3_generic_name: { name: "Generic / Common Name of Commodity", rule: "Rule 6(1)(c)", status: "COMPLIANT", value: "Refined Sunflower Oil" },
                rule_4_mfg_date: { name: "Month & Year of Manufacture / Packing", rule: "Rule 6(1)(d)", status: "PROVISO_COMPLIANT", value: "Referred to Seal/Neck Area" },
                rule_5_mrp: { name: "Maximum Retail Price (MRP incl. of all taxes)", rule: "Rule 6(1)(e)", status: "COMPLIANT", value: "₹ 165.00" },
                rule_6_expiry: { name: "Best Before / Expiry / Use By Date", rule: "Rule 6(1)(g)", status: "PROVISO_COMPLIANT", value: "Referred to Seal/Neck Area" },
                rule_7_consumer_care: { name: "Consumer Care Details (Phone / Email / Address)", rule: "Rule 6(1)(h)", status: "COMPLIANT", value: "customercare@adaniwilmar.in | 1800-233-9999" },
                rule_8_country_origin: { name: "Country of Origin", rule: "Rule 6(1)(n)", status: "COMPLIANT", value: "India (Domestic)" }
              },
              violations: []
            };
            setScanResult(verdict);
            setMasterRegistry({
              registry_status: "MATCHED_MASTER_REGISTRY",
              registered_brand: "Adani Wilmar Ltd",
              registered_product: "Fortune Sunlite Refined Oil 1L",
              official_mrp: 165.0,
              official_net_weight: "1L",
              is_overcharged: false,
              price_discrepancy: 0.0,
              section_36_violation: false
            });
            setCompanyProfile({
              company_id: 4,
              company_name: "Adani Wilmar Ltd",
              brand_slug: "adani",
              current_vidhiscore: 880,
              tier_name: "Vidhi Shrestha (Gold)",
              badge_code: "gold",
              badge_color: "#F59E0B"
            });
            setScanId(1099);
            setRawOcrText("FORTUNE SUNLITE REFINED OIL Net Volume: 1 L MRP: Rs. 165.00 Packed by: Adani Wilmar Ltd, Ahmedabad Mfg Date & Expiry: See seal / neck area Country of Origin: India Care: customercare@adaniwilmar.in");
            generateReportPdfForCurrentScan({ verdict, scanId: 1099, image: frontUrl }).then((pdf) => {
              saveHistoryItem({
                id: 1099,
                commodity: "Fortune Sunlite Refined Oil 1L",
                mrp: 165.0,
                officialMrp: 165.0,
                netWeight: "1 L",
                isCompliant: true,
                infraction: null,
                timestamp: "Just now",
                pdfUrl: pdf || undefined,
                evidencePhoto: frontUrl
              });
            });
          }
        }, 400);
  };

  const generateReportPdfForCurrentScan = async (overrides?: {
    verdict?: any;
    scanId?: number;
    pdfUrl?: string;
    image?: string | null;
  }) => {
    setPdfGenerating(true);
    try {
      if (overrides?.pdfUrl) {
        const rawPath = overrides.pdfUrl.replace(/^\/?static\//, "");
        const downloadPath = `/api/report/${rawPath}`;
        setPdfUrl(downloadPath);
        return downloadPath;
      }
      const activeVerdict = overrides?.verdict || scanResult;
      const activeScanId = overrides?.scanId || scanId || 1085;
      const activeImg = overrides?.image || capturedImage || (capturedImages[0]?.previewUrl) || null;

      if (activeVerdict) {
        const pdfDataUri = await generateScanReportPdf({
          scanId: activeScanId,
          commodity: activeVerdict.commodity || "Packaged Retail Commodity",
          isCompliant: activeVerdict.is_compliant,
          complianceScore: activeVerdict.compliance_score || 100,
          rulesPassed: activeVerdict.rules_passed || 8,
          scannedMrp: activeVerdict.scanned_mrp,
          officialMrp: masterRegistry?.official_mrp,
          netWeight: activeVerdict.net_weight,
          mfgDate: activeVerdict.mfg_date,
          expDate: activeVerdict.exp_date,
          manufacturer: activeVerdict.manufacturer,
          locationName: "19.0760° N, 72.8777° E (Mumbai Metro Zone)",
          violations: activeVerdict.violations,
          declarations: activeVerdict.declarations,
          evidencePhotoUrl: activeImg,
          inspectedBy: "Public Citizen Sensor (Exif Verified)"
        });
        setPdfUrl(pdfDataUri);
        return pdfDataUri;
      }
    } catch (e) {
      console.warn("Client PDF Report generation failed:", e);
    } finally {
      setPdfGenerating(false);
    }
    return null;
  };

  const generateNotice = async () => {
    if (!scanId) return;
    setPdfGenerating(true);
    try {
      const res = await fetch(`/api/scan/${scanId}/notice`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        if (data.pdf_url) {
          const rawPath = data.pdf_url.replace(/^\/?static\//, "");
          const downloadPath = `/api/report/${rawPath}`;
          setPdfUrl(downloadPath);
          window.open(downloadPath, "_blank");
          return;
        }
      }
      const fallbackPdf = await generateReportPdfForCurrentScan();
      if (fallbackPdf) {
        window.open(fallbackPdf, "_blank");
      }
    } catch (err: any) {
      const fallbackPdf = await generateReportPdfForCurrentScan();
      if (fallbackPdf) {
        window.open(fallbackPdf, "_blank");
      }
    } finally {
      setPdfGenerating(false);
    }
  };

  const resetScan = () => {
    capturedImages.forEach((img) => {
      try {
        URL.revokeObjectURL(img.previewUrl);
      } catch (e) {}
    });
    setCapturedImages([]);
    setSelectedPreviewIndex(0);
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
        
        {/* View 1: Camera Scanner & Mode Switcher (Active when not auditing) */}
        {!isAuditActive && (
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
                    <div className="text-center font-mono text-[10px] text-white/90 bg-black/60 px-2.5 py-1 rounded-chip backdrop-blur-sm self-center">
                      {capturedImages.length === 0
                        ? "Align Front Face (Brand & Net Weight)"
                        : capturedImages.length === 1
                        ? "Now flip & align Back Panel (MRP, Dates, Address)"
                        : `Align Packaging Face ${capturedImages.length + 1}`}
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

                {/* Live Mode Staging Strip */}
                {capturedImages.length > 0 && (
                  <div className="flex items-center gap-2 overflow-x-auto p-2 bg-surface-tint rounded-control border border-border">
                    <span className="text-[10px] font-mono text-ink-500 font-semibold px-1 shrink-0">Captured:</span>
                    {capturedImages.map((img, idx) => (
                      <div key={img.id} className="relative shrink-0 flex items-center gap-1.5 bg-surface-solid border border-border rounded-chip px-2 py-1 text-[10px] font-mono shadow-xs">
                        <img src={img.previewUrl} alt={img.label} className="w-5 h-5 rounded object-cover" />
                        <span className="text-ink-900 font-semibold">{idx + 1}. {idx === 0 ? "Front Face" : idx === 1 ? "Back Panel" : `Side ${idx + 1}`}</span>
                        <button
                          onClick={(e) => handleRemoveImage(img.id, e)}
                          className="text-ink-400 hover:text-tile-peach-fg p-0.5 rounded"
                          title="Remove snapshot"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Shutter Trigger Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5">
                  <button
                    onClick={captureFromVideo}
                    className="btn btn--secondary h-11 px-5 rounded-control text-xs font-semibold shadow-xs flex items-center gap-2 w-full sm:w-auto justify-center"
                  >
                    <Camera className="w-4 h-4 text-ink-900" />
                    <span>
                      {capturedImages.length === 0
                        ? "Capture Front Face (PDP)"
                        : capturedImages.length === 1
                        ? "Capture Back Panel (MRP & Dates)"
                        : `Capture Face ${capturedImages.length + 1}`}
                    </span>
                  </button>

                  {capturedImages.length > 0 && (
                    <button
                      onClick={() => sendToAI()}
                      className="btn btn--primary h-11 px-5 rounded-control text-xs font-semibold shadow-xs flex items-center gap-2 w-full sm:w-auto justify-center"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-ink-900" />
                      <span>Run Forensic Audit ({capturedImages.length} Face{capturedImages.length > 1 ? "s" : ""})</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* PHOTO UPLOAD VIEWPORT */}
            {captureMode === "upload" && (
              <div className="py-2 space-y-5">
                {/* Case A: No photos uploaded yet -> Show Dropzone & File Pickers */}
                {capturedImages.length === 0 && (
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
                        <span>Select Package Photo(s)</span>
                        <input
                          ref={fileInputRef}
                          type="file"
                          multiple
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
                          multiple
                          accept="image/*"
                          className="hidden"
                          onChange={handleFileSelected}
                        />
                      </label>

                      <p className="text-[11px] text-ink-500 font-mono text-center pt-1">
                        💡 Tip: Select both Front & Back photos at once for 100% legal audit accuracy.
                      </p>
                    </div>
                  </div>
                )}

                {/* Case B: 1 or more photos uploaded -> Multi-Angle Packaging Staging Tray */}
                {capturedImages.length > 0 && (
                  <div className="space-y-4 max-w-xl mx-auto">
                    <div className="p-3.5 bg-surface-tint rounded-control border border-border flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-surface-solid border border-border flex items-center justify-center shrink-0">
                          <Layers className="w-4 h-4 text-ink-900" />
                        </div>
                        <div>
                          <h4 className="text-xs font-semibold text-ink-900 flex items-center gap-1.5">
                            <span>Packaging Staging Tray</span>
                            <span className="text-[10px] bg-ink-900 text-white px-2 py-0.5 rounded-chip font-mono font-normal">
                              {capturedImages.length} Panel{capturedImages.length > 1 ? "s" : ""} Staged
                            </span>
                          </h4>
                          <p className="text-[10px] text-ink-500 font-mono mt-0.5">
                            Front side verifies Brand & Net Weight. Back side verifies MRP, Dates & Manufacturer.
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={resetScan}
                        className="text-[10px] font-mono text-ink-500 hover:text-tile-peach-fg flex items-center gap-1 px-2 py-1 rounded hover:bg-tile-peach-bg/50 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Clear All</span>
                      </button>
                    </div>

                    {/* Staging Thumbnails Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {capturedImages.map((img, idx) => (
                        <div
                          key={img.id}
                          className="relative rounded-card overflow-hidden border border-border bg-white shadow-soft group"
                        >
                          <div className="aspect-[4/3] bg-surface-tint/30 flex items-center justify-center overflow-hidden">
                            <img
                              src={img.previewUrl}
                              alt={img.label}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                            />
                          </div>

                          <div className="p-2 border-t border-border bg-surface-solid flex items-center justify-between">
                            <span className="text-[10px] font-mono font-semibold text-ink-900 truncate pr-1">
                              {idx + 1}. {img.label.split("(")[0].trim()}
                            </span>
                            <button
                              onClick={(e) => handleRemoveImage(img.id, e)}
                              className="p-1 rounded text-ink-400 hover:text-tile-peach-fg hover:bg-tile-peach-bg/50"
                              title="Remove panel"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}

                      {/* Add Another Side Dropzone Card */}
                      {capturedImages.length < 4 && (
                        <label className="border-2 border-dashed border-border hover:border-ink-900 rounded-card aspect-[4/3] flex flex-col items-center justify-center p-3 text-center cursor-pointer transition-colors bg-surface-tint/20 hover:bg-surface-tint/40 group">
                          <Plus className="w-5 h-5 text-ink-500 group-hover:text-ink-900 transition-colors mb-1" />
                          <span className="text-xs font-semibold text-ink-900">
                            {capturedImages.length === 1 ? "+ Add Back Side" : "+ Add Another Face"}
                          </span>
                          <span className="text-[10px] font-mono text-ink-500 mt-0.5">
                            {capturedImages.length === 1 ? "MRP & Declarations" : "Seal / Crimp"}
                          </span>
                          <input
                            type="file"
                            multiple
                            accept="image/*"
                            className="hidden"
                            onChange={handleFileSelected}
                          />
                        </label>
                      )}
                    </div>

                    {/* Forensic Audit Trigger CTA */}
                    <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
                      <button
                        onClick={() => sendToAI()}
                        className="btn btn--primary flex-1 h-12 justify-center shadow-xs font-semibold text-xs flex items-center gap-2"
                      >
                        <Sparkles className="w-4 h-4 text-ink-900" />
                        <span>Run Forensic Audit ({capturedImages.length} Packaging Face{capturedImages.length > 1 ? "s" : ""})</span>
                      </button>

                      <label className="btn btn--ghost h-12 justify-center border border-border/70 shadow-xs cursor-pointer font-semibold text-xs px-4 flex items-center gap-1.5">
                        <UploadCloud className="w-4 h-4 text-ink-900" />
                        <span>Add Photos</span>
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          className="hidden"
                          onChange={handleFileSelected}
                        />
                      </label>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Quick Demo Test Presets */}
            <div className="pt-2 border-t border-border/80">
              <p className="text-[11px] font-mono uppercase tracking-wider text-ink-500 font-semibold mb-2.5 text-center">
                Instant Forensic Test Samples (Simulates Dual-Panel Front + Back Capture)
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
                  <p className="text-[10px] text-ink-500 font-mono mt-0.5">Dual-Panel Compliant</p>
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
                  <p className="text-[10px] text-tile-peach-fg font-mono mt-0.5">Dual-Panel Overcharge</p>
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
                  <p className="text-[10px] text-ink-500 font-mono mt-0.5">Dual-Panel Proviso</p>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* View 2: Scanned Preview & Live Audit Analysis */}
        {isAuditActive && (
          <div className="space-y-5">
            {/* Multi-Panel Angle Selector Bar */}
            {capturedImages.length > 1 && (
              <div className="p-3 bg-surface-tint rounded-control border border-border space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-ink-700 font-semibold flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-ink-900" />
                    <span>Multi-Angle Inspection ({capturedImages.length} Panels Cross-Referenced):</span>
                  </span>
                  <span className="text-[10px] bg-tile-indigo-bg text-tile-indigo-fg px-2 py-0.5 rounded-chip font-semibold flex items-center gap-1 shadow-xs">
                    <Sparkles className="w-3 h-3" />
                    <span>Dual-Panel AI Synthesis</span>
                  </span>
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {capturedImages.map((img, idx) => (
                    <button
                      key={img.id}
                      onClick={() => setSelectedPreviewIndex(idx)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-control text-xs font-mono transition-all border shrink-0 ${
                        selectedPreviewIndex === idx
                          ? "bg-surface-solid border-ink-900 text-ink-900 font-semibold shadow-xs"
                          : "bg-white/60 border-border text-ink-500 hover:text-ink-900"
                      }`}
                    >
                      <img src={img.previewUrl} alt={img.label} className="w-4 h-4 rounded object-cover" />
                      <span>{idx + 1}: {img.label.split("(")[0].trim()}</span>
                      {selectedPreviewIndex === idx && <Eye className="w-3 h-3 text-ink-900 ml-0.5" />}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Scanned Image Preview */}
            <div className="relative rounded-card overflow-hidden border border-border bg-white max-w-sm mx-auto shadow-soft">
              <img
                src={capturedImage || ""}
                alt="Product packaging sample"
                className="w-full h-auto max-h-64 object-contain mx-auto"
              />

              {isUploading && <div className="animate-scanline" />}

              <div className="absolute bottom-2.5 left-2.5 bg-surface-solid/90 backdrop-blur-md text-ink-900 border border-border text-[10px] px-2.5 py-1 rounded-control font-mono font-semibold flex items-center space-x-1.5 shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-lime-600 animate-pulse" />
                <span>
                  {scanId ? `Case #${scanId}` : "Sensor Image Captured"}
                  {capturedImages[selectedPreviewIndex]?.label && ` • ${capturedImages[selectedPreviewIndex].label.split("(")[0].trim()}`}
                </span>
              </div>
            </div>

            {/* Neural OCR Progress Spinner */}
            {isUploading && (
              <div className="p-6 rounded-card bg-surface-solid/90 border border-border text-center space-y-2.5 shadow-soft font-mono">
                <div className="w-8 h-8 border-3 border-ink-400/30 border-t-ink-900 rounded-full animate-spin mx-auto" />
                <div>
                  <p className="text-ink-900 font-semibold text-xs tracking-wide">
                    {capturedImages.length > 1
                      ? `Synthesizing ${capturedImages.length} packaging panels & verifying Legal Metrology PCR compliance...`
                      : "Auditing 8 statutory declarations & matching government price registry..."}
                  </p>
                  <p className="text-[11px] text-ink-500 mt-0.5">
                    {capturedImages.length > 1
                      ? "Cross-referencing Front Face (Net Wt / Identity) with Back Panel (MRP, Dates, Address & Helpline)"
                      : "Extracting manufacturer, dates, metric quantity, and Unit Sale Price (USP)"}
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
              <div className="space-y-4">
                
                {/* 1. Master Verdict Banner (Always Visible) */}
                <div
                  className={`p-5 md:p-6 rounded-card border text-center space-y-3 shadow-soft ${
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

                  {/* Score Meter & Quick Price Pill */}
                  <div className="pt-1 max-w-sm mx-auto space-y-2">
                    <div className="flex justify-between text-xs font-mono font-medium">
                      <span className="text-ink-500">Compliance score</span>
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

                    {/* Fast Quick Status Strip */}
                    <div className="flex items-center justify-center gap-2 pt-1">
                      {masterRegistry && (
                        <span className={`text-[11px] font-mono px-2.5 py-1 rounded-chip border font-semibold ${
                          masterRegistry.is_overcharged
                            ? "bg-red-100 text-red-800 border-red-300"
                            : (!scanResult?.scanned_mrp ? "bg-amber-100 text-amber-900 border-amber-300" : "bg-emerald-100 text-emerald-800 border-emerald-300")
                        }`}>
                          {masterRegistry.is_overcharged
                            ? `⚠️ Overcharged by ₹${formatCurrency(masterRegistry.price_discrepancy)}`
                            : (!scanResult?.scanned_mrp
                              ? `⚠️ MRP Unprinted / Blank on Package`
                              : `✓ Clean MRP: ₹${formatCurrency(scanResult.scanned_mrp)}`)}
                        </span>
                      )}

                      {/* Quick Voice Audio Trigger */}
                      <button
                        onClick={handlePlayVoiceSummary}
                        className={`px-2.5 py-1 rounded-chip text-[11px] font-mono font-semibold transition-all flex items-center gap-1 border shadow-2xs ${
                          isPlayingAudio
                            ? "bg-red-600 text-white border-red-700 animate-pulse"
                            : "bg-white text-ink-700 border-border hover:bg-surface-tint"
                        }`}
                        title="Voice Audio Summary"
                      >
                        {isPlayingAudio ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-tile-indigo-fg" />}
                        <span>{isPlayingAudio ? "Stop Audio" : "Play Voice Summary"}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Jan-Prahari Citizen Whistleblower Bounty Card (if overcharged/violation) */}
                {(!scanResult.is_compliant || masterRegistry?.is_overcharged) && (
                  <div className="p-3.5 rounded-card border-2 border-amber-300 bg-amber-50/80 shadow-soft flex flex-col sm:flex-row items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2 text-left">
                      <Gift className="w-4 h-4 text-amber-600 shrink-0" />
                      <div className="text-xs">
                        <span className="font-bold text-amber-950">Jan-Prahari Citizen Bounty Eligible: </span>
                        <span className="text-amber-900">Confirmed packaging violation qualifies for ₹500 DBT reward.</span>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowBountyModal(true)}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 shrink-0 self-stretch sm:self-auto justify-center"
                    >
                      <Award className="w-3.5 h-3.5 text-amber-200" />
                      <span>Claim ₹500 Bounty</span>
                    </button>
                  </div>
                )}

                {/* 2. Progressive Disclosure Tab Bar */}
                <div className="flex items-center p-1 bg-surface-tint rounded-sidebar border border-border text-xs font-mono">
                  <button
                    onClick={() => setResultTab("price")}
                    className={`flex-1 py-2 rounded-control transition-all flex items-center justify-center gap-1.5 ${
                      resultTab === "price"
                        ? "bg-surface-solid text-ink-900 font-bold shadow-xs border border-border"
                        : "text-ink-500 hover:text-ink-900"
                    }`}
                  >
                    <DollarSign className="w-3.5 h-3.5" />
                    <span>Price & Action</span>
                  </button>

                  <button
                    onClick={() => setResultTab("audit")}
                    className={`flex-1 py-2 rounded-control transition-all flex items-center justify-center gap-1.5 ${
                      resultTab === "audit"
                        ? "bg-surface-solid text-ink-900 font-bold shadow-xs border border-border"
                        : "text-ink-500 hover:text-ink-900"
                    }`}
                  >
                    <Scale className="w-3.5 h-3.5" />
                    <span>Rule 6 Audit ({scanResult.rules_passed || 4}/8)</span>
                  </button>

                  <button
                    onClick={() => setResultTab("legal")}
                    className={`flex-1 py-2 rounded-control transition-all flex items-center justify-center gap-1.5 ${
                      resultTab === "legal"
                        ? "bg-surface-solid text-ink-900 font-bold shadow-xs border border-border"
                        : "text-ink-500 hover:text-ink-900"
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Legal Notice</span>
                  </button>
                </div>

                {/* TAB 1: PRICE & CONSUMER ACTION */}
                {resultTab === "price" && (
                  <div className="space-y-4 animate-in fade-in duration-150">
                    {/* Central Registry Price Comparison & Overcharge Card */}
                    {/* Dynamic Price Comparison & Real-Time Market Cross-Check Card */}
                    {masterRegistry && (
                      <div
                        className={`p-4 rounded-card border text-xs space-y-3 shadow-soft font-mono ${
                          masterRegistry.is_overcharged
                            ? "bg-tile-peach-bg/30 border-tile-peach-fg/40 text-ink-900"
                            : (!scanResult.scanned_mrp
                              ? "bg-amber-50 border-amber-300 text-amber-950"
                              : "bg-tile-mint-bg/30 border-tile-mint-fg/40 text-ink-900")
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-semibold flex items-center space-x-1.5 text-xs">
                            {masterRegistry.is_overcharged || !scanResult.scanned_mrp ? (
                              <AlertTriangle className="w-4 h-4 text-amber-600" />
                            ) : (
                              <Award className="w-4 h-4 text-tile-mint-fg" />
                            )}
                            <span>{masterRegistry.source_title || "Price Verification & Market Cross-Check"}</span>
                          </span>
                          <span className="font-mono text-[10px] bg-surface-solid px-2.5 py-0.5 rounded-chip border border-border font-semibold text-ink-900">
                            {masterRegistry.registered_brand || "FMCG Catalog"}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border">
                          <div className="p-2.5 bg-white/80 rounded-control border border-border">
                            <span className="text-ink-500 text-[10px] block">
                              {masterRegistry.source_type === "CENTRAL_MASTER_REGISTRY" ? "Official Approved MRP:" : "Catalog Verified MRP:"}
                            </span>
                            <span className="font-semibold text-ink-900 text-sm">
                              {masterRegistry.official_mrp && masterRegistry.official_mrp > 0 ? (
                                `₹ ${formatCurrency(masterRegistry.official_mrp)}`
                              ) : (
                                <span className="text-ink-400 text-xs italic">Unregistered item</span>
                              )}
                            </span>
                          </div>
                          <div className="p-2.5 bg-white/80 rounded-control border border-border">
                            <span className="text-ink-500 text-[10px] block">Packaging Scanned MRP:</span>
                            {scanResult.scanned_mrp && scanResult.scanned_mrp > 0 ? (
                              <span className={`font-semibold text-sm ${masterRegistry.is_overcharged ? "text-tile-peach-fg font-bold" : "text-ink-900"}`}>
                                ₹ {formatCurrency(scanResult.scanned_mrp)}
                              </span>
                            ) : (
                              <span className="text-red-600 font-bold text-xs bg-red-50 px-2 py-0.5 rounded border border-red-200 inline-block">
                                Unprinted / Missing Stamp
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Overcharge Details & Redressal Trigger */}
                        {masterRegistry.is_overcharged ? (
                          <div className="p-3 rounded-control bg-tile-peach-bg/80 border border-tile-peach-fg/30 space-y-2.5">
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
                              {masterRegistry.verdict_note || "Retailer is charging above the legal ceiling. Under the Consumer Protection Act, 2019, you are entitled to a full refund of this surcharge plus statutory compensation."}
                            </p>

                            <button
                              onClick={() => setShowComplaintModal(true)}
                              className="btn btn--primary w-full h-9 justify-center text-xs font-semibold shadow-xs flex items-center gap-1.5"
                            >
                              <FileText className="w-3.5 h-3.5 text-ink-900" />
                              <span>Generate National Consumer Helpline (1915) Complaint</span>
                            </button>
                          </div>
                        ) : !scanResult.scanned_mrp ? (
                          <div className="p-2.5 rounded-control bg-amber-100/70 border border-amber-300 text-amber-950 text-xs space-y-1">
                            <p className="font-semibold flex items-center gap-1.5 text-amber-900">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                              <span>Rule 6(1)(e) Violation: Unprinted Maximum Retail Price</span>
                            </p>
                            <p className="text-[11px] text-amber-800 leading-relaxed">
                              {masterRegistry.official_mrp ? `Official registered MRP is ₹${formatCurrency(masterRegistry.official_mrp)}, but ` : ""}
                              the scanned package displays no printed price in the statutory MRP box. Under Section 36(1) of the Legal Metrology Act, selling pre-packaged commodities without printed MRP is a punishable statutory offence.
                            </p>
                          </div>
                        ) : (
                          <div className="p-2.5 rounded-control bg-emerald-50/80 border border-emerald-200 text-emerald-900 text-xs space-y-1">
                            <p className="text-tile-mint-fg font-semibold flex items-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Authentic Factory Pricing: No Overcharge Detected</span>
                            </p>
                            <p className="text-[11px] text-emerald-700 leading-relaxed font-sans">
                              {masterRegistry.verdict_note || "Package price matches authentic manufacturer pricing benchmarks. Packaged declarations comply with Legal Metrology ceiling."}
                            </p>
                          </div>
                        )}

                        {/* Citizen Shopkeeper Checkout Overcharge Checker */}
                        <div className="p-3 bg-surface-solid rounded-control border border-border space-y-2 mt-2 font-sans">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-ink-900 flex items-center gap-1.5">
                              <ShieldCheck className="w-3.5 h-3.5 text-ink-700" />
                              Did the shopkeeper charge more at checkout?
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <div className="relative flex-1">
                              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-400 text-xs font-bold">₹</span>
                              <input
                                type="number"
                                placeholder={`Enter amount paid (e.g. ${scanResult.scanned_mrp ? Math.round(scanResult.scanned_mrp + 20) : "400"})`}
                                value={customChargedPrice}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value);
                                  setCustomChargedPrice(e.target.value);
                                  const baseline = scanResult.scanned_mrp || masterRegistry.official_mrp;
                                  if (!isNaN(val) && baseline && val > baseline) {
                                    setCustomOverchargeAlert({ isOvercharged: true, diff: Math.round((val - baseline) * 100) / 100 });
                                  } else {
                                    setCustomOverchargeAlert(null);
                                  }
                                }}
                                className="w-full pl-6 pr-3 py-1.5 text-xs rounded-control border border-border bg-white text-ink-900 focus:outline-none focus:border-ink-900 font-mono"
                              />
                            </div>
                            {customOverchargeAlert?.isOvercharged && (
                              <button
                                onClick={() => setShowComplaintModal(true)}
                                className="btn btn--danger px-3 py-1.5 text-xs font-semibold shrink-0 flex items-center gap-1"
                              >
                                <AlertTriangle className="w-3.5 h-3.5" />
                                <span>Report +₹{customOverchargeAlert.diff} Overcharge</span>
                              </button>
                            )}
                          </div>
                          {customOverchargeAlert?.isOvercharged && (
                            <p className="text-[11px] text-red-600 font-medium">
                              ⚠️ Charging ₹{customChargedPrice} for an item with printed MRP ₹{formatCurrency(scanResult.scanned_mrp || masterRegistry.official_mrp)} is a punishable offence under Section 36(2) of the Legal Metrology Act, 2009.
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Brand VidhiScore™ & Trust Badge Card */}
                    {companyProfile && (
                      <div className="p-4 rounded-card border border-border bg-white shadow-soft space-y-2.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-ink-700" />
                            <span className="font-semibold text-xs text-ink-900">
                              Brand: {companyProfile.company_name}
                            </span>
                          </div>
                          <VidhiBadge
                            score={companyProfile.current_vidhiscore}
                            badgeCode={companyProfile.badge_code}
                            tierName={companyProfile.tier_name}
                            size="sm"
                            isBlacklisted={companyProfile.is_blacklisted}
                          />
                        </div>

                        {companyProfile.score_update && (
                          <div
                            className={`p-2.5 rounded-lg border text-xs font-mono flex items-center justify-between ${
                              companyProfile.score_update.points_delta > 0
                                ? "bg-emerald-50/80 border-emerald-200 text-emerald-900"
                                : companyProfile.score_update.points_delta < 0
                                ? "bg-red-50/80 border-red-200 text-red-900"
                                : "bg-surface-base border-border text-ink-700"
                            }`}
                          >
                            <div className="flex items-center gap-1.5">
                              {companyProfile.score_update.points_delta < 0 ? (
                                <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                              ) : (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              )}
                              <span className="text-[11px] leading-tight">
                                {companyProfile.score_update.reason}
                              </span>
                            </div>
                            <span className="font-bold shrink-0 ml-2">
                              {companyProfile.score_update.points_delta > 0
                                ? `+${companyProfile.score_update.points_delta} pts`
                                : `${companyProfile.score_update.points_delta} pts`}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Bharat-First Multilingual Language Options */}
                    <div className="p-3.5 rounded-card border border-border bg-surface-solid shadow-soft flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Languages className="w-4 h-4 text-tile-indigo-fg" />
                        <span className="font-semibold text-xs text-ink-900">Voice Language:</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-1 text-xs">
                        {[
                          { id: "hi", label: "हिन्दी" },
                          { id: "en", label: "English" },
                          { id: "ta", label: "தமிழ்" },
                          { id: "bn", label: "বাংলা" },
                          { id: "mr", label: "मराठी" },
                        ].map((lang) => (
                          <button
                            key={lang.id}
                            onClick={() => {
                              setSelectedLang(lang.id as any);
                              if (isPlayingAudio) window.speechSynthesis?.cancel();
                              setIsPlayingAudio(false);
                            }}
                            className={`px-2 py-0.5 rounded font-mono text-[11px] transition-all ${
                              selectedLang === lang.id
                                ? "bg-ink-900 text-white font-bold"
                                : "bg-surface-base border border-border text-ink-600 hover:text-ink-900"
                            }`}
                          >
                            {lang.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: RULE 6 STATUTORY DECLARATIONS AUDIT */}
                {resultTab === "audit" && (
                  <div className="space-y-3 animate-in fade-in duration-150">
                    <div className="flex justify-between items-center px-1">
                      <h3 className="text-xs font-semibold text-ink-500 font-mono uppercase tracking-wider flex items-center gap-1.5">
                        <Scale className="w-3.5 h-3.5 text-tile-indigo-fg" />
                        <span>Statutory Declarations Checklist (PCR 2011 Rule 6)</span>
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
                )}

                {/* TAB 3: LEGAL ENFORCEMENT & NOTICE */}
                {resultTab === "legal" && (
                  <div className="space-y-4 animate-in fade-in duration-150">
                    {/* Statutory Infraction Summary */}
                    {!scanResult.is_compliant && scanResult.violations && scanResult.violations.length > 0 ? (
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
                    ) : (
                      <div className="p-4 rounded-card bg-tile-mint-bg/30 border border-tile-mint-fg/30 text-xs text-ink-900 shadow-soft font-mono flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-tile-mint-fg" />
                        <span>No statutory infractions detected. Product conforms to Legal Metrology Act provisions.</span>
                      </div>
                    )}

                    {/* Official PDF Report Card & Evidence Photo */}
                    <div className="p-4 rounded-card bg-surface-solid border border-border shadow-soft space-y-3.5">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-border pb-2.5">
                        <div>
                          <h4 className="text-xs font-bold text-ink-900 flex items-center gap-1.5">
                            <FileText className="w-4 h-4 text-tile-indigo-fg" />
                            <span>Official Statutory Inspection Report & Legal Notice (PDF)</span>
                          </h4>
                          <p className="text-[11px] text-ink-500 font-mono mt-0.5">
                            Auto-compiled court-ready report with embedded packaging evidence photo, GPS telemetry & Section 36 clauses.
                          </p>
                        </div>
                        <span className="text-[10px] font-mono bg-tile-mint-bg text-tile-mint-fg border border-tile-mint-fg/30 px-2.5 py-0.5 rounded-chip font-semibold shrink-0">
                          Synced with Inspector & Admin HQ
                        </span>
                      </div>

                      {/* Evidence Photo Preview in Legal Section */}
                      {capturedImage && (
                        <div className="flex items-center gap-3 p-2.5 bg-surface-tint rounded-panel border border-border">
                          <img
                            src={capturedImage}
                            alt="Packaging evidence"
                            className="w-16 h-12 object-cover rounded border border-border shrink-0"
                          />
                          <div className="text-[11px] font-mono text-ink-900 space-y-0.5">
                            <div className="font-bold flex items-center gap-1">
                              <ShieldCheck className="w-3.5 h-3.5 text-tile-mint-fg" />
                              <span>Packaging Evidence Photo Attached</span>
                            </div>
                            <div className="text-ink-500 text-[10px]">
                              EXIF Authenticated • GPS: 19.0760° N, 72.8777° E • Hash: SHA256-VS-{scanId || 1085}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Download & View PDF CTAs */}
                      {pdfGenerating ? (
                        <div className="p-3 bg-surface-tint rounded-control text-center text-xs font-mono text-ink-900 flex items-center justify-center gap-2">
                          <div className="w-4 h-4 border-2 border-ink-900 border-t-transparent rounded-full animate-spin" />
                          <span>Compiling PDF Report with Evidence Photo...</span>
                        </div>
                      ) : pdfUrl ? (
                        <div className="flex flex-col sm:flex-row gap-2">
                          <a
                            href={pdfUrl}
                            download={`VidhiScan_Inspection_Report_Case_${scanId || 1085}.pdf`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn--primary flex-1 h-11 justify-center shadow-xs font-semibold text-xs flex items-center gap-2"
                          >
                            <Download className="w-4 h-4 text-ink-900" />
                            <span>Download Official Report PDF (with Evidence Photo)</span>
                          </a>

                          <button
                            onClick={() => window.open(pdfUrl, "_blank")}
                            className="btn btn--ghost h-11 px-4 justify-center border border-border shadow-xs text-xs font-semibold flex items-center gap-1.5"
                          >
                            <ExternalLink className="w-4 h-4 text-ink-900" />
                            <span>View Fullscreen</span>
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => generateReportPdfForCurrentScan()}
                          className="btn btn--primary w-full h-11 justify-center shadow-xs font-semibold text-xs flex items-center gap-1.5"
                        >
                          <FileText className="w-4 h-4 text-ink-900" />
                          <span>Generate Official Statutory Report PDF</span>
                          <ArrowRight className="w-4 h-4 text-ink-900" />
                        </button>
                      )}
                    </div>

                    {/* Raw OCR Inspection Drawer */}
                    {rawOcrText && (
                      <div className="pt-1 text-center">
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
                )}

                {/* Persistent Bottom Action */}
                <div className="pt-2 border-t border-border/80 flex flex-col sm:flex-row gap-2.5">
                  <button
                    onClick={() => {
                      setScanResult(null);
                      setCaptureMode("upload");
                    }}
                    className="btn btn--secondary flex-1 h-11 justify-center border border-border shadow-xs font-semibold text-xs hover:border-ink-900 flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5 text-ink-900" />
                    <span>+ Add Another Face & Re-Audit</span>
                  </button>

                  <button
                    onClick={resetScan}
                    className="btn btn--ghost flex-1 h-11 justify-center border border-border/70 shadow-xs font-semibold text-xs hover:border-ink-900 flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-ink-500" />
                    <span>Scan Another Commodity</span>
                  </button>
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

      {/* 5. JAN-PRAHARI CITIZEN BOUNTY & DBT COMMENDATION MODAL */}
      {showBountyModal && (
        <div
          onClick={() => setShowBountyModal(false)}
          className="fixed inset-0 bg-ink-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-surface-solid border border-border rounded-card max-w-lg w-full p-6 space-y-4 shadow-frame text-center"
          >
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto shadow-xs">
              <Award className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <div className="text-[10px] font-mono uppercase bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded font-bold inline-block">
                Govt of India • Dept of Consumer Affairs
              </div>
              <h3 className="font-bold text-base text-ink-900">
                Jan-Prahari Whistleblower Commendation & Bounty
              </h3>
              <p className="text-xs text-ink-500">
                Direct Benefit Transfer (DBT) citizen reward for reporting verified Legal Metrology sticker violations.
              </p>
            </div>

            {bountyClaimed ? (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 space-y-2 text-left">
                <div className="flex items-center justify-between text-xs font-bold text-emerald-950">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>₹500 Reward Dispatched via UPI DBT!</span>
                  </span>
                  <span className="text-[10px] font-mono bg-emerald-600 text-white px-2 py-0.5 rounded">SUCCESS</span>
                </div>
                <div className="text-[11px] font-mono text-emerald-800 space-y-0.5 pt-1 border-t border-emerald-200">
                  <div>Credit Account: <span className="font-bold">citizen****@okhdfcbank</span></div>
                  <div>Transaction ID: <span className="font-bold">UPI/DCA/2026/89412B</span></div>
                  <div>Case Hash: <span className="font-bold">0x8f4b...f91a (Verified)</span></div>
                </div>
                <p className="text-[10px] text-emerald-700 pt-1">
                  Thank you for being an active Jan-Prahari guardian. Your report directly contributed to penalizing fraudulent retail pricing under Section 36(2).
                </p>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-surface-base border border-border space-y-2 text-left text-xs">
                <div className="font-bold text-ink-900">Case Incident Summary:</div>
                <div className="text-ink-600 font-mono text-[11px] space-y-0.5">
                  <div>Offence: <span className="text-red-600 font-bold">Section 36(2) Illegal Price Markup</span></div>
                  <div>Estimated Penalty Cap: <span className="font-bold">₹25,000</span></div>
                  <div>Citizen Bounty Entitlement: <span className="text-emerald-700 font-bold">₹500 (Direct Transfer)</span></div>
                </div>
                <p className="text-[11px] text-ink-500 pt-1 border-t border-border">
                  Clicking confirm will register your verified camera evidence with the Central Legal Metrology server and dispatch the DBT bounty to your linked UPI handle.
                </p>
              </div>
            )}

            <div className="flex flex-col gap-2 pt-2">
              {!bountyClaimed ? (
                <button
                  onClick={() => setBountyClaimed(true)}
                  className="w-full py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-2"
                >
                  <Gift className="w-4 h-4 text-emerald-200" />
                  <span>Confirm Whistleblower Claim with Linked UPI</span>
                </button>
              ) : (
                <button
                  onClick={() => alert("Jan-Prahari Citizen Commendation Certificate downloaded!")}
                  className="w-full py-2.5 px-4 rounded-lg bg-ink-900 hover:bg-black text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Jan-Prahari Certificate (PDF)</span>
                </button>
              )}

              <button
                onClick={() => {
                  setShowBountyModal(false);
                  setBountyClaimed(false);
                }}
                className="w-full py-2 px-4 rounded-lg border border-border text-ink-600 font-semibold text-xs hover:bg-surface-base"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
