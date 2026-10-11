import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

// 1. Ensure public directory exists
const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// 2. High-quality SVG for Pocketwise Emblem Favicon & Logo
const svgEmblem = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
  <defs>
    <linearGradient id="pocketBg" x1="8" y1="6" x2="56" y2="58" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#0F3826" />
      <stop offset="50%" stop-color="#14432E" />
      <stop offset="100%" stop-color="#0A261A" />
    </linearGradient>
    <linearGradient id="limeFlow" x1="16" y1="44" x2="48" y2="16" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#72B340" />
      <stop offset="50%" stop-color="#D4F478" />
      <stop offset="100%" stop-color="#F5E064" />
    </linearGradient>
    <linearGradient id="bar1Grad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#84C958" />
      <stop offset="100%" stop-color="#3B7D4E" />
    </linearGradient>
    <linearGradient id="bar2Grad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#B2EB5C" />
      <stop offset="100%" stop-color="#4E995F" />
    </linearGradient>
    <linearGradient id="bar3Grad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#D4F478" />
      <stop offset="100%" stop-color="#72B340" />
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#D4F478" flood-opacity="0.3" />
    </filter>
  </defs>

  <!-- Pocket Outer Shape with subtle border -->
  <path
    d="M 12 10 C 12 7.79 13.79 6 16 6 H 48 C 50.21 6 52 7.79 52 10 V 36 C 52 46.5 42.5 56 32 58 C 21.5 56 12 46.5 12 36 Z"
    fill="url(#pocketBg)"
    stroke="#2A684C"
    stroke-width="1.5"
  />

  <!-- Pocket Hem/Stitch Detail (tailored pocket hallmark) -->
  <path
    d="M 16 14 H 48"
    stroke="#225A3F"
    stroke-width="1.5"
    stroke-dasharray="3 2"
  />

  <!-- 3 Rising Financial Bars (Plan -> Track -> Grow) -->
  <!-- Bar 1 (Left - Foundation / Plan) -->
  <rect x="20" y="34" width="5.5" height="13" rx="2.75" fill="url(#bar1Grad)" />

  <!-- Bar 2 (Middle - Track) -->
  <rect x="29.25" y="27" width="5.5" height="20" rx="2.75" fill="url(#bar2Grad)" />

  <!-- Bar 3 (Right - Grow) -->
  <rect x="38.5" y="19" width="5.5" height="28" rx="2.75" fill="url(#bar3Grad)" />

  <!-- Dynamic Money Flow / Growth Curve Swoop -->
  <path
    d="M 16 43 C 24 43 28 32 46 17"
    stroke="url(#limeFlow)"
    stroke-width="3"
    stroke-linecap="round"
    filter="url(#glow)"
  />

  <!-- Luminous Growth Star / Seed Node at apex of trajectory -->
  <circle cx="46.5" cy="16.5" r="3" fill="#FFF275" />
  <circle cx="46.5" cy="16.5" r="1.5" fill="#FFFFFF" />
