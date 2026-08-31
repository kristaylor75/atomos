export const FIELD_LABELS = {
  r: 'Radius',
  d: 'Diameter',
  a: 'Side A',
  b: 'Side B / Base',
  c: 'Side C',
  h: 'Height',
  s: 'Side Length',
  l: 'Slant Height',
  r1: 'Outer Radius',
  r2: 'Inner Radius',
};

const PI = Math.PI;

export const SHAPES = {
  circle: {
    label: 'Circle', category: '2D',
    fields: ['r'],
    fieldAlternatives: {
      r: [
        { key: 'r',             label: 'Radius',         from: v => v },
        { key: 'diameter',      label: 'Diameter',       from: v => v / 2 },
        { key: 'area',          label: 'Area',           from: v => Math.sqrt(v / PI) },
        { key: 'circumference', label: 'Circumference',  from: v => v / (2 * PI) },
      ],
    },
    formulas: {
      area:          { label: 'Area',          formula: 'π × r²',     fn: ({ r }) => PI * r * r },
      circumference: { label: 'Circumference', formula: '2 × π × r', fn: ({ r }) => 2 * PI * r },
      diameter:      { label: 'Diameter',      formula: '2 × r',      fn: ({ r }) => 2 * r },
    },
  },
  rectangle: {
    label: 'Rectangle', category: '2D',
    fields: ['a', 'b'],
    formulas: {
      area:      { label: 'Area',      formula: 'a × b',       fn: ({ a, b }) => a * b },
      perimeter: { label: 'Perimeter', formula: '2(a + b)',    fn: ({ a, b }) => 2 * (a + b) },
      diagonal:  { label: 'Diagonal',  formula: '√(a² + b²)', fn: ({ a, b }) => Math.sqrt(a * a + b * b) },
    },
  },
  square: {
    label: 'Square', category: '2D',
    fields: ['s'],
    fieldAlternatives: {
      s: [
        { key: 's',         label: 'Side',      from: v => v },
        { key: 'area',      label: 'Area',      from: v => Math.sqrt(v) },
        { key: 'perimeter', label: 'Perimeter', from: v => v / 4 },
        { key: 'diagonal',  label: 'Diagonal',  from: v => v / Math.sqrt(2) },
      ],
    },
    formulas: {
      area:      { label: 'Area',      formula: 's²',   fn: ({ s }) => s * s },
      perimeter: { label: 'Perimeter', formula: '4 × s', fn: ({ s }) => 4 * s },
      diagonal:  { label: 'Diagonal',  formula: 's√2',  fn: ({ s }) => s * Math.sqrt(2) },
    },
  },
  triangle: {
    label: 'Triangle', category: '2D',
    fields: ['a', 'b', 'h'],
    formulas: {
      area:      { label: 'Area',      formula: '½ × b × h',  fn: ({ b, h }) => 0.5 * b * h },
      perimeter: { label: 'Perimeter', formula: 'a + b + c',  fn: ({ a, b, c }) => a + b + (c || 0) },
    },
  },
  trapezoid: {
    label: 'Trapezoid', category: '2D',
    fields: ['a', 'b', 'h'],
    formulas: {
      area:      { label: 'Area',               formula: '½(a + b) × h', fn: ({ a, b, h }) => 0.5 * (a + b) * h },
      perimeter: { label: 'Perimeter (a+b sides)', formula: 'a + b',     fn: ({ a, b }) => a + b },
    },
  },
  ellipse: {
    label: 'Ellipse', category: '2D',
    fields: ['a', 'b'],
    formulas: {
      area:      { label: 'Area',             formula: 'π × a × b',        fn: ({ a, b }) => PI * a * b },
      perimeter: { label: 'Perimeter (approx)', formula: '2π√((a²+b²)/2)', fn: ({ a, b }) => 2 * PI * Math.sqrt((a * a + b * b) / 2) },
    },
  },
  sphere: {
    label: 'Sphere', category: '3D',
    fields: ['r'],
    fieldAlternatives: {
      r: [
        { key: 'r',           label: 'Radius',       from: v => v },
        { key: 'diameter',    label: 'Diameter',     from: v => v / 2 },
        { key: 'volume',      label: 'Volume',       from: v => Math.cbrt((3 * v) / (4 * PI)) },
        { key: 'surfaceArea', label: 'Surface Area', from: v => Math.sqrt(v / (4 * PI)) },
      ],
    },
    formulas: {
      volume:      { label: 'Volume',       formula: '4/3 × π × r³', fn: ({ r }) => (4 / 3) * PI * r * r * r },
      surfaceArea: { label: 'Surface Area', formula: '4 × π × r²',   fn: ({ r }) => 4 * PI * r * r },
    },
  },
  cube: {
    label: 'Cube', category: '3D',
    fields: ['s'],
    fieldAlternatives: {
      s: [
        { key: 's',           label: 'Side',          from: v => v },
        { key: 'volume',      label: 'Volume',        from: v => Math.cbrt(v) },
        { key: 'surfaceArea', label: 'Surface Area',  from: v => Math.sqrt(v / 6) },
        { key: 'diagonal',    label: 'Space Diagonal', from: v => v / Math.sqrt(3) },
      ],
    },
    formulas: {
      volume:      { label: 'Volume',        formula: 's³',   fn: ({ s }) => s * s * s },
      surfaceArea: { label: 'Surface Area',  formula: '6 × s²', fn: ({ s }) => 6 * s * s },
      diagonal:    { label: 'Space Diagonal', formula: 's√3', fn: ({ s }) => s * Math.sqrt(3) },
    },
  },
  cylinder: {
    label: 'Cylinder', category: '3D',
    fields: ['r', 'h'],
    fieldAlternatives: {
      r: [
        { key: 'r',        label: 'Radius',   from: v => v },
        { key: 'diameter', label: 'Diameter', from: v => v / 2 },
      ],
    },
    formulas: {
      volume:      { label: 'Volume',       formula: 'π × r² × h',   fn: ({ r, h }) => PI * r * r * h },
      surfaceArea: { label: 'Surface Area', formula: '2πr(r + h)', fn: ({ r, h }) => 2 * PI * r * (r + h) },
    },
  },
  cone: {
    label: 'Cone', category: '3D',
    fields: ['r', 'h'],
    fieldAlternatives: {
      r: [
        { key: 'r',        label: 'Radius',   from: v => v },
        { key: 'diameter', label: 'Diameter', from: v => v / 2 },
      ],
    },
    formulas: {
      volume:      { label: 'Volume',       formula: '1/3 × π × r² × h',  fn: ({ r, h }) => (1 / 3) * PI * r * r * h },
      surfaceArea: { label: 'Surface Area', formula: 'πr(r + l)',           fn: ({ r, h }) => PI * r * (r + Math.sqrt(r * r + h * h)) },
      slantHeight: { label: 'Slant Height', formula: '√(r² + h²)',         fn: ({ r, h }) => Math.sqrt(r * r + h * h) },
    },
  },
  rectangularPrism: {
    label: 'Box (Cuboid)', category: '3D',
    fields: ['a', 'b', 'h'],
    formulas: {
      volume:      { label: 'Volume',       formula: 'a × b × h',       fn: ({ a, b, h }) => a * b * h },
      surfaceArea: { label: 'Surface Area', formula: '2(ab + bh + ah)', fn: ({ a, b, h }) => 2 * (a * b + b * h + a * h) },
    },
  },
  pyramid: {
    label: 'Square Pyramid', category: '3D',
    fields: ['s', 'h'],
    fieldAlternatives: {
      s: [
        { key: 's',        label: 'Base Side', from: v => v },
        { key: 'baseArea', label: 'Base Area', from: v => Math.sqrt(v) },
      ],
    },
    formulas: {
      volume:      { label: 'Volume',       formula: '1/3 × s² × h',    fn: ({ s, h }) => (1 / 3) * s * s * h },
      surfaceArea: { label: 'Surface Area', formula: 's² + 2sl',        fn: ({ s, h }) => s * s + 2 * s * Math.sqrt((s / 2) * (s / 2) + h * h) },
    },
  },
};

export function formatGeomResult(value) {
  if (value === null || value === undefined || isNaN(value) || !isFinite(value)) return 'N/A';
  if (Math.abs(value) > 1e10 || (Math.abs(value) < 0.0001 && value !== 0)) {
    return value.toExponential(4);
  }
  return parseFloat(value.toPrecision(8)).toString();
}