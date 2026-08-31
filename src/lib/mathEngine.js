export function evaluateExpression(expr) {
  try {
    // Replace display symbols with JS operators
    let processed = expr
      .replace(/×/g, '*')
      .replace(/÷/g, '/')
      .replace(/−/g, '-')
      .replace(/π/g, Math.PI)
      .replace(/e(?![0-9])/g, Math.E)
      .replace(/sqrt\(/g, 'Math.sqrt(')
      .replace(/sin\(/g, 'Math.sin(')
      .replace(/cos\(/g, 'Math.cos(')
      .replace(/tan\(/g, 'Math.tan(')
      .replace(/asin\(/g, 'Math.asin(')
      .replace(/acos\(/g, 'Math.acos(')
      .replace(/atan\(/g, 'Math.atan(')
      .replace(/log\(/g, 'Math.log10(')
      .replace(/ln\(/g, 'Math.log(')
      .replace(/\^/g, '**')
      .replace(/%/g, '/100');

    // eslint-disable-next-line no-new-func
    const result = new Function('Math', `"use strict"; return (${processed})`)(Math);

    if (typeof result !== 'number' || !isFinite(result)) {
      return { result: null, error: 'Invalid result' };
    }

    // Format nicely
    const formatted = parseFloat(result.toPrecision(12)).toString();
    return { result: formatted, error: null };
  } catch {
    return { result: null, error: 'Invalid expression' };
  }
}