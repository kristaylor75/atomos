import { useState } from 'react';
import { Download } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { useLanguage } from '@/lib/LanguageContext.jsx';
import { formatHistoryEntry, formatHistoryTimestamp } from '@/lib/history';

const TOOL_LABEL_KEYS = { all: 'histAll', calculator: 'navCalculator', converter: 'navConverter', datetime: 'navDateTime', geometry: 'navGeometry', weather: 'navWeather', calls: 'navCalls' };

function exportCSV(entries, filter, t) {
  const rows = [[t('histColTool'), t('histColInput'), t('histColResult'), t('histColDate')]];
  entries.forEach(e => {
    const { input, result } = formatHistoryEntry(e, t);
    rows.push([
      t(TOOL_LABEL_KEYS[e.tool]) || e.tool,
      `"${(input || '').replace(/"/g, '""')}"`,
      `"${(result || '').replace(/"/g, '""')}"`,
      formatHistoryTimestamp(e.timestamp),
    ]);
  });
  const csv = rows.map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `calcsuite-history-${filter}-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function exportPDF(entries, filter, t) {
  const doc = new jsPDF();
  const label = t(TOOL_LABEL_KEYS[filter]) || filter;

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(`CalcSuite — ${t('histExportHeader')}`, 14, 18);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);
  doc.text(`${t('histExportFilterLabel')}: ${label}   |   ${t('histExportExportedLabel')}: ${formatHistoryTimestamp(Date.now())}   |   ${entries.length} ${t('histExportEntriesLabel')}`, 14, 25);
  doc.setTextColor(0);

  // Table header
  const colX = [14, 46, 110, 165];
  const headers = [t('histColTool'), t('histColInput'), t('histColResult'), t('histColDate')];
  let y = 33;

  doc.setFillColor(240, 240, 240);
  doc.rect(14, y - 4, 182, 7, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  headers.forEach((h, i) => doc.text(h, colX[i], y));
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  entries.forEach((e, idx) => {
    if (y > 275) {
      doc.addPage();
      y = 20;
    }
    if (idx % 2 === 0) {
      doc.setFillColor(249, 249, 249);
      doc.rect(14, y - 3.5, 182, 6.5, 'F');
    }
    const { input, result } = formatHistoryEntry(e, t);
    doc.text(t(TOOL_LABEL_KEYS[e.tool]) || e.tool || '', colX[0], y, { maxWidth: 30 });
    doc.text((input || '').substring(0, 40), colX[1], y, { maxWidth: 62 });
    doc.text((result || '').substring(0, 35), colX[2], y, { maxWidth: 52 });
    doc.text(formatHistoryTimestamp(e.timestamp), colX[3], y, { maxWidth: 30 });
    y += 7;
  });

  doc.save(`calcsuite-history-${filter}-${Date.now()}.pdf`);
}

export default function ExportHistory({ entries, filter }) {
  const [open, setOpen] = useState(false);
  const { t } = useLanguage();

  if (!entries.length) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border border-border bg-secondary hover:bg-muted transition-colors"
      >
        <Download className="w-4 h-4" />
        {t('exportBtn')}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-20 bg-card border border-border rounded-xl shadow-lg overflow-hidden min-w-[140px]">
            <button
              onClick={() => { exportCSV(entries, filter, t); setOpen(false); }}
              className="w-full text-left px-4 py-2.5 text-sm hover:bg-secondary transition-colors flex items-center gap-2"
            >
              <span className="text-xs font-mono bg-secondary px-1.5 py-0.5 rounded">CSV</span>
              {t('exportSpreadsheet')}
            </button>
            <button
              onClick={() => { exportPDF(entries, filter, t); setOpen(false); }}
              className="w-full text-left px-4 py-2.5 text-sm hover:bg-secondary transition-colors flex items-center gap-2 border-t border-border"
            >
              <span className="text-xs font-mono bg-secondary px-1.5 py-0.5 rounded">PDF</span>
              {t('exportDocument')}
            </button>
          </div>
        </>
      )}
    </div>
  );
}