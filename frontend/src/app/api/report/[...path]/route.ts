import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://127.0.0.1:8000";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const resolvedParams = await params;
    const filePath = resolvedParams.path.join("/");

    const res = await fetch(`${BACKEND_URL}/static/${filePath}`);
    if (!res.ok) {
      return new NextResponse("File not found", { status: 404 });
    }

    const blob = await res.blob();
    const headers = new Headers();
    headers.set("Content-Type", res.headers.get("Content-Type") || "application/pdf");
    headers.set("Content-Disposition", `inline; filename="${filePath.split('/').pop()}"`);

    return new NextResponse(blob, { status: 200, headers });
  } catch (err: any) {
    return new NextResponse(err.message, { status: 500 });
  }
}
