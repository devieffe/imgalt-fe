import { lookup } from 'node:dns/promises';
import { request as httpRequest } from 'node:http';
import { BlockList, isIP } from 'node:net';
import { request as httpsRequest } from 'node:https';

export const runtime = 'nodejs';

const MAX_IMAGE_BYTES = 6 * 1024 * 1024;
const MAX_URL_LENGTH = 2048;
const ALLOWED_EXTENSIONS = /\.(jpg|jpeg|png|webp)$/i;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

const blockedAddresses = new BlockList();
[
  ['0.0.0.0', 8], ['10.0.0.0', 8], ['100.64.0.0', 10], ['127.0.0.0', 8],
  ['169.254.0.0', 16], ['172.16.0.0', 12], ['192.0.0.0', 24], ['192.0.2.0', 24],
  ['192.88.99.0', 24], ['192.168.0.0', 16], ['198.18.0.0', 15], ['198.51.100.0', 24],
  ['203.0.113.0', 24], ['224.0.0.0', 4], ['240.0.0.0', 4],
].forEach(([address, prefix]) => blockedAddresses.addSubnet(address as string, prefix as number, 'ipv4'));
[
  ['::', 128], ['::1', 128], ['64:ff9b:1::', 48], ['100::', 64],
  ['2001::', 23], ['2001:db8::', 32], ['fc00::', 7], ['fe80::', 10], ['ff00::', 8],
].forEach(([address, prefix]) => blockedAddresses.addSubnet(address as string, prefix as number, 'ipv6'));

function isPublicAddress(address: string, family: number): boolean {
  if (family === 4) return !blockedAddresses.check(address, 'ipv4');
  if (family !== 6) return false;

  const firstSegment = Number.parseInt(address.split(':').find(Boolean) ?? '', 16);
  return firstSegment >= 0x2000 && firstSegment <= 0x3fff && !blockedAddresses.check(address, 'ipv6');
}

function isAllowedImage(bytes: Buffer, contentType: string): boolean {
  if (contentType === 'image/jpeg') return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (contentType === 'image/png') return bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  return contentType === 'image/webp'
    && bytes.toString('ascii', 0, 4) === 'RIFF'
    && bytes.toString('ascii', 8, 12) === 'WEBP';
}

function fetchImage(url: URL, address: { address: string; family: number }): Promise<{ bytes: Buffer; contentType: string }> {
  return new Promise((resolve, reject) => {
    const request = (url.protocol === 'https:' ? httpsRequest : httpRequest)({
      protocol: url.protocol,
      hostname: url.hostname.replace(/^\[|\]$/g, ''),
      port: url.port || undefined,
      path: `${url.pathname}${url.search}`,
      method: 'GET',
      headers: {
        Accept: 'image/jpeg,image/png,image/webp',
        'Accept-Encoding': 'identity',
        'User-Agent': 'ImgAlt image importer',
      },
      lookup: (_hostname, options, callback) => {
        if (options.all) {
          callback(null, [{ address: address.address, family: address.family }]);
          return;
        }
        callback(null, address.address, address.family);
      },
    }, response => {
      const status = response.statusCode ?? 0;
      if (status < 200 || status >= 300) {
        response.resume();
        reject(new Error(status >= 300 && status < 400 ? 'redirect' : 'upstream'));
        return;
      }

      const contentType = response.headers['content-type']?.split(';', 1)[0].trim().toLowerCase() ?? '';
      if (!ALLOWED_TYPES.has(contentType)) {
        response.resume();
        reject(new Error('type'));
        return;
      }

      const length = Number(response.headers['content-length']);
      if (Number.isFinite(length) && length > MAX_IMAGE_BYTES) {
        response.resume();
        reject(new Error('size'));
        return;
      }

      const chunks: Buffer[] = [];
      let total = 0;
      response.on('data', (chunk: Buffer | Uint8Array) => {
        total += chunk.byteLength;
        if (total > MAX_IMAGE_BYTES) {
          request.destroy(new Error('size'));
          return;
        }
        chunks.push(Buffer.from(chunk));
      });
      response.on('end', () => {
        const bytes = Buffer.concat(chunks);
        if (!isAllowedImage(bytes, contentType)) {
          reject(new Error('type'));
          return;
        }
        resolve({ bytes, contentType });
      });
      response.on('error', reject);
    });

    request.setTimeout(15_000, () => request.destroy(new Error('timeout')));
    request.on('error', reject);
    request.end();
  });
}

export async function POST(request: Request) {
  try {
    if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) {
      return Response.json({ error: 'Content-Type must be application/json.' }, { status: 415 });
    }

    const bodyText = await request.text();
    if (Buffer.byteLength(bodyText, 'utf8') > 4096) {
      return Response.json({ error: 'The image URL is too long.' }, { status: 413 });
    }

    let body: unknown;
    try {
      body = JSON.parse(bodyText);
    } catch {
      return Response.json({ error: 'Provide a valid image URL.' }, { status: 400 });
    }

    const value = body && typeof body === 'object' ? (body as { url?: unknown }).url : undefined;
    if (typeof value !== 'string' || value.length > MAX_URL_LENGTH) {
      return Response.json({ error: 'Provide a valid image URL.' }, { status: 400 });
    }

    let url: URL;
    try {
      url = new URL(value);
    } catch {
      return Response.json({ error: 'Enter a valid image URL.' }, { status: 400 });
    }

    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.hash) {
      return Response.json({ error: 'Only public HTTP or HTTPS image URLs are allowed.' }, { status: 400 });
    }
    if (url.port && url.port !== (url.protocol === 'https:' ? '443' : '80')) {
      return Response.json({ error: 'The image URL uses an unsupported port.' }, { status: 400 });
    }
    if (!ALLOWED_EXTENSIONS.test(url.pathname)) {
      return Response.json({ error: 'Only JPEG, PNG, and WebP image URLs are supported.' }, { status: 400 });
    }

    const hostname = url.hostname.replace(/^\[|\]$/g, '');
    const family = isIP(hostname);
    const addresses = family
      ? [{ address: hostname, family }]
      : await lookup(hostname, { all: true, verbatim: true });
    if (!addresses.length || addresses.some(entry => !isPublicAddress(entry.address, entry.family))) {
      return Response.json({ error: 'The image host is not publicly accessible.' }, { status: 400 });
    }

    const { bytes, contentType } = await fetchImage(url, addresses[0]);
    return new Response(new Uint8Array(bytes), {
      headers: {
        'Content-Type': contentType,
        'Content-Length': String(bytes.length),
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    const reason = error instanceof Error ? error.message : '';
    const message = reason === 'size'
      ? 'Choose an image smaller than 6 MB.'
      : reason === 'type'
        ? 'The URL did not return a valid JPEG, PNG, or WebP image.'
        : reason === 'timeout'
          ? 'The image took too long to load.'
          : reason === 'redirect'
            ? 'The image host redirected the request. Use the final image URL.'
            : 'The image URL could not be loaded. Check that the host allows image access.';
    const status = reason === 'size' ? 413 : reason === 'type' ? 415 : reason === 'timeout' ? 504 : 502;
    return Response.json({ error: message }, { status });
  }
}
