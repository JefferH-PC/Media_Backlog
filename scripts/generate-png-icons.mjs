import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

function createCrcTable() {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      if (c & 1) c = 0xedb88320 ^ (c >>> 1);
      else c = c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
}

const crcTable = createCrcTable();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(4 + 4 + len + 4);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  const crc = crc32(chunk.subarray(4, 8 + len));
  chunk.writeUInt32BE(crc, 8 + len);
  return chunk;
}

function createPng(width, height, renderPixel) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.writeUInt8(8, 8); // bit depth 8
  ihdr.writeUInt8(6, 9); // RGBA
  ihdr.writeUInt8(0, 10); // deflate
  ihdr.writeUInt8(0, 11); // filter
  ihdr.writeUInt8(0, 12); // no interlace

  const ihdrChunk = makeChunk('IHDR', ihdr);

  // Scanlines
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(height * rowSize);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // filter type 0: None
    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      const [r, g, b, a] = renderPixel(x / width, y / height);
      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  const compressed = zlib.deflateSync(rawData);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([sig, ihdrChunk, idatChunk, iendChunk]);
}

// Render logo on normalized coordinates [0..1]
function renderLogo(u, v) {
  // Margin
  const margin = 0.04;
  if (u < margin || u > 1 - margin || v < margin || v > 1 - margin) {
    return [0, 0, 0, 0];
  }

  // Squircle background test (rounded rect rx=0.25)
  const rx = 0.22;
  const ry = 0.22;
  const left = margin;
  const right = 1 - margin;
  const top = margin;
  const bottom = 1 - margin;

  let insideSquircle = false;
  if (u >= left + rx && u <= right - rx && v >= top && v <= bottom) {
    insideSquircle = true;
  } else if (u >= left && u <= right && v >= top + ry && v <= bottom - ry) {
    insideSquircle = true;
  } else {
    const cornerX = u < left + rx ? left + rx : right - rx;
    const cornerY = v < top + ry ? top + ry : bottom - ry;
    const dx = (u - cornerX) / rx;
    const dy = (v - cornerY) / ry;
    if (dx * dx + dy * dy <= 1) {
      insideSquircle = true;
    }
  }

  if (!insideSquircle) return [0, 0, 0, 0];

  // Ribbon check: x in [0.60..0.76], y in [0.26..0.58]
  if (u >= 0.60 && u <= 0.76 && v >= 0.26 && v <= 0.58) {
    // Cutout inverted triangle at bottom of ribbon
    const midX = 0.68;
    const distFromMid = Math.abs(u - midX) / 0.08;
    const cutY = 0.53 + (1 - distFromMid) * 0.05;
    if (v < cutY) {
      return [52, 211, 153, 255]; // Emerald #34d399
    }
  }

  // Top card: y in [0.30..0.39], x in [0.22..0.78]
  if (v >= 0.30 && v <= 0.39 && u >= 0.22 && u <= 0.78) {
    return [244, 244, 245, 255]; // Pure crisp light zinc #f4f4f5
  }

  // Middle card: y in [0.47..0.56], x in [0.22..0.68]
  if (v >= 0.47 && v <= 0.56 && u >= 0.22 && u <= 0.68) {
    return [113, 113, 122, 255]; // Zinc #71717a
  }

  // Bottom card: y in [0.64..0.73], x in [0.22..0.78]
  if (v >= 0.64 && v <= 0.73 && u >= 0.22 && u <= 0.78) {
    return [63, 63, 70, 255]; // Dark zinc #3f3f46
  }

  // Background subtle gradient: from #27272a (top) to #09090b (bottom)
  const grad = Math.min(1, Math.max(0, (v - top) / (bottom - top)));
  const r = Math.round(39 * (1 - grad) + 9 * grad);
  const g = Math.round(39 * (1 - grad) + 9 * grad);
  const b = Math.round(42 * (1 - grad) + 11 * grad);

  return [r, g, b, 255];
}

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Generate 192x192
const png192 = createPng(192, 192, renderLogo);
fs.writeFileSync(path.join(publicDir, 'icon-192.png'), png192);

// Generate 512x512
const png512 = createPng(512, 512, renderLogo);
fs.writeFileSync(path.join(publicDir, 'icon-512.png'), png512);

// Apple touch icon
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), png192);

console.log('Successfully generated PWA icons in public/: icon-192.png, icon-512.png, apple-touch-icon.png');
