import React from 'react';
import { Check, ExternalLink, X } from 'lucide-react';
import { Order } from '../types/desk';
import { coinUrl } from '../engine/links';

interface OrderSheetModalProps {
  order: Order | null;
  onClose: () => void;
}

export const OrderSheetModal: React.FC<OrderSheetModalProps> = ({ order, onClose }) => {
  if (!order) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Order ${order.id}`}
    >
      <div className="w-full max-w-xl bg-[#1c1c1e] border border-[rgba(84,84,88,0.55)] rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(84,84,88,0.45)]">
          <div>
            <div className="flex items-center gap-2.5">
              <span
                className="text-xs font-mono-num font-semibold"
                style={{ color: order.side === 'buy' ? '#00d35a' : '#ff9f0a' }}
              >
                {order.side === 'buy' ? 'BUY' : 'SELL'}
              </span>
              <h2 className="text-base font-semibold text-white">
                {order.symbol} · ${order.usdAsked.toFixed(2)}
              </h2>
              <span className="text-xs font-mono-num text-[rgba(235,235,245,0.5)]">
                #{order.id}
              </span>
            </div>
            <p className="text-xs text-[rgba(235,235,245,0.55)] mt-0.5">
              {order.ts} · {order.bot} · {order.reason}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-[rgba(235,235,245,0.6)] hover:text-white hover:bg-[#2c2c2e]"
            aria-label="Close order sheet"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5 text-xs">
          {/* Quote & Fee summary */}
          <div className="grid grid-cols-2 gap-4 bg-[#141416] p-4 rounded-lg border border-[rgba(84,84,88,0.35)]">
            <div>
              <div className="text-[rgba(235,235,245,0.5)]">Quote readback</div>
              <div className="font-mono-num text-white mt-1">{order.quoteText}</div>
            </div>
            <div>
              <div className="text-[rgba(235,235,245,0.5)]">FOMO Fee / Price Impact</div>
              <div className="font-mono-num text-white mt-1">
                {order.feeText} · impact {order.priceImpactPct}%
              </div>
            </div>
          </div>

          {/* 3 Verification Checks (Step 9 & 10) */}
          <div className="space-y-2.5">
            <div className="text-white font-medium">3段階約定ベリファイ (verify.py)</div>
            {[
              { name: '1. Screen check', ok: order.screenOk, detail: order.screenDetail },
              { name: '2. FOMO API /swaps check', ok: order.apiOk, detail: order.apiDetail },
              {
                name: '3. Solana RPC chain balance',
                ok: order.chainOk === true,
                detail: order.chainDetail,
                na: order.chainOk === 'n/a',
              },
            ].map((chk) => (
              <div
                key={chk.name}
                className="flex items-center justify-between py-2 border-b border-[rgba(84,84,88,0.3)]"
              >
                <div>
                  <div className="text-white font-medium">{chk.name}</div>
                  <div className="text-[11px] font-mono-num text-[rgba(235,235,245,0.55)]">
                    {chk.detail}
                  </div>
                </div>
                <span
                  className="inline-flex items-center gap-1 font-mono-num font-semibold shrink-0"
                  style={{
                    color: chk.na
                      ? 'rgba(235,235,245,0.5)'
                      : chk.ok
                      ? '#00d35a'
                      : '#ff453a',
                  }}
                >
                  {chk.ok && <Check className="w-3.5 h-3.5" />}
                  {chk.na ? 'n/a' : chk.ok ? 'ok' : 'no'}
                </span>
              </div>
            ))}
          </div>

          {/* ms per click script step */}
          <div className="space-y-1.5">
            <div className="text-white font-medium">クリックスクリプト所要時間 (ms per step)</div>
            <div className="grid grid-cols-3 gap-2">
              {order.stepsMs.map((st) => (
                <div
                  key={st.label}
                  className="bg-[#141416] px-3 py-2 rounded border border-[rgba(84,84,88,0.3)]"
                >
                  <div className="text-[11px] text-[rgba(235,235,245,0.55)] truncate">{st.label}</div>
                  <div className="font-mono-num text-white font-semibold mt-0.5">{st.ms} ms</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between px-6 py-3.5 border-t border-[rgba(84,84,88,0.45)] bg-[#141416]">
          <span className="text-xs font-mono-num text-[rgba(235,235,245,0.6)]">
            Status: <strong className="text-white">{order.status}</strong> · Fill ${order.fillUsd.toFixed(2)}
          </span>
          <a
            href={coinUrl(order.mint, 'solana')}
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
