import { useState, useCallback } from 'react';
import { addHistoryEntry } from '@/lib/history';
import {
  generateLorem, generateName, generateEmail, generateAddress, generateDate,
  generateImageUrl, generateBusinessName, generatePassphrase, generatePin,
  generateUsername, generateSecretKey, generateStrongPassword, hashMD5, hashSHA1, hashSHA256,
} from '@/lib/textGenerators';
// import { appData } from "@/api/localClient";
import { Copy, Check, RefreshCw, X, FileText } from 'lucide-react';
import InlineHistory from '@/components/InlineHistory';
import { useLanguage } from '@/lib/LanguageContext.jsx';

function CopyButton({ value, t }) {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1500); };
  return (
    <button onClick={copy} className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all"
      style={{ background: copied ? 'hsl(var(--primary) / 0.15)' : 'hsl(var(--secondary))', color: copied ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))', border: '1px solid hsl(var(--border) / 0.6)' }}>
      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
      {copied ? t('generatorCopied') : t('generatorCopy')}
    </button>
  );
}

function ResultCard({ label, value, onRegenerate, onClose, t }) {
  return (
    <div className="rounded-xl p-4 space-y-2" style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border) / 0.6)' }}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'hsl(var(--muted-foreground))' }}>{label}</p>
        {onClose && (
          <button onClick={onClose} className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-colors"
            style={{ color: 'hsl(var(--muted-foreground))' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'hsl(var(--destructive) / 0.12)'; e.currentTarget.style.color = 'hsl(var(--destructive))'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'hsl(var(--muted-foreground))'; }}>
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      <p className="text-sm font-mono text-foreground break-all">{value}</p>
      <div className="flex gap-2">
        <CopyButton value={value} t={t} />
        {onRegenerate && (
          <button onClick={onRegenerate} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all"
            style={{ background: 'hsl(var(--secondary))', color: 'hsl(var(--muted-foreground))', border: '1px solid hsl(var(--border) / 0.6)' }}>
            <RefreshCw className="w-3 h-3" /> {t('generatorRegenerate')}
          </button>
        )}
      </div>
    </div>
  );
}

function PlaceholderTab({ t, lang }) {
  const [results, setResults] = useState({});
  const [loremSentences, setLoremSentences] = useState(3);
  const [imgW, setImgW] = useState(300);
  const [imgH, setImgH] = useState(200);

  const gen = useCallback((key, fn) => {
    const value = fn();
    setResults(prev => ({ ...prev, [key]: value }));
    addHistoryEntry({ tool: 'generator', input: key, result: value });
  }, []);

  const closeResult = (key) => setResults(prev => { const next = { ...prev }; delete next[key]; return next; });

  const items = [
    { key: 'name', labelKey: 'generatorName', fn: () => generateName(lang) },
    { key: 'email', labelKey: 'generatorEmail', fn: () => generateEmail(lang) },
    { key: 'address', labelKey: 'generatorAddress', fn: () => generateAddress(lang) },
    { key: 'date', labelKey: 'generatorDate', fn: generateDate },
    { key: 'business', labelKey: 'generatorBusiness', fn: () => generateBusinessName(lang) },
  ];

  return (
    <div className="space-y-4">
      <div className="panel p-4 space-y-3">
        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'hsl(var(--muted-foreground))' }}>{t('generatorLorem')}</p>
        <div className="flex items-center gap-3">
          <label className="text-xs text-foreground">{t('generatorSentences')}</label>
          <input type="number" value={loremSentences} onChange={e => setLoremSentences(+e.target.value)} min={1} max={20} className="neu-input w-20 text-center" />
          <button onClick={() => gen('lorem', () => generateLorem(loremSentences))} className="btn-primary w-auto px-4 text-sm" style={{ width: 'auto' }}>{t('generatorGenerate')}</button>
        </div>
        {results.lorem && <ResultCard label={t('generatorLorem')} value={results.lorem} onRegenerate={() => gen('lorem', () => generateLorem(loremSentences))} t={t} />}
      </div>

      <div className="panel p-4 space-y-3">
        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'hsl(var(--muted-foreground))' }}>{t('generatorImgUrl')}</p>
        <div className="flex items-center gap-3 flex-wrap">
          <input type="number" value={imgW} onChange={e => setImgW(+e.target.value)} min={50} max={2000} className="neu-input w-24 text-center" placeholder="Width" />
          <span className="text-muted-foreground text-sm">×</span>
          <input type="number" value={imgH} onChange={e => setImgH(+e.target.value)} min={50} max={2000} className="neu-input w-24 text-center" placeholder="Height" />
          <button onClick={() => gen('imgurl', () => generateImageUrl(imgW, imgH))} className="btn-primary w-auto px-4 text-sm" style={{ width: 'auto' }}>{t('generatorGenerate')}</button>
        </div>
        {results.imgurl && <ResultCard label="Image URL" value={results.imgurl} onRegenerate={() => gen('imgurl', () => generateImageUrl(imgW, imgH))} t={t} />}
      </div>

      <div className="panel p-4 space-y-3">
        <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'hsl(var(--muted-foreground))' }}>{t('generatorQuickGen')}</p>
        <div className="flex flex-wrap gap-2 mb-3">
          {items.map(item => (
            <button key={item.key} onClick={() => gen(item.key, item.fn)} className="px-3 py-1.5 rounded-xl text-sm font-medium transition-all"
              style={{ background: 'hsl(var(--secondary))', color: 'hsl(var(--foreground))', border: '1px solid hsl(var(--border))' }}>
              {t(item.labelKey)}
            </button>
          ))}
        </div>
        <div className="space-y-3">
          {items.filter(i => results[i.key]).map(item => (
            <ResultCard key={item.key} label={t(item.labelKey)} value={results[item.key]} onRegenerate={() => gen(item.key, item.fn)} onClose={() => closeResult(item.key)} t={t} />
          ))}
        </div>
      </div>
    </div>
  );
}

