import { DeskSettings } from '../types/desk';

export interface NumericSettingMeta {
  key: keyof DeskSettings;
  group: 'watcher' | 'vetter' | 'social' | 'sizer' | 'executor' | 'guard' | 'desk';
  label: string;
  unit?: string;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  description: string;
}

export const DEFAULT_SETTINGS: DeskSettings = {
  // Watcher
  whales_top_n: 25,
  min_windows: 2,
  min_win_rate: 55,
  min_trades_7d: 20,
  min_median_hold_min: 15,
  max_top_coin_share: 40,
  poll_s: 8,
  max_lag_s: 90,
  min_whale_buy_usd: 50,
  ignore_after_mcap_usd: 5000000,
  // Vetter
  max_dev_pct: 5,
  max_top10_pct: 25,
  min_lp_locked_pct: 99,
  max_bundled: 5,
  max_delegated_accounts: 10,
  retries: 3,
  min_score: 70,
  alive_volume_h1: 25000,
  max_chase_pct: 150,
  flow_sell_ratio: 1.5,
  cluster_bonus: 15,
  // Social
  social_weight: 0.5,
  social_max_per_h: 20,
  social_timeout_s: 120,
  shill_cut: 0.5,
  // Sizer
  risk_per_trade_pct: 3,
  stop_pct: 25,
  one_whale_size: 33,
  two_whale_size: 66,
  full_whales: 3,
  max_pool_pct: 2,
  min_ticket_usd: 2,
  max_ticket_usd: 50,
  max_trades_night: 30,
  max_open: 5,
  // Executor
  dip_pct: 12,
  dip_window_min: 10,
  dip_wait_min: 20,
  crash_pct: 35,
  tp_x: 2.0,
  tp_sell_pct: 50,
  trail_pct: 40,
  recheck_liq_drop_pct: 20,
  recheck_price_up_pct: 15,
  quote_timeout_s: 10,
  verify_timeout_s: 30,
  // Guard
  guard_poll_s: 5,
  timeout_h: 3,
  timeout_min_gain_pct: 5,
  whale_exit_sell_pct: 100,
  whale_exit_min_whales: 1,
  night_loss_stop_pct: 30,
  // Desk
  paper_start_cash: 100,
  fee_pct: 0.45,
  confirm_expiry_s: 60,
  prices_keep_days: 7,
  frames_keep: 300,
  logs_keep_days: 30,
  backups_keep: 14,
  fomo_handle: '@quickscout_jp',
  withdraw_address: '9fQx7rL2vA4mN8pC3kW6eT2a',
  tz: 'Asia/Tokyo',
  night_start: '22:00',
  lock_time: '06:30',
  report_time: '08:00',
  push_rejects: false,
};

