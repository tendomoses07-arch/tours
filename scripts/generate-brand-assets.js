const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const publicDir = path.resolve(process.cwd(), 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// 1. Write favicon.svg (Simplified Globe + Airplane Flight Path on #0B1F45 Navy Blue Badge)
const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
  <rect width="64" height="64" rx="14" fill="#0B1F45"/>
  <!-- Outer Globe Ring -->
  <circle cx="30" cy="34" r="19" stroke="#FFFFFF" stroke-width="2.6" stroke-opacity="0.92"/>
  <!-- Globe Meridians & Parallels -->
  <ellipse cx="30" cy="34" rx="9.5" ry="19" stroke="#FFFFFF" stroke-width="2" stroke-opacity="0.75"/>
  <line x1="11" y1="34" x2="49" y2="34" stroke="#FFFFFF" stroke-width="2" stroke-opacity="0.75"/>
  <path d="M14 25.5C19 28 41 28 46 25.5" stroke="#FFFFFF" stroke-width="1.8" stroke-opacity="0.65" stroke-linecap="round"/>
  <path d="M14 42.5C19 40 41 40 46 42.5" stroke="#FFFFFF" stroke-width="1.8" stroke-opacity="0.65" stroke-linecap="round"/>
  <!-- Dynamic Orange Flight Path Arc -->
  <path d="M9 45C17 22 36 15 51 17" stroke="#F28C28" stroke-width="3.6" stroke-linecap="round"/>
  <!-- Sleek Airplane Icon in Accent Orange (#F28C28) -->
  <path d="M56 14L43.5 15.5L47 19.2L37.5 25.5L40 28L49.8 22.2L51.5 27.5L56 14Z" fill="#F28C28"/>
  <circle cx="51" cy="17" r="1.5" fill="#FFFFFF"/>
</svg>
`;
fs.writeFileSync(path.join(publicDir, 'favicon.svg'), faviconSvg, 'utf8');

// 2. Write standalone reusable full brand logo SVG (public/logo.svg)
const brandLogoSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 340 80" fill="none">
  <rect width="340" height="80" rx="14" fill="#0B1F45"/>
  <!-- Globe & Flight Path Emblem -->
  <g transform="translate(12, 8)">
    <circle cx="30" cy="34" r="21" stroke="#FFFFFF" stroke-width="2.4" stroke-opacity="0.95"/>
    <ellipse cx="30" cy="34" rx="10.5" ry="21" stroke="#FFFFFF" stroke-width="1.8" stroke-opacity="0.75"/>
    <line x1="9" y1="34" x2="51" y2="34" stroke="#FFFFFF" stroke-width="1.8" stroke-opacity="0.75"/>
    <path d="M12.5 24.5C18.5 27.5 41.5 27.5 47.5 24.5" stroke="#FFFFFF" stroke-width="1.6" stroke-opacity="0.65" stroke-linecap="round"/>
    <path d="M12.5 43.5C18.5 40.5 41.5 40.5 47.5 43.5" stroke="#FFFFFF" stroke-width="1.6" stroke-opacity="0.65" stroke-linecap="round"/>
    <path d="M7 46C16 20 37 13 53 15" stroke="#F28C28" stroke-width="3.5" stroke-linecap="round"/>
    <path d="M59 11.5L45 13.5L49 17.5L38.5 24.5L41.2 27.2L52 20.8L54 26.8L59 11.5Z" fill="#F28C28"/>
  </g>
  <!-- KOLA Refined Serif Typography -->
  <text x="86" y="45" fill="#FFFFFF" font-family="'Playfair Display', 'Cormorant Garamond', Georgia, serif" font-size="36" font-weight="700" letter-spacing="4">KOLA</text>
  <!-- Accent Divider Rule -->
  <line x1="86" y1="53" x2="298" y2="53" stroke="#F28C28" stroke-width="1.5" stroke-opacity="0.85"/>
  <!-- TOURS & TRAVEL Clean Modern Sans-Serif Typography -->
  <text x="87" y="67" fill="#F28C28" font-family="'Roboto', 'Inter', Arial, sans-serif" font-size="11.5" font-weight="700" letter-spacing="5.5">TOURS &amp; TRAVEL</text>
</svg>
`;
fs.writeFileSync(path.join(publicDir, 'logo.svg'), brandLogoSvg, 'utf8');

// 3. Pure Node.js Antialiased Rasterizer for PNG & ICO Favicon Assets
// Colors: Navy (#0B1F45 = [11, 31, 69]), Orange (#F28C28 = [242, 140, 40]), White (#FFFFFF = [255, 255, 255])

function clamp(v, min = 0, max = 1) {
  return Math.max(min, Math.min(max, v));
}

function distToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(px - x1, py - y1);
  const t = clamp(((px - x1) * dx + (py - y1) * dy) / lenSq, 0, 1);
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

function pointInTriangle(px, py, ax, ay, bx, by, cx, cy) {
  const v0x = cx - ax, v0y = cy - ay;
  const v1x = bx - ax, v1y = by - ay;
  const v2x = px - ax, v2y = py - ay;
  const dot00 = v0x * v0x + v0y * v0y;
  const dot01 = v0x * v1x + v0y * v1y;
  const dot02 = v0x * v2x + v0y * v2y;
  const dot11 = v1x * v1x + v1y * v1y;
  const dot12 = v1x * v2x + v1y * v2y;
  const invDenom = 1 / (dot00 * dot11 - dot01 * dot01);
  const u = (dot11 * dot02 - dot01 * dot12) * invDenom;
  const v = (dot00 * dot12 - dot01 * dot02) * invDenom;
  return u >= -0.005 && v >= -0.005 && u + v <= 1.005;
}

function blendColor(base, over, alpha) {
  const a = clamp(alpha, 0, 1);
  return [
    Math.round(base[0] * (1 - a) + over[0] * a),
    Math.round(base[1] * (1 - a) + over[1] * a),
    Math.round(base[2] * (1 - a) + over[2] * a),
    Math.round(clamp(base[3] / 255 + a * (1 - base[3] / 255), 0, 1) * 255)
  ];
}

function renderFaviconPixels(size) {
  const buf = Buffer.alloc(size * size * 4);
  const NAVY = [11, 31, 69, 255];
  const ORANGE = [242, 140, 40, 255];
  const WHITE = [255, 255, 255, 255];

  // Normalized 64x64 coordinate space
  const scale = 64 / size;
  const aa = Math.max(0.85, scale * 0.75);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const nx = (x + 0.5) * scale;
      const ny = (y + 0.5) * scale;

      // 1. Rounded Rectangle Badge (#0B1F45)
      const rad = 13.5;
      const qx = Math.max(Math.abs(nx - 32) - (32 - rad), 0);
      const qy = Math.max(Math.abs(ny - 32) - (32 - rad), 0);
      const rectDist = Math.hypot(qx, qy) - rad;
      if (rectDist > aa) {
        const idx = (y * size + x) * 4;
        buf[idx] = 0;
        buf[idx + 1] = 0;
        buf[idx + 2] = 0;
        buf[idx + 3] = 0;
        continue;
      }
      const bgAlpha = clamp(0.5 - rectDist / (aa * 1.2), 0, 1);
      let rgba = [NAVY[0], NAVY[1], NAVY[2], Math.round(bgAlpha * 255)];

      // 2. Globe Center (30, 34), Radius 19
      const gx = nx - 30;
      const gy = ny - 34;
      const gDist = Math.hypot(gx, gy);

      // Outer Globe Circle
      const ringDiff = Math.abs(gDist - 19);
      const ringStroke = size <= 16 ? 2.2 : 1.5;
      if (ringDiff < ringStroke + aa) {
        const a = clamp(1 - (ringDiff - ringStroke * 0.5) / aa, 0, 1) * 0.92;
        rgba = blendColor(rgba, WHITE, a);
      }

      // Inside Globe Meridians & Latitude Lines
      if (gDist <= 19) {
        // Vertical Meridian Ellipse: (gx / 9.5)^2 + (gy / 19)^2 = 1
        const ellVal = Math.hypot(gx / 9.5, gy / 19);
        const ellDist = Math.abs(ellVal - 1) * 11;
        if (ellDist < 1.1 + aa) {
          const a = clamp(1 - (ellDist - 0.5) / aa, 0, 1) * 0.72;
          rgba = blendColor(rgba, WHITE, a);
        }

        // Equator Line (y = 34)
        const eqDist = Math.abs(gy);
        if (eqDist < 1.0 + aa) {
          const a = clamp(1 - (eqDist - 0.45) / aa, 0, 1) * 0.72;
          rgba = blendColor(rgba, WHITE, a);
        }

        // Upper & Lower Latitudes (only for >= 32px for clarity)
        if (size >= 32) {
          const latDist = Math.min(Math.abs(gy - 9), Math.abs(gy + 9));
          if (latDist < 0.8 + aa) {
            const a = clamp(1 - (latDist - 0.35) / aa, 0, 1) * 0.55;
            rgba = blendColor(rgba, WHITE, a);
          }
        }
      }

      // 3. Flight Path Arc in Accent Orange (#F28C28)
      // Quadratic curve from (9, 45) through control (24, 15) to (50, 17)
      let minArcDist = 999;
      const steps = 28;
      let prevX = 9, prevY = 45;
      for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        const mt = 1 - t;
        const cx = mt * mt * 9 + 2 * mt * t * 24 + t * t * 50;
        const cy = mt * mt * 45 + 2 * mt * t * 15 + t * t * 17;
        const d = distToSegment(nx, ny, prevX, prevY, cx, cy);
        if (d < minArcDist) minArcDist = d;
        prevX = cx;
        prevY = cy;
      }
      const arcHalfWidth = size <= 16 ? 2.1 : 1.85;
      if (minArcDist < arcHalfWidth + aa) {
        const a = clamp(1 - (minArcDist - arcHalfWidth * 0.55) / aa, 0, 1);
        rgba = blendColor(rgba, ORANGE, a);
      }

      // 4. Airplane Dart Icon at top-right (56, 13)
      const inWing1 = pointInTriangle(nx, ny, 57, 13, 42, 15.5, 49.5, 22.5);
      const inWing2 = pointInTriangle(nx, ny, 57, 13, 49.5, 22.5, 52.5, 28);
      const inTail = pointInTriangle(nx, ny, 49.5, 21, 38, 26, 41, 28.5);
      if (inWing1 || inWing2 || inTail) {
        rgba = blendColor(rgba, ORANGE, 1);
      }

      const idx = (y * size + x) * 4;
      buf[idx] = rgba[0];
      buf[idx + 1] = rgba[1];
      buf[idx + 2] = rgba[2];
      buf[idx + 3] = rgba[3];
    }
  }
  return buf;
}

