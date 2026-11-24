import { DeskSettings } from '../types/desk';

export interface WindowsBundleFile {
  filename: string;
  description: string;
  content: string;
}

export function buildWindowsBundleFiles(settings: DeskSettings): WindowsBundleFile[] {
  const startBat = `@echo off
title Grok Bot Copy Desk (Windows 11)
echo ========================================================
echo   Grok Bot Copy Desk - Local Windows Launcher
echo ========================================================
echo.
if not exist "venv\\Scripts\\python.exe" (
  echo [!] Virtual environment not found. Run setup_windows.ps1 first.
  pause
  exit /b 1
)

echo [1/2] Launching dedicated Chrome on 127.0.0.1:9333 (localhost only)...
start "" "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" ^
  --remote-debugging-address=127.0.0.1 ^
  --remote-debugging-port=9333 ^
  --user-data-dir="%CD%\\chrome_profile" ^
  --start-maximized ^
  --lang=en-US ^
  --disable-extensions ^
  "https://fomo.family/r/Quickscout"

timeout /t 3 /nobreak >nul
echo [2/2] Starting 5-Bot Copy Desk process (Watcher, Vetter, Sizer, Executor, Guard)...
"venv\\Scripts\\python.exe" main.py
pause
`;

  const setupPs1 = `# Grok Bot Copy Desk - Windows 11 Automated Setup Script
$ErrorActionPreference = "Stop"
Write-Host "=== Grok Bot Copy Desk (Windows 11 Setup) ===" -ForegroundColor Cyan

if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
    Write-Host "Python 3.12+ is required. Install from https://www.python.org/downloads/windows/" -ForegroundColor Red
    exit 1
}

python -m venv venv
.\\venv\\Scripts\\python.exe -m pip install --upgrade pip
.\\venv\\Scripts\\pip.exe install -r requirements.txt
.\\venv\\Scripts\\playwright.exe install chromium

New-Item -ItemType Directory -Force -Path "logs\\raw", "logs\\fail", "data\\frames", "backups", "secrets" | Out-Null

if (-not (Test-Path "secrets\\.env")) {
    @"
APP_TOKEN=REPLACE_WITH_LONG_RANDOM_TOKEN
TG_BOT_TOKEN=REPLACE_WITH_BOTFATHER_TOKEN
VAPID_PRIVATE_KEY=
"@ | Out-File -Encoding utf8 "secrets\\.env"
    Write-Host "Created secrets\\.env - fill in your tokens (never commit to git)." -ForegroundColor Yellow
}

Write-Host "Setup complete! Double-click start_desk.bat to launch." -ForegroundColor Green
`;

  const requirementsTxt = `websockets>=12.0
httpx>=0.27.0
fastapi>=0.115.0
uvicorn>=0.30.0
pydantic>=2.9.0
pywebpush>=2.0.0
playwright>=1.48.0
python-dotenv>=1.0.1
`;

  const linksPy = `# Step 7: LINKS (non-negotiable)
CHAIN_ID = {
    "solana": 1399811149,
    "robinhood": 4663,
    "base": 8453,
    "bnb": 56,
}

SIGNUP_URL = "https://fomo.family/r/Quickscout"


def coin_url(address: str, chain: str = "solana") -> str:
    if chain not in CHAIN_ID:
        return SIGNUP_URL
    return (
        f"https://fomo.family/coin?address={address}"
        f"&chainId={CHAIN_ID[chain]}&r=Quickscout&source=share_link"
    )


def profile_url(handle: str) -> str:
    h = handle.lstrip("@")
    return f"https://fomo.family/profile/{h}?source=share_link&r=Quickscout"
`;

  const feesPy = `# Step 13: FOMO on Solana exact fee model
def calculate_fee(usd: float, fee_pct: float = ${settings.fee_pct}) -> float:
    if usd <= 0:
        return 0.0
    if usd < 5.0:
        raw = 0.10
    elif usd <= 47.50:
        raw = usd * 0.02
    elif usd <= 190.0:
        raw = 0.95
    else:
        raw = usd * (fee_pct / 100.0)
    return round(raw, 2)
`;

  const configJson = JSON.stringify(settings, null, 2);

  const readmeMd = `# Grok Bot Copy Desk — Windows 11 導入ガイド

## 動作要件
- Windows 11 (64-bit) / 1440px以上ディスプレイ推奨
- Python 3.12+
- Google Chrome

## セットアップ手順
1. ダウンロードしたファイルを任意のフォルダ（例: \`C:\\GrokCopyDesk\\\`）に配置します。
2. PowerShellで \`setup_windows.ps1\` を実行し、Python仮想環境とPlaywrightを導入します。
3. \`secrets\\.env\` に Telegram Botトークンと \`APP_TOKEN\` を設定します（Gitには絶対にコミットしないでください）。
4. \`start_desk.bat\` をダブルクリックして起動します。
   - Chromeが \`127.0.0.1:9333\`（ローカル専用・外部非公開）で自動起動します。
   - FOMOにログイン（パスワード・2FAは本人が直接入力）すると、5ボットプロセスが稼働開始します。

## 安全設計（コード強制）
- Withdraw / Deposit / Send ボタンは \`browser.py\` のコード内で完全に拒否されます。
- 初期モードは \`PAPER\` です。\`LIVE\` 切り替えには明示的な確認と1晩のPAPER実績が必要です。
- 損切りライン (\`stop_pct\`) を緩めても、既存ポジションのストップ価格は下がりません。
`;

  return [
    { filename: 'start_desk.bat', description: 'Windows 11 ワンクリック起動ランチャー（Chrome CDP 9333 + Deskプロセス）', content: startBat },
    { filename: 'setup_windows.ps1', description: 'PowerShell 自動環境構築スクリプト（venv / Playwright / secrets作成）', content: setupPs1 },
    { filename: 'requirements.txt', description: 'Python 3.12 依存パッケージ一覧（Step 4準拠）', content: requirementsTxt },
    { filename: 'links.py', description: 'Step 7 FOMOリンク生成モジュール（変更禁止仕様）', content: linksPy },
    { filename: 'fees.py', description: 'Step 13 FOMO Solana手数料計算モデル', content: feesPy },
    { filename: 'settings.json', description: '現在のDesk設定エクスポート（Step 12全項目）', content: configJson },
    { filename: 'README_WINDOWS.md', description: 'Windows 11 セットアップ・運用マニュアル', content: readmeMd },
  ];
}

export function triggerFileDownload(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
