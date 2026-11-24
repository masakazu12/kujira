import React, { useEffect, useRef, useState } from 'react';
import { ExternalLink, Send, ShieldAlert } from 'lucide-react';
import {
  BotName,
  BotState,
  Coin,
  DeskMode,
  DeskSettings,
  Position,
  Whale,
} from '../types/desk';
import { coinUrl, profileUrl, SIGNUP_URL } from '../engine/links';

interface PendingConfirm {
  id: string;
  label: string;
  expiresAt: number;
  used: boolean;
  onConfirm: () => string;
}

interface ConsoleMessage {
  id: string;
  ts: string;
  sender: 'user' | 'desk';
  headline: string;
  lines: string[];
  linkUrl?: string;
  linkLabel?: string;
  confirm?: PendingConfirm;
}

interface CommandConsoleViewProps {
  mode: DeskMode;
  freeCash: number;
  settings: DeskSettings;
  bots: BotState[];
  whales: Whale[];
  coins: Coin[];
  openPositions: Position[];
  onToggleBotPause: (name: BotName, forcePaused?: boolean) => void;
  onToggleWhaleMute: (handle: string, muted: boolean) => boolean;
  onSellPosition: (mint: string, pct: number) => void;
  onPanicSellAll: () => number;
  onUpdateSetting: (key: keyof DeskSettings, value: number) => string | null;
  onRequestLiveMode: () => void;
  onSetPaperMode: () => void;
  onTriggerWithdrawPreview: (amount: number) => void;
  onSimulateManualBuy: (symbol: string) => void;
}

const QUICK_COMMANDS = [
  'status',
  'whales',
  'why RUGX',
  'sell KUMO 50',
  'buy KUMO',
  'set stop -20%',
  'pause Watcher',
  'stop all',
  'resume',
  'withdraw $10',
  'invite',
  'help',
];

