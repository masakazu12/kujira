import React, { useState } from 'react';
import { ExternalLink, Maximize2, ShieldAlert, X, Check, Lock } from 'lucide-react';
import { DeskMode, LiveScreenState } from '../types/desk';
import { coinUrl } from '../engine/links';

const BOT_COLORS: Record<string, string> = {
  watcher: '#64d2ff',
  vetter: '#ffd60a',
  sizer: '#bf5af2',
  executor: '#00d35a',
  guard: '#ff6b9a',
  idle: 'rgba(235,235,245,0.55)',
};

const BOT_LABELS: Record<string, string> = {
  watcher: 'Watcher',
  vetter: 'Vetter',
  sizer: 'Sizer',
  executor: 'Executor',
  guard: 'Guard',
  idle: 'Idle',
};

interface LiveScreenCardProps {
  liveScreen: LiveScreenState;
  mode: DeskMode;
  onTogglePrivate: () => void;
  onInspectCoin: (mint: string) => void;
}

export const LiveScreenCard: React.FC<LiveScreenCardProps> = ({
  liveScreen,
  mode,
  onTogglePrivate,
  onInspectCoin,
}) => {
  const [fullscreen, setFullscreen] = useState(false);

  const botColor = BOT_COLORS[liveScreen.activeBot] || '#00d35a';
  const botLabel = BOT_LABELS[liveScreen.activeBot] || 'Idle';
  const isFresh = Date.now() - liveScreen.lastFrameTs < 5000;

  const renderViewport = (expanded: boolean) => (
    <div
      className={`relative w-full aspect-video bg-[#0d0d10] overflow-hidden border border-[rgba(84,84,88,0.45)] ${
        expanded ? 'rounded-xl' : 'rounded-xl'
      }`}
    >
      {/* Top overlay bar */}
      <div className="absolute top-0 inset-x-0 z-20 flex items-center justify-between px-3.5 py-2 bg-black/75 border-b border-[rgba(84,84,88,0.35)]">
        <div className="flex items-center gap-2 text-xs">
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: isFresh ? '#ff453a' : 'rgba(235,235,245,0.4)' }}
            aria-hidden="true"
          />
          <span className="text-white font-medium">
            {isFresh ? 'Live · Chrome CDP (127.0.0.1:9333)' : 'Last frame'}
          </span>
          <span className="text-[rgba(235,235,245,0.4)]">·</span>
          <span className="text-[rgba(235,235,245,0.6)] font-mono-num">tab: copy</span>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="font-medium font-mono-num" style={{ color: botColor }}>
            {liveScreen.actionLabel}
          </span>
          <button
            type="button"
            onClick={onTogglePrivate}
            className="text-[rgba(235,235,245,0.6)] hover:text-white transition-colors"
            title="プライベート一時停止を切り替え"
            aria-label="Toggle private pause"
          >
            <Lock className="w-3.5 h-3.5" />
          </button>
          {!expanded && (
            <button
              type="button"
              onClick={() => setFullscreen(true)}
              className="text-[rgba(235,235,245,0.6)] hover:text-white transition-colors"
              aria-label="Open Live Screen fullscreen"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Private pause state (Step 9: no frames during login/withdraw) */}
      {liveScreen.privatePaused ? (
        <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-[#0b0b0d] pt-8">
          <ShieldAlert className="w-7 h-7 text-[#ff9f0a]" />
          <p className="text-sm font-medium text-white">Paused · private</p>
          <p className="text-xs text-[rgba(235,235,245,0.55)]">
            ログイン / 出金画面検出時はフレームキャプチャとログ記録を自動停止します
          </p>
          <button
            type="button"
            onClick={onTogglePrivate}
            className="mt-2 px-3 py-1.5 text-xs font-medium bg-[#2c2c2e] text-white rounded-md hover:bg-[#3a3a3c] transition-colors"
          >
            キャプチャを再開
          </button>
        </div>
      ) : (
        /* Simulated Chrome CDP FOMO Web Viewport */
        <div className="w-full h-full pt-10 px-4 pb-10 flex flex-col justify-between bg-[#101114] select-none">
          {/* Simulated Chrome Address Bar */}
          <div className="flex items-center justify-between text-[11px] font-mono-num text-[rgba(235,235,245,0.5)] bg-[#191a1f] px-3 py-1.5 rounded-md border border-[rgba(84,84,88,0.3)]">
            <span className="truncate">
              {coinUrl(liveScreen.coinMint, 'solana')}
            </span>
            <span className="text-[rgba(235,235,245,0.35)] shrink-0 ml-2">Zoom 100% · EN</span>
          </div>

          {/* Simulated FOMO Web Buy/Sell Panel */}
          <div className="grid grid-cols-12 gap-3 my-2 flex-1 items-center">
            {/* Left mini chart mock inside Chrome tab */}
            <div className="col-span-7 h-full bg-[#15161b] rounded-lg p-3 border border-[rgba(84,84,88,0.28)] flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-semibold text-white">{liveScreen.coinSymbol}</span>
                  <span className="ml-2 text-[11px] text-[rgba(235,235,245,0.5)] font-mono-num">
                    Solana · {liveScreen.coinMint.slice(0, 6)}...{liveScreen.coinMint.slice(-4)}
                  </span>
                </div>
                <span className="text-xs font-mono-num text-[#00d35a]">Contract matched</span>
              </div>

              <svg viewBox="0 0 240 64" className="w-full h-16 overflow-visible">
                <polyline
                  fill="none"
                  stroke="#00d35a"
                  strokeWidth="2"
                  points="0,48 24,44 48,50 72,36 96,39 120,26 144,30 168,18 192,22 216,12 240,15"
                />
                <line x1="0" y1="54" x2="240" y2="54" stroke="#ff9f0a" strokeDasharray="3 3" strokeWidth="1" />
              </svg>

              <div className="flex items-center justify-between text-[11px] font-mono-num text-[rgba(235,235,245,0.55)]">
                <span>Step: {liveScreen.scriptStep}</span>
                <span>Slippage: Auto</span>
              </div>
            </div>

            {/* Right Buy | Sell Panel inside Chrome tab */}
            <div className="col-span-5 h-full bg-[#15161b] rounded-lg p-3 border border-[rgba(84,84,88,0.28)] flex flex-col justify-between">
              <div className="grid grid-cols-2 gap-1 bg-[#1f2026] p-0.5 rounded text-[11px] font-medium text-center">
                <div className="py-1 rounded bg-[#2c2c2e] text-white">Buy</div>
                <div className="py-1 text-[rgba(235,235,245,0.5)]">Sell</div>
              </div>

              <div className="my-1.5">
                <div className="text-[10px] text-[rgba(235,235,245,0.45)] mb-0.5">Amount (USD)</div>
                <div className="bg-[#0d0d10] border border-[rgba(84,84,88,0.45)] rounded px-2.5 py-1.5 text-xs font-mono-num text-white flex justify-between">
                  <span>{liveScreen.amountTyped}</span>
                  <span className="text-[rgba(235,235,245,0.45)]">USDC</span>
                </div>
                <div className="text-[10px] font-mono-num text-[rgba(235,235,245,0.55)] mt-1 truncate">
                  {liveScreen.quoteShown}
                </div>
              </div>

              <div className="w-full py-1.5 rounded text-center text-xs font-semibold bg-[#00d35a] text-black">
                {mode === 'PAPER' ? `Buy ${liveScreen.coinSymbol} (PAPER stop)` : `Buy ${liveScreen.coinSymbol}`}
              </div>
            </div>
          </div>

          {/* Animated Bot Cursor (Step 9: small arrow in bot's color + name underneath) */}
          <div
            className="pointer-events-none absolute z-30 transition-all duration-300 ease-out"
            style={{
              left: `${liveScreen.cursorX}%`,
              top: `${liveScreen.cursorY}%`,
              transform: `translate(-4px, -4px) scale(${liveScreen.clicking ? 0.88 : 1})`,
            }}
          >
            <svg width="16" height="18" viewBox="0 0 16 18" fill="none">
              <path
                d="M1 1L6.5 16L9.2 10.2L15 7.5L1 1Z"
                fill={botColor}
                stroke="#000000"
                strokeWidth="1.2"
              />
            </svg>
            <div
              className="mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-mono-num font-semibold text-black whitespace-nowrap"
              style={{ backgroundColor: botColor }}
            >
              {botLabel}
            </div>
          </div>
        </div>
      )}

      {/* Bottom verification strip */}
      <div className="absolute bottom-0 inset-x-0 z-20 flex items-center justify-between px-3.5 py-2 bg-black/80 border-t border-[rgba(84,84,88,0.35)] text-xs">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-white font-mono-num truncate">{liveScreen.lastOrderSummary}</span>
          <div className="flex items-center gap-2 text-[11px] font-mono-num shrink-0">
            <span className={liveScreen.checks.screen ? 'text-[#00d35a]' : 'text-[#ff453a]'}>
              <Check className="w-3 h-3 inline mr-0.5" />
              screen {liveScreen.checks.screen ? 'ok' : 'no'}
            </span>
            <span className={liveScreen.checks.api ? 'text-[#00d35a]' : 'text-[#ff453a]'}>
              <Check className="w-3 h-3 inline mr-0.5" />
              api {liveScreen.checks.api ? 'ok' : 'no'}
            </span>
            <span className={liveScreen.checks.chain ? 'text-[#00d35a]' : 'text-[#ff453a]'}>
              <Check className="w-3 h-3 inline mr-0.5" />
              chain {liveScreen.checks.chain ? 'ok' : 'no'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 ml-2">
          <button
            type="button"
            onClick={() => onInspectCoin(liveScreen.coinMint)}
            className="text-[rgba(235,235,245,0.75)] hover:text-white transition-colors whitespace-nowrap"
          >
            銘柄詳細
          </button>
          <a
            href={coinUrl(liveScreen.coinMint, 'solana')}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[#64d2ff] hover:underline whitespace-nowrap"
          >
            Open on FOMO
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {renderViewport(false)}

      {fullscreen && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-8">
          <div className="w-full max-w-5xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white">
                Live Screen · Chrome Browser Lane ({liveScreen.coinSymbol})
              </h3>
              <button
                type="button"
                onClick={() => setFullscreen(false)}
                className="p-2 rounded-lg bg-[#1c1c1e] text-white hover:bg-[#2c2c2e]"
                aria-label="Close fullscreen"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {renderViewport(true)}
          </div>
        </div>
      )}
    </>
  );
};
