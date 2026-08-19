import { NextRequest, NextResponse } from "next/server";

const LEOS_LEAD_ENDPOINT = "https://promotion.leosdevelopments.com/api/lead";

export async function POST(request: NextRequest) {
  try {
    const lead = await request.json();

    if (lead.company) {
      return NextResponse.json({ ok: true });
    }

    if (
      typeof lead.name !== "string" ||
      lead.name.trim().length < 2 ||
      typeof lead.email !== "string" ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email) ||
      typeof lead.phone !== "string" ||
      lead.phone.replace(/\D/g, "").length < 7
    ) {
      return NextResponse.json(
        { error: "Please complete all contact details." },
        { status: 400 },
      );
    }

    const response = await fetch(LEOS_LEAD_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(lead),
      cache: "no-store",
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      return NextResponse.json(
        { error: data?.error ?? "The LEOS lead service is currently unavailable." },
        { status: response.status },
      );
    }

    return NextResponse.json(data ?? { ok: true });
  } catch {
    return NextResponse.json(
      { error: "Unable to process the enquiry." },
      { status: 500 },
    );
  }
}