export const CommandConsoleView: React.FC<CommandConsoleViewProps> = ({
  mode,
  freeCash,
  settings,
  bots,
  whales,
  coins,
  openPositions,
  onToggleBotPause,
  onToggleWhaleMute,
  onSellPosition,
  onPanicSellAll,
  onUpdateSetting,
  onRequestLiveMode,
  onSetPaperMode,
  onTriggerWithdrawPreview,
  onSimulateManualBuy,
}) => {
  const [input, setInput] = useState('');
  const [nowMs, setNowMs] = useState(Date.now());
  const [messages, setMessages] = useState<ConsoleMessage[]>([
    {
      id: 'm_init',
      ts: '22:00:05',
      sender: 'desk',
      headline: `${mode} · Grok Bot Copy Desk Telegram / Local Console 接続済み`,
      lines: [
        'オーナーロック有効 (owner_chat_id のみ受付 · 他者無視)',
        '資金移動を伴うコマンドは確認カード発行後 60秒 (confirm_expiry_s) で自動失効します。',
        '"help" と入力すると全コマンド一覧を表示します。',
      ],
    },
  ]);

  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const timeStr = () => new Date().toTimeString().slice(0, 8);

  const pushDesk = (msg: Omit<ConsoleMessage, 'id' | 'ts' | 'sender'>) => {
    setMessages((prev) => [
      ...prev,
      { ...msg, id: `m_${Date.now()}_${Math.random()}`, ts: timeStr(), sender: 'desk' },
    ]);
  };

  const executeCommand = (raw: string) => {
    const cmd = raw.trim();
    if (!cmd) return;

    setMessages((prev) => [
      ...prev,
      { id: `u_${Date.now()}`, ts: timeStr(), sender: 'user', headline: cmd, lines: [] },
    ]);
    setInput('');

    const lower = cmd.toLowerCase();
    const clean = lower.startsWith('/') ? lower.slice(1) : lower;

    // help
    if (clean === 'help') {
      pushDesk({
        headline: 'コマンド一覧 (STEP 11)',
        lines: [
          'status — モード、余力キャッシュ、保有ポジション一覧',
          'why <X> — 銘柄Xを止めたボット・監査層・実数値',
          'whales — 今夜のクジラ一覧（FOMOプロフィールURL付）',
          'mute @x / unmute @x — クジラのWatcher監視切替',
          'sell <X> [25|50|100] — 確認カード経由でExecutor売却',
          'buy <X> — Vetter 8層監査 + Sizer計算後に購入確認',
          'pause <Bot> — ボット一時停止（Guardは保有中不可）',
          'set stop -20% — 損切り設定変更 (change_log記録)',
          'paper / live — モード切替 (LIVEは確認必須)',
          'withdraw $N — 出金確認画面で停止しTake control待機',
          'stop all / resume / panic — 緊急買い停止 / 再開 / 全決済',
          'invite / report — FOMO招待URL / 朝レポート案内',
        ],
      });
      return;
    }

    // status
    if (clean === 'status') {
      pushDesk({
        headline: `${mode} · Free cash $${freeCash.toFixed(2)} · Open ${openPositions.length}/${settings.max_open}`,
        lines:
          openPositions.length === 0
            ? ['現在保有ポジションはありません。Watcher待機中。']
            : openPositions.map(
                (p) =>
                  `${p.symbol}: $${p.sizeUsd.toFixed(2)} · ${p.pnlPct >= 0 ? '+' : ''}${p.pnlPct.toFixed(1)}% · stop $${p.stopPrice.toFixed(6)} · ${coinUrl(p.mint)}`
              ),
      });
      return;
    }

    // whales
    if (clean === 'whales') {
      pushDesk({
        headline: `今夜のクジラ (${whales.length}名 · アクティブ ${whales.filter((w) => !w.muted).length}名)`,
        lines: whales.map(
          (w) =>
            `#${w.rank} ${w.handle} · 7d +$${w.pnl7d.toLocaleString()} · 勝率${w.winRate}% ${w.muted ? '[MUTED]' : ''} · ${profileUrl(w.handle)}`
        ),
      });
      return;
    }

    // invite
    if (clean === 'invite') {
      pushDesk({
        headline: 'FOMO 招待リンク (SIGNUP_URL)',
        lines: [SIGNUP_URL],
        linkUrl: SIGNUP_URL,
        linkLabel: 'Open FOMO Signup',
      });
      return;
    }

    // why X
    if (clean.startsWith('why ')) {
      const target = cmd.slice(cmd.toLowerCase().indexOf('why ') + 4).trim().toLowerCase();
      const found = coins.find(
        (c) =>
          c.symbol.toLowerCase() === target ||
          c.name.toLowerCase().includes(target) ||
          c.mint.toLowerCase() === target
      );
      if (!found) {
        pushDesk({
          headline: `"${target}" が見つかりません`,
          lines: ['ミントアドレス (Base58) を入力すると新規監査できます。'],
        });
        return;
      }
      const failed = found.layers.find((l) => l.pass === false);
      pushDesk({
        headline: `Why ${found.symbol}: ${failed ? `Vetter Layer ${failed.layer} (${failed.name})` : found.score.reason}`,
        lines: [
          failed
            ? `実測値: ${failed.valueText} (ソース: ${failed.source})`
            : `8/8通過 · スコア ${found.score.score}/100 · クジラ: ${found.whales.join(', ')}`,
          `FOMO: ${coinUrl(found.mint, found.chain)}`,
        ],
        linkUrl: coinUrl(found.mint, found.chain),
        linkLabel: `Open ${found.symbol} on FOMO`,
      });
      return;
    }

    // mute / unmute
    if (clean.startsWith('mute ') || clean.startsWith('unmute ')) {
      const isMute = clean.startsWith('mute ');
      const handle = cmd.split(/\s+/)[1] || '';
      const ok = onToggleWhaleMute(handle, isMute);
      pushDesk({
        headline: ok
          ? `${handle} を ${isMute ? 'ミュート' : 'ミュート解除'} しました`
          : `クジラ "${handle}" が見つかりません`,
        lines: ok
          ? [isMute ? 'Watcher監視から除外しました（保有中ポジションのGuard監視は継続）。' : 'Watcher監視を再開しました。']
          : ['例: mute @alpha / unmute @nori_dex'],
      });
      return;
    }

    // pause Bot
    if (clean.startsWith('pause ')) {
      const botRaw = clean.replace('pause ', '').trim() as BotName;
      const validBots: BotName[] = ['watcher', 'vetter', 'sizer', 'executor', 'guard'];
      if (!validBots.includes(botRaw)) {
        pushDesk({
          headline: `ボット名が不明です: ${botRaw}`,
          lines: ['指定可能: Watcher, Vetter, Sizer, Executor, Guard'],
        });
        return;
      }
      if (botRaw === 'guard' && openPositions.length > 0) {
        pushDesk({
          headline: '拒否: Guard はオープンポジション保有中は停止できません',
          lines: [`現在 ${openPositions.length} 件のポジションを防衛中です。`],
        });
        return;
      }
      onToggleBotPause(botRaw, true);
      pushDesk({
        headline: `${botRaw} を一時停止しました`,
        lines: ['resume またはボット画面から再開できます。'],
      });
      return;
    }

    // set stop -20%
    if (clean.startsWith('set stop')) {
      const match = clean.match(/(\d+(\.\d+)?)/);
      if (!match) {
        pushDesk({ headline: '数値を指定してください (例: set stop -20%)', lines: [] });
        return;
      }
      const nextVal = parseFloat(match[1]);
      const oldVal = settings.stop_pct;
      const err = onUpdateSetting('stop_pct', nextVal);
      if (err) {
        pushDesk({ headline: '設定エラー', lines: [err] });
      } else {
        pushDesk({
          headline: `stop -${oldVal}% -> -${nextVal}%`,
          lines: [
            'sizer.stop_pct / guard.stop_pct を同期更新し change_log に記録しました。',
            '既存のオープンポジションのストップ価格は緩められません。',
          ],
        });
      }
      return;
    }

    // sell X [25|50|100]
    if (clean.startsWith('sell ')) {
      const parts = cmd.split(/\s+/);
      const sym = (parts[1] || '').toLowerCase();
      const pct = parts[2] ? parseInt(parts[2], 10) : 100;
      const validPct = [25, 50, 100].includes(pct) ? pct : 100;
      const pos = openPositions.find((p) => p.symbol.toLowerCase() === sym);
      if (!pos) {
        pushDesk({
          headline: `保有中の銘柄 "${parts[1] || ''}" が見つかりません`,
          lines: ['status で保有中の銘柄を確認してください。'],
        });
        return;
      }
      pushDesk({
        headline: `Sell ${validPct}% of ${pos.symbol} now?`,
        lines: [
          `現在価格 $${pos.currentPrice.toFixed(6)} · 含み損益 ${pos.pnlPct >= 0 ? '+' : ''}${pos.pnlPct.toFixed(1)}%`,
          `有効期限: ${settings.confirm_expiry_s}秒 · 1回のYesで1回のみ執行`,
        ],
        linkUrl: coinUrl(pos.mint, 'solana'),
        linkLabel: `Open ${pos.symbol} on FOMO`,
        confirm: {
          id: `cnf_${Date.now()}`,
          label: `Yes — Sell ${validPct}% of ${pos.symbol}`,
          expiresAt: Date.now() + settings.confirm_expiry_s * 1000,
          used: false,
          onConfirm: () => {
            onSellPosition(pos.mint, validPct);
            return `Executor が ${pos.symbol} の ${validPct}% 売却を執行・3段階検証しました。`;
          },
        },
      });
      return;
    }

    // buy X
    if (clean.startsWith('buy ')) {
      const sym = cmd.slice(cmd.toLowerCase().indexOf('buy ') + 4).trim().toUpperCase();
      pushDesk({
        headline: `Buy ${sym}? (Vetter 8/8 + Sizer計算済み)`,
        lines: [
          `計算サイズ: $${Math.min(settings.max_ticket_usd, Math.round(freeCash * 0.08 * 100) / 100).toFixed(2)} (${mode})`,
          `有効期限: ${settings.confirm_expiry_s}秒`,
        ],
        confirm: {
          id: `cnf_${Date.now()}`,
          label: `Yes — Buy ${sym} (${mode})`,
          expiresAt: Date.now() + settings.confirm_expiry_s * 1000,
          used: false,
          onConfirm: () => {
            onSimulateManualBuy(sym);
            return `${sym} の買い注文を Executor キューに投入しました (${mode})。`;
          },
        },
      });
      return;
    }

    // stop all / resume
    if (clean === 'stop all') {
      onToggleBotPause('watcher', true);
      pushDesk({
        headline: `Buys stopped · ${openPositions.length} open`,
        lines: ['新規買いと押し目待機を停止しました。Guardの監視は継続します。'],
      });
      return;
    }

    if (clean === 'resume') {
      bots.forEach((b) => onToggleBotPause(b.name, false));
      pushDesk({
        headline: '全ボットを再開しました',
        lines: ['Watcher → Vetter → Sizer → Executor → Guard 稼働中。'],
      });
      return;
    }

    // panic
    if (clean === 'panic') {
      pushDesk({
        headline: `PANIC: 全 ${openPositions.length} ポジションを100%即時売却しますか？`,
        lines: ['確認後、新規買いを停止し Guard が全建玉を最優先売却します。'],
        confirm: {
          id: `cnf_${Date.now()}`,
          label: 'Yes — PANIC SELL ALL 100%',
          expiresAt: Date.now() + settings.confirm_expiry_s * 1000,
          used: false,
          onConfirm: () => {
            const count = onPanicSellAll();
            return `PANIC実行完了: 新規買い停止・${count} 件のポジションを100%売却しました。`;
          },
        },
      });
      return;
    }

    // withdraw $N
    if (clean.startsWith('withdraw')) {
      const match = clean.match(/(\d+(\.\d+)?)/);
      const amt = match ? parseFloat(match[1]) : 10;
      onTriggerWithdrawPreview(amt);
      pushDesk({
        headline: `Withdraw $${amt.toFixed(2)} -> Review withdraw で停止しました`,
        lines: [
          `出金先: ${settings.withdraw_address}`,
          'Live Screen は Paused · private に自動切替されました。',
          'Confirm と 2FA はあなた自身が操作してください（ボットは決してConfirmを押しません）。',
        ],
      });
      return;
    }

    // paper / live
    if (clean === 'paper') {
      onSetPaperMode();
      pushDesk({ headline: 'PAPER モードに切り替えました', lines: [] });
      return;
    }

    if (clean === 'live') {
      onRequestLiveMode();
      pushDesk({
        headline: 'LIVE モード切替には明示的な "LIVE" 入力確認が必要です',
        lines: ['設定画面の LIVE 確認モーダルを開きました。'],
      });
      return;
    }

    pushDesk({
      headline: `不明なコマンド: "${cmd}"`,
      lines: ['"help" で使用可能なコマンド一覧を確認できます。'],
    });
  };

  const handleConfirmClick = (msgId: string) => {
    setMessages((prev) => {
      const target = prev.find((m) => m.id === msgId);
      if (!target?.confirm) return prev;
      if (target.confirm.used) return prev;

      const expired = Date.now() > target.confirm.expiresAt;
      const updated = prev.map((m) =>
        m.id === msgId && m.confirm ? { ...m, confirm: { ...m.confirm, used: true } } : m
      );

      if (expired) {
        return [
          ...updated,
          {
            id: `exp_${Date.now()}`,
            ts: timeStr(),
            sender: 'desk',
            headline: 'Expired, ask again',
            lines: [`確認期限 (${settings.confirm_expiry_s}秒) を過ぎたため実行しませんでした。`],
          },
        ];
      }

      const resultText = target.confirm.onConfirm();
      return [
        ...updated,
        {
          id: `res_${Date.now()}`,
          ts: timeStr(),
          sender: 'desk',
          headline: 'Confirmed & Executed',
          lines: [resultText],
        },
      ];
    });
  };

  return (
    <div className="h-full flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold text-white">Telegram / デスクコマンドコンソール</h1>
          <p className="text-xs text-[rgba(235,235,245,0.55)] mt-0.5">
            Step 11 仕様準拠 · 自然文またはスラッシュコマンド対応 · 資金移動は {settings.confirm_expiry_s}秒有効の確認カード必須
          </p>
        </div>
        <div className="inline-flex items-center gap-1.5 text-xs font-mono-num text-[rgba(235,235,245,0.6)]">
          <ShieldAlert className="w-3.5 h-3.5 text-[#ff9f0a]" />
          Owner lock: active · Rate limit 1 msg/s
        </div>
      </div>

      {/* Quick command buttons */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {QUICK_COMMANDS.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => executeCommand(q)}
            className="px-2.5 py-1 rounded bg-[#1c1c1e] hover:bg-[#2c2c2e] border border-[rgba(84,84,88,0.45)] text-xs font-mono-num text-[rgba(235,235,245,0.8)] hover:text-white transition-colors"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Console Stream */}
      <div
        ref={scrollRef}
        className="flex-1 min-h-[360px] bg-[#141416] rounded-xl border border-[rgba(84,84,88,0.45)] p-5 overflow-y-auto space-y-4"
      >
        {messages.map((m) => {
          const remainingS = m.confirm
            ? Math.max(0, Math.ceil((m.confirm.expiresAt - nowMs) / 1000))
            : 0;
          return (
            <div
              key={m.id}
              className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-2xl rounded-xl px-4 py-3 text-xs border ${
                  m.sender === 'user'
                    ? 'bg-[#2c2c2e] border-[rgba(84,84,88,0.5)] text-white'
                    : 'bg-[#1c1c1e] border-[rgba(84,84,88,0.45)] text-white'
                }`}
              >
                <div className="flex items-center justify-between gap-4">
                  <span className="font-semibold text-white">{m.headline}</span>
                  <span className="text-[10px] font-mono-num text-[rgba(235,235,245,0.45)] shrink-0">
                    {m.ts}
                  </span>
                </div>
                {m.lines.length > 0 && (
                  <div className="mt-1.5 space-y-1 text-[rgba(235,235,245,0.75)] font-mono-num">
                    {m.lines.map((line, i) => (
                      <div key={i} className="break-all">
                        {line}
                      </div>
                    ))}
                  </div>
                )}

                {(m.linkUrl || m.confirm) && (
                  <div className="mt-3 pt-2.5 border-t border-[rgba(84,84,88,0.35)] flex items-center gap-2.5 flex-wrap">
                    {m.confirm && (
                      <button
                        type="button"
                        disabled={m.confirm.used}
                        onClick={() => handleConfirmClick(m.id)}
                        className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors ${
                          m.confirm.used
                            ? 'bg-[#2c2c2e] text-[rgba(235,235,245,0.4)] cursor-not-allowed'
                            : remainingS === 0
                            ? 'bg-[#2c2c2e] text-[#ff453a]'
                            : 'bg-[#00d35a] text-black hover:bg-[#19df6c]'
                        }`}
                      >
                        {m.confirm.used
                          ? '処理済み'
                          : remainingS === 0
                          ? '期限切れ (Expired)'
                          : `${m.confirm.label} (${remainingS}s)`}
                      </button>
                    )}
                    {m.linkUrl && (
                      <a
                        href={m.linkUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-[#2c2c2e] text-[#64d2ff] hover:bg-[#3a3a3c] text-xs font-medium"
                      >
                        {m.linkLabel || 'Open on FOMO'}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          executeCommand(input);
        }}
        className="flex items-center gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="コマンドを入力 (例: status / why RUGX / sell KUMO 50 / set stop -20% / panic)"
          className="flex-1 bg-[#1c1c1e] border border-[rgba(84,84,88,0.55)] rounded-lg px-4 py-2.5 text-sm font-mono-num text-white placeholder:text-[rgba(235,235,245,0.4)] focus:outline-none focus:border-[#64d2ff]"
        />
        <button
          type="submit"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-[#00d35a] text-black font-semibold text-xs hover:bg-[#19df6c] transition-colors shrink-0"
        >
          <Send className="w-3.5 h-3.5" />
          送信
        </button>
      </form>
    </div>
  );
};