// CRC32 Table for PNG Chunks
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crcTable[n] = c >>> 0;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function makePngChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcVal = crc32(Buffer.concat([typeBuf, data]));
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crcVal, 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function encodePNG(size, rgbaBuffer) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth 8
  ihdr[9] = 6; // color type 6 (RGBA)
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  // Filter byte 0 per scanline
  const rawScanlines = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    const rowStart = y * (size * 4 + 1);
    rawScanlines[rowStart] = 0;
    rgbaBuffer.copy(rawScanlines, rowStart + 1, y * size * 4, (y + 1) * size * 4);
  }

  const compressed = zlib.deflateSync(rawScanlines, { level: 9 });

  return Buffer.concat([
    signature,
    makePngChunk('IHDR', ihdr),
    makePngChunk('IDAT', compressed),
    makePngChunk('IEND', Buffer.alloc(0))
  ]);
}

function encodeICO(pngBuffersWithSizes) {
  const count = pngBuffersWithSizes.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // Reserved
  header.writeUInt16LE(1, 2); // Type 1 = ICO
  header.writeUInt16LE(count, 4);

  const dirEntries = [];
  let offset = 6 + count * 16;

  for (const item of pngBuffersWithSizes) {
    const entry = Buffer.alloc(16);
    entry[0] = item.size >= 256 ? 0 : item.size;
    entry[1] = item.size >= 256 ? 0 : item.size;
    entry[2] = 0;
    entry[3] = 0;
    entry.writeUInt16LE(1, 4); // Color planes
    entry.writeUInt16LE(32, 6); // Bits per pixel
    entry.writeUInt32LE(item.png.length, 8);
    entry.writeUInt32LE(offset, 12);
    dirEntries.push(entry);
    offset += item.png.length;
  }

  return Buffer.concat([header, ...dirEntries, ...pngBuffersWithSizes.map((i) => i.png)]);
}

