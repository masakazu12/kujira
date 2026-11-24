import React, { useState } from 'react';
import { ExternalLink, RotateCcw, ShieldAlert } from 'lucide-react';
import { ChangeLogEntry, DeskMode, DeskSettings } from '../types/desk';
import {
  NumericSettingMeta,
  SETTING_METAS,
  validateSettingChange,
} from '../engine/settingsConfig';
import { profileUrl, SIGNUP_URL } from '../engine/links';

interface SettingsViewProps {
  mode: DeskMode;
  settings: DeskSettings;
  changeLog: ChangeLogEntry[];
  onSaveSetting: (key: keyof DeskSettings, value: number) => string | null;
  onUpdateHandle: (handle: string) => void;
  onSwitchMode: (mode: DeskMode) => void;
}

const GROUPS: { id: NumericSettingMeta['group']; label: string; color: string }[] = [
  { id: 'watcher', label: '1. Watcher (クジラ監視)', color: '#64d2ff' },
  { id: 'vetter', label: '2. Vetter (8層監査・スコア)', color: '#ffd60a' },
  { id: 'social', label: 'X Social (ソーシャル係数)', color: '#64d2ff' },
  { id: 'sizer', label: '3. Sizer (資金サイズ)', color: '#bf5af2' },
  { id: 'executor', label: '4. Executor (押し目・利確)', color: '#00d35a' },
  { id: 'guard', label: '5. Guard (損切り・防衛)', color: '#ff6b9a' },
  { id: 'desk', label: 'Desk (全般・手数料)', color: '#ffffff' },
];

