import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const brand = searchParams.get("brand")?.toLowerCase() || "amul";
  const sku = searchParams.get("sku") || "SKU-99214";

  // Mock company verification data for e-commerce platforms (Blinkit, Zepto, Amazon, Instamart)
  const database: Record<string, any> = {
    amul: {
      brand: "Amul / GCMMF Ltd.",
      brandSlug: "amul",
      vidhiScore: 940,
      tier: "Vidhi Ratna (Diamond Elite)",
      badgeCode: "diamond",
      status: "APPROVED_FOR_SALE",
      isDefaulter: false,
      cartCheckoutAllowed: true,
      trustSealUrl: "https://vidhi-scan.vercel.app/seals/amul-diamond.svg",
      certifications: {
        legalMetrologyPcr2011: true,
        unitSalePriceCompliant: true,
        zeroTamperingHistory: true,
        cleanStreakDays: 142
      },
      ecomDisplay: {
        badgeText: "VidhiScan Verified",
        badgeColor: "#10B981",
        label: "Accredited Legal Metrology Standard",
        disclaimer: "Verified factory-printed MRP and standard metric net quantity."
      }
    },
    hul: {
      brand: "Hindustan Unilever Ltd.",
      brandSlug: "hul",
      vidhiScore: 640,
      tier: "Vidhi Mitra (Silver Tier)",
      badgeCode: "silver",
      status: "APPROVED_WITH_CAUTION",
      isDefaulter: false,
      cartCheckoutAllowed: true,
      trustSealUrl: "https://vidhi-scan.vercel.app/seals/hul-silver.svg",
      certifications: {
        legalMetrologyPcr2011: true,
        unitSalePriceCompliant: true,
        zeroTamperingHistory: false,
        activeNoticesCount: 1
      },
      ecomDisplay: {
        badgeText: "Standard Compliant",
        badgeColor: "#64748B",
        label: "Periodic Metrology Audit Active",
        disclaimer: "Subject to random depot sampling. Price capped at registered MRP."
      }
    },
    kalyan: {
      brand: "Kalyan Relabeling & Counterfeit Syndicate",
      brandSlug: "kalyan",
      vidhiScore: 320,
      tier: "Defaulter (Red Flag)",
      badgeCode: "defaulter",
      status: "SUSPENDED_DELIST_ORDER",
      isDefaulter: true,
      cartCheckoutAllowed: false,
      trustSealUrl: null,
      certifications: {
        legalMetrologyPcr2011: false,
        unitSalePriceCompliant: false,
        zeroTamperingHistory: false,
        section15RaidDispatched: true
      },
      ecomDisplay: {
        badgeText: "Regulatory Caution",
        badgeColor: "#EF4444",
        label: "Sales Frozen by Order of DCA",
        disclaimer: "Repeated Section 36(2) sticker alteration detected. Product suspended from commerce under Rule 32."
      }
    }
  };

  const matched = database[brand] || {
    brand: brand.toUpperCase(),
    brandSlug: brand,
    vidhiScore: 750,
    tier: "Vidhi Shrestha (Gold)",
    badgeCode: "gold",
    status: "APPROVED_FOR_SALE",
    isDefaulter: false,
    cartCheckoutAllowed: true,
    ecomDisplay: {
      badgeText: "VidhiScan Verified",
      badgeColor: "#F59E0B",
      label: "Accredited Legal Metrology Standard",
      disclaimer: "Standard statutory compliance validated."
    }
  };

  return NextResponse.json({
    verifiedAt: new Date().toISOString(),
    querySku: sku,
    ...matched,
    apiPolicy: "Central Legal Metrology Gateway v2.4 (Ministry of Consumer Affairs)"
  });
}
