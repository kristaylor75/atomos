import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext.jsx';

// Shared skin-aware chrome for every game page. Uses CSS variables and the
// existing .panel / .calc-btn utility classes (defined in index.css), so games
// automatically match every visual skin (Pip-Boy, Ham Radio, etc.).
export default function GameShell({ icon: Icon, title, subtitle, controls, children }) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  return (
    <div className="max-w-3xl mx-auto px-4 py-5">
      <div className="panel px-4 py-3 mb-3 flex items-center gap-3">
        <button
          onClick={() => navigate('/')}
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--muted-foreground))' }}
          title={t('back')}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: 'hsl(var(--primary) / 0.15)', border: '1px solid hsl(var(--primary) / 0.4)', boxShadow: '0 0 14px hsl(var(--primary) / 0.25)' }}>
          {Icon && <Icon className="w-5 h-5" style={{ color: 'hsl(var(--primary))' }} />}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="font-mono text-lg font-bold uppercase tracking-widest text-foreground truncate">{title}</h1>
          {subtitle && <p className="text-[11px] opacity-60 truncate">{subtitle}</p>}
        </div>
        {controls && <div className="shrink-0">{controls}</div>}
      </div>
      {children}
    </div>
  );
}