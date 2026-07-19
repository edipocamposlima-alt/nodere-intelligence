import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

const DEFAULT_MAX_BYTES = 2 * 1024 * 1024;
const MAX_REDIRECTS = 3;

export class UnsafePublicUrlError extends Error {
  status = 400;
  code = "UNSAFE_PUBLIC_URL";

  constructor(message: string) {
    super(message);
    this.name = "UnsafePublicUrlError";
  }
}

export async function assertPublicHttpUrl(input: string) {
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    throw new UnsafePublicUrlError("URL inválida. Informe um endereço HTTP ou HTTPS completo.");
  }

  if (!(["http:", "https:"] as string[]).includes(url.protocol)) {
    throw new UnsafePublicUrlError("Somente URLs HTTP e HTTPS são permitidas.");
  }
  if (url.username || url.password) {
    throw new UnsafePublicUrlError("URLs com credenciais embutidas não são permitidas.");
  }
  if (url.port && !["80", "443"].includes(url.port)) {
    throw new UnsafePublicUrlError("Somente as portas públicas 80 e 443 são permitidas.");
  }

  const hostname = url.hostname.toLowerCase().replace(/\.$/, "");
  if (!hostname || hostname === "localhost" || hostname.endsWith(".localhost") || hostname.endsWith(".local") || hostname.endsWith(".internal")) {
    throw new UnsafePublicUrlError("Endereços locais ou internos não são permitidos.");
  }

  const literalVersion = isIP(hostname);
  if (literalVersion && !isPublicAddress(hostname)) {
    throw new UnsafePublicUrlError("Endereços IP privados, reservados ou locais não são permitidos.");
  }

  if (!literalVersion) {
    let addresses: Array<{ address: string }>;
    try {
      addresses = await lookup(hostname, { all: true, verbatim: true });
    } catch {
      throw new UnsafePublicUrlError("Não foi possível resolver o domínio informado.");
    }
    if (!addresses.length || addresses.some(({ address }) => !isPublicAddress(address))) {
      throw new UnsafePublicUrlError("O domínio resolve para um endereço privado, reservado ou local.");
    }
  }

  url.hash = "";
  return url;
}

export async function fetchPublicText(input: string | URL, options: { timeoutMs?: number; maxBytes?: number } = {}) {
  let current = await assertPublicHttpUrl(String(input));
  const maxBytes = options.maxBytes ?? DEFAULT_MAX_BYTES;

  for (let redirect = 0; redirect <= MAX_REDIRECTS; redirect += 1) {
    const response = await fetch(current, {
      redirect: "manual",
      signal: AbortSignal.timeout(options.timeoutMs ?? 7_000),
      headers: { "User-Agent": "NODERE-Site-Audit/1.0" }
    });

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location || redirect === MAX_REDIRECTS) {
        throw new UnsafePublicUrlError("A URL excedeu o limite seguro de redirecionamentos.");
      }
      current = await assertPublicHttpUrl(new URL(location, current).toString());
      continue;
    }

    const declaredLength = Number(response.headers.get("content-length") || 0);
    if (declaredLength > maxBytes) {
      throw new UnsafePublicUrlError("A resposta do site excede o limite seguro de 2 MB.");
    }

    const bytes = await readLimitedBody(response, maxBytes);
    return {
      response,
      url: current.toString(),
      text: new TextDecoder().decode(bytes)
    };
  }

  throw new UnsafePublicUrlError("Não foi possível concluir a leitura segura da URL.");
}

async function readLimitedBody(response: Response, maxBytes: number) {
  if (!response.body) return new Uint8Array();
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel().catch(() => undefined);
      throw new UnsafePublicUrlError("A resposta do site excede o limite seguro de 2 MB.");
    }
    chunks.push(value);
  }
  const output = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    output.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return output;
}

function isPublicAddress(address: string) {
  const normalized = address.toLowerCase();
  if (normalized.startsWith("::ffff:")) return isPublicAddress(normalized.slice(7));
  if (isIP(normalized) === 4) return isPublicIpv4(normalized);
  if (isIP(normalized) === 6) {
    return !(
      normalized === "::" ||
      normalized === "::1" ||
      normalized.startsWith("fc") ||
      normalized.startsWith("fd") ||
      /^fe[89ab]/.test(normalized) ||
      normalized.startsWith("ff") ||
      normalized.startsWith("2001:db8:")
    );
  }
  return false;
}

function isPublicIpv4(address: string) {
  const octets = address.split(".").map(Number);
  if (octets.length !== 4 || octets.some((value) => !Number.isInteger(value) || value < 0 || value > 255)) return false;
  const [a, b, c] = octets;
  if (a === 0 || a === 10 || a === 127 || a >= 224) return false;
  if (a === 100 && b >= 64 && b <= 127) return false;
  if (a === 169 && b === 254) return false;
  if (a === 172 && b >= 16 && b <= 31) return false;
  if (a === 192 && b === 168) return false;
  if (a === 192 && b === 0 && (c === 0 || c === 2)) return false;
  if (a === 198 && (b === 18 || b === 19 || (b === 51 && c === 100))) return false;
  if (a === 203 && b === 0 && c === 113) return false;
  return true;
}
