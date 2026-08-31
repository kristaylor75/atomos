import { Inbox } from 'lucide-react';
import MessageBubble from '@/components/messages/MessageBubble';

export default function MessageThreadList({ me, received, sent, contacts, onToggleRead, onDelete, onToggleStar, onCategoryChange, onReply }) {
  const nameFor = (email) => contacts.find((c) => c.email === email)?.display_name || email;

  const threads = {};
  const addMsg = (msg, counterpart, isIncoming) => {
    if (!counterpart) return;
    if (!threads[counterpart]) threads[counterpart] = { counterpart, messages: [] };
    threads[counterpart].messages.push({ msg, isIncoming });
  };
  received.forEach((m) => addMsg(m, m.sender_email, true));
  sent.forEach((m) => addMsg(m, m.recipient_email, false));

  const threadList = Object.values(threads)
    .map((th) => ({ ...th, messages: th.messages.sort((a, b) => new Date(a.msg.timestamp || a.msg.created_date) - new Date(b.msg.timestamp || b.msg.created_date)) }))
    .sort((a, b) => {
      const aLast = a.messages[a.messages.length - 1].msg;
      const bLast = b.messages[b.messages.length - 1].msg;
      return new Date(bLast.timestamp || bLast.created_date) - new Date(aLast.timestamp || aLast.created_date);
    });

  if (threadList.length === 0) {
    return (
      <div className="text-center py-16" style={{ color: 'hsl(var(--muted-foreground))' }}>
        <Inbox className="w-10 h-10 mx-auto mb-3 opacity-30" />
        <p className="text-sm">Nothing here yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {threadList.map((th) => (
        <div key={th.counterpart} className="panel p-3">
          <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: 'hsl(var(--muted-foreground))' }}>{nameFor(th.counterpart)}</p>
          <div className="space-y-2">
            {th.messages.map(({ msg, isIncoming }) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                isIncoming={isIncoming}
                onToggleRead={onToggleRead}
                onDelete={onDelete}
                onToggleStar={onToggleStar}
                onCategoryChange={onCategoryChange}
                onReply={onReply}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}