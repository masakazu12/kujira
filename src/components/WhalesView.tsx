import React, { useState } from 'react';
import { ExternalLink, Search, Volume2, VolumeX } from 'lucide-react';
import { Whale } from '../types/desk';
import { profileUrl } from '../engine/links';

interface WhalesViewProps {
  whales: Whale[];
  onToggleMute: (userId: string) => void;
  onSelectWhale: (whale: Whale) => void;
}

export const WhalesView: React.FC<WhalesViewProps> = ({
  whales,
  onToggleMute,
  onSelectWhale,
}) => {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'muted'>('all');

  const filtered = whales.filter((w) => {
    const matchText =
      w.handle.toLowerCase().includes(query.toLowerCase()) ||
      w.address.toLowerCase().includes(query.toLowerCase());
    if (!matchText) return false;
    if (filter === 'active') return !w.muted;
    if (filter === 'muted') return w.muted;
    return true;
  });

  const activeCount = whales.filter((w) => !w.muted).length;
  const avgChainMatch =
    whales.length > 0
      ? Math.round(whales.reduce((acc, w) => acc + w.chainMatchRate, 0) / whales.length)
      : 0;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-white">今夜の監視クジラ一覧 (Whales)</h1>
          <p className="text-xs text-[rgba(235,235,245,0.55)] mt-1">
            条件: 2/3期間ランクイン · 勝率55%+ · 20取引+ · 中央値保有15分+ · 単一銘柄依存40%以下 · WHALE PROOF平均 {avgChainMatch}%
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[rgba(235,235,245,0.45)] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="@handle またはアドレス検索..."
              className="bg-[#1c1c1e] border border-[rgba(84,84,88,0.5)] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-[rgba(235,235,245,0.4)] focus:outline-none focus:border-[#64d2ff] w-56"
            />
          </div>
          <div className="flex items-center gap-1 bg-[#1c1c1e] p-1 rounded-lg border border-[rgba(84,84,88,0.45)]">
            {([
              { id: 'all', label: `全て (${whales.length})` },
              { id: 'active', label: `監視中 (${activeCount})` },
              { id: 'muted', label: `ミュート (${whales.length - activeCount})` },
            ] as const).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id)}
                className={`px-2.5 py-1 text-xs rounded transition-colors whitespace-nowrap ${
                  filter === tab.id
                    ? 'bg-[#2c2c2e] text-white font-medium'
                    : 'text-[rgba(235,235,245,0.55)] hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-[#1c1c1e] rounded-xl border border-[rgba(84,84,88,0.45)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-[rgba(235,235,245,0.5)] border-b border-[rgba(84,84,88,0.4)] text-left">
                <th className="py-3 px-5 font-medium">順位</th>
                <th className="py-3 px-3 font-medium">クジラ (@handle)</th>
                <th className="py-3 px-3 font-medium text-right">7d PnL</th>
                <th className="py-3 px-3 font-medium text-right">勝率 / 7d回数</th>
                <th className="py-3 px-3 font-medium text-right">中央値保有</th>
                <th className="py-3 px-3 font-medium text-right">オンチェーン一致率</th>
                <th className="py-3 px-3 font-medium">最終約定</th>
                <th className="py-3 px-3 font-medium text-right">今夜の自分PnL</th>
                <th className="py-3 px-5 font-medium text-right">Watcher監視</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(84,84,88,0.3)]">
              {filtered.map((w) => (
                <tr key={w.userId} className="hover:bg-[#242427] transition-colors">
                  <td className="py-3.5 px-5 font-mono-num text-[rgba(235,235,245,0.65)]">
                    #{w.rank}
                  </td>
                  <td className="py-3.5 px-3">
                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => onSelectWhale(w)}
                        className="font-semibold text-white hover:text-[#64d2ff] text-left"
                      >
                        {w.handle}
                      </button>
                      <a
                        href={profileUrl(w.handle)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[rgba(235,235,245,0.4)] hover:text-[#64d2ff]"
                        aria-label={`Open ${w.handle} on FOMO`}
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <div className="text-[11px] font-mono-num text-[rgba(235,235,245,0.45)]">
                      {w.address.slice(0, 8)}...{w.address.slice(-4)} · top coin {w.topCoinShare}%
                    </div>
                  </td>
                  <td className="py-3.5 px-3 text-right font-mono-num text-[#00d35a] font-semibold">
                    +${w.pnl7d.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-3 text-right font-mono-num text-white">
                    {w.winRate}% · {w.trades7d}
                  </td>
                  <td className="py-3.5 px-3 text-right font-mono-num text-[rgba(235,235,245,0.75)]">
                    {w.medianHoldMin}m
                  </td>
                  <td className="py-3.5 px-3 text-right font-mono-num text-[#00d35a]">
                    {w.chainMatchRate}%
                  </td>
                  <td className="py-3.5 px-3 font-mono-num text-[rgba(235,235,245,0.75)]">
                    <button
                      type="button"
                      onClick={() => onSelectWhale(w)}
                      className="hover:text-white"
                    >
                      {w.lastFillText}
                    </button>
                  </td>
                  <td
                    className="py-3.5 px-3 text-right font-mono-num font-semibold"
                    style={{ color: w.myPnlTonight >= 0 ? '#00d35a' : '#ff453a' }}
                  >
                    {w.myPnlTonight >= 0 ? '+' : '-'}${Math.abs(w.myPnlTonight).toFixed(2)}
                  </td>
                  <td className="py-3.5 px-5 text-right">
                    <button
                      type="button"
                      onClick={() => onToggleMute(w.userId)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                        w.muted
                          ? 'bg-[#ff9f0a]/15 text-[#ff9f0a]'
                          : 'bg-[#2c2c2e] text-white hover:bg-[#3a3a3c]'
                      }`}
                    >
                      {w.muted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                      {w.muted ? 'ミュート中' : '監視中'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
