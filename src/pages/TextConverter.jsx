import { useState } from 'react';
import { addHistoryEntry } from '@/lib/history';
import {
  toUpperCase, toLowerCase, toTitleCase, toCamelCase, toSnakeCase,
  numberToWords, toRoman, fromRoman, toMorse, fromMorse,
  toBinary, toHex, toOctal, fromBinary, fromHex, fromOctal,
} from '@/lib/textGenerators';
import { Copy, Check, ArrowLeftRight } from 'lucide-react';
import InlineHistory from '@/components/InlineHistory';
import { useLanguage } from '@/lib/LanguageContext.jsx';

// Morse only encodes Latin A–Z and digits, so greetings stay Latin-script:
// native spellings for Latin languages, romanized for the rest, keeping the
// example fully morseable in every language.
const MORSE_EXAMPLE = {
  en: 'Hello World',
  es: 'Hola Mundo',
  fr: 'Bonjour le monde',
  de: 'Hallo Welt',
  it: 'Ciao Mondo',
  pt: 'Ola Mundo',
  zh: 'Ni hao shijie',
  ja: 'Konnichiwa sekai',
  ko: 'Annyeong sesang',
  ar: 'Ahlan bialalam',
  hi: 'Namaste duniya',
  ru: 'Privet mir',
};

function CopyButton({ value, t }) {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1500); };
  return (
    <button onClick={copy} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all"
      style={{ background: copied ? 'hsl(var(--primary) / 0.15)' : 'hsl(var(--secondary))', color: copied ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))', border: '1px solid hsl(var(--border) / 0.6)' }}>
      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
      {copied ? (t('generatorCopied') || 'Copied') : (t('generatorCopy') || 'Copy')}
    </button>
  );
}

function ResultRow({ label, value, t }) {
  if (!value) return null;
  return (
    <div className="flex items-start justify-between gap-3 rounded-xl px-4 py-3" style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border) / 0.6)' }}>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>{label}</p>
        <p className="text-sm font-mono text-foreground break-all">{value}</p>
      </div>
      <CopyButton value={value} t={t} />
    </div>
  );
}

function CaseTab({ t }) {
  const [input, setInput] = useState('');
  const [results, setResults] = useState(null);

  const convert = () => {
    if (!input.trim()) return;
    const r = { upper: toUpperCase(input), lower: toLowerCase(input), title: toTitleCase(input), camel: toCamelCase(input), snake: toSnakeCase(input) };
    setResults(r);
    addHistoryEntry({ tool: 'textconverter', input: input.slice(0, 40), result: `UPPER: ${r.upper.slice(0, 30)}…` });
  };

  return (
    <div className="panel p-5 space-y-4">
      <textarea value={input} onChange={e => setInput(e.target.value)} placeholder={t('noteContentPlaceholder') || 'Enter your text here…'} rows={4} className="neu-input resize-none font-mono" />
      <button onClick={convert} className="btn-primary">{t('textConverterConvertAll')}</button>
      {results && (
        <div className="space-y-3">
          <ResultRow label="UPPERCASE" value={results.upper} t={t} />
          <ResultRow label="lowercase" value={results.lower} t={t} />
          <ResultRow label="Title Case" value={results.title} t={t} />
          <ResultRow label="camelCase" value={results.camel} t={t} />
          <ResultRow label="snake_case" value={results.snake} t={t} />
        </div>
      )}
    </div>
  );
}

function NumericTab({ t }) {
  const [n2wInput, setN2wInput] = useState('');
  const [n2wResult, setN2wResult] = useState('');
  const [romanInput, setRomanInput] = useState('');
  const [romanResult, setRomanResult] = useState('');
  const [romanDir, setRomanDir] = useState('toRoman');

  const convertN2W = () => {
    const r = numberToWords(parseFloat(n2wInput));
    setN2wResult(r);
    addHistoryEntry({ tool: 'textconverter', input: n2wInput, result: r });
  };

  const convertRoman = () => {
    const r = romanDir === 'toRoman' ? toRoman(parseInt(romanInput)) : fromRoman(romanInput);
    setRomanResult(r);
    addHistoryEntry({ tool: 'textconverter', input: romanInput, result: r });
  };

  return (
    <div className="space-y-4">
      <div className="panel p-5 space-y-4">
        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'hsl(var(--muted-foreground))' }}>{t('textConverterN2W')}</p>
        <div className="flex gap-3">
          <input value={n2wInput} onChange={e => setN2wInput(e.target.value)} placeholder="e.g. 1542" type="number" className="neu-input flex-1" />
          <button onClick={convertN2W} className="btn-primary w-auto px-4 text-sm" style={{ width: 'auto' }}>{t('textConverterConvert')}</button>
        </div>
        {n2wResult && <ResultRow label={t('textConverterInWords')} value={n2wResult} t={t} />}
      </div>

      <div className="panel p-5 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'hsl(var(--muted-foreground))' }}>{t('textConverterRoman')}</p>
          <button onClick={() => { setRomanDir(d => d === 'toRoman' ? 'fromRoman' : 'toRoman'); setRomanResult(''); }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all"
            style={{ background: 'hsl(var(--secondary))', color: 'hsl(var(--muted-foreground))', border: '1px solid hsl(var(--border))' }}>
            <ArrowLeftRight className="w-3 h-3" />
            {romanDir === 'toRoman' ? t('textConverterNumRoman') : t('textConverterRomanNum')}
          </button>
        </div>
        <div className="flex gap-3">
          <input value={romanInput} onChange={e => setRomanInput(e.target.value)} placeholder={romanDir === 'toRoman' ? 'e.g. 2024' : 'e.g. MMXXIV'} className="neu-input flex-1" />
          <button onClick={convertRoman} className="btn-primary w-auto px-4 text-sm" style={{ width: 'auto' }}>{t('textConverterConvert')}</button>
        </div>
        {romanResult && <ResultRow label={t('textConverterResult')} value={romanResult} t={t} />}
      </div>
    </div>
  );
}

