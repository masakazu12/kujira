export type BotName = 'watcher' | 'vetter' | 'sizer' | 'executor' | 'guard';

export type DeskMode = 'PAPER' | 'LIVE';

export type NavTab =
  | 'home'
  | 'whales'
  | 'bots'
  | 'activity'
  | 'report'
  | 'console'
  | 'settings'
  | 'windows';

export type ChartRange = 'LIVE' | '1H' | '4H' | '1D' | '1W' | 'ALL';

export interface Whale {
  userId: string;
  handle: string;
  address: string;
  rank: number;
  pnl7d: number;
  winRate: number;
  trades7d: number;
  medianHoldMin: number;
  topCoinShare: number;
  chainMatchRate: number;
  addedAt: string;
  muted: boolean;
  lastFillText: string;
  myPnlTonight: number;
  myPnlAllTime: number;
  copiedCount: number;
  refusedCount: number;
  fills: WhaleFill[];
}

export interface WhaleFill {
  id: string;
  whaleId: string;
  whaleHandle: string;
  mint: string;
  symbol: string;
  side: 'buy' | 'sell';
  usd: number;
  ts: string;
  sig: string;
  chainOk: boolean;
  lagS: number;
  status: 'copied' | 'refused' | 'dropped';
  reason?: string;
}

export interface AuditLayer {
  layer: number;
  name: string;
  pass: boolean | null; // null = not checked (stopped at earlier red layer)
  valueText: string;
  source: string;
}

export interface SocialAudit {
  enabled: boolean;
  u15: number;
  u60: number;
  accel: number;
  bigAccounts: number;
  whalePost: boolean;
  shillRatio: number;
  catalyst: string | null;
  coinXDays: number | null;
  value: number | null; // 0..1 or null
  socialPts: number;
  plan: 'A' | 'B' | 'C';
}

export interface CoinScore {
  whalesPart: number;
  convictionPart: number;
  lagPart: number;
  flowPart: number;
  alivePart: number;
  chasePart: number;
  core: number;
  socialVal: number | null;
  socialPts: number;
  clusterBonus: number;
  score: number;
  pass: boolean;
  reason: string;
}

export interface Candle {
  ts: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  whaleEntry?: string;
}

export interface Coin {
  mint: string;
  name: string;
  symbol: string;
  chain: 'solana' | 'robinhood' | 'base' | 'bnb';
  ageText: string;
  price: number;
  mcapUsd: number;
  liquidityUsd: number;
  holders: number;
  volumeH1: number;
  priceChangeH1: number;
  uniqueBuys5m: number;
  uniqueSells5m: number;
  status: 'held' | 'closed' | 'audited' | 'rejected' | 'watching';
  whales: string[];
  firstWhaleUsd: number;
  firstSeenAgo: string;
  layers: AuditLayer[];
  social: SocialAudit;
  score: CoinScore;
  candles: Candle[];
  whaleExitPct?: number;
}

export interface OrderCheckStep {
  label: string;
  ms: number;
  ok: boolean;
}

export interface Order {
  id: string;
  ts: string;
  mint: string;
  symbol: string;
  side: 'buy' | 'sell';
  usdAsked: number;
  pct?: number;
  bot: BotName;
  reason: string;
  status: 'queued' | 'clicking' | 'verifying' | 'done' | 'failed' | 'unverified';
  quoteText: string;
  feeText: string;
  feeUsd: number;
  priceImpactPct: number;
  screenOk: boolean;
  screenDetail: string;
  apiOk: boolean;
  apiDetail: string;
  chainOk: boolean | 'n/a';
  chainDetail: string;
  fillUsd: number;
  stepsMs: OrderCheckStep[];
  error?: string;
}

export interface Position {
  id: string;
  mint: string;
  symbol: string;
  openedAt: string;
  entryPrice: number;
  currentPrice: number;
  sizeUsd: number;
  tokens: string; // raw integer text as per Step 5
  decimals: number;
  peakPrice: number;
  stopPrice: number;
  tpDone: boolean;
  trailActive: boolean;
  leadWhale: string;
  whales: string[];
  whaleExited: boolean;
  closedAt?: string;
  exitPrice?: number;
  exitReason?: string;
  pnlUsd: number;
  pnlPct: number;
  feesUsd: number;
  mode: DeskMode;
  score: number;
  lagS: number;
  whaleResultPct?: number;
}

