import React from 'react';
import { Download, ExternalLink } from 'lucide-react';
import { Coin, DeskMode, Order, Position, Whale } from '../types/desk';
import { coinUrl, profileUrl, SIGNUP_URL } from '../engine/links';
import { triggerFileDownload } from '../engine/windowsExport';

interface MorningReportViewProps {
  mode: DeskMode;
  startBalance: number;
  balance: number;
  closedPositions: Position[];
  openPositions: Position[];
  coins: Coin[];
  whales: Whale[];
  orders: Order[];
  onOpenCoin: (mint: string) => void;
  onOpenAudit: (mint: string) => void;
}

export const MorningReportView: React.FC<MorningReportViewProps> = ({
  mode,
  startBalance,
  balance,
  closedPositions,
  openPositions,
  coins,
  whales,
  orders,
  onOpenCoin,
  onOpenAudit,
}) => {
  const allTrades = [...closedPositions, ...openPositions];
  const won = allTrades.filter((p) => p.pnlUsd >= 0);
  const lost = allTrades.filter((p) => p.pnlUsd < 0);
  const deltaPct = startBalance > 0 ? ((balance - startBalance) / startBalance) * 100 : 0;

  const biggestWin = allTrades.reduce((best, p) => (p.pnlUsd > best ? p.pnlUsd : best), 0);
  const biggestLoss = allTrades.reduce((worst, p) => (p.pnlUsd < worst ? p.pnlUsd : worst), 0);
  const totalFees = orders.reduce((acc, o) => acc + o.feeUsd, 0);

  // Step 14: Red trades first, then green
  const orderedTrades = [...lost, ...won];

  // Vetter refusals per layer
  const rejectedCoins = coins.filter((c) => c.status === 'rejected');
  const layerCounts = Array.from({ length: 8 }, (_, idx) => {
    const layerNum = idx + 1;
    const names = [
      'L1 Mint auth',
      'L2 Freeze auth',
      'L3 Dev wallet',
      'L4 Top 10',
      'L5 Liquidity',
      'L6 FOMO warns',
      'L7 Bundles',
      'L8 Delegations',
    ];
    const count = rejectedCoins.filter((c) =>
      c.layers.some((l) => l.layer === layerNum && l.pass === false)
    ).length;
    return { layerNum, name: names[idx], count };
  });
  const maxRefusal = Math.max(1, ...layerCounts.map((l) => l.count));

  const exportMarkdown = () => {
    const lines = [
      `# Night Report (${new Date().toISOString().slice(0, 10)}) · ${mode}`,
      `$${startBalance.toFixed(2)} -> $${balance.toFixed(2)} (${deltaPct >= 0 ? '+' : ''}${deltaPct.toFixed(2)}%) · ${allTrades.length} trades · ${won.length} won · ${lost.length} lost`,
      `Biggest win: +$${biggestWin.toFixed(2)} · Biggest loss: -$${Math.abs(biggestLoss).toFixed(2)} · Fees paid: $${totalFees.toFixed(2)}`,
      '',
      '## Trades (Red first, then Green)',
      ...orderedTrades.map(
        (t) =>
          `- ${t.symbol} (${t.exitReason || 'open'}): $${t.sizeUsd.toFixed(2)} -> ${t.pnlUsd >= 0 ? '+' : '-'}$${Math.abs(t.pnlUsd).toFixed(2)} (${t.pnlPct >= 0 ? '+' : ''}${t.pnlPct.toFixed(1)}%) | ${t.leadWhale}: ${t.whaleResultPct ?? 0}% vs you: ${t.pnlPct.toFixed(1)}% | ${coinUrl(t.mint)}`
      ),
      '',
      `New to FOMO? ${SIGNUP_URL}`,
    ];
    triggerFileDownload(`night-report-${new Date().toISOString().slice(0, 10)}.md`, lines.join('\n'));
  };

  return (
    <div className="space-y-6">
      {/* Top 1-line Night Summary (Step 14 exact layout) */}
      <section className="bg-[#1c1c1e] rounded-xl p-6 border border-[rgba(84,84,88,0.45)]">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="text-xs font-mono-num text-[rgba(235,235,245,0.55)]">
              Morning Page · night-report · 08:00 JST
            </div>
            <h1 className="text-xl font-semibold text-white mt-1 font-mono-num">
              Night of {new Date().toISOString().slice(0, 10)} · {mode} · ${startBalance.toFixed(2)} → $
              {balance.toFixed(2)} ·{' '}
              <span style={{ color: deltaPct >= 0 ? '#00d35a' : '#ff453a' }}>
                {deltaPct >= 0 ? '+' : ''}
                {deltaPct.toFixed(1)}%
              </span>{' '}
              · {allTrades.length} trades · {won.length} won · {lost.length} lost
            </h1>
          </div>

          <button
            type="button"
            onClick={exportMarkdown}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium bg-[#2c2c2e] text-white hover:bg-[#3a3a3c] transition-colors whitespace-nowrap shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            Markdown出力
          </button>
        </div>

        {/* 3 Numbers: Biggest Win, Biggest Loss, Fees Paid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-5 pt-5 border-t border-[rgba(84,84,88,0.35)]">
          <div>
            <div className="text-xs text-[rgba(235,235,245,0.55)]">最大利益 (Biggest win)</div>
            <div className="text-2xl font-bold font-mono-num text-[#00d35a] mt-1">
              +${biggestWin.toFixed(2)}
            </div>
          </div>
          <div>
            <div className="text-xs text-[rgba(235,235,245,0.55)]">最大損失 (Biggest loss)</div>
            <div className="text-2xl font-bold font-mono-num text-[#ff453a] mt-1">
              -${Math.abs(biggestLoss).toFixed(2)}
            </div>
          </div>
          <div>
            <div className="text-xs text-[rgba(235,235,245,0.55)]">支払手数料合計 (Fees paid)</div>
            <div className="text-2xl font-bold font-mono-num text-white mt-1">
              ${totalFees.toFixed(2)}
            </div>
          </div>
        </div>
      </section>

      {/* Red Trades First, Then Green (Step 14) */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-white">
          トレード詳細（赤字を先頭表示 · クジラ実績との比較）
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {orderedTrades.map((t) => {
            const isWin = t.pnlUsd >= 0;
            return (
              <div
                key={t.id}
                className="bg-[#1c1c1e] rounded-xl p-5 border border-[rgba(84,84,88,0.45)] space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onOpenCoin(t.mint)}
                        className="text-base font-semibold text-white hover:text-[#64d2ff]"
                      >
                        {t.symbol}
                      </button>
                      <span className="text-xs font-mono-num text-[rgba(235,235,245,0.5)]">
                        Score {t.score} · lag {t.lagS}s
                      </span>
                    </div>
                    <div className="text-xs font-mono-num text-[rgba(235,235,245,0.6)] mt-0.5">
                      {t.whales.map((w, i) => (
                        <React.Fragment key={w}>
                          {i > 0 && ', '}
                          <a
                            href={profileUrl(w)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#64d2ff] hover:underline"
                          >
                            {w}
                          </a>
                        </React.Fragment>
                      ))}{' '}
                      · {t.exitReason || '保有中'}
                    </div>
                  </div>
                  <div className="text-right font-mono-num">
                    <div
                      className="text-base font-bold"
                      style={{ color: isWin ? '#00d35a' : '#ff453a' }}
                    >
                      {isWin ? '+' : '-'}${Math.abs(t.pnlUsd).toFixed(2)}
                    </div>
                    <div
                      className="text-xs"
                      style={{ color: isWin ? '#00d35a' : '#ff453a' }}
                    >
                      {t.pnlPct >= 0 ? '+' : ''}
                      {t.pnlPct.toFixed(1)}%
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-3 border-t border-[rgba(84,84,88,0.3)] text-xs font-mono-num">
                  <div>
                    <span className="text-[rgba(235,235,245,0.5)] block">サイズ</span>
                    <span className="text-white">${t.sizeUsd.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-[rgba(235,235,245,0.5)] block">Entry → Exit</span>
                    <span className="text-white">
                      ${t.entryPrice.toFixed(5)} → ${(t.exitPrice ?? t.currentPrice).toFixed(5)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[rgba(235,235,245,0.5)] block">Whale vs You</span>
                    <span className="text-white">
                      {t.whaleResultPct !== undefined
                        ? `${t.whaleResultPct >= 0 ? '+' : ''}${t.whaleResultPct}%`
                        : '—'}{' '}
                      / {t.pnlPct >= 0 ? '+' : ''}
                      {t.pnlPct.toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Bottom Split: Vetter Refusal Bars & Whale Performance */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Vetter Layer Refusals */}
        <section className="bg-[#1c1c1e] rounded-xl p-5 border border-[rgba(84,84,88,0.45)] space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Vetter 8層 拒否内訳 (Refusals)</h2>
            <span className="text-xs font-mono-num text-[rgba(235,235,245,0.55)]">
              計 {rejectedCoins.length} 銘柄ブロック
            </span>
          </div>
          <div className="space-y-2.5">
            {layerCounts.map((row) => (
              <div key={row.layerNum} className="flex items-center gap-3 text-xs">
                <span className="w-28 text-[rgba(235,235,245,0.7)] font-mono-num shrink-0">
                  {row.name}
                </span>
                <div className="flex-1 h-2 bg-[#2c2c2e] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#ff453a] rounded-full"
                    style={{ width: `${(row.count / maxRefusal) * 100}%` }}
                  />
                </div>
                <span className="w-6 text-right font-mono-num text-white">{row.count}</span>
              </div>
            ))}
          </div>
          <div className="pt-3 border-t border-[rgba(84,84,88,0.3)] space-y-1.5">
            <div className="text-xs text-[rgba(235,235,245,0.55)]">拒否銘柄クイック確認:</div>
            <div className="flex flex-wrap gap-2">
              {rejectedCoins.map((c) => (
                <button
                  key={c.mint}
                  type="button"
                  onClick={() => onOpenAudit(c.mint)}
                  className="px-2.5 py-1 rounded bg-[#2c2c2e] text-xs font-mono-num text-white hover:bg-[#3a3a3c]"
                >
                  {c.symbol} · {c.score.reason}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Health & Whale Table */}
        <section className="bg-[#1c1c1e] rounded-xl p-5 border border-[rgba(84,84,88,0.45)] flex flex-col justify-between space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-white mb-3">
              デスク稼働ヘルス & クジラ別成績
            </h2>
            <div className="grid grid-cols-4 gap-3 bg-[#141416] p-3.5 rounded-lg border border-[rgba(84,84,88,0.3)] text-xs font-mono-num mb-4">
              <div>
                <div className="text-[rgba(235,235,245,0.5)]">再起動</div>
                <div className="text-white font-semibold mt-0.5">0回</div>
              </div>
              <div>
                <div className="text-[rgba(235,235,245,0.5)]">API呼出/分</div>
                <div className="text-white font-semibold mt-0.5">34 / 50</div>
              </div>
              <div>
                <div className="text-[rgba(235,235,245,0.5)]">中央値ラグ</div>
                <div className="text-[#00d35a] font-semibold mt-0.5">7.5s</div>
              </div>
              <div>
                <div className="text-[rgba(235,235,245,0.5)]">ダウン時間</div>
                <div className="text-white font-semibold mt-0.5">0m</div>
              </div>
            </div>

            <div className="divide-y divide-[rgba(84,84,88,0.3)] text-xs">
              {whales.slice(0, 5).map((w) => (
                <div key={w.userId} className="flex items-center justify-between py-2 font-mono-num">
                  <a
                    href={profileUrl(w.handle)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#64d2ff] hover:underline"
                  >
                    {w.handle}
                  </a>
                  <span className="text-[rgba(235,235,245,0.6)]">
                    copied {w.copiedCount} · refused {w.refusedCount}
                  </span>
                  <span
                    className="font-semibold"
                    style={{ color: w.myPnlTonight >= 0 ? '#00d35a' : '#ff453a' }}
                  >
                    {w.myPnlTonight >= 0 ? '+' : '-'}${Math.abs(w.myPnlTonight).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-[rgba(84,84,88,0.35)] flex items-center justify-between text-xs text-[rgba(235,235,245,0.55)]">
            <span>New to FOMO?</span>
            <a
              href={SIGNUP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#64d2ff] hover:underline font-mono-num inline-flex items-center gap-1"
            >
              {SIGNUP_URL}
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </section>
      </div>
    </div>
  );
};
