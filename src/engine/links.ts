// Step 7: LINKS (non-negotiable) — single source of truth for all FOMO URLs

export const CHAIN_ID: Record<string, number> = {
  solana: 1399811149,
  robinhood: 4663,
  base: 8453,
  bnb: 56,
};

export const SIGNUP_URL = 'https://fomo.family/r/Quickscout';

export function coinUrl(address: string, chain: string = 'solana'): string {
  if (!(chain in CHAIN_ID)) {
    return SIGNUP_URL;
  }
  return `https://fomo.family/coin?address=${address}&chainId=${CHAIN_ID[chain]}&r=Quickscout&source=share_link`;
}

export function profileUrl(handle: string): string {
  const clean = handle.replace(/^@+/, '');
  return `https://fomo.family/profile/${clean}?source=share_link&r=Quickscout`;
}
