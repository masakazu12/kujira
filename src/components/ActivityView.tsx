import React, { useState } from 'react';
import { Check, ExternalLink, Search } from 'lucide-react';
import { ActivityItem, Order } from '../types/desk';
import { coinUrl } from '../engine/links';

interface ActivityViewProps {
  activity: ActivityItem[];
  orders: Order[];
  onOpenCoin: (mint: string) => void;
  onOpenAudit: (mint: string) => void;
  onOpenOrder: (orderId: string) => void;
}

export const ActivityView: React.FC<ActivityViewProps> = ({
  activity,
  orders,
  onOpenCoin,
  onOpenAudit,
  onOpenOrder,
}) => {
  const [tab, setTab] = useState<'all' | 'trades' | 'rejected' | 'orders'>('all');
  const [query, setQuery] = useState('');

  const filteredActivity = activity.filter((item) => {
    const matchesQ =
      item.symbol.toLowerCase().includes(query.toLowerCase()) ||
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.subtitle.toLowerCase().includes(query.toLowerCase());
    if (!matchesQ) return false;
    if (tab === 'trades') return ['bought', 'sold', 'stopped', 'exited', 'copied'].includes(item.kind);
    if (tab === 'rejected') return item.kind === 'rejected' || item.kind === 'skipped';
    return true;
  });

  const filteredOrders = orders.filter(
    (o) =>
      o.symbol.toLowerCase().includes(query.toLowerCase()) ||
      o.reason.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-white">アクティビティ & 注文検証ログ</h1>
          <p className="text-xs text-[rgba(235,235,245,0.55)] mt-1">
            トレード行クリックで銘柄/注文シート、拒否行クリックでVetter 8層監査画面を開きます
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[rgba(235,235,245,0.45)] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="銘柄・理由で絞り込み..."
              className="bg-[#1c1c1e] border border-[rgba(84,84,88,0.5)] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-[rgba(235,235,245,0.4)] focus:outline-none focus:border-[#64d2ff] w-52"
            />
          </div>

          <div className="flex items-center gap-1 bg-[#1c1c1e] p-1 rounded-lg border border-[rgba(84,84,88,0.45)]">
            {([
              { id: 'all', label: 'すべて' },
              { id: 'trades', label: '約定・コピー' },
              { id: 'rejected', label: 'Vetter拒否' },
              { id: 'orders', label: `注文3検証 (${orders.length})` },
            ] as const).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`px-2.5 py-1 text-xs rounded transition-colors whitespace-nowrap ${
                  tab === t.id
                    ? 'bg-[#2c2c2e] text-white font-medium'
                    : 'text-[rgba(235,235,245,0.55)] hover:text-white'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {tab === 'orders' ? (
        <div className="bg-[#1c1c1e] rounded-xl border border-[rgba(84,84,88,0.45)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-[rgba(235,235,245,0.5)] border-b border-[rgba(84,84,88,0.4)] text-left">
                  <th className="py-3 px-5 font-medium">時刻 / ID</th>
                  <th className="py-3 px-3 font-medium">区分 / 銘柄</th>
                  <th className="py-3 px-3 font-medium">担当 / 理由</th>
                  <th className="py-3 px-3 font-medium text-right">要求額 / 手数料</th>
                  <th className="py-3 px-3 font-medium">3段階ベリファイ</th>
                  <th className="py-3 px-5 font-medium text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(84,84,88,0.3)]">
                {filteredOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-[#242427] transition-colors">
                    <td className="py-3 px-5 font-mono-num">
                      <div className="text-white">{ord.ts}</div>
                      <div className="text-[11px] text-[rgba(235,235,245,0.45)]">#{ord.id}</div>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className="font-mono-num font-semibold mr-2"
                        style={{ color: ord.side === 'buy' ? '#00d35a' : '#ff9f0a' }}
                      >
                        {ord.side.toUpperCase()}
                      </span>
                      <span className="font-semibold text-white">{ord.symbol}</span>
                    </td>
                    <td className="py-3 px-3 text-[rgba(235,235,245,0.75)]">
                      {ord.bot} · {ord.reason}
                    </td>
                    <td className="py-3 px-3 text-right font-mono-num">
                      <div className="text-white">${ord.usdAsked.toFixed(2)}</div>
                      <div className="text-[11px] text-[rgba(235,235,245,0.5)]">
                        fee ${ord.feeUsd.toFixed(2)}
                      </div>
                    </td>
                    <td className="py-3 px-3 font-mono-num text-[11px]">
                      <span className={ord.screenOk ? 'text-[#00d35a] mr-2' : 'text-[#ff453a] mr-2'}>
                        <Check className="w-3 h-3 inline" /> screen
                      </span>
                      <span className={ord.apiOk ? 'text-[#00d35a] mr-2' : 'text-[#ff453a] mr-2'}>
                        <Check className="w-3 h-3 inline" /> api
                      </span>
                      <span className={ord.chainOk === true ? 'text-[#00d35a]' : 'text-[#ff453a]'}>
                        <Check className="w-3 h-3 inline" /> chain
                      </span>
                    </td>
                    <td className="py-3 px-5 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onOpenOrder(ord.id)}
                        className="px-2.5 py-1 rounded bg-[#2c2c2e] text-white hover:bg-[#3a3a3c] text-[11px] font-medium"
                      >
                        検証シート
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-[#1c1c1e] rounded-xl border border-[rgba(84,84,88,0.45)] divide-y divide-[rgba(84,84,88,0.3)]">
          {filteredActivity.length === 0 ? (
            <div className="py-12 text-center text-xs text-[rgba(235,235,245,0.55)]">
              Nothing yet tonight · 条件に一致するアクティビティはありません
            </div>
          ) : (
            filteredActivity.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between px-5 py-3.5 hover:bg-[#242427] transition-colors gap-4"
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
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-mono-num text-[rgba(235,235,245,0.45)]">
                      {item.ts}
                    </span>
                    <span className="text-sm font-medium text-white">{item.title}</span>
                  </div>
                  <div className="text-xs font-mono-num text-[rgba(235,235,245,0.55)] mt-0.5">
                    {item.subtitle}
                  </div>
                </button>

                <div className="flex items-center gap-4 shrink-0">
                  <span
                    className="text-sm font-mono-num font-semibold"
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
                    className="inline-flex items-center gap-1 text-xs text-[rgba(235,235,245,0.55)] hover:text-[#64d2ff]"
                  >
                    Open on FOMO
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
