import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const API_ORIGIN = (
  process.env.API_PROXY_TARGET ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:4000"
).replace(/\/$/, "");

const DOWN_MESSAGE =
  "API server tak connect nahi ho paya. Shopkeeper folder se `npm run dev` chalao (web + server dono).";

function upstreamUrl(pathSegments: string[], search: string): string {
  const suffix = pathSegments.length ? pathSegments.join("/") : "";
  const apiPath = suffix ? `/api/${suffix}` : "/api";
  return `${API_ORIGIN}${apiPath}${search}`;
}

function forwardHeaders(req: NextRequest): Headers {
  const h = new Headers();
  const auth = req.headers.get("authorization");
  if (auth) h.set("authorization", auth);
  const ct = req.headers.get("content-type");
  if (ct) h.set("content-type", ct);
  return h;
}

async function proxy(req: NextRequest, path: string[] | undefined) {
  const segments = path ?? [];
  const target = upstreamUrl(segments, req.nextUrl.search);
  let body: string | undefined;
  if (req.method !== "GET" && req.method !== "HEAD") {
    body = await req.text();
    if (body === "") body = undefined;
  }

  try {
    const upstream = await fetch(target, {
      method: req.method,
      headers: forwardHeaders(req),
      body,
    });
    const buf = await upstream.arrayBuffer();
    const res = new NextResponse(buf, {
      status: upstream.status,
      statusText: upstream.statusText,
    });
    const ct = upstream.headers.get("content-type");
    if (ct) res.headers.set("content-type", ct);
    return res;
  } catch {
    return NextResponse.json({ message: DOWN_MESSAGE }, { status: 503 });
  }
}

type Ctx = { params: Promise<{ path?: string[] }> };

async function safeProxy(req: NextRequest, ctx: Ctx) {
  try {
    const { path } = await ctx.params;
    return await proxy(req, path);
  } catch (err) {
    console.error("[api proxy]", err);
    return NextResponse.json(
      { message: DOWN_MESSAGE },
      { status: 503 }
    );
  }
}

export async function GET(req: NextRequest, ctx: Ctx) {
  return safeProxy(req, ctx);
}

export async function HEAD(req: NextRequest, ctx: Ctx) {
  return safeProxy(req, ctx);
}

export async function POST(req: NextRequest, ctx: Ctx) {
  return safeProxy(req, ctx);
}

export async function PUT(req: NextRequest, ctx: Ctx) {
  return safeProxy(req, ctx);
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  return safeProxy(req, ctx);
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  return safeProxy(req, ctx);
}
