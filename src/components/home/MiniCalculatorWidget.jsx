import { useState } from 'react';
import { Calculator, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { evaluateExpression } from '@/lib/mathEngine';
import { addHistoryEntry } from '@/lib/history';
import { useLanguage } from '@/lib/LanguageContext.jsx';

export default function MiniCalculatorWidget() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [expr, setExpr] = useState('');
  const [result, setResult] = useState(null);

  const calculate = () => {
    if (!expr.trim()) return;
    const { result: res, error } = evaluateExpression(expr);
    setResult(error ? 'Error' : res);
    if (!error) addHistoryEntry({ tool: 'calculator', input: expr, result: res });
  };

  return (
    <div className="panel p-4 mb-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] uppercase tracking-widest opacity-70 flex items-center gap-1.5">
          <Calculator className="w-3.5 h-3.5" /> {t('navCalculator')}
        </span>
        <button onClick={() => navigate('/calculator')} className="flex items-center text-[10px] font-semibold" style={{ color: 'hsl(var(--primary))' }}>
          {t('homeViewAll')} <ChevronRight className="w-3 h-3" />
        </button>
      </div>
      <div className="flex gap-2">
        <input
          value={expr}
          onChange={(e) => setExpr(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && calculate()}
          placeholder="2 + 2 * 3"
          className="neu-input flex-1 text-sm"
        />
        <button onClick={calculate} className="calc-btn px-4 text-xs font-semibold" style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}>
          =
        </button>
      </div>
      {result !== null && (
        <p className="text-lg font-mono font-bold mt-2 text-right text-foreground">{result}</p>
      )}
    </div>
  );
}