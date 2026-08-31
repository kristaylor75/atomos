import { Check, CheckCheck, Mail, Trash2, Reply } from 'lucide-react';
import StarButton from '@/components/communications/StarButton';
import CategorySelect from '@/components/communications/CategorySelect';

export default function MessageBubble({ message, isIncoming, onToggleRead, onDelete, onToggleStar, onCategoryChange, onReply }) {
  const unread = isIncoming && message.status !== 'read';
  return (
    <div
      className="rounded-xl px-3 py-2"
      style={{
        background: isIncoming ? 'hsl(var(--muted) / 0.5)' : 'hsl(280 65% 65% / 0.12)',
        border: unread ? '1px solid hsl(280 65% 65%)' : '1px solid transparent',
        marginLeft: isIncoming ? 0 : '20%',
        marginRight: isIncoming ? '20%' : 0,
      }}
    >
      <p className="text-sm">{message.content}</p>
      <div className="flex items-center justify-between gap-2 mt-1.5">
        <span className="text-[10px] font-mono" style={{ color: 'hsl(var(--muted-foreground) / 0.7)' }}>
          {new Date(message.timestamp || message.created_date).toLocaleString()}
        </span>
        <div className="flex items-center gap-0.5 shrink-0">
          <CategorySelect value={message.category} onChange={(v) => onCategoryChange(message, v)} />
          <StarButton starred={message.starred} onClick={() => onToggleStar(message)} />
          <button onClick={() => onReply(message)} title="Reply" className="p-1.5 rounded-lg" style={{ color: 'hsl(var(--muted-foreground))' }}>
            <Reply className="w-4 h-4" />
          </button>
          {isIncoming ? (
            <button onClick={() => onToggleRead(message)} title={unread ? 'Mark as read' : 'Mark as unread'} className="p-1.5 rounded-lg" style={{ color: 'hsl(var(--muted-foreground))' }}>
              {unread ? <Check className="w-4 h-4" /> : <Mail className="w-4 h-4" />}
            </button>
          ) : (
            <span className="flex items-center gap-1 text-[10px] font-semibold px-1" style={{ color: message.status === 'read' ? 'hsl(142 71% 45%)' : 'hsl(var(--muted-foreground))' }} title={message.status === 'read' ? 'Seen by recipient' : 'Sent'}>
              <CheckCheck className="w-3.5 h-3.5" /> {message.status === 'read' ? 'Seen' : 'Sent'}
            </span>
          )}
          <button onClick={() => onDelete(message)} title="Delete" className="p-1.5 rounded-lg" style={{ color: 'hsl(var(--destructive))' }}>
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}