export type ActivityKind = 'copied' | 'bought' | 'sold' | 'stopped' | 'exited' | 'rejected' | 'skipped';

export interface ActivityItem {
  id: string;
  ts: string;
  kind: ActivityKind;
  mint: string;
  symbol: string;
  title: string;
  subtitle: string;
  rightValue: string;
  rightTone: 'green' | 'red' | 'orange' | 'blue' | 'neutral';
  orderId?: string;
}

export interface BalanceMark {
  index: number;
  label: string;
  tone: 'blue' | 'green' | 'red';
}

export interface BalancePoint {
  ts: number;
  label: string;
  value: number;
}

export interface DeskSettings {
  // Watcher
  whales_top_n: number;
  min_windows: number;
  min_win_rate: number;
  min_trades_7d: number;
  min_median_hold_min: number;
  max_top_coin_share: number;
  poll_s: number;
  max_lag_s: number;
  min_whale_buy_usd: number;
  ignore_after_mcap_usd: number;
  // Vetter
  max_dev_pct: number;
  max_top10_pct: number;
  min_lp_locked_pct: number;
  max_bundled: number;
  max_delegated_accounts: number;
  retries: number;
  min_score: number;
  alive_volume_h1: number;
  max_chase_pct: number;
  flow_sell_ratio: number;
  cluster_bonus: number;
  // Social
  social_weight: number;
  social_max_per_h: number;
  social_timeout_s: number;
  shill_cut: number;
  // Sizer
  risk_per_trade_pct: number;
  stop_pct: number;
  one_whale_size: number;
  two_whale_size: number;
  full_whales: number;
  max_pool_pct: number;
  min_ticket_usd: number;
  max_ticket_usd: number;
  max_trades_night: number;
  max_open: number;
  // Executor
  dip_pct: number;
  dip_window_min: number;
  dip_wait_min: number;
  crash_pct: number;
  tp_x: number;
  tp_sell_pct: number;
  trail_pct: number;
  recheck_liq_drop_pct: number;
  recheck_price_up_pct: number;
  quote_timeout_s: number;
  verify_timeout_s: number;
  // Guard
  guard_poll_s: number;
  timeout_h: number;
  timeout_min_gain_pct: number;
  whale_exit_sell_pct: number;
  whale_exit_min_whales: number;
  night_loss_stop_pct: number;
  // Desk
  paper_start_cash: number;
  fee_pct: number;
  confirm_expiry_s: number;
  prices_keep_days: number;
  frames_keep: number;
  logs_keep_days: number;
  backups_keep: number;
  fomo_handle: string;
  withdraw_address: string;
  tz: string;
  night_start: string;
  lock_time: string;
  report_time: string;
  push_rejects: boolean;
}

export interface ChangeLogEntry {
  id: string;
  ts: string;
  key: string;
  oldVal: string;
  newVal: string;
  who: string;
}

export interface BotDecision {
  id: string;
  ts: string;
  mint?: string;
  symbol?: string;
  text: string;
  outcome: 'pass' | 'reject' | 'action' | 'info';
}

export interface BotState {
  name: BotName;
  label: string;
  jpRole: string;
  color: string;
  paused: boolean;
  todayCount: number;
  metricLine: string;
  statusLine: string;
  decisions: BotDecision[];
}

export interface LiveScreenState {
  activeBot: BotName | 'idle';
  actionLabel: string;
  coinSymbol: string;
  coinMint: string;
  cursorX: number; // percentage 0..100
  cursorY: number; // percentage 0..100
  clicking: boolean;
  privatePaused: boolean;
  lastFrameTs: number;
  lastOrderSummary: string;
  checks: {
    screen: boolean;
    api: boolean;
    chain: boolean;
  };
  scriptStep: string;
  amountTyped: string;
  quoteShown: string;
}

export interface NotificationItem {
  id: string;
  ts: string;
  title: string;
  body: string;
  mint?: string;
  symbol?: string;
  targetTab: NavTab;
  read: boolean;
  tone: 'green' | 'red' | 'orange' | 'blue' | 'neutral';
}

export interface AcceptanceTestResult {
  id: number;
  name: string;
  summary: string;
  passed: boolean;
  detail: string;
  durationMs: number;
}
