import { NextRequest, NextResponse } from "next/server"
import {
  churchWebProxyPath,
  churchWebTargetFromProxySegments,
} from "@/lib/church-web-link"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const HOP_BY_HOP = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
  "content-encoding",
])

/** Headers that would let Gospel Library / framing rules leak through. */
const STRIP_RESPONSE = new Set([
  "content-security-policy",
  "content-security-policy-report-only",
  "x-frame-options",
  "set-cookie",
  "location",
])

const STAY_IN_BROWSER_SCRIPT = `<script data-stake-stay-browser>(function(){function proxy(url){try{var u=new URL(url,location.href);var h=u.hostname.replace(/\\.$/,"").toLowerCase();var ok=h==="churchofjesuschrist.org"||h.endsWith(".churchofjesuschrist.org")||h==="lds.org"||h.endsWith(".lds.org");if(!ok||(u.protocol!=="https:"&&u.protocol!=="http:"))return null;return "/church-web/"+u.host+u.pathname+u.search;}catch(e){return null}}document.addEventListener("click",function(e){var t=e.target;if(!t||!t.closest)return;var a=t.closest("a[href]");if(!a)return;var next=proxy(a.href);if(!next)return;e.preventDefault();e.stopPropagation();location.assign(next);},true);})();</script>`

function injectClickInterceptor(html: string): string {
  if (html.includes("data-stake-stay-browser")) return html
  if (/<head[^>]*>/i.test(html)) return html.replace(/<head[^>]*>/i, (tag) => `${tag}${STAY_IN_BROWSER_SCRIPT}`)
  return `${STAY_IN_BROWSER_SCRIPT}${html}`
}

function passRequestHeaders(req: NextRequest): Headers {
  const headers = new Headers()
  const ua = req.headers.get("user-agent")
  if (ua) headers.set("user-agent", ua)
  const accept = req.headers.get("accept")
  if (accept) headers.set("accept", accept)
  const lang = req.headers.get("accept-language")
  if (lang) headers.set("accept-language", lang)
  return headers
}

async function proxy(req: NextRequest, path: string[]): Promise<NextResponse> {
  const target = churchWebTargetFromProxySegments(path, req.nextUrl.search)
  if (!target) {
    return new NextResponse("This proxy only loads official Church websites.", { status: 400 })
  }

  let upstream: Response
  try {
    upstream = await fetch(target, {
      method: "GET",
      headers: passRequestHeaders(req),
      redirect: "manual",
    })
  } catch {
    return new NextResponse("Could not load Church website.", { status: 502 })
  }

  if (upstream.status >= 300 && upstream.status < 400) {
    const location = upstream.headers.get("location")
    if (location) {
      const resolved = new URL(location, target).href
      const proxied = churchWebProxyPath(resolved)
      if (proxied) {
        return NextResponse.redirect(new URL(proxied, req.url), upstream.status)
      }
    }
    return new NextResponse("Redirect not allowed.", { status: 400 })
  }

  const contentType = upstream.headers.get("content-type") || ""
  const headers = new Headers()
  upstream.headers.forEach((value, key) => {
    const lower = key.toLowerCase()
    if (HOP_BY_HOP.has(lower) || STRIP_RESPONSE.has(lower)) return
    headers.set(key, value)
  })
  headers.set("x-stake-church-proxy", "1")

  if (contentType.includes("text/html")) {
    const html = injectClickInterceptor(await upstream.text())
    headers.set("content-type", contentType)
    return new NextResponse(html, { status: upstream.status, headers })
  }

  const body = await upstream.arrayBuffer()
  return new NextResponse(body, { status: upstream.status, headers })
}

export async function GET(
  req: NextRequest,
  ctx: { params: { path: string[] } }
) {
  return proxy(req, ctx.params.path || [])
}
