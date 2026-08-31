// All available scientific functions the user can add to Quick Access sets
export const ALL_FUNCTIONS = [
  { id: 'sin',   label: 'sin',   value: 'sin(',   type: 'fn',    desc: 'Sine' },
  { id: 'cos',   label: 'cos',   value: 'cos(',   type: 'fn',    desc: 'Cosine' },
  { id: 'tan',   label: 'tan',   value: 'tan(',   type: 'fn',    desc: 'Tangent' },
  { id: 'asin',  label: 'asin',  value: 'asin(',  type: 'fn',    desc: 'Arc Sine' },
  { id: 'acos',  label: 'acos',  value: 'acos(',  type: 'fn',    desc: 'Arc Cosine' },
  { id: 'atan',  label: 'atan',  value: 'atan(',  type: 'fn',    desc: 'Arc Tangent' },
  { id: 'sinh',  label: 'sinh',  value: 'sinh(',  type: 'fn',    desc: 'Hyperbolic Sine' },
  { id: 'cosh',  label: 'cosh',  value: 'cosh(',  type: 'fn',    desc: 'Hyperbolic Cosine' },
  { id: 'tanh',  label: 'tanh',  value: 'tanh(',  type: 'fn',    desc: 'Hyperbolic Tangent' },
  { id: 'sqrt',  label: '√',     value: 'sqrt(',  type: 'fn',    desc: 'Square Root' },
  { id: 'cbrt',  label: '∛',     value: 'cbrt(',  type: 'fn',    desc: 'Cube Root' },
  { id: 'log',   label: 'log',   value: 'log(',   type: 'fn',    desc: 'Logarithm base 10' },
  { id: 'ln',    label: 'ln',    value: 'ln(',    type: 'fn',    desc: 'Natural Log' },
  { id: 'log2',  label: 'log₂',  value: 'log2(',  type: 'fn',    desc: 'Log base 2' },
  { id: 'log10', label: 'log₁₀', value: 'log10(', type: 'fn',    desc: 'Log base 10' },
  { id: 'pow2',  label: 'x²',    value: '^2',     type: 'pow2',  desc: 'Square' },
  { id: 'pow3',  label: 'x³',    value: '^3',     type: 'pow3',  desc: 'Cube' },
  { id: 'fact',  label: 'n!',    value: '!',      type: 'fact',  desc: 'Factorial' },
  { id: 'pi',    label: 'π',     value: 'π',      type: 'const', desc: 'Pi' },
  { id: 'e',     label: 'e',     value: 'e',      type: 'const', desc: "Euler's number" },
  { id: 'pct',   label: '%',     value: '%',      type: 'op',    desc: 'Percent' },
  { id: 'pow',   label: 'xʸ',    value: '^',      type: 'op',    desc: 'Power' },
  { id: 'inv',   label: '1/x',   value: '1/',     type: 'fn1x',  desc: 'Reciprocal' },
  { id: 'nCr',   label: 'nCr',   value: 'nCr(',   type: 'fn',    desc: 'Combinations' },
  { id: 'nPr',   label: 'nPr',   value: 'nPr(',   type: 'fn',    desc: 'Permutations' },
  { id: 'abs',   label: '|x|',   value: 'abs(',   type: 'fn',    desc: 'Absolute Value' },
];

const STORAGE_KEY = 'calc_quick_access_sets';

export function getQuickAccessSets() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch { return []; }
}

export function saveQuickAccessSets(sets) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sets));
  window.dispatchEvent(new Event('quickaccesschange'));
}

export function getActiveSets() {
  return getQuickAccessSets().filter(s => s.active);
}