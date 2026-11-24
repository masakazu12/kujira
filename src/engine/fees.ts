// Step 13: fees.py — FOMO on Solana exact fee model
// under $5 -> $0.10
// $5 to $47.50 -> 2%
// $47.50 to $190 -> $0.95
// above $190 -> fee_pct (default 0.45%)

export function calculateFomoFee(usd: number, feePct: number = 0.45): number {
  if (usd <= 0) return 0;
  let raw = 0;
  if (usd < 5) {
    raw = 0.1;
  } else if (usd <= 47.5) {
    raw = usd * 0.02;
  } else if (usd <= 190) {
    raw = 0.95;
  } else {
    raw = usd * (feePct / 100);
  }
  return Math.round(raw * 100) / 100;
}

export function feeBandLabel(usd: number, feePct: number = 0.45): string {
  if (usd < 5) return '$0.10 flat (< $5)';
  if (usd <= 47.5) return '2.0% band';
  if (usd <= 190) return '$0.95 flat';
  return `${feePct}% band`;
}
