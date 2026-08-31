import { ALL_CURRENCIES } from './currencyPrefs';
import { getCurrencyName } from './currencyNames';

// Static category/unit keys — used for logic, conversion, and as i18n key bases
export const UNIT_CATEGORIES_RAW = {
  length: {
    unitKeys: ['meter','kilometer','centimeter','millimeter','inch','foot','yard','mile','nauticalMile'],
  },
  mass: {
    unitKeys: ['kilogram','gram','milligram','pound','ounce','tonne','stone'],
  },
  temperature: {
    unitKeys: ['celsius','fahrenheit','kelvin'],
  },
  area: {
    unitKeys: ['squareMeter','squareKilometer','squareFoot','squareYard','squareMile','acre','hectare'],
  },
  volume: {
    unitKeys: ['liter','milliliter','cubicMeter','cubicCentimeter','gallon','quart','pint','cup','fluidOunce'],
  },
  time: {
    unitKeys: ['second','minute','hour','day','week','month','year'],
  },
  speed: {
    unitKeys: ['meterPerSecond','kilometerPerHour','milePerHour','knot','footPerSecond'],
  },
  pressure: {
    unitKeys: ['pascal','kilopascal','bar','psi','atmosphere','mmHg'],
  },
  energy: {
    unitKeys: ['joule','kilojoule','calorie','kilocalorie','wattHour','kilowattHour','btu'],
  },
  data: {
    unitKeys: ['bit','byte','kilobyte','megabyte','gigabyte','terabyte','kilobit','megabit'],
  },
  currency: {
    unitKeys: [], // dynamic, driven by currencyPrefs
  },
  angle: {
    unitKeys: ['degree','radian','gradian','turn'],
  },
  fuel: {
    unitKeys: ['mpg','lPer100km','kmPerLiter'],
  },
};

// Conversion factors (toBase) — language-independent
const UNIT_FACTORS = {
  // length (base: meter)
  meter: 1, kilometer: 1000, centimeter: 0.01, millimeter: 0.001,
  inch: 0.0254, foot: 0.3048, yard: 0.9144, mile: 1609.344, nauticalMile: 1852,
  // mass (base: kilogram)
  kilogram: 1, gram: 0.001, milligram: 0.000001, pound: 0.453592, ounce: 0.0283495, tonne: 1000, stone: 6.35029,
  // temperature — special
  celsius: null, fahrenheit: null, kelvin: null,
  // area (base: m²)
  squareMeter: 1, squareKilometer: 1e6, squareFoot: 0.092903, squareYard: 0.836127, squareMile: 2589988, acre: 4046.86, hectare: 10000,
  // volume (base: liter)
  liter: 1, milliliter: 0.001, cubicMeter: 1000, cubicCentimeter: 0.001, gallon: 3.78541, quart: 0.946353, pint: 0.473176, cup: 0.236588, fluidOunce: 0.0295735,
  // time (base: second)
  second: 1, minute: 60, hour: 3600, day: 86400, week: 604800, month: 2629746, year: 31556952,
  // speed (base: m/s)
  meterPerSecond: 1, kilometerPerHour: 0.277778, milePerHour: 0.44704, knot: 0.514444, footPerSecond: 0.3048,
  // pressure (base: pascal)
  pascal: 1, kilopascal: 1000, bar: 100000, psi: 6894.76, atmosphere: 101325, mmHg: 133.322,
  // energy (base: joule)
  joule: 1, kilojoule: 1000, calorie: 4.184, kilocalorie: 4184, wattHour: 3600, kilowattHour: 3600000, btu: 1055.06,
  // data (base: bit)
  bit: 1, byte: 8, kilobyte: 8000, megabyte: 8e6, gigabyte: 8e9, terabyte: 8e12, kilobit: 1000, megabit: 1e6,
  // angle (base: degree)
  degree: 1, radian: 180 / Math.PI, gradian: 0.9, turn: 360,
  // fuel — special
  mpg: 1, lPer100km: null, kmPerLiter: null,
};

/**
 * Build the UNIT_CATEGORIES structure with translated labels.
 * @param {function} t - translation function from useLanguage()
 * @param {object} [currencyUnits] - optional dynamic currency units map (key -> {label})
 */
