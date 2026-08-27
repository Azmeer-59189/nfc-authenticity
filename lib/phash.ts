import sharp from "sharp";

/**
 * Difference hash (dHash): a fast, dependency-light perceptual hash.
 *
 * The image is shrunk to 9x8 grayscale pixels. For each row, we compare each
 * pixel to the one right after it -- if it's brighter, that bit is 1. That
 * gives 8 comparisons x 8 rows = 64 bits, which we store as a 16-character
 * hex string.
 *
 * Unlike a cryptographic hash, small differences in the photo (lighting,
 * angle, compression) only flip a handful of bits, so we compare two hashes
 * by counting how many bits differ (Hamming distance) rather than requiring
 * an exact match. This is intentionally a *low-security* check -- easy to
 * fool with a good enough replica photo -- which matches the low-priority
 * role image verification plays in this project versus NFC.
 */
export async function computeImageHash(input: Buffer): Promise<string> {
  const { data } = await sharp(input)
    .resize(9, 8, { fit: "fill" })
    .grayscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  let bits = "";
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const left = data[row * 9 + col];
      const right = data[row * 9 + col + 1];
      bits += left > right ? "1" : "0";
    }
  }

  // Pack the 64-bit binary string into 16 hex characters.
  let hex = "";
  for (let i = 0; i < 64; i += 4) {
    hex += parseInt(bits.slice(i, i + 4), 2).toString(16);
  }
  return hex;
}

export function hammingDistance(hashA: string, hashB: string): number {
  if (hashA.length !== hashB.length) {
    return Math.max(hashA.length, hashB.length) * 4; // treat as maximally different
  }
  let distance = 0;
  for (let i = 0; i < hashA.length; i++) {
    const diff = parseInt(hashA[i], 16) ^ parseInt(hashB[i], 16);
    distance += diff.toString(2).split("1").length - 1;
  }
  return distance;
}

// Out of 64 total bits. Empirically, dHash distances under ~10 mean "very
// likely the same image"; genuinely different images are usually 20+.
// Tune this after testing with real product photos.
export const IMAGE_MATCH_THRESHOLD = 12;
