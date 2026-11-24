import React from 'react';
import { Lock, Pause, Play, Settings2, Zap } from 'lucide-react';
import { BotName, BotState, NavTab } from '../types/desk';

interface BotsViewProps {
  bots: BotState[];
  openPositionCount: number;
  onTogglePause: (name: BotName) => void;
  onSimulateWhaleSignal: () => void;
  onOpenCoin: (mint: string) => void;
  onNavigate: (tab: NavTab) => void;
}

export const BotsView: React.FC<BotsViewProps> = ({
  bots,
  openPositionCount,
  onTogglePause,
  onSimulateWhaleSignal,
  onOpenCoin,
  onNavigate,
}) => {
  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-white">5ボット実行パイプライン (Bots)</h1>
          <p className="text-xs text-[rgba(235,235,245,0.55)] mt-1">
            全5ボットが同意しない限り買い注文は執行されません · Guardはオープンポジション保有中ロックされます
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onSimulateWhaleSignal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#00d35a] text-black hover:bg-[#19df6c] transition-colors whitespace-nowrap"
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            模擬クジラ買いシグナルを投入
          </button>
          <button
            type="button"
            onClick={() => onNavigate('settings')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium bg-[#2c2c2e] text-white hover:bg-[#3a3a3c] transition-colors whitespace-nowrap"
          >
            <Settings2 className="w-3.5 h-3.5" />
            しきい値設定
          </button>
        </div>
      </div>

      {/* 5 Full-Width Bot Cards (Step 10) */}
      <div className="space-y-4">
        {bots.map((bot, idx) => {
          const guardLocked = bot.name === 'guard' && openPositionCount > 0;
          return (
            <section
              key={bot.name}
              className="bg-[#1c1c1e] rounded-xl border border-[rgba(84,84,88,0.45)] overflow-hidden"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-5 py-4 border-b border-[rgba(84,84,88,0.35)]">
                <div className="flex items-center gap-3.5">
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{
                      backgroundColor: bot.paused ? 'rgba(235,235,245,0.28)' : bot.color,
                    }}
                  />
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h2 className="text-base font-semibold" style={{ color: bot.color }}>
                        {idx + 1}. {bot.label}
                      </h2>
                      <span className="text-xs text-[rgba(235,235,245,0.65)]">{bot.jpRole}</span>
                    </div>
                    <div className="text-xs font-mono-num text-[rgba(235,235,245,0.55)] mt-0.5">
                      {bot.metricLine} · {bot.statusLine}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs font-mono-num text-[rgba(235,235,245,0.6)]">
                    本日 {bot.todayCount} 件
                  </span>
                  {guardLocked ? (
                    <span
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-[#ff6b9a]/15 text-[#ff6b9a]"
                      title="オープンポジション保有中はGuardを停止できません"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      Locked ({openPositionCount} open)
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onTogglePause(bot.name)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                        bot.paused
                          ? 'bg-[#00d35a]/15 text-[#00d35a] hover:bg-[#00d35a]/25'
                          : 'bg-[#2c2c2e] text-white hover:bg-[#3a3a3c]'
                      }`}
                    >
                      {bot.paused ? (
                        <>
                          <Play className="w-3.5 h-3.5" />
                          再開する
                        </>
                      ) : (
                        <>
                          <Pause className="w-3.5 h-3.5" />
                          一時停止
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Last Decisions */}
              <div className="px-5 py-3 divide-y divide-[rgba(84,84,88,0.25)]">
                {bot.decisions.slice(0, 5).map((dec) => (
                  <div
                    key={dec.id}
                    className="flex items-center justify-between py-2 text-xs gap-4"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="font-mono-num text-[rgba(235,235,245,0.45)] shrink-0">
                        {dec.ts}
                      </span>
                      {dec.symbol && dec.mint ? (
                        <button
                          type="button"
                          onClick={() => onOpenCoin(dec.mint!)}
                          className="font-mono-num font-semibold text-white hover:text-[#64d2ff] shrink-0"
                        >
                          {dec.symbol}
                        </button>
                      ) : dec.symbol ? (
                        <span className="font-mono-num font-semibold text-[rgba(235,235,245,0.6)] shrink-0">
                          {dec.symbol}
                        </span>
                      ) : null}
                      <span className="text-[rgba(235,235,245,0.85)] truncate">{dec.text}</span>
                    </div>
                    <span
                      className="text-[11px] font-mono-num shrink-0"
                      style={{
                        color:
                          dec.outcome === 'pass' || dec.outcome === 'action'
                            ? '#00d35a'
                            : dec.outcome === 'reject'
                            ? '#ff453a'
                            : '#64d2ff',
                      }}
                    >
                      {dec.outcome}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
};