export function getUnitCategories(t, currencyUnits = {}) {
  const result = {};
  for (const [catKey, cat] of Object.entries(UNIT_CATEGORIES_RAW)) {
    const units = {};
    if (catKey === 'currency') {
      // currency units are passed in dynamically
      for (const [k, v] of Object.entries(currencyUnits)) {
        units[k] = { label: v.label, toBase: 1 };
      }
    } else {
      for (const unitKey of cat.unitKeys) {
        units[unitKey] = {
          label: t(`unit_${unitKey}`),
          toBase: UNIT_FACTORS[unitKey],
        };
      }
    }
    result[catKey] = {
      label: t(`cat_${catKey}`),
      units,
    };
  }
  return result;
}

/**
 * Get a unit's display label in the current language, without needing the full
 * getUnitCategories() build. Used to render history entries in whatever
 * language is currently active (rather than the language they were saved in).
 */
export function getUnitLabel(unitKey, category, t, lang = 'en') {
  if (!unitKey) return '';
  if (category === 'currency') {
    const c = ALL_CURRENCIES[unitKey];
    if (!c) return unitKey;
    const name = getCurrencyName(unitKey, lang, c.label);
    return `${c.flag || ''} ${c.code || unitKey.toUpperCase()} — ${name}`;
  }
  return t(`unit_${unitKey}`);
}

// Keep a static English fallback for non-component contexts (history labels etc.)
export const UNIT_CATEGORIES = {
  length: { label: 'Length', units: { meter:{label:'Meter (m)',toBase:1},kilometer:{label:'Kilometer (km)',toBase:1000},centimeter:{label:'Centimeter (cm)',toBase:0.01},millimeter:{label:'Millimeter (mm)',toBase:0.001},inch:{label:'Inch (in)',toBase:0.0254},foot:{label:'Foot (ft)',toBase:0.3048},yard:{label:'Yard (yd)',toBase:0.9144},mile:{label:'Mile (mi)',toBase:1609.344},nauticalMile:{label:'Nautical Mile',toBase:1852} } },
  mass: { label: 'Mass', units: { kilogram:{label:'Kilogram (kg)',toBase:1},gram:{label:'Gram (g)',toBase:0.001},milligram:{label:'Milligram (mg)',toBase:0.000001},pound:{label:'Pound (lb)',toBase:0.453592},ounce:{label:'Ounce (oz)',toBase:0.0283495},tonne:{label:'Metric Ton (t)',toBase:1000},stone:{label:'Stone (st)',toBase:6.35029} } },
  temperature: { label: 'Temperature', units: { celsius:{label:'Celsius (°C)',toBase:null},fahrenheit:{label:'Fahrenheit (°F)',toBase:null},kelvin:{label:'Kelvin (K)',toBase:null} } },
  area: { label: 'Area', units: { squareMeter:{label:'Square Meter (m²)',toBase:1},squareKilometer:{label:'Square Kilometer (km²)',toBase:1e6},squareFoot:{label:'Square Foot (ft²)',toBase:0.092903},squareYard:{label:'Square Yard (yd²)',toBase:0.836127},squareMile:{label:'Square Mile (mi²)',toBase:2589988},acre:{label:'Acre',toBase:4046.86},hectare:{label:'Hectare (ha)',toBase:10000} } },
  volume: { label: 'Volume', units: { liter:{label:'Liter (L)',toBase:1},milliliter:{label:'Milliliter (mL)',toBase:0.001},cubicMeter:{label:'Cubic Meter (m³)',toBase:1000},cubicCentimeter:{label:'Cubic Centimeter (cc)',toBase:0.001},gallon:{label:'Gallon (US gal)',toBase:3.78541},quart:{label:'Quart (qt)',toBase:0.946353},pint:{label:'Pint (pt)',toBase:0.473176},cup:{label:'Cup',toBase:0.236588},fluidOunce:{label:'Fluid Ounce (fl oz)',toBase:0.0295735} } },
  time: { label: 'Time', units: { second:{label:'Second (s)',toBase:1},minute:{label:'Minute (min)',toBase:60},hour:{label:'Hour (hr)',toBase:3600},day:{label:'Day',toBase:86400},week:{label:'Week',toBase:604800},month:{label:'Month (avg)',toBase:2629746},year:{label:'Year',toBase:31556952} } },
  speed: { label: 'Speed', units: { meterPerSecond:{label:'Meter/Second (m/s)',toBase:1},kilometerPerHour:{label:'Km/Hour (km/h)',toBase:0.277778},milePerHour:{label:'Mile/Hour (mph)',toBase:0.44704},knot:{label:'Knot (kn)',toBase:0.514444},footPerSecond:{label:'Foot/Second (ft/s)',toBase:0.3048} } },
  pressure: { label: 'Pressure', units: { pascal:{label:'Pascal (Pa)',toBase:1},kilopascal:{label:'Kilopascal (kPa)',toBase:1000},bar:{label:'Bar',toBase:100000},psi:{label:'PSI (lb/in²)',toBase:6894.76},atmosphere:{label:'Atmosphere (atm)',toBase:101325},mmHg:{label:'mmHg (Torr)',toBase:133.322} } },
  energy: { label: 'Energy', units: { joule:{label:'Joule (J)',toBase:1},kilojoule:{label:'Kilojoule (kJ)',toBase:1000},calorie:{label:'Calorie (cal)',toBase:4.184},kilocalorie:{label:'Kilocalorie (kcal)',toBase:4184},wattHour:{label:'Watt-Hour (Wh)',toBase:3600},kilowattHour:{label:'Kilowatt-Hour (kWh)',toBase:3600000},btu:{label:'BTU',toBase:1055.06} } },
  data: { label: 'Data', units: { bit:{label:'Bit (b)',toBase:1},byte:{label:'Byte (B)',toBase:8},kilobyte:{label:'Kilobyte (KB)',toBase:8000},megabyte:{label:'Megabyte (MB)',toBase:8e6},gigabyte:{label:'Gigabyte (GB)',toBase:8e9},terabyte:{label:'Terabyte (TB)',toBase:8e12},kilobit:{label:'Kilobit (Kb)',toBase:1000},megabit:{label:'Megabit (Mb)',toBase:1e6} } },
  currency: { label: 'Currency', units: { usd:{label:'US Dollar (USD)',toBase:1},eur:{label:'Euro (EUR)',toBase:1.08},gbp:{label:'British Pound (GBP)',toBase:1.27},jpy:{label:'Japanese Yen (JPY)',toBase:0.0067},cad:{label:'Canadian Dollar (CAD)',toBase:0.74},aud:{label:'Australian Dollar (AUD)',toBase:0.65},chf:{label:'Swiss Franc (CHF)',toBase:1.13},cny:{label:'Chinese Yuan (CNY)',toBase:0.138},inr:{label:'Indian Rupee (INR)',toBase:0.012},mxn:{label:'Mexican Peso (MXN)',toBase:0.058} } },
  angle: { label: 'Angle', units: { degree:{label:'Degree (°)',toBase:1},radian:{label:'Radian (rad)',toBase:180/Math.PI},gradian:{label:'Gradian (grad)',toBase:0.9},turn:{label:'Turn (rev)',toBase:360} } },
  fuel: { label: 'Fuel Economy', units: { mpg:{label:'Miles/Gallon (mpg)',toBase:1},lPer100km:{label:'L/100km',toBase:null},kmPerLiter:{label:'Km/Liter (km/L)',toBase:null} } },
};

