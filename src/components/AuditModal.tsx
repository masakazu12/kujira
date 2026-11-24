import React, { useEffect, useState } from 'react';
import { Check, ExternalLink, Minus, X } from 'lucide-react';
import { Coin } from '../types/desk';
import { coinUrl, profileUrl } from '../engine/links';

interface AuditModalProps {
  coin: Coin | null;
  onClose: () => void;
  onOpenCoin: (mint: string) => void;
}

export const AuditModal: React.FC<AuditModalProps> = ({ coin, onClose, onOpenCoin }) => {
  const [scanIndex, setScanIndex] = useState(0);

  useEffect(() => {
    if (!coin) return;
    setScanIndex(0);
    const id = window.setInterval(() => {
      setScanIndex((prev) => {
        if (prev >= 8) {
          window.clearInterval(id);
          return 8;
        }
        return prev + 1;
      });
    }, 140);
    return () => window.clearInterval(id);
  }, [coin]);

  if (!coin) return null;

  const passedCount = coin.layers.filter((l) => l.pass === true).length;
  const scoreColor = coin.score.pass ? '#00d35a' : '#ff453a';
  const circumference = 2 * Math.PI * 30;
  const strokeDashoffset = circumference - (coin.score.score / 100) * circumference;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Audit ${coin.symbol}`}
    >
      <div className="w-full max-w-2xl bg-[#1c1c1e] border border-[rgba(84,84,88,0.55)] rounded-xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(84,84,88,0.45)]">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-white">
                {coin.symbol} · 8層オンチェーン監査 (Vetter)
              </h2>
              <span
                className="text-xs font-mono-num font-semibold"
                style={{ color: coin.score.pass ? '#00d35a' : '#ff453a' }}
              >
                {coin.score.pass ? 'PASS' : 'REJECTED'} ({passedCount}/8)
              </span>
            </div>
            <p className="text-xs text-[rgba(235,235,245,0.55)] font-mono-num mt-0.5">
              {coin.mint} · {coin.ageText}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-[rgba(235,235,245,0.6)] hover:text-white hover:bg-[#2c2c2e]"
            aria-label="Close audit screen"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* 8 Discs + Cyan Beam + Score Ring */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-5 border-b border-[rgba(84,84,88,0.4)]">
            <div className="flex-1 w-full">
              <div className="text-xs text-[rgba(235,235,245,0.6)] mb-3">
                監査シーケンス（最初の赤で即停止・残り未検証）
              </div>
              <div className="relative flex items-center justify-between gap-2">
                {/* Cyan beam */}
                <div className="absolute left-3 right-3 top-1/2 -translate-y-1/2 h-[2px] bg-[#2c2c2e] overflow-hidden">
                  <div
                    className="h-full bg-[#64d2ff] transition-all duration-150"
                    style={{ width: `${(scanIndex / 8) * 100}%` }}
                  />
                </div>
                {coin.layers.map((layer, idx) => {
                  const scanned = idx < scanIndex;
                  const bg =
                    !scanned
                      ? '#2c2c2e'
                      : layer.pass === true
                      ? '#00d35a'
                      : layer.pass === false
                      ? '#ff453a'
                      : '#3a3a3c';
                  return (
                    <div
                      key={layer.layer}
                      className="relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-xs font-mono-num font-semibold border-2 border-[#1c1c1e] transition-colors"
                      style={{
                        backgroundColor: bg,
                        color: scanned && layer.pass !== null ? '#000000' : 'rgba(235,235,245,0.6)',
                      }}
                      title={`L${layer.layer} ${layer.name}: ${layer.valueText}`}
                    >
                      {scanned && layer.pass === true ? (
                        <Check className="w-4 h-4" />
                      ) : scanned && layer.pass === false ? (
                        <X className="w-4 h-4" />
                      ) : scanned && layer.pass === null ? (
                        <Minus className="w-3.5 h-3.5" />
                      ) : (
                        layer.layer
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Score Ring */}
            <div className="flex items-center gap-4 shrink-0">
              <div className="relative w-20 h-20 flex items-center justify-center">
                <svg className="w-20 h-20 -rotate-90" viewBox="0 0 72 72">
                  <circle cx="36" cy="36" r="30" fill="none" stroke="#2c2c2e" strokeWidth="5" />
                  <circle
                    cx="36"
                    cy="36"
                    r="30"
                    fill="none"
                    stroke={scoreColor}
                    strokeWidth="5"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl font-bold font-mono-num text-white">{coin.score.score}</span>
                  <span className="text-[10px] text-[rgba(235,235,245,0.5)]">/100</span>
                </div>
              </div>
            </div>
          </div>

          {/* 8 Layer Detail Rows */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5">
            {coin.layers.map((layer) => (
              <div
                key={layer.layer}
                className="flex items-center justify-between py-2 border-b border-[rgba(84,84,88,0.3)] text-xs"
              >
                <div className="min-w-0 pr-2">
                  <div className="text-white font-medium">
                    {layer.layer}. {layer.name}
                  </div>
                  <div className="text-[11px] text-[rgba(235,235,245,0.45)]">{layer.source}</div>
                </div>
                <div className="text-right shrink-0 font-mono-num">
                  <div
                    className="font-medium"
                    style={{
                      color:
                        layer.pass === true
                          ? '#00d35a'
                          : layer.pass === false
                          ? '#ff453a'
                          : 'rgba(235,235,245,0.4)',
                    }}
                  >
                    {layer.valueText}
                  </div>
                  <div className="text-[10px] text-[rgba(235,235,245,0.45)]">
                    {layer.pass === true ? 'ok' : layer.pass === false ? 'red' : 'skip'}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Whales & Social rows (Step 10 exact format) */}
          <div className="space-y-2 text-xs font-mono-num bg-[#141416] rounded-lg p-4 border border-[rgba(84,84,88,0.35)]">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[rgba(235,235,245,0.6)]">Whales:</span>
              <div className="flex items-center gap-2 flex-wrap">
                {coin.whales.map((w) => (
                  <a
                    key={w}
                    href={profileUrl(w)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#64d2ff] hover:underline"
                  >
                    {w}
                  </a>
                ))}
                <span className="text-[rgba(235,235,245,0.5)]">· first in {coin.firstSeenAgo}</span>
              </div>
            </div>
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-[rgba(84,84,88,0.28)]">
              <span className="text-[rgba(235,235,245,0.6)]">X Social:</span>
              {coin.social.enabled && coin.social.value !== null ? (
                <span className="text-white">
                  Social {coin.social.socialPts >= 0 ? '+' : ''}
                  {coin.social.socialPts} · {coin.social.u15} accounts in 15m (accel {coin.social.accel.toFixed(1)}x)
                </span>
              ) : (
                <span className="text-[rgba(235,235,245,0.5)]">Social: off</span>
              )}
            </div>
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-[rgba(84,84,88,0.28)] text-[11px] text-[rgba(235,235,245,0.55)]">
              <span>Score Breakdown</span>
              <span>
                core {coin.score.core.toFixed(2)} · flow {coin.score.flowPart} · lag {coin.score.lagPart.toFixed(2)} · chase -{coin.score.chasePart.toFixed(2)}
                {coin.score.clusterBonus > 0 ? ` · cluster +${coin.score.clusterBonus}` : ''}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-[rgba(84,84,88,0.45)] bg-[#141416]">
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenCoin(coin.mint);
            }}
            className="text-xs font-medium text-white hover:text-[#64d2ff] transition-colors"
          >
            チャート・ポジション画面を開く
          </button>
          <a
            href={coinUrl(coin.mint, coin.chain)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium bg-[#2c2c2e] text-white rounded-md hover:bg-[#3a3a3c] transition-colors"
          >
            Open on FOMO
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
};