export const SETTING_METAS: NumericSettingMeta[] = [
  // Watcher
  { key: 'whales_top_n', group: 'watcher', label: '今夜の監視クジラ上限', min: 5, max: 50, step: 1, defaultValue: 25, description: '7d PnL × 勝率で上位N人を選出' },
  { key: 'min_windows', group: 'watcher', label: '必要リーダーボード期間数', min: 1, max: 3, step: 1, defaultValue: 2, description: '24h/7d/30dのうち何期間にランクイン必要か' },
  { key: 'min_win_rate', group: 'watcher', label: '最低勝率', unit: '%', min: 40, max: 90, step: 1, defaultValue: 55, description: 'クジラ選定の勝率下限' },
  { key: 'min_trades_7d', group: 'watcher', label: '7日間最低トレード数', min: 5, max: 200, step: 1, defaultValue: 20, description: 'まぐれ当たりを除外する取引数下限' },
  { key: 'min_median_hold_min', group: 'watcher', label: '中央値保有時間', unit: '分', min: 1, max: 240, step: 1, defaultValue: 15, description: '1秒フリッパー・バンドラーを除外' },
  { key: 'max_top_coin_share', group: 'watcher', label: '単一銘柄PnL依存上限', unit: '%', min: 10, max: 100, step: 1, defaultValue: 40, description: '1銘柄に依存する偽トレーダーを除外' },
  { key: 'poll_s', group: 'watcher', label: '巡回ポーリング間隔', unit: '秒', min: 4, max: 60, step: 1, defaultValue: 8, description: 'FOMO APIスワップ監視周期' },
  { key: 'max_lag_s', group: 'watcher', label: '最大許容遅延 (ラグ)', unit: '秒', min: 10, max: 600, step: 5, defaultValue: 90, description: 'これを超えた古い約定は破棄' },
  { key: 'min_whale_buy_usd', group: 'watcher', label: '最低クジラ購入額', unit: '$', min: 10, max: 10000, step: 10, defaultValue: 50, description: '少額テスト買いを無視' },
  { key: 'ignore_after_mcap_usd', group: 'watcher', label: '時価総額上限', unit: '$', min: 100000, max: 100000000, step: 100000, defaultValue: 5000000, description: '上限超えの大型銘柄は対象外' },

  // Vetter
  { key: 'max_dev_pct', group: 'vetter', label: '開発者保有率上限', unit: '%', min: 0, max: 20, step: 0.5, defaultValue: 5, description: 'Layer 3: Devウォレット閾値' },
  { key: 'max_top10_pct', group: 'vetter', label: '上位10保有率上限', unit: '%', min: 5, max: 60, step: 1, defaultValue: 25, description: 'Layer 4: プール除外の上位10集中度' },
  { key: 'min_lp_locked_pct', group: 'vetter', label: 'LP焼却/ロック下限', unit: '%', min: 80, max: 100, step: 1, defaultValue: 99, description: 'Layer 5: 流動性安全性基準' },
  { key: 'max_bundled', group: 'vetter', label: 'バンドル比率上限', unit: '%', min: 1, max: 30, step: 1, defaultValue: 5, description: 'Layer 7: インサイダー資金グループ上限' },
  { key: 'max_delegated_accounts', group: 'vetter', label: '委任アカウント上限', min: 1, max: 100, step: 1, defaultValue: 10, description: 'Layer 8: 委任権限集中リスク上限' },
  { key: 'min_score', group: 'vetter', label: '通過最低スコア', unit: 'pt', min: 50, max: 95, step: 1, defaultValue: 70, description: '8層通過後にこの点数以上でSizerへ' },
  { key: 'alive_volume_h1', group: 'vetter', label: '1時間最低出来高', unit: '$', min: 1000, max: 1000000, step: 1000, defaultValue: 25000, description: '板の活性判定 (alive)' },
  { key: 'max_chase_pct', group: 'vetter', label: '1時間高騰ペナルティ基準', unit: '%', min: 50, max: 1000, step: 10, defaultValue: 150, description: '高値掴み抑制 (chase)' },
  { key: 'flow_sell_ratio', group: 'vetter', label: '5分売り買い比率閾値', unit: 'x', min: 1, max: 5, step: 0.1, defaultValue: 1.5, description: '5分間の売り優勢判定' },
  { key: 'cluster_bonus', group: 'vetter', label: '3クジラ同時ボーナス', unit: 'pt', min: 0, max: 30, step: 1, defaultValue: 15, description: '3人以上が30分以内に購入時の加点' },

  // Social
  { key: 'social_weight', group: 'social', label: 'Xソーシャル重み', min: 0, max: 2, step: 0.1, defaultValue: 0.5, description: '5.5満点中のXスコア比重 (0でOFF)' },
  { key: 'social_max_per_h', group: 'social', label: '1時間最大調査数', min: 0, max: 60, step: 1, defaultValue: 20, description: 'ソーシャルルーチン上限' },
  { key: 'social_timeout_s', group: 'social', label: '調査タイムアウト', unit: '秒', min: 30, max: 600, step: 10, defaultValue: 120, description: '超過時はsocial=nullで購入を待たない' },
  { key: 'shill_cut', group: 'social', label: 'シリング判定閾値', min: 0.1, max: 1, step: 0.05, defaultValue: 0.5, description: '組織的煽り検知でサイズ半減' },

  // Sizer
  { key: 'risk_per_trade_pct', group: 'sizer', label: '1取引あたりリスク率', unit: '%', min: 0.5, max: 10, step: 0.5, defaultValue: 3, description: 'ストップ到達時の資金減少上限' },
  { key: 'stop_pct', group: 'sizer', label: '損切りライン (Guard連動)', unit: '%', min: 5, max: 50, step: 1, defaultValue: 25, description: 'Sizer・Guard共通設定（既存建玉は緩めない）' },
  { key: 'one_whale_size', group: 'sizer', label: '1クジラ時サイズ倍率', unit: '%', min: 10, max: 100, step: 1, defaultValue: 33, description: '単独クジラ購入時の縮小率' },
  { key: 'two_whale_size', group: 'sizer', label: '2クジラ時サイズ倍率', unit: '%', min: 10, max: 100, step: 1, defaultValue: 66, description: '2クジラ購入時の縮小率' },
  { key: 'full_whales', group: 'sizer', label: 'フルサイズ必要クジラ数', min: 1, max: 10, step: 1, defaultValue: 3, description: 'この人数以上で100%サイズ適用' },
  { key: 'max_pool_pct', group: 'sizer', label: '流動性プール上限比率', unit: '%', min: 0.5, max: 10, step: 0.5, defaultValue: 2, description: '薄い板でのスリッページ防止' },
  { key: 'min_ticket_usd', group: 'sizer', label: '最小注文額', unit: '$', min: 2, max: 100, step: 1, defaultValue: 2, description: 'FOMO最小取引額 ($2)' },
  { key: 'max_ticket_usd', group: 'sizer', label: '最大注文額キャップ', unit: '$', min: 2, max: 5000, step: 1, defaultValue: 50, description: 'コード強制の上限 (LIVE 1-3夜は$50推奨)' },
  { key: 'max_trades_night', group: 'sizer', label: '1晩の最大トレード数', min: 1, max: 200, step: 1, defaultValue: 30, description: '過売買防止キャップ' },
  { key: 'max_open', group: 'sizer', label: '同時保有ポジション上限', min: 1, max: 20, step: 1, defaultValue: 5, description: '上限時は desk full でスキップ' },

  // Executor
  { key: 'dip_pct', group: 'executor', label: '押し目待機ディップ率', unit: '%', min: 0, max: 40, step: 1, defaultValue: 12, description: '直近10分高値からこの%下落でエントリー' },
  { key: 'dip_window_min', group: 'executor', label: '高値計測ウィンドウ', unit: '分', min: 1, max: 60, step: 1, defaultValue: 10, description: 'high10算出期間' },
  { key: 'dip_wait_min', group: 'executor', label: '押し目最大待機時間', unit: '分', min: 0, max: 120, step: 1, defaultValue: 20, description: '超過時は no dip で見送り' },
  { key: 'crash_pct', group: 'executor', label: '暴落スキップ閾値', unit: '%', min: 10, max: 80, step: 1, defaultValue: 35, description: 'dip_pct超かつこれ超えの下落は暴落と判断' },
  { key: 'tp_x', group: 'executor', label: '利確倍率 (TP1)', unit: 'x', min: 1.2, max: 20, step: 0.1, defaultValue: 2.0, description: '到達時に一部利確しトレール開始' },
  { key: 'tp_sell_pct', group: 'executor', label: '利確売却比率', unit: '%', min: 10, max: 100, step: 5, defaultValue: 50, description: 'TP1で売却するポジション割合' },
  { key: 'trail_pct', group: 'executor', label: 'トレーリング幅', unit: '%', min: 5, max: 80, step: 1, defaultValue: 40, description: 'TP1後にピークからこの%下落で全決済' },
  { key: 'recheck_liq_drop_pct', group: 'executor', label: '直前流動性減少上限', unit: '%', min: 5, max: 80, step: 1, defaultValue: 20, description: 'クリック直前の再確認で減少超過なら中止' },
  { key: 'recheck_price_up_pct', group: 'executor', label: '直前急騰上限', unit: '%', min: 5, max: 100, step: 1, defaultValue: 15, description: 'Vetter後から急騰しすぎたら中止' },

  // Guard
  { key: 'guard_poll_s', group: 'guard', label: '監視ポーリング間隔', unit: '秒', min: 2, max: 30, step: 1, defaultValue: 5, description: '保有ポジションの価格・クジラ監視間隔' },
  { key: 'timeout_h', group: 'guard', label: '停滞タイムアウト (Dead Money)', unit: '時間', min: 0.5, max: 24, step: 0.5, defaultValue: 3, description: '時間経過で伸びなければ撤退' },
  { key: 'timeout_min_gain_pct', group: 'guard', label: 'タイムアウト免除含み益', unit: '%', min: 0, max: 50, step: 1, defaultValue: 5, description: 'この利益未満なら dead money 決済' },
  { key: 'whale_exit_sell_pct', group: 'guard', label: 'クジラ離脱時売却率', unit: '%', min: 25, max: 100, step: 5, defaultValue: 100, description: '先導クジラ売却時の即時撤退割合' },
  { key: 'whale_exit_min_whales', group: 'guard', label: '離脱トリガークジラ数', min: 1, max: 5, step: 1, defaultValue: 1, description: '何人の売却で即撤退するか' },
  { key: 'night_loss_stop_pct', group: 'guard', label: '夜間損失停止ライン', unit: '%', min: 5, max: 100, step: 1, defaultValue: 30, description: '今夜の損失到達で新規買い完全停止' },

  // Desk
  { key: 'paper_start_cash', group: 'desk', label: 'PAPER初期資金', unit: '$', min: 10, max: 100000, step: 10, defaultValue: 100, description: 'ペーパートレード開始時残高' },
  { key: 'fee_pct', group: 'desk', label: '大口手数料率 (>$190)', unit: '%', min: 0, max: 5, step: 0.05, defaultValue: 0.45, description: 'FOMO Solana最低ルート料率' },
  { key: 'confirm_expiry_s', group: 'desk', label: '確認カード有効期限', unit: '秒', min: 15, max: 300, step: 5, defaultValue: 60, description: 'Telegram/コンソール確認ボタンのタイムアウト' },
];

