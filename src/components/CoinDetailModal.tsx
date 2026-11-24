import React, { useState } from 'react';
import { ExternalLink, ShieldCheck, X } from 'lucide-react';
import { Coin, DeskMode, Position } from '../types/desk';
import { coinUrl } from '../engine/links';
import { CoinCandleChart } from './CanvasCharts';

interface CoinDetailModalProps {
  coin: Coin | null;
  position?: Position;
  mode: DeskMode;
  onClose: () => void;
  onOpenAudit: (mint: string) => void;
  onSellPosition: (mint: string, pct: number) => void;
}

export const CoinDetailModal: React.FC<CoinDetailModalProps> = ({
  coin,
  position,
  mode,
  onClose,
  onOpenAudit,
  onSellPosition,
}) => {
  const [sellSheetOpen, setSellSheetOpen] = useState(false);
  const [sellPct, setSellPct] = useState<number>(100);

  if (!coin) return null;

  const passedCount = coin.layers.filter((l) => l.pass === true).length;
  const pctSinceEntry = position
    ? ((position.currentPrice - position.entryPrice) / position.entryPrice) * 100
    : coin.priceChangeH1;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Coin ${coin.symbol}`}
    >
      <div className="w-full max-w-2xl bg-[#1c1c1e] border border-[rgba(84,84,88,0.55)] rounded-xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(84,84,88,0.45)]">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-white">{coin.name}</h2>
              {mode === 'PAPER' && (
                <span className="text-xs font-mono-num font-semibold text-[#ff9f0a]">PAPER</span>
              )}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAudit(coin.mint);
                }}
                className="inline-flex items-center gap-1 text-xs font-mono-num text-[#00d35a] hover:underline"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                {passedCount}/8
              </button>
            </div>
            <div className="text-xs text-[rgba(235,235,245,0.55)] mt-0.5">
              {coin.symbol} · Solana · {coin.ageText}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-[rgba(235,235,245,0.6)] hover:text-white hover:bg-[#2c2c2e]"
            aria-label="Close coin detail"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Price Header */}
          <div className="flex items-baseline justify-between">
            <div>
              <div className="text-3xl font-bold font-mono-num text-white">
                ${coin.price.toFixed(6)}
              </div>
              <div
                className="text-xs font-mono-num mt-1"
                style={{ color: pctSinceEntry >= 0 ? '#00d35a' : '#ff453a' }}
              >
                {pctSinceEntry >= 0 ? '▲' : '▼'} {Math.abs(pctSinceEntry).toFixed(2)}%{' '}
                {position ? 'since entry' : '1h change'}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-5 text-right text-xs">
              <div>
                <div className="text-[rgba(235,235,245,0.5)]">Market cap</div>
                <div className="font-mono-num text-white font-medium mt-0.5">
                  ${(coin.mcapUsd / 1000).toFixed(0)}K
                </div>
              </div>
              <div>
                <div className="text-[rgba(235,235,245,0.5)]">Liquidity</div>
                <div className="font-mono-num text-white font-medium mt-0.5">
                  ${(coin.liquidityUsd / 1000).toFixed(1)}K
                </div>
              </div>
              <div>
                <div className="text-[rgba(235,235,245,0.5)]">Holders</div>
                <div className="font-mono-num text-white font-medium mt-0.5">
                  {coin.holders.toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {/* 1-Minute Candle Chart */}
          <div className="bg-[#111113] rounded-lg p-3 border border-[rgba(84,84,88,0.35)]">
            <CoinCandleChart
              candles={coin.candles}
              entryPrice={position?.entryPrice}
              stopPrice={position?.stopPrice}
            />
          </div>

          {/* Your Position */}
          {position ? (
            <div className="bg-[#141416] rounded-lg p-4 border border-[rgba(84,84,88,0.4)] space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-[rgba(235,235,245,0.55)]">Your position · Executor</div>
                  <div className="text-sm font-mono-num text-white font-semibold mt-0.5">
                    ${position.sizeUsd.toFixed(2)} in ·{' '}
                    <span style={{ color: position.pnlUsd >= 0 ? '#00d35a' : '#ff453a' }}>
                      {position.pnlUsd >= 0 ? '+' : '-'}${Math.abs(position.pnlUsd).toFixed(2)} (
                      {position.pnlPct >= 0 ? '+' : ''}
                      {position.pnlPct.toFixed(1)}%)
                    </span>
                  </div>
                </div>
                <div className="text-right text-xs font-mono-num text-[rgba(235,235,245,0.6)]">
                  <div>Stop ${position.stopPrice.toFixed(6)}</div>
                  <div>Lead {position.leadWhale}</div>
                </div>
              </div>

              {sellSheetOpen && (
                <div className="pt-3 border-t border-[rgba(84,84,88,0.35)] space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white font-medium">売却比率を選択 (POST /api/sell)</span>
                    <div className="flex items-center gap-1.5">
                      {[25, 50, 100].map((pct) => (
                        <button
                          key={pct}
                          type="button"
                          onClick={() => setSellPct(pct)}
                          className={`px-3 py-1 rounded text-xs font-mono-num transition-colors ${
                            sellPct === pct
                              ? 'bg-[#ff453a] text-white font-semibold'
                              : 'bg-[#2c2c2e] text-[rgba(235,235,245,0.75)] hover:text-white'
                          }`}
                        >
                          {pct}%
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setSellSheetOpen(false)}
                      className="px-3 py-1.5 text-xs text-[rgba(235,235,245,0.7)] hover:text-white"
                    >
                      キャンセル
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onSellPosition(coin.mint, sellPct);
                        setSellSheetOpen(false);
                        onClose();
                      }}
                      className="px-4 py-1.5 text-xs font-semibold rounded-md bg-[#ff453a] text-white hover:bg-[#ff5e54] transition-colors"
                    >
                      Confirm sell {sellPct}% ({coin.symbol})
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-xs text-[rgba(235,235,245,0.55)] bg-[#141416] rounded-lg px-4 py-3 border border-[rgba(84,84,88,0.35)]">
              現在オープンポジションはありません（ステータス: {coin.status}）
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-[rgba(84,84,88,0.45)] bg-[#141416]">
          <a
            href={coinUrl(coin.mint, coin.chain)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-[#2c2c2e] text-white rounded-md hover:bg-[#3a3a3c] transition-colors"
          >
            Open on FOMO
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          {position && !sellSheetOpen && (
            <button
              type="button"
              onClick={() => setSellSheetOpen(true)}
              className="px-4 py-2 text-xs font-semibold bg-[#ff453a] text-white rounded-md hover:bg-[#ff5e54] transition-colors"
            >
              Sell now
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
