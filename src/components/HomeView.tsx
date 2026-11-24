import React from 'react';
import { ArrowUpRight, ExternalLink, Play, ShieldCheck } from 'lucide-react';
import {
  ActivityItem,
  BalanceMark,
  BalancePoint,
  BotState,
  ChartRange,
  DeskMode,
  LiveScreenState,
  NavTab,
  Position,
} from '../types/desk';
import { coinUrl } from '../engine/links';
import { BalanceLineChart } from './CanvasCharts';
import { LiveScreenCard } from './LiveScreenCard';

interface HomeViewProps {
  mode: DeskMode;
  balance: number;
  startBalance: number;
  freeCash: number;
  balanceHistory: BalancePoint[];
  balanceMarks: BalanceMark[];
  chartRange: ChartRange;
  onChartRangeChange: (r: ChartRange) => void;
  liveScreen: LiveScreenState;
  onTogglePrivate: () => void;
  bots: BotState[];
  openPositions: Position[];
  recentActivity: ActivityItem[];
  onNavigate: (tab: NavTab) => void;
  onOpenCoin: (mint: string) => void;
  onOpenAudit: (mint: string) => void;
  onOpenOrder: (orderId: string) => void;
  onSimulateWhaleSignal: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  mode,
  balance,
  startBalance,
  freeCash,
  balanceHistory,
  balanceMarks,
  chartRange,
  onChartRangeChange,
  liveScreen,
  onTogglePrivate,
  bots,
  openPositions,
  recentActivity,
  onNavigate,
  onOpenCoin,
  onOpenAudit,
  onOpenOrder,
  onSimulateWhaleSignal,
}) => {
  const deltaUsd = balance - startBalance;
  const deltaPct = startBalance > 0 ? (deltaUsd / startBalance) * 100 : 0;
  const multiplier = startBalance > 0 ? balance / startBalance : 1;
  const runningBots = bots.filter((b) => !b.paused).length;

  return (
    <div className="space-y-6">
      {/* Top 2-Column Hero Grid: Left Balance + Line Chart | Right Live Chrome Browser Lane */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
        {/* Balance & LIVE Chart */}
        <section className="xl:col-span-7 bg-[#1c1c1e] rounded-xl p-6 border border-[rgba(84,84,88,0.45)] flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-[rgba(235,235,245,0.6)]">
                    今夜のポートフォリオ残高
                  </span>
                  {mode === 'PAPER' && (
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono-num font-semibold bg-[#ff9f0a]/15 text-[#ff9f0a]">
                      PAPER
                    </span>
                  )}
                </div>
                <div className="flex items-baseline gap-4 mt-1 flex-wrap">
                  <h1 className="text-5xl font-bold font-mono-num tracking-tight text-white">
                    ${balance.toFixed(2)}
                  </h1>
                  <span
                    className="text-sm font-mono-num font-semibold"
                    style={{ color: deltaUsd >= 0 ? '#00d35a' : '#ff453a' }}
                  >
                    {deltaUsd >= 0 ? '+' : '-'}${Math.abs(deltaUsd).toFixed(2)} (
                    {deltaPct >= 0 ? '+' : ''}
                    {deltaPct.toFixed(2)}%) today
                  </span>
                  <span className="text-xs font-mono-num font-semibold text-[#00d35a]">
                    {multiplier.toFixed(2)}x
                  </span>
                </div>
              </div>

              <div className="text-right text-xs font-mono-num shrink-0">
                <div className="text-[rgba(235,235,245,0.5)]">余力キャッシュ</div>
                <div className="text-white font-semibold mt-0.5">${freeCash.toFixed(2)}</div>
              </div>
            </div>
          </div>

          <div className="mt-5">
            <BalanceLineChart
              points={balanceHistory}
              marks={balanceMarks}
              startValue={startBalance}
              range={chartRange}
              onRangeChange={onChartRangeChange}
            />
          </div>
        </section>

        {/* Live Chrome CDP Browser Lane */}
        <section className="xl:col-span-5 bg-[#1c1c1e] rounded-xl p-5 border border-[rgba(84,84,88,0.45)] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-semibold text-white">Live Screen · Chrome Browser Lane</h2>
              <p className="text-xs text-[rgba(235,235,245,0.55)] mt-0.5">
                1クリックレーン排他制御 · Guard売却は常に最優先割込み
              </p>
            </div>
            <button
              type="button"
              onClick={onSimulateWhaleSignal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-[#00d35a] text-black hover:bg-[#19df6c] transition-colors whitespace-nowrap shrink-0"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              模擬シグナル実行
            </button>
          </div>

          <LiveScreenCard
            liveScreen={liveScreen}
            mode={mode}
            onTogglePrivate={onTogglePrivate}
            onInspectCoin={onOpenCoin}
          />
        </section>
      </div>

      {/* 5 Bots Strip */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-white">
              Bots · {runningBots} running
            </h2>
            <span className="text-xs text-[rgba(235,235,245,0.5)]">
              Watcher → Vetter → Sizer → Executor · Guard 5s
            </span>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('bots')}
            className="text-xs text-[rgba(235,235,245,0.65)] hover:text-white inline-flex items-center gap-1"
          >
            ボット制御を開く
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-3.5">
          {bots.map((bot) => (
            <button
              key={bot.name}
              type="button"
              onClick={() => onNavigate('bots')}
              className="text-left bg-[#1c1c1e] hover:bg-[#242427] rounded-xl p-4 border border-[rgba(84,84,88,0.45)] transition-colors flex flex-col justify-between min-h-[116px]"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold" style={{ color: bot.color }}>
                  {bot.label}
                </span>
                <span className="text-[11px] font-mono-num text-[rgba(235,235,245,0.55)]">
                  {bot.paused ? 'paused' : `${bot.todayCount} ops`}
                </span>
              </div>
              <div className="mt-2">
                <div className="text-xs font-mono-num text-white truncate">{bot.metricLine}</div>
                <div className="text-[11px] text-[rgba(235,235,245,0.55)] mt-1 truncate">
                  {bot.statusLine}
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Bottom 2-Column Split: Open Positions | Recent Activity */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Open Positions */}
        <section className="xl:col-span-7 bg-[#1c1c1e] rounded-xl border border-[rgba(84,84,88,0.45)] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-[rgba(84,84,88,0.4)]">
            <h2 className="text-sm font-semibold text-white">
              保有ポジション ({openPositions.length})
            </h2>
            <span className="text-xs text-[rgba(235,235,245,0.55)] font-mono-num">
              Guard 5s監視 · stop -25% / TP 2.0x / trail 40%
            </span>
          </div>

          {openPositions.length === 0 ? (
            <div className="px-5 py-10 text-center text-xs text-[rgba(235,235,245,0.55)]">
              Waiting for the first copy · 現在オープンポジションはありません
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-[rgba(235,235,245,0.5)] border-b border-[rgba(84,84,88,0.35)] text-left">
                    <th className="py-2.5 px-5 font-medium">銘柄</th>
                    <th className="py-2.5 px-3 font-medium">クジラ</th>
                    <th className="py-2.5 px-3 font-medium text-right">投資額</th>
                    <th className="py-2.5 px-3 font-medium text-right">現在価格 / Stop</th>
                    <th className="py-2.5 px-3 font-medium text-right">含み損益</th>
                    <th className="py-2.5 px-5 font-medium text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[rgba(84,84,88,0.3)]">
                  {openPositions.map((pos) => (
                    <tr
                      key={pos.id}
                      className="hover:bg-[#242427] transition-colors"
                    >
                      <td className="py-3 px-5">
                        <button
                          type="button"
                          onClick={() => onOpenCoin(pos.mint)}
                          className="text-left group"
                        >
                          <div className="font-semibold text-white group-hover:text-[#64d2ff] flex items-center gap-1.5">
                            {pos.symbol}
                            <span className="text-[11px] font-mono-num text-[#00d35a] font-normal">
                              <ShieldCheck className="w-3 h-3 inline mr-0.5" />
                              {pos.score}
                            </span>
                          </div>
                          <div className="text-[11px] font-mono-num text-[rgba(235,235,245,0.45)]">
                            {pos.openedAt} · lag {pos.lagS}s
                          </div>
                        </button>
                      </td>
                      <td className="py-3 px-3 font-mono-num text-[rgba(235,235,245,0.75)]">
                        {pos.whales.join(', ')}
                      </td>
                      <td className="py-3 px-3 text-right font-mono-num text-white">
                        ${pos.sizeUsd.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono-num">
                        <div className="text-white">${pos.currentPrice.toFixed(6)}</div>
                        <div className="text-[11px] text-[#ff9f0a]">
                          stop ${pos.stopPrice.toFixed(6)}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right font-mono-num">
                        <div
                          className="font-semibold"
                          style={{ color: pos.pnlUsd >= 0 ? '#00d35a' : '#ff453a' }}
                        >
                          {pos.pnlUsd >= 0 ? '+' : '-'}${Math.abs(pos.pnlUsd).toFixed(2)}
                        </div>
                        <div
                          className="text-[11px]"
                          style={{ color: pos.pnlPct >= 0 ? '#00d35a' : '#ff453a' }}
                        >
                          {pos.pnlPct >= 0 ? '+' : ''}
                          {pos.pnlPct.toFixed(1)}%
                        </div>
                      </td>
                      <td className="py-3 px-5 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => onOpenCoin(pos.mint)}
                          className="px-2.5 py-1 rounded bg-[#2c2c2e] text-white hover:bg-[#3a3a3c] transition-colors text-[11px] font-medium"
                        >
                          売却 / 詳細
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Recent Activity (Last 5 rows per Step 10) */}
        <section className="xl:col-span-5 bg-[#1c1c1e] rounded-xl border border-[rgba(84,84,88,0.45)] overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-[rgba(84,84,88,0.4)]">
            <h2 className="text-sm font-semibold text-white">Activity · 最新ログ</h2>
            <button
              type="button"
              onClick={() => onNavigate('activity')}
              className="text-xs text-[rgba(235,235,245,0.65)] hover:text-white inline-flex items-center gap-1"
            >
              See all
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-[rgba(84,84,88,0.3)] flex-1">
            {recentActivity.slice(0, 6).map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between px-5 py-3 hover:bg-[#242427] transition-colors gap-3"
              >
                <button
                  type="button"
                  onClick={() => {
                    if (item.kind === 'rejected') {
                      onOpenAudit(item.mint);
                    } else if (item.orderId) {
                      onOpenOrder(item.orderId);
                    } else {
                      onOpenCoin(item.mint);
                    }
                  }}
                  className="text-left min-w-0 flex-1"
                >
                  <div className="text-xs font-medium text-white truncate">{item.title}</div>
                  <div className="text-[11px] font-mono-num text-[rgba(235,235,245,0.55)] truncate mt-0.5">
                    {item.ts} · {item.subtitle}
                  </div>
                </button>
                <div className="flex items-center gap-3 shrink-0">
                  <span
                    className="text-xs font-mono-num font-semibold"
                    style={{
                      color:
                        item.rightTone === 'green'
                          ? '#00d35a'
                          : item.rightTone === 'red'
                          ? '#ff453a'
                          : item.rightTone === 'orange'
                          ? '#ff9f0a'
                          : item.rightTone === 'blue'
                          ? '#64d2ff'
                          : '#ffffff',
                    }}
                  >
                    {item.rightValue}
                  </span>
                  <a
                    href={coinUrl(item.mint, 'solana')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[rgba(235,235,245,0.4)] hover:text-[#64d2ff]"
                    aria-label={`Open ${item.symbol} on FOMO`}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
