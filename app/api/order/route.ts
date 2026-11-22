import { NextResponse } from "next/server";
import {
  FIELD_NAMES,
  makeOrderId,
  validateOrder,
  type OrderInput,
} from "@/lib/order";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const WINDOW_MS = 10 * 60 * 1000;
const LIMIT = 8;
const buckets = new Map<string, { count: number; reset: number }>();

function rateLimited(ip: string) {
  const now = Date.now();
  const entry = buckets.get(ip);
  if (!entry || now > entry.reset) {
    buckets.set(ip, { count: 1, reset: now + WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > LIMIT;
}

function clientIp(req: Request) {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export function GET() {
  return NextResponse.json(
    {
      ok: true,
      endpoint: "/api/order",
      method: "POST",
      accepts: ["application/json", "application/x-www-form-urlencoded"],
      fields: Array.from(new Set([...FIELD_NAMES, "country"])),
      sizes: ["S", "M", "L"],
      note: "Reservation endpoint for the Cadence concept study. No payment is taken.",
    },
    { headers: CORS },
  );
}

async function readBody(req: Request): Promise<unknown> {
  const type = req.headers.get("content-type") ?? "";
  try {
    if (type.includes("application/json")) return await req.json();
    if (
      type.includes("application/x-www-form-urlencoded") ||
      type.includes("multipart/form-data")
    ) {
      const form = await req.formData();
      return Object.fromEntries(form.entries());
    }
    const text = await req.text();
    if (!text) return {};
    try {
      return JSON.parse(text);
    } catch {
      return Object.fromEntries(new URLSearchParams(text).entries());
    }
  } catch {
    return {};
  }
}

export async function POST(req: Request) {
  const ip = clientIp(req);

  if (rateLimited(ip)) {
    return NextResponse.json(
      { ok: false, message: "Too many requests. Please try again shortly." },
      { status: 429, headers: CORS },
    );
  }

  const raw = await readBody(req);
  const body = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;

  // Honeypot: silently accept, never store.
  if (typeof body.website === "string" && body.website.trim().length > 0) {
    return NextResponse.json(
      { ok: true, orderId: makeOrderId(), stored: false, message: "Received." },
      { status: 200, headers: CORS },
    );
  }

  const result = validateOrder(body);
  if (!result.ok) {
    return NextResponse.json(
      {
        ok: false,
        message: "Some details need attention.",
        errors: result.errors,
      },
      { status: 400, headers: CORS },
    );
  }

  const country = typeof body.country === "string" ? body.country.trim().slice(0, 80) : "";
  if (!country) {
    return NextResponse.json(
      {
        ok: false,
        message: "Some details need attention.",
        errors: { country: "Choose your country." },
      },
      { status: 400, headers: CORS },
    );
  }

  const order: OrderInput & { country: string } = { ...result.value, country };
  const orderId = makeOrderId();
  const webhook = process.env.SHEET_WEBHOOK_URL;
  const secret = process.env.SHEET_SECRET ?? "";

  if (!webhook) {
    console.error("SHEET_WEBHOOK_URL is not set: reservation was not stored.");
    return NextResponse.json(
      {
        ok: false,
        orderId,
        stored: false,
        message: "Reservations are temporarily unavailable. Please try again later.",
      },
      { status: 503, headers: CORS },
    );
  }

  try {
    const res = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        secret,
        orderId,
        createdAt: new Date().toISOString(),
        ...order,
      }),
      redirect: "follow",
      cache: "no-store",
      signal: AbortSignal.timeout(9000),
    });

    if (!res.ok) throw new Error(`Sheet responded ${res.status}`);
    // the Apps Script answers { ok: true } once the row is written
    const saved = await res.json().catch(() => null);
    if (!saved || saved.ok !== true) throw new Error("Sheet did not confirm the write");

    return NextResponse.json(
      {
        ok: true,
        orderId,
        stored: true,
        message:
          "Reservation received. We'll email you when the first run is ready.",
      },
      { status: 200, headers: CORS },
    );
  } catch {
    return NextResponse.json(
      {
        ok: false,
        orderId,
        stored: false,
        message:
          "We couldn't save your reservation just now. Please try again in a moment.",
      },
      { status: 502, headers: CORS },
    );
  }
}