function convertTemperature(value, from, to) {
  let celsius;
  if (from === 'celsius') celsius = value;
  else if (from === 'fahrenheit') celsius = (value - 32) * 5 / 9;
  else if (from === 'kelvin') celsius = value - 273.15;
  else return null;
  if (to === 'celsius') return celsius;
  if (to === 'fahrenheit') return celsius * 9 / 5 + 32;
  if (to === 'kelvin') return celsius + 273.15;
  return null;
}

function convertFuel(value, from, to) {
  let mpg;
  if (from === 'mpg') mpg = value;
  else if (from === 'lPer100km') mpg = 235.215 / value;
  else if (from === 'kmPerLiter') mpg = value * 2.35215;
  else return null;
  if (to === 'mpg') return mpg;
  if (to === 'lPer100km') return 235.215 / mpg;
  if (to === 'kmPerLiter') return mpg / 2.35215;
  return null;
}

export function convertUnit(value, from, to, category) {
  if (from === to) return value;
  if (category === 'temperature') return convertTemperature(value, from, to);
  if (category === 'fuel') return convertFuel(value, from, to);
  const factors = UNIT_FACTORS;
  const fromFactor = factors[from];
  const toFactor = factors[to];
  if (fromFactor == null || toFactor == null) return null;
  return (value * fromFactor) / toFactor;
}