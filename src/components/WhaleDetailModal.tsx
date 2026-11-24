import React from 'react';
import { ExternalLink, Volume2, VolumeX, X } from 'lucide-react';
import { Whale } from '../types/desk';
import { coinUrl, profileUrl } from '../engine/links';

interface WhaleDetailModalProps {
  whale: Whale | null;
  onClose: () => void;
  onToggleMute: (userId: string) => void;
  onOpenCoin: (mint: string) => void;
}

export const WhaleDetailModal: React.FC<WhaleDetailModalProps> = ({
  whale,
  onClose,
  onToggleMute,
  onOpenCoin,
}) => {
  if (!whale) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Whale ${whale.handle}`}
    >
      <div className="w-full max-w-2xl bg-[#1c1c1e] border border-[rgba(84,84,88,0.55)] rounded-xl overflow-hidden max-h-[88vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(84,84,88,0.45)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#2c2c2e] flex items-center justify-center text-sm font-bold font-mono-num text-[#64d2ff]">
              #{whale.rank}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <a
                  href={profileUrl(whale.handle)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-base font-semibold text-white hover:text-[#64d2ff] inline-flex items-center gap-1"
                >
                  {whale.handle}
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                {whale.muted && (
                  <span className="text-xs font-mono-num text-[#ff9f0a]">MUTED</span>
                )}
              </div>
              <div className="text-xs font-mono-num text-[rgba(235,235,245,0.5)]">
                {whale.address.slice(0, 12)}...{whale.address.slice(-6)} · WHALE PROOF {whale.chainMatchRate}%
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onToggleMute(whale.userId)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                whale.muted
                  ? 'bg-[#ff9f0a]/15 text-[#ff9f0a]'
                  : 'bg-[#2c2c2e] text-white hover:bg-[#3a3a3c]'
              }`}
            >
              {whale.muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              {whale.muted ? 'ミュート解除' : 'ミュート'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-[rgba(235,235,245,0.6)] hover:text-white hover:bg-[#2c2c2e]"
              aria-label="Close whale detail"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto space-y-5">
          {/* Metrics */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 bg-[#141416] p-4 rounded-lg border border-[rgba(84,84,88,0.35)] text-xs">
            <div>
              <div className="text-[rgba(235,235,245,0.5)]">7d PnL</div>
              <div className="font-mono-num text-[#00d35a] font-semibold mt-0.5">
                +${whale.pnl7d.toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-[rgba(235,235,245,0.5)]">Win rate</div>
              <div className="font-mono-num text-white font-semibold mt-0.5">{whale.winRate}%</div>
            </div>
            <div>
              <div className="text-[rgba(235,235,245,0.5)]">Trades 7d</div>
              <div className="font-mono-num text-white font-semibold mt-0.5">{whale.trades7d}</div>
            </div>
            <div>
              <div className="text-[rgba(235,235,245,0.5)]">Median hold</div>
              <div className="font-mono-num text-white font-semibold mt-0.5">{whale.medianHoldMin}m</div>
            </div>
            <div>
              <div className="text-[rgba(235,235,245,0.5)]">Top coin</div>
              <div className="font-mono-num text-white font-semibold mt-0.5">{whale.topCoinShare}%</div>
            </div>
            <div>
              <div className="text-[rgba(235,235,245,0.5)]">My PnL</div>
              <div
                className="font-mono-num font-semibold mt-0.5"
                style={{ color: whale.myPnlTonight >= 0 ? '#00d35a' : '#ff453a' }}
              >
                {whale.myPnlTonight >= 0 ? '+' : '-'}${Math.abs(whale.myPnlTonight).toFixed(2)}
              </div>
            </div>
          </div>

          <p className="text-xs text-[rgba(235,235,245,0.55)]">
            ミュート設定中も、すでに保有中のポジションについては Guard がクジラの売却（whale out）監視を継続します。
          </p>

          {/* Last fills */}
          <div>
            <div className="text-xs font-semibold text-white mb-2.5">直近の約定履歴 (Last fills)</div>
            <div className="divide-y divide-[rgba(84,84,88,0.3)] border-t border-b border-[rgba(84,84,88,0.3)]">
              {whale.fills.map((f) => (
                <div key={f.id} className="flex items-center justify-between py-2.5 text-xs">
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenCoin(f.mint);
                      }}
                      className="font-semibold text-white hover:text-[#64d2ff] font-mono-num"
                    >
                      {f.symbol}
                    </button>
                    <span className="font-mono-num text-[rgba(235,235,245,0.75)]">${f.usd}</span>
                    <span className="font-mono-num text-[rgba(235,235,245,0.45)]">{f.ts} · lag {f.lagS}s</span>
                    <a
                      href={coinUrl(f.mint, 'solana')}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[rgba(235,235,245,0.45)] hover:text-[#64d2ff]"
                      aria-label={`Open ${f.symbol} on FOMO`}
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <span
                    className="font-mono-num shrink-0"
                    style={{
                      color:
                        f.status === 'copied'
                          ? '#00d35a'
                          : 'rgba(235,235,245,0.55)',
                    }}
                  >
                    {f.status === 'copied'
                      ? 'copied'
                      : `${f.status}: ${f.reason}`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
