import { Mic, MicOff } from 'lucide-react';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';

// Reusable mic button — dictates speech and hands the transcript to onResult.
export default function VoiceInputButton({ onResult, title = 'Voice input' }) {
  const { listening, supported, start, stop } = useSpeechRecognition({ onResult });

  if (!supported) return null;

  return (
    <button
      type="button"
      onClick={() => (listening ? stop() : start())}
      title={title}
      className="w-6 h-6 rounded-lg flex items-center justify-center transition-all shrink-0"
      style={{
        color: listening ? 'hsl(0 72% 60%)' : 'hsl(var(--muted-foreground))',
        border: listening ? '1px solid hsl(0 72% 55% / 0.5)' : '1px solid hsl(var(--border) / 0.5)',
        background: listening ? 'hsl(0 72% 55% / 0.15)' : 'transparent',
      }}
    >
      {listening ? <MicOff className="w-3 h-3 animate-pulse" /> : <Mic className="w-3 h-3" />}
    </button>
  );
}