'use client';

import React, { useRef } from 'react';
import { Upload, Download, Plus, Globe } from 'lucide-react';
import { Locale } from '@/types/backlog';
import { translations } from '@/utils/i18n';
import { Logo } from './Logo';

interface HeaderProps {
  locale: Locale;
  onToggleLocale: () => void;
  onAddItemClick: () => void;
  onExportClick: () => void;
  onImportFileSelected: (file: File) => void;
  lastBackupDate?: string;
}

export const Header: React.FC<HeaderProps> = ({
  locale,
  onToggleLocale,
  onAddItemClick,
  onExportClick,
  onImportFileSelected,
  lastBackupDate,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const t = translations[locale];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportFileSelected(file);
      e.target.value = '';
    }
  };

  const formattedBackup = lastBackupDate
    ? new Date(lastBackupDate).toLocaleDateString(
        locale === 'pt-BR' ? 'pt-BR' : 'en-US',
        { month: 'short', day: 'numeric', year: 'numeric' }
      )
    : null;

  return (
    <header className="sticky top-0 z-30 border-b border-white/[0.08] bg-[#09090b]/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-3.5 sm:px-6 lg:px-8">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <Logo size={32} />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-semibold tracking-tight text-white">
                {t.appTitle}
              </h1>
              {formattedBackup && (
                <span className="hidden rounded-md border border-white/[0.08] bg-zinc-900/60 px-2 py-0.5 text-[10px] text-zinc-400 md:inline-block">
                  {t.lastBackup} {formattedBackup}
                </span>
              )}
            </div>
            <p className="text-[11px] text-zinc-400">{t.appSubtitle}</p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Language Switch */}
          <button
            type="button"
            onClick={onToggleLocale}
            title="Switch Language"
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-[#121215] px-3 py-2 text-xs font-medium text-zinc-300 transition-colors hover:border-white/20 hover:text-white"
          >
            <Globe className="h-3.5 w-3.5 text-zinc-400" />
            <span>{locale === 'en' ? 'EN' : 'PT-BR'}</span>
          </button>

          {/* Hidden File Input for JSON Import */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleFileChange}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-[#121215] px-3.5 py-2 text-xs font-medium text-zinc-300 transition-colors hover:border-white/20 hover:bg-zinc-800/60 hover:text-white"
          >
            <Upload className="h-3.5 w-3.5 text-zinc-400" />
            <span>{t.importJson}</span>
          </button>

          <button
            type="button"
            onClick={onExportClick}
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-[#121215] px-3.5 py-2 text-xs font-medium text-zinc-300 transition-colors hover:border-white/20 hover:bg-zinc-800/60 hover:text-white"
          >
            <Download className="h-3.5 w-3.5 text-zinc-400" />
            <span>{t.exportJson}</span>
          </button>

          <button
            type="button"
            onClick={onAddItemClick}
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-zinc-100 px-4 py-2 text-xs font-medium text-zinc-950 transition-colors hover:bg-white"
          >
            <Plus className="h-4 w-4 stroke-[2.2]" />
            <span>{t.addItem}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
