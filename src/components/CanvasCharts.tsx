import React, { useEffect, useRef, useState } from 'react';
import { BalanceMark, BalancePoint, Candle, ChartRange } from '../types/desk';

interface BalanceLineChartProps {
  points: BalancePoint[];
  marks: BalanceMark[];
  startValue: number;
  range: ChartRange;
  onRangeChange: (r: ChartRange) => void;
}

const RANGES: ChartRange[] = ['LIVE', '1H', '4H', '1D', '1W', 'ALL'];

export const BalanceLineChart: React.FC<BalanceLineChartProps> = ({
  points,
  marks,
  startValue,
  range,
  onRangeChange,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || points.length < 2) return;

    const dpr = window.devicePixelRatio || 1;
    const width = container.clientWidth;
    const height = 220;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    const padTop = 36;
    const padBottom = 26;
    const padLeft = 10;
    const padRight = 10;
    const chartW = width - padLeft - padRight;
    const chartH = height - padTop - padBottom;

    const values = points.map((p) => p.value);
    const minVal = Math.min(...values, startValue) * 0.992;
    const maxVal = Math.max(...values, startValue) * 1.008;
    const span = Math.max(0.01, maxVal - minVal);

    const xOf = (i: number) => padLeft + (i / (points.length - 1)) * chartW;
    const yOf = (v: number) => padTop + chartH - ((v - minVal) / span) * chartH;

    // Dashed start line
    const startY = yOf(startValue);
    ctx.save();
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = 'rgba(235,235,245,0.22)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padLeft, startY);
    ctx.lineTo(width - padRight, startY);
    ctx.stroke();
    ctx.restore();

    const lastVal = points[points.length - 1].value;
    const lineColor = lastVal >= startValue ? '#00d35a' : '#ff453a';

    // Gradient under the line (explicitly specified in Step 10 for the chart only)
    const grad = ctx.createLinearGradient(0, padTop, 0, height - padBottom);
    if (lastVal >= startValue) {
      grad.addColorStop(0, 'rgba(0, 211, 90, 0.22)');
      grad.addColorStop(1, 'rgba(0, 211, 90, 0.0)');
    } else {
      grad.addColorStop(0, 'rgba(255, 69, 58, 0.22)');
      grad.addColorStop(1, 'rgba(255, 69, 58, 0.0)');
    }

    ctx.beginPath();
    points.forEach((p, idx) => {
      const x = xOf(idx);
      const y = yOf(p.value);
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.lineTo(xOf(points.length - 1), height - padBottom);
    ctx.lineTo(xOf(0), height - padBottom);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Main line
    ctx.beginPath();
    points.forEach((p, idx) => {
      const x = xOf(idx);
      const y = yOf(p.value);
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.stroke();

    // Event marks stacked cleanly above line without overlap
    const placedBoxes: { x1: number; x2: number; row: number }[] = [];
    ctx.font = '500 11px "JetBrains Mono", monospace';

    marks.forEach((m) => {
      if (m.index < 0 || m.index >= points.length) return;
      const cx = xOf(m.index);
      const cy = yOf(points[m.index].value);
      const color =
        m.tone === 'blue' ? '#0a84ff' : m.tone === 'green' ? '#00d35a' : '#ff453a';

      // Dot on line
      ctx.beginPath();
      ctx.arc(cx, cy, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      const textW = ctx.measureText(m.label).width + 10;
      let tx = Math.max(padLeft, Math.min(width - padRight - textW, cx - textW / 2));
      let row = 0;
      while (
        placedBoxes.some(
          (b) => b.row === row && !(tx + textW + 6 < b.x1 || tx > b.x2 + 6)
        )
      ) {
        row++;
      }
      placedBoxes.push({ x1: tx, x2: tx + textW, row });

      const labelY = Math.max(14, cy - 14 - row * 16);
      ctx.fillStyle = color;
      ctx.fillText(m.label, tx + 4, labelY);
    });

    // Hover crosshair
    if (hoverIdx !== null && points[hoverIdx]) {
      const hx = xOf(hoverIdx);
      const hy = yOf(points[hoverIdx].value);
      ctx.save();
      ctx.strokeStyle = 'rgba(235,235,245,0.28)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(hx, padTop);
      ctx.lineTo(hx, height - padBottom);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(hx, hy, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.restore();
    }

    // X-axis labels (start, mid, end)
    ctx.fillStyle = 'rgba(235,235,245,0.42)';
    ctx.font = '400 11px "JetBrains Mono", monospace';
    const labelIndices = [0, Math.floor(points.length / 2), points.length - 1];
    labelIndices.forEach((idx) => {
      const pt = points[idx];
      if (!pt) return;
      const x = xOf(idx);
      const align = idx === 0 ? 'left' : idx === points.length - 1 ? 'right' : 'center';
      ctx.textAlign = align;
      ctx.fillText(pt.label, x, height - 6);
    });
    ctx.textAlign = 'left';
  }, [points, marks, startValue, hoverIdx]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, x / rect.width));
    const idx = Math.round(ratio * (points.length - 1));
    setHoverIdx(idx);
  };

  const activePoint = hoverIdx !== null ? points[hoverIdx] : null;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs text-[rgba(235,235,245,0.6)] font-mono-num h-4">
          {activePoint ? (
            <span>
              {activePoint.label} · ${activePoint.value.toFixed(2)} (
              {activePoint.value >= startValue ? '+' : ''}
              {(((activePoint.value - startValue) / startValue) * 100).toFixed(2)}%)
            </span>
          ) : (
            <span>開始基準線 ${startValue.toFixed(2)} · リアルタイム推移</span>
          )}
        </div>
        <div
          className="flex items-center gap-1"
          role="tablist"
          aria-label="Chart range"
        >
          {RANGES.map((r) => (
            <button
              key={r}
              type="button"
              role="tab"
              aria-selected={range === r}
              onClick={() => onRangeChange(r)}
              className={`px-2.5 py-1 text-xs font-mono-num rounded transition-colors whitespace-nowrap shrink-0 ${
                range === r
                  ? 'bg-[#2c2c2e] text-white font-medium'
                  : 'text-[rgba(235,235,245,0.5)] hover:text-white'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div ref={containerRef} className="w-full relative">
        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoverIdx(null)}
          className="w-full block cursor-crosshair"
          aria-label={`Balance chart, start $${startValue.toFixed(2)}, current $${points[points.length - 1]?.value.toFixed(2) ?? '0.00'}`}
        />
      </div>
    </div>
  );
};

interface CoinCandleChartProps {
  candles: Candle[];
  entryPrice?: number;
  stopPrice?: number;
}

export const CoinCandleChart: React.FC<CoinCandleChartProps> = ({
  candles,
  entryPrice,
  stopPrice,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || candles.length === 0) return;

    const dpr = window.devicePixelRatio || 1;
    const width = container.clientWidth;
    const height = 210;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    const padTop = 18;
    const padBottom = 22;
    const padLeft = 8;
    const padRight = 64;
    const chartW = width - padLeft - padRight;
    const chartH = height - padTop - padBottom;

    const lows = candles.map((c) => c.low);
    const highs = candles.map((c) => c.high);
    if (stopPrice) lows.push(stopPrice);
    if (entryPrice) highs.push(entryPrice);

    const minP = Math.min(...lows) * 0.97;
    const maxP = Math.max(...highs) * 1.03;
    const span = Math.max(1e-9, maxP - minP);

    const yOf = (p: number) => padTop + chartH - ((p - minP) / span) * chartH;
    const step = chartW / candles.length;
    const bodyW = Math.max(3, Math.min(10, step * 0.62));

    // Horizontal subtle grid lines
    ctx.strokeStyle = 'rgba(84,84,88,0.3)';
    ctx.lineWidth = 1;
    ctx.font = '400 10px "JetBrains Mono", monospace';
    ctx.fillStyle = 'rgba(235,235,245,0.45)';
    for (let i = 0; i <= 3; i++) {
      const p = minP + (span * i) / 3;
      const y = yOf(p);
      ctx.beginPath();
      ctx.moveTo(padLeft, y);
      ctx.lineTo(width - padRight, y);
      ctx.stroke();
      ctx.fillText(`$${p.toFixed(6)}`, width - padRight + 6, y + 3);
    }

    // Orange dashed exit/stop line (Step 10)
    if (stopPrice) {
      const sy = yOf(stopPrice);
      ctx.save();
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = '#ff9f0a';
      ctx.lineWidth = 1.25;
      ctx.beginPath();
      ctx.moveTo(padLeft, sy);
      ctx.lineTo(width - padRight, sy);
      ctx.stroke();
      ctx.fillStyle = '#ff9f0a';
      ctx.fillText('STOP', padLeft + 4, sy - 4);
      ctx.restore();
    }

    // Entry line
    if (entryPrice) {
      const ey = yOf(entryPrice);
      ctx.save();
      ctx.setLineDash([2, 3]);
      ctx.strokeStyle = 'rgba(100,210,255,0.6)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(padLeft, ey);
      ctx.lineTo(width - padRight, ey);
      ctx.stroke();
      ctx.fillStyle = '#64d2ff';
      ctx.fillText('ENTRY', padLeft + 4, ey - 4);
      ctx.restore();
    }

    // Candles
    candles.forEach((c, i) => {
      const cx = padLeft + i * step + step / 2;
      const isUp = c.close >= c.open;
      const color = isUp ? '#00d35a' : '#ff453a';

      ctx.strokeStyle = color;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(cx, yOf(c.high));
      ctx.lineTo(cx, yOf(c.low));
      ctx.stroke();

      const top = yOf(Math.max(c.open, c.close));
      const bot = yOf(Math.min(c.open, c.close));
      ctx.fillStyle = color;
      ctx.fillRect(cx - bodyW / 2, top, bodyW, Math.max(1.5, bot - top));

      // Whale entry dot
      if (c.whaleEntry) {
        const wy = yOf(c.low) + 9;
        ctx.beginPath();
        ctx.arc(cx, wy, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = '#64d2ff';
        ctx.fill();
        ctx.fillStyle = '#64d2ff';
        ctx.font = '500 10px "JetBrains Mono", monospace';
        ctx.fillText(c.whaleEntry, cx - 14, wy + 12);
      }
    });
  }, [candles, entryPrice, stopPrice]);

  return (
    <div ref={containerRef} className="w-full">
      <canvas ref={canvasRef} className="w-full block" aria-label="1-minute candlestick chart" />
    </div>
  );
};
