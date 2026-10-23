'use client';

import React, { useRef } from 'react';
import { Upload, Download, Plus, Layers, Globe } from 'lucide-react';
import { Locale } from '@/types/backlog';
import { translations } from '@/utils/i18n';

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
    <header className="sticky top-0 z-30 border-b border-[#2A2F37] bg-[#0D0F11]/95 backdrop-blur-xs">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#2A2F37] bg-[#16191D] text-[#10B981]">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-lg font-semibold tracking-tight text-[#F3F4F6]">
                {t.appTitle}
              </h1>
              {formattedBackup && (
                <span className="hidden rounded-md border border-[#2A2F37] bg-[#16191D] px-2 py-0.5 text-[11px] text-[#9CA3AF] md:inline-block">
                  {t.lastBackup} {formattedBackup}
                </span>
              )}
            </div>
            <p className="text-xs text-[#9CA3AF]">{t.appSubtitle}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Language Switch (EN / PT-BR) */}
          <button
            type="button"
            onClick={onToggleLocale}
            title="Switch Interface Language (EN / PT-BR)"
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#2A2F37] bg-[#16191D] px-3 py-2 text-xs font-medium text-[#9CA3AF] transition-colors hover:border-[#3B424D] hover:text-[#F3F4F6]"
          >
            <Globe className="h-3.5 w-3.5 text-[#10B981]" />
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
            className="inline-flex items-center gap-2 rounded-lg border border-[#2A2F37] bg-[#16191D] px-3.5 py-2 text-xs font-medium text-[#F3F4F6] transition-colors hover:border-[#3B424D] hover:bg-[#1F2329]"
          >
            <Upload className="h-3.5 w-3.5 text-[#9CA3AF]" />
            <span>{t.importJson}</span>
          </button>

          <button
            type="button"
            onClick={onExportClick}
            className="inline-flex items-center gap-2 rounded-lg border border-[#2A2F37] bg-[#16191D] px-3.5 py-2 text-xs font-medium text-[#F3F4F6] transition-colors hover:border-[#3B424D] hover:bg-[#1F2329]"
          >
            <Download className="h-3.5 w-3.5 text-[#9CA3AF]" />
            <span>{t.exportJson}</span>
          </button>

          <button
            type="button"
            onClick={onAddItemClick}
            className="inline-flex items-center gap-2 rounded-lg bg-[#10B981] px-4 py-2 text-xs font-semibold text-[#0D0F11] transition-colors hover:bg-[#059669]"
          >
            <Plus className="h-4 w-4 stroke-[2.5]" />
            <span>{t.addItem}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
