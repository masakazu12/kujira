import React, { useMemo, useState } from 'react';
import { Check, Download, FileCode, Play, ShieldCheck, X } from 'lucide-react';
import { AcceptanceTestResult, DeskSettings } from '../types/desk';
import { runAcceptanceSuite } from '../engine/botLogic';
import { buildWindowsBundleFiles, triggerFileDownload } from '../engine/windowsExport';

interface WindowsSetupViewProps {
  settings: DeskSettings;
}

export const WindowsSetupView: React.FC<WindowsSetupViewProps> = ({ settings }) => {
  const [results, setResults] = useState<AcceptanceTestResult[]>(() => runAcceptanceSuite(settings));
  const [selectedFile, setSelectedFile] = useState<string>('start_desk.bat');
  const [lastRunAt, setLastRunAt] = useState<string>(new Date().toTimeString().slice(0, 8));

  const bundleFiles = useMemo(() => buildWindowsBundleFiles(settings), [settings]);
  const activeBundleFile = bundleFiles.find((f) => f.filename === selectedFile) || bundleFiles[0];
  const passedCount = results.filter((r) => r.passed).length;

  const handleRunTests = () => {
    setResults(runAcceptanceSuite(settings));
    setLastRunAt(new Date().toTimeString().slice(0, 8));
  };

  const handleDownloadAll = () => {
    bundleFiles.forEach((f, idx) => {
      window.setTimeout(() => {
        triggerFileDownload(f.filename, f.content);
      }, idx * 140);
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="bg-[#1c1c1e] rounded-xl p-6 border border-[rgba(84,84,88,0.45)] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-white">
            Windows 11 ローカル導入パッケージ & 15項目受入テスト (STEP 15)
          </h1>
          <p className="text-xs text-[rgba(235,235,245,0.6)] mt-1">
            Windows 11 PC 上で Chrome CDP (127.0.0.1:9333) + Python 3.12 5ボット常駐プロセスを直接起動する構成一式を出力できます
          </p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleRunTests}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium bg-[#2c2c2e] text-white hover:bg-[#3a3a3c] transition-colors whitespace-nowrap"
          >
            <Play className="w-3.5 h-3.5" />
            全15テスト再実行
          </button>
          <button
            type="button"
            onClick={handleDownloadAll}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-[#00d35a] text-black hover:bg-[#19df6c] transition-colors whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            Windows一式をダウンロード
          </button>
        </div>
      </section>

      {/* Two-Column Split: Windows Files Exporter | Step 15 Acceptance Tests */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Windows Bundle Files */}
        <section className="xl:col-span-6 bg-[#1c1c1e] rounded-xl border border-[rgba(84,84,88,0.45)] overflow-hidden">
          <div className="px-5 py-3.5 border-b border-[rgba(84,84,88,0.4)] flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Windows 実行ファイル構成</h2>
            <span className="text-xs font-mono-num text-[rgba(235,235,245,0.5)]">
              Python 3.12 · Chrome 9333 · SQLite WAL
            </span>
          </div>

          <div className="divide-y divide-[rgba(84,84,88,0.3)]">
            {bundleFiles.map((file) => (
              <div
                key={file.filename}
                className={`flex items-center justify-between px-5 py-3 text-xs transition-colors ${
                  selectedFile === file.filename ? 'bg-[#242427]' : 'hover:bg-[#202023]'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setSelectedFile(file.filename)}
                  className="text-left min-w-0 flex-1 pr-3"
                >
                  <div className="font-mono-num font-semibold text-white flex items-center gap-2">
                    <FileCode className="w-3.5 h-3.5 text-[#64d2ff] shrink-0" />
                    {file.filename}
                  </div>
                  <div className="text-[11px] text-[rgba(235,235,245,0.55)] mt-0.5 truncate">
                    {file.description}
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => triggerFileDownload(file.filename, file.content)}
                  className="px-2.5 py-1 rounded bg-[#2c2c2e] text-white hover:bg-[#3a3a3c] text-[11px] font-medium shrink-0"
                >
                  保存
                </button>
              </div>
            ))}
          </div>

          {/* Selected File Code Preview */}
          <div className="p-4 bg-[#111113] border-t border-[rgba(84,84,88,0.4)]">
            <div className="flex items-center justify-between mb-2 text-xs font-mono-num text-[rgba(235,235,245,0.6)]">
              <span>Preview: {activeBundleFile.filename}</span>
              <span>{activeBundleFile.content.split('\n').length} lines</span>
            </div>
            <pre className="text-[11px] font-mono-num text-[rgba(235,235,245,0.85)] overflow-x-auto max-h-64 overflow-y-auto leading-relaxed whitespace-pre">
              {activeBundleFile.content}
            </pre>
          </div>
        </section>

        {/* Step 15 Acceptance Test Suite */}
        <section className="xl:col-span-6 bg-[#1c1c1e] rounded-xl border border-[rgba(84,84,88,0.45)] overflow-hidden">
          <div className="px-5 py-3.5 border-b border-[rgba(84,84,88,0.4)] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#00d35a]" />
              <h2 className="text-sm font-semibold text-white">
                STEP 15 受入テスト ({passedCount}/15 PASS)
              </h2>
            </div>
            <span className="text-xs font-mono-num text-[rgba(235,235,245,0.5)]">
              Last run {lastRunAt}
            </span>
          </div>

          <div className="divide-y divide-[rgba(84,84,88,0.3)] max-h-[600px] overflow-y-auto">
            {results.map((r) => (
              <div key={r.id} className="px-5 py-3 text-xs flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono-num text-[rgba(235,235,245,0.45)]">
                      {String(r.id).padStart(2, '0')}
                    </span>
                    <span className="font-mono-num font-semibold text-white">{r.name}</span>
                    <span className="text-[rgba(235,235,245,0.65)] truncate">{r.summary}</span>
                  </div>
                  <div className="text-[11px] font-mono-num text-[rgba(235,235,245,0.5)] mt-1">
                    {r.detail}
                  </div>
                </div>
                <span
                  className="inline-flex items-center gap-1 font-mono-num font-semibold shrink-0"
                  style={{ color: r.passed ? '#00d35a' : '#ff453a' }}
                >
                  {r.passed ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                  {r.passed ? 'PASS' : 'FAIL'}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
