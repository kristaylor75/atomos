import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

export default function CopyResultButton({ value }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(String(value));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  return (
    <button
      onClick={handleCopy}
      title="Copy to clipboard"
      className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
      style={{ background: 'hsl(var(--secondary))', border: '1px solid hsl(var(--border))', color: copied ? 'hsl(142 71% 45%)' : 'hsl(var(--muted-foreground))' }}
    >
      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}