function EncodingTab({ t, lang }) {
  const [morseInput, setMorseInput] = useState('');
  const [morseResult, setMorseResult] = useState('');
  const [morseDir, setMorseDir] = useState('toMorse');
  const [numInput, setNumInput] = useState('');
  const [numResults, setNumResults] = useState(null);
  const [numMode, setNumMode] = useState('from');

  const convertMorse = () => {
    const r = morseDir === 'toMorse' ? toMorse(morseInput) : fromMorse(morseInput);
    setMorseResult(r);
    addHistoryEntry({ tool: 'textconverter', input: morseInput, result: r });
  };

  const convertNum = () => {
    if (!numInput.trim()) return;
    let r;
    if (numMode === 'from') {
      r = { binary: toBinary(numInput), hex: toHex(numInput), octal: toOctal(numInput) };
      addHistoryEntry({ tool: 'textconverter', input: `Decimal ${numInput}`, result: `Bin: ${r.binary} Hex: ${r.hex} Oct: ${r.octal}` });
    } else {
      r = { fromBin: fromBinary(numInput), fromHex: fromHex(numInput), fromOct: fromOctal(numInput) };
      addHistoryEntry({ tool: 'textconverter', input: numInput, result: `Dec: ${r.fromBin}/${r.fromHex}/${r.fromOct}` });
    }
    setNumResults(r);
  };

  return (
    <div className="space-y-4">
      <div className="panel p-5 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'hsl(var(--muted-foreground))' }}>{t('textConverterMorse')}</p>
          <button onClick={() => { setMorseDir(d => d === 'toMorse' ? 'fromMorse' : 'toMorse'); setMorseResult(''); }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold"
            style={{ background: 'hsl(var(--secondary))', color: 'hsl(var(--muted-foreground))', border: '1px solid hsl(var(--border))' }}>
            <ArrowLeftRight className="w-3 h-3" />
            {morseDir === 'toMorse' ? t('textConverterTextMorse') : t('textConverterMorseText')}
          </button>
        </div>
        <textarea value={morseInput} onChange={e => setMorseInput(e.target.value)} rows={3}
          placeholder={morseDir === 'toMorse' ? (MORSE_EXAMPLE[lang] || MORSE_EXAMPLE.en) : toMorse(MORSE_EXAMPLE[lang] || MORSE_EXAMPLE.en)} className="neu-input resize-none font-mono" />
        <button onClick={convertMorse} className="btn-primary">{t('textConverterConvert')}</button>
        {morseResult && <ResultRow label={t('textConverterResult')} value={morseResult} t={t} />}
      </div>

      <div className="panel p-5 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'hsl(var(--muted-foreground))' }}>{t('textConverterBinHexOct')}</p>
          <button onClick={() => { setNumMode(m => m === 'from' ? 'to' : 'from'); setNumResults(null); }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold"
            style={{ background: 'hsl(var(--secondary))', color: 'hsl(var(--muted-foreground))', border: '1px solid hsl(var(--border))' }}>
            <ArrowLeftRight className="w-3 h-3" />
            {numMode === 'from' ? t('textConverterDecimalAll') : t('textConverterAllDecimal')}
          </button>
        </div>
        <div className="flex gap-3">
          <input value={numInput} onChange={e => setNumInput(e.target.value)}
            placeholder={numMode === 'from' ? t('textConverterDecimalPlaceholder') : t('textConverterOtherPlaceholder')} className="neu-input flex-1" />
          <button onClick={convertNum} className="btn-primary w-auto px-4 text-sm" style={{ width: 'auto' }}>{t('textConverterConvert')}</button>
        </div>
        {numResults && numMode === 'from' && (
          <div className="space-y-2">
            <ResultRow label="Binary" value={numResults.binary} t={t} />
            <ResultRow label="Hexadecimal" value={numResults.hex} t={t} />
            <ResultRow label="Octal" value={numResults.octal} t={t} />
          </div>
        )}
        {numResults && numMode === 'to' && (
          <div className="space-y-2">
            <ResultRow label={t('textConverterFromBin')} value={numResults.fromBin} t={t} />
            <ResultRow label={t('textConverterFromHex')} value={numResults.fromHex} t={t} />
            <ResultRow label={t('textConverterFromOct')} value={numResults.fromOct} t={t} />
          </div>
        )}
      </div>
    </div>
  );
}

export default function TextConverter() {
  const { t, lang } = useLanguage();
  const [activeTab, setActiveTab] = useState('case');

  const TABS = [
    { id: 'case', labelKey: 'textConverterTabCase' },
    { id: 'numeric', labelKey: 'textConverterTabNumeric' },
    { id: 'encoding', labelKey: 'textConverterTabEncoding' },
  ];

  return (
    <div className="p-5 max-w-5xl mx-auto w-full">
      <div className="mb-5">
        <h1 className="text-2xl font-semibold text-foreground">{t('textConverterTitle')}</h1>
        <p className="text-sm mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>{t('textConverterSubtitle')}</p>
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
          {activeTab === 'case' && <CaseTab t={t} />}
          {activeTab === 'numeric' && <NumericTab t={t} />}
          {activeTab === 'encoding' && <EncodingTab t={t} lang={lang} />}
        </div>
        <div className="lg:w-64 shrink-0">
          <InlineHistory tool="textconverter" />
        </div>
      </div>
    </div>
  );
}