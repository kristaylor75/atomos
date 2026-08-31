const KEY = 'omnicall_date_format';

export const DATE_FORMATS = [
  { value: 'dd/MM/yyyy', label: 'DD/MM/YYYY', example: '22/06/2026' },
  { value: 'MM/dd/yyyy', label: 'MM/DD/YYYY', example: '06/22/2026' },
  { value: 'yyyy/MM/dd', label: 'YYYY/MM/DD', example: '2026/06/22' },
];

export function getDateFormat() {
  return localStorage.getItem(KEY) || 'dd/MM/yyyy';
}

export function setDateFormat(fmt) {
  localStorage.setItem(KEY, fmt);
  window.dispatchEvent(new Event('dateformatchange'));
}

const TIME_KEY = 'omnicale_time_fmt';

export function getTimeFormat() {
  return localStorage.getItem(TIME_KEY) || '12h';
}

export function setTimeFormat(fmt) {
  localStorage.setItem(TIME_KEY, fmt);
  window.dispatchEvent(new Event('timeformatchange'));
}