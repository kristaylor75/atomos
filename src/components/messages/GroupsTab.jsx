import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Plus } from 'lucide-react';
// import { appData } from "@/api/localClient";

export default function GroupsTab({ me, contacts }) {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [selected, setSelected] = useState([]);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!me) return;
    const all = await appData.entities.Conversation.list('-created_date', 200);
    setConversations(all.filter(c => (c.participant_emails || []).includes(me.email)));
    setLoading(false);
  }, [me]);

  useEffect(() => { load(); }, [load]);

  const toggleContact = (email) => {
    setSelected(prev => prev.includes(email) ? prev.filter(e => e !== email) : [...prev, email]);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    if (selected.length < 2) { setError('Select at least 2 contacts for a group.'); return; }
    setCreating(true);
    try {
      const conv = await appData.entities.Conversation.create({
        ...(title.trim() ? { title: title.trim() } : {}),
        participant_emails: [me.email, ...selected],
      });
      navigate(`/group-chat?id=${conv.id}`);
    } finally {
      setCreating(false);
    }
  };

  if (loading) return <p className="text-center text-sm py-10" style={{ color: 'hsl(var(--muted-foreground))' }}>Loading…</p>;

  return (
    <div className="space-y-4">
      <form onSubmit={handleCreate} className="panel p-4 space-y-3">
        <span className="text-[10px] font-bold uppercase tracking-widest block" style={{ color: 'hsl(var(--muted-foreground))' }}>New Group</span>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Group name (optional)…" className="neu-input text-sm" />
        {contacts.length === 0 ? (
          <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>Save some contacts first to start a group.</p>
        ) : (
          <div className="space-y-1.5 max-h-40 overflow-y-auto">
            {contacts.map((c) => (
              <label key={c.id} className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={selected.includes(c.email)} onChange={() => toggleContact(c.email)} className="w-4 h-4" />
                {c.display_name}
              </label>
            ))}
          </div>
        )}
        {error && <p className="text-xs" style={{ color: 'hsl(var(--destructive))' }}>{error}</p>}
        <button type="submit" disabled={creating || contacts.length === 0} className="btn-primary flex items-center justify-center gap-2 disabled:opacity-50">
          <Plus className="w-4 h-4" /> {creating ? 'Creating…' : 'Create Group'}
        </button>
      </form>

      {conversations.length === 0 ? (
        <div className="text-center py-16" style={{ color: 'hsl(var(--muted-foreground))' }}>
          <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No group chats yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => navigate(`/group-chat?id=${conv.id}`)}
              className="w-full flex items-center gap-3 rounded-xl px-4 py-3 text-left"
              style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
            >
              <Users className="w-4 h-4 shrink-0" style={{ color: 'hsl(280 65% 65%)' }} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold truncate">{conv.title || `Group (${(conv.participant_emails || []).length})`}</p>
                <p className="text-[11px] truncate" style={{ color: 'hsl(var(--muted-foreground))' }}>{(conv.participant_emails || []).join(', ')}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}