export interface SettingValidationResult {
  valid: boolean;
  error?: string;
}

export function validateSettingChange(
  current: DeskSettings,
  key: keyof DeskSettings,
  value: number
): SettingValidationResult {
  const meta = SETTING_METAS.find((m) => m.key === key);
  if (!meta) return { valid: true };

  if (Number.isNaN(value) || value < meta.min || value > meta.max) {
    return {
      valid: false,
      error: `422 Range Error: ${key} must be between ${meta.min} and ${meta.max}`,
    };
  }

  const next = { ...current, [key]: value };

  // Step 12 Cross-checks
  if (next.two_whale_size < next.one_whale_size) {
    return {
      valid: false,
      error: `422 Cross-check failed: two_whale_size (${next.two_whale_size}) >= one_whale_size (${next.one_whale_size})`,
    };
  }
  if (next.crash_pct <= next.dip_pct) {
    return {
      valid: false,
      error: `422 Cross-check failed: crash_pct (${next.crash_pct}) > dip_pct (${next.dip_pct})`,
    };
  }
  if (next.min_ticket_usd > next.max_ticket_usd) {
    return {
      valid: false,
      error: `422 Cross-check failed: min_ticket_usd (${next.min_ticket_usd}) <= max_ticket_usd (${next.max_ticket_usd})`,
    };
  }

  return { valid: true };
}