</svg>`;

fs.writeFileSync(path.join(publicDir, 'favicon.svg'), svgEmblem);
fs.writeFileSync(path.resolve('favicon.svg'), svgEmblem);

// 3. Build a pure Node 32x32 PNG generator with zlib deflate to wrap in a true .ico container
// PNG specification:
// 8-byte signature: 137, 80, 78, 71, 13, 10, 26, 10
// IHDR chunk: 32x32, 8-bit RGBA, color type 6
// IDAT chunk: filter 0 + raw scanlines compressed with zlib.deflateSync
// IEND chunk

const WIDTH = 32;
const HEIGHT = 32;

// Draw a crisp 32x32 rasterized icon matching the pocket & lime flow colors:
// Colors:
// Pocket BG: [16, 56, 38, 255] (#103826)
// Pocket Border: [42, 104, 76, 255]
// Bars / Lime: [212, 244, 120, 255] (#D4F478)
// Star Accent: [255, 242, 117, 255] (#FFF275)
// Transparent: [0, 0, 0, 0]

const rawScanlines = Buffer.alloc(HEIGHT * (1 + WIDTH * 4));

for (let y = 0; y < HEIGHT; y++) {
  const rowOffset = y * (1 + WIDTH * 4);
  rawScanlines[rowOffset] = 0; // Filter type 0 (None)

  for (let x = 0; x < WIDTH; x++) {
    const pxOffset = rowOffset + 1 + x * 4;

    // Check if (x, y) is inside pocket boundary
    // Map to 64x64 coords:
    const mx = (x / 31) * 64;
    const my = (y / 31) * 64;

    let r = 0, g = 0, b = 0, a = 0;

    // Pocket contour check
    const inTop = my >= 6 && my <= 36 && mx >= 12 && mx <= 52;
    // Bottom curve check: center (32, 36), radius around bottom
    const dx = mx - 32;
    const dy = my - 36;
    const inBottom = my > 36 && my <= 58 && (Math.abs(dx) <= (58 - my) * 0.9 + 2 || (dx * dx * 0.5 + dy * dy <= 22 * 22));

    if (inTop || inBottom) {
      // Inside pocket!
      r = 18; g = 56; b = 38; a = 255;

      // Outer rim
      const nearEdge = mx <= 13.5 || mx >= 50.5 || my <= 7.5 || (my > 48 && my >= 56);
      if (nearEdge) {
        r = 42; g = 104; b = 76;
      }

      // Stitch line at my ~ 13-14
      if (Math.abs(my - 14) <= 0.8 && mx >= 16 && mx <= 48 && (Math.floor(mx) % 4 < 2)) {
        r = 34; g = 90; b = 63;
      }

      // Bar 1: mx 20..25.5, my 34..47
      if (mx >= 20 && mx <= 25.5 && my >= 34 && my <= 47) {
        r = 120; g = 185; b = 80;
      }

      // Bar 2: mx 29.25..34.75, my 27..47
      if (mx >= 29.25 && mx <= 34.75 && my >= 27 && my <= 47) {
        r = 178; g = 235; b = 92;
      }

      // Bar 3: mx 38.5..44, my 19..47
      if (mx >= 38.5 && mx <= 44 && my >= 19 && my <= 47) {
        r = 212; g = 244; b = 120;
      }

      // Growth Curve: from (16, 43) to (46, 17)
      // Parametric curve distance check
      // t from 0 to 1
      for (let t = 0; t <= 1; t += 0.02) {
        const cx = (1 - t) * (1 - t) * 16 + 2 * (1 - t) * t * 26 + t * t * 46;
        const cy = (1 - t) * (1 - t) * 43 + 2 * (1 - t) * t * 40 + t * t * 17;
        const distSq = (mx - cx) * (mx - cx) + (my - cy) * (my - cy);
        if (distSq <= 2.8) {
          // Glow / curve stroke
          r = 212; g = 244; b = 120;
          break;
        }
      }

      // Apex star at (46.5, 16.5)
      const starDistSq = (mx - 46.5) * (mx - 46.5) + (my - 16.5) * (my - 16.5);
      if (starDistSq <= 7) {
        r = 255; g = 242; b = 117;
        if (starDistSq <= 2) {
          r = 255; g = 255; b = 255;
        }
      }
    }

    rawScanlines[pxOffset + 0] = r;
    rawScanlines[pxOffset + 1] = g;
    rawScanlines[pxOffset + 2] = b;
    rawScanlines[pxOffset + 3] = a;
  }
}

// CRC32 helper
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) {
      c = (c >>> 1) ^ (-(c & 1) & 0xedb88320);
    }
  }
  return (c ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(12 + len);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  const crcBuf = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  chunk.writeUInt32BE(crc32(crcBuf), 8 + len);
  return chunk;
}

// Build PNG
const pngSig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const ihdrData = Buffer.alloc(13);
ihdrData.writeUInt32BE(WIDTH, 0);
ihdrData.writeUInt32BE(HEIGHT, 4);
ihdrData[8] = 8; // bit depth
ihdrData[9] = 6; // color type: RGBA
ihdrData[10] = 0; // compression
ihdrData[11] = 0; // filter
ihdrData[12] = 0; // interlace
const ihdrChunk = makeChunk('IHDR', ihdrData);

const compressedData = zlib.deflateSync(rawScanlines);
const idatChunk = makeChunk('IDAT', compressedData);
const iendChunk = makeChunk('IEND', Buffer.alloc(0));

const pngBuffer = Buffer.concat([pngSig, ihdrChunk, idatChunk, iendChunk]);

// Build ICO containing this PNG
// ICO header (6 bytes): 0,0, 1,0 (icon), 1,0 (count 1)
// Directory entry (16 bytes)
const icoHeader = Buffer.alloc(6);
icoHeader.writeUInt16LE(0, 0); // reserved
icoHeader.writeUInt16LE(1, 2); // type 1 = icon
icoHeader.writeUInt16LE(1, 4); // 1 image

const icoEntry = Buffer.alloc(16);
icoEntry[0] = WIDTH;
icoEntry[1] = HEIGHT;
icoEntry[2] = 0; // palette
icoEntry[3] = 0; // reserved
icoEntry.writeUInt16LE(1, 4); // color planes
icoEntry.writeUInt16LE(32, 6); // bpp
icoEntry.writeUInt32LE(pngBuffer.length, 8); // image bytes
icoEntry.writeUInt32LE(6 + 16, 12); // offset

const icoBuffer = Buffer.concat([icoHeader, icoEntry, pngBuffer]);

fs.writeFileSync(path.join(publicDir, 'favicon.ico'), icoBuffer);
fs.writeFileSync(path.resolve('favicon.ico'), icoBuffer);
fs.writeFileSync(path.join(publicDir, 'logo.svg'), svgEmblem);

console.log('Successfully generated favicon.ico, favicon.svg, and logo.svg!');
