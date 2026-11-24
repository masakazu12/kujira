import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  Bell,
  Bot,
  Check,
  ExternalLink,
  FileText,
  Home,
  Minus,
  Monitor,
  Pause,
  Play,
  Search,
  Settings,
  Square,
  Terminal,
  Users,
  X,
} from 'lucide-react';
import {
  ActivityItem,
  AuditLayer,
  BalanceMark,
  BalancePoint,
  BotName,
  BotState,
  ChartRange,
  ChangeLogEntry,
  Coin,
  DeskMode,
  DeskSettings,
  LiveScreenState,
  NavTab,
  NotificationItem,
  Order,
  Position,
  Whale,
} from './types/desk';
import { DEFAULT_SETTINGS, validateSettingChange } from './engine/settingsConfig';
import {
  INITIAL_ACTIVITY,
  INITIAL_BALANCE_HISTORY,
  INITIAL_BALANCE_MARKS,
  INITIAL_BOTS,
  INITIAL_CHANGE_LOG,
  INITIAL_CLOSED_POSITIONS,
  INITIAL_COINS,
  INITIAL_LIVE_SCREEN,
  INITIAL_NOTIFICATIONS,
  INITIAL_ORDERS,
  INITIAL_POSITIONS,
  INITIAL_WHALES,
} from './engine/initialData';
import {
  computeSizerDecision,
  computeVetterScore,
  evaluateGuardPosition,
} from './engine/botLogic';
import { calculateFomoFee, feeBandLabel } from './engine/fees';
import { coinUrl, profileUrl } from './engine/links';
import { HomeView } from './components/HomeView';
import { WhalesView } from './components/WhalesView';
import { BotsView } from './components/BotsView';
import { ActivityView } from './components/ActivityView';
import { MorningReportView } from './components/MorningReportView';
import { CommandConsoleView } from './components/CommandConsoleView';
import { SettingsView } from './components/SettingsView';
import { WindowsSetupView } from './components/WindowsSetupView';
import { AuditModal } from './components/AuditModal';
import { CoinDetailModal } from './components/CoinDetailModal';
import { OrderSheetModal } from './components/OrderSheetModal';
import { WhaleDetailModal } from './components/WhaleDetailModal';

const SAMPLE_NEW_COINS = [
  { symbol: 'AEROX', name: 'AeroX AI', mcap: 410000, liq: 42000, passAll: true, failLayer: 0 },
  { symbol: 'SHIBA9', name: 'Shiba9000', mcap: 280000, liq: 21000, passAll: false, failLayer: 4 },
  { symbol: 'KAIJU', name: 'Kaiju Sol', mcap: 530000, liq: 54000, passAll: true, failLayer: 0 },
  { symbol: 'MINTX', name: 'MintTrap', mcap: 195000, liq: 16500, passAll: false, failLayer: 1 },
  { symbol: 'TORI', name: 'Tori Mesh', mcap: 620000, liq: 68000, passAll: true, failLayer: 0 },
];

const NAV_ITEMS: { id: NavTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'home', label: 'ホーム', icon: Home },
  { id: 'whales', label: 'クジラ監視', icon: Users },
  { id: 'bots', label: 'ボット制御', icon: Bot },
  { id: 'activity', label: 'アクティビティ', icon: Activity },
  { id: 'report', label: '朝レポート', icon: FileText },
  { id: 'console', label: 'Telegram操作', icon: Terminal },
  { id: 'settings', label: '設定・口座', icon: Settings },
  { id: 'windows', label: 'Windows導入', icon: Monitor },
];

function nowHms(): string {
  return new Date().toTimeString().slice(0, 8);
}

