import { Search } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext.jsx';
import LocalizedDatePicker from '@/components/LocalizedDatePicker';

export default function EmailSearchFilters({ search, onSearchChange, sender, onSenderChange, senders, dateFrom, onDateFromChange, dateTo, onDateToChange }) {
  const { t } = useLanguage();
  return (
    <div className="panel p-3 mb-4 space-y-2">
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'hsl(var(--muted-foreground))' }} />
        <input value={search} onChange={(e) => onSearchChange(e.target.value)} placeholder={t('csEmailSearchPlaceholder')} className="neu-input text-sm pl-9" />
      </div>
      <div className="flex flex-wrap gap-2">
        <select value={sender} onChange={(e) => onSenderChange(e.target.value)} className="neu-input text-xs py-1.5 flex-1 min-w-[120px]">
          <option value="">{t('csEmailAllSenders')}</option>
          {senders.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <div className="flex-1 min-w-[120px]"><LocalizedDatePicker value={dateFrom} onChange={onDateFromChange} /></div>
        <div className="flex-1 min-w-[120px]"><LocalizedDatePicker value={dateTo} onChange={onDateToChange} /></div>
      </div>
    </div>
  );
}