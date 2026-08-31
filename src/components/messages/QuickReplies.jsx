import { useLanguage } from '@/lib/LanguageContext.jsx';

const REPLIES = [
  { key: 'csMsgQuickOnMyWay', emoji: '👍' },
  { key: 'csMsgQuickCantTalk', emoji: '' },
  { key: 'csMsgQuickCallBack', emoji: '' },
  { key: 'csMsgQuickThanks', emoji: '' },
];

export default function QuickReplies({ onSelect }) {
  const { t } = useLanguage();
  return (
    <div className="flex flex-wrap gap-1.5">
      {REPLIES.map(({ key, emoji }) => {
        const text = emoji ? `${emoji} ${t(key)}` : t(key);
        return (
          <button
            key={key}
            type="button"
            onClick={() => onSelect(text)}
            className="text-xs px-2.5 py-1 rounded-full"
            style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--muted-foreground))' }}
          >
            {text}
          </button>
        );
      })}
    </div>
  );
}