const sizesToGenerate = [
  { size: 16, filename: 'favicon-16x16.png' },
  { size: 32, filename: 'favicon-32x32.png' },
  { size: 180, filename: 'apple-touch-icon.png' },
  { size: 192, filename: 'favicon-192x192.png' },
  { size: 512, filename: 'favicon-512x512.png' }
];

const generatedMap = {};

for (const spec of sizesToGenerate) {
  const pixels = renderFaviconPixels(spec.size);
  const pngBuf = encodePNG(spec.size, pixels);
  fs.writeFileSync(path.join(publicDir, spec.filename), pngBuf);
  generatedMap[spec.size] = pngBuf;
  console.log(`Generated ${spec.filename} (${pngBuf.length} bytes)`);
}

// Generate multi-resolution favicon.ico (16x16 + 32x32)
const icoBuf = encodeICO([
  { size: 16, png: generatedMap[16] },
  { size: 32, png: generatedMap[32] }
]);
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), icoBuf);
console.log(`Generated favicon.ico (${icoBuf.length} bytes)`);

// Also write site.webmanifest for 192x192 & 512x512 icons
const manifest = {
  name: 'KOLA TOURS AND TRAVEL',
  short_name: 'KOLA TOURS',
  icons: [
    { src: '/favicon-192x192.png', sizes: '192x192', type: 'image/png' },
    { src: '/favicon-512x512.png', sizes: '512x512', type: 'image/png' }
  ],
  theme_color: '#0B1F45',
  background_color: '#0B1F45',
  display: 'standalone'
};
fs.writeFileSync(path.join(publicDir, 'site.webmanifest'), JSON.stringify(manifest, null, 2), 'utf8');
console.log('Generated site.webmanifest');