function nowHm(): string {
  return new Date().toTimeString().slice(0, 5);
}

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [sidebarCompact, setSidebarCompact] = useState(false);
  const [mode, setMode] = useState<DeskMode>('PAPER');
  const [engineRunning, setEngineRunning] = useState(true);
  const [settings, setSettings] = useState<DeskSettings>(DEFAULT_SETTINGS);
  const [changeLog, setChangeLog] = useState<ChangeLogEntry[]>(INITIAL_CHANGE_LOG);

  const [whales, setWhales] = useState<Whale[]>(INITIAL_WHALES);
  const [coins, setCoins] = useState<Coin[]>(INITIAL_COINS);
  const [openPositions, setOpenPositions] = useState<Position[]>(INITIAL_POSITIONS);
  const [closedPositions, setClosedPositions] = useState<Position[]>(INITIAL_CLOSED_POSITIONS);
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [activity, setActivity] = useState<ActivityItem[]>(INITIAL_ACTIVITY);
  const [bots, setBots] = useState<BotState[]>(INITIAL_BOTS);
  const [liveScreen, setLiveScreen] = useState<LiveScreenState>(INITIAL_LIVE_SCREEN);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);

  const [balanceHistory, setBalanceHistory] = useState<BalancePoint[]>(INITIAL_BALANCE_HISTORY);
  const [balanceMarks, setBalanceMarks] = useState<BalanceMark[]>(INITIAL_BALANCE_MARKS);
  const [chartRange, setChartRange] = useState<ChartRange>('LIVE');
  const [simCounter, setSimCounter] = useState(0);

  // Modals & Overlays
  const [auditMint, setAuditMint] = useState<string | null>(null);
  const [coinMint, setCoinMint] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [selectedWhaleId, setSelectedWhaleId] = useState<string | null>(null);
  const [bellOpen, setBellOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>(['XYZ', 'KUMO', '@alpha', 'RUGX']);

  // Computed balances
  const startBalance = settings.paper_start_cash;
  const realizedPnl = useMemo(
    () => closedPositions.reduce((acc, p) => acc + p.pnlUsd, 0),
    [closedPositions]
  );
  const unrealizedPnl = useMemo(
    () => openPositions.reduce((acc, p) => acc + p.pnlUsd, 0),
    [openPositions]
  );
  const investedCash = useMemo(
    () => openPositions.reduce((acc, p) => acc + p.sizeUsd, 0),
    [openPositions]
  );
  const totalBalance = Math.max(0, Math.round((startBalance + realizedPnl + unrealizedPnl) * 100) / 100);
  const freeCash = Math.max(0, Math.round((startBalance + realizedPnl - investedCash) * 100) / 100);
  const unreadCount = notifications.filter((n) => !n.read).length;

  // Global Ctrl+K shortcut for Windows desktop UX
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        setSearchOpen(false);
        setBellOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // Live 3-second Guard & Market Price Heartbeat
  useEffect(() => {
    if (!engineRunning) return;

    const timer = window.setInterval(() => {
      setOpenPositions((prevPositions) => {
        if (prevPositions.length === 0) return prevPositions;
        const nextPositions = prevPositions.map((pos) => {
          const drift = (Math.random() - 0.48) * 0.025;
          const nextPrice = Math.max(pos.entryPrice * 0.5, pos.currentPrice * (1 + drift));
          const peakPrice = Math.max(pos.peakPrice, nextPrice);
          const pnlPct = ((nextPrice - pos.entryPrice) / pos.entryPrice) * 100;
          const pnlUsd = Math.round(pos.sizeUsd * (pnlPct / 100) * 100) / 100;
          return {
            ...pos,
            currentPrice: nextPrice,
            peakPrice,
            pnlPct,
            pnlUsd,
          };
        });

        // Update coins price to match open positions
        setCoins((prevCoins) =>
          prevCoins.map((c) => {
            const match = nextPositions.find((p) => p.mint === c.mint);
            if (!match) return c;
            const last = c.candles[c.candles.length - 1];
            const updatedCandles = last
              ? [
                  ...c.candles.slice(0, -1),
                  {
                    ...last,
                    close: match.currentPrice,
                    high: Math.max(last.high, match.currentPrice),
                    low: Math.min(last.low, match.currentPrice),
                  },
                ]
              : c.candles;
            return { ...c, price: match.currentPrice, candles: updatedCandles };
          })
        );

        // Evaluate Guard priority rules
        nextPositions.forEach((p) => {
          const dec = evaluateGuardPosition(p, settings, 0.4);
          if (dec.action === 'sell_100') {
            window.setTimeout(() => handleSellPosition(p.mint, 100, dec.reason, 'guard'), 10);
          } else if (dec.action === 'sell_tp') {
            window.setTimeout(
              () => handleSellPosition(p.mint, settings.tp_sell_pct, dec.reason, 'executor'),
              10
            );
          }
        });

        return nextPositions;
      });

      // Subtle Live Screen heartbeat cursor movement when idle/guarding
      setLiveScreen((prev) => {
        if (prev.privatePaused || prev.clicking) return prev;
        return {
          ...prev,
          lastFrameTs: Date.now(),
          cursorX: 58 + Math.round(Math.random() * 24),
          cursorY: 42 + Math.round(Math.random() * 26),
        };
      });
    }, 3200);

    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engineRunning, settings]);

  // Append balance curve point when totalBalance shifts noticeably
  useEffect(() => {
    setBalanceHistory((prev) => {
      const last = prev[prev.length - 1];
      if (last && Math.abs(last.value - totalBalance) < 0.08) return prev;
      const next = [
        ...prev.slice(-29),
        { ts: Date.now(), label: nowHm(), value: totalBalance },
      ];
      return next;
    });
  }, [totalBalance]);

  const pushNotification = (item: Omit<NotificationItem, 'id' | 'ts' | 'read'>) => {
    setNotifications((prev) => [
      { ...item, id: `n_${Date.now()}_${Math.random()}`, ts: nowHm(), read: false },
      ...prev.slice(0, 24),
    ]);
  };

  const handleToggleWhaleMuteById = (userId: string) => {
    setWhales((prev) =>
      prev.map((w) => (w.userId === userId ? { ...w, muted: !w.muted } : w))
    );
  };

  const handleToggleWhaleMuteByHandle = (handle: string, muted: boolean): boolean => {
    const clean = handle.toLowerCase().replace(/^@/, '');
    const found = whales.find((w) => w.handle.toLowerCase().replace(/^@/, '') === clean);
    if (!found) return false;
    setWhales((prev) =>
      prev.map((w) => (w.userId === found.userId ? { ...w, muted } : w))
    );
    return true;
  };

  const handleToggleBotPause = (name: BotName, forcePaused?: boolean) => {
    if (name === 'guard' && openPositions.length > 0 && forcePaused !== false) {
      return; // Non-negotiable Guard invariant
    }
    setBots((prev) =>
      prev.map((b) =>
        b.name === name
          ? { ...b, paused: forcePaused !== undefined ? forcePaused : !b.paused }
          : b
      )
    );
  };

  const handleSaveSetting = (key: keyof DeskSettings, value: number): string | null => {
    const validation = validateSettingChange(settings, key, value);
    if (!validation.valid) {
      return validation.error || '422 Validation Error';
    }
    const oldVal = String(settings[key]);
    setSettings((prev) => ({ ...prev, [key]: value }));

    // Note: Step 12 invariant — looser stop_pct NEVER moves an open position's stop down.
    // Tightening stop_pct may raise stopPrice upward only.
    if (key === 'stop_pct') {
      setOpenPositions((prev) =>
        prev.map((pos) => {
          const candidateStop = pos.entryPrice * (1 - value / 100);
          return { ...pos, stopPrice: Math.max(pos.stopPrice, candidateStop) };
        })
      );
    }

    setChangeLog((prev) => [
      {
        id: `cl_${Date.now()}`,
        ts: nowHms(),
        key,
        oldVal,
        newVal: String(value),
        who: 'me (Windows Desk)',
      },
      ...prev,
    ]);
    return null;
  };

  const handleSellPosition = (
    mint: string,
    pct: number,
    reason: string = 'manual sell',
    bot: BotName = 'executor'
  ) => {
    const pos = openPositions.find((p) => p.mint === mint);
    if (!pos) return;

    const fraction = Math.min(100, Math.max(1, pct)) / 100;
    const costPortion = Math.round(pos.sizeUsd * fraction * 100) / 100;
    const grossUsd = Math.round(costPortion * (pos.currentPrice / pos.entryPrice) * 100) / 100;
    const feeUsd = calculateFomoFee(grossUsd, settings.fee_pct);
    const netUsd = Math.round((grossUsd - feeUsd) * 100) / 100;
    const pnlUsd = Math.round((netUsd - costPortion) * 100) / 100;
    const pnlPct = costPortion > 0 ? (pnlUsd / costPortion) * 100 : 0;

    const newOrderId = `ord_${Date.now().toString().slice(-4)}`;
    const newOrder: Order = {
      id: newOrderId,
      ts: nowHms(),
      mint: pos.mint,
      symbol: pos.symbol,
      side: 'sell',
      usdAsked: grossUsd,
      pct,
      bot,
      reason,
      status: 'done',
      quoteText: `${pct}% ${pos.symbol} -> $${grossUsd.toFixed(2)} USDC`,
      feeText: `$${feeUsd.toFixed(2)} (${feeBandLabel(grossUsd, settings.fee_pct)})`,
      feeUsd,
      priceImpactPct: 0.34,
      screenOk: true,
      screenDetail: `${mode} S${pct === 100 ? '4' : '3'} Sell ${pct}% verified`,
      apiOk: true,
      apiDetail: `${mode} /swaps verified · $${netUsd.toFixed(2)} net`,
      chainOk: true,
      chainDetail: `RPC balance decreased by ${pct}%`,
      fillUsd: netUsd,
      stepsMs: [
        { label: 'S1 OPEN coin_url', ms: 710, ok: true },
        { label: `S${pct === 100 ? '4' : '3'} Sell ${pct}%`, ms: 390, ok: true },
        { label: 'Quote & Verify', ms: 1120, ok: true },
      ],
    };

    setOrders((prev) => [newOrder, ...prev]);

    if (pct >= 100) {
      setOpenPositions((prev) => prev.filter((p) => p.mint !== mint));
      setClosedPositions((prev) => [
        {
          ...pos,
          closedAt: nowHms(),
          exitPrice: pos.currentPrice,
          exitReason: reason,
          pnlUsd,
          pnlPct,
          feesUsd: pos.feesUsd + feeUsd,
        },
        ...prev,
      ]);
      setCoins((prev) => prev.map((c) => (c.mint === mint ? { ...c, status: 'closed' } : c)));
    } else {
      const remSize = Math.round((pos.sizeUsd - costPortion) * 100) / 100;
      setOpenPositions((prev) =>
        prev.map((p) =>
          p.mint === mint
            ? {
                ...p,
                sizeUsd: remSize,
                tpDone: true,
                trailActive: true,
                pnlUsd: Math.round(remSize * ((p.currentPrice - p.entryPrice) / p.entryPrice) * 100) / 100,
              }
            : p
        )
      );
      setClosedPositions((prev) => [
        {
          ...pos,
          id: `${pos.id}_part_${Date.now()}`,
          sizeUsd: costPortion,
          closedAt: nowHms(),
          exitPrice: pos.currentPrice,
          exitReason: `${reason} (${pct}%)`,
          pnlUsd,
          pnlPct,
          feesUsd: feeUsd,
        },
        ...prev,
      ]);
    }

    const isStop = reason.toLowerCase().includes('stop');
    const actItem: ActivityItem = {
      id: `act_${Date.now()}`,
      ts: nowHms(),
      kind: isStop ? 'stopped' : 'sold',
      mint: pos.mint,
      symbol: pos.symbol,
      title: `${isStop ? 'Stopped' : 'Sold'} ${pos.symbol} · ${bot === 'guard' ? 'Guard' : 'Executor'}`,
      subtitle: `${reason} · ${pnlUsd >= 0 ? '+' : '-'}$${Math.abs(pnlUsd).toFixed(2)} (${pnlPct >= 0 ? '+' : ''}${pnlPct.toFixed(1)}%)`,
      rightValue: `${pnlUsd >= 0 ? '+' : '-'}$${Math.abs(pnlUsd).toFixed(2)}`,
      rightTone: pnlUsd >= 0 ? 'green' : 'red',
      orderId: newOrderId,
    };
    setActivity((prev) => [actItem, ...prev]);

    setBalanceMarks((prev) => [
      ...prev,
      {
        index: balanceHistory.length,
        label: `${pnlUsd >= 0 ? '+' : '-'}$${Math.abs(pnlUsd).toFixed(2)}`,
        tone: pnlUsd >= 0 ? 'green' : 'red',
      },
    ]);

    setLiveScreen((prev) => ({
      ...prev,
      activeBot: bot,
      actionLabel: `${bot === 'guard' ? 'Guard' : 'Executor'} · Sold ${pos.symbol} (${pct}%)`,
      coinSymbol: pos.symbol,
      coinMint: pos.mint,
      cursorX: 78,
      cursorY: 74,
      clicking: true,
      lastFrameTs: Date.now(),
      lastOrderSummary: `Sold ${pos.symbol} · $${grossUsd.toFixed(2)} · verified`,
      checks: { screen: true, api: true, chain: true },
      scriptStep: `S${pct === 100 ? '4' : '3'} Sold ${pct}% -> VERIFY ok`,
      amountTyped: `${pct}%`,
      quoteShown: `${pct}% ${pos.symbol} -> $${grossUsd.toFixed(2)} · Fee $${feeUsd.toFixed(2)}`,
    }));

    window.setTimeout(() => {
      setLiveScreen((prev) => ({ ...prev, clicking: false }));
    }, 600);

    setBots((prev) =>
      prev.map((b) =>
        b.name === bot
          ? {
              ...b,
              todayCount: b.todayCount + 1,
              statusLine: `Sold ${pos.symbol} (${pct}%) · ${pnlUsd >= 0 ? '+' : '-'}$${Math.abs(pnlUsd).toFixed(2)}`,
              decisions: [
                {
                  id: `d_${Date.now()}`,
                  ts: nowHms(),
                  mint: pos.mint,
                  symbol: pos.symbol,
                  text: `S${pct === 100 ? '4' : '3'} ${reason} · Sold ${pct}% ($${grossUsd.toFixed(2)}) verified`,
                  outcome: pnlUsd >= 0 ? 'action' : 'reject',
                },
                ...b.decisions.slice(0, 19),
              ],
            }
          : b
      )
    );

    pushNotification({
      title: `${mode} · ${isStop ? 'Stopped' : 'Sold'} ${pos.symbol} · ${pnlUsd >= 0 ? '+' : '-'}$${Math.abs(pnlUsd).toFixed(2)}`,
      body: `${reason} · 3 checks verified (screen · api · chain).`,
      mint: pos.mint,
      symbol: pos.symbol,
      targetTab: 'activity',
      tone: pnlUsd >= 0 ? 'green' : 'red',
    });
  };

  const handlePanicSellAll = (): number => {
    const count = openPositions.length;
    handleToggleBotPause('watcher', true);
    openPositions.forEach((p) => handleSellPosition(p.mint, 100, 'PANIC exit', 'guard'));
    return count;
  };

  // Run a full animated 5-bot pipeline simulation (Watcher -> Vetter -> Sizer -> Executor)
  const handleSimulateWhaleSignal = (forcedSymbol?: string) => {
    const watcherBot = bots.find((b) => b.name === 'watcher');
    if (watcherBot?.paused && !forcedSymbol) {
      pushNotification({
        title: 'Watcher が一時停止中です',
        body: 'ボット制御画面から Watcher を再開してください。',
        targetTab: 'bots',
        tone: 'orange',
      });
      return;
    }

    const template = forcedSymbol
      ? { symbol: forcedSymbol, name: `${forcedSymbol} Token`, mcap: 450000, liq: 48000, passAll: true, failLayer: 0 }
      : SAMPLE_NEW_COINS[simCounter % SAMPLE_NEW_COINS.length];
    setSimCounter((c) => c + 1);

    const mint = `${template.symbol}${Math.random().toString(36).slice(2, 10).toUpperCase()}9xKp4mQv7nLz2wBc5tYz`;
    const activeWhales = whales.filter((w) => !w.muted);
    const leadWhale = activeWhales[simCounter % Math.max(1, activeWhales.length)] || whales[0];
    const whaleCount = template.passAll ? (simCounter % 2 === 0 ? 2 : 3) : 1;
    const pickedWhales = activeWhales.slice(0, whaleCount).map((w) => w.handle);
    if (pickedWhales.length === 0) pickedWhales.push('@alpha');
    const whaleBuyUsd = 480 + (simCounter % 3) * 140;

    // Step 1: Watcher cursor
    setLiveScreen((prev) => ({
      ...prev,
      activeBot: 'watcher',
      actionLabel: `Watcher · ${leadWhale.handle} bought ${template.symbol} ($${whaleBuyUsd})`,
      coinSymbol: template.symbol,
      coinMint: mint,
      cursorX: 28,
      cursorY: 36,
      lastFrameTs: Date.now(),
      scriptStep: 'PumpPortal ws -> polling whale /swaps',
    }));

    // Build 8 layers
    const layerDefs = [
      { n: 1, name: 'Mint authority', okVal: 'Revoked', badVal: 'mint not revoked', src: 'Solana RPC' },
      { n: 2, name: 'Freeze authority', okVal: 'Revoked', badVal: 'freeze not revoked', src: 'Solana RPC' },
      { n: 3, name: 'Dev wallet', okVal: '1.1% · sold 0', badVal: 'dev holds 24%', src: 'RugCheck' },
      { n: 4, name: 'Top 10 holders', okVal: '18.4%', badVal: 'top 10 hold 54%', src: 'getTokenLargestAccounts' },
      { n: 5, name: 'Liquidity', okVal: '100% burned', badVal: 'liquidity unlocked', src: 'RugCheck' },
      { n: 6, name: 'FOMO warnings', okVal: 'None', badVal: 'FOMO: selling off', src: 'FOMO tokenWarnings' },
      { n: 7, name: 'Bundles', okVal: 'largest group 2%', badVal: '16 bundled wallets', src: 'RugCheck insiders' },
      { n: 8, name: 'Delegations', okVal: 'None', badVal: '28 wallets -> 4kQx...R9a', src: 'getProgramAccounts' },
    ];

    const layers: AuditLayer[] = layerDefs.map((d) => {
      if (!template.passAll && d.n === template.failLayer) {
        return { layer: d.n, name: d.name, pass: false, valueText: d.badVal, source: d.src };
      }
      if (!template.passAll && d.n > template.failLayer) {
        return { layer: d.n, name: d.name, pass: null, valueText: 'not checked', source: `Stopped at L${template.failLayer}` };
      }
      return { layer: d.n, name: d.name, pass: true, valueText: d.okVal, source: d.src };
    });

    const score = computeVetterScore({
      layers,
      whaleCount: pickedWhales.length,
      firstUsd: whaleBuyUsd,
      leadWinRate: leadWhale.winRate,
      lagS: 6,
      chainOk: true,
      uniqueBuys5m: 44,
      uniqueSells5m: 21,
      priceChangeH1: 32,
      volumeH1: 92000,
      socialVal: template.passAll ? 0.68 : null,
      settings,
    });

    const entryPrice = Number((0.00025 + Math.random() * 0.0009).toFixed(6));
    const newCoin: Coin = {
      mint,
      name: template.name,
      symbol: template.symbol,
      chain: 'solana',
      ageText: '18m old',
      price: entryPrice,
      mcapUsd: template.mcap,
      liquidityUsd: template.liq,
      holders: 780,
      volumeH1: 92000,
      priceChangeH1: 32,
      uniqueBuys5m: 44,
      uniqueSells5m: 21,
      status: score.pass ? 'held' : 'rejected',
      whales: pickedWhales,
      firstWhaleUsd: whaleBuyUsd,
      firstSeenAgo: '6s ago',
      layers,
      social: {
        enabled: template.passAll,
        u15: template.passAll ? 17 : 0,
        u60: template.passAll ? 39 : 0,
        accel: template.passAll ? 1.74 : 0,
        bigAccounts: template.passAll ? 2 : 0,
        whalePost: false,
        shillRatio: 0.02,
        catalyst: null,
        coinXDays: template.passAll ? 14 : null,
        value: template.passAll ? 0.68 : null,
        socialPts: score.socialPts,
        plan: template.passAll ? 'A' : 'C',
      },
      score,
      candles: Array.from({ length: 24 }, (_, idx) => {
        const p = entryPrice * (0.86 + idx * 0.006 + (Math.sin(idx) * 0.02));
        return {
          ts: Date.now() - (24 - idx) * 60_000,
          open: p * 0.99,
          close: p,
          high: p * 1.02,
          low: p * 0.97,
          volume: 1800,
          whaleEntry: idx === 22 ? leadWhale.handle : undefined,
        };
      }),
    };

    setCoins((prev) => [newCoin, ...prev]);

    // Step 2: Vetter after 450ms
    window.setTimeout(() => {
      setLiveScreen((prev) => ({
        ...prev,
        activeBot: 'vetter',
        actionLabel: score.pass
          ? `Vetter · ${template.symbol} 8/8 PASS (Score ${score.score})`
          : `Vetter · ${template.symbol} REJECTED (${score.reason})`,
        cursorX: 48,
        cursorY: 48,
        scriptStep: score.pass ? '8/8 Green -> Passing to Sizer' : `Stopped at L${template.failLayer}`,
      }));

      setBots((prev) =>
        prev.map((b) => {
          if (b.name === 'watcher') {
            return {
              ...b,
              todayCount: b.todayCount + 1,
              statusLine: `${leadWhale.handle} bought ${template.symbol} · $${whaleBuyUsd} · 6s`,
              decisions: [
                {
                  id: `wd_${Date.now()}`,
                  ts: nowHms(),
                  mint,
                  symbol: template.symbol,
                  text: `${leadWhale.handle} bought $${whaleBuyUsd} · lag 6s · chain_ok true`,
                  outcome: 'pass',
                },
                ...b.decisions.slice(0, 19),
              ],
            };
          }
          if (b.name === 'vetter') {
            return {
              ...b,
              todayCount: b.todayCount + 1,
              statusLine: score.pass
                ? `${template.symbol} 8/8 · Score ${score.score}`
                : `Rejected ${template.symbol} · ${score.reason}`,
              decisions: [
                {
                  id: `vd_${Date.now()}`,
                  ts: nowHms(),
                  mint,
                  symbol: template.symbol,
                  text: score.pass
                    ? `8/8 Green · Score ${score.score} (Social +${score.socialPts}) PASS`
                    : `STOP · ${score.reason}`,
                  outcome: score.pass ? 'pass' : 'reject',
                },
                ...b.decisions.slice(0, 19),
              ],
            };
          }
          return b;
        })
      );

      if (!score.pass) {
        setActivity((prev) => [
          {
            id: `act_${Date.now()}`,
            ts: nowHms(),
            kind: 'rejected',
            mint,
            symbol: template.symbol,
            title: `Rejected ${template.symbol} · Vetter`,
            subtitle: score.reason,
            rightValue: `L${template.failLayer} Red`,
            rightTone: 'red',
          },
          ...prev,
        ]);
        return;
      }

      // Step 3: Sizer + Executor
      const sizerRes = computeSizerDecision({
        freeCash,
        whaleCount: pickedWhales.length,
        score: score.score,
        poolLiquidityUsd: template.liq,
        shillRing: false,
        openCount: openPositions.length,
        tradesTonight: orders.length,
        nightLossPct: Math.max(0, ((startBalance - totalBalance) / startBalance) * 100),
        settings,
      });

      if (sizerRes.skipped) {
        setActivity((prev) => [
          {
            id: `act_${Date.now()}`,
            ts: nowHms(),
            kind: 'skipped',
            mint,
            symbol: template.symbol,
            title: `Skipped ${template.symbol} · Sizer`,
            subtitle: sizerRes.reason,
            rightValue: 'Skipped',
            rightTone: 'orange',
          },
          ...prev,
        ]);
        return;
      }

      window.setTimeout(() => {
        const feeUsd = calculateFomoFee(sizerRes.sizeUsd, settings.fee_pct);
        const ordId = `ord_${Date.now().toString().slice(-4)}`;
        const tokensCount = Math.floor((sizerRes.sizeUsd / entryPrice) * 1_000_000).toString();

        const buyOrder: Order = {
          id: ordId,
          ts: nowHms(),
          mint,
          symbol: template.symbol,
          side: 'buy',
          usdAsked: sizerRes.sizeUsd,
          bot: 'executor',
          reason: `dip -${settings.dip_pct}% (${pickedWhales.length} whales)`,
          status: 'done',
          quoteText: `$${sizerRes.sizeUsd.toFixed(2)} -> ${(sizerRes.sizeUsd / entryPrice).toFixed(1)} ${template.symbol}`,
          feeText: `$${feeUsd.toFixed(2)} (${feeBandLabel(sizerRes.sizeUsd, settings.fee_pct)})`,
          feeUsd,
          priceImpactPct: 0.29,
          screenOk: true,
          screenDetail: `${mode} S2 readback exact "${sizerRes.sizeUsd.toFixed(2)}"`,
          apiOk: true,
          apiDetail: `${mode} /swaps verified within 0.0%`,
          chainOk: true,
          chainDetail: `Balance 0 -> ${(sizerRes.sizeUsd / entryPrice).toFixed(1)} ${template.symbol}`,
          fillUsd: sizerRes.sizeUsd,
          stepsMs: [
            { label: 'S1 OPEN coin_url', ms: 810, ok: true },
            { label: `S2 Type ${sizerRes.sizeUsd.toFixed(2)}`, ms: 440, ok: true },
            { label: 'Quote & Verify', ms: 1320, ok: true },
          ],
        };

        const newPos: Position = {
          id: `pos_${Date.now()}`,
          mint,
          symbol: template.symbol,
          openedAt: nowHms(),
          entryPrice,
          currentPrice: entryPrice * 1.02,
          sizeUsd: sizerRes.sizeUsd,
          tokens: tokensCount,
          decimals: 6,
          peakPrice: entryPrice * 1.02,
          stopPrice: entryPrice * (1 - settings.stop_pct / 100),
          tpDone: false,
          trailActive: false,
          leadWhale: leadWhale.handle,
          whales: pickedWhales,
          whaleExited: false,
          pnlUsd: Math.round(sizerRes.sizeUsd * 0.02 * 100) / 100,
          pnlPct: 2.0,
          feesUsd: feeUsd,
          mode,
          score: score.score,
          lagS: 6,
          whaleResultPct: 12,
        };

        setOrders((prev) => [buyOrder, ...prev]);
        setOpenPositions((prev) => [newPos, ...prev]);
        setActivity((prev) => [
          {
            id: `act_b_${Date.now()}`,
            ts: nowHms(),
            kind: 'bought',
            mint,
            symbol: template.symbol,
            title: `Bought ${template.symbol} · Executor`,
            subtitle: `${nowHm()} · $${sizerRes.sizeUsd.toFixed(2)} · ${sizerRes.pctOfCash}% of cash`,
            rightValue: `$${sizerRes.sizeUsd.toFixed(2)}`,
            rightTone: 'neutral',
            orderId: ordId,
          },
          {
            id: `act_c_${Date.now() + 1}`,
            ts: nowHms(),
            kind: 'copied',
            mint,
            symbol: template.symbol,
            title: `Copied ${template.symbol} · ${leadWhale.handle}`,
            subtitle: `$${whaleBuyUsd} · lag 6s · chain ok`,
            rightValue: `Score ${score.score}`,
            rightTone: 'blue',
          },
          ...prev,
        ]);

        setBalanceMarks((prev) => [
          ...prev,
          { index: balanceHistory.length, label: `Copied ${template.symbol}`, tone: 'blue' },
        ]);

        setLiveScreen((prev) => ({
          ...prev,
          activeBot: 'executor',
          actionLabel: `Executor · Bought ${template.symbol} ($${sizerRes.sizeUsd.toFixed(2)})`,
          coinSymbol: template.symbol,
          coinMint: mint,
          cursorX: 76,
          cursorY: 75,
          clicking: true,
          lastFrameTs: Date.now(),
          lastOrderSummary: `Bought ${template.symbol} · $${sizerRes.sizeUsd.toFixed(2)} · verified`,
          checks: { screen: true, api: true, chain: true },
          scriptStep: mode === 'PAPER' ? 'S2 PAPER stop before Buy · Quote verified' : 'S2 Buy clicked -> VERIFY ok',
          amountTyped: sizerRes.sizeUsd.toFixed(2),
          quoteShown: buyOrder.quoteText,
        }));

        window.setTimeout(() => {
          setLiveScreen((prev) => ({ ...prev, clicking: false }));
        }, 650);

        setBots((prev) =>
          prev.map((b) => {
            if (b.name === 'sizer') {
              return {
                ...b,
                todayCount: b.todayCount + 1,
                metricLine: `$${sizerRes.sizeUsd.toFixed(2)} · ${sizerRes.pctOfCash}% of cash`,
                statusLine: `${pickedWhales.length} whales · cap ${sizerRes.capHit}`,
                decisions: [
                  {
                    id: `sd_${Date.now()}`,
                    ts: nowHms(),
                    mint,
                    symbol: template.symbol,
                    text: `${pickedWhales.length} whales -> $${sizerRes.sizeUsd.toFixed(2)} (${sizerRes.pctOfCash}% of cash)`,
                    outcome: 'action',
                  },
                  ...b.decisions.slice(0, 19),
                ],
              };
            }
            if (b.name === 'executor') {
              return {
                ...b,
                todayCount: b.todayCount + 1,
                statusLine: `Bought ${template.symbol} · $${sizerRes.sizeUsd.toFixed(2)} verified`,
                decisions: [
                  {
                    id: `ed_${Date.now()}`,
                    ts: nowHms(),
                    mint,
                    symbol: template.symbol,
                    text: `Dip -${settings.dip_pct}% · S2 quote $${sizerRes.sizeUsd.toFixed(2)} verified (${mode})`,
                    outcome: 'action',
                  },
                  ...b.decisions.slice(0, 19),
                ],
              };
            }
            return b;
          })
        );

        pushNotification({
          title: `${mode} · Bought ${template.symbol} · $${sizerRes.sizeUsd.toFixed(2)} · Executor`,
          body: `${pickedWhales.join(', ')} · Score ${score.score} · 3 checks verified.`,
          mint,
          symbol: template.symbol,
          targetTab: 'home',
          tone: 'green',
        });
      }, 550);
    }, 450);
  };

  // Search results (coins & whales)
  const searchCoinResults = coins.filter(
    (c) =>
      searchQuery.trim() !== '' &&
      (c.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.mint.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  const searchWhaleResults = whales.filter(
    (w) =>
      searchQuery.trim() !== '' &&
      (w.handle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.address.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  const looksLikeUnseenMint =
    searchQuery.trim().length >= 24 && searchCoinResults.length === 0;

  const auditCoinObj = coins.find((c) => c.mint === auditMint) || null;
  const detailCoinObj = coins.find((c) => c.mint === coinMint) || null;
  const detailPosObj = openPositions.find((p) => p.mint === coinMint);
  const orderObj = orders.find((o) => o.id === orderId) || null;
  const whaleObj = whales.find((w) => w.userId === selectedWhaleId) || null;

  return (
    <div className="h-screen w-screen bg-black text-white flex flex-col overflow-hidden select-none">
      {/* Windows 11 Native Dark Title Bar */}
      <header className="h-11 bg-[#0b0b0d] border-b border-[rgba(84,84,88,0.45)] flex items-center justify-between px-4 shrink-0">
        {/* Zone 1: Brand Title */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-6 h-6 rounded-md bg-[#1c1c1e] border border-[rgba(84,84,88,0.55)] flex items-center justify-center font-mono-num text-xs font-bold text-[#00d35a] shrink-0">
            G
          </div>
          <span className="text-sm font-semibold tracking-tight text-white whitespace-nowrap shrink-0">
            Grok Bot Copy Desk
          </span>
          {mode === 'PAPER' && (
            <span className="text-[11px] font-mono-num font-semibold text-[#ff9f0a] whitespace-nowrap shrink-0">
              PAPER
            </span>
          )}
        </div>

        {/* Zone 2: Global Search Bar (Windows Fluent style) */}
        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          className="hidden md:flex items-center justify-between w-96 bg-[#161619] hover:bg-[#1c1c1e] border border-[rgba(84,84,88,0.45)] rounded-md px-3 py-1.5 text-xs text-[rgba(235,235,245,0.55)] transition-colors"
        >
          <span className="inline-flex items-center gap-2 truncate">
            <Search className="w-3.5 h-3.5 shrink-0" />
            銘柄・ミントアドレス・@クジラを検索...
          </span>
          <span className="font-mono-num text-[10px] text-[rgba(235,235,245,0.4)] shrink-0">
            Ctrl+K
          </span>
        </button>

        {/* Zone 3: Engine Toggle, Bell, Windows Caption Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setEngineRunning((r) => !r)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono-num bg-[#1c1c1e] hover:bg-[#2c2c2e] text-white transition-colors whitespace-nowrap"
            title="リアルタイム5ボット監視ループの一時停止/再開"
          >
            {engineRunning ? (
              <>
                <Pause className="w-3 h-3 text-[#00d35a]" />
                <span>稼働中</span>
              </>
            ) : (
              <>
                <Play className="w-3 h-3 text-[#ff9f0a]" />
                <span>停止中</span>
              </>
            )}
          </button>

          {/* Notification Bell */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setBellOpen((o) => !o)}
              className="relative p-1.5 rounded hover:bg-[#1c1c1e] text-[rgba(235,235,245,0.75)] hover:text-white transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#ff453a]" />
              )}
            </button>

            {bellOpen && (
              <div className="absolute right-0 mt-2 w-96 bg-[#1c1c1e] border border-[rgba(84,84,88,0.55)] rounded-xl overflow-hidden z-50">
                <div className="flex items-center justify-between px-4 py-3 border-b border-[rgba(84,84,88,0.4)]">
                  <span className="text-xs font-semibold text-white">今夜のプッシュ通知</span>
                  <button
                    type="button"
                    onClick={() =>
                      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
                    }
                    className="text-[11px] text-[#64d2ff] hover:underline"
                  >
                    Mark all read
                  </button>
                </div>
                <div className="max-h-80 overflow-y-auto divide-y divide-[rgba(84,84,88,0.3)]">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className="px-4 py-3 hover:bg-[#242427] transition-colors text-xs"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setNotifications((prev) =>
                            prev.map((x) => (x.id === n.id ? { ...x, read: true } : x))
                          );
                          setActiveTab(n.targetTab);
                          setBellOpen(false);
                        }}
                        className="text-left w-full"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className="font-semibold"
                            style={{
                              color:
                                n.tone === 'green'
                                  ? '#00d35a'
                                  : n.tone === 'red'
                                  ? '#ff453a'
                                  : n.tone === 'orange'
                                  ? '#ff9f0a'
                                  : '#ffffff',
                            }}
                          >
                            {!n.read && '● '}
                            {n.title}
                          </span>
                          <span className="font-mono-num text-[10px] text-[rgba(235,235,245,0.45)] shrink-0">
                            {n.ts}
                          </span>
                        </div>
                        <p className="text-[rgba(235,235,245,0.65)] mt-0.5">{n.body}</p>
                      </button>
                      {n.mint && (
                        <a
                          href={coinUrl(n.mint, 'solana')}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 mt-1.5 text-[11px] text-[#64d2ff] hover:underline"
                        >
                          Open {n.symbol} on FOMO
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Windows 11 Caption Buttons (Minimize / Compact Toggle / Close Info) */}
          <div className="hidden sm:flex items-center ml-2 border-l border-[rgba(84,84,88,0.4)] pl-2 gap-0.5">
            <button
              type="button"
              onClick={() => setSidebarCompact((c) => !c)}
              className="w-8 h-7 flex items-center justify-center rounded hover:bg-[#2c2c2e] text-[rgba(235,235,245,0.7)] hover:text-white transition-colors"
              title="サイドバー幅を切り替え"
              aria-label="Toggle compact sidebar"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setSidebarCompact(false)}
              className="w-8 h-7 flex items-center justify-center rounded hover:bg-[#2c2c2e] text-[rgba(235,235,245,0.7)] hover:text-white transition-colors"
              title="標準レイアウト表示"
              aria-label="Standard layout"
            >
              <Square className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('windows')}
              className="w-8 h-7 flex items-center justify-center rounded hover:bg-[#ff453a] text-[rgba(235,235,245,0.7)] hover:text-white transition-colors"
              title="Windows 導入・パッケージ画面へ"
              aria-label="Open Windows setup"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Windows App Body: Left Navigation Rail + Content Canvas */}
      <div className="flex-1 flex min-h-0">
        {/* Left Navigation Sidebar */}
        <aside
          className={`${
            sidebarCompact ? 'w-16' : 'w-56'
          } bg-[#0b0b0d] border-r border-[rgba(84,84,88,0.45)] flex flex-col justify-between py-3 px-2.5 shrink-0 transition-all duration-150`}
        >
          <nav className="space-y-1" aria-label="Main navigation">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  title={item.label}
                  className={`w-full flex items-center ${
                    sidebarCompact ? 'justify-center px-0' : 'gap-3 px-3'
                  } py-2.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                    isActive
                      ? 'bg-[#1c1c1e] text-white'
                      : 'text-[rgba(235,235,245,0.6)] hover:text-white hover:bg-[#141417]'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-[#00d35a]' : 'text-[rgba(235,235,245,0.55)]'
                    }`}
                  />
                  {!sidebarCompact && <span>{item.label}</span>}
                </button>
              );
            })}
          </nav>

          {/* Compact Account / Schedule Footer in Sidebar */}
          {!sidebarCompact && (
            <div className="px-3 pt-3 border-t border-[rgba(84,84,88,0.35)] space-y-1.5 text-[11px] font-mono-num text-[rgba(235,235,245,0.55)]">
              <div className="flex items-center justify-between">
                <span>Night</span>
                <span className="text-white">
                  {settings.night_start}–{settings.lock_time}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Profile</span>
                <a
                  href={profileUrl(settings.fomo_handle)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#64d2ff] hover:underline truncate max-w-[110px]"
                >
                  {settings.fomo_handle}
                </a>
              </div>
              <div className="flex items-center justify-between">
                <span>Timezone</span>
                <span className="text-white">{settings.tz}</span>
              </div>
            </div>
          )}
        </aside>

        {/* Scrollable Workspace Content */}
        <main className="flex-1 overflow-y-auto bg-black p-6 select-text">
          <div className="max-w-[1360px] mx-auto h-full">
            {activeTab === 'home' && (
              <HomeView
                mode={mode}
                balance={totalBalance}
                startBalance={startBalance}
                freeCash={freeCash}
                balanceHistory={balanceHistory}
                balanceMarks={balanceMarks}
                chartRange={chartRange}
                onChartRangeChange={setChartRange}
                liveScreen={liveScreen}
                onTogglePrivate={() =>
                  setLiveScreen((prev) => ({ ...prev, privatePaused: !prev.privatePaused }))
                }
                bots={bots}
                openPositions={openPositions}
                recentActivity={activity}
                onNavigate={setActiveTab}
                onOpenCoin={(m) => setCoinMint(m)}
                onOpenAudit={(m) => setAuditMint(m)}
                onOpenOrder={(id) => setOrderId(id)}
                onSimulateWhaleSignal={() => handleSimulateWhaleSignal()}
              />
            )}

            {activeTab === 'whales' && (
              <WhalesView
                whales={whales}
                onToggleMute={handleToggleWhaleMuteById}
                onSelectWhale={(w) => setSelectedWhaleId(w.userId)}
              />
            )}

            {activeTab === 'bots' && (
              <BotsView
                bots={bots}
                openPositionCount={openPositions.length}
                onTogglePause={(n) => handleToggleBotPause(n)}
                onSimulateWhaleSignal={() => handleSimulateWhaleSignal()}
                onOpenCoin={(m) => setCoinMint(m)}
                onNavigate={setActiveTab}
              />
            )}

            {activeTab === 'activity' && (
              <ActivityView
                activity={activity}
                orders={orders}
                onOpenCoin={(m) => setCoinMint(m)}
                onOpenAudit={(m) => setAuditMint(m)}
                onOpenOrder={(id) => setOrderId(id)}
              />
            )}

            {activeTab === 'report' && (
              <MorningReportView
                mode={mode}
                startBalance={startBalance}
                balance={totalBalance}
                closedPositions={closedPositions}
                openPositions={openPositions}
                coins={coins}
                whales={whales}
                orders={orders}
                onOpenCoin={(m) => setCoinMint(m)}
                onOpenAudit={(m) => setAuditMint(m)}
              />
            )}

            {activeTab === 'console' && (
              <CommandConsoleView
                mode={mode}
                freeCash={freeCash}
                settings={settings}
                bots={bots}
                whales={whales}
                coins={coins}
                openPositions={openPositions}
                onToggleBotPause={handleToggleBotPause}
                onToggleWhaleMute={handleToggleWhaleMuteByHandle}
                onSellPosition={(m, pct) => handleSellPosition(m, pct, 'console sell', 'executor')}
                onPanicSellAll={handlePanicSellAll}
                onUpdateSetting={handleSaveSetting}
                onRequestLiveMode={() => setActiveTab('settings')}
                onSetPaperMode={() => setMode('PAPER')}
                onTriggerWithdrawPreview={() =>
                  setLiveScreen((prev) => ({
                    ...prev,
                    privatePaused: true,
                    actionLabel: 'Withdraw paused · Take control',
                  }))
                }
                onSimulateManualBuy={(sym) => handleSimulateWhaleSignal(sym)}
              />
            )}

            {activeTab === 'settings' && (
              <SettingsView
                mode={mode}
                settings={settings}
                changeLog={changeLog}
                onSaveSetting={handleSaveSetting}
                onUpdateHandle={(h) => setSettings((prev) => ({ ...prev, fomo_handle: h }))}
                onSwitchMode={(nextMode) => setMode(nextMode)}
              />
            )}

            {activeTab === 'windows' && <WindowsSetupView settings={settings} />}
          </div>
        </main>
      </div>

      {/* Global Search Modal (Step 10 Search) */}
      {searchOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-start justify-center pt-20 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Global search"
        >
          <div className="w-full max-w-xl bg-[#1c1c1e] border border-[rgba(84,84,88,0.55)] rounded-xl overflow-hidden">
            <div className="flex items-center px-4 py-3 border-b border-[rgba(84,84,88,0.45)] gap-2.5">
              <Search className="w-4 h-4 text-[rgba(235,235,245,0.5)]" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="銘柄名・シンボル・ミントアドレス・@クジラを検索..."
                className="flex-1 bg-transparent text-sm text-white placeholder:text-[rgba(235,235,245,0.4)] focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="text-xs font-mono-num text-[rgba(235,235,245,0.5)] hover:text-white"
              >
                ESC
              </button>
            </div>

            <div className="p-4 max-h-96 overflow-y-auto space-y-4 text-xs">
              {searchQuery.trim() === '' ? (
                <div>
                  <div className="flex items-center justify-between mb-2 text-[rgba(235,235,245,0.5)]">
                    <span>最近の検索 (8件まで)</span>
                    <button
                      type="button"
                      onClick={() => setRecentSearches([])}
                      className="hover:text-white"
                    >
                      クリア
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setSearchQuery(item)}
                        className="px-2.5 py-1 rounded bg-[#2c2c2e] text-white hover:bg-[#3a3a3c] font-mono-num"
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  {searchCoinResults.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="text-[rgba(235,235,245,0.5)]">Coins</div>
                      {searchCoinResults.map((c) => (
                        <button
                          key={c.mint}
                          type="button"
                          onClick={() => {
                            setRecentSearches((prev) =>
                              [c.symbol, ...prev.filter((x) => x !== c.symbol)].slice(0, 8)
                            );
                            setSearchOpen(false);
                            if (c.status === 'rejected') setAuditMint(c.mint);
                            else setCoinMint(c.mint);
                          }}
                          className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-[#2c2c2e] text-left"
                        >
                          <div>
                            <span className="font-semibold text-white">{c.symbol}</span>
                            <span className="ml-2 text-[rgba(235,235,245,0.55)]">{c.name}</span>
                          </div>
                          <span
                            className="font-mono-num"
                            style={{
                              color:
                                c.status === 'held'
                                  ? '#00d35a'
                                  : c.status === 'rejected'
                                  ? '#ff453a'
                                  : '#64d2ff',
                            }}
                          >
                            {c.status === 'held'
                              ? 'held'
                              : c.status === 'rejected'
                              ? `rejected: ${c.score.reason}`
                              : `audited ${c.score.score}`}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  {searchWhaleResults.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="text-[rgba(235,235,245,0.5)]">Whales</div>
                      {searchWhaleResults.map((w) => (
                        <button
                          key={w.userId}
                          type="button"
                          onClick={() => {
                            setSearchOpen(false);
                            setSelectedWhaleId(w.userId);
                          }}
                          className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-[#2c2c2e] text-left"
                        >
                          <span className="font-semibold text-[#64d2ff]">{w.handle}</span>
                          <span className="font-mono-num text-[rgba(235,235,245,0.65)]">
                            Rank #{w.rank} · 勝率 {w.winRate}%
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  {looksLikeUnseenMint && (
                    <div className="bg-[#141416] p-3.5 rounded-lg border border-[rgba(84,84,88,0.4)] flex items-center justify-between gap-3">
                      <div>
                        <div className="text-white font-medium">未監査のミントアドレスを検出</div>
                        <div className="font-mono-num text-[11px] text-[rgba(235,235,245,0.5)] mt-0.5">
                          {searchQuery.trim().slice(0, 20)}...
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSearchOpen(false);
                          handleSimulateWhaleSignal(searchQuery.trim().slice(0, 5).toUpperCase());
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-[#00d35a] text-black font-semibold shrink-0"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Audit it now
                      </button>
                    </div>
                  )}

                  {searchCoinResults.length === 0 &&
                    searchWhaleResults.length === 0 &&
                    !looksLikeUnseenMint && (
                      <div className="py-6 text-center text-[rgba(235,235,245,0.5)]">
                        該当する銘柄・クジラが見つかりません
                      </div>
                    )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Detail Modals */}
      <AuditModal
        coin={auditCoinObj}
        onClose={() => setAuditMint(null)}
        onOpenCoin={(m) => setCoinMint(m)}
      />
      <CoinDetailModal
        coin={detailCoinObj}
        position={detailPosObj}
        mode={mode}
        onClose={() => setCoinMint(null)}
        onOpenAudit={(m) => setAuditMint(m)}
        onSellPosition={(m, pct) => handleSellPosition(m, pct, 'manual sell', 'executor')}
      />
      <OrderSheetModal order={orderObj} onClose={() => setOrderId(null)} />
      <WhaleDetailModal
        whale={whaleObj}
        onClose={() => setSelectedWhaleId(null)}
        onToggleMute={handleToggleWhaleMuteById}
        onOpenCoin={(m) => setCoinMint(m)}
      />
    </div>
  );
}
