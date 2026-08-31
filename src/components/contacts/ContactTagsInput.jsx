import { useState } from 'react';
import { X } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext.jsx';

export default function ContactTagsInput({ tags = [], onChange }) {
  const { t } = useLanguage();
  const [input, setInput] = useState('');

  const addTag = () => {
    const t = input.trim();
    if (!t || tags.includes(t)) { setInput(''); return; }
    onChange([...tags, t]);
    setInput('');
  };

  const removeTag = (t) => onChange(tags.filter((x) => x !== t));

  return (
    <div className="neu-input flex flex-wrap items-center gap-1.5 py-2">
      {tags.map((t) => (
        <span key={t} className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: 'hsl(340 75% 58% / 0.2)', color: 'hsl(340 75% 58%)' }}>
          {t}
          <X className="w-3 h-3 cursor-pointer" onClick={() => removeTag(t)} />
        </span>
      ))}
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') { e.preventDefault(); addTag(); }
          else if (e.key === 'Backspace' && !input && tags.length) removeTag(tags[tags.length - 1]);
        }}
        onBlur={addTag}
        placeholder={tags.length ? '' : t('csTagsPlaceholder')}
        className="flex-1 min-w-[100px] bg-transparent outline-none text-sm"
      />
    </div>
  );
}