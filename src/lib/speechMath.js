// Converts spoken math phrases ("two plus three times four") into calculator symbols.
const REPLACEMENTS = [
  [/\bopen paren(thesis)?\b/g, '('],
  [/\bclose paren(thesis)?\b/g, ')'],
  [/\bsquare root of\b/g, 'sqrt('],
  [/\bplus\b/g, '+'],
  [/\bminus\b/g, '-'],
  [/\bmultiplied by\b/g, '×'],
  [/\btimes\b/g, '×'],
  [/\bdivided by\b/g, '÷'],
  [/\bover\b/g, '÷'],
  [/\bpoint\b/g, '.'],
  [/\bpercent\b/g, '%'],
  [/\bsquared\b/g, '^2'],
  [/\bcubed\b/g, '^3'],
  [/\bequals\b/g, '='],
];

export function parseSpokenMath(text) {
  let out = ` ${text.toLowerCase().trim()} `;
  for (const [pattern, replacement] of REPLACEMENTS) {
    out = out.replace(pattern, replacement);
  }
  return out.replace(/\s+/g, '').trim();
}