export const SettingsView: React.FC<SettingsViewProps> = ({
  mode,
  settings,
  changeLog,
  onSaveSetting,
  onUpdateHandle,
  onSwitchMode,
}) => {
  const [activeGroup, setActiveGroup] = useState<NumericSettingMeta['group']>('sizer');
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [liveInput, setLiveInput] = useState('');
  const [showLiveGate, setShowLiveGate] = useState(false);
  const [copiedInvite, setCopiedInvite] = useState(false);

  const groupMetas = SETTING_METAS.filter((m) => m.group === activeGroup);

  const getDraftNum = (meta: NumericSettingMeta): number => {
    const raw = drafts[meta.key];
    if (raw !== undefined) return parseFloat(raw);
    return settings[meta.key] as number;
  };

  const handleFieldChange = (meta: NumericSettingMeta, rawVal: string) => {
    setDrafts((prev) => ({ ...prev, [meta.key]: rawVal }));
    const num = parseFloat(rawVal);
    const res = validateSettingChange(settings, meta.key, num);
    setErrors((prev) => {
      const next = { ...prev };
      if (!res.valid && res.error) next[meta.key] = res.error;
      else delete next[meta.key];
      return next;
    });
  };

  const handleSave = (meta: NumericSettingMeta) => {
    const num = getDraftNum(meta);
    const err = onSaveSetting(meta.key, num);
    if (err) {
      setErrors((prev) => ({ ...prev, [meta.key]: err }));
    } else {
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[meta.key];
        return next;
      });
      setErrors((prev) => {
        const next = { ...prev };
        delete next[meta.key];
        return next;
      });
    }
  };

  const copyInvite = () => {
    navigator.clipboard?.writeText(SIGNUP_URL);
    setCopiedInvite(true);
    window.setTimeout(() => setCopiedInvite(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Account & Mode Top Bar (Step 10 Account tab) */}
      <section className="bg-[#1c1c1e] rounded-xl p-5 border border-[rgba(84,84,88,0.45)] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold text-white">アカウント & しきい値設定 (STEP 12)</h1>
            <span
              className="text-xs font-mono-num font-semibold"
              style={{ color: mode === 'PAPER' ? '#ff9f0a' : '#00d35a' }}
            >
              {mode} MODE
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-[rgba(235,235,245,0.6)] flex-wrap">
            <span>
              FOMO Profile:{' '}
              <a
                href={profileUrl(settings.fomo_handle)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#64d2ff] hover:underline font-mono-num inline-flex items-center gap-1"
              >
                {settings.fomo_handle}
                <ExternalLink className="w-3 h-3" />
              </a>
            </span>
            <span>·</span>
            <button
              type="button"
              onClick={copyInvite}
              className="text-white hover:text-[#64d2ff] transition-colors"
            >
              {copiedInvite ? 'Link copied!' : 'Invite a friend (SIGNUP_URL)'}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <input
            type="text"
            value={settings.fomo_handle}
            onChange={(e) => onUpdateHandle(e.target.value)}
            aria-label="FOMO username"
            className="bg-[#141416] border border-[rgba(84,84,88,0.5)] rounded-md px-3 py-1.5 text-xs font-mono-num text-white w-40 focus:outline-none focus:border-[#64d2ff]"
          />
          {mode === 'PAPER' ? (
            <button
              type="button"
              onClick={() => setShowLiveGate(true)}
              className="px-3.5 py-1.5 rounded-md text-xs font-semibold bg-[#ff9f0a] text-black hover:bg-[#ffb238] transition-colors whitespace-nowrap"
            >
              LIVE へ切替...
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onSwitchMode('PAPER')}
              className="px-3.5 py-1.5 rounded-md text-xs font-semibold bg-[#2c2c2e] text-white hover:bg-[#3a3a3c] transition-colors whitespace-nowrap"
            >
              PAPER に戻す
            </button>
          )}
        </div>
      </section>

      {/* LIVE Confirmation Gate (Step 10 & 13: LIVE needs typing LIVE) */}
      {showLiveGate && (
        <div className="bg-[#1c1c1e] rounded-xl p-5 border border-[#ff453a]/60 space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#ff453a]">
            <ShieldAlert className="w-4 h-4" />
            LIVE モード切替ゲート（実資金執行）
          </div>
          <p className="text-xs text-[rgba(235,235,245,0.75)]">
            LIVE では Chrome 上の Buy / Sell ボタンが実際に押下されます。初回 1〜3 夜は max_ticket_usd = $50 以下を推奨します。
            続行するには <span className="font-mono-num text-white font-semibold">LIVE</span> と入力してください。
          </p>
          <div className="flex items-center gap-2.5">
            <input
              type="text"
              value={liveInput}
              onChange={(e) => setLiveInput(e.target.value)}
              placeholder="LIVE と入力"
              className="bg-[#141416] border border-[rgba(84,84,88,0.55)] rounded-md px-3 py-1.5 text-xs font-mono-num text-white w-44 focus:outline-none focus:border-[#ff453a]"
            />
            <button
              type="button"
              disabled={liveInput.trim() !== 'LIVE'}
              onClick={() => {
                onSwitchMode('LIVE');
                setShowLiveGate(false);
                setLiveInput('');
              }}
              className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                liveInput.trim() === 'LIVE'
                  ? 'bg-[#ff453a] text-white hover:bg-[#ff5e54]'
                  : 'bg-[#2c2c2e] text-[rgba(235,235,245,0.35)] cursor-not-allowed'
              }`}
            >
              LIVE を有効化
            </button>
            <button
              type="button"
              onClick={() => {
                setShowLiveGate(false);
                setLiveInput('');
              }}
              className="px-3 py-1.5 text-xs text-[rgba(235,235,245,0.6)] hover:text-white"
            >
              キャンセル
            </button>
          </div>
        </div>
      )}

      {/* Bot Group Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {GROUPS.map((g) => (
          <button
            key={g.id}
            type="button"
            onClick={() => setActiveGroup(g.id)}
            className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 border ${
              activeGroup === g.id
                ? 'bg-[#2c2c2e] text-white border-[rgba(235,235,245,0.2)]'
                : 'bg-[#1c1c1e] text-[rgba(235,235,245,0.6)] border-[rgba(84,84,88,0.4)] hover:text-white'
            }`}
          >
            {g.label}
          </button>
        ))}
      </div>

      {/* Settings Sliders + Exact Fields (Step 10 Settings UI) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {groupMetas.map((meta) => {
          const savedVal = settings[meta.key] as number;
          const rawStr = drafts[meta.key] ?? String(savedVal);
          const numVal = parseFloat(rawStr);
          const isDirty = drafts[meta.key] !== undefined && numVal !== savedVal;
          const err = errors[meta.key];

          return (
            <div
              key={meta.key}
              className={`bg-[#1c1c1e] rounded-xl p-4 border transition-colors ${
                err ? 'border-[#ff453a]' : 'border-[rgba(84,84,88,0.45)]'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-medium text-white">{meta.label}</div>
                  <div className="text-[11px] font-mono-num text-[rgba(235,235,245,0.5)] mt-0.5">
                    {meta.key} · {meta.description}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    handleFieldChange(meta, String(meta.defaultValue));
                  }}
                  className="inline-flex items-center gap-1 text-[11px] font-mono-num text-[rgba(235,235,245,0.5)] hover:text-white shrink-0"
                  title="デフォルト値に戻す"
                >
                  <RotateCcw className="w-3 h-3" />
                  default {meta.defaultValue}
                </button>
              </div>

              <div className="flex items-center gap-3 mt-4">
                <input
                  type="range"
                  min={meta.min}
                  max={meta.max}
                  step={meta.step}
                  value={Number.isNaN(numVal) ? savedVal : Math.min(meta.max, Math.max(meta.min, numVal))}
                  onChange={(e) => handleFieldChange(meta, e.target.value)}
                  className="desk-slider flex-1"
                  aria-label={meta.label}
                />
                <div className="flex items-center gap-1 shrink-0">
                  <input
                    type="number"
                    step={meta.step}
                    value={rawStr}
                    onChange={(e) => handleFieldChange(meta, e.target.value)}
                    className={`w-24 bg-[#141416] border rounded-md px-2.5 py-1 text-right text-xs font-mono-num text-white focus:outline-none ${
                      err
                        ? 'border-[#ff453a] text-[#ff453a]'
                        : 'border-[rgba(84,84,88,0.55)] focus:border-[#64d2ff]'
                    }`}
                  />
                  {meta.unit && (
                    <span className="text-xs font-mono-num text-[rgba(235,235,245,0.55)] w-6">
                      {meta.unit}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between mt-2.5">
                <span className="text-[11px] font-mono-num text-[rgba(235,235,245,0.45)]">
                  range: {meta.min} – {meta.max}
                </span>
                <div className="flex items-center gap-2">
                  {err ? (
                    <span className="text-[11px] font-mono-num text-[#ff453a]">{err}</span>
                  ) : isDirty ? (
                    <button
                      type="button"
                      onClick={() => handleSave(meta)}
                      className="px-3 py-1 rounded text-xs font-semibold bg-[#00d35a] text-black hover:bg-[#19df6c] transition-colors"
                    >
                      Save
                    </button>
                  ) : (
                    <span className="text-[11px] font-mono-num text-[rgba(235,235,245,0.4)]">
                      saved: {savedVal}
                      {meta.unit || ''}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Change Log Table (Step 12: every accepted change goes to change_log) */}
      <section className="bg-[#1c1c1e] rounded-xl border border-[rgba(84,84,88,0.45)] overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[rgba(84,84,88,0.4)] flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">変更履歴 (change_log)</h2>
          <span className="text-xs font-mono-num text-[rgba(235,235,245,0.5)]">
            オープン中のポジションには次の注文から適用 · ストップは緩めない
          </span>
        </div>
        <div className="divide-y divide-[rgba(84,84,88,0.3)] text-xs font-mono-num">
          {changeLog.map((entry) => (
            <div key={entry.id} className="flex items-center justify-between px-5 py-2.5 gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-[rgba(235,235,245,0.45)]">{entry.ts}</span>
                <span className="text-[#64d2ff] font-medium">{entry.key}</span>
                <span className="text-[rgba(235,235,245,0.65)]">
                  {entry.oldVal} → <strong className="text-white">{entry.newVal}</strong>
                </span>
              </div>
              <span className="text-[rgba(235,235,245,0.5)] shrink-0">{entry.who}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