function StrongPasswordPanel({ t }) {
  const [password, setPassword] = useState('');
  const [length, setLength] = useState(20);
  const [saved, setSaved] = useState(false);

  const generate = () => {
    const p = generateStrongPassword(length);
    setPassword(p);
    setSaved(false);
    addHistoryEntry({ tool: 'generator', input: 'strong-password', result: p });
  };

  const copyAndSave = async () => {
    navigator.clipboard.writeText(password);
    const title = `Password ${new Date().toLocaleDateString()}`;
    await appData.entities.Note.create({ title, content: password, mode: 'note' });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="panel p-4 space-y-4" style={{ border: '1px solid hsl(var(--primary) / 0.3)' }}>
      <div>
        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'hsl(var(--primary))' }}>{t('generatorStrongPassword')}</p>
        <p className="text-[10px] mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>{t('generatorStrongPasswordDesc')}</p>
      </div>
      <div className="flex items-center gap-3">
        <label className="text-xs text-foreground">{t('generatorLength')}</label>
        <input type="number" value={length} onChange={e => setLength(Math.max(12, Math.min(64, +e.target.value)))} min={12} max={64} className="neu-input w-20 text-center" />
        <button onClick={generate} className="btn-primary w-auto px-4 text-sm" style={{ width: 'auto' }}>{t('generatorGenerate')}</button>
      </div>
      {password && (
        <div className="rounded-xl p-3 space-y-3" style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border) / 0.6)' }}>
          <p className="text-sm font-mono text-foreground break-all leading-relaxed">{password}</p>
          <div className="flex gap-2 flex-wrap">
            <CopyButton value={password} t={t} />
            <button onClick={generate} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all"
              style={{ background: 'hsl(var(--secondary))', color: 'hsl(var(--muted-foreground))', border: '1px solid hsl(var(--border) / 0.6)' }}>
              <RefreshCw className="w-3 h-3" /> {t('generatorRegenerate')}
            </button>
            <button onClick={copyAndSave} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ml-auto"
              style={{ background: saved ? 'hsl(173 58% 45% / 0.2)' : 'hsl(var(--primary) / 0.15)', color: saved ? 'hsl(173 58% 45%)' : 'hsl(var(--primary))', border: `1px solid ${saved ? 'hsl(173 58% 45% / 0.4)' : 'hsl(var(--primary) / 0.3)'}` }}>
              {saved ? <Check className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
              {saved ? t('generatorSavedToNotes') : t('generatorCopyToNotes')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function SecurityTab({ t, lang }) {
  const [results, setResults] = useState({});
  const [pinLen, setPinLen] = useState(4);
  const [keyLen, setKeyLen] = useState(32);
  const [passphraseWords, setPassphraseWords] = useState(4);
  const [hashInput, setHashInput] = useState('');
  const [hashAlgo, setHashAlgo] = useState('md5');

  const gen = useCallback((key, fn) => {
    Promise.resolve(fn()).then(value => {
      setResults(prev => ({ ...prev, [key]: String(value) }));
      addHistoryEntry({ tool: 'generator', input: key, result: String(value) });
    });
  }, []);

  const genHash = useCallback(async () => {
    if (!hashInput) return;
    let value;
    if (hashAlgo === 'md5') value = hashMD5(hashInput);
    else if (hashAlgo === 'sha1') value = await hashSHA1(hashInput);
    else value = await hashSHA256(hashInput);
    setResults(prev => ({ ...prev, hash: value }));
    addHistoryEntry({ tool: 'generator', input: `${hashAlgo.toUpperCase()}(${hashInput})`, result: value });
  }, [hashInput, hashAlgo]);

  return (
    <div className="space-y-4">
      <div className="panel p-4 space-y-3">
        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'hsl(var(--muted-foreground))' }}>{t('generatorPassphrase')}</p>
        <div className="flex items-center gap-3">
          <label className="text-xs text-foreground">{t('generatorWords')}</label>
          <input type="number" value={passphraseWords} onChange={e => setPassphraseWords(+e.target.value)} min={2} max={8} className="neu-input w-20 text-center" />
          <button onClick={() => gen('passphrase', () => generatePassphrase(passphraseWords, lang))} className="btn-primary w-auto px-4 text-sm" style={{ width: 'auto' }}>{t('generatorGenerate')}</button>
        </div>
        {results.passphrase && <ResultCard label={t('generatorPassphrase')} value={results.passphrase} onRegenerate={() => gen('passphrase', () => generatePassphrase(passphraseWords, lang))} t={t} />}
      </div>

      <div className="panel p-4 space-y-3">
        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'hsl(var(--muted-foreground))' }}>{t('generatorPin')}</p>
        <div className="flex items-center gap-3">
          <label className="text-xs text-foreground">{t('generatorDigits')}</label>
          <input type="number" value={pinLen} onChange={e => setPinLen(+e.target.value)} min={4} max={12} className="neu-input w-20 text-center" />
          <button onClick={() => gen('pin', () => generatePin(pinLen))} className="btn-primary w-auto px-4 text-sm" style={{ width: 'auto' }}>{t('generatorGenerate')}</button>
        </div>
        {results.pin && <ResultCard label="PIN" value={results.pin} onRegenerate={() => gen('pin', () => generatePin(pinLen))} t={t} />}
      </div>

      <div className="panel p-4 space-y-3">
        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'hsl(var(--muted-foreground))' }}>{t('generatorSecretKey')}</p>
        <div className="flex items-center gap-3">
          <label className="text-xs text-foreground">{t('generatorLength')}</label>
          <input type="number" value={keyLen} onChange={e => setKeyLen(+e.target.value)} min={8} max={128} className="neu-input w-24 text-center" />
          <button onClick={() => gen('secretkey', () => generateSecretKey(keyLen))} className="btn-primary w-auto px-4 text-sm" style={{ width: 'auto' }}>{t('generatorGenerate')}</button>
        </div>
        {results.secretkey && <ResultCard label={t('generatorSecretKey')} value={results.secretkey} onRegenerate={() => gen('secretkey', () => generateSecretKey(keyLen))} t={t} />}
      </div>

      <div className="panel p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'hsl(var(--muted-foreground))' }}>{t('generatorUsername')}</p>
          <button onClick={() => gen('username', () => generateUsername(lang))} className="btn-primary w-auto px-4 text-sm" style={{ width: 'auto' }}>{t('generatorGenerate')}</button>
        </div>
        {results.username && <ResultCard label={t('generatorUsername')} value={results.username} onRegenerate={() => gen('username', () => generateUsername(lang))} t={t} />}
      </div>

      <StrongPasswordPanel t={t} />

      <div className="panel p-4 space-y-3">
        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'hsl(var(--muted-foreground))' }}>{t('generatorHash')}</p>
        <input value={hashInput} onChange={e => setHashInput(e.target.value)} placeholder={t('generatorHashPlaceholder')} className="neu-input" />
        <div className="flex gap-2 flex-wrap">
          {['md5','sha1','sha256'].map(a => (
            <button key={a} onClick={() => setHashAlgo(a)} className="px-3 py-1.5 rounded-xl text-sm font-medium transition-all"
              style={{ background: hashAlgo === a ? 'hsl(var(--primary))' : 'hsl(var(--secondary))', color: hashAlgo === a ? '#fff' : 'hsl(var(--foreground))', border: hashAlgo === a ? 'none' : '1px solid hsl(var(--border))' }}>
              {a.toUpperCase()}
            </button>
          ))}
          <button onClick={genHash} disabled={!hashInput} className="btn-primary w-auto px-4 text-sm ml-auto" style={{ width: 'auto', opacity: hashInput ? 1 : 0.5 }}>{t('generatorHashBtn')}</button>
        </div>
        {results.hash && <ResultCard label={`${hashAlgo.toUpperCase()} Hash`} value={results.hash} t={t} />}
      </div>
    </div>
  );
}

export default function Generator() {
  const { t, lang } = useLanguage();
  const [activeTab, setActiveTab] = useState('placeholder');

  const TABS = [
    { id: 'placeholder', labelKey: 'generatorTabPlaceholder' },
    { id: 'security', labelKey: 'generatorTabSecurity' },
  ];

  return (
    <div className="p-5 max-w-5xl mx-auto w-full">
      <div className="mb-5">
        <h1 className="text-2xl font-semibold text-foreground">{t('generatorTitle')}</h1>
        <p className="text-sm mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>{t('generatorSubtitle')}</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-5">
        <div className="flex-1 min-w-0 space-y-4">
          <div className="tab-bar">
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`tab-item ${activeTab === tab.id ? 'active' : ''}`}>
                {t(tab.labelKey)}
              </button>
            ))}
          </div>
          {activeTab === 'placeholder' ? <PlaceholderTab t={t} lang={lang} /> : <SecurityTab t={t} lang={lang} />}
        </div>
        <div className="lg:w-64 shrink-0">
          <InlineHistory tool="generator" />
        </div>
      </div>
    </div>
  );
}