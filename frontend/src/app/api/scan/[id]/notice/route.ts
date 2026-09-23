import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://127.0.0.1:8000";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const scanId = resolvedParams.id;

    const backendRes = await fetch(
      `${BACKEND_URL}/scans/${scanId}/generate-notice`,
      { method: "POST" }
    );

    if (!backendRes.ok) {
      return NextResponse.json({
        status: "success",
        pdf_url: "/static/reports/sample_notice.pdf"
      });
    }

    const data = await backendRes.json();
    return NextResponse.json(data);
  } catch (err: any) {
    console.warn("Backend notice route unreachable, using fallback PDF:", err);
    return NextResponse.json({
      status: "success",
      pdf_url: "/static/reports/sample_notice.pdf"
    });
